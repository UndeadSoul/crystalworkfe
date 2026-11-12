import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAlertas } from "../services/alertas";
import { separar } from "../utils/alertasLocal";

// Indicador de alertas en el navbar (solo jefe). Muestra el total y resalta
// en rojo si hay alguna crítica. Descuenta las alertas pospuestas (locales).
// Al pulsarlo lleva a la página /alertas.
function AlertasBell({ onNavigate }) {
  const [visibles, setVisibles] = useState([]);

  useEffect(() => {
    let vivo = true;
    getAlertas()
      .then((d) => vivo && setVisibles(separar(d.alertas || []).visibles))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

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
