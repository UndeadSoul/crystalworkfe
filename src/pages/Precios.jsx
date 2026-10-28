import { useCallback, useEffect, useMemo, useState } from "react";
import {
  seriesApi,
  perfilSerieApi,
  precioSerieApi,
  planchaApi,
  insumoApi,
  getConfigEmpresa,
  updateConfigEmpresa,
  getCambiosPrecios,
} from "../services/catalogo";
import { getOpcionesCotizacion } from "../services/cotizaciones";
import CatalogModal from "../components/CatalogModal";
import CambiosModal from "../components/CambiosModal";
import { FieldError, FormError } from "../components/FormErrors";
import { BotonCarga, Loader } from "../components/Loader";
import { blockExponentKey, blockNonIntegerKey, formatCLP } from "../utils/format";
import { parseApiError } from "../utils/errors";
import {
  aplicarCeldas,
  cambiosPorFila,
  guardarEnBloque,
  opFila,
  valoresCeldas,
} from "../utils/edicionBloque";
import { REGLAS, soloErrores, validarNumero } from "../utils/validacion";

const REVISAR = "Revisa los campos marcados.";

// ----------------------------------------------------------------
// Edición en bloque (compartida por las pestañas). La detección de cambios
// y el guardado por fila con control de versión: utils/edicionBloque.js.
// ----------------------------------------------------------------

/**
 * Estado y acciones de una pestaña con edición en bloque.
 *   cargar():   Promise con los datos (referencia estable).
 *   recorrer:   filas editables (ver utils/edicionBloque.js).
 *   validar(d): errores locales { "<tipo>.<id>.<campo>": msg }.
 *   opsPara(draft, cambios, base): operaciones para las filas modificadas.
 */
function useEdicionBloque({ cargar, recorrer, validar, opsPara, onEditing }) {
  const [base, setBase] = useState(null);
  const [draft, setDraft] = useState(null);
  const [editando, setEditando] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errores, setErrores] = useState({});
  const [general, setGeneral] = useState("");

  const recargar = useCallback(async () => {
    setLoading(true);
    try {
      setBase(await cargar());
    } catch (err) {
      setGeneral(parseApiError(err).general);
    } finally {
      setLoading(false);
    }
  }, [cargar]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const limpiar = () => {
    setErrores({});
    setGeneral("");
  };
  const salir = () => {
    setEditando(false);
    onEditing(false);
  };

  const editar = () => {
    setDraft(structuredClone(base));
    limpiar();
    setEditando(true);
    onEditing(true);
  };

  const cancelar = () => {
    salir();
    limpiar();
    recargar();
  };

  const guardar = async () => {
    const locales = validar(draft);
    setErrores(locales);
    if (Object.keys(locales).length) {
      setGeneral(REVISAR);
      return;
    }
    const cambios = cambiosPorFila(base, draft, recorrer);
    if (!Object.keys(cambios).length) {
      salir();
      limpiar();
      return;
    }

    setSaving(true);
    const r = await guardarEnBloque(opsPara(draft, cambios, base));
    if (!r.general) {
      setSaving(false);
      salir();
      limpiar();
      recargar();
      return;
    }

    // Hubo errores: se cargan los valores vigentes del servidor (con sus
    // versiones nuevas). Lo escrito se conserva solo en las filas rechazadas
    // por validación; en las de conflicto queda el valor del otro usuario.
    try {
      const vigente = await cargar();
      const escrito = valoresCeldas(draft, recorrer);
      const conservar = {};
      r.filasConError.forEach((clave) =>
        (cambios[clave] || []).forEach((c) => {
          conservar[`${clave}.${c}`] = escrito[`${clave}.${c}`];
        })
      );
      setBase(vigente);
      setDraft(aplicarCeldas(vigente, conservar, recorrer));
    } catch {
      // Se mantiene el borrador; los errores ya se muestran.
    }
    setErrores(r.errores);
    setGeneral(r.general);
    setSaving(false);
  };

  return {
    base,
    vista: editando ? draft : base,
    setDraft,
    editando,
    saving,
    loading,
    errores,
    general,
    setGeneral,
    editar,
    cancelar,
    guardar,
    recargar,
  };
}

/** Valida celdas antes de enviar: [[clave, valor, regla]] -> { clave: msg } */
const validarCeldas = (celdas) =>
  soloErrores(
    Object.fromEntries(celdas.map(([clave, valor, regla]) => [clave, validarNumero(valor, regla)]))
  );

const TABS = [
  { id: "general", label: "General" },
  { id: "aluminio", label: "Aluminio" },
  { id: "vidrios", label: "Vidrios" },
  { id: "insumos", label: "Insumos" },
];

// Input numérico compacto para celdas en modo edición (con su error debajo).
// `regla` (de REGLAS) define los decimales y el rango permitidos.
function Num({ value, onChange, regla, error }) {
  const step = regla.decimales ? String(10 ** -regla.decimales) : "1";
  return (
    <div className="cell-field">
      <input
        type="number"
        min="0"
        max={regla.max}
        step={step}
        className="cell-input"
        placeholder={regla.ejemplo}
        value={value ?? ""}
        aria-invalid={Boolean(error)}
        onKeyDown={regla.decimales ? blockExponentKey : blockNonIntegerKey}
        onChange={(e) => onChange(e.target.value)}
      />
      <FieldError msg={error} />
    </div>
  );
}

// Encabezado con botones Editar / Guardar / Cancelar.
function EditBar({ edicion }) {
  if (!edicion.editando) {
    return (
      <button className="btn btn-primary btn-sm" onClick={edicion.editar}>
        Editar
      </button>
    );
  }
  return (
    <div className="actions">
      <button
        className="btn btn-ghost btn-sm"
        onClick={edicion.cancelar}
        disabled={edicion.saving}
      >
        Cancelar
      </button>
      <BotonCarga
        className="btn btn-primary btn-sm"
        cargando={edicion.saving}
        onClick={edicion.guardar}
      >
        Guardar
      </BotonCarga>
    </div>
  );
}

/** Mientras carga (o si no se pudo cargar) en lugar del contenido. */
function EstadoCarga({ edicion }) {
  return edicion.general ? <FormError msg={edicion.general} /> : <Loader />;
}

// Actualiza un campo de una fila del borrador (copia profunda).
const editarFila = (setDraft, ubicar) => (valor) =>
  setDraft((d) => {
    const n = structuredClone(d);
    ubicar(n)(valor);
    return n;
  });

// ----------------------------------------------------------------
// General (margen y transporte)
// ----------------------------------------------------------------
const CAMPOS_CONFIG = ["margen_ganancia_pct", "precio_transporte_km"];
const recorrerConfig = (d, fn) => fn("config", d, CAMPOS_CONFIG);

function GeneralTab({ onEditing }) {
  const e = useEdicionBloque({
    cargar: getConfigEmpresa,
    recorrer: recorrerConfig,
    validar: (d) =>
      validarCeldas([
        [`config.${d.id}.margen_ganancia_pct`, d.margen_ganancia_pct, REGLAS.margen],
        [`config.${d.id}.precio_transporte_km`, d.precio_transporte_km, REGLAS.transporteKm],
      ]),
    opsPara: (d, cambios) =>
      cambios[`config.${d.id}`]
        ? [
            opFila("config", d, CAMPOS_CONFIG, cambios, () =>
              updateConfigEmpresa({
                margen_ganancia_pct: d.margen_ganancia_pct,
                precio_transporte_km: d.precio_transporte_km,
                version: d.version,
              })
            ),
          ]
        : [],
    onEditing,
  });

  if (e.loading || !e.base) return <EstadoCarga edicion={e} />;
  const v = e.vista;
  const set = (campo) => editarFila(e.setDraft, (d) => (valor) => (d[campo] = valor));

  return (
    <div className="panel config-form">
      <div className="crud-head">
        <h3>Configuración de precios</h3>
        <EditBar edicion={e} />
      </div>

      <label className="field">
        <span>Margen de ganancia (%)</span>
        {e.editando ? (
          <Num
            regla={REGLAS.margen}
            value={v.margen_ganancia_pct}
            error={e.errores[`config.${v.id}.margen_ganancia_pct`]}
            onChange={set("margen_ganancia_pct")}
          />
        ) : (
          <div className="valor-ro">{v.margen_ganancia_pct} %</div>
        )}
      </label>
      <label className="field">
        <span>Precio por km de transporte (CLP)</span>
        {e.editando ? (
          <Num
            regla={REGLAS.transporteKm}
            value={v.precio_transporte_km}
            error={e.errores[`config.${v.id}.precio_transporte_km`]}
            onChange={set("precio_transporte_km")}
          />
        ) : (
          <div className="valor-ro">{formatCLP(v.precio_transporte_km)}</div>
        )}
      </label>
      <FormError msg={e.general} />
      <p className="muted small">
        Precio de venta = costo × (1 + margen). Transporte = distancia × precio por km.
      </p>
    </div>
  );
}

// ----------------------------------------------------------------
// Aluminio (series: peso total + perfiles + precios por color)
// ----------------------------------------------------------------
const CAMPOS_SERIE = ["peso_total_kg"];
const CAMPOS_PERFIL = ["peso_kg", "largo_tira_m"];
const CAMPOS_PRECIO = ["precio"];

const recorrerAluminio = (series, fn) =>
  series.forEach((s) => {
    fn("serie", s, CAMPOS_SERIE);
    s.perfiles.forEach((p) => fn("perfil", p, CAMPOS_PERFIL));
    s.precios.forEach((pr) => fn("precio", pr, CAMPOS_PRECIO));
  });

function validarAluminio(series) {
  const celdas = [];
  const cruzados = {};
  for (const s of series) {
    celdas.push([`serie.${s.id}.peso_total_kg`, s.peso_total_kg, REGLAS.pesoSerie]);
    const total = Number(s.peso_total_kg);
    for (const p of s.perfiles) {
      celdas.push([`perfil.${p.id}.peso_kg`, p.peso_kg, REGLAS.pesoPerfil]);
      celdas.push([`perfil.${p.id}.largo_tira_m`, p.largo_tira_m, REGLAS.largoTira]);
      // Un perfil no puede pesar más que el paquete (0 = sin configurar).
      if (total > 0 && Number(p.peso_kg) > total)
        cruzados[`perfil.${p.id}.peso_kg`] =
          `No puede superar el peso total de la serie (${s.peso_total_kg} kg).`;
    }
    for (const pr of s.precios) {
      celdas.push([`precio.${pr.id}.precio`, pr.precio, REGLAS.precio]);
    }
  }
  return { ...cruzados, ...validarCeldas(celdas) };
}

function opsAluminio(series, cambios, base) {
  // El backend exige perfil <= peso total de la serie: si el total baja se
  // guardan primero los perfiles; si sube, primero la serie.
  const totalOriginal = Object.fromEntries(base.map((s) => [s.id, Number(s.peso_total_kg)]));
  const ops = [];
  for (const s of series) {
    const baja = Number(s.peso_total_kg) < totalOriginal[s.id];
    if (cambios[`serie.${s.id}`])
      ops.push(
        opFila(
          "serie",
          s,
          CAMPOS_SERIE,
          cambios,
          () => seriesApi.update(s.id, { peso_total_kg: s.peso_total_kg, version: s.version }),
          baja ? 1 : 0
        )
      );
    for (const p of s.perfiles) {
      if (!cambios[`perfil.${p.id}`]) continue;
      ops.push(
        opFila(
          "perfil",
          p,
          CAMPOS_PERFIL,
          cambios,
          () =>
            perfilSerieApi.update(p.id, {
              serie: s.id,
              nombre: p.nombre,
              peso_kg: p.peso_kg,
              largo_tira_m: p.largo_tira_m,
              version: p.version,
            }),
          baja ? 0 : 1
        )
      );
    }
    for (const pr of s.precios) {
      if (!cambios[`precio.${pr.id}`]) continue;
      ops.push(
        opFila("precio", pr, CAMPOS_PRECIO, cambios, () =>
          precioSerieApi.update(pr.id, {
            serie: s.id,
            color: pr.color,
            precio: pr.precio,
            version: pr.version,
          })
        )
      );
    }
  }
  return ops;
}

function AluminioTab({ onEditing }) {
  const e = useEdicionBloque({
    cargar: seriesApi.list,
    recorrer: recorrerAluminio,
    validar: validarAluminio,
    opsPara: opsAluminio,
    onEditing,
  });

  if (e.loading || !e.base) return <EstadoCarga edicion={e} />;
  const { editando, errores } = e;

  const setPeso = (si) => editarFila(e.setDraft, (d) => (v) => (d[si].peso_total_kg = v));
  const setPerfil = (si, pi, campo) =>
    editarFila(e.setDraft, (d) => (v) => (d[si].perfiles[pi][campo] = v));
  const setPrecio = (si, pri) =>
    editarFila(e.setDraft, (d) => (v) => (d[si].precios[pri].precio = v));

  return (
    <div>
      <div className="crud-head">
        <h3>Series de aluminio</h3>
        <EditBar edicion={e} />
      </div>
      <FormError msg={e.general} />

      {e.vista.map((s, si) => (
        <div className="panel serie-card" key={s.id}>
          <div className="serie-head">
            <h3>
              {s.nombre} <span className="tag">{s.codigo}</span>
            </h3>
          </div>

          <label className="field" style={{ maxWidth: 260 }}>
            <span>Peso total de la serie (kg)</span>
            {editando ? (
              <Num
                regla={REGLAS.pesoSerie}
                value={s.peso_total_kg}
                error={errores[`serie.${s.id}.peso_total_kg`]}
                onChange={setPeso(si)}
              />
            ) : (
              <div className="valor-ro">{s.peso_total_kg} kg</div>
            )}
          </label>

          <h4 className="sub">Perfiles (peso y largo de tira)</h4>
          <div className="table-scroll">
          <table className="table table-compact">
            <thead>
              <tr>
                <th>Perfil</th>
                <th>Peso (kg)</th>
                <th>Largo tira (m)</th>
              </tr>
            </thead>
            <tbody>
              {s.perfiles.map((p, pi) => (
                <tr key={p.id}>
                  <td>{p.nombre}</td>
                  <td>
                    {editando ? (
                      <Num
                        regla={REGLAS.pesoPerfil}
                        value={p.peso_kg}
                        error={errores[`perfil.${p.id}.peso_kg`]}
                        onChange={setPerfil(si, pi, "peso_kg")}
                      />
                    ) : (
                      p.peso_kg
                    )}
                  </td>
                  <td>
                    {editando ? (
                      <Num
                        regla={REGLAS.largoTira}
                        value={p.largo_tira_m}
                        error={errores[`perfil.${p.id}.largo_tira_m`]}
                        onChange={setPerfil(si, pi, "largo_tira_m")}
                      />
                    ) : (
                      p.largo_tira_m
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          <h4 className="sub">Precios por color (paquete)</h4>
          <div className="table-scroll">
          <table className="table table-compact">
            <thead>
              <tr>
                <th>Color</th>
                <th>Precio</th>
              </tr>
            </thead>
            <tbody>
              {s.precios.map((pr, pri) => (
                <tr key={pr.id}>
                  <td>{pr.color_display}</td>
                  <td>
                    {editando ? (
                      <Num
                        regla={REGLAS.precio}
                        value={pr.precio}
                        error={errores[`precio.${pr.id}.precio`]}
                        onChange={setPrecio(si, pri)}
                      />
                    ) : (
                      formatCLP(pr.precio)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------
// Vidrios (planchas): edición en bloque + agregar/eliminar
// ----------------------------------------------------------------
const CAMPOS_PLANCHA = ["ancho_plancha_m", "alto_plancha_m", "precio"];
const recorrerPlanchas = (rows, fn) => rows.forEach((p) => fn("plancha", p, CAMPOS_PLANCHA));

function VidriosTab({ vidrios, onEditing }) {
  const [modal, setModal] = useState(false);
  const [eliminando, setEliminando] = useState(null); // id de la plancha
  const e = useEdicionBloque({
    cargar: planchaApi.list,
    recorrer: recorrerPlanchas,
    validar: (rows) =>
      validarCeldas(
        rows.flatMap((p) => [
          [`plancha.${p.id}.ancho_plancha_m`, p.ancho_plancha_m, REGLAS.plancha],
          [`plancha.${p.id}.alto_plancha_m`, p.alto_plancha_m, REGLAS.plancha],
          [`plancha.${p.id}.precio`, p.precio, REGLAS.precio],
        ])
      ),
    opsPara: (rows, cambios) =>
      rows
        .filter((p) => cambios[`plancha.${p.id}`])
        .map((p) =>
          opFila("plancha", p, CAMPOS_PLANCHA, cambios, () =>
            planchaApi.update(p.id, {
              tipo_vidrio: p.tipo_vidrio,
              ancho_plancha_m: p.ancho_plancha_m,
              alto_plancha_m: p.alto_plancha_m,
              precio: p.precio,
              version: p.version,
            })
          )
        ),
    onEditing,
  });

  if (e.loading || !e.base) return <EstadoCarga edicion={e} />;
  const { editando, errores } = e;

  const agregar = async (form) => {
    await planchaApi.create(form);
    setModal(false);
    e.recargar();
  };
  const eliminar = async (p) => {
    if (!window.confirm("¿Eliminar esta plancha?")) return;
    e.setGeneral("");
    setEliminando(p.id);
    try {
      await planchaApi.remove(p.id);
      e.recargar();
    } catch (err) {
      e.setGeneral(parseApiError(err, { fallback: "No se pudo eliminar la plancha." }).general);
    } finally {
      setEliminando(null);
    }
  };

  const set = (i, campo) => editarFila(e.setDraft, (d) => (v) => (d[i][campo] = v));

  return (
    <div className="panel">
      <div className="crud-head">
        <h3>Planchas de vidrio</h3>
        <div className="actions">
          {!editando && (
            <button className="btn btn-ghost btn-sm" onClick={() => setModal(true)}>
              + Agregar plancha
            </button>
          )}
          <EditBar edicion={e} />
        </div>
      </div>
      <FormError msg={e.general} />

      <div className="table-scroll">
      <table className="table table-compact">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Ancho (m)</th>
            <th>Alto (m)</th>
            <th>Precio</th>
            {!editando && <th className="col-actions"></th>}
          </tr>
        </thead>
        <tbody>
          {e.vista.map((p, i) => (
            <tr key={p.id}>
              <td>{p.tipo_vidrio_display}</td>
              <td>
                {editando ? (
                  <Num
                    regla={REGLAS.plancha}
                    value={p.ancho_plancha_m}
                    error={errores[`plancha.${p.id}.ancho_plancha_m`]}
                    onChange={set(i, "ancho_plancha_m")}
                  />
                ) : (
                  p.ancho_plancha_m
                )}
              </td>
              <td>
                {editando ? (
                  <Num
                    regla={REGLAS.plancha}
                    value={p.alto_plancha_m}
                    error={errores[`plancha.${p.id}.alto_plancha_m`]}
                    onChange={set(i, "alto_plancha_m")}
                  />
                ) : (
                  p.alto_plancha_m
                )}
              </td>
              <td>
                {editando ? (
                  <Num
                    regla={REGLAS.precio}
                    value={p.precio}
                    error={errores[`plancha.${p.id}.precio`]}
                    onChange={set(i, "precio")}
                  />
                ) : (
                  formatCLP(p.precio)
                )}
              </td>
              {!editando && (
                <td className="col-actions">
                  <BotonCarga
                    className="btn btn-danger btn-sm"
                    cargando={eliminando === p.id}
                    disabled={eliminando !== null}
                    texto="Eliminando…"
                    onClick={() => eliminar(p)}
                  >
                    Eliminar
                  </BotonCarga>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {modal && (
        <CatalogModal
          title="Nueva plancha"
          fields={[
            { name: "tipo_vidrio", label: "Tipo de vidrio", type: "select", options: vidrios, required: true },
            { name: "ancho_plancha_m", label: "Ancho (m)", type: "number", regla: REGLAS.plancha, required: true },
            { name: "alto_plancha_m", label: "Alto (m)", type: "number", regla: REGLAS.plancha, required: true },
            { name: "precio", label: "Precio (CLP)", type: "number", regla: REGLAS.precio, required: true },
          ]}
          onSubmit={agregar}
          onClose={() => setModal(false)}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// Insumos: edición en bloque (lista fija)
// ----------------------------------------------------------------
const CAMPOS_INSUMO = ["precio_paquete", "cantidad_paquete"];
const recorrerInsumos = (rows, fn) => rows.forEach((x) => fn("insumo", x, CAMPOS_INSUMO));

function InsumosTab({ onEditing }) {
  const e = useEdicionBloque({
    cargar: insumoApi.list,
    recorrer: recorrerInsumos,
    validar: (rows) =>
      validarCeldas(
        rows.flatMap((x) => [
          [`insumo.${x.id}.precio_paquete`, x.precio_paquete, REGLAS.precio],
          [`insumo.${x.id}.cantidad_paquete`, x.cantidad_paquete, REGLAS.cantidadPaquete],
        ])
      ),
    opsPara: (rows, cambios) =>
      rows
        .filter((x) => cambios[`insumo.${x.id}`])
        .map((x) =>
          opFila("insumo", x, CAMPOS_INSUMO, cambios, () =>
            insumoApi.update(x.id, {
              codigo: x.codigo,
              nombre: x.nombre,
              unidad: x.unidad,
              precio_paquete: x.precio_paquete,
              cantidad_paquete: x.cantidad_paquete,
              version: x.version,
            })
          )
        ),
    onEditing,
  });

  if (e.loading || !e.base) return <EstadoCarga edicion={e} />;
  const { editando, errores } = e;
  const set = (i, campo) => editarFila(e.setDraft, (d) => (v) => (d[i][campo] = v));

  return (
    <div className="panel">
      <div className="crud-head">
        <h3>Insumos y agregados</h3>
        <EditBar edicion={e} />
      </div>
      <FormError msg={e.general} />
      <p className="muted small">
        Costo usado = precio × cantidad / cantidad del paquete.
      </p>
      <div className="table-scroll">
      <table className="table table-compact">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Unidad</th>
            <th>Precio paquete</th>
            <th>Cant. paquete</th>
          </tr>
        </thead>
        <tbody>
          {e.vista.map((x, i) => (
            <tr key={x.id}>
              <td>{x.codigo}</td>
              <td>{x.nombre}</td>
              <td>{x.unidad}</td>
              <td>
                {editando ? (
                  <Num
                    regla={REGLAS.precio}
                    value={x.precio_paquete}
                    error={errores[`insumo.${x.id}.precio_paquete`]}
                    onChange={set(i, "precio_paquete")}
                  />
                ) : (
                  formatCLP(x.precio_paquete)
                )}
              </td>
              <td>
                {editando ? (
                  <Num
                    regla={REGLAS.cantidadPaquete}
                    value={x.cantidad_paquete}
                    error={errores[`insumo.${x.id}.cantidad_paquete`]}
                    onChange={set(i, "cantidad_paquete")}
                  />
                ) : (
                  x.cantidad_paquete
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
function Precios() {
  const [tab, setTab] = useState("general");
  const [opciones, setOpciones] = useState({ colores: [], vidrios: [] });
  const [editingTabs, setEditingTabs] = useState({});
  const [cambiosOpen, setCambiosOpen] = useState(false);

  const dirty = Object.values(editingTabs).some(Boolean);

  useEffect(() => {
    getOpcionesCotizacion().then(setOpciones);
  }, []);

  // Confirmación al cerrar/recargar la pestaña del navegador con cambios.
  useEffect(() => {
    const handler = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Callbacks estables por tab: evita que cada render cree una función nueva
  // (que dispararía el useEffect de cada tab en bucle). El updater además
  // hace bail-out si el valor no cambió, para no re-renderizar de más.
  const onEditingByTab = useMemo(() => {
    const make = (id) => (v) =>
      setEditingTabs((prev) => (prev[id] === v ? prev : { ...prev, [id]: v }));
    return Object.fromEntries(TABS.map((t) => [t.id, make(t.id)]));
  }, []);

  const cambiarTab = (id) => {
    if (dirty && !window.confirm("Tienes cambios sin guardar. ¿Cambiar de sección sin guardar?"))
      return;
    setEditingTabs({});
    setTab(id);
  };

  return (
    <div className="page">
      <header className="page-head page-head-row">
        <div>
          <h1>Precios y catálogo</h1>
          <p className="page-sub">
            Pulsa <strong>Editar</strong> en cada sección para modificar todos sus
            valores a la vez.
          </p>
        </div>
        <div className="actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setCambiosOpen(true)}
          >
            Control de cambios
          </button>
        </div>
      </header>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? "active" : ""}`}
            onClick={() => cambiarTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && <GeneralTab onEditing={onEditingByTab.general} />}
      {tab === "aluminio" && <AluminioTab onEditing={onEditingByTab.aluminio} />}
      {tab === "vidrios" && (
        <VidriosTab vidrios={opciones.vidrios} onEditing={onEditingByTab.vidrios} />
      )}
      {tab === "insumos" && <InsumosTab onEditing={onEditingByTab.insumos} />}

      {cambiosOpen && (
        <CambiosModal
          title="Control de cambios · Precios"
          cargar={getCambiosPrecios}
          onClose={() => setCambiosOpen(false)}
        />
      )}
    </div>
  );
}

export default Precios;
