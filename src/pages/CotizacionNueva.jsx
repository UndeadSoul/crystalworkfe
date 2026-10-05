import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCotizacion, getOpcionesCotizacion } from "../services/cotizaciones";
import { listClientes, createCliente } from "../services/clientes";
import ClienteForm from "../components/ClienteForm";

const EMPTY_DRAFT = {
  tipo: "",
  color: "",
  vidrio: "",
  ancho_cm: "",
  alto_cm: "",
  cantidad: 1,
};

function CotizacionNueva() {
  const navigate = useNavigate();

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

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getOpcionesCotizacion().then((o) => {
      setOpciones(o);
      setDraft((d) => ({
        ...d,
        tipo: o.tipos_disponibles[0]?.value || "",
        color: o.colores[0]?.value || "",
        vidrio: o.vidrios_disponibles[0]?.value || "",
      }));
    });
    listClientes().then(setClientes);
  }, []);

  // Mapas valor -> etiqueta para el resumen.
  const labels = useMemo(() => {
    const toMap = (arr) => Object.fromEntries(arr.map((o) => [o.value, o.label]));
    return {
      tipo: toMap(opciones.tipos_ventana),
      color: toMap(opciones.colores),
      vidrio: toMap(opciones.vidrios),
    };
  }, [opciones]);

  const changeDraft = (field) => (e) =>
    setDraft((d) => ({ ...d, [field]: e.target.value }));

  const addVentana = () => {
    setError("");
    if (!draft.tipo || !draft.color || !draft.vidrio) {
      setError("Selecciona tipo, color y vidrio de la ventana.");
      return;
    }
    if (!(Number(draft.ancho_cm) > 0) || !(Number(draft.alto_cm) > 0)) {
      setError("Ingresa ancho y alto válidos (mayores a 0).");
      return;
    }
    const cantidad = Math.max(1, parseInt(draft.cantidad, 10) || 1);
    setVentanas((prev) => [...prev, { ...draft, cantidad }]);
    // Mantiene tipo/color/vidrio del anterior; limpia dimensiones.
    setDraft((d) => ({ ...d, ancho_cm: "", alto_cm: "", cantidad: 1 }));
  };

  const removeVentana = (index) =>
    setVentanas((prev) => prev.filter((_, i) => i !== index));

  const handleNuevoCliente = async (data) => {
    const nuevo = await createCliente(data);
    setClientes((prev) =>
      [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre))
    );
    setCliente(String(nuevo.id));
    setClienteModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!cliente) {
      setError("Selecciona un cliente.");
      return;
    }
    if (ventanas.length === 0) {
      setError("Agrega al menos una ventana.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        cliente: Number(cliente),
        direccion_entrega: direccionEntrega,
        requiere_transporte: requiereTransporte,
        distancia_transporte_km: requiereTransporte && distancia ? distancia : null,
        comentarios,
        monto_agregado: montoAgregado ? Number(montoAgregado) : 0,
        ventanas: ventanas.map((v) => ({
          tipo: v.tipo,
          color: v.color,
          vidrio: v.vidrio,
          ancho_cm: v.ancho_cm,
          alto_cm: v.alto_cm,
          cantidad: v.cantidad,
        })),
      };
      const creada = await createCotizacion(payload);
      navigate(`/cotizaciones/${creada.id}`);
    } catch (err) {
      const data = err.response ? err.response.data : null;
      setError(
        data
          ? Object.entries(data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" ") : v}`)
              .join(" · ")
          : "No se pudo guardar la cotización."
      );
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>Nueva cotización</h1>
        <p className="page-sub">Estado inicial: Pendiente de aprobación.</p>
      </header>

      <form onSubmit={handleSubmit}>
        {/* Cliente y entrega */}
        <div className="panel">
          <h2>Cliente y entrega</h2>
          <div className="field-row">
            <label className="field" style={{ flex: 2 }}>
              <span>Cliente *</span>
              <select value={cliente} onChange={(e) => setCliente(e.target.value)}>
                <option value="">— Selecciona —</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
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
              value={direccionEntrega}
              onChange={(e) => setDireccionEntrega(e.target.value)}
            />
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              checked={requiereTransporte}
              onChange={(e) => setRequiereTransporte(e.target.checked)}
            />
            <span>Requiere transporte e instalación</span>
          </label>

          {requiereTransporte && (
            <label className="field" style={{ maxWidth: 240 }}>
              <span>Distancia de transporte (km)</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={distancia}
                onChange={(e) => setDistancia(e.target.value)}
              />
            </label>
          )}
        </div>

        {/* Ventanas */}
        <div className="panel">
          <h2>Ventanas</h2>

          {opciones.vidrios_disponibles.length === 0 && (
            <p className="form-error">
              No hay vidrios configurados. Pídele al jefe que agregue planchas en
              Precios → Vidrios.
            </p>
          )}

          <div className="ventana-draft">
            <label className="field">
              <span>Tipo</span>
              <select value={draft.tipo} onChange={changeDraft("tipo")}>
                {opciones.tipos_disponibles.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Color aluminio</span>
              <select value={draft.color} onChange={changeDraft("color")}>
                {opciones.colores.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Vidrio</span>
              <select value={draft.vidrio} onChange={changeDraft("vidrio")}>
                {opciones.vidrios_disponibles.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field field-sm">
              <span>Ancho (cm)</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={draft.ancho_cm}
                onChange={changeDraft("ancho_cm")}
              />
            </label>
            <label className="field field-sm">
              <span>Alto (cm)</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={draft.alto_cm}
                onChange={changeDraft("alto_cm")}
              />
            </label>
            <label className="field field-sm">
              <span>Cant.</span>
              <input
                type="number"
                min="1"
                step="1"
                value={draft.cantidad}
                onChange={changeDraft("cantidad")}
              />
            </label>
            <div className="field field-btn">
              <button type="button" className="btn btn-primary" onClick={addVentana}>
                Agregar
              </button>
            </div>
          </div>

          {ventanas.length === 0 ? (
            <p className="muted">Aún no has agregado ventanas.</p>
          ) : (
            <table className="table table-inner">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Color</th>
                  <th>Vidrio</th>
                  <th>Medidas (cm)</th>
                  <th>Cant.</th>
                  <th className="col-actions"></th>
                </tr>
              </thead>
              <tbody>
                {ventanas.map((v, i) => (
                  <tr key={i}>
                    <td>{labels.tipo[v.tipo] || v.tipo}</td>
                    <td>{labels.color[v.color] || v.color}</td>
                    <td>{labels.vidrio[v.vidrio] || v.vidrio}</td>
                    <td>
                      {v.ancho_cm} × {v.alto_cm}
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
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Comentarios y monto */}
        <div className="panel">
          <h2>Comentarios y costos</h2>
          <label className="field">
            <span>Comentarios</span>
            <textarea
              rows="3"
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
            />
          </label>
          <label className="field" style={{ maxWidth: 260 }}>
            <span>Monto agregado (CLP)</span>
            <input
              type="number"
              min="0"
              step="1"
              value={montoAgregado}
              onChange={(e) => setMontoAgregado(e.target.value)}
            />
          </label>
          <p className="muted">
            El total se calculará automáticamente cuando se definan los precios de
            materiales y transporte.
          </p>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-footer">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate("/cotizaciones")}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Guardando…" : "Guardar cotización"}
          </button>
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
