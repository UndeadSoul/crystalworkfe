import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCliente, updateCliente } from "../services/clientes";
import { listProyectos, ESTADO_PROD_CLASS } from "../services/proyectos";
import { formatCLP, formatFecha } from "../utils/format";
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
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setCliente(await getCliente(id));
      setProyectos(await listProyectos({ cliente: id }));
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

  const totalProyectos = proyectos.reduce(
    (s, p) => s + Number(p.total_bruto || 0),
    0
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
        </div>
      </header>

      <div className="panel">
        <div className="detail-grid">
          <Dato label="RUT">{cliente.rut}</Dato>
          <Dato label="Teléfono">{cliente.telefono}</Dato>
          <Dato label="Email">{cliente.email}</Dato>
          <Dato label="Dirección">{cliente.direccion}</Dato>
          <Dato label="Total en proyectos (c/IVA)">
            <strong>{formatCLP(totalProyectos)}</strong>
          </Dato>
        </div>
      </div>

      <div className="panel panel-flush">
        <div className="pad">
          <h2>Proyectos asociados</h2>
        </div>
        {proyectos.length === 0 ? (
          <p className="muted pad">Este cliente aún no tiene proyectos.</p>
        ) : (
          <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Estado</th>
                <th>Total (c/IVA)</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {proyectos.map((p) => (
                <tr
                  key={p.id}
                  className="clickable-row"
                  onClick={() => navigate(`/proyectos/${p.id}`)}
                >
                  <td>#{p.id}</td>
                  <td>
                    <span className={ESTADO_PROD_CLASS[p.estado_produccion]}>
                      {p.estado_display}
                    </span>
                  </td>
                  <td>{formatCLP(p.total_bruto)}</td>
                  <td>{formatFecha(p.fecha_creacion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
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
