import { useState } from "react";
import { formatRut, isValidRut } from "../utils/rut";

const EMPTY = { nombre: "", rut: "", telefono: "", email: "", direccion: "" };

function ClienteForm({ initial, onSubmit, onClose }) {
  const [form, setForm] = useState({ ...EMPTY, ...(initial || {}) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = Boolean(initial && initial.id);

  const change = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const changeRut = (e) =>
    setForm((prev) => ({ ...prev, rut: formatRut(e.target.value) }));

  const rutInvalido = Boolean(form.rut) && !isValidRut(form.rut);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rutInvalido) {
      setError("El RUT no es válido.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await onSubmit({
        nombre: form.nombre,
        rut: form.rut,
        telefono: form.telefono,
        email: form.email,
        direccion: form.direccion,
      });
    } catch (err) {
      const data = err.response ? err.response.data : null;
      setError(
        data ? Object.values(data).flat().join(" ") : "No se pudo guardar el cliente."
      );
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="modal-head">
          <h2>{isEdit ? "Editar cliente" : "Nuevo cliente"}</h2>
          <button type="button" className="icon-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <label className="field">
          <span>Nombre *</span>
          <input value={form.nombre} onChange={change("nombre")} maxLength={100} required />
        </label>

        <div className="field-row">
          <label className="field">
            <span>RUT</span>
            <input
              value={form.rut}
              onChange={changeRut}
              maxLength={12}
              placeholder="12.345.678-9"
              aria-invalid={rutInvalido}
            />
            {rutInvalido && <small className="field-error">RUT inválido</small>}
          </label>
          <label className="field">
            <span>Teléfono</span>
            <input value={form.telefono} onChange={change("telefono")} maxLength={30} />
          </label>
        </div>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={form.email}
            onChange={change("email")}
            maxLength={100}
          />
        </label>

        <label className="field">
          <span>Dirección</span>
          <input value={form.direccion} onChange={change("direccion")} maxLength={100} />
        </label>

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ClienteForm;
