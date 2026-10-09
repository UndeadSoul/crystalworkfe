import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getCotizacion,
  aprobarCotizacion,
  rechazarCotizacion,
} from "../services/cotizaciones";
import { useAuth } from "../contexts/AuthContext";
import { roleKey, ROLES } from "../utils/roles";
import { ESTADO_CLASS, formatCLP, formatFecha } from "../utils/format";

function Dato({ label, children }) {
  return (
    <div className="dato">
      <span className="dato-label">{label}</span>
      <span className="dato-valor">{children || "—"}</span>
    </div>
  );
}

function CotizacionDetalle() {
  const { id } = useParams();
  const { user } = useAuth();
  const [cot, setCot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [resolviendo, setResolviendo] = useState(false);

  useEffect(() => {
    setLoading(true);
    getCotizacion(id)
      .then(setCot)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const puedeResolver =
    cot &&
    cot.estado === "PENDIENTE" &&
    [ROLES.ADMIN, ROLES.JEFE].includes(roleKey(user));

  const resolver = async (accion) => {
    const verbo = accion === "aprobar" ? "aprobar" : "rechazar";
    if (!window.confirm(`¿Seguro que deseas ${verbo} la cotización #${cot.id}?`)) return;
    setResolviendo(true);
    try {
      const fn = accion === "aprobar" ? aprobarCotizacion : rechazarCotizacion;
      setCot(await fn(cot.id));
    } catch {
      alert("No se pudo completar la acción.");
    } finally {
      setResolviendo(false);
    }
  };

  if (loading) return <div className="page-loading">Cargando…</div>;
  if (notFound)
    return (
      <div className="page">
        <p className="muted">Cotización no encontrada.</p>
        <Link to="/cotizaciones" className="link-back">
          ← Volver a cotizaciones
        </Link>
      </div>
    );

  return (
    <div className="page">
      <Link to="/cotizaciones" className="link-back">
        ← Volver a cotizaciones
      </Link>

      <header className="page-head page-head-row">
        <div>
          <h1>Cotización #{cot.id}</h1>
          <p className="page-sub">
            {cot.cliente_nombre} · Ingresada por {cot.empleado_nombre} el{" "}
            {formatFecha(cot.fecha_ingreso)}
          </p>
          {cot.estado !== "PENDIENTE" && cot.resuelta_por_nombre && (
            <p className="page-sub">
              {cot.estado_display} por {cot.resuelta_por_nombre} el{" "}
              {formatFecha(cot.fecha_resolucion)}
            </p>
          )}
        </div>
        <div className="actions">
          <span className={ESTADO_CLASS[cot.estado]}>{cot.estado_display}</span>
          {cot.estado === "PENDIENTE" && (
            <Link to={`/cotizaciones/${cot.id}/editar`} className="btn btn-ghost btn-sm">
              Editar
            </Link>
          )}
          {puedeResolver && (
            <>
              <button
                className="btn btn-primary btn-sm"
                disabled={resolviendo}
                onClick={() => resolver("aprobar")}
              >
                Aprobar
              </button>
              <button
                className="btn btn-danger btn-sm"
                disabled={resolviendo}
                onClick={() => resolver("rechazar")}
              >
                Rechazar
              </button>
            </>
          )}
        </div>
      </header>

      <div className="panel">
        <h2>Entrega</h2>
        <div className="detail-grid">
          <Dato label="Dirección de entrega">{cot.direccion_entrega}</Dato>
          <Dato label="Transporte e instalación">
            {cot.requiere_transporte ? "Sí" : "No"}
          </Dato>
          {cot.requiere_transporte && (
            <Dato label="Distancia">{cot.distancia_transporte_km} km</Dato>
          )}
        </div>
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
              <th>Precio unit.</th>
              <th>Subtotal</th>
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
                <td>
                  {v.precio_calculado ? (
                    formatCLP(v.precio_unitario)
                  ) : (
                    <span className="badge badge-warning">Sin precio</span>
                  )}
                </td>
                <td>{v.precio_calculado ? formatCLP(v.subtotal) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h2>Comentarios y costos</h2>
        <div className="detail-grid">
          <Dato label="Comentarios">{cot.comentarios}</Dato>
          <Dato label="Monto agregado">{formatCLP(cot.monto_agregado)}</Dato>
          {cot.requiere_transporte && (
            <Dato label="Transporte">{formatCLP(cot.costo_transporte)}</Dato>
          )}
          <Dato label="Total">{formatCLP(cot.total)}</Dato>
        </div>
        {cot.ventanas.some((v) => !v.precio_calculado) && (
          <p className="muted">
            Algunas ventanas no tienen precio porque falta cargar datos en el catálogo.
            Pídele al jefe que complete los precios y vuelve a abrir la cotización.
          </p>
        )}
      </div>
    </div>
  );
}

export default CotizacionDetalle;
