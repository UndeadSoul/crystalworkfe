import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FormError } from "../components/FormErrors";
import { BotonCarga } from "../components/Loader";
import { inicioPara } from "../utils/roles";
import { EJEMPLOS } from "../utils/validacion";

function Login() {
  const { user, loading, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  if (!loading && user) {
    return <Navigate to={inicioPara(user)} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const me = await login(username, password);
      navigate(inicioPara(me));
    } catch (err) {
      const status = err.response ? err.response.status : null;
      const data = err.response?.data;
      setError(
        data?.code === "empresa_inactiva"
          ? data.detail
          : status === 401
            ? "Usuario o contraseña incorrectos, o la cuenta está desactivada."
            : "No se pudo conectar con el servidor."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Ingresar</h1>
        <p className="auth-sub">Accede con tu cuenta de trabajador.</p>

        <label className="field">
          <span>Usuario</span>
          <input
            type="text"
            placeholder={EJEMPLOS.username}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label className="field">
          <span>Contraseña</span>
          <input
            type="password"
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <FormError msg={error} />

        <BotonCarga
          type="submit"
          className="btn btn-primary btn-block"
          cargando={submitting}
          texto="Ingresando…"
        >
          Ingresar
        </BotonCarga>
      </form>
    </div>
  );
}

export default Login;
