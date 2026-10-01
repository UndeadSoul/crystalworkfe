import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listCotizaciones } from "../services/cotizaciones";
import { ESTADO_CLASS, formatCLP, formatFecha } from "../utils/format";

const ESTADOS = [
  { value: "", label: "Todos los estados" },
  { value: "PENDIENTE", label: "Pendientes" },
  { value: "APROBADA", label: "Aprobadas" },
  { value: "RECHAZADA", label: "Rechazadas" },
];

function Cotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estado, setEstado] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async (filtroEstado) => {
    setLoading(true);
    setError("");
    try {
      const params = filtroEstado ? { estado: filtroEstado } : {};
      setCotizaciones(await listCotizaciones(params));
    } catch {
      setError("No se pudieron cargar las cotizaciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(estado);
  }, [estado, load]);

  return (
    <div className="page">
      <header className="page-head page-head-row">
        <h1>Cotizaciones</h1>
        <Link to="/cotizaciones/nueva" className="btn btn-primary">
          + Nueva cotización
        </Link>
      </header>

      <div className="toolbar">
        <select
          className="search-input"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        >
          {ESTADOS.map((o) => (
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
        ) : cotizaciones.length === 0 ? (
          <p className="muted pad">No hay cotizaciones.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Ventanas</th>
                <th>Total</th>
                <th>Fecha</th>
                <th>Ingresada por</th>
                <th className="col-actions"></th>
              </tr>
            </thead>
            <tbody>
              {cotizaciones.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/cotizaciones/${c.id}`} className="row-link">
                      #{c.id}
                    </Link>
                  </td>
                  <td>{c.cliente_nombre}</td>
                  <td>
                    <span className={ESTADO_CLASS[c.estado]}>{c.estado_display}</span>
                  </td>
                  <td>{c.n_ventanas}</td>
                  <td>{formatCLP(c.total)}</td>
                  <td>{formatFecha(c.fecha_ingreso)}</td>
                  <td>{c.empleado_nombre}</td>
                  <td className="col-actions">
                    <Link to={`/cotizaciones/${c.id}`} className="btn btn-ghost btn-sm">
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

export default Cotizaciones;
