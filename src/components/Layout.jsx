import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { roleKey, roleLabel, ROLES } from "../utils/roles";

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const esJefeOAdmin =
    user && [ROLES.ADMIN, ROLES.JEFE].includes(roleKey(user));

  // Cierra el menú lateral al cambiar de ruta.
  useEffect(() => setMenuOpen(false), [location.pathname, location.hash]);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/login");
  };

  const cerrar = () => setMenuOpen(false);

  return (
    <div className="app-shell">
      <header className="navbar">
        <button
          type="button"
          className="nav-toggle"
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <Link to="/" className="brand" onClick={cerrar}>
          Crystal<span>Work</span>
        </Link>

        <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
          {user ? (
            <>
              <NavLink to="/cotizaciones" onClick={cerrar}>Cotizaciones</NavLink>
              <NavLink to="/proyectos" onClick={cerrar}>Proyectos</NavLink>
              <NavLink to="/clientes" onClick={cerrar}>Clientes</NavLink>
              <NavLink to="/dashboard" onClick={cerrar}>Dashboard</NavLink>
              {esJefeOAdmin && (
                <NavLink to="/precios" onClick={cerrar}>Precios</NavLink>
              )}
            </>
          ) : (
            <>
              <NavLink to="/" end onClick={cerrar}>
                Inicio
              </NavLink>
              <Link to="/#que-hacemos" onClick={cerrar}>Qué hacemos</Link>
              <Link to="/#trabaja" onClick={cerrar}>Trabaja con nosotros</Link>
            </>
          )}

          {/* Acciones dentro del menú lateral (solo visibles en móvil) */}
          <div className="nav-links-actions">
            {user ? (
              <button className="btn btn-ghost btn-block" onClick={handleLogout}>
                Salir
              </button>
            ) : (
              <Link to="/login" className="btn btn-primary btn-block" onClick={cerrar}>
                Ingresar
              </Link>
            )}
          </div>
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

        {/* El overlay va DENTRO del header para compartir el contexto de
            apilamiento del drawer (si no, el overlay quedaría por encima del
            menú y bloquearía los clics). */}
        {menuOpen && <div className="nav-overlay" onClick={cerrar} />}
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
