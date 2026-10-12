import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getProyecto,
  getHojaCorte,
  getProyectoCambios,
  updateProyecto,
  ESTADOS_PRODUCCION,
  ESTADO_PROD_CLASS,
  ESTADOS_PAGO,
  ESTADO_PAGO_CLASS,
} from "../services/proyectos";
import { blockExponentKey, formatCLP, formatFecha } from "../utils/format";
import CambiosModal from "../components/CambiosModal";

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
  { key: "largo_mm", label: "Largo (mm)", tipo: "num" },
  { key: "cantidad", label: "Cant.", tipo: "num" },
];

function ProyectoDetalle() {
  const { id } = useParams();
  const [proy, setProy] = useState(null);
  const [piezas, setPiezas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [cambiosOpen, setCambiosOpen] = useState(false);
  const [abono, setAbono] = useState("");
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

  useEffect(() => {
    setLoading(true);
    Promise.all([getProyecto(id), getHojaCorte(id)])
      .then(([p, h]) => {
        setProy(p);
        setAbono(p.monto_abonado ?? "");
        setPiezas(h.piezas);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const cambiar = async (data) => {
    setGuardando(true);
    try {
      const p = await updateProyecto(id, data);
      setProy(p);
      setAbono(p.monto_abonado ?? "");
    } catch {
      alert("No se pudo actualizar.");
    } finally {
      setGuardando(false);
    }
  };

  const cambiarPago = (valor) =>
    // Al volver a "Pendiente" se limpia el abono previo.
    cambiar(
      valor === "PENDIENTE"
        ? { estado_pago: valor, monto_abonado: 0 }
        : { estado_pago: valor }
    );

  const guardarAbono = () => {
    if (String(abono || 0) !== String(proy.monto_abonado ?? 0)) {
      cambiar({ monto_abonado: abono || 0 });
    }
  };

  if (loading) return <div className="page-loading">Cargando…</div>;
  if (notFound)
    return (
      <div className="page">
        <p className="muted">Proyecto no encontrado.</p>
        <Link to="/proyectos" className="link-back">
          ← Volver a proyectos
        </Link>
      </div>
    );

  const cot = proy.cotizacion;

  return (
    <div className="page">
      <Link to="/proyectos" className="link-back">
        ← Volver a proyectos
      </Link>

      <header className="page-head page-head-row">
        <div>
          <h1>Proyecto #{proy.id}</h1>
          <p className="page-sub">
            {proy.cliente_nombre} · Creado el {formatFecha(proy.fecha_creacion)} ·
            Total {formatCLP(cot.total_bruto)}
          </p>
        </div>
        <div className="actions">
          <span className={ESTADO_PROD_CLASS[proy.estado_produccion]}>
            {proy.estado_display}
          </span>
          <span className={ESTADO_PAGO_CLASS[proy.estado_pago]}>
            {proy.estado_pago_display}
          </span>
        </div>
      </header>

      <div className="panel">
        <h2>Cliente</h2>
        <div className="detail-grid">
          <Dato label="Nombre">{proy.cliente_nombre}</Dato>
          <Dato label="Contacto">{proy.cliente_telefono}</Dato>
          <Dato label="Dirección del proyecto">{cot.direccion_entrega}</Dato>
        </div>
      </div>

      <div className="panel">
        <div className="crud-head">
          <h2>Estado</h2>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setCambiosOpen(true)}
          >
            Control de cambios
          </button>
        </div>
        <div className="estado-selector">
          <label className="field">
            <span>Fabricación</span>
            <select
              value={proy.estado_produccion}
              disabled={guardando}
              onChange={(e) => cambiar({ estado_produccion: e.target.value })}
            >
              {ESTADOS_PRODUCCION.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Pago</span>
            <select
              value={proy.estado_pago}
              disabled={guardando}
              onChange={(e) => cambiarPago(e.target.value)}
            >
              {ESTADOS_PAGO.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {proy.estado_pago === "ABONADO" && (
            <label className="field">
              <span>Monto abonado (CLP)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={abono}
                disabled={guardando}
                onKeyDown={blockExponentKey}
                onChange={(e) => setAbono(e.target.value)}
                onBlur={guardarAbono}
              />
            </label>
          )}
        </div>
        <Link to={`/cotizaciones/${cot.id}`} className="link-back">
          Ver cotización #{cot.id} →
        </Link>
      </div>

      <div className="panel">
        <h2>Totales</h2>
        <div className="detail-grid">
          <Dato label="Neto">{formatCLP(cot.total)}</Dato>
          <Dato label="IVA (19%)">{formatCLP(cot.iva)}</Dato>
          <Dato label="Total (bruto)">
            <strong>{formatCLP(cot.total_bruto)}</strong>
          </Dato>
          {proy.estado_pago === "ABONADO" && (
            <>
              <Dato label="Abonado">{formatCLP(proy.monto_abonado)}</Dato>
              <Dato label="Saldo (bruto)">
                {formatCLP(
                  Math.max((cot.total_bruto || 0) - (proy.monto_abonado || 0), 0)
                )}
              </Dato>
            </>
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
              <th>Medidas (mm)</th>
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
                  {v.ancho_mm} × {v.alto_mm}
                </td>
                <td>{v.cantidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div className="panel panel-flush">
        <div className="pad">
          <h2>Hoja de corte</h2>
          <p className="muted small">
            Piezas de aluminio a cortar (consolidadas por tipo, perfil y largo).
          </p>
        </div>
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
                <tr key={i}>
                  <td>
                    <strong>{p.codigo}</strong>
                  </td>
                  <td>{p.tipo_display}</td>
                  <td>{p.color_display}</td>
                  <td>{p.perfil}</td>
                  <td>{p.largo_mm}</td>
                  <td>{p.cantidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {cambiosOpen && (
        <CambiosModal
          title={`Control de cambios · Proyecto #${proy.id}`}
          cargar={() => getProyectoCambios(id)}
          onClose={() => setCambiosOpen(false)}
          mostrarObjeto={false}
        />
      )}
    </div>
  );
}

export default ProyectoDetalle;
