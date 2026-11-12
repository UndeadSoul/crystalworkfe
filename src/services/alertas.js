import api from "../api";

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
