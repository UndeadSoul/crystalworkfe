import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { inicioPara, roleKey, ROLES } from "../utils/roles";

function Landing() {
  const { user } = useAuth();
  const location = useLocation();
  // Operario y jefe trabajan con cotizaciones y proyectos; el administrador no.
  const esEmpresa = user && roleKey(user) !== ROLES.ADMIN;

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
        <div className="hero-actions">
          {user ? (
            <>
              {esEmpresa && (
                <Link to="/cotizaciones/nueva" className="btn btn-ghost btn-lg">
                  Nueva cotización
                </Link>
              )}
              <Link to={inicioPara(user)} className="btn btn-primary btn-lg">
                Ir al panel
              </Link>
              {esEmpresa && (
                <Link to="/proyectos" className="btn btn-ghost btn-lg">
                  Proyectos
                </Link>
              )}
            </>
          ) : (
            <Link to="/login" className="btn btn-primary btn-lg">
              Ingresar
            </Link>
          )}
        </div>
      </section>

      <section id="que-hacemos" className="features">
        <h2>Qué hacemos</h2>
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
      </section>

      <section id="trabaja" className="cta-strip">
        <h2>Trabaja con nosotros</h2>
        <p>Muy pronto.</p>
      </section>

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
