import { useState } from "react";
import { parseApiError } from "../utils/errors";
import {
  EJEMPLOS,
  LIMITES,
  PERMITIDOS,
  filtrar,
  soloErrores,
  validarClave,
  validarEmail,
  validarPersona,
  validarTelefono,
  validarUsername,
} from "../utils/validacion";
import { ROLES_USUARIO } from "../services/usuarios";
import { FieldError, FormError } from "./FormErrors";
import { BotonCarga } from "./Loader";

const EMPTY = {
  username: "",
  first_name: "",
  last_name: "",
  email: "",
  telefono: "",
  empresa: "",
  rol: "",
  password: "",
  confirmacion: "",
};

const FILTROS = {
  username: PERMITIDOS.username,
  first_name: PERMITIDOS.nombre,
  last_name: PERMITIDOS.nombre,
  email: PERMITIDOS.email,
  telefono: PERMITIDOS.telefono,
};

/**
 * Crear / editar un usuario.
 * esAdmin: el administrador elige empresa (solo al crear) y rol; el jefe
 *          siempre crea operarios de su empresa (lo fija el servidor).
 * empresas: opciones de empresa (solo admin).
 */
function UsuarioForm({ initial, esAdmin, empresas = [], empresaInicial = "", onSubmit, onClose }) {
  const isEdit = Boolean(initial && initial.id);
  const [form, setForm] = useState(() => ({
    ...EMPTY,
    empresa: empresaInicial,
    ...(initial
      ? {
          ...initial,
          email: initial.email || "",
          telefono: initial.telefono || "",
          empresa: String(initial.empresa ?? ""),
          rol: initial.rol || "",
        }
      : {}),
  }));
  const [saving, setSaving] = useState(false);
  const [errores, setErrores] = useState({});
  const [general, setGeneral] = useState("");

  const set = (campo, valor, aviso = "") => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: aviso }));
  };

  const change = (campo) => (e) => {
    if (!FILTROS[campo]) return set(campo, e.target.value);
    const { valor, mensaje } = filtrar(e.target.value, FILTROS[campo]);
    set(campo, valor, mensaje);
  };

  const validar = () => ({
    ...soloErrores({
      username: validarUsername(form.username),
      first_name: validarPersona(form.first_name, "nombre"),
      last_name: validarPersona(form.last_name, "apellido"),
      email: validarEmail(form.email),
      telefono: validarTelefono(form.telefono),
      empresa: esAdmin && !isEdit && !form.empresa ? "Selecciona la empresa." : "",
      rol: esAdmin && !form.rol ? "Selecciona el rol." : "",
    }),
    ...(isEdit ? {} : validarClave(form.password, form.confirmacion)),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneral("");
    const locales = validar();
    setErrores(locales);
    if (Object.keys(locales).length) return;

    const data = {
      username: form.username.trim(),
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      telefono: form.telefono.trim(),
    };
    if (esAdmin) data.rol = form.rol;
    if (esAdmin && !isEdit) data.empresa = Number(form.empresa);
    if (!isEdit) data.password = form.password;

    setSaving(true);
    try {
      await onSubmit(data);
    } catch (err) {
      const { general: g, campos } = parseApiError(err, {
        fallback: "No se pudo guardar el usuario.",
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

  const select = (campo, label, opciones, props = {}) => (
    <label className="field">
      <span>{label}</span>
      <select
        value={form[campo]}
        onChange={change(campo)}
        aria-invalid={Boolean(errores[campo])}
        {...props}
      >
        <option value="">— Selecciona —</option>
        {opciones.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <FieldError msg={errores[campo]} />
    </label>
  );

  const titulo = isEdit
    ? "Editar usuario"
    : esAdmin
      ? "Nuevo usuario"
      : "Nuevo operario";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="modal-head">
          <h2>{titulo}</h2>
          <button type="button" className="icon-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {esAdmin && (
          <div className="field-row">
            {select(
              "empresa",
              "Empresa *",
              empresas.map((e) => ({ value: String(e.id), label: e.nombre })),
              { disabled: isEdit }
            )}
            {select("rol", "Rol *", ROLES_USUARIO)}
          </div>
        )}

        {input("username", "Nombre de usuario *", {
          maxLength: LIMITES.usernameMax,
          autoComplete: "off",
          placeholder: EJEMPLOS.username,
        })}

        <div className="field-row">
          {input("first_name", "Nombre *", { maxLength: LIMITES.personaMax, placeholder: EJEMPLOS.nombre })}
          {input("last_name", "Apellido *", { maxLength: LIMITES.personaMax, placeholder: EJEMPLOS.apellido })}
        </div>

        <div className="field-row">
          {input("email", "Email", { type: "email", maxLength: LIMITES.emailMax, placeholder: EJEMPLOS.email })}
          {input("telefono", "Teléfono", {
            type: "tel",
            maxLength: LIMITES.telefonoMax,
            placeholder: EJEMPLOS.telefono,
          })}
        </div>

        {!isEdit && (
          <div className="field-row">
            {input("password", "Contraseña *", {
              type: "password",
              placeholder: EJEMPLOS.clave,
              autoComplete: "new-password",
            })}
            {input("confirmacion", "Repetir contraseña *", {
              type: "password",
              placeholder: "Repite la contraseña",
              autoComplete: "new-password",
            })}
          </div>
        )}
        {!isEdit && (
          <p className="muted small">
            Mínimo {LIMITES.claveMin} caracteres, no solo números, ni muy común o
            parecida al nombre de usuario.
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

export default UsuarioForm;
