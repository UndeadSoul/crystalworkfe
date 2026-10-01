import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCliente, updateCliente, deleteCliente } from "../services/clientes";
import ClienteForm from "../components/ClienteForm";

function Dato({ label, children }) {
  return (
    <div className="dato">
      <span className="dato-label">{label}</span>
      <span className="dato-valor">{children || "—"}</span>
    </div>
  );
}

function ClienteDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setCliente(await getCliente(id));
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async (data) => {
    await updateCliente(id, data);
    setEditing(false);
    load();
  };

  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar al cliente "${cliente.nombre}"?`)) return;
    await deleteCliente(id);
    navigate("/clientes");
  };

  if (loading) return <div className="page-loading">Cargando…</div>;
  if (notFound)
    return (
      <div className="page">
        <p className="muted">Cliente no encontrado.</p>
        <Link to="/clientes" className="link-back">
          ← Volver a clientes
        </Link>
      </div>
    );

  return (
    <div className="page">
      <Link to="/clientes" className="link-back">
        ← Volver a clientes
      </Link>

      <header className="page-head page-head-row">
        <h1>{cliente.nombre}</h1>
        <div className="actions">
          <button className="btn btn-ghost" onClick={() => setEditing(true)}>
            Editar
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            Eliminar
          </button>
        </div>
      </header>

      <div className="panel">
        <div className="detail-grid">
          <Dato label="RUT">{cliente.rut}</Dato>
          <Dato label="Teléfono">{cliente.telefono}</Dato>
          <Dato label="Email">{cliente.email}</Dato>
          <Dato label="Dirección">{cliente.direccion}</Dato>
        </div>
      </div>

      <div className="panel">
        <h2>Proyectos asociados</h2>
        <p className="muted">
          Aquí se listarán los proyectos de este cliente. (Fase 4)
        </p>
      </div>

      {editing && (
        <ClienteForm
          initial={cliente}
          onSubmit={handleSubmit}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

export default ClienteDetalle;
