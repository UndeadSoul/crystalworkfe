import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ROLES_EMPRESA } from "./utils/roles";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Cotizaciones from "./pages/Cotizaciones";
import CotizacionNueva from "./pages/CotizacionNueva";
import CotizacionDetalle from "./pages/CotizacionDetalle";
import Proyectos from "./pages/Proyectos";
import ProyectoDetalle from "./pages/ProyectoDetalle";
import Clientes from "./pages/Clientes";
import ClienteDetalle from "./pages/ClienteDetalle";
import Precios from "./pages/Precios";
import Usuarios from "./pages/Usuarios";
import Empresas from "./pages/Empresas";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            {/* Públicas */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />

            {/* Privadas */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roles={ROLES_EMPRESA}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cotizaciones"
              element={
                <ProtectedRoute roles={ROLES_EMPRESA}>
                  <Cotizaciones />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cotizaciones/nueva"
              element={
                <ProtectedRoute roles={ROLES_EMPRESA}>
                  <CotizacionNueva />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cotizaciones/:id/editar"
              element={
                <ProtectedRoute roles={ROLES_EMPRESA}>
                  <CotizacionNueva />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cotizaciones/:id"
              element={
                <ProtectedRoute roles={ROLES_EMPRESA}>
                  <CotizacionDetalle />
                </ProtectedRoute>
              }
            />
            <Route
              path="/proyectos"
              element={
                <ProtectedRoute roles={ROLES_EMPRESA}>
                  <Proyectos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/proyectos/:id"
              element={
                <ProtectedRoute roles={ROLES_EMPRESA}>
                  <ProyectoDetalle />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clientes"
              element={
                <ProtectedRoute roles={ROLES_EMPRESA}>
                  <Clientes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clientes/:id"
              element={
                <ProtectedRoute roles={ROLES_EMPRESA}>
                  <ClienteDetalle />
                </ProtectedRoute>
              }
            />
            <Route
              path="/precios"
              element={
                <ProtectedRoute roles={["JEFE"]}>
                  <Precios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/usuarios"
              element={
                <ProtectedRoute roles={["ADMIN", "JEFE"]}>
                  <Usuarios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/empresas"
              element={
                <ProtectedRoute roles={["ADMIN"]}>
                  <Empresas />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
