import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { roleKey, roleLabel, ROLES } from "../utils/roles";

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const esJefeOAdmin =
    user && [ROLES.ADMIN, ROLES.JEFE].includes(roleKey(user));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <header className="navbar">
        <Link to="/" className="brand">
          Crystal<span>Work</span>
        </Link>

        <nav className="nav-links">
          {user ? (
            <>
              <NavLink to="/cotizaciones">Cotizaciones</NavLink>
              <NavLink to="/proyectos">Proyectos</NavLink>
              <NavLink to="/clientes">Clientes</NavLink>
              <NavLink to="/dashboard">Dashboard</NavLink>
              {esJefeOAdmin && <NavLink to="/precios">Precios</NavLink>}
            </>
          ) : (
            <>
              <NavLink to="/" end>
                Inicio
              </NavLink>
              <Link to="/#que-hacemos">Qué hacemos</Link>
              <Link to="/#trabaja">Trabaja con nosotros</Link>
            </>
          )}
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <span className="user-chip">
                {user.empresa_nombre || roleLabel(user)}
                {user.empresa_nombre && (
                  <span className="user-role">{roleLabel(user)}</span>
                )}
              </span>
              <button className="btn btn-ghost" onClick={handleLogout}>
                Salir
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Ingresar
            </Link>
          )}
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        CrystalWork · Gestión de cotizaciones y fabricación de ventanas de aluminio
      </footer>
    </div>
  );
}

export default Layout;
