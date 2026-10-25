import { useState } from "react";
import { formatRut } from "../utils/rut";
import { parseApiError } from "../utils/errors";
import {
  EJEMPLOS,
  LIMITES,
  PERMITIDOS,
  filtrar,
  soloErrores,
  validarDireccion,
  validarEmail,
  validarEmpresaNombre,
  validarRutOpcional,
  validarTelefono,
} from "../utils/validacion";
import { FieldError, FormError } from "./FormErrors";
import { BotonCarga } from "./Loader";

const EMPTY = { nombre: "", rut: "", direccion: "", telefono: "", email: "" };

const FILTROS = {
  nombre: PERMITIDOS.empresa,
  direccion: PERMITIDOS.direccion,
  telefono: PERMITIDOS.telefono,
  email: PERMITIDOS.email,
};

/** Crear / editar una empresa (solo administrador del sistema). */
function EmpresaForm({ initial, onSubmit, onClose }) {
  const isEdit = Boolean(initial && initial.id);
  const [form, setForm] = useState(() => {
    const f = { ...EMPTY };
    Object.keys(EMPTY).forEach((k) => {
      if (initial?.[k]) f[k] = initial[k];
    });
    return f;
  });
  const [saving, setSaving] = useState(false);
  const [errores, setErrores] = useState({});
  const [general, setGeneral] = useState("");

  const set = (campo, valor, aviso = "") => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: aviso }));
  };

  const change = (campo) => (e) => {
    if (campo === "rut") return set("rut", formatRut(e.target.value));
    const { valor, mensaje } = filtrar(e.target.value, FILTROS[campo]);
    set(campo, valor, mensaje);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneral("");
    const locales = soloErrores({
      nombre: validarEmpresaNombre(form.nombre),
      rut: validarRutOpcional(form.rut),
      direccion: validarDireccion(form.direccion),
      telefono: validarTelefono(form.telefono),
      email: validarEmail(form.email),
    });
    setErrores(locales);
    if (Object.keys(locales).length) return;

    setSaving(true);
    try {
      await onSubmit(
        Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()]))
      );
    } catch (err) {
      const { general: g, campos } = parseApiError(err, {
        fallback: "No se pudo guardar la empresa.",
        visibles: Object.keys(EMPTY),
      });
      setErrores(campos);
      setGeneral(g);
      setSaving(false);
    }
  };

  const input = (campo, label, props = {}) => (
    <label className="field">
      <span>{label}</span>
      <input
        value={form[campo]}
        onChange={change(campo)}
        aria-invalid={Boolean(errores[campo])}
        {...props}
      />
      <FieldError msg={errores[campo]} />
    </label>
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="modal-head">
          <h2>{isEdit ? "Editar empresa" : "Nueva empresa"}</h2>
          <button type="button" className="icon-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {input("nombre", "Nombre *", { maxLength: LIMITES.empresaNombreMax, placeholder: EJEMPLOS.empresa })}
        <div className="field-row">
          {input("rut", "RUT", { maxLength: 12, placeholder: EJEMPLOS.rutEmpresa })}
          {input("telefono", "Teléfono", {
            type: "tel",
            maxLength: LIMITES.telefonoMax,
            placeholder: EJEMPLOS.telefono,
          })}
        </div>
        {input("email", "Email", { type: "email", maxLength: LIMITES.emailMax, placeholder: EJEMPLOS.email })}
        {input("direccion", "Dirección", { maxLength: LIMITES.direccionMax, placeholder: EJEMPLOS.direccion })}

        {!isEdit && (
          <p className="muted small">
            Al crearla se genera su catálogo de precios (series, perfiles e insumos)
            vacío, para que su jefe lo complete.
          </p>
        )}

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

export default EmpresaForm;
