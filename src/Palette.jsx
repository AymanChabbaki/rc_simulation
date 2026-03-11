import styles from './Palette.module.css';

const CATEGORIES = [
  { n: 1, letter: 'R', label: 'Résistance',   color: '#3f6f00' },
  { n: 3, letter: 'C', label: 'Condensateur', color: '#0e7490' },
  { n: 5, letter: 'I', label: 'Interrupteur', color: '#8a4f00' },
  { n: 7, letter: 'E', label: 'Pile',         color: '#9f1239' },
];

export default function Palette({ onSelect }) {
  return (
    <div className={styles.palette}>
      <div className={styles.title}>Composants</div>
      {CATEGORIES.map(cat => (
        <button key={cat.n} className={styles.btn} onClick={() => onSelect(cat.n)}
          style={{ '--cat-color': cat.color }}>
          <span className={styles.letter}>{cat.letter}</span>
          <span className={styles.label}>{cat.label}</span>
        </button>
      ))}
    </div>
  );
}
