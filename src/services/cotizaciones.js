import api from "../api";

export function listCotizaciones(params) {
  return api.get("/api/cotizaciones/", { params }).then((r) => r.data);
}

export function getCotizacion(id) {
  return api.get(`/api/cotizaciones/${id}/`).then((r) => r.data);
}

export function createCotizacion(data) {
  return api.post("/api/cotizaciones/", data).then((r) => r.data);
}

export function updateCotizacion(id, data) {
  return api.put(`/api/cotizaciones/${id}/`, data).then((r) => r.data);
}

export function getOpcionesCotizacion() {
  return api.get("/api/cotizaciones/opciones/").then((r) => r.data);
}

// `version`: la de la cotización que el usuario tiene en pantalla. Si otro
// usuario la cambió entre medio, la API responde 409 (conflicto).
export function aprobarCotizacion(id, version) {
  return api.post(`/api/cotizaciones/${id}/aprobar/`, { version }).then((r) => r.data);
}

export function rechazarCotizacion(id, version) {
  return api.post(`/api/cotizaciones/${id}/rechazar/`, { version }).then((r) => r.data);
}
