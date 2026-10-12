import api from "../api";

export function getResumen() {
  return api.get("/api/analytics/resumen/").then((r) => r.data);
}

// Devuelve { series: { semana, mes, 6meses, anio, 3anios, historico } }
// en una sola llamada: el front cambia de rango sin recargar.
export function getIngresos() {
  return api.get("/api/analytics/ingresos/").then((r) => r.data);
}

export const RANGOS_INGRESOS = [
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mes" },
  { value: "6meses", label: "6 meses" },
  { value: "anio", label: "Año" },
  { value: "3anios", label: "3 años" },
  { value: "historico", label: "Histórico" },
];
