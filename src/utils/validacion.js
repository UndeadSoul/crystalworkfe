// Reglas de validación del frontend: espejo de CrystalWork/core/validacion.py.
// Si se cambia un límite o un carácter permitido, cambiarlo en ambos lados.
import { isValidRut } from "./rut";

export const LIMITES = {
  nombreMin: 5,
  nombreMax: 50,
  direccionMin: 5,
  direccionMax: 100,
  emailMax: 100,
  comentarioMax: 1000,
  distanciaMin: 0.1,
  distanciaMax: 500,
  montoAgregadoMax: 10_000_000,
  ventanasMax: 50,
  dimensionMin: 300,
  dimensionMax: 3000,
  cantidadMin: 1,
  cantidadMax: 10,
  telefonoMax: 20,
  telefonoDigitosMin: 8,
  telefonoDigitosMax: 12,
  usernameMin: 3,
  usernameMax: 30,
  personaMin: 2,
  personaMax: 50,
  empresaNombreMin: 3,
  empresaNombreMax: 100,
  claveMin: 8,
  pagoComentarioMax: 200,
  motivoMin: 5,
};

// Catálogo de precios: { min, max, decimales, unidad, cero, ejemplo }. Con
// cero=true el 0 también es válido y significa "sin configurar".
export const REGLAS = {
  precio: { min: 0, max: 10_000_000, decimales: 0, unidad: "CLP", ejemplo: "Ej: 50000" },
  margen: { min: 0, max: 200, decimales: 2, unidad: "%", ejemplo: "Ej: 30" },
  transporteKm: { min: 0, max: 50_000, decimales: 0, unidad: "CLP", ejemplo: "Ej: 1000" },
  pesoSerie: { min: 0.1, max: 100, decimales: 3, unidad: "kg", cero: true, ejemplo: "Ej: 7.5" },
  pesoPerfil: { min: 0.001, max: 100, decimales: 3, unidad: "kg", cero: true, ejemplo: "Ej: 0.9" },
  largoTira: { min: 1, max: 7, decimales: 3, unidad: "m", ejemplo: "Ej: 6" },
  plancha: { min: 0.5, max: 4, decimales: 3, unidad: "m", ejemplo: "Ej: 2.4" },
  cantidadPaquete: { min: 0.001, max: 999_999_999, decimales: 3, mayorQueCero: true, ejemplo: "Ej: 100" },
};

// Ejemplos de formato para los campos de escritura (placeholder). Cada uno
// cumple su propia regla (lo verifica una prueba): copiarlo debe ser válido.
// Los decimales usan punto, igual que los valores que muestra el sistema.
export const EJEMPLOS = {
  nombreCliente: "Ej: Juan Pérez",
  rut: "Ej: 12.345.678-5",
  rutEmpresa: "Ej: 76.123.456-0",
  telefono: "Ej: +56 9 1234 5678",
  email: "Ej: nombre@correo.cl",
  direccion: "Ej: Av. Los Leones 1234, depto 5",
  distancia: "Ej: 12.5",
  comentarios: "Ej: Instalación en segundo piso. Retirar ventanas antiguas.",
  montoAgregado: "Ej: 15000",
  ancho: "Ej: 1200",
  alto: "Ej: 1000",
  cantidad: "Ej: 1",
  username: "Ej: juan.perez",
  nombre: "Ej: Juan",
  apellido: "Ej: Pérez",
  clave: "Mínimo 8 caracteres",
  empresa: "Ej: Aluminios del Sur Ltda.",
  montoPago: "Ej: 50000",
  comentarioPago: "Ej: Transferencia, abono inicial",
  motivo: "Ej: Pago registrado dos veces",
};

const LETRAS = "A-Za-zÁÉÍÓÚÜÑáéíóúüñ";

// Caracteres permitidos por tipo de campo (se evalúan de a uno al escribir).
export const PERMITIDOS = {
  nombre: new RegExp(`[${LETRAS} ]`),
  direccion: new RegExp(`[${LETRAS}0-9 .,#°/\\-]`),
  comentario: new RegExp(`[${LETRAS}0-9\\s.,:¿?¡!()°#$%+/\\-]`),
  email: /[A-Za-z0-9._%+\-@]/,
  telefono: /[0-9 +]/,
  username: /[A-Za-z0-9._-]/,
  empresa: new RegExp(`[${LETRAS}0-9 .,&\\-]`),
};

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/**
 * Quita los caracteres no permitidos. Devuelve { valor, mensaje }, donde
 * `mensaje` indica qué se quitó (vacío si no se quitó nada).
 */
export function filtrar(texto, permitido) {
  let valor = "";
  const quitados = new Set();
  for (const ch of texto) {
    if (permitido.test(ch)) valor += ch;
    else quitados.add(ch === " " ? "espacio" : ch);
  }
  const mensaje = quitados.size ? `No se permite: ${[...quitados].join(" ")}` : "";
  return { valor, mensaje };
}

const largo = (v) => v.trim().replace(/\s+/g, " ").length;

// Cada validador devuelve el mensaje de error o "" si el valor es válido.

export function validarNombre(v) {
  const n = largo(v);
  if (!n) return "El nombre es obligatorio.";
  if (n < LIMITES.nombreMin) return `Debe tener al menos ${LIMITES.nombreMin} caracteres.`;
  if (n > LIMITES.nombreMax) return `Debe tener como máximo ${LIMITES.nombreMax} caracteres.`;
  return "";
}

export function validarRut(v) {
  if (!v.trim()) return "El RUT es obligatorio.";
  return isValidRut(v) ? "" : "El RUT no es válido.";
}

export function validarEmail(v) {
  if (!v.trim()) return "";
  if (v.length > LIMITES.emailMax) return `Debe tener como máximo ${LIMITES.emailMax} caracteres.`;
  return EMAIL_RE.test(v.trim()) ? "" : "Ingresa un correo válido (ej: nombre@dominio.cl).";
}

export function validarDireccion(v) {
  const n = largo(v);
  if (!n) return "";
  if (n < LIMITES.direccionMin) return `Debe tener al menos ${LIMITES.direccionMin} caracteres.`;
  if (n > LIMITES.direccionMax) return `Debe tener como máximo ${LIMITES.direccionMax} caracteres.`;
  return "";
}

export function validarComentario(v) {
  return v.length > LIMITES.comentarioMax
    ? `Debe tener como máximo ${LIMITES.comentarioMax} caracteres.`
    : "";
}

export function validarDistancia(v, requiereTransporte) {
  if (!requiereTransporte) return "";
  if (String(v).trim() === "") return "Ingresa la distancia de transporte.";
  if (!/^\d+(\.\d)?$/.test(String(v))) return "Usa como máximo 1 decimal.";
  const n = Number(v);
  if (n < LIMITES.distanciaMin) return `Debe ser al menos ${LIMITES.distanciaMin} km.`;
  if (n > LIMITES.distanciaMax) return `Debe ser como máximo ${LIMITES.distanciaMax} km.`;
  return "";
}

export function validarMontoAgregado(v, comentario) {
  if (String(v).trim() === "") return "";
  if (!/^\d+$/.test(String(v))) return "Ingresa un número entero, sin negativos.";
  const n = Number(v);
  if (n > LIMITES.montoAgregadoMax) return "Debe ser como máximo $10.000.000.";
  if (n > 0 && !comentario.trim()) return "Agrega un comentario que explique el monto agregado.";
  return "";
}

function entero(v, min, max, mensaje) {
  if (!/^\d+$/.test(String(v))) return "Ingresa un número entero.";
  const n = Number(v);
  return n < min || n > max ? mensaje : "";
}

export const validarDimension = (v) =>
  entero(
    v,
    LIMITES.dimensionMin,
    LIMITES.dimensionMax,
    `Debe estar entre ${LIMITES.dimensionMin} y ${LIMITES.dimensionMax} mm.`
  );

export const validarCantidad = (v) =>
  entero(
    v,
    LIMITES.cantidadMin,
    LIMITES.cantidadMax,
    `Debe estar entre ${LIMITES.cantidadMin} y ${LIMITES.cantidadMax}.`
  );

export function validarTelefono(v) {
  const t = v.trim();
  if (!t) return "";
  if (!/^\+?[0-9 ]+$/.test(t))
    return "Solo se permiten números, espacios y un + al inicio (ej: +56 9 1234 5678).";
  const digitos = t.replace(/\D/g, "").length;
  if (digitos < LIMITES.telefonoDigitosMin || digitos > LIMITES.telefonoDigitosMax)
    return `Debe tener entre ${LIMITES.telefonoDigitosMin} y ${LIMITES.telefonoDigitosMax} dígitos.`;
  return "";
}

// Mismo formato de número que los mensajes del backend (10.000.000 / 0.5).
const fmt = (n) => (Number.isInteger(n) ? n.toLocaleString("es-CL") : String(n));

/** Valida un número del catálogo según su regla de REGLAS. */
export function validarNumero(v, regla) {
  const s = String(v ?? "").trim();
  if (s === "") return "Este campo es obligatorio.";
  if (!/^\d+(\.\d+)?$/.test(s)) return "Ingresa un número válido, sin negativos.";
  const decimales = (s.split(".")[1] || "").length;
  if (decimales > regla.decimales)
    return regla.decimales === 0
      ? "Ingresa un número entero."
      : `Usa como máximo ${regla.decimales} decimales.`;
  const n = Number(s);
  if (regla.mayorQueCero) return n > 0 ? "" : "Debe ser mayor que 0.";
  if (regla.cero && n === 0) return "";
  if (n < regla.min || n > regla.max) {
    const u = regla.unidad ? ` ${regla.unidad}` : "";
    const extra = regla.cero ? " (o 0 si aún no se configura)" : "";
    return `Debe estar entre ${fmt(regla.min)} y ${fmt(regla.max)}${u}${extra}.`;
  }
  return "";
}

/**
 * Pago de un proyecto: monto entero mayor que 0 y hasta el saldo pendiente;
 * fecha no futura ni anterior a la cotización; comentario opcional.
 * fechas en formato "YYYY-MM-DD".
 */
export function validarPago({ monto, fecha, comentario }, { saldo, fechaMin, hoy }) {
  const s = String(monto ?? "").trim();
  let errMonto = "";
  if (!/^\d+$/.test(s)) errMonto = "Ingresa un monto entero, sin negativos.";
  else if (Number(s) <= 0) errMonto = "Debe ser mayor que 0.";
  else if (Number(s) > saldo) errMonto = `Supera el saldo pendiente ($${fmt(saldo)}).`;

  let errFecha = "";
  if (!fecha) errFecha = "Ingresa la fecha del pago.";
  else if (fecha > hoy) errFecha = "La fecha no puede ser futura.";
  else if (fecha < fechaMin) errFecha = "No puede ser anterior a la cotización.";

  return soloErrores({
    monto: errMonto,
    fecha: errFecha,
    comentario:
      comentario.length > LIMITES.pagoComentarioMax
        ? `Debe tener como máximo ${LIMITES.pagoComentarioMax} caracteres.`
        : "",
  });
}

export function validarMotivo(v) {
  const n = largo(v);
  if (!n) return "Indica el motivo de la anulación.";
  if (n < LIMITES.motivoMin) return `Debe tener al menos ${LIMITES.motivoMin} caracteres.`;
  if (n > LIMITES.pagoComentarioMax)
    return `Debe tener como máximo ${LIMITES.pagoComentarioMax} caracteres.`;
  return "";
}

function rangoLargo(v, min, max, obligatorio) {
  const n = largo(v);
  if (!n) return obligatorio;
  if (n < min) return `Debe tener al menos ${min} caracteres.`;
  if (n > max) return `Debe tener como máximo ${max} caracteres.`;
  return "";
}

export const validarUsername = (v) =>
  rangoLargo(v, LIMITES.usernameMin, LIMITES.usernameMax, "El nombre de usuario es obligatorio.");

export const validarPersona = (v, campo = "nombre") =>
  rangoLargo(v, LIMITES.personaMin, LIMITES.personaMax, `El ${campo} es obligatorio.`);

export const validarEmpresaNombre = (v) =>
  rangoLargo(
    v,
    LIMITES.empresaNombreMin,
    LIMITES.empresaNombreMax,
    "El nombre de la empresa es obligatorio."
  );

/** RUT opcional (empresas): vacío o válido. */
export const validarRutOpcional = (v) => (v.trim() ? validarRut(v) : "");

/**
 * Contraseña: largo mínimo y no solo números. El backend aplica además las
 * reglas de Django (no muy común, no parecida al usuario).
 */
export function validarClave(clave, confirmacion) {
  if (!clave) return { password: "La contraseña es obligatoria." };
  if (clave.length < LIMITES.claveMin)
    return { password: `Debe tener al menos ${LIMITES.claveMin} caracteres.` };
  if (/^\d+$/.test(clave)) return { password: "No puede ser solo números." };
  if (clave !== confirmacion) return { confirmacion: "Las contraseñas no coinciden." };
  return {};
}

/** Quita entradas vacías: { a: "", b: "x" } -> { b: "x" } */
export const soloErrores = (e) =>
  Object.fromEntries(Object.entries(e).filter(([, v]) => v));
