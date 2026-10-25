import { useState } from "react";
import { Link } from "react-router-dom";
import { anularPago, registrarPago, ESTADO_PAGO_CLASS } from "../services/proyectos";
import { blockNonIntegerKey, formatCLP, formatFecha, formatFechaHora, formatMedidas } from "../utils/format";
import { parseApiError } from "../utils/errors";
import {
  EJEMPLOS,
  LIMITES,
  PERMITIDOS,
  filtrar,
  validarPago,
} from "../utils/validacion";
import { FieldError, FormError } from "./FormErrors";
import { BotonCarga } from "./Loader";
import MotivoModal from "./MotivoModal";

/**
 * Pagos (abonos) de un proyecto: resumen, historial, registrar y anular.
 * El estado de pago lo calcula el servidor a partir de los pagos vigentes.
 *   proyecto:     detalle del proyecto (con pagos, total_bruto y saldo).
 *   puedeAnular:  solo el jefe anula pagos.
 *   onActualizado(proyecto): el servidor responde el proyecto actualizado.
 */
function PagosPanel({ proyecto, puedeAnular, onActualizado }) {
  // Rango de fechas válido: lo calcula el servidor (hora de Chile), para no
  // depender del reloj ni de la zona horaria de este computador.
  const hoy = proyecto.fecha_hoy;
  const fechaMin = proyecto.fecha_min_pago;
  const vacio = { monto: "", fecha: hoy, comentario: "" };

  const [form, setForm] = useState(vacio);
  const [errores, setErrores] = useState({});
  const [general, setGeneral] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [anulando, setAnulando] = useState(null); // pago a anular (modal)

  const set = (campo, valor, aviso = "") => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: aviso }));
  };

  const registrar = async (e) => {
    e.preventDefault();
    setGeneral("");
    const locales = validarPago(form, { saldo: proyecto.saldo, fechaMin, hoy });
    setErrores(locales);
    if (Object.keys(locales).length) return;

    setGuardando(true);
    try {
      onActualizado(
        await registrarPago(proyecto.id, {
          monto: Number(form.monto),
          fecha: form.fecha,
          comentario: form.comentario.trim(),
        })
      );
      setForm(vacio);
    } catch (err) {
      const { general: g, campos } = parseApiError(err, {
        fallback: "No se pudo registrar el pago.",
        visibles: ["monto", "fecha", "comentario"],
      });
      setErrores(campos);
      setGeneral(g);
    } finally {
      setGuardando(false);
    }
  };

  const pagado = proyecto.saldo <= 0;
  const cancelado = proyecto.estado_produccion === "CANCELADO";

  return (
    <div className="panel">
      <div className="crud-head">
        <h2>Información de pagos</h2>
        <span className={ESTADO_PAGO_CLASS[proyecto.estado_pago]}>
          {proyecto.estado_pago_display}
        </span>
      </div>
      <p className="muted small">
        Precios según la{" "}
        <Link to={`/cotizaciones/${proyecto.cotizacion.id}`} className="link-inline">
          cotización #{proyecto.cotizacion.id} →
        </Link>
      </p>

      <DesglosePrecio proyecto={proyecto} />

      <h3 className="sub">Pagos</h3>
      {proyecto.pagos.length === 0 ? (
        <p className="muted">Aún no se registran pagos.</p>
      ) : (
        <div className="table-scroll">
          <table className="table table-compact">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Comentario</th>
                <th>Registrado</th>
                <th>Estado</th>
                {puedeAnular && <th className="col-actions"></th>}
              </tr>
            </thead>
            <tbody>
              {proyecto.pagos.map((p) => (
                <tr key={p.id} className={p.anulado ? "pago-anulado" : ""}>
                  <td>{formatFecha(p.fecha)}</td>
                  <td>{formatCLP(p.monto)}</td>
                  <td>{p.comentario || "—"}</td>
                  <td>
                    {/* Cuándo se registró (hora del servidor): permite ver si
                        un pago se registró con una fecha anterior. */}
                    {p.registrado_por_nombre || "—"}
                    <small className="muted small pago-motivo">
                      {formatFechaHora(p.creado_en)}
                    </small>
                  </td>
                  <td>
                    {p.anulado ? (
                      <span
                        className="badge badge-neutral"
                        title={`Anulado por ${p.anulado_por_nombre} el ${formatFechaHora(p.anulado_en)}: ${p.motivo_anulacion}`}
                      >
                        Anulado
                      </span>
                    ) : (
                      <span className="badge badge-success">Vigente</span>
                    )}
                    {p.anulado && (
                      <small className="muted small pago-motivo">
                        {p.anulado_por_nombre} · {formatFechaHora(p.anulado_en)} ·{" "}
                        {p.motivo_anulacion}
                      </small>
                    )}
                  </td>
                  {puedeAnular && (
                    <td className="col-actions">
                      {!p.anulado && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setAnulando(p)}
                        >
                          Anular
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {cancelado ? (
        <p className="muted small">
          El proyecto está cancelado: no se registran pagos nuevos.
        </p>
      ) : pagado ? (
        <p className="muted small">El proyecto está pagado por completo.</p>
      ) : (
        <form className="pago-form" onSubmit={registrar} noValidate>
          <h3 className="sub">Registrar pago</h3>
          <div className="field-row">
            <label className="field">
              <span>Monto (CLP) *</span>
              <input
                type="number"
                min="1"
                max={proyecto.saldo}
                step="1"
                placeholder={EJEMPLOS.montoPago}
                value={form.monto}
                aria-invalid={Boolean(errores.monto)}
                onKeyDown={blockNonIntegerKey}
                onChange={(e) => set("monto", e.target.value)}
              />
              <FieldError msg={errores.monto} />
              {!errores.monto && (
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => set("monto", String(proyecto.saldo))}
                >
                  Usar saldo completo ({formatCLP(proyecto.saldo)})
                </button>
              )}
            </label>
            <label className="field">
              <span>Fecha *</span>
              <input
                type="date"
                min={fechaMin}
                max={hoy}
                value={form.fecha}
                aria-invalid={Boolean(errores.fecha)}
                onChange={(e) => set("fecha", e.target.value)}
              />
              <FieldError msg={errores.fecha} />
            </label>
          </div>
          <label className="field">
            <span>Comentario</span>
            <input
              value={form.comentario}
              maxLength={LIMITES.pagoComentarioMax}
              placeholder={EJEMPLOS.comentarioPago}
              aria-invalid={Boolean(errores.comentario)}
              onChange={(e) => {
                const { valor, mensaje } = filtrar(e.target.value, PERMITIDOS.comentario);
                set("comentario", valor, mensaje);
              }}
            />
            <FieldError msg={errores.comentario} />
          </label>
          <FormError msg={general} />
          <BotonCarga type="submit" className="btn btn-primary btn-sm" cargando={guardando}>
            Registrar pago
          </BotonCarga>
        </form>
      )}

      {anulando && (
        <MotivoModal
          titulo="Anular pago"
          placeholder={EJEMPLOS.motivo}
          textoBoton="Anular pago"
          textoCargando="Anulando…"
          onConfirmar={async (motivo) => {
            onActualizado(await anularPago(proyecto.id, anulando.id, motivo));
            setAnulando(null);
          }}
          onClose={() => setAnulando(null)}
        >
          <p>
            Pago de <strong>{formatCLP(anulando.monto)}</strong> del{" "}
            {formatFecha(anulando.fecha)}. No se borra: queda en el historial como
            anulado y deja de contar para el saldo.
          </p>
        </MotivoModal>
      )}
    </div>
  );
}

/**
 * Desglose del precio del proyecto (de su cotización aprobada): ventanas,
 * transporte y monto agregado (con el comentario que lo explica), neto, IVA y
 * total; y lo pagado y el saldo. Neto = suma de los conceptos.
 */
function DesglosePrecio({ proyecto }) {
  const cot = proyecto.cotizacion;
  const medidas = (v) => formatMedidas(v.ancho_mm, v.alto_mm);

  return (
    <div className="table-scroll">
      <table className="table table-compact desglose">
        <thead>
          <tr>
            <th>Concepto</th>
            <th className="num">Cant.</th>
            <th className="num">Precio unit.</th>
            <th className="num">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {cot.ventanas.map((v, i) => (
            <tr key={v.id}>
              <td>
                Ventana {i + 1} · {v.tipo_display}
                <small className="muted small desglose-detalle">
                  {medidas(v)} · {v.color_display} · {v.vidrio_display}
                </small>
              </td>
              <td className="num">{v.cantidad}</td>
              {v.precio_calculado ? (
                <>
                  <td className="num">{formatCLP(v.precio_unitario)}</td>
                  <td className="num">{formatCLP(v.subtotal)}</td>
                </>
              ) : (
                <td className="num" colSpan={2}>
                  <span className="badge badge-warning">Sin precio</span>
                </td>
              )}
            </tr>
          ))}
          {cot.requiere_transporte && (
            <tr>
              <td>
                Transporte e instalación
                <small className="muted small desglose-detalle">
                  {cot.distancia_transporte_km} km
                </small>
              </td>
              <td className="num"></td>
              <td className="num"></td>
              <td className="num">{formatCLP(cot.costo_transporte)}</td>
            </tr>
          )}
          {/* Costo que no corresponde a una ventana (servicio o producto sin
              formato), descrito en el comentario de la cotización. */}
          {(Number(cot.monto_agregado) > 0 || cot.comentarios?.trim()) && (
            <tr>
              <td>
                Costo adicional
                <small className="muted small desglose-detalle">
                  {cot.comentarios || "Sin descripción"}
                </small>
              </td>
              <td className="num"></td>
              <td className="num"></td>
              <td className="num">{formatCLP(cot.monto_agregado)}</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>Neto</td>
            <td className="num">{formatCLP(cot.total)}</td>
          </tr>
          <tr>
            <td colSpan={3}>IVA (19%)</td>
            <td className="num">{formatCLP(cot.iva)}</td>
          </tr>
          <tr className="desglose-total">
            <td colSpan={3}>Total (bruto)</td>
            <td className="num">{formatCLP(cot.total_bruto)}</td>
          </tr>
          <tr>
            <td colSpan={3}>Pagado</td>
            <td className="num">{formatCLP(proyecto.monto_abonado)}</td>
          </tr>
          <tr className="desglose-total">
            <td colSpan={3}>Saldo</td>
            <td className="num">{formatCLP(proyecto.saldo)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default PagosPanel;
