const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export function formatCLP(value) {
  const n = Number(value);
  return Number.isFinite(n) ? clp.format(n) : "—";
}

export function formatFecha(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export const ESTADO_CLASS = {
  PENDIENTE: "badge badge-warning",
  APROBADA: "badge badge-success",
  RECHAZADA: "badge badge-danger",
};
