import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  listProyectos,
  ESTADOS_PRODUCCION,
  ESTADO_PROD_CLASS,
} from "../services/proyectos";
import { formatCLP, formatFecha } from "../utils/format";

function Proyectos() {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estado, setEstado] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async (filtro) => {
    setLoading(true);
    setError("");
    try {
      setProyectos(await listProyectos(filtro ? { estado: filtro } : {}));
    } catch {
      setError("No se pudieron cargar los proyectos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(estado);
  }, [estado, load]);

  return (
    <div className="page">
      <header className="page-head">
        <h1>Proyectos</h1>
        <p className="page-sub">Cotizaciones aprobadas en fabricación.</p>
      </header>

      <div className="toolbar">
        <select
          className="search-input"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {ESTADOS_PRODUCCION.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="panel panel-flush">
        {loading ? (
          <p className="muted pad">Cargando…</p>
        ) : proyectos.length === 0 ? (
          <p className="muted pad">No hay proyectos.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Ventanas</th>
                <th>Total</th>
                <th>Creado</th>
                <th className="col-actions"></th>
              </tr>
            </thead>
            <tbody>
              {proyectos.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/proyectos/${p.id}`} className="row-link">
                      #{p.id}
                    </Link>
                  </td>
                  <td>{p.cliente_nombre}</td>
                  <td>
                    <span className={ESTADO_PROD_CLASS[p.estado_produccion]}>
                      {p.estado_display}
                    </span>
                  </td>
                  <td>{p.n_ventanas}</td>
                  <td>{formatCLP(p.total)}</td>
                  <td>{formatFecha(p.fecha_creacion)}</td>
                  <td className="col-actions">
                    <Link to={`/proyectos/${p.id}`} className="btn btn-ghost btn-sm">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Proyectos;
