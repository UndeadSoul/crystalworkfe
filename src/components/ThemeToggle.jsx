import { useState } from "react";

const KEY = "tema";

// El tema inicial ya lo aplicó el script de index.html (claro por defecto).
// Aquí solo leemos lo que quedó en el <html> para que el switch arranque igual.
function leerTema() {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

function ThemeToggle({ className = "" }) {
  const [tema, setTema] = useState(leerTema);
  const oscuro = tema === "dark";

  const alternar = () => {
    const siguiente = oscuro ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", siguiente);
    try {
      localStorage.setItem(KEY, siguiente);
    } catch {
      // Sin almacenamiento (p. ej. ventana privada): el cambio vale para la sesión.
    }
    setTema(siguiente);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={oscuro}
      className={`theme-toggle ${className}`}
      onClick={alternar}
      title={oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-toggle-icon theme-toggle-sun">☀</span>
        <span className="theme-toggle-icon theme-toggle-moon">☾</span>
        <span className="theme-toggle-knob" />
      </span>
      <span className="theme-toggle-label">{oscuro ? "Oscuro" : "Claro"}</span>
    </button>
  );
}

export default ThemeToggle;
