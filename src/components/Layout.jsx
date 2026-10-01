import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { roleLabel } from "../utils/roles";

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
            </>
          ) : (
            <>
              <NavLink to="/" end>
                Inicio
              </NavLink>
              <a href="#que-hacemos">Qué hacemos</a>
              <a href="#trabaja">Trabaja con nosotros</a>
            </>
          )}
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <span className="user-chip">
                {user.username}
                <span className="user-role">{roleLabel(user)}</span>
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
