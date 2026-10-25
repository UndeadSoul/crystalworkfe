import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createCotizacion,
  updateCotizacion,
  getCotizacion,
  getOpcionesCotizacion,
} from "../services/cotizaciones";
import { listClientes, createCliente } from "../services/clientes";
import { blockExponentKey, blockNonIntegerKey, formatMedidas } from "../utils/format";
import { esConflicto, parseApiError } from "../utils/errors";
import {
  EJEMPLOS,
  LIMITES,
  PERMITIDOS,
  filtrar,
  soloErrores,
  validarCantidad,
  validarComentario,
  validarDimension,
  validarDireccion,
  validarDistancia,
  validarMontoAgregado,
} from "../utils/validacion";
import ClienteForm from "../components/ClienteForm";
import { FieldError, FormError } from "../components/FormErrors";
import { BotonCarga, Loader } from "../components/Loader";

// Campos del formulario que muestran su propio error (el resto va al general).
const CAMPOS_VISIBLES = [
  "cliente",
  "direccion_entrega",
  "distancia_transporte_km",
  "comentarios",
  "monto_agregado",
  "ventanas",
];

const MIN_MM = LIMITES.dimensionMin;
const MAX_MM = LIMITES.dimensionMax;

const EMPTY_DRAFT = {
  tipo: "",
  color: "",
  vidrio: "",
  ancho_mm: "",
  alto_mm: "",
  cantidad: 1,
};

function CotizacionNueva() {
  const navigate = useNavigate();
  const { id: editId } = useParams();

  const [opciones, setOpciones] = useState({
    tipos_ventana: [],
    colores: [],
    vidrios: [],
    tipos_disponibles: [],
    vidrios_disponibles: [],
  });
  const [clientes, setClientes] = useState([]);
  const [clienteModal, setClienteModal] = useState(false);

  const [cliente, setCliente] = useState("");
  const [direccionEntrega, setDireccionEntrega] = useState("");
  const [requiereTransporte, setRequiereTransporte] = useState(false);
  const [distancia, setDistancia] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [montoAgregado, setMontoAgregado] = useState("");

  const [ventanas, setVentanas] = useState([]);
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  // Aplicar en bloque color/vidrio a todas las ventanas agregadas.
  const [bulkColor, setBulkColor] = useState("");
  const [bulkVidrio, setBulkVidrio] = useState("");

  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [saving, setSaving] = useState(false);
  // Errores por campo: claves del formulario y "ventanas.<i>.<campo>".
  const [errores, setErrores] = useState({});
  const [erroresDraft, setErroresDraft] = useState({});
  const [general, setGeneral] = useState("");
  // Concurrencia (solo edición): versión cargada y conflicto al guardar.
  const [version, setVersion] = useState(null);
  const [estadoActual, setEstadoActual] = useState("PENDIENTE");
  const [conflicto, setConflicto] = useState(false);
  const [recargando, setRecargando] = useState(false);

  // Al escribir se limpia el error del campo, o se reemplaza por el aviso de
  // caracteres no permitidos que se quitaron.
  const limpiarError = (campo, aviso = "") =>
    setErrores((prev) => (prev[campo] || aviso ? { ...prev, [campo]: aviso } : prev));

  // onChange para textos con caracteres restringidos.
  const cambiarTexto = (campo, setter, permitido) => (e) => {
    const { valor, mensaje } = filtrar(e.target.value, permitido);
    setter(valor);
    limpiarError(campo, mensaje);
  };

  // Modo edición: carga los datos de la cotización en el formulario. Guarda su
  // versión: al guardar se envía y, si otro usuario la cambió, la API responde
  // 409 (conflicto) en vez de pisar sus cambios.
  const precargar = (cot) => {
    setVersion(cot.version);
    setEstadoActual(cot.estado);
    setCliente(String(cot.cliente));
    setDireccionEntrega(cot.direccion_entrega || "");
    setRequiereTransporte(cot.requiere_transporte);
    setDistancia(cot.distancia_transporte_km || "");
    setComentarios(cot.comentarios || "");
    setMontoAgregado(cot.monto_agregado ? String(cot.monto_agregado) : "");
    setVentanas(
      cot.ventanas.map((v) => ({
        tipo: v.tipo,
        color: v.color,
        vidrio: v.vidrio,
        ancho_mm: v.ancho_mm,
        alto_mm: v.alto_mm,
        cantidad: v.cantidad,
      }))
    );
  };

  // Tras un conflicto: descarta lo editado y carga la versión actual.
  const recargarVersionActual = async () => {
    setRecargando(true);
    try {
      precargar(await getCotizacion(editId));
      setErrores({});
      setGeneral("");
      setConflicto(false);
    } catch (err) {
      setGeneral(parseApiError(err, { fallback: "No se pudo recargar la cotización." }).general);
    } finally {
      setRecargando(false);
    }
  };

  // Carga inicial: opciones, clientes y (en edición) la cotización.
  useEffect(() => {
    Promise.all([
      getOpcionesCotizacion(),
      listClientes(),
      editId ? getCotizacion(editId) : null,
    ])
      .then(([o, cls, cot]) => {
        setOpciones(o);
        setDraft((d) => ({
          ...d,
          tipo: o.tipos_disponibles[0]?.value || "",
          color: o.colores[0]?.value || "",
          vidrio: o.vidrios_disponibles[0]?.value || "",
        }));
        setBulkColor(o.colores[0]?.value || "");
        setBulkVidrio(o.vidrios_disponibles[0]?.value || "");
        setClientes(cls);
        if (cot) precargar(cot);
      })
      .catch((err) =>
        setErrorCarga(
          parseApiError(err, { fallback: "No se pudo cargar el formulario." }).general
        )
      )
      .finally(() => setCargando(false));
  }, [editId]);

  // Mapas valor -> etiqueta para el resumen.
  const labels = useMemo(() => {
    const toMap = (arr) => Object.fromEntries(arr.map((o) => [o.value, o.label]));
    return {
      tipo: toMap(opciones.tipos_ventana),
      color: toMap(opciones.colores),
      vidrio: toMap(opciones.vidrios),
    };
  }, [opciones]);

  const changeDraft = (field) => (e) => {
    const value = e.target.value;
    setDraft((d) => ({ ...d, [field]: value }));
    setErroresDraft((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
  };

  const limiteVentanas = ventanas.length >= LIMITES.ventanasMax;

  const validarDraft = () =>
    soloErrores({
      tipo: draft.tipo ? "" : "Selecciona el tipo.",
      color: draft.color ? "" : "Selecciona el color.",
      vidrio: draft.vidrio ? "" : "Selecciona el vidrio.",
      ancho_mm: validarDimension(draft.ancho_mm),
      alto_mm: validarDimension(draft.alto_mm),
      cantidad: validarCantidad(draft.cantidad),
    });

  // Los errores de ventanas van por índice: al cambiar la lista se descartan.
  const limpiarErroresVentanas = () =>
    setErrores((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith("ventanas")))
    );

  const addVentana = () => {
    if (limiteVentanas) return;
    const e = validarDraft();
    setErroresDraft(e);
    if (Object.keys(e).length) return;
    const a = parseInt(draft.ancho_mm, 10);
    const h = parseInt(draft.alto_mm, 10);
    const cantidad = parseInt(draft.cantidad, 10);
    setVentanas((prev) => [...prev, { ...draft, ancho_mm: a, alto_mm: h, cantidad }]);
    limpiarErroresVentanas();
    // Mantiene tipo/color/vidrio del anterior; limpia dimensiones.
    setDraft((d) => ({ ...d, ancho_mm: "", alto_mm: "", cantidad: 1 }));
  };

  const removeVentana = (index) => {
    setVentanas((prev) => prev.filter((_, i) => i !== index));
    limpiarErroresVentanas();
  };

  const aplicarColorATodas = () => {
    if (!bulkColor) return;
    setVentanas((prev) => prev.map((v) => ({ ...v, color: bulkColor })));
    limpiarErroresVentanas();
  };
  const aplicarVidrioATodas = () => {
    if (!bulkVidrio) return;
    setVentanas((prev) => prev.map((v) => ({ ...v, vidrio: bulkVidrio })));
    limpiarErroresVentanas();
  };

  // Mensajes de error de la ventana i (devueltos por el backend).
  const errorVentana = (i) =>
    Object.entries(errores)
      .filter(([k, v]) => v && k.startsWith(`ventanas.${i}.`))
      .map(([, v]) => v)
      .join(" ");

  const handleNuevoCliente = async (data) => {
    const nuevo = await createCliente(data);
    setClientes((prev) =>
      [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre))
    );
    setCliente(String(nuevo.id));
    setClienteModal(false);
  };

  const validar = () =>
    soloErrores({
      cliente: cliente ? "" : "Selecciona un cliente.",
      ventanas:
        ventanas.length === 0
          ? "Agrega al menos una ventana."
          : ventanas.length > LIMITES.ventanasMax
            ? `Una cotización admite como máximo ${LIMITES.ventanasMax} ventanas.`
            : "",
      direccion_entrega: validarDireccion(direccionEntrega),
      distancia_transporte_km: validarDistancia(distancia, requiereTransporte),
      comentarios: validarComentario(comentarios),
      monto_agregado: validarMontoAgregado(montoAgregado, comentarios),
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneral("");
    const locales = validar();
    setErrores(locales);
    if (Object.keys(locales).length) {
      setGeneral("Revisa los campos marcados.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        cliente: Number(cliente),
        direccion_entrega: direccionEntrega.trim(),
        requiere_transporte: requiereTransporte,
        distancia_transporte_km: requiereTransporte ? distancia : null,
        comentarios: comentarios.trim(),
        monto_agregado: montoAgregado ? Number(montoAgregado) : 0,
        ventanas: ventanas.map((v) => ({
          tipo: v.tipo,
          color: v.color,
          vidrio: v.vidrio,
          ancho_mm: v.ancho_mm,
          alto_mm: v.alto_mm,
          cantidad: v.cantidad,
        })),
      };
      const guardada = editId
        ? await updateCotizacion(editId, { ...payload, version })
        : await createCotizacion(payload);
      navigate(`/cotizaciones/${guardada.id}`);
    } catch (err) {
      const { general: g, campos } = parseApiError(err, {
        fallback: "No se pudo guardar la cotización.",
        visibles: CAMPOS_VISIBLES,
      });
      setErrores(campos);
      setGeneral(g || "Revisa los campos marcados.");
      // Otro usuario la editó o la resolvió mientras tanto: no se guardó nada.
      if (esConflicto(err)) setConflicto(true);
      setSaving(false);
    }
  };

  const selectDraft = (field, label, options) => (
    <label className="field">
      <span>{label}</span>
      <select
        value={draft[field]}
        aria-invalid={Boolean(erroresDraft[field])}
        onChange={changeDraft(field)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <FieldError msg={erroresDraft[field]} />
    </label>
  );

  const numDraft = (field, label, props) => (
    <label className="field field-sm">
      <span>{label}</span>
      <input
        type="number"
        step="1"
        {...props}
        value={draft[field]}
        aria-invalid={Boolean(erroresDraft[field])}
        onKeyDown={blockNonIntegerKey}
        onChange={changeDraft(field)}
      />
      <FieldError msg={erroresDraft[field]} />
    </label>
  );

  if (cargando) return <Loader pagina />;
  if (errorCarga)
    return (
      <div className="page">
        <FormError msg={errorCarga} />
      </div>
    );

  return (
    <div className="page">
      <header className="page-head">
        <h1>{editId ? `Editar cotización #${editId}` : "Nueva cotización"}</h1>
        <p className="page-sub">
          {editId
            ? "Solo se puede editar mientras está pendiente."
            : "Estado inicial: Pendiente de aprobación."}
        </p>
      </header>

      {editId && estadoActual !== "PENDIENTE" && (
        <FormError msg="Esta cotización ya fue resuelta y no se puede editar." />
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="cotizacion-grid">
        <div className="cotizacion-main">
        {/* Cliente y entrega */}
        <div className="panel">
          <h2>Cliente y entrega</h2>
          <div className="field-row">
            <label className="field" style={{ flex: 2 }}>
              <span>Cliente *</span>
              <select
                value={cliente}
                aria-invalid={Boolean(errores.cliente)}
                onChange={(e) => {
                  setCliente(e.target.value);
                  limpiarError("cliente");
                }}
              >
                <option value="">— Selecciona —</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              <FieldError msg={errores.cliente} />
            </label>
            <div className="field field-btn">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setClienteModal(true)}
              >
                + Nuevo cliente
              </button>
            </div>
          </div>

          <label className="field">
            <span>Dirección de entrega</span>
            <input
              placeholder={EJEMPLOS.direccion}
              value={direccionEntrega}
              maxLength={LIMITES.direccionMax}
              aria-invalid={Boolean(errores.direccion_entrega)}
              onChange={cambiarTexto(
                "direccion_entrega",
                setDireccionEntrega,
                PERMITIDOS.direccion
              )}
            />
            <FieldError msg={errores.direccion_entrega} />
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              checked={requiereTransporte}
              onChange={(e) => {
                setRequiereTransporte(e.target.checked);
                limpiarError("distancia_transporte_km");
              }}
            />
            <span>Requiere transporte e instalación</span>
          </label>

          {requiereTransporte && (
            <label className="field" style={{ maxWidth: 240 }}>
              <span>Distancia de transporte (km) *</span>
              <input
                type="number"
                min={LIMITES.distanciaMin}
                max={LIMITES.distanciaMax}
                step="0.1"
                placeholder={EJEMPLOS.distancia}
                value={distancia}
                aria-invalid={Boolean(errores.distancia_transporte_km)}
                onKeyDown={blockExponentKey}
                onChange={(e) => {
                  setDistancia(e.target.value);
                  limpiarError("distancia_transporte_km");
                }}
              />
              <FieldError msg={errores.distancia_transporte_km} />
            </label>
          )}
        </div>

        {/* Agregar ventana */}
        <div className="panel">
          <h2>Agregar ventana</h2>

          {opciones.vidrios_disponibles.length === 0 && (
            <FormError msg="No hay vidrios configurados. Pídele al jefe que agregue planchas en Precios → Vidrios." />
          )}

          <div className="ventana-draft">
            {selectDraft("tipo", "Tipo", opciones.tipos_disponibles)}
            {selectDraft("color", "Color aluminio", opciones.colores)}
            {selectDraft("vidrio", "Vidrio", opciones.vidrios_disponibles)}
            <div className="dims-row">
              {numDraft("ancho_mm", "Ancho (mm)", { min: MIN_MM, max: MAX_MM, placeholder: EJEMPLOS.ancho })}
              {numDraft("alto_mm", "Alto (mm)", { min: MIN_MM, max: MAX_MM, placeholder: EJEMPLOS.alto })}
              {numDraft("cantidad", "Cant.", {
                placeholder: EJEMPLOS.cantidad,
                min: LIMITES.cantidadMin,
                max: LIMITES.cantidadMax,
              })}
            </div>
            <div className="field field-btn">
              <button
                type="button"
                className="btn btn-primary"
                disabled={limiteVentanas}
                onClick={addVentana}
              >
                Agregar
              </button>
            </div>
          </div>
          {limiteVentanas ? (
            <FieldError
              msg={`Alcanzaste el máximo de ${LIMITES.ventanasMax} ventanas por cotización.`}
            />
          ) : (
            <p className="muted small">
              Dimensiones entre {MIN_MM} y {MAX_MM} mm · cantidad entre{" "}
              {LIMITES.cantidadMin} y {LIMITES.cantidadMax} · hasta{" "}
              {LIMITES.ventanasMax} ventanas.
            </p>
          )}
        </div>

        {/* Comentarios y monto */}
        <div className="panel">
          <h2>Comentarios y costos</h2>
          <p className="muted small">
            Para costos que no corresponden a una ventana: un servicio o producto
            sin formato en el catálogo. Describe el costo en el comentario; aparecerá
            como costo adicional en el detalle de pagos del proyecto.
          </p>
          <label className="field">
            <span>Comentarios</span>
            <textarea
              rows="3"
              maxLength={LIMITES.comentarioMax}
              placeholder={EJEMPLOS.comentarios}
              value={comentarios}
              aria-invalid={Boolean(errores.comentarios)}
              onChange={cambiarTexto("comentarios", setComentarios, PERMITIDOS.comentario)}
            />
            <FieldError msg={errores.comentarios} />
          </label>
          <label className="field" style={{ maxWidth: 260 }}>
            <span>Monto agregado (CLP)</span>
            <input
              type="number"
              min="0"
              max={LIMITES.montoAgregadoMax}
              step="1"
              placeholder={EJEMPLOS.montoAgregado}
              value={montoAgregado}
              // Solo se habilita con un comentario que explique el monto
              // (si ya tiene valor se deja editable para poder borrarlo).
              disabled={!comentarios.trim() && !montoAgregado}
              aria-invalid={Boolean(errores.monto_agregado)}
              onKeyDown={blockNonIntegerKey}
              onChange={(e) => {
                setMontoAgregado(e.target.value);
                limpiarError("monto_agregado");
              }}
            />
            <FieldError msg={errores.monto_agregado} />
            {!errores.monto_agregado && !comentarios.trim() && (
              <small className="muted small">
                Escribe un comentario que explique el monto para habilitarlo.
              </small>
            )}
          </label>
        </div>
        </div>

        {/* Ventanas agregadas (columna derecha) */}
        <aside className="cotizacion-side">
          <div className="panel">
            <h2>Ventanas agregadas ({ventanas.length})</h2>
            <FieldError msg={errores.ventanas} />
            {ventanas.length === 0 ? (
              <p className="muted">Aún no has agregado ventanas.</p>
            ) : (
              <>
              <div className="bulk-apply">
                <div className="bulk-row">
                  <label className="field">
                    <span>Color para todas</span>
                    <select
                      value={bulkColor}
                      onChange={(e) => setBulkColor(e.target.value)}
                    >
                      {opciones.colores.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={aplicarColorATodas}
                  >
                    Aplicar
                  </button>
                </div>
                <div className="bulk-row">
                  <label className="field">
                    <span>Vidrio para todas</span>
                    <select
                      value={bulkVidrio}
                      onChange={(e) => setBulkVidrio(e.target.value)}
                    >
                      {opciones.vidrios_disponibles.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={aplicarVidrioATodas}
                  >
                    Aplicar
                  </button>
                </div>
              </div>
              <div className="table-scroll">
              <table className="table table-inner">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Color</th>
                    <th>Vidrio</th>
                    <th>Medidas</th>
                    <th>Cant.</th>
                    <th className="col-actions"></th>
                  </tr>
                </thead>
                <tbody>
                  {ventanas.map((v, i) => (
                    <Fragment key={i}>
                    <tr>
                      <td>{labels.tipo[v.tipo] || v.tipo}</td>
                      <td>{labels.color[v.color] || v.color}</td>
                      <td>{labels.vidrio[v.vidrio] || v.vidrio}</td>
                      <td>
                        {formatMedidas(v.ancho_mm, v.alto_mm)}
                      </td>
                      <td>{v.cantidad}</td>
                      <td className="col-actions">
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeVentana(i)}
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                    {errorVentana(i) && (
                      <tr className="row-error">
                        <td colSpan={6}>
                          <FieldError msg={`Ventana ${i + 1}: ${errorVentana(i)}`} />
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
              </div>
              </>
            )}
          </div>
        </aside>
        </div>

        <FormError msg={general} />
        {conflicto && (
          <div className="conflicto-acciones">
            <p className="muted small">
              Tus cambios no se guardaron. Puedes cargar la versión actual (se
              descartan tus cambios) o abrir la cotización para ver qué cambió.
            </p>
            <div className="actions">
              <BotonCarga
                className="btn btn-ghost btn-sm"
                cargando={recargando}
                texto="Cargando…"
                onClick={recargarVersionActual}
              >
                Cargar versión actual
              </BotonCarga>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => navigate(`/cotizaciones/${editId}`)}
              >
                Ver cotización
              </button>
            </div>
          </div>
        )}

        <div className="form-footer">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate("/cotizaciones")}
          >
            Cancelar
          </button>
          <BotonCarga
            type="submit"
            cargando={saving}
            disabled={conflicto || estadoActual !== "PENDIENTE"}
            texto="Guardando y calculando…"
          >
            Guardar cotización
          </BotonCarga>
        </div>
      </form>

      {clienteModal && (
        <ClienteForm
          onSubmit={handleNuevoCliente}
          onClose={() => setClienteModal(false)}
        />
      )}
    </div>
  );
}

export default CotizacionNueva;
