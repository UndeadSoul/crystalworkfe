import api from "../api";

export function listProyectos(params) {
  return api.get("/api/proyectos/", { params }).then((r) => r.data);
}

export function getProyecto(id) {
  return api.get(`/api/proyectos/${id}/`).then((r) => r.data);
}

export function updateProyecto(id, data) {
  return api.patch(`/api/proyectos/${id}/`, data).then((r) => r.data);
}

export function getHojaCorte(id) {
  return api.get(`/api/proyectos/${id}/hoja-corte/`).then((r) => r.data);
}

export const ESTADOS_PRODUCCION = [
  { value: "POR_INICIAR", label: "Por iniciar" },
  { value: "EN_FABRICACION", label: "En fabricación" },
  { value: "TERMINADO", label: "Terminado" },
  { value: "ENTREGADO", label: "Entregado" },
];

export const ESTADO_PROD_CLASS = {
  POR_INICIAR: "badge badge-neutral",
  EN_FABRICACION: "badge badge-warning",
  TERMINADO: "badge badge-success",
  ENTREGADO: "badge badge-info",
};

export const ESTADOS_PAGO = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "ABONADO", label: "Abonado" },
  { value: "PAGADO", label: "Pagado" },
];

export const ESTADO_PAGO_CLASS = {
  PENDIENTE: "badge badge-danger",
  ABONADO: "badge badge-warning",
  PAGADO: "badge badge-success",
};
