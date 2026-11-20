// Posposición de alertas, guardada SOLO en este navegador (localStorage).
// No viaja al servidor: cada equipo recuerda sus propias alertas pospuestas.
// Estructura: { [clave]: epochMillisHasta }

import { notificarCambioAlertas } from "../services/alertas";

const KEY = "alertas_pospuestas";
const DIA_MS = 86_400_000;

function leer() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

function escribir(obj) {
  try {
    localStorage.setItem(KEY, JSON.stringify(obj));
  } catch {
    // Sin almacenamiento (ventana privada): la posposición vale para la sesión.
  }
}

// Devuelve las posposiciones vigentes y, de paso, limpia las vencidas.
export function vigentes(ahora = Date.now()) {
  const data = leer();
  let cambio = false;
  for (const clave of Object.keys(data)) {
    if (data[clave] <= ahora) {
      delete data[clave];
      cambio = true;
    }
  }
  if (cambio) escribir(data);
  return data;
}

export function posponer(clave, dias) {
  const data = vigentes();
  data[clave] = Date.now() + dias * DIA_MS;
  escribir(data);
  notificarCambioAlertas();
}

export function reactivar(clave) {
  const data = vigentes();
  delete data[clave];
  escribir(data);
  notificarCambioAlertas();
}

// Separa las alertas en visibles y pospuestas según lo guardado localmente.
export function separar(alertas, ahora = Date.now()) {
  const sil = vigentes(ahora);
  const visibles = [];
  const pospuestas = [];
  for (const a of alertas) {
    (sil[a.clave] ? pospuestas : visibles).push(a);
  }
  return { visibles, pospuestas };
}
