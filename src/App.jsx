import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
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
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cotizaciones"
              element={
                <ProtectedRoute>
                  <Cotizaciones />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cotizaciones/nueva"
              element={
                <ProtectedRoute>
                  <CotizacionNueva />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cotizaciones/:id"
              element={
                <ProtectedRoute>
                  <CotizacionDetalle />
                </ProtectedRoute>
              }
            />
            <Route
              path="/proyectos"
              element={
                <ProtectedRoute>
                  <Proyectos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/proyectos/:id"
              element={
                <ProtectedRoute>
                  <ProyectoDetalle />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clientes"
              element={
                <ProtectedRoute>
                  <Clientes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clientes/:id"
              element={
                <ProtectedRoute>
                  <ClienteDetalle />
                </ProtectedRoute>
              }
            />
            <Route
              path="/precios"
              element={
                <ProtectedRoute roles={["ADMIN", "JEFE"]}>
                  <Precios />
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
