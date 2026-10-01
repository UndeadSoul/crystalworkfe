import { useState } from "react";

const EMPTY = { nombre: "", rut: "", telefono: "", email: "", direccion: "" };

function ClienteForm({ initial, onSubmit, onClose }) {
  const [form, setForm] = useState({ ...EMPTY, ...(initial || {}) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = Boolean(initial && initial.id);

  const change = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
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
          <input value={form.nombre} onChange={change("nombre")} required />
        </label>

        <div className="field-row">
          <label className="field">
            <span>RUT</span>
            <input value={form.rut} onChange={change("rut")} />
          </label>
          <label className="field">
            <span>Teléfono</span>
            <input value={form.telefono} onChange={change("telefono")} />
          </label>
        </div>

        <label className="field">
          <span>Email</span>
          <input type="email" value={form.email} onChange={change("email")} />
        </label>

        <label className="field">
          <span>Dirección</span>
          <input value={form.direccion} onChange={change("direccion")} />
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
