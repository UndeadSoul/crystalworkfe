import { useSyncExternalStore } from "react";
import { hayActividad, suscribir } from "../utils/actividad";

// Barra fina bajo la navegación mientras hay peticiones a la API en curso
// (cambios de pantalla, guardados, cálculos).
function BarraCarga() {
  const activa = useSyncExternalStore(suscribir, hayActividad);
  if (!activa) return null;
  return (
    <div className="barra-carga" role="progressbar" aria-label="Cargando">
      <span />
    </div>
  );
}

export default BarraCarga;
