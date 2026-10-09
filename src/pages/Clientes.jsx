import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listClientes, createCliente, updateCliente } from "../services/clientes";
import ClienteForm from "../components/ClienteForm";

function Clientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | {} (nuevo) | cliente (editar)
  const [error, setError] = useState("");

  const load = useCallback(async (term) => {
    setLoading(true);
    setError("");
    try {
      setClientes(await listClientes(term));
    } catch {
      setError("No se pudieron cargar los clientes.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial + busqueda con pequeno debounce.
  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const handleSubmit = async (data) => {
    if (modal && modal.id) {
      await updateCliente(modal.id, data);
    } else {
      await createCliente(data);
    }
    setModal(null);
    load(search);
  };

  return (
    <div className="page">
      <header className="page-head page-head-row">
        <h1>Clientes</h1>
        <button className="btn btn-primary" onClick={() => setModal({})}>
          + Nuevo cliente
        </button>
      </header>

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Buscar por nombre, RUT o email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="panel panel-flush">
        {loading ? (
          <p className="muted pad">Cargando…</p>
        ) : clientes.length === 0 ? (
          <p className="muted pad">
            {search ? "Sin resultados." : "Aún no hay clientes. Crea el primero."}
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>RUT</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th className="col-actions"></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr
                  key={c.id}
                  className="clickable-row"
                  onClick={() => navigate(`/clientes/${c.id}`)}
                >
                  <td>{c.nombre}</td>
                  <td>{c.rut || "—"}</td>
                  <td>{c.telefono || "—"}</td>
                  <td>{c.email || "—"}</td>
                  <td className="col-actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setModal(c);
                      }}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal !== null && (
        <ClienteForm
          initial={modal.id ? modal : null}
          onSubmit={handleSubmit}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

export default Clientes;
