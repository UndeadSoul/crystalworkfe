import { useState } from "react";
import { parseApiError } from "../utils/errors";
import { blockExponentKey, blockNonIntegerKey } from "../utils/format";
import { validarNumero } from "../utils/validacion";
import { FieldError, FormError } from "./FormErrors";
import { BotonCarga } from "./Loader";

/**
 * Modal de formulario genérico para el catálogo.
 * fields: [{ name, label, type: "text"|"number"|"select", options?, regla?, required?, readOnly? }]
 *   regla: regla numérica de REGLAS (utils/validacion) con rango y decimales.
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
  const [errores, setErrores] = useState({});
  const [general, setGeneral] = useState("");

  const change = (name) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrores((prev) => (prev[name] ? { ...prev, [name]: "" } : prev));
  };

  const validar = () => {
    const e = {};
    fields.forEach((f) => {
      if (f.required && String(form[f.name]).trim() === "") {
        e[f.name] = "Este campo es obligatorio.";
      } else if (f.regla) {
        const msg = validarNumero(form[f.name], f.regla);
        if (msg) e[f.name] = msg;
      }
    });
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneral("");
    const locales = validar();
    setErrores(locales);
    if (Object.keys(locales).length) return;

    setSaving(true);
    try {
      await onSubmit(form);
    } catch (err) {
      const { general: g, campos } = parseApiError(err, {
        fallback: "No se pudo guardar.",
        visibles: fields.map((f) => f.name),
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
                disabled={f.readOnly}
                aria-invalid={Boolean(errores[f.name])}
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
                min={f.regla ? 0 : undefined}
                max={f.regla?.max}
                step={f.regla ? (f.regla.decimales ? 10 ** -f.regla.decimales : 1) : undefined}
                placeholder={f.placeholder ?? f.regla?.ejemplo}
                value={form[f.name]}
                onChange={change(f.name)}
                onKeyDown={
                  f.type !== "number"
                    ? undefined
                    : f.regla?.decimales === 0
                      ? blockNonIntegerKey
                      : blockExponentKey
                }
                readOnly={f.readOnly}
                aria-invalid={Boolean(errores[f.name])}
              />
            )}
            <FieldError msg={errores[f.name]} />
          </label>
        ))}

        <FormError msg={general} />

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <BotonCarga type="submit" cargando={saving}>
            Guardar
          </BotonCarga>
        </div>
      </form>
    </div>
  );
}

export default CatalogModal;
