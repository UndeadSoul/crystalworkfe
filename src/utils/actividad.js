// Contador global de peticiones en curso (lo alimentan los interceptores de
// api.js). La barra de carga solo se muestra si una petición tarda más de
// RETARDO_MS, para no parpadear en respuestas instantáneas.

const RETARDO_MS = 150;

let enCurso = 0;
let visible = false;
let timer = null;
const oyentes = new Set();

function emitir(valor) {
  if (visible === valor) return;
  visible = valor;
  oyentes.forEach((fn) => fn());
}

export function inicioPeticion() {
  enCurso += 1;
  if (enCurso === 1 && !timer) {
    timer = setTimeout(() => {
      timer = null;
      if (enCurso > 0) emitir(true);
    }, RETARDO_MS);
  }
}

export function finPeticion() {
  enCurso = Math.max(0, enCurso - 1);
  if (enCurso === 0) {
    clearTimeout(timer);
    timer = null;
    emitir(false);
  }
}

export function suscribir(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

export function hayActividad() {
  return visible;
}
