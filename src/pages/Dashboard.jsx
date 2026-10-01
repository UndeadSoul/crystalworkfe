import { useAuth } from "../contexts/AuthContext";
import { roleKey, roleLabel, ROLES } from "../utils/roles";

function Dashboard() {
  const { user } = useAuth();
  const rol = roleKey(user);

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
          <h2>Pendientes</h2>
          {rol === ROLES.JEFE ? (
            <p className="muted">
              Aquí verás las cotizaciones pendientes de aprobación.
            </p>
          ) : (
            <p className="muted">Aquí verás tus cotizaciones en curso.</p>
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
