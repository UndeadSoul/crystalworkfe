import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { EVENTO_ALERTAS, getAlertas } from "../services/alertas";
import { separar } from "../utils/alertasLocal";

// Indicador de alertas en el navbar (solo jefe). Muestra el total y resalta
// en rojo si hay alguna crítica. Descuenta las alertas pospuestas (locales).
// Al pulsarlo lleva a la página /alertas.
//
// Se recalcula al navegar (location) y cuando algo resuelve/pospone una alerta
// (evento EVENTO_ALERTAS); así el número no queda congelado desde el login.
function AlertasBell({ onNavigate }) {
  const [visibles, setVisibles] = useState([]);
  const location = useLocation();

  useEffect(() => {
    let vivo = true;
    const cargar = () =>
      getAlertas()
        .then((d) => vivo && setVisibles(separar(d.alertas || []).visibles))
        .catch(() => {});
    cargar();
    window.addEventListener(EVENTO_ALERTAS, cargar);
    return () => {
      vivo = false;
      window.removeEventListener(EVENTO_ALERTAS, cargar);
    };
  }, [location.pathname]);

  const total = visibles.length;
  const hayCriticas = visibles.some((a) => a.severidad === "critica");

  return (
    <Link
      to="/alertas"
      className="alertas-bell"
      title={total ? `${total} alerta(s)` : "Sin alertas"}
      aria-label={total ? `Alertas: ${total}` : "Alertas"}
      onClick={onNavigate}
    >
      <span className="alertas-bell-icon" aria-hidden="true">🔔</span>
      {total > 0 && (
        <span
          className={`alertas-bell-badge ${hayCriticas ? "is-critica" : "is-advertencia"}`}
        >
          {total > 99 ? "99+" : total}
        </span>
      )}
    </Link>
  );
}

export default AlertasBell;
