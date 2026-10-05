import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getProyecto,
  getHojaCorte,
  updateEstadoProyecto,
  ESTADOS_PRODUCCION,
  ESTADO_PROD_CLASS,
} from "../services/proyectos";
import { formatCLP, formatFecha } from "../utils/format";

function ProyectoDetalle() {
  const { id } = useParams();
  const [proy, setProy] = useState(null);
  const [piezas, setPiezas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [guardando, setGuardando] = useState(false);

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

  const cambiarEstado = async (estado) => {
    setGuardando(true);
    try {
      setProy(await updateEstadoProyecto(id, estado));
    } catch {
      alert("No se pudo actualizar el estado.");
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
        </div>
      </header>

      <div className="panel">
        <h2>Estado de fabricación</h2>
        <div className="estado-selector">
          <select
            value={proy.estado_produccion}
            disabled={guardando}
            onChange={(e) => cambiarEstado(e.target.value)}
          >
            {ESTADOS_PRODUCCION.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Link to={`/cotizaciones/${cot.id}`} className="link-back">
            Ver cotización #{cot.id} →
          </Link>
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
          <table className="table">
            <thead>
              <tr>
                <th>Tipo de ventana</th>
                <th>Perfil</th>
                <th>Largo (m)</th>
                <th>Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {piezas.map((p, i) => (
                <tr key={i}>
                  <td>{p.tipo_display}</td>
                  <td>{p.perfil}</td>
                  <td>{p.largo_m}</td>
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
