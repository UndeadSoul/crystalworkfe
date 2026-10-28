// Formato común de mensajes de error.
//   <FieldError msg={...} />  debajo de su campo (el input lleva aria-invalid).
//   <FormError msg={...} />   error general del formulario o de la acción.

export function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <small className="field-error" role="alert">
      {msg}
    </small>
  );
}

export function FormError({ msg }) {
  if (!msg) return null;
  return (
    <p className="form-error" role="alert">
      {msg}
    </p>
  );
}
