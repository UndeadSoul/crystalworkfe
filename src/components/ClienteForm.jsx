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
  validarNombre,
  validarRut,
  validarTelefono,
} from "../utils/validacion";
import { FieldError, FormError } from "./FormErrors";
import { BotonCarga } from "./Loader";

const EMPTY = { nombre: "", rut: "", telefono: "", email: "", direccion: "" };
const CAMPOS = Object.keys(EMPTY);

// Caracteres permitidos por campo.
const FILTROS = {
  nombre: PERMITIDOS.nombre,
  telefono: PERMITIDOS.telefono,
  email: PERMITIDOS.email,
  direccion: PERMITIDOS.direccion,
};

function ClienteForm({ initial, onSubmit, onClose }) {
  const [form, setForm] = useState({ ...EMPTY, ...(initial || {}) });
  const [saving, setSaving] = useState(false);
  const [errores, setErrores] = useState({});
  const [general, setGeneral] = useState("");

  const isEdit = Boolean(initial && initial.id);

  // Al escribir se quitan los caracteres no permitidos; si se quitó alguno,
  // se avisa debajo del campo. Si no, se limpia el error del campo.
  const setCampo = (field, value, aviso = "") => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrores((prev) => ({ ...prev, [field]: aviso }));
  };

  const change = (field) => (e) => {
    const { valor, mensaje } = filtrar(e.target.value, FILTROS[field]);
    setCampo(field, valor, mensaje);
  };
  const changeRut = (e) => setCampo("rut", formatRut(e.target.value));

  const validar = () =>
    soloErrores({
      nombre: validarNombre(form.nombre),
      rut: validarRut(form.rut),
      telefono: validarTelefono(form.telefono),
      email: validarEmail(form.email),
      direccion: validarDireccion(form.direccion),
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneral("");
    const locales = validar();
    setErrores(locales);
    if (Object.keys(locales).length) return;

    setSaving(true);
    try {
      await onSubmit({
        nombre: form.nombre.trim(),
        rut: form.rut,
        telefono: form.telefono.trim(),
        email: form.email.trim(),
        direccion: form.direccion.trim(),
      });
    } catch (err) {
      const { general: g, campos } = parseApiError(err, {
        fallback: "No se pudo guardar el cliente.",
        visibles: CAMPOS,
      });
      setErrores(campos);
      setGeneral(g);
      setSaving(false);
    }
  };

  const input = (field, props = {}) => (
    <input
      value={form[field]}
      onChange={change(field)}
      aria-invalid={Boolean(errores[field])}
      {...props}
    />
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
          <h2>{isEdit ? "Editar cliente" : "Nuevo cliente"}</h2>
          <button type="button" className="icon-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <label className="field">
          <span>Nombre *</span>
          {input("nombre", { maxLength: LIMITES.nombreMax, placeholder: EJEMPLOS.nombreCliente })}
          <FieldError msg={errores.nombre} />
        </label>

        <div className="field-row">
          <label className="field">
            <span>RUT *</span>
            <input
              value={form.rut}
              onChange={changeRut}
              maxLength={12}
              placeholder={EJEMPLOS.rut}
              aria-invalid={Boolean(errores.rut)}
            />
            <FieldError msg={errores.rut} />
          </label>
          <label className="field">
            <span>Teléfono</span>
            {input("telefono", {
              type: "tel",
              maxLength: LIMITES.telefonoMax,
              placeholder: EJEMPLOS.telefono,
            })}
            <FieldError msg={errores.telefono} />
          </label>
        </div>

        <label className="field">
          <span>Email</span>
          {input("email", { type: "email", maxLength: LIMITES.emailMax, placeholder: EJEMPLOS.email })}
          <FieldError msg={errores.email} />
        </label>

        <label className="field">
          <span>Dirección</span>
          {input("direccion", { maxLength: LIMITES.direccionMax, placeholder: EJEMPLOS.direccion })}
          <FieldError msg={errores.direccion} />
        </label>

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

export default ClienteForm;
