// Utilidades de RUT chileno (formato y validación módulo 11).

export function cleanRut(value) {
  return value.replace(/[^0-9kK]/g, "").toUpperCase();
}

export function formatRut(value) {
  const c = cleanRut(value).slice(0, 9); // hasta 8 dígitos + DV
  if (c.length <= 1) return c;
  const cuerpo = c.slice(0, -1);
  const dv = c.slice(-1);
  const conPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${conPuntos}-${dv}`;
}

function digitoVerificador(cuerpo) {
  let suma = 0;
  let mult = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * mult;
    mult = mult === 7 ? 2 : mult + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return "0";
  if (resto === 10) return "K";
  return String(resto);
}

export function isValidRut(value) {
  const c = cleanRut(value);
  if (c.length < 2) return false;
  const cuerpo = c.slice(0, -1);
  const dv = c.slice(-1);
  if (!/^\d+$/.test(cuerpo)) return false;
  return digitoVerificador(cuerpo) === dv;
}
