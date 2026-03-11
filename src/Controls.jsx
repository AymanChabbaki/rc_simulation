import styles from './Controls.module.css';

export default function Controls({ state, setS1, setS2 }) {
  const { s1, s2, vg, V, A, dRam, precAm, R, Res2, resultatM, resultatC } = state;

  const cLabels = ['1 μF', '10 μF', '100 μF', '1 mF', '10 mF'];

  return (
    <div className={styles.controls}>
      <h2 className={styles.heading}>Paramètres</h2>

      <div className={styles.sectionsRow}>

      {/* Generator */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Générateur</div>
        <label className={styles.label}>
          Tension (E)
          <div className={styles.sliderRow}>
            <input
              type="range" min={-1} max={9} step={1}
              value={s1}
              onChange={e => setS1(Number(e.target.value))}
              className={styles.slider}
            />
            <span className={styles.val}>{vg.toFixed(1)} V</span>
          </div>
        </label>
      </div>

      {/* Capacitor */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Condensateur</div>
        <label className={styles.label}>
          Capacité (C)
          <div className={styles.sliderRow}>
            <input
              type="range" min={-1} max={3} step={1}
              value={s2}
              onChange={e => setS2(Number(e.target.value))}
              className={styles.slider}
            />
            <span className={styles.val}>
              {Res2 >= 1 && Res2 <= 5 ? cLabels[Res2 - 1] : '—'}
            </span>
          </div>
        </label>
      </div>

      {/* Measurements display */}
      <div className={`${styles.section} ${styles.sectionMeasures}`}>
        <div className={styles.sectionTitle}>Mesures</div>
        <table className={styles.table}>
          <tbody>
            <tr><td>R réelle</td><td>{R.toFixed(0)} Ω</td></tr>
            <tr><td>V mesurée</td><td>{V.toFixed(3)} V</td></tr>
            <tr><td>I mesurée</td><td>{A.toExponential(3)} A</td></tr>
            <tr><td>δR</td><td>{dRam.toFixed(2)} Ω</td></tr>
            <tr><td>Précision</td><td>{(precAm * 100).toFixed(2)} %</td></tr>
          </tbody>
        </table>

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

      </div>{/* sectionsRow */}
    </div>
  );
}
