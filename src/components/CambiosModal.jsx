import { useEffect, useState } from "react";
import { formatFecha } from "../utils/format";

/**
 * Modal de "control de cambios" (historial de auditoría).
 * cargar: función async que devuelve la lista de cambios.
 * mostrarObjeto: muestra la columna "Elemento" (útil en precios).
 */
function CambiosModal({ title, cargar, onClose, mostrarObjeto = true }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let activo = true;
    cargar()
      .then((d) => activo && setRows(d))
      .catch(() => activo && setError(true));
    return () => {
      activo = false;
    };
    // Se carga una sola vez al abrir el modal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal-wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {error ? (
          <p className="form-error">No se pudo cargar el historial.</p>
        ) : rows === null ? (
          <p className="muted">Cargando…</p>
        ) : rows.length === 0 ? (
          <p className="muted">Sin cambios registrados.</p>
        ) : (
          <div className="table-scroll">
            <table className="table table-compact">
              <thead>
                <tr>
                  {mostrarObjeto && <th>Elemento</th>}
                  <th>Campo</th>
                  <th>Antes</th>
                  <th>Después</th>
                  <th>Usuario</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    {mostrarObjeto && <td>{c.objeto_label}</td>}
                    <td>{c.campo}</td>
                    <td>{c.valor_anterior || "—"}</td>
                    <td>{c.valor_nuevo || "—"}</td>
                    <td>{c.usuario_display}</td>
                    <td>{formatFecha(c.creado_en)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default CambiosModal;
