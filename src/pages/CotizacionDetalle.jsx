import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getCotizacion,
  aprobarCotizacion,
  rechazarCotizacion,
} from "../services/cotizaciones";
import { useAuth } from "../contexts/AuthContext";
import { roleKey, ROLES } from "../utils/roles";
import { ESTADO_CLASS, formatCLP, formatFechaHora, formatMedidas } from "../utils/format";
import { esConflicto, parseApiError } from "../utils/errors";
import { FormError } from "../components/FormErrors";
import { BotonCarga, Loader } from "../components/Loader";
import BotonVolver from "../components/BotonVolver";
import { pdfCotizacion } from "../utils/descargas";

function Dato({ label, children }) {
  return (
    <div className="dato">
      <span className="dato-label">{label}</span>
      <span className="dato-valor">{children || "—"}</span>
    </div>
  );
}

function CotizacionDetalle() {
  const { id } = useParams();
  const { user } = useAuth();
  const [cot, setCot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [resolviendo, setResolviendo] = useState(null); // "aprobar" | "rechazar"
  const [error, setError] = useState("");
  const [exportando, setExportando] = useState(false);

  const exportarPdf = async () => {
    setError("");
    setExportando(true);
    try {
      await pdfCotizacion(id);
    } catch (err) {
      setError(parseApiError(err, { fallback: "No se pudo generar el PDF." }).general);
    } finally {
      setExportando(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    getCotizacion(id)
      .then(setCot)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const puedeResolver =
    cot &&
    cot.estado === "PENDIENTE" &&
    roleKey(user) === ROLES.JEFE;

  const resolver = async (accion) => {
    const verbo = accion === "aprobar" ? "aprobar" : "rechazar";
    if (!window.confirm(`¿Seguro que deseas ${verbo} la cotización #${cot.id}?`)) return;
    setError("");
    setResolviendo(accion);
    try {
      const fn = accion === "aprobar" ? aprobarCotizacion : rechazarCotizacion;
      // Se envía la versión en pantalla: si otro usuario la cambió, la API
      // responde 409 y no se aprueba algo que no se vio.
      setCot(await fn(cot.id, cot.version));
    } catch (err) {
      const msg = parseApiError(err, { fallback: `No se pudo ${verbo} la cotización.` }).general;
      if (esConflicto(err)) {
        // Se muestra la versión actual para revisarla antes de decidir.
        setError(`${msg} Se cargó la versión actual.`);
        try {
          setCot(await getCotizacion(id));
        } catch {
          /* se mantiene el mensaje de conflicto */
        }
      } else {
        setError(msg);
      }
    } finally {
      setResolviendo(null);
    }
  };

  if (loading) return <Loader pagina />;
  if (notFound)
    return (
      <div className="page">
        <p className="muted">Cotización no encontrada.</p>
        <BotonVolver to="/cotizaciones">Cotizaciones</BotonVolver>
      </div>
    );

  return (
    <div className="page">
      <header className="page-head page-head-row">
        <div className="titulo-volver">
          <BotonVolver to="/cotizaciones">Cotizaciones</BotonVolver>
          <h1>Cotización #{cot.id}</h1>
        </div>
        <div className="actions">
          <span className={ESTADO_CLASS[cot.estado]}>{cot.estado_display}</span>
          {cot.estado === "PENDIENTE" && (
            <Link to={`/cotizaciones/${cot.id}/editar`} className="btn btn-ghost btn-sm">
              Editar
            </Link>
          )}
          <BotonCarga
            className="btn btn-ghost btn-sm"
            cargando={exportando}
            texto="Generando PDF…"
            onClick={exportarPdf}
          >
            Exportar PDF
          </BotonCarga>
          {puedeResolver && (
            <>
              <BotonCarga
                className="btn btn-primary btn-sm"
                cargando={resolviendo === "aprobar"}
                disabled={resolviendo !== null}
                texto="Aprobando…"
                onClick={() => resolver("aprobar")}
              >
                Aprobar
              </BotonCarga>
              <BotonCarga
                className="btn btn-danger btn-sm"
                cargando={resolviendo === "rechazar"}
                disabled={resolviendo !== null}
                texto="Rechazando…"
                onClick={() => resolver("rechazar")}
              >
                Rechazar
              </BotonCarga>
            </>
          )}
        </div>
      </header>

      <FormError msg={error} />

      <div className="panel">
        <h2>Información</h2>
        <div className="detail-grid">
          <Dato label="Cliente">{cot.cliente_nombre}</Dato>
          <Dato label="Ingresada por">{cot.empleado_nombre}</Dato>
          <Dato label="Fecha de ingreso">{formatFechaHora(cot.fecha_ingreso)}</Dato>
          {cot.estado === "PENDIENTE" && cot.modificada_por_nombre && (
            <Dato label="Última edición">
              {cot.modificada_por_nombre} · {formatFechaHora(cot.modificada_en)}
            </Dato>
          )}
          {cot.estado !== "PENDIENTE" && cot.resuelta_por_nombre && (
            <>
              <Dato label={`${cot.estado_display} por`}>{cot.resuelta_por_nombre}</Dato>
              <Dato label="Fecha de resolución">{formatFechaHora(cot.fecha_resolucion)}</Dato>
            </>
          )}
          <Dato label="Dirección de entrega">{cot.direccion_entrega}</Dato>
          <Dato label="Transporte e instalación">
            {cot.requiere_transporte ? "Sí" : "No"}
          </Dato>
          {cot.requiere_transporte && (
            <Dato label="Distancia">{cot.distancia_transporte_km} km</Dato>
          )}
        </div>
      </div>

      <div className="panel panel-flush">
        <div className="pad">
          <h2>Ventanas ({cot.ventanas.length})</h2>
        </div>
        <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Color</th>
              <th>Vidrio</th>
              <th>Medidas</th>
              <th>Cant.</th>
              <th>Precio unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {cot.ventanas.map((v) => (
              <tr key={v.id}>
                <td>{v.tipo_display}</td>
                <td>{v.color_display}</td>
                <td>{v.vidrio_display}</td>
                <td>
                  {formatMedidas(v.ancho_mm, v.alto_mm)}
                </td>
                <td>{v.cantidad}</td>
                <td>
                  {v.precio_calculado ? (
                    formatCLP(v.precio_unitario)
                  ) : (
                    <span className="badge badge-warning">Sin precio</span>
                  )}
                </td>
                <td>{v.precio_calculado ? formatCLP(v.subtotal) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div className="panel">
        <h2>Comentarios y costos</h2>
        <div className="detail-grid">
          <Dato label="Comentarios">{cot.comentarios}</Dato>
          <Dato label="Monto agregado">{formatCLP(cot.monto_agregado)}</Dato>
          {cot.requiere_transporte && (
            <Dato label="Transporte">{formatCLP(cot.costo_transporte)}</Dato>
          )}
          <Dato label="Neto">{formatCLP(cot.total)}</Dato>
          <Dato label="IVA (19%)">{formatCLP(cot.iva)}</Dato>
          <Dato label="Total (bruto)">
            <strong>{formatCLP(cot.total_bruto)}</strong>
          </Dato>
        </div>
        {cot.ventanas.some((v) => !v.precio_calculado) && (
          <p className="muted">
            Algunas ventanas no tienen precio porque falta cargar datos en el catálogo.
            Pídele al jefe que complete los precios y vuelve a abrir la cotización.
          </p>
        )}
      </div>
    </div>
  );
}

export default CotizacionDetalle;
