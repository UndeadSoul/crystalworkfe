import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAlertas,
  SEVERIDAD_CLASS,
  SEVERIDAD_LABEL,
} from "../services/alertas";
import { posponer, reactivar, separar } from "../utils/alertasLocal";
import { FormError } from "../components/FormErrors";
import { Loader } from "../components/Loader";

function TarjetaAlerta({ alerta, onNavegar, onPosponer }) {
  return (
    <div className="alerta-card">
      <span className={SEVERIDAD_CLASS[alerta.severidad] || "badge badge-neutral"}>
        {SEVERIDAD_LABEL[alerta.severidad] || alerta.severidad}
      </span>
      <button type="button" className="alerta-texto" onClick={onNavegar}>
        <span className="alerta-titulo">{alerta.titulo}</span>
        {alerta.detalle && <span className="alerta-detalle">{alerta.detalle}</span>}
      </button>
      <details className="posponer">
        <summary className="btn btn-ghost btn-sm">Posponer</summary>
        <div className="posponer-menu">
          <button type="button" onClick={() => onPosponer(1)}>1 día</button>
          <button type="button" onClick={() => onPosponer(7)}>1 semana</button>
          <button type="button" onClick={() => onPosponer(30)}>1 mes</button>
        </div>
      </details>
    </div>
  );
}

function Alertas() {
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verPospuestas, setVerPospuestas] = useState(false);
  // Fuerza recomputar visibles/pospuestas tras posponer o reactivar.
  const [, setTick] = useState(0);
  const refrescar = () => setTick((n) => n + 1);

  useEffect(() => {
    let vivo = true;
    getAlertas()
      .then((d) => vivo && setAlertas(d.alertas || []))
      .catch(() => vivo && setError("No se pudieron cargar las alertas."))
      .finally(() => vivo && setLoading(false));
    return () => {
      vivo = false;
    };
  }, []);

  const { visibles, pospuestas } = separar(alertas);
  const criticas = visibles.filter((a) => a.severidad === "critica").length;
  const advertencias = visibles.length - criticas;

  const onPosponer = (clave, dias) => {
    posponer(clave, dias);
    refrescar();
  };
  const onReactivar = (clave) => {
    reactivar(clave);
    refrescar();
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>Alertas</h1>
        <p className="page-sub">Registros que necesitan tu atención.</p>
      </header>

      <FormError msg={error} />

      {loading ? (
        <Loader texto="Cargando alertas…" />
      ) : (
        <>
          {visibles.length === 0 ? (
            <div className="panel">
              <p className="muted pad">
                {pospuestas.length
                  ? "Nada pendiente por ahora (hay alertas pospuestas)."
                  : "Todo al día. No hay alertas por ahora."}
              </p>
            </div>
          ) : (
            <>
              <div className="alertas-resumen">
                {criticas > 0 && (
                  <span className="badge badge-danger">
                    {criticas} crítica{criticas === 1 ? "" : "s"}
                  </span>
                )}
                {advertencias > 0 && (
                  <span className="badge badge-warning">
                    {advertencias} advertencia{advertencias === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              <div className="alertas-list">
                {visibles.map((a) => (
                  <TarjetaAlerta
                    key={a.clave}
                    alerta={a}
                    onNavegar={() => navigate(a.ruta)}
                    onPosponer={(dias) => onPosponer(a.clave, dias)}
                  />
                ))}
              </div>
            </>
          )}

          {pospuestas.length > 0 && (
            <div className="alertas-pospuestas">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setVerPospuestas((v) => !v)}
              >
                {verPospuestas ? "Ocultar" : "Ver"} pospuestas ({pospuestas.length})
              </button>
              {verPospuestas && (
                <div className="alertas-list">
                  {pospuestas.map((a) => (
                    <div className="alerta-card is-pospuesta" key={a.clave}>
                      <span
                        className={SEVERIDAD_CLASS[a.severidad] || "badge badge-neutral"}
                      >
                        {SEVERIDAD_LABEL[a.severidad] || a.severidad}
                      </span>
                      <button
                        type="button"
                        className="alerta-texto"
                        onClick={() => navigate(a.ruta)}
                      >
                        <span className="alerta-titulo">{a.titulo}</span>
                        {a.detalle && (
                          <span className="alerta-detalle">{a.detalle}</span>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => onReactivar(a.clave)}
                      >
                        Reactivar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Alertas;
