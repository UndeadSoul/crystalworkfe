import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getProyecto,
  getHojaCorte,
  getProyectoCambios,
  updateProyecto,
  ESTADOS_PRODUCCION,
  ESTADO_PROD_CLASS,
  ESTADO_PAGO_CLASS,
} from "../services/proyectos";
import { formatFechaHora, formatMedidas, formatMm } from "../utils/format";
import { useAuth } from "../contexts/AuthContext";
import { roleKey, ROLES } from "../utils/roles";
import CambiosModal from "../components/CambiosModal";
import { FormError } from "../components/FormErrors";
import { Loader, Spinner } from "../components/Loader";
import BotonVolver from "../components/BotonVolver";
import PagosPanel from "../components/PagosPanel";
import MotivoModal from "../components/MotivoModal";
import { parseApiError } from "../utils/errors";
import { pdfHojaCorte, pdfProyecto } from "../utils/descargas";

function Dato({ label, children }) {
  return (
    <div className="dato">
      <span className="dato-label">{label}</span>
      <span className="dato-valor">{children || "—"}</span>
    </div>
  );
}

// Columnas de la hoja de corte y el tipo de valor para ordenar.
const COLS_CORTE = [
  { key: "codigo", label: "Código", tipo: "texto" },
  { key: "tipo_display", label: "Tipo", tipo: "texto" },
  { key: "color_display", label: "Color", tipo: "texto" },
  { key: "perfil", label: "Perfil", tipo: "texto" },
  { key: "largo_mm", label: "Largo", tipo: "num" },
  { key: "cantidad", label: "Cant.", tipo: "num" },
];

function ProyectoDetalle() {
  const { id } = useParams();
  const { user } = useAuth();
  const [proy, setProy] = useState(null);
  const [piezas, setPiezas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [cambiosOpen, setCambiosOpen] = useState(false);
  const [general, setGeneral] = useState("");
  const [cancelando, setCancelando] = useState(false); // modal del motivo
  const [exportando, setExportando] = useState(null); // "proyecto" | "hoja"
  // orden = null -> orden natural del backend (por orden de perfil).
  const [orden, setOrden] = useState(null);

  const ordenarPor = (key) =>
    setOrden((o) =>
      o && o.key === key
        ? { key, dir: o.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );

  const piezasOrdenadas = useMemo(() => {
    if (!orden) return piezas;
    const col = COLS_CORTE.find((c) => c.key === orden.key);
    const factor = orden.dir === "asc" ? 1 : -1;
    return [...piezas].sort((a, b) => {
      const va = a[orden.key];
      const vb = b[orden.key];
      const cmp =
        col?.tipo === "num"
          ? Number(va) - Number(vb)
          : String(va).localeCompare(String(vb), "es", { numeric: true });
      return cmp * factor;
    });
  }, [piezas, orden]);

  // Separación visual por ventana (solo si las filas quedan agrupadas por
  // código: orden natural u orden por código).
  const claseGrupo = useMemo(() => {
    if (orden && orden.key !== "codigo") return [];
    let grupo = -1;
    return piezasOrdenadas.map((p, i) => {
      const inicio = i === 0 || p.codigo !== piezasOrdenadas[i - 1].codigo;
      if (inicio) grupo += 1;
      return [inicio && i > 0 ? "grupo-inicio" : "", grupo % 2 ? "grupo-alt" : ""]
        .filter(Boolean)
        .join(" ");
    });
  }, [piezasOrdenadas, orden]);

  useEffect(() => {
    setLoading(true);
    Promise.all([getProyecto(id), getHojaCorte(id)])
      .then(([p, h]) => {
        setProy(p);
        setPiezas(h.piezas);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const cambiar = async (data) => {
    setGuardando(true);
    setGeneral("");
    try {
      setProy(await updateProyecto(id, data));
    } catch (err) {
      // El selector está en el encabezado: el error se muestra bajo él.
      setGeneral(
        parseApiError(err, { fallback: "No se pudo actualizar el proyecto.", visibles: [] })
          .general
      );
    } finally {
      setGuardando(false);
    }
  };

  if (loading) return <Loader pagina texto="Cargando proyecto y hoja de corte…" />;
  if (notFound)
    return (
      <div className="page">
        <p className="muted">Proyecto no encontrado.</p>
        <BotonVolver to="/proyectos">Proyectos</BotonVolver>
      </div>
    );

  const cot = proy.cotizacion;
  const ventanasFisicas = cot.ventanas.reduce((s, v) => s + v.cantidad, 0);
  const esJefe = roleKey(user) === ROLES.JEFE;
  const cancelado = proy.estado_produccion === "CANCELADO";

  const exportar = async (opcion) => {
    setGeneral("");
    setExportando(opcion);
    try {
      await (opcion === "hoja" ? pdfHojaCorte(proy.id) : pdfProyecto(proy.id));
    } catch (err) {
      setGeneral(parseApiError(err, { fallback: "No se pudo generar el PDF." }).general);
    } finally {
      setExportando(null);
    }
  };

  return (
    <div className="page">
      <header className="page-head page-head-row">
        <div className="titulo-volver">
          <BotonVolver to="/proyectos">Proyectos</BotonVolver>
          <h1>Proyecto #{proy.id}</h1>
        </div>
        <div className="actions estado-acciones">
          <span
            className={ESTADO_PAGO_CLASS[proy.estado_pago]}
            title="Estado de pago: se calcula según los pagos registrados"
          >
            {proy.estado_pago_display}
          </span>
          {/* Estado de fabricación: se cambia aquí mismo, con el estilo del badge.
              Cancelar (o reactivar un cancelado) es solo del jefe y pide motivo. */}
          <select
            className={`${ESTADO_PROD_CLASS[proy.estado_produccion]} badge-select`}
            aria-label="Estado de fabricación"
            title="Estado de fabricación"
            value={proy.estado_produccion}
            disabled={guardando || (cancelado && !esJefe)}
            onChange={(e) =>
              e.target.value === "CANCELADO"
                ? setCancelando(true)
                : cambiar({ estado_produccion: e.target.value })
            }
          >
            {ESTADOS_PRODUCCION.map((o) => (
              <option
                key={o.value}
                value={o.value}
                disabled={o.value === "CANCELADO" && !esJefe}
              >
                {o.label}
              </option>
            ))}
          </select>
          {guardando && <Spinner />}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setCambiosOpen(true)}
          >
            Control de cambios
          </button>
          <MenuPdf
            exportando={exportando}
            opciones={[
              { id: "proyecto", label: "Proyecto completo" },
              { id: "hoja", label: "Solo hoja de corte" },
            ]}
            onElegir={exportar}
          />
        </div>
      </header>
      <FormError msg={general} />
      {cancelado && (
        <div className="aviso-cancelado" role="status">
          <strong>Proyecto cancelado.</strong> Motivo: {proy.motivo_cancelacion}
        </div>
      )}

      <div className="panel">
        <h2>Cliente</h2>
        <div className="detail-grid">
          <Dato label="Nombre">{proy.cliente_nombre}</Dato>
          <Dato label="Contacto">{proy.cliente_telefono}</Dato>
          <Dato label="Dirección del proyecto">{cot.direccion_entrega}</Dato>
          <Dato label="Creado el">{formatFechaHora(proy.fecha_creacion)}</Dato>
        </div>
      </div>

      {/* Desplegables para ahorrar espacio: Ventanas parte abierto, Hoja de corte cerrado. */}
      <details className="panel panel-flush desplegable" open>
        <summary className="pad">
          <h2>Ventanas</h2>
          <span className="muted small">{cot.ventanas.length} tipos · {ventanasFisicas} ventanas</span>
        </summary>
        <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Color</th>
              <th>Vidrio</th>
              <th>Medidas</th>
              <th>Cant.</th>
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
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </details>

      <details className="panel panel-flush desplegable">
        <summary className="pad">
          <h2>Hoja de corte</h2>
          <span className="muted small">
            {new Set(piezas.map((p) => p.codigo)).size} ventanas ·{" "}
            {piezas.reduce((s, p) => s + p.cantidad, 0)} piezas
          </span>
        </summary>
        <p className="muted small pad-x">
          Piezas de aluminio a cortar, separadas por ventana: cada código
          (iniciales del cliente + número) identifica una ventana.
        </p>
        {piezas.length === 0 ? (
          <p className="muted pad">Sin piezas (revisa que las ventanas tengan tipo válido).</p>
        ) : (
          <div className="table-scroll">
          <table className="table table-sortable">
            <thead>
              <tr>
                {COLS_CORTE.map((c) => {
                  const activa = orden?.key === c.key;
                  return (
                    <th
                      key={c.key}
                      className="th-sort"
                      aria-sort={
                        activa ? (orden.dir === "asc" ? "ascending" : "descending") : "none"
                      }
                      onClick={() => ordenarPor(c.key)}
                    >
                      {c.label}
                      <span className="sort-ind">
                        {activa ? (orden.dir === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {piezasOrdenadas.map((p, i) => (
                <tr key={i} className={claseGrupo[i]}>
                  <td>
                    <strong>{p.codigo}</strong>
                  </td>
                  <td>{p.tipo_display}</td>
                  <td>{p.color_display}</td>
                  <td>{p.perfil}</td>
                  <td>{formatMm(p.largo_mm)}</td>
                  <td>{p.cantidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </details>

      <PagosPanel proyecto={proy} puedeAnular={esJefe} onActualizado={setProy} />

      {cambiosOpen && (
        <CambiosModal
          title={`Control de cambios · Proyecto #${proy.id}`}
          cargar={() => getProyectoCambios(id)}
          onClose={() => setCambiosOpen(false)}
          mostrarObjeto={false}
        />
      )}

      {cancelando && (
        <MotivoModal
          titulo={`Cancelar proyecto #${proy.id}`}
          placeholder="Ej: El cliente desistió de la compra"
          textoBoton="Cancelar proyecto"
          textoCargando="Cancelando…"
          campo="motivo_cancelacion"
          onConfirmar={async (motivo) => {
            setProy(
              await updateProyecto(id, {
                estado_produccion: "CANCELADO",
                motivo_cancelacion: motivo,
              })
            );
            setCancelando(false);
          }}
          onClose={() => setCancelando(false)}
        >
          <p>
            Indica por qué se abandona el proyecto. El motivo queda en el proyecto y
            en el control de cambios. Un proyecto cancelado no recibe pagos nuevos y
            no cuenta en lo facturado ni por cobrar. Se puede reactivar eligiendo otro
            estado.
          </p>
        </MotivoModal>
      )}
    </div>
  );
}

/**
 * Botón "Exportar PDF" con opciones (menú desplegable). Muestra un spinner
 * mientras se genera el archivo.
 */
function MenuPdf({ opciones, exportando, onElegir }) {
  return (
    <details className="menu-pdf">
      <summary className="btn btn-ghost btn-sm" aria-busy={Boolean(exportando) || undefined}>
        {exportando ? (
          <>
            <Spinner /> Generando PDF…
          </>
        ) : (
          "Exportar PDF ▾"
        )}
      </summary>
      <div className="menu-pdf-lista" role="menu">
        {opciones.map((o) => (
          <button
            key={o.id}
            type="button"
            role="menuitem"
            disabled={Boolean(exportando)}
            onClick={(e) => {
              e.currentTarget.closest("details").removeAttribute("open");
              onElegir(o.id);
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </details>
  );
}

export default ProyectoDetalle;
