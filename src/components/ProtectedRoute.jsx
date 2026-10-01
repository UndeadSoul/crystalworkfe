import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { roleKey } from "../utils/roles";

/**
 * Protege una ruta. Opcionalmente restringe por rol:
 *   <ProtectedRoute roles={["ADMIN", "JEFE"]}>...</ProtectedRoute>
 */
function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="page-loading">Cargando…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(roleKey(user))) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
