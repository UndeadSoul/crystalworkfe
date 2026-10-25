// Normaliza los errores de la API (DRF) a un formato común:
//   { general: "texto", campos: { nombre: "texto", "ventanas.1.ancho_mm": "texto" }, codigo }
// `codigo` es el "code" que algunos errores incluyen (p. ej. conflicto_version).
// Los errores anidados (listas de objetos) se aplanan con rutas "a.0.b".

const SIN_CONEXION = "No se pudo conectar con el servidor. Revisa tu conexión.";
const ERROR_SERVIDOR = "Ocurrió un error en el servidor. Intenta de nuevo.";
const GENERALES = ["detail", "non_field_errors"];

function texto(valor) {
  if (Array.isArray(valor)) return valor.filter((v) => typeof v === "string").join(" ");
  return typeof valor === "string" ? valor : "";
}

function aplanar(data, prefijo, campos) {
  if (Array.isArray(data)) {
    if (data.every((v) => typeof v === "string")) {
      if (data.length) campos[prefijo] = data.join(" ");
      return;
    }
    data.forEach((item, i) => aplanar(item, `${prefijo}.${i}`, campos));
    return;
  }
  if (data && typeof data === "object") {
    Object.entries(data).forEach(([k, v]) =>
      aplanar(v, prefijo ? `${prefijo}.${k}` : k, campos)
    );
    return;
  }
  if (typeof data === "string" && data) campos[prefijo] = data;
}

/**
 * err:      error de axios.
 * fallback: mensaje general si la respuesta no trae uno.
 * visibles: nombres de campo que el formulario muestra (incluye sus rutas
 *           anidadas). Los errores de campos no visibles pasan al mensaje
 *           general para que nunca se pierdan. Si se omite, todos son visibles.
 */
export function parseApiError(err, { fallback = "No se pudo completar la acción.", visibles } = {}) {
  const resp = err?.response;
  if (!resp) return { general: SIN_CONEXION, campos: {} };
  if (resp.status >= 500) return { general: ERROR_SERVIDOR, campos: {} };

  const data = resp.data;
  if (typeof data === "string" || Array.isArray(data)) {
    return { general: texto(data) || fallback, campos: {} };
  }

  const generales = [];
  const campos = {};
  Object.entries(data || {}).forEach(([k, v]) => {
    // "code": código del error (ver `codigo`); "actual": registro vigente en
    // un conflicto 409. No son campos con error.
    if (k === "code" || k === "actual") return;
    if (GENERALES.includes(k)) generales.push(texto(v));
    else aplanar(v, k, campos);
  });

  if (visibles) {
    const esVisible = (ruta) =>
      visibles.some((v) => ruta === v || ruta.startsWith(`${v}.`));
    Object.keys(campos).forEach((ruta) => {
      if (!esVisible(ruta)) {
        generales.push(campos[ruta]);
        delete campos[ruta];
      }
    });
  }

  const general = generales.filter(Boolean).join(" ");
  return {
    general: general || (Object.keys(campos).length ? "" : fallback),
    campos,
    codigo: typeof data?.code === "string" ? data.code : "",
  };
}

/** Otro usuario modificó el registro desde que se abrió (HTTP 409). */
export const esConflicto = (err) => err?.response?.status === 409;
