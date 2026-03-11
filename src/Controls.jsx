import styles from './Controls.module.css';
import { CAL_V, CAL_A } from './simulation';

export default function Controls({ state, setS1, setS2, setCalibreV, setCalibreA }) {
  const { s1, s2, vg, Cv, Ca, V, A, dRam, precAm, R, Res2, resultatM, resultatC } = state;

  return (
    <div className={styles.controls}>
      <h2 className={styles.heading}>Paramètres</h2>

      {/* Generator voltage */}
      <label className={styles.label}>
        Tension générateur (E)
        <input
          type="range" min={-1} max={9} step={1}
          value={s1}
          onChange={e => setS1(Number(e.target.value))}
          className={styles.slider}
        />
        <span className={styles.val}>{vg.toFixed(1)} V</span>
      </label>

      {/* Capacitor selector */}
      <label className={styles.label}>
        Condensateur (C)
        <input
          type="range" min={-1} max={3} step={1}
          value={s2}
          onChange={e => setS2(Number(e.target.value))}
          className={styles.slider}
        />
        <span className={styles.val}>
          {Res2 >= 1 && Res2 <= 5
            ? `${([1, 10, 100, 1000, 10000][Res2 - 1])} μF`
            : '—'}
        </span>
      </label>

      <hr className={styles.hr} />

      {/* Voltmeter calibration */}
      <div className={styles.meter}>
        <span className={styles.meterLabel}>Voltmètre:</span>
        <div className={styles.btnRow}>
          {CAL_V.map((v, i) => (
            <button
              key={i}
              className={`${styles.calBtn} ${Cv === i ? styles.active : ''}`}
              onClick={() => setCalibreV(i)}
            >
              {v < 1 ? `${v * 1000}mV` : `${v}V`}
            </button>
          ))}
        </div>
      </div>

      {/* Ammeter calibration */}
      <div className={styles.meter}>
        <span className={styles.meterLabel}>Ampèremètre:</span>
        <div className={styles.btnRow}>
          {CAL_A.map((a, i) => (
            <button
              key={i}
              className={`${styles.calBtn} ${Ca === i ? styles.active : ''}`}
              onClick={() => setCalibreA(i)}
            >
              {a < 0.01 ? `${a * 1000}mA` : `${a}A`}
            </button>
          ))}
        </div>
      </div>

      <hr className={styles.hr} />

      {/* Measurements display */}
      <table className={styles.table}>
        <tbody>
          <tr><td>R (réel)</td><td>{R.toFixed(0)} Ω</td></tr>
          <tr><td>V mesurée</td><td>{V.toFixed(3)} V</td></tr>
          <tr><td>I mesurée</td><td>{A.toExponential(3)} A</td></tr>
          <tr><td>δR (incertitude)</td><td>{dRam.toFixed(2)} Ω</td></tr>
          <tr><td>Précision rel.</td><td>{(precAm * 100).toFixed(2)} %</td></tr>
        </tbody>
      </table>

      <hr className={styles.hr} />

      {resultatC && (
        <div className={`${styles.badge} ${resultatC.includes('valide') ? styles.ok : styles.err}`}>
          {resultatC}
        </div>
      )}

      {resultatM && (
        <div className={`${styles.badge} ${resultatM.includes('correct') ? styles.ok : styles.err}`}>
          {resultatM}
        </div>
      )}
    </div>
  );
}
