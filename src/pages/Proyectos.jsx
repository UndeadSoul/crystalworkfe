import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  listProyectos,
  ESTADOS_PRODUCCION,
  ESTADOS_PAGO,
  ESTADO_PROD_CLASS,
  ESTADO_PAGO_CLASS,
} from "../services/proyectos";
import { formatCLP, formatFechaHora } from "../utils/format";
import { FormError } from "../components/FormErrors";
import { Loader } from "../components/Loader";

function Proyectos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  // Permite enlazar con filtros: /proyectos?pago=PENDIENTE
  const [estado, setEstado] = useState(searchParams.get("estado") || "");
  const [pago, setPago] = useState(searchParams.get("pago") || "");
  const [error, setError] = useState("");

  const load = useCallback(async (filtroEstado, filtroPago) => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroPago) params.pago = filtroPago;
      setProyectos(await listProyectos(params));
    } catch {
      setError("No se pudieron cargar los proyectos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(estado, pago);
  }, [estado, pago, load]);

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
          <option value="">Toda la fabricación</option>
          {ESTADOS_PRODUCCION.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          className="search-input"
          value={pago}
          onChange={(e) => setPago(e.target.value)}
        >
          <option value="">Todos los pagos</option>
          {ESTADOS_PAGO.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <FormError msg={error} />

      <div className="panel panel-flush">
        {loading ? (
          <Loader texto="Cargando proyectos…" />
        ) : proyectos.length === 0 ? (
          <p className="muted pad">No hay proyectos.</p>
        ) : (
          <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Pago</th>
                <th>Ventanas</th>
                <th>Total (c/IVA)</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {proyectos.map((p) => (
                <tr
                  key={p.id}
                  className="clickable-row"
                  onClick={() => navigate(`/proyectos/${p.id}`)}
                >
                  <td>#{p.id}</td>
                  <td>{p.cliente_nombre}</td>
                  <td>
                    <span className={ESTADO_PROD_CLASS[p.estado_produccion]}>
                      {p.estado_display}
                    </span>
                  </td>
                  <td>
                    <span className={ESTADO_PAGO_CLASS[p.estado_pago]}>
                      {p.estado_pago_display}
                    </span>
                  </td>
                  <td>{p.n_ventanas}</td>
                  <td>{formatCLP(p.total_bruto)}</td>
                  <td>{formatFechaHora(p.fecha_creacion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Proyectos;
