import { createContext, useCallback, useContext, useMemo, useState } from "react";

// Feedback de interfaz unificado:
//   - useConfirm(): diálogo de confirmación estilizado (reemplaza window.confirm).
//     Devuelve una promesa que resuelve a true/false.
//       const confirm = useConfirm();
//       if (await confirm({ titulo, mensaje, textoConfirmar, peligro })) { ... }
//   - useToast(): avisos breves (éxito/error/info) que se desvanecen solos.
//       const toast = useToast();
//       toast.success("Guardado");  toast.error("No se pudo eliminar.");
//
// Un solo proveedor (UIProvider) monta ambos y se coloca cerca de la raíz.

const Ctx = createContext(null);

export function useConfirm() {
  return useContext(Ctx).confirm;
}

export function useToast() {
  return useContext(Ctx).toast;
}

let siguienteId = 0;

function ConfirmDialog({
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  peligro = false,
  onResolver,
}) {
  // Igual que el resto de modales: se cierra solo con los botones (no al
  // pulsar fuera). El foco inicial va a "Cancelar" (opción segura).
  return (
    <div className="modal-backdrop">
      <div className="modal modal-confirm" role="alertdialog" aria-modal="true">
        <div className="modal-head">
          <h2>{titulo}</h2>
        </div>
        {mensaje && <p className="confirm-msg">{mensaje}</p>}
        <div className="modal-actions">
          <button className="btn btn-ghost" autoFocus onClick={() => onResolver(false)}>
            {textoCancelar}
          </button>
          <button
            className={`btn ${peligro ? "btn-danger" : "btn-primary"}`}
            onClick={() => onResolver(true)}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

export function UIProvider({ children }) {
  // --- Confirmación ---
  const [dialogo, setDialogo] = useState(null); // { opciones, resolver } | null
  const confirm = useCallback((opciones) => {
    return new Promise((resolver) => setDialogo({ opciones, resolver }));
  }, []);
  const resolverDialogo = useCallback((valor) => {
    setDialogo((d) => {
      d?.resolver(valor);
      return null;
    });
  }, []);

  // --- Toasts ---
  const [toasts, setToasts] = useState([]);
  const quitar = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback(
    (tipo, mensaje, duracion) => {
      const id = ++siguienteId;
      setToasts((t) => [...t, { id, tipo, mensaje }]);
      if (duracion) setTimeout(() => quitar(id), duracion);
    },
    [quitar]
  );
  const toast = useMemo(
    () => ({
      success: (m) => push("success", m, 4000),
      error: (m) => push("error", m, 6000),
      info: (m) => push("info", m, 4000),
    }),
    [push]
  );

  const value = useMemo(() => ({ confirm, toast }), [confirm, toast]);
  const iconos = { success: "✓", error: "✕", info: "i" };

  return (
    <Ctx.Provider value={value}>
      {children}
      {dialogo && <ConfirmDialog {...dialogo.opciones} onResolver={resolverDialogo} />}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`toast toast-${t.tipo}`}
            onClick={() => quitar(t.id)}
            title="Descartar"
          >
            <span className="toast-icon" aria-hidden="true">
              {iconos[t.tipo]}
            </span>
            <span>{t.mensaje}</span>
          </button>
        ))}
      </div>
    </Ctx.Provider>
  );
}
