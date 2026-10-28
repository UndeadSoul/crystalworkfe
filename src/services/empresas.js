import api from "../api";

const BASE = "/api/empresas/";

export function listEmpresas(params) {
  return api.get(BASE, { params }).then((r) => r.data);
}

export function createEmpresa(data) {
  return api.post(BASE, data).then((r) => r.data);
}

export function updateEmpresa(id, data) {
  return api.patch(`${BASE}${id}/`, data).then((r) => r.data);
}

export function setEmpresaActiva(id, activa) {
  const accion = activa ? "activar" : "desactivar";
  return api.post(`${BASE}${id}/${accion}/`).then((r) => r.data);
}
