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

      <div className="app-body">
        <Palette onSelect={showCategory} />

        <div className="board-wrapper">
          <div className="board-label">Circuit</div>
          <CircuitBoard
            state={state}
            onDrop={drop}
            onReset={reset}
            W={600}
            H={600}
          />
        </div>

        {showGraph && (
          <div className="graph-wrapper">
            <div className="graph-label">Courbe RC</div>
            <RCGraph
              type={state.dernierSchema}
              R={state.R}
              Res2={state.Res2}
              vg={state.vg}
            />
          </div>
        )}

        <Controls
          state={state}
          setS1={setS1}
          setS2={setS2}
          setCalibreV={setCalibreV}
          setCalibreA={setCalibreA}
        />
      </div>
    </div>
  );
}
