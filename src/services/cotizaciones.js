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

export function getOpcionesCotizacion() {
  return api.get("/api/cotizaciones/opciones/").then((r) => r.data);
}

export function aprobarCotizacion(id) {
  return api.post(`/api/cotizaciones/${id}/aprobar/`).then((r) => r.data);
}

export function rechazarCotizacion(id) {
  return api.post(`/api/cotizaciones/${id}/rechazar/`).then((r) => r.data);
}
