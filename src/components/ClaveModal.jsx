import { useState } from "react";
import { parseApiError } from "../utils/errors";
import { EJEMPLOS, LIMITES, validarClave } from "../utils/validacion";
import { FieldError, FormError } from "./FormErrors";
import { BotonCarga } from "./Loader";

/** Asignar una nueva contraseña a un usuario (la define el jefe o el admin). */
function ClaveModal({ usuario, onSubmit, onClose }) {
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [saving, setSaving] = useState(false);
  const [errores, setErrores] = useState({});
  const [general, setGeneral] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneral("");
    const locales = validarClave(password, confirmacion);
    setErrores(locales);
    if (Object.keys(locales).length) return;

    setSaving(true);
    try {
      await onSubmit(password);
    } catch (err) {
      const { general: g, campos } = parseApiError(err, {
        fallback: "No se pudo cambiar la contraseña.",
        visibles: ["password"],
      });
      setErrores(campos);
      setGeneral(g);
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="modal-head">
          <h2>Cambiar contraseña</h2>
          <button type="button" className="icon-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <p className="muted">
          Nueva contraseña para <strong>{usuario.username}</strong>. Comunícasela al
          usuario.
        </p>

        <label className="field">
          <span>Nueva contraseña *</span>
          <input
            type="password"
            autoComplete="new-password"
            placeholder={EJEMPLOS.clave}
            value={password}
            aria-invalid={Boolean(errores.password)}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrores((x) => ({ ...x, password: "" }));
            }}
          />
          <FieldError msg={errores.password} />
        </label>
        <label className="field">
          <span>Repetir contraseña *</span>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Repite la contraseña"
            value={confirmacion}
            aria-invalid={Boolean(errores.confirmacion)}
            onChange={(e) => {
              setConfirmacion(e.target.value);
              setErrores((x) => ({ ...x, confirmacion: "" }));
            }}
          />
          <FieldError msg={errores.confirmacion} />
        </label>
        <p className="muted small">
          Mínimo {LIMITES.claveMin} caracteres, no solo números, ni muy común o
          parecida al nombre de usuario.
        </p>

        <FormError msg={general} />

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <BotonCarga type="submit" cargando={saving}>
            Cambiar contraseña
          </BotonCarga>
        </div>
      </form>
    </div>
  );
}

export default ClaveModal;
