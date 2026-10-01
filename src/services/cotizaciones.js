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
