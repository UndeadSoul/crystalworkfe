// Indicadores de carga.
//   <Spinner />                     círculo animado (hereda el color del texto).
//   <Loader texto="…" pagina />     spinner + texto; `pagina` lo centra a página completa.
//   <BotonCarga cargando texto="…"> botón que muestra spinner mientras trabaja.

export function Spinner({ className = "" }) {
  return <span className={`spinner ${className}`} aria-hidden="true" />;
}

export function Loader({ texto = "Cargando…", pagina = false }) {
  return (
    <div className={pagina ? "page-loading" : "loader"} role="status">
      <Spinner />
      <span>{texto}</span>
    </div>
  );
}

export function BotonCarga({
  cargando,
  texto = "Guardando…",
  disabled,
  children,
  className = "btn btn-primary",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={className}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...props}
    >
      {cargando && <Spinner />}
      {cargando ? texto : children}
    </button>
  );
}
