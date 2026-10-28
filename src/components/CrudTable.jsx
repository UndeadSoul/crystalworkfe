import { useState } from "react";
import CatalogModal from "./CatalogModal";

/**
 * Tabla con alta/edición/eliminación sobre un endpoint del catálogo.
 *
 * columns:  [{ key, label, render?(row) }]
 * fields:   spec de CatalogModal
 * api:      { create, update, remove }
 * baseData: objeto que se fusiona en cada create/update (p.ej. { serie: id })
 * onChanged: callback tras cualquier cambio (para recargar el padre)
 */
function CrudTable({
  title,
  rows,
  columns,
  fields,
  api,
  baseData = {},
  onChanged,
  addLabel = "Agregar",
  singular = "registro",
  canAdd = true,
  canDelete = true,
}) {
  const [modal, setModal] = useState(null); // null | {} (nuevo) | row (editar)

  const handleSubmit = async (form) => {
    const payload = { ...baseData, ...form };
    if (modal && modal.id) {
      await api.update(modal.id, payload);
    } else {
      await api.create(payload);
    }
    setModal(null);
    onChanged();
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`¿Eliminar este ${singular}?`)) return;
    try {
      await api.remove(row.id);
      onChanged();
    } catch {
      alert("No se pudo eliminar.");
    }
  };

  return (
    <div className="crud-block">
      <div className="crud-head">
        {title && <h4>{title}</h4>}
        {canAdd && (
          <button className="btn btn-ghost btn-sm" onClick={() => setModal({})}>
            + {addLabel}
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="muted small">Sin datos.</p>
      ) : (
        <table className="table table-compact">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              <th className="col-actions"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
                ))}
                <td className="col-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => setModal(row)}>
                    Editar
                  </button>
                  {canDelete && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(row)}
                    >
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modal !== null && (
        <CatalogModal
          title={modal.id ? `Editar ${singular}` : `Nuevo ${singular}`}
          fields={fields}
          initial={modal.id ? modal : null}
          onSubmit={handleSubmit}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

export default CrudTable;
