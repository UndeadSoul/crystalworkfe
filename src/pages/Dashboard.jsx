import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { roleKey, roleLabel, ROLES } from "../utils/roles";
import { listCotizaciones } from "../services/cotizaciones";
import { formatCLP, formatFecha } from "../utils/format";

function Dashboard() {
  const { user } = useAuth();
  const rol = roleKey(user);
  const esJefe = rol === ROLES.JEFE || rol === ROLES.ADMIN;

  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCotizaciones({ estado: "PENDIENTE" })
      .then(setPendientes)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Hola, {user.first_name || user.username}</h1>
          <p className="page-sub">
            {roleLabel(user)}
            {user.empresa_nombre ? ` · ${user.empresa_nombre}` : ""}
          </p>
        </div>
      </header>

      <section className="panel-grid">
        <article className="panel">
          <h2>Alertas</h2>
          <p className="muted">Aún no hay alertas. (Próximamente)</p>
        </article>

        <article className="panel">
          <h2>
            {esJefe ? "Pendientes de aprobación" : "Cotizaciones pendientes"}
          </h2>
          {loading ? (
            <p className="muted">Cargando…</p>
          ) : pendientes.length === 0 ? (
            <p className="muted">No hay cotizaciones pendientes.</p>
          ) : (
            <>
              <p className="pendientes-count">{pendientes.length}</p>
              <ul className="pendientes-list">
                {pendientes.slice(0, 5).map((c) => (
                  <li key={c.id}>
                    <Link to={`/cotizaciones/${c.id}`}>
                      #{c.id} · {c.cliente_nombre}
                    </Link>
                    <span className="muted small">
                      {formatCLP(c.total)} · {formatFecha(c.fecha_ingreso)}
                    </span>
                  </li>
                ))}
              </ul>
              {pendientes.length > 5 && (
                <Link to="/cotizaciones" className="link-back">
                  Ver todas →
                </Link>
              )}
            </>
          )}
        </article>

        <article className="panel">
          <h2>Resumen</h2>
          <p className="muted">
            Las métricas de cotizaciones y proyectos aparecerán aquí.
          </p>
        </article>
      </section>
    </div>
  );
}

export default Dashboard;
