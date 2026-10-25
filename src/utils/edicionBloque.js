import { esConflicto, parseApiError } from "./errors";

export const ERROR_PARCIAL = "Algunos valores no se guardaron. Revisa los campos marcados.";
export const CONFLICTO =
  "Otro usuario cambió algunos de estos valores mientras editabas: se muestran sus " +
  "valores actuales (marcados). Revísalos y vuelve a guardar si corresponde.";

// Edición en bloque (Precios): detección de cambios por celda y guardado
// de las filas modificadas con control de versión.
//
// Cada pestaña describe sus filas editables con `recorrer(data, fn)`, que
// llama fn(tipo, fila, campos) por cada fila, p. ej.
// fn("insumo", fila, ["precio_paquete", "cantidad_paquete"]). La clave de una
// fila es "<tipo>.<id>" y la de una celda "<tipo>.<id>.<campo>".
//
// Al guardar solo se envían las filas modificadas, cada una con la `version`
// que se cargó. Si otro usuario la cambió entre medio, la API responde 409 y
// se muestra su valor actual en vez de pisarlo (control de concurrencia).

export const claveFila = (tipo, fila) => `${tipo}.${fila.id}`;

export function valoresCeldas(data, recorrer) {
  const celdas = {};
  recorrer(data, (tipo, fila, campos) =>
    campos.forEach((c) => {
      celdas[`${claveFila(tipo, fila)}.${c}`] = String(fila[c] ?? "");
    })
  );
  return celdas;
}

/** { "<tipo>.<id>": ["campo", ...] } con los campos que difieren de la base. */
export function cambiosPorFila(base, draft, recorrer) {
  const antes = valoresCeldas(base, recorrer);
  const cambios = {};
  Object.entries(valoresCeldas(draft, recorrer)).forEach(([k, v]) => {
    if (antes[k] === v) return;
    const i = k.lastIndexOf(".");
    (cambios[k.slice(0, i)] ||= []).push(k.slice(i + 1));
  });
  return cambios;
}

/** Copia de `data` con los valores de `celdas` ({ clave: valor }) aplicados. */
export function aplicarCeldas(data, celdas, recorrer) {
  const n = structuredClone(data);
  recorrer(n, (tipo, fila, campos) =>
    campos.forEach((c) => {
      const k = `${claveFila(tipo, fila)}.${c}`;
      if (k in celdas) fila[c] = celdas[k];
    })
  );
  return n;
}

/** Operación de guardado de una fila modificada (ver guardarEnBloque). */
export const opFila = (tipo, fila, campos, cambios, run, fase = 0) => ({
  clave: claveFila(tipo, fila),
  campos,
  cambiados: cambios[claveFila(tipo, fila)],
  valores: fila,
  run,
  fase,
});

/**
 * Ejecuta los guardados y reúne los errores por celda. Las ops de una misma
 * fase van en paralelo; las fases, en orden (0, 1, ...).
 * Devuelve { errores: { "insumo.3.precio_paquete": "…" }, general, filasConError }
 * donde filasConError son las filas rechazadas por validación (no por conflicto).
 */
export async function guardarEnBloque(ops) {
  const fases = [...new Set(ops.map((o) => o.fase))].sort();
  const resultados = new Map();
  for (const fase of fases) {
    const delaFase = ops.filter((o) => o.fase === fase);
    const res = await Promise.allSettled(delaFase.map((o) => o.run()));
    delaFase.forEach((o, i) => resultados.set(o, res[i]));
  }

  const errores = {};
  const generales = new Set();
  const filasConError = new Set();
  let hayConflicto = false;
  ops.forEach((op) => {
    const r = resultados.get(op);
    if (r.status !== "rejected") return;
    if (esConflicto(r.reason)) {
      // Otro usuario cambió la fila: se marca cada campo que se intentó cambiar.
      hayConflicto = true;
      const { general } = parseApiError(r.reason);
      op.cambiados.forEach((c) => {
        errores[`${op.clave}.${c}`] = `${general} Tu valor (${op.valores[c]}) no se guardó.`;
      });
      return;
    }
    filasConError.add(op.clave);
    const { general, campos } = parseApiError(r.reason, {
      fallback: "No se pudo guardar.",
      visibles: op.campos,
    });
    Object.entries(campos).forEach(([campo, msg]) => {
      errores[`${op.clave}.${campo}`] = msg;
    });
    if (general) generales.add(general);
  });
  if (hayConflicto) generales.add(CONFLICTO);
  if (filasConError.size) generales.add(ERROR_PARCIAL);
  return { errores, general: [...generales].join(" "), filasConError };
}

