import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createEmpresa,
  listEmpresas,
  setEmpresaActiva,
  updateEmpresa,
} from "../services/empresas";
import { formatFechaHora } from "../utils/format";
import { parseApiError } from "../utils/errors";
import EmpresaForm from "../components/EmpresaForm";
import { FormError } from "../components/FormErrors";
import { BotonCarga, Loader } from "../components/Loader";

/** Empresas del sistema (solo administrador). */
function Empresas() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(null); // null | {} (nueva) | empresa (editar)
  const [cambiando, setCambiando] = useState(null);

  const load = useCallback(async (term) => {
    setLoading(true);
    setError("");
    try {
      setEmpresas(await listEmpresas(term ? { search: term } : {}));
    } catch (err) {
      setError(parseApiError(err, { fallback: "No se pudieron cargar las empresas." }).general);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const guardar = async (data) => {
    if (form.id) await updateEmpresa(form.id, data);
    else await createEmpresa(data);
    setForm(null);
    load(search);
  };

  const cambiarActiva = async (e) => {
    const accion = e.activa ? "desactivar" : "reactivar";
    const aviso = e.activa ? " Sus usuarios no podrán iniciar sesión." : "";
    if (!window.confirm(`¿Seguro que deseas ${accion} ${e.nombre}?${aviso}`)) return;
    setError("");
    setCambiando(e.id);
    try {
      await setEmpresaActiva(e.id, !e.activa);
      load(search);
    } catch (err) {
      setError(parseApiError(err, { fallback: `No se pudo ${accion} la empresa.` }).general);
    } finally {
      setCambiando(null);
    }
  };

  return (
    <div className="page">
      <header className="page-head page-head-row">
        <div>
          <h1>Empresas</h1>
          <p className="page-sub">Empresas que usan el sistema y sus usuarios.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setForm({})}>
          + Nueva empresa
        </button>
      </header>

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Buscar por nombre o RUT…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <FormError msg={error} />

      <div className="panel panel-flush">
        {loading ? (
          <Loader texto="Cargando empresas…" />
        ) : empresas.length === 0 ? (
          <p className="muted pad">{search ? "Sin resultados." : "Aún no hay empresas."}</p>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>RUT</th>
                  <th>Usuarios</th>
                  <th>Creada</th>
                  <th>Estado</th>
                  <th className="col-actions"></th>
                </tr>
              </thead>
              <tbody>
                {empresas.map((e) => (
                  <tr key={e.id} className="clickable-row" onClick={() => setForm(e)}>
                    <td>
                      <strong>{e.nombre}</strong>
                    </td>
                    <td>{e.rut || "—"}</td>
                    <td>{e.n_usuarios}</td>
                    <td>{formatFechaHora(e.creada_en)}</td>
                    <td>
                      <span className={e.activa ? "badge badge-success" : "badge badge-neutral"}>
                        {e.activa ? "Activa" : "Desactivada"}
                      </span>
                    </td>
                    <td className="col-actions" onClick={(ev) => ev.stopPropagation()}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/usuarios?empresa=${e.id}`)}
                      >
                        Usuarios
                      </button>
                      <BotonCarga
                        className={e.activa ? "btn btn-danger btn-sm" : "btn btn-ghost btn-sm"}
                        cargando={cambiando === e.id}
                        disabled={cambiando !== null}
                        texto={e.activa ? "Desactivando…" : "Reactivando…"}
                        onClick={() => cambiarActiva(e)}
                      >
                        {e.activa ? "Desactivar" : "Reactivar"}
                      </BotonCarga>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {form !== null && (
        <EmpresaForm
          initial={form.id ? form : null}
          onSubmit={guardar}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  );
}

export default Empresas;
