import { useState } from "react";

/**
 * Modal de formulario genérico para el catálogo.
 * fields: [{ name, label, type: "text"|"number"|"select", options?, step?, required?, readOnly? }]
 */
function CatalogModal({ title, fields, initial, onSubmit, onClose }) {
  const [form, setForm] = useState(() => {
    const f = {};
    fields.forEach((x) => {
      const v = initial ? initial[x.name] : undefined;
      f[x.name] = v !== undefined && v !== null ? v : x.default ?? "";
    });
    return f;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const change = (name) => (e) =>
    setForm((prev) => ({ ...prev, [name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSubmit(form);
    } catch (err) {
      const data = err.response ? err.response.data : null;
      setError(
        data
          ? Object.entries(data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" ") : v}`)
              .join(" · ")
          : "No se pudo guardar."
      );
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {fields.map((f) => (
          <label className="field" key={f.name}>
            <span>
              {f.label}
              {f.required ? " *" : ""}
            </span>
            {f.type === "select" ? (
              <select
                value={form[f.name]}
                onChange={change(f.name)}
                required={f.required}
                disabled={f.readOnly}
              >
                <option value="">— Selecciona —</option>
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={f.type || "text"}
                step={f.step}
                value={form[f.name]}
                onChange={change(f.name)}
                required={f.required}
                readOnly={f.readOnly}
              />
            )}
          </label>
        ))}

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

export default CatalogModal;
