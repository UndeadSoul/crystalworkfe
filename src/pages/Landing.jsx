import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { roleKey, ROLES } from "../utils/roles";

// Módulos a los que se accede desde las tarjetas cuando hay sesión iniciada.
const MODULOS_EMPRESA = [
  { to: "/dashboard", titulo: "Dashboard", desc: "Resumen de cotizaciones, proyectos y pagos de un vistazo." },
  { to: "/cotizaciones", titulo: "Cotizaciones", desc: "Arma y revisa cotizaciones con múltiples ventanas, medidas y agregados." },
  { to: "/proyectos", titulo: "Proyectos", desc: "Sigue la fabricación, el pago y la hoja de corte de cada proyecto." },
  { to: "/clientes", titulo: "Clientes", desc: "La ficha de cada cliente y todos sus proyectos asociados." },
];
const MODULOS_ADMIN = [
  { to: "/empresas", titulo: "Empresas", desc: "Gestiona las empresas que usan el sistema." },
  { to: "/usuarios", titulo: "Usuarios", desc: "Administra los usuarios de cada empresa." },
];

function Landing() {
  const { user } = useAuth();
  const location = useLocation();
  // Operario y jefe trabajan con cotizaciones y proyectos; el administrador no.
  const esEmpresa = user && roleKey(user) !== ROLES.ADMIN;
  const modulos = esEmpresa ? MODULOS_EMPRESA : MODULOS_ADMIN;

  // Desplaza a la sección cuando se llega con un hash (#que-hacemos, #trabaja).
  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);

  return (
    <div className="landing">
      <section className="hero">
        <h1>
          Crystal<span>Work</span>
        </h1>
        <p className="hero-lead">
          La plataforma para registrar, cotizar y hacer seguimiento a la
          fabricación de ventanas de aluminio. Centraliza tus clientes,
          cotizaciones y proyectos en un solo lugar.
        </p>
        {!user && (
          <div className="hero-actions">
            <Link to="/login" className="btn btn-primary btn-lg">
              Ingresar
            </Link>
          </div>
        )}
      </section>

      <section id="que-hacemos" className="features">
        <h2>{user ? "Accede a tus módulos" : "Qué hacemos"}</h2>
        {user ? (
          <div className="feature-grid">
            {modulos.map((m) => (
              <Link key={m.to} to={m.to} className="feature-card feature-card-link">
                <h3>{m.titulo}</h3>
                <p>{m.desc}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="feature-grid">
            <article className="feature-card">
              <h3>Cotizaciones</h3>
              <p>
                Arma cotizaciones con múltiples ventanas, colores y medidas, más
                agregados y sus precios, listas para revisión.
              </p>
            </article>
            <article className="feature-card">
              <h3>Proyectos</h3>
              <p>
                Cada cotización aprobada se convierte en un proyecto con su
                historial y su hoja de corte para fabricación.
              </p>
            </article>
            <article className="feature-card">
              <h3>Clientes</h3>
              <p>
                Mantén la ficha de cada cliente y consulta todos los proyectos
                asociados desde un solo lugar.
              </p>
            </article>
          </div>
        )}
      </section>

      {!user && (
        <section id="trabaja" className="cta-strip">
          <h2>Trabaja con nosotros</h2>
          <p>Muy pronto.</p>
        </section>
      )}

      <section id="contacto" className="cta-strip">
        <h2>Contacto</h2>
        <p>Dudas, consultas o comentarios.</p>
        <p className="contacto-datos">
          <a href="mailto:crystalwork.contacto@gmail.com">
            crystalwork.contacto@gmail.com
          </a>
          <a href="tel:+56945772112">+56 9 4577 2112</a>
        </p>
      </section>
    </div>
  );
}

export default Landing;
