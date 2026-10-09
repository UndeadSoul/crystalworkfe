import { useCallback, useEffect, useMemo, useState } from "react";
import {
  seriesApi,
  perfilSerieApi,
  precioSerieApi,
  planchaApi,
  insumoApi,
  getConfigEmpresa,
  updateConfigEmpresa,
} from "../services/catalogo";
import { getOpcionesCotizacion } from "../services/cotizaciones";
import CatalogModal from "../components/CatalogModal";
import { blockExponentKey, formatCLP } from "../utils/format";

const TABS = [
  { id: "general", label: "General" },
  { id: "aluminio", label: "Aluminio" },
  { id: "vidrios", label: "Vidrios" },
  { id: "insumos", label: "Insumos" },
];

// Input numérico compacto para celdas en modo edición.
function Num({ value, onChange, step = "1" }) {
  return (
    <input
      type="number"
      step={step}
      className="cell-input"
      value={value ?? ""}
      onKeyDown={blockExponentKey}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// Encabezado con botones Editar / Guardar / Cancelar.
function EditBar({ editando, saving, onEditar, onGuardar, onCancelar }) {
  if (!editando) {
    return (
      <button className="btn btn-primary btn-sm" onClick={onEditar}>
        Editar
      </button>
    );
  }
  return (
    <div className="actions">
      <button className="btn btn-ghost btn-sm" onClick={onCancelar} disabled={saving}>
        Cancelar
      </button>
      <button className="btn btn-primary btn-sm" onClick={onGuardar} disabled={saving}>
        {saving ? "Guardando…" : "Guardar"}
      </button>
    </div>
  );
}

// ----------------------------------------------------------------
// General (margen y transporte)
// ----------------------------------------------------------------
function GeneralTab({ onEditing }) {
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState(null);
  const [editando, setEditando] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => getConfigEmpresa().then(setData), []);
  useEffect(() => {
    load();
  }, [load]);

  if (!data) return <p className="muted">Cargando…</p>;

  const editar = () => {
    setDraft({ ...data });
    setEditando(true);
    onEditing(true);
  };
  const cancelar = () => {
    setEditando(false);
    setDraft(null);
    onEditing(false);
  };
  const guardar = async () => {
    setSaving(true);
    try {
      const d = await updateConfigEmpresa({
        margen_ganancia_pct: draft.margen_ganancia_pct,
        precio_transporte_km: draft.precio_transporte_km,
      });
      setData(d);
      setEditando(false);
      onEditing(false);
    } catch {
      alert("No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const vista = editando ? draft : data;

  return (
    <div className="panel config-form">
      <div className="crud-head">
        <h3>Configuración de precios</h3>
        <EditBar
          editando={editando}
          saving={saving}
          onEditar={editar}
          onGuardar={guardar}
          onCancelar={cancelar}
        />
      </div>

      <label className="field">
        <span>Margen de ganancia (%)</span>
        {editando ? (
          <Num
            step="0.01"
            value={vista.margen_ganancia_pct}
            onChange={(v) => setDraft((d) => ({ ...d, margen_ganancia_pct: v }))}
          />
        ) : (
          <div className="valor-ro">{vista.margen_ganancia_pct} %</div>
        )}
      </label>
      <label className="field">
        <span>Precio por km de transporte (CLP)</span>
        {editando ? (
          <Num
            value={vista.precio_transporte_km}
            onChange={(v) => setDraft((d) => ({ ...d, precio_transporte_km: v }))}
          />
        ) : (
          <div className="valor-ro">{formatCLP(vista.precio_transporte_km)}</div>
        )}
      </label>
      <p className="muted small">
        Precio de venta = costo × (1 + margen). Transporte = distancia × precio por km.
      </p>
    </div>
  );
}

// ----------------------------------------------------------------
// Aluminio (series: peso total + perfiles + precios por color)
// ----------------------------------------------------------------
function AluminioTab({ onEditing }) {
  const [series, setSeries] = useState([]);
  const [draft, setDraft] = useState([]);
  const [editando, setEditando] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    seriesApi
      .list()
      .then(setSeries)
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="muted">Cargando…</p>;

  const editar = () => {
    setDraft(structuredClone(series));
    setEditando(true);
    onEditing(true);
  };
  const cancelar = () => {
    setEditando(false);
    onEditing(false);
    load();
  };
  const guardar = async () => {
    setSaving(true);
    try {
      const ops = [];
      for (const s of draft) {
        ops.push(seriesApi.update(s.id, { peso_total_kg: s.peso_total_kg }));
        for (const p of s.perfiles) {
          ops.push(
            perfilSerieApi.update(p.id, {
              serie: s.id,
              nombre: p.nombre,
              peso_kg: p.peso_kg,
              largo_tira_m: p.largo_tira_m,
            })
          );
        }
        for (const pr of s.precios) {
          ops.push(
            precioSerieApi.update(pr.id, {
              serie: s.id,
              color: pr.color,
              precio: pr.precio,
            })
          );
        }
      }
      await Promise.all(ops);
      setEditando(false);
      onEditing(false);
      load();
    } catch {
      alert("No se pudieron guardar todos los cambios.");
    } finally {
      setSaving(false);
    }
  };

  const vista = editando ? draft : series;

  const setPerfil = (si, pi, campo, valor) =>
    setDraft((d) => {
      const n = structuredClone(d);
      n[si].perfiles[pi][campo] = valor;
      return n;
    });
  const setPrecio = (si, pri, valor) =>
    setDraft((d) => {
      const n = structuredClone(d);
      n[si].precios[pri].precio = valor;
      return n;
    });
  const setPeso = (si, valor) =>
    setDraft((d) => {
      const n = structuredClone(d);
      n[si].peso_total_kg = valor;
      return n;
    });

  return (
    <div>
      <div className="crud-head">
        <h3>Series de aluminio</h3>
        <EditBar
          editando={editando}
          saving={saving}
          onEditar={editar}
          onGuardar={guardar}
          onCancelar={cancelar}
        />
      </div>

      {vista.map((s, si) => (
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
                step="0.001"
                value={s.peso_total_kg}
                onChange={(v) => setPeso(si, v)}
              />
            ) : (
              <div className="valor-ro">{s.peso_total_kg} kg</div>
            )}
          </label>

          <h4 className="sub">Perfiles (peso y largo de tira)</h4>
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
                        step="0.001"
                        value={p.peso_kg}
                        onChange={(v) => setPerfil(si, pi, "peso_kg", v)}
                      />
                    ) : (
                      p.peso_kg
                    )}
                  </td>
                  <td>
                    {editando ? (
                      <Num
                        step="0.001"
                        value={p.largo_tira_m}
                        onChange={(v) => setPerfil(si, pi, "largo_tira_m", v)}
                      />
                    ) : (
                      p.largo_tira_m
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h4 className="sub">Precios por color (paquete)</h4>
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
                      <Num value={pr.precio} onChange={(v) => setPrecio(si, pri, v)} />
                    ) : (
                      formatCLP(pr.precio)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------
// Vidrios (planchas): edición en bloque + agregar/eliminar
// ----------------------------------------------------------------
function VidriosTab({ vidrios, onEditing }) {
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState([]);
  const [editando, setEditando] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    planchaApi
      .list()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="muted">Cargando…</p>;

  const editar = () => {
    setDraft(structuredClone(rows));
    setEditando(true);
    onEditing(true);
  };
  const cancelar = () => {
    setEditando(false);
    onEditing(false);
    load();
  };
  const guardar = async () => {
    setSaving(true);
    try {
      await Promise.all(
        draft.map((p) =>
          planchaApi.update(p.id, {
            tipo_vidrio: p.tipo_vidrio,
            ancho_plancha_m: p.ancho_plancha_m,
            alto_plancha_m: p.alto_plancha_m,
            precio: p.precio,
          })
        )
      );
      setEditando(false);
      onEditing(false);
      load();
    } catch {
      alert("No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  const agregar = async (form) => {
    await planchaApi.create(form);
    setModal(false);
    load();
  };
  const eliminar = async (p) => {
    if (!window.confirm("¿Eliminar esta plancha?")) return;
    await planchaApi.remove(p.id);
    load();
  };

  const set = (i, campo, valor) =>
    setDraft((d) => {
      const n = structuredClone(d);
      n[i][campo] = valor;
      return n;
    });

  const vista = editando ? draft : rows;

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
          <EditBar
            editando={editando}
            saving={saving}
            onEditar={editar}
            onGuardar={guardar}
            onCancelar={cancelar}
          />
        </div>
      </div>

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
          {vista.map((p, i) => (
            <tr key={p.id}>
              <td>{p.tipo_vidrio_display}</td>
              <td>
                {editando ? (
                  <Num
                    step="0.001"
                    value={p.ancho_plancha_m}
                    onChange={(v) => set(i, "ancho_plancha_m", v)}
                  />
                ) : (
                  p.ancho_plancha_m
                )}
              </td>
              <td>
                {editando ? (
                  <Num
                    step="0.001"
                    value={p.alto_plancha_m}
                    onChange={(v) => set(i, "alto_plancha_m", v)}
                  />
                ) : (
                  p.alto_plancha_m
                )}
              </td>
              <td>
                {editando ? (
                  <Num value={p.precio} onChange={(v) => set(i, "precio", v)} />
                ) : (
                  formatCLP(p.precio)
                )}
              </td>
              {!editando && (
                <td className="col-actions">
                  <button className="btn btn-danger btn-sm" onClick={() => eliminar(p)}>
                    Eliminar
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {modal && (
        <CatalogModal
          title="Nueva plancha"
          fields={[
            { name: "tipo_vidrio", label: "Tipo de vidrio", type: "select", options: vidrios, required: true },
            { name: "ancho_plancha_m", label: "Ancho (m)", type: "number", step: "0.001", required: true },
            { name: "alto_plancha_m", label: "Alto (m)", type: "number", step: "0.001", required: true },
            { name: "precio", label: "Precio (CLP)", type: "number", step: "1", required: true },
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
function InsumosTab({ onEditing }) {
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState([]);
  const [editando, setEditando] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    insumoApi
      .list()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="muted">Cargando…</p>;

  const editar = () => {
    setDraft(structuredClone(rows));
    setEditando(true);
    onEditing(true);
  };
  const cancelar = () => {
    setEditando(false);
    onEditing(false);
    load();
  };
  const guardar = async () => {
    setSaving(true);
    try {
      await Promise.all(
        draft.map((x) =>
          insumoApi.update(x.id, {
            codigo: x.codigo,
            nombre: x.nombre,
            unidad: x.unidad,
            precio_paquete: x.precio_paquete,
            cantidad_paquete: x.cantidad_paquete,
          })
        )
      );
      setEditando(false);
      onEditing(false);
      load();
    } catch {
      alert("No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  const set = (i, campo, valor) =>
    setDraft((d) => {
      const n = structuredClone(d);
      n[i][campo] = valor;
      return n;
    });

  const vista = editando ? draft : rows;

  return (
    <div className="panel">
      <div className="crud-head">
        <h3>Insumos y agregados</h3>
        <EditBar
          editando={editando}
          saving={saving}
          onEditar={editar}
          onGuardar={guardar}
          onCancelar={cancelar}
        />
      </div>
      <p className="muted small">
        Costo usado = precio × cantidad / cantidad del paquete.
      </p>
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
          {vista.map((x, i) => (
            <tr key={x.id}>
              <td>{x.codigo}</td>
              <td>{x.nombre}</td>
              <td>{x.unidad}</td>
              <td>
                {editando ? (
                  <Num value={x.precio_paquete} onChange={(v) => set(i, "precio_paquete", v)} />
                ) : (
                  formatCLP(x.precio_paquete)
                )}
              </td>
              <td>
                {editando ? (
                  <Num
                    step="0.001"
                    value={x.cantidad_paquete}
                    onChange={(v) => set(i, "cantidad_paquete", v)}
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
  );
}

// ----------------------------------------------------------------
function Precios() {
  const [tab, setTab] = useState("general");
  const [opciones, setOpciones] = useState({ colores: [], vidrios: [] });
  const [editingTabs, setEditingTabs] = useState({});

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
      <header className="page-head">
        <h1>Precios y catálogo</h1>
        <p className="page-sub">
          Pulsa <strong>Editar</strong> en cada sección para modificar todos sus
          valores a la vez.
        </p>
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
    </div>
  );
}

export default Precios;
