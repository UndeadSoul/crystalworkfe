import api from "../api";

const BASE = "/api/usuarios/";

export function listUsuarios(params) {
  return api.get(BASE, { params }).then((r) => r.data);
}

export function createUsuario(data) {
  return api.post(BASE, data).then((r) => r.data);
}

export function updateUsuario(id, data) {
  return api.patch(`${BASE}${id}/`, data).then((r) => r.data);
}

export function cambiarClaveUsuario(id, password) {
  return api.post(`${BASE}${id}/clave/`, { password }).then((r) => r.data);
}

export function setUsuarioActivo(id, activo) {
  const accion = activo ? "activar" : "desactivar";
  return api.post(`${BASE}${id}/${accion}/`).then((r) => r.data);
}

export const ROLES_USUARIO = [
  { value: "JEFE", label: "Jefe" },
  { value: "OPERARIO", label: "Operario" },
];
