const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export function formatCLP(value) {
  const n = Number(value);
  return Number.isFinite(n) ? clp.format(n) : "—";
}

// Dimensiones con su unidad (igual en pantalla y en los PDF): "500mm",
// "500mm × 500mm" (ancho × alto).
export const formatMm = (n) => `${n}mm`;
export const formatMedidas = (ancho, alto) => `${formatMm(ancho)} × ${formatMm(alto)}`;

// Fechas y zonas horarias
// ------------------------------------------------------------------
// - Fechas con hora (registro, ingreso, modificación…): el backend las envía
//   en ISO con su desfase (2026-10-24T19:15:00-03:00), así que se convierten
//   sin ambigüedad a la zona del computador de quien mira.
// - Si esa zona difiere de la del servidor, se indica el desfase local
//   ("19:15 (GMT+9)") para que no se confunda con la hora del servidor.
// - Fechas sin hora (la de un pago): son fechas de negocio del servidor y se
//   muestran tal cual, sin convertir (convertirlas las correría de día).
// - api.js envía la zona del navegador (X-Zona-Horaria) para que los textos
//   con hora que arma el servidor usen la misma zona.

// Zona del servidor (TIME_ZONE del backend); la informa /api/me/.
let zonaServidor = "America/Santiago";
export function setZonaServidor(zona) {
  if (zona) zonaServidor = zona;
}

export const zonaNavegador = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

const SOLO_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;

// "GMT-3" de una zona en un instante dado (undefined = zona del navegador).
function desfase(fecha, timeZone) {
  return new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" })
    .formatToParts(fecha)
    .find((p) => p.type === "timeZoneName")?.value;
}

/** "24-10-2026". Fecha sin hora: tal cual. Con hora: el día en la zona local. */
export function formatFecha(iso) {
  if (!iso) return "—";
  const soloFecha = SOLO_FECHA.exec(iso);
  if (soloFecha) return `${soloFecha[3]}-${soloFecha[2]}-${soloFecha[1]}`;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** "24-10-2026 19:15" en la zona local (+ " (GMT+9)" si difiere del servidor). */
export function formatFechaHora(iso) {
  if (!iso) return "—";
  if (SOLO_FECHA.test(iso)) return formatFecha(iso);
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const hora = d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false });
  const texto = `${formatFecha(iso)} ${hora}`;
  const local = desfase(d);
  return local !== desfase(d, zonaServidor) ? `${texto} (${local})` : texto;
}

// Bloquea caracteres como "e", "E", "+", "-" en inputs numéricos.
export function blockExponentKey(e) {
  if (["e", "E", "+", "-"].includes(e.key)) {
    e.preventDefault();
  }
}

// Igual que blockExponentKey y además sin decimales (inputs de enteros).
export function blockNonIntegerKey(e) {
  if (["e", "E", "+", "-", ".", ","].includes(e.key)) {
    e.preventDefault();
  }
}

export const ESTADO_CLASS = {
  PENDIENTE: "badge badge-warning",
  APROBADA: "badge badge-success",
  RECHAZADA: "badge badge-danger",
};
