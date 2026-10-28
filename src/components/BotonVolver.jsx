import { Link } from "react-router-dom";

// Botón "volver" a la lista, a la izquierda del título de las pantallas de detalle.
function BotonVolver({ to, children }) {
  return (
    <Link
      to={to}
      className="btn btn-ghost btn-volver"
      aria-label={`Volver a ${String(children).toLowerCase()}`}
    >
      <span aria-hidden="true">←</span>
      {children}
    </Link>
  );
}

export default BotonVolver;
