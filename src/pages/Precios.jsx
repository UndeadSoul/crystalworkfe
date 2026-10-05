import { useCallback, useEffect, useState } from "react";
import {
  seriesApi,
  perfilSerieApi,
  precioSerieApi,
  perfilIndividualApi,
  precioPerfilIndividualApi,
  planchaApi,
  insumoApi,
  getConfigEmpresa,
  updateConfigEmpresa,
} from "../services/catalogo";
import { getOpcionesCotizacion } from "../services/cotizaciones";
import CrudTable from "../components/CrudTable";
import CatalogModal from "../components/CatalogModal";
import { formatCLP } from "../utils/format";

const TABS = [
  { id: "general", label: "General" },
  { id: "aluminio", label: "Aluminio" },
  { id: "individuales", label: "Perfiles individuales" },
  { id: "vidrios", label: "Vidrios" },
  { id: "insumos", label: "Insumos" },
];

const precioCol = (key) => ({
  key,
  label: "Precio",
  render: (r) => formatCLP(r[key]),
});

// ----------------------------------------------------------------
// General (margen y transporte)
// ----------------------------------------------------------------
function GeneralTab() {
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getConfigEmpresa().then(setForm);
  }, []);

  if (!form) return <p className="muted">Cargando…</p>;

  const change = (name) => (e) =>
    setForm((prev) => ({ ...prev, [name]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      await updateConfigEmpresa({
        margen_ganancia_pct: form.margen_ganancia_pct,
        precio_transporte_km: form.precio_transporte_km,
      });
      setMsg("Guardado.");
    } catch {
      setMsg("No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="panel config-form" onSubmit={save}>
      <h3>Configuración de precios</h3>
      <label className="field">
        <span>Margen de ganancia (%)</span>
        <input
          type="number"
          step="0.01"
          value={form.margen_ganancia_pct}
          onChange={change("margen_ganancia_pct")}
        />
      </label>
      <label className="field">
        <span>Precio por km de transporte (CLP)</span>
        <input
          type="number"
          step="1"
          value={form.precio_transporte_km}
          onChange={change("precio_transporte_km")}
        />
      </label>
      <div className="form-footer">
        {msg && <span className="muted">{msg}</span>}
        <button className="btn btn-primary" disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
      <p className="muted small">
        El precio de venta de cada ventana = costo × (1 + margen). El transporte se
        suma como distancia × precio por km.
      </p>
    </form>
  );
}

// ----------------------------------------------------------------
// Aluminio (series → perfiles + precios por color)
// ----------------------------------------------------------------
function AluminioTab({ colores }) {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    seriesApi
      .list()
      .then(setSeries)
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  if (loading) return <p className="muted">Cargando…</p>;

  return (
    <div>
      <div className="crud-head">
        <h3>Series de aluminio</h3>
      </div>
      <p className="muted small">
        Las series (Línea 20 y 25) son fijas. Edita sus perfiles (peso y largo de
        tira) y los precios por color.
      </p>

      {series.map((s) => (
        <div className="panel serie-card" key={s.id}>
          <div className="serie-head">
            <div>
              <h3>
                {s.nombre} <span className="tag">{s.codigo}</span>
              </h3>
              <p className="muted small">Peso de la serie: {s.peso_serie} kg</p>
            </div>
          </div>

          <CrudTable
            title="Perfiles (peso y largo de tira)"
            singular="perfil"
            canDelete={false}
            rows={s.perfiles}
            columns={[
              { key: "nombre", label: "Nombre" },
              { key: "peso_kg", label: "Peso (kg)" },
              { key: "largo_tira_m", label: "Largo tira (m)" },
            ]}
            fields={[
              { name: "nombre", label: "Nombre (igual a la hoja de corte)", required: true },
              { name: "peso_kg", label: "Peso (kg)", type: "number", step: "0.001", required: true },
              { name: "largo_tira_m", label: "Largo de tira (m)", type: "number", step: "0.001", required: true },
            ]}
            api={perfilSerieApi}
            baseData={{ serie: s.id }}
            onChanged={load}
            addLabel="Agregar perfil"
          />

          <CrudTable
            title="Precios por color (paquete completo)"
            singular="precio"
            rows={s.precios}
            columns={[
              { key: "color_display", label: "Color" },
              precioCol("precio"),
            ]}
            fields={[
              { name: "color", label: "Color", type: "select", options: colores, required: true },
              { name: "precio", label: "Precio del paquete (CLP)", type: "number", step: "1", required: true },
            ]}
            api={precioSerieApi}
            baseData={{ serie: s.id }}
            onChanged={load}
            addLabel="Agregar precio"
          />
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------
// Perfiles individuales (+ precios por color)
// ----------------------------------------------------------------
function IndividualesTab({ colores }) {
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    perfilIndividualApi
      .list()
      .then(setPerfiles)
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const submit = async (form) => {
    if (modal && modal.id) await perfilIndividualApi.update(modal.id, form);
    else await perfilIndividualApi.create(form);
    setModal(null);
    load();
  };

  const del = async (p) => {
    if (!window.confirm(`¿Eliminar ${p.nombre}?`)) return;
    try {
      await perfilIndividualApi.remove(p.id);
      load();
    } catch {
      alert("No se pudo eliminar.");
    }
  };

  if (loading) return <p className="muted">Cargando…</p>;

  return (
    <div>
      <div className="crud-head">
        <h3>Perfiles individuales</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setModal({})}>
          + Nuevo perfil
        </button>
      </div>
      <p className="muted small">
        Perfiles que se cotizan con precio propio (ej: riel inferior de la Línea 25
        simple → código <code>RIEL_INF_SIMPLE</code>).
      </p>

      {perfiles.length === 0 && <p className="muted">Aún no hay perfiles individuales.</p>}

      {perfiles.map((p) => (
        <div className="panel serie-card" key={p.id}>
          <div className="serie-head">
            <div>
              <h3>
                {p.nombre} <span className="tag">{p.codigo}</span>
              </h3>
              <p className="muted small">Largo de tira: {p.largo_tira_m} m</p>
            </div>
            <div className="actions">
              <button className="btn btn-ghost btn-sm" onClick={() => setModal(p)}>
                Editar
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => del(p)}>
                Eliminar
              </button>
            </div>
          </div>

          <CrudTable
            title="Precios por color (por tira)"
            singular="precio"
            rows={p.precios}
            columns={[
              { key: "color_display", label: "Color" },
              precioCol("precio"),
            ]}
            fields={[
              { name: "color", label: "Color", type: "select", options: colores, required: true },
              { name: "precio", label: "Precio de la tira (CLP)", type: "number", step: "1", required: true },
            ]}
            api={precioPerfilIndividualApi}
            baseData={{ perfil: p.id }}
            onChanged={load}
            addLabel="Agregar precio"
          />
        </div>
      ))}

      {modal !== null && (
        <CatalogModal
          title={modal.id ? "Editar perfil" : "Nuevo perfil individual"}
          fields={[
            { name: "codigo", label: "Código (ej: RIEL_INF_SIMPLE)", required: true },
            { name: "nombre", label: "Nombre", required: true },
            { name: "largo_tira_m", label: "Largo de tira (m)", type: "number", step: "0.001", required: true },
          ]}
          initial={modal.id ? modal : null}
          onSubmit={submit}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// Vidrios (planchas)
// ----------------------------------------------------------------
function VidriosTab({ vidrios }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    planchaApi
      .list()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  if (loading) return <p className="muted">Cargando…</p>;

  return (
    <div className="panel">
      <h3>Planchas de vidrio</h3>
      <CrudTable
        singular="plancha"
        rows={rows}
        columns={[
          { key: "tipo_vidrio_display", label: "Tipo" },
          { key: "ancho_plancha_m", label: "Ancho (m)" },
          { key: "alto_plancha_m", label: "Alto (m)" },
          precioCol("precio"),
        ]}
        fields={[
          { name: "tipo_vidrio", label: "Tipo de vidrio", type: "select", options: vidrios, required: true },
          { name: "ancho_plancha_m", label: "Ancho de la plancha (m)", type: "number", step: "0.001", required: true },
          { name: "alto_plancha_m", label: "Alto de la plancha (m)", type: "number", step: "0.001", required: true },
          { name: "precio", label: "Precio de la plancha (CLP)", type: "number", step: "1", required: true },
        ]}
        api={planchaApi}
        onChanged={load}
        addLabel="Agregar plancha"
      />
    </div>
  );
}

// ----------------------------------------------------------------
// Insumos
// ----------------------------------------------------------------
function InsumosTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    insumoApi
      .list()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  if (loading) return <p className="muted">Cargando…</p>;

  return (
    <div className="panel">
      <h3>Insumos y agregados</h3>
      <p className="muted small">
        Lista fija. Edita el precio del paquete y la cantidad que trae. El costo
        usado = precio × cantidad / cantidad del paquete.
      </p>
      <CrudTable
        singular="insumo"
        rows={rows}
        canAdd={false}
        canDelete={false}
        columns={[
          { key: "codigo", label: "Código" },
          { key: "nombre", label: "Nombre" },
          { key: "unidad", label: "Unidad" },
          precioCol("precio_paquete"),
          { key: "cantidad_paquete", label: "Cant. paquete" },
        ]}
        fields={[
          { name: "codigo", label: "Código", readOnly: true },
          { name: "nombre", label: "Nombre", required: true },
          { name: "unidad", label: "Unidad (m, unidad…)" },
          { name: "precio_paquete", label: "Precio del paquete (CLP)", type: "number", step: "1", required: true },
          { name: "cantidad_paquete", label: "Cantidad que trae el paquete", type: "number", step: "0.001", required: true },
        ]}
        api={insumoApi}
        onChanged={load}
      />
    </div>
  );
}

// ----------------------------------------------------------------
function Precios() {
  const [tab, setTab] = useState("general");
  const [opciones, setOpciones] = useState({ colores: [], vidrios: [] });

  useEffect(() => {
    getOpcionesCotizacion().then(setOpciones);
  }, []);

  return (
    <div className="page">
      <header className="page-head">
        <h1>Precios y catálogo</h1>
        <p className="page-sub">
          Gestiona series de aluminio, vidrios, insumos y el margen de ganancia.
        </p>
      </header>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && <GeneralTab />}
      {tab === "aluminio" && <AluminioTab colores={opciones.colores} />}
      {tab === "individuales" && <IndividualesTab colores={opciones.colores} />}
      {tab === "vidrios" && <VidriosTab vidrios={opciones.vidrios} />}
      {tab === "insumos" && <InsumosTab />}
    </div>
  );
}

export default Precios;
