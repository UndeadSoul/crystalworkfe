import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getProyecto,
  getHojaCorte,
  updateProyecto,
  ESTADOS_PRODUCCION,
  ESTADO_PROD_CLASS,
  ESTADOS_PAGO,
  ESTADO_PAGO_CLASS,
} from "../services/proyectos";
import { formatCLP, formatFecha } from "../utils/format";

// Columnas de la hoja de corte y el tipo de valor para ordenar.
const COLS_CORTE = [
  { key: "codigo", label: "Código", tipo: "texto" },
  { key: "tipo_display", label: "Tipo", tipo: "texto" },
  { key: "color_display", label: "Color", tipo: "texto" },
  { key: "perfil", label: "Perfil", tipo: "texto" },
  { key: "largo_mm", label: "Largo (mm)", tipo: "num" },
  { key: "cantidad", label: "Cant.", tipo: "num" },
];

function ProyectoDetalle() {
  const { id } = useParams();
  const [proy, setProy] = useState(null);
  const [piezas, setPiezas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [guardando, setGuardando] = useState(false);
  // orden = null -> orden natural del backend (por orden de perfil).
  const [orden, setOrden] = useState(null);

  const ordenarPor = (key) =>
    setOrden((o) =>
      o && o.key === key
        ? { key, dir: o.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );

  const piezasOrdenadas = useMemo(() => {
    if (!orden) return piezas;
    const col = COLS_CORTE.find((c) => c.key === orden.key);
    const factor = orden.dir === "asc" ? 1 : -1;
    return [...piezas].sort((a, b) => {
      const va = a[orden.key];
      const vb = b[orden.key];
      const cmp =
        col?.tipo === "num"
          ? Number(va) - Number(vb)
          : String(va).localeCompare(String(vb), "es", { numeric: true });
      return cmp * factor;
    });
  }, [piezas, orden]);

  useEffect(() => {
    setLoading(true);
    Promise.all([getProyecto(id), getHojaCorte(id)])
      .then(([p, h]) => {
        setProy(p);
        setPiezas(h.piezas);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const cambiar = async (data) => {
    setGuardando(true);
    try {
      setProy(await updateProyecto(id, data));
    } catch {
      alert("No se pudo actualizar.");
    } finally {
      setGuardando(false);
    }
  };

  if (loading) return <div className="page-loading">Cargando…</div>;
  if (notFound)
    return (
      <div className="page">
        <p className="muted">Proyecto no encontrado.</p>
        <Link to="/proyectos" className="link-back">
          ← Volver a proyectos
        </Link>
      </div>
    );

  const cot = proy.cotizacion;

  return (
    <div className="page">
      <Link to="/proyectos" className="link-back">
        ← Volver a proyectos
      </Link>

      <header className="page-head page-head-row">
        <div>
          <h1>Proyecto #{proy.id}</h1>
          <p className="page-sub">
            {proy.cliente_nombre} · Creado el {formatFecha(proy.fecha_creacion)} · Total{" "}
            {formatCLP(cot.total)}
          </p>
        </div>
        <div className="actions">
          <span className={ESTADO_PROD_CLASS[proy.estado_produccion]}>
            {proy.estado_display}
          </span>
          <span className={ESTADO_PAGO_CLASS[proy.estado_pago]}>
            {proy.estado_pago_display}
          </span>
        </div>
      </header>

      <div className="panel">
        <h2>Estado</h2>
        <div className="estado-selector">
          <label className="field">
            <span>Fabricación</span>
            <select
              value={proy.estado_produccion}
              disabled={guardando}
              onChange={(e) => cambiar({ estado_produccion: e.target.value })}
            >
              {ESTADOS_PRODUCCION.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Pago</span>
            <select
              value={proy.estado_pago}
              disabled={guardando}
              onChange={(e) => cambiar({ estado_pago: e.target.value })}
            >
              {ESTADOS_PAGO.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Link to={`/cotizaciones/${cot.id}`} className="link-back">
          Ver cotización #{cot.id} →
        </Link>
      </div>

      <div className="panel panel-flush">
        <div className="pad">
          <h2>Ventanas ({cot.ventanas.length})</h2>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Color</th>
              <th>Vidrio</th>
              <th>Medidas (cm)</th>
              <th>Cant.</th>
            </tr>
          </thead>
          <tbody>
            {cot.ventanas.map((v) => (
              <tr key={v.id}>
                <td>{v.tipo_display}</td>
                <td>{v.color_display}</td>
                <td>{v.vidrio_display}</td>
                <td>
                  {v.ancho_cm} × {v.alto_cm}
                </td>
                <td>{v.cantidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel panel-flush">
        <div className="pad">
          <h2>Hoja de corte</h2>
          <p className="muted small">
            Piezas de aluminio a cortar (consolidadas por tipo, perfil y largo).
          </p>
        </div>
        {piezas.length === 0 ? (
          <p className="muted pad">Sin piezas (revisa que las ventanas tengan tipo válido).</p>
        ) : (
          <table className="table table-sortable">
            <thead>
              <tr>
                {COLS_CORTE.map((c) => {
                  const activa = orden?.key === c.key;
                  return (
                    <th
                      key={c.key}
                      className="th-sort"
                      aria-sort={
                        activa ? (orden.dir === "asc" ? "ascending" : "descending") : "none"
                      }
                      onClick={() => ordenarPor(c.key)}
                    >
                      {c.label}
                      <span className="sort-ind">
                        {activa ? (orden.dir === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {piezasOrdenadas.map((p, i) => (
                <tr key={i}>
                  <td>
                    <strong>{p.codigo}</strong>
                  </td>
                  <td>{p.tipo_display}</td>
                  <td>{p.color_display}</td>
                  <td>{p.perfil}</td>
                  <td>{p.largo_mm}</td>
                  <td>{p.cantidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ProyectoDetalle;
