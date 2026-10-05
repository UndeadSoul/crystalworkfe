import api from "../api";

// Genera un CRUD estándar sobre un endpoint del catálogo.
function crud(base) {
  return {
    list: () => api.get(base).then((r) => r.data),
    create: (data) => api.post(base, data).then((r) => r.data),
    update: (id, data) => api.put(`${base}${id}/`, data).then((r) => r.data),
    remove: (id) => api.delete(`${base}${id}/`),
  };
}

export const seriesApi = crud("/api/catalogo/series/");
export const perfilSerieApi = crud("/api/catalogo/perfiles-serie/");
export const precioSerieApi = crud("/api/catalogo/precios-serie/");
export const perfilIndividualApi = crud("/api/catalogo/perfiles-individuales/");
export const precioPerfilIndividualApi = crud(
  "/api/catalogo/precios-perfil-individual/"
);
export const planchaApi = crud("/api/catalogo/planchas/");
export const insumoApi = crud("/api/catalogo/insumos/");

export function getConfigEmpresa() {
  return api.get("/api/catalogo/empresa/").then((r) => r.data);
}

export function updateConfigEmpresa(data) {
  return api.put("/api/catalogo/empresa/", data).then((r) => r.data);
}
