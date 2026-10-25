import { useState } from "react";
import { parseApiError } from "../utils/errors";
import { LIMITES, PERMITIDOS, filtrar, validarMotivo } from "../utils/validacion";
import { FieldError, FormError } from "./FormErrors";
import { BotonCarga } from "./Loader";

/**
 * Confirmar una acción que exige un motivo (queda en el historial): anular un
 * pago, cancelar un proyecto…
 *   onConfirmar(motivo): async; si falla, el error se muestra en el modal.
 *   campo: nombre del campo del motivo en la API (para ubicar su error).
 */
function MotivoModal({
  titulo,
  children,
  placeholder,
  textoBoton,
  textoCargando = "Guardando…",
  campo = "motivo",
  onConfirmar,
  onClose,
}) {
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [general, setGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);

  const confirmar = async (e) => {
    e.preventDefault();
    setGeneral("");
    const msg = validarMotivo(motivo);
    setError(msg);
    if (msg) return;
    setGuardando(true);
    try {
      await onConfirmar(motivo.trim());
    } catch (err) {
      const { general: g, campos } = parseApiError(err, {
        fallback: "No se pudo completar la acción.",
        visibles: [campo],
      });
      setError(campos[campo] || "");
      setGeneral(g);
      setGuardando(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={confirmar}
        noValidate
      >
        <div className="modal-head">
          <h2>{titulo}</h2>
          <button type="button" className="icon-btn" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
        <label className="field">
          <span>Motivo *</span>
          <input
            value={motivo}
            maxLength={LIMITES.pagoComentarioMax}
            placeholder={placeholder}
            aria-invalid={Boolean(error)}
            autoFocus
            onChange={(e) => {
              const { valor, mensaje } = filtrar(e.target.value, PERMITIDOS.comentario);
              setMotivo(valor);
              setError(mensaje);
            }}
          />
          <FieldError msg={error} />
        </label>
        <FormError msg={general} />
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <BotonCarga
            type="submit"
            className="btn btn-danger"
            cargando={guardando}
            texto={textoCargando}
          >
            {textoBoton}
          </BotonCarga>
        </div>
      </form>
    </div>
  );
}

export default MotivoModal;
