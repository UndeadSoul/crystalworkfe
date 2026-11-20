import api from "../api";

// Evento (local a la pestaña) para avisar que las alertas pueden haber
// cambiado: la campana del navbar lo escucha y recalcula su número al instante,
// sin esperar a navegar. Lo disparan los servicios que resuelven alertas
// (aprobar/rechazar cotización, cambiar estado o registrar/anular pagos) y la
// posposición local.
export const EVENTO_ALERTAS = "alertas:cambio";

export function notificarCambioAlertas() {
  try {
    window.dispatchEvent(new Event(EVENTO_ALERTAS));
  } catch {
    // Entornos sin window (no debería ocurrir en el navegador).
  }
}

// Lista completa de alertas de la empresa (solo jefe).
export function getAlertas() {
  return api.get("/api/alertas/").then((r) => r.data);
}

// Solo los conteos, para el indicador del navbar.
export function getResumenAlertas() {
  return api.get("/api/alertas/resumen/").then((r) => r.data);
}

export const SEVERIDAD_CLASS = {
  critica: "badge badge-danger",
  advertencia: "badge badge-warning",
};

export const SEVERIDAD_LABEL = {
  critica: "Crítica",
  advertencia: "Advertencia",
};
