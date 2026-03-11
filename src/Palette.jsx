import styles from './Palette.module.css';

const CATEGORIES = [
  { n: 1, src: '/images/Resistance.png', label: 'Résistance' },
  { n: 3, src: '/images/C (1).png',      label: 'Condensateur' },
  { n: 5, src: '/images/C (2).png',      label: 'Interrupteur' },
  { n: 7, src: '/images/Pile.png',       label: 'Pile' },
];

export default function Palette({ onSelect }) {
  return (
    <div className={styles.palette}>
      <div className={styles.title}>Composants</div>
      {CATEGORIES.map(cat => (
        <button key={cat.n} className={styles.btn} onClick={() => onSelect(cat.n)}>
          <img src={cat.src} alt={cat.label} className={styles.img} />
          <span>{cat.label}</span>
        </button>
      ))}
    </div>
  );
}
