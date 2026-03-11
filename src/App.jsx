import CircuitBoard from './CircuitBoard';
import Palette      from './Palette';
import RCGraph      from './RCGraph';
import Controls     from './Controls';
import { useSimulation } from './useSimulation';
import './App.css';

export default function App() {
  const { state, reset, showCategory, drop, setS1, setS2, setCalibreV, setCalibreA } = useSimulation();

  const showGraph = state.dernierSchema === 'charge' || state.dernierSchema === 'decharge';

  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="app-title">RC — Simulation</span>
        <span className="app-subtitle">
          Laboratoire virtuel · Charge &amp; Décharge d&apos;un condensateur
        </span>
      </header>

      <div className="app-body">
        <Palette onSelect={showCategory} />

        <div className="board-wrapper">
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
