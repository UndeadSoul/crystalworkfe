import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { inicioPara, roleKey } from "../utils/roles";
import { Loader } from "./Loader";

/**
 * Protege una ruta. Opcionalmente restringe por rol:
 *   <ProtectedRoute roles={["ADMIN", "JEFE"]}>...</ProtectedRoute>
 * Sin permiso, redirige a la pantalla de inicio de su rol.
 */
function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader pagina />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(roleKey(user))) {
    return <Navigate to={inicioPara(user)} replace />;
  }

  return children;
}

export default ProtectedRoute;
