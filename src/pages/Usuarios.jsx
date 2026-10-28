import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  cambiarClaveUsuario,
  createUsuario,
  listUsuarios,
  setUsuarioActivo,
  updateUsuario,
} from "../services/usuarios";
import { listEmpresas } from "../services/empresas";
import { useAuth } from "../contexts/AuthContext";
import { roleKey, ROLES } from "../utils/roles";
import { formatFechaHora } from "../utils/format";
import { parseApiError } from "../utils/errors";
import UsuarioForm from "../components/UsuarioForm";
import ClaveModal from "../components/ClaveModal";
import { FormError } from "../components/FormErrors";
import { BotonCarga, Loader } from "../components/Loader";

const ESTADOS = [
  { value: "true", label: "Activos" },
  { value: "false", label: "Desactivados" },
  { value: "", label: "Todos" },
];

/**
 * Gestión de usuarios.
 *  - Jefe: operarios de su empresa.
 *  - Administrador: usuarios de todas las empresas (filtro por empresa;
 *    /usuarios?empresa=<id> llega con el filtro aplicado).
 */
function Usuarios() {
  const { user } = useAuth();
  const esAdmin = roleKey(user) === ROLES.ADMIN;
  const [searchParams] = useSearchParams();

  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [empresa, setEmpresa] = useState(searchParams.get("empresa") || "");
  const [activo, setActivo] = useState("true");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState(null); // null | {} (nuevo) | usuario (editar)
  const [clave, setClave] = useState(null); // usuario al que se cambia la clave
  const [cambiando, setCambiando] = useState(null); // id activando/desactivando

  const load = useCallback(async (filtros) => {
    setLoading(true);
    setError("");
    try {
      const params = { search: filtros.search || undefined };
      if (filtros.empresa) params.empresa = filtros.empresa;
      if (filtros.activo) params.activo = filtros.activo;
      setUsuarios(await listUsuarios(params));
    } catch (err) {
      setError(parseApiError(err, { fallback: "No se pudieron cargar los usuarios." }).general);
    } finally {
      setLoading(false);
    }
  }, []);

  // Recarga al cambiar filtros (la búsqueda con un pequeño debounce).
  useEffect(() => {
    const t = setTimeout(() => load({ empresa, activo, search }), 300);
    return () => clearTimeout(t);
  }, [empresa, activo, search, load]);

  useEffect(() => {
    if (esAdmin) listEmpresas().then(setEmpresas).catch(() => setEmpresas([]));
  }, [esAdmin]);

  const recargar = () => load({ empresa, activo, search });

  const guardar = async (data) => {
    if (form.id) await updateUsuario(form.id, data);
    else await createUsuario(data);
    setForm(null);
    recargar();
  };

  const cambiarActivo = async (u) => {
    const accion = u.is_active ? "desactivar" : "reactivar";
    const aviso = u.is_active
      ? " No podrá iniciar sesión; su historial se conserva."
      : "";
    if (!window.confirm(`¿Seguro que deseas ${accion} a ${u.username}?${aviso}`)) return;
    setError("");
    setCambiando(u.id);
    try {
      await setUsuarioActivo(u.id, !u.is_active);
      recargar();
    } catch (err) {
      setError(parseApiError(err, { fallback: `No se pudo ${accion} el usuario.` }).general);
    } finally {
      setCambiando(null);
    }
  };

  const nombreCompleto = (u) => `${u.first_name} ${u.last_name}`.trim() || "—";

  return (
    <div className="page">
      <header className="page-head page-head-row">
        <div>
          <h1>Usuarios</h1>
          <p className="page-sub">
            {esAdmin
              ? "Jefes y operarios de todas las empresas."
              : "Operarios de tu empresa."}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setForm({})}>
          + {esAdmin ? "Nuevo usuario" : "Nuevo operario"}
        </button>
      </header>

      <div className="toolbar toolbar-row">
        <input
          className="search-input"
          placeholder="Buscar por usuario, nombre o email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {esAdmin && (
          <select
            className="search-input"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
          >
            <option value="">Todas las empresas</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        )}
        <select
          className="search-input"
          value={activo}
          onChange={(e) => setActivo(e.target.value)}
        >
          {ESTADOS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <FormError msg={error} />

      <div className="panel panel-flush">
        {loading ? (
          <Loader texto="Cargando usuarios…" />
        ) : usuarios.length === 0 ? (
          <p className="muted pad">No hay usuarios con estos filtros.</p>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Nombre</th>
                  {esAdmin && <th>Rol</th>}
                  {esAdmin && <th>Empresa</th>}
                  <th>Email</th>
                  <th>Último ingreso</th>
                  <th>Estado</th>
                  <th className="col-actions"></th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} className="clickable-row" onClick={() => setForm(u)}>
                    <td>
                      <strong>{u.username}</strong>
                    </td>
                    <td>{nombreCompleto(u)}</td>
                    {esAdmin && <td>{u.rol_display}</td>}
                    {esAdmin && <td>{u.empresa_nombre}</td>}
                    <td>{u.email || "—"}</td>
                    <td>{u.last_login ? formatFechaHora(u.last_login) : "Nunca"}</td>
                    <td>
                      <span className={u.is_active ? "badge badge-success" : "badge badge-neutral"}>
                        {u.is_active ? "Activo" : "Desactivado"}
                      </span>
                    </td>
                    <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setClave(u)}>
                        Contraseña
                      </button>
                      <BotonCarga
                        className={u.is_active ? "btn btn-danger btn-sm" : "btn btn-ghost btn-sm"}
                        cargando={cambiando === u.id}
                        disabled={cambiando !== null}
                        texto={u.is_active ? "Desactivando…" : "Reactivando…"}
                        onClick={() => cambiarActivo(u)}
                      >
                        {u.is_active ? "Desactivar" : "Reactivar"}
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
        <UsuarioForm
          initial={form.id ? form : null}
          esAdmin={esAdmin}
          empresas={empresas.filter((e) => e.activa || e.id === form.empresa)}
          empresaInicial={empresa}
          onSubmit={guardar}
          onClose={() => setForm(null)}
        />
      )}

      {clave && (
        <ClaveModal
          usuario={clave}
          onSubmit={async (password) => {
            await cambiarClaveUsuario(clave.id, password);
            setClave(null);
          }}
          onClose={() => setClave(null)}
        />
      )}
    </div>
  );
}

export default Usuarios;
