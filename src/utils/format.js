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

// Bloquea caracteres como "e", "E", "+", "-" en inputs numéricos.
export function blockExponentKey(e) {
  if (["e", "E", "+", "-"].includes(e.key)) {
    e.preventDefault();
  }
}

export const ESTADO_CLASS = {
  PENDIENTE: "badge badge-warning",
  APROBADA: "badge badge-success",
  RECHAZADA: "badge badge-danger",
};
