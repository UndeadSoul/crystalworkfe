import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { roleLabel } from "../utils/roles";
import { getResumen, getIngresos, RANGOS_INGRESOS } from "../services/analytics";
import { listCotizaciones } from "../services/cotizaciones";
import { formatCLP, formatFecha } from "../utils/format";

// Color semántico (paleta de badges) por valor de estado.
const COLOR_ESTADO = {
  PENDIENTE: "var(--c-warning)",
  APROBADA: "var(--c-success)",
  RECHAZADA: "var(--c-danger)",
  POR_INICIAR: "var(--c-neutral)",
  EN_FABRICACION: "var(--c-warning)",
  TERMINADO: "var(--c-success)",
  ENTREGADO: "var(--c-info)",
};
const COLOR_PAGO = {
  PENDIENTE: "var(--c-danger)",
  ABONADO: "var(--c-warning)",
  PAGADO: "var(--c-success)",
};

// Paleta categórica para el donut por tipo (slots validados).
const SERIES = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--c-neutral)",
];
// Color real del aluminio, para el donut por color.
const COLOR_ALUMINIO = {
  BRONCE: "#3f3f46",
  MATE: "#e5e7eb",
  ALUMINIO: "#9ca3af",
  TITANEO: "#71717a",
  MADERA: "#92400e",
};

function StatTile({ label, valor, sub, to }) {
  const inner = (
    <>
      <span className="stat-valor">{valor}</span>
      <span className="stat-label">{label}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </>
  );
  return to ? (
    <Link to={to} className="stat-tile stat-tile-link">
      {inner}
    </Link>
  ) : (
    <div className="stat-tile">{inner}</div>
  );
}

// Barras horizontales (desgloses de estado): etiqueta + valor siempre visibles.
function Barras({ items, colorFn }) {
  const max = Math.max(1, ...items.map((i) => i.n));
  const total = items.reduce((s, i) => s + i.n, 0);
  if (total === 0) return <p className="muted">Sin datos todavía.</p>;
  return (
    <div className="barras">
      {items.map((i) => (
        <div className="barra-row" key={i.valor}>
          <span className="barra-label">{i.label}</span>
          <div className="barra-track">
            <div
              className="barra-fill"
              style={{
                width: `${(i.n / max) * 100}%`,
                background: colorFn ? colorFn(i) : "var(--primary)",
              }}
            />
          </div>
          <span className="barra-valor">{i.n}</span>
        </div>
      ))}
    </div>
  );
}

// Donut de composición (ventanas por tipo o color). Identidad por leyenda.
function Donut({ items, colorFor }) {
  const total = items.reduce((s, i) => s + i.cantidad, 0);
  if (!total) return <p className="muted">Sin ventanas fabricadas todavía.</p>;

  const r = 60;
  const c = 2 * Math.PI * r;
  const gap = total > 1 ? 3 : 0;
  let acc = 0;

  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 160 160" className="donut" role="img" aria-label="Composición de ventanas">
        <circle cx="80" cy="80" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="24" />
        {items.map((i, idx) => {
          const frac = i.cantidad / total;
          const len = Math.max(frac * c - gap, 0);
          const seg = (
            <circle
              key={i.valor}
              cx="80"
              cy="80"
              r={r}
              fill="none"
              stroke={colorFor(i, idx)}
              strokeWidth="24"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-acc}
              transform="rotate(-90 80 80)"
            >
              <title>
                {i.label}: {i.cantidad}
              </title>
            </circle>
          );
          acc += frac * c;
          return seg;
        })}
        <text x="80" y="76" textAnchor="middle" className="donut-total">
          {total}
        </text>
        <text x="80" y="94" textAnchor="middle" className="donut-cap">
          ventanas
        </text>
      </svg>
      <ul className="donut-legend">
        {items.map((i, idx) => (
          <li key={i.valor}>
            <span className="swatch" style={{ background: colorFor(i, idx) }} />
            <span className="leg-label">{i.label}</span>
            <span className="leg-val">
              {i.cantidad} · {Math.round((i.cantidad / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Columnas de ingresos. Soporta muchos buckets (scroll + tooltip).
function Columnas({ items }) {
  const max = Math.max(1, ...items.map((i) => i.total));
  const hayDatos = items.some((i) => i.total > 0);
  const many = items.length > 12;
  if (!hayDatos) return <p className="muted">Sin ingresos en este período.</p>;
  return (
    <div className="columnas-scroll">
      <div className={`columnas ${many ? "columnas-densas" : ""}`}>
        {items.map((i, idx) => (
          <div className="columna-col" key={idx} title={`${i.label}: ${formatCLP(i.total)}`}>
            {!many && (
              <span className="columna-valor">
                {i.total ? formatCLP(i.total) : ""}
              </span>
            )}
            <div className="columna-track">
              <div
                className="columna-fill"
                style={{ height: `${(i.total / max) * 100}%` }}
              />
            </div>
            <span className="columna-label">{i.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vtModo, setVtModo] = useState("tipo"); // donut: tipo | color
  const [rango, setRango] = useState("6meses");
  const [ingresos, setIngresos] = useState(null);

  useEffect(() => {
    Promise.all([getResumen(), listCotizaciones({ estado: "PENDIENTE" })])
      .then(([resumen, pend]) => {
        setData(resumen);
        setPendientes(pend);
      })
      .finally(() => setLoading(false));
  }, []);

  // Ingresos (solo jefe/admin): se cargan TODOS los rangos una vez.
  // Cambiar el rango no recarga nada: se elige de lo ya cargado.
  useEffect(() => {
    if (!data?.ver_finanzas) return;
    getIngresos()
      .then(setIngresos)
      .catch(() => setIngresos({ series: {} }));
  }, [data]);

  if (loading) return <div className="page-loading">Cargando…</div>;

  const k = data.kpis;
  const ventanas =
    vtModo === "tipo" ? data.ventanas_por_tipo : data.ventanas_por_color;
  const colorDonut =
    vtModo === "tipo"
      ? (_, idx) => SERIES[idx % SERIES.length]
      : (i) => COLOR_ALUMINIO[i.valor] || "var(--c-neutral)";

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Hola, {user.first_name || user.username}</h1>
          <p className="page-sub">
            {roleLabel(user)}
            {user.empresa_nombre ? ` · ${user.empresa_nombre}` : ""}
          </p>
        </div>
      </header>

      {/* KPIs */}
      <section className="stat-grid">
        <StatTile
          label="Cotizaciones pendientes"
          valor={k.cotizaciones_pendientes}
          to="/cotizaciones?estado=PENDIENTE"
        />
        <StatTile
          label="Proyectos activos"
          valor={k.proyectos_activos}
          sub="Por iniciar + en fabricación"
          to="/proyectos"
        />
        <StatTile label="Clientes" valor={k.clientes} to="/clientes" />
        {data.ver_finanzas && (
          <>
            <StatTile label="Facturado" valor={formatCLP(k.facturado)} sub="Con IVA" />
            <StatTile
              label="Por cobrar"
              valor={formatCLP(k.por_cobrar)}
              sub="Pendientes, menos abonos"
              to="/proyectos?pago=PENDIENTE"
            />
          </>
        )}
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>Cotizaciones por estado</h2>
          <Barras
            items={data.cotizaciones_por_estado}
            colorFn={(i) => COLOR_ESTADO[i.valor] || "var(--primary)"}
          />
        </article>

        <article className="panel">
          <div className="crud-head">
            <h2>Ventanas fabricadas</h2>
            <div className="seg">
              <button
                className={`seg-btn ${vtModo === "tipo" ? "active" : ""}`}
                onClick={() => setVtModo("tipo")}
              >
                Tipo
              </button>
              <button
                className={`seg-btn ${vtModo === "color" ? "active" : ""}`}
                onClick={() => setVtModo("color")}
              >
                Color
              </button>
            </div>
          </div>
          <Donut items={ventanas} colorFor={colorDonut} />
        </article>

        <article className="panel">
          <h2>Proyectos · fabricación</h2>
          <Barras
            items={data.proyectos_por_produccion}
            colorFn={(i) => COLOR_ESTADO[i.valor] || "var(--primary)"}
          />
        </article>

        <article className="panel">
          <h2>Proyectos · pago</h2>
          <Barras
            items={data.proyectos_por_pago}
            colorFn={(i) => COLOR_PAGO[i.valor] || "var(--primary)"}
          />
        </article>
      </section>

      {data.ver_finanzas && (
        <section className="panel">
          <div className="crud-head">
            <h2>Ingresos de proyectos (con IVA)</h2>
            <div className="seg">
              {RANGOS_INGRESOS.map((o) => (
                <button
                  key={o.value}
                  className={`seg-btn ${rango === o.value ? "active" : ""}`}
                  onClick={() => setRango(o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          {ingresos === null ? (
            <p className="muted">Cargando…</p>
          ) : (
            <Columnas items={ingresos.series?.[rango] || []} />
          )}
        </section>
      )}

      {pendientes.length > 0 && (
        <section className="panel">
          <h2>Pendientes de aprobación ({pendientes.length})</h2>
          <ul className="pendientes-list">
            {pendientes.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link to={`/cotizaciones/${c.id}`}>
                  #{c.id} · {c.cliente_nombre}
                </Link>
                <span className="muted small">
                  {formatCLP(c.total_bruto)} · {formatFecha(c.fecha_ingreso)}
                </span>
              </li>
            ))}
          </ul>
          {pendientes.length > 6 && (
            <Link to="/cotizaciones" className="link-back">
              Ver todas →
            </Link>
          )}
        </section>
      )}
    </div>
  );
}

export default Dashboard;
