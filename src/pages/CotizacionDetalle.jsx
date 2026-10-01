import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getCotizacion } from "../services/cotizaciones";
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
  const [cot, setCot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    getCotizacion(id)
      .then(setCot)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

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
        </div>
        <span className={ESTADO_CLASS[cot.estado]}>{cot.estado_display}</span>
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

      <div className="panel">
        <h2>Comentarios y costos</h2>
        <div className="detail-grid">
          <Dato label="Comentarios">{cot.comentarios}</Dato>
          <Dato label="Monto agregado">{formatCLP(cot.monto_agregado)}</Dato>
          <Dato label="Total">{formatCLP(cot.total)}</Dato>
        </div>
        <p className="muted">
          El total es provisional hasta que se definan los precios de materiales y
          transporte.
        </p>
      </div>
    </div>
  );
}

export default CotizacionDetalle;
