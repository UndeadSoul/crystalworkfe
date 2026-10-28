import api from "../api";

export function listClientes(search) {
  return api
    .get("/api/clientes/", { params: search ? { search } : {} })
    .then((r) => r.data);
}

export function getCliente(id) {
  return api.get(`/api/clientes/${id}/`).then((r) => r.data);
}

export function createCliente(data) {
  return api.post("/api/clientes/", data).then((r) => r.data);
}

export function updateCliente(id, data) {
  return api.put(`/api/clientes/${id}/`, data).then((r) => r.data);
}

export function deleteCliente(id) {
  return api.delete(`/api/clientes/${id}/`);
}
