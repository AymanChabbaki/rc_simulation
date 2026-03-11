import CircuitBoard from './CircuitBoard';
import Palette      from './Palette';
import RCGraph      from './RCGraph';
import Controls     from './Controls';
import { useSimulation } from './useSimulation';
import './App.css';

export default function App() {
  const { state, reset, showCategory, drop, setS1, setS2, setCalibreV, setCalibreA } = useSimulation();

  const showGraph = state.dernierSchema === 'charge' || state.dernierSchema === 'decharge';

  const schemaLabel =
    state.dernierSchema === 'charge'   ? 'Charge' :
    state.dernierSchema === 'decharge' ? 'Décharge' : null;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-logo">RC</div>
        <div className="header-text">
          <span className="app-title">Simulation RC</span>
          <span className="app-subtitle">Charge &amp; Décharge · Condensateur</span>
        </div>
        <div className="header-badge">
          {schemaLabel ? (
            <span className={`schema-chip ${state.dernierSchema}`}>{schemaLabel}</span>
          ) : (
            <span className="schema-chip idle">En attente</span>
          )}
        </div>
      </header>

      {/* ── Main area: Palette (outside body) + content ─────────── */}
      <div className="main-area">

        {/* Palette — vertical, sibling of app-body */}
        <Palette onSelect={showCategory} />

        <div className="app-body">

          {/* ── Circuit Board ────────────────────────────────────── */}
          <div className="board-wrapper">
            <div className="board-label">Circuit</div>
            <CircuitBoard
              state={state}
              onDrop={drop}
              onReset={reset}
              W={560}
              H={560}
            />
          </div>

          {/* ── Right: Graph beside vertical Controls ─────────────── */}
          <div className="right-panel">
            <div className="graph-wrapper">
              <div className="graph-label">Courbe RC</div>
              {showGraph
                ? <RCGraph
                    type={state.dernierSchema}
                    R={state.R}
                    Res2={state.Res2}
                    vg={state.vg}
                  />
                : <div className="graph-placeholder">
                    <span>Assemblez le circuit<br/>pour voir la courbe</span>
                  </div>
              }
            </div>
            <Controls
              state={state}
              setS1={setS1}
              setS2={setS2}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
