import styles from './Palette.module.css';

const CATEGORIES = [
  { n: 1, img: '/images/R-H.png',  label: 'Résistance'   },
  { n: 3, img: '/images/C-h.png',  label: 'Condensateur' },
  { n: 5, img: '/images/I.png',    label: 'Interrupteur' },
  { n: 7, img: '/images/Pile.png', label: 'Pile'         },
];

export default function Palette({ onSelect }) {
  return (
    <div className={styles.palette}>
      <div className={styles.title}>Composants</div>
      {CATEGORIES.map(cat => (
        <button key={cat.n} className={styles.btn} onClick={() => onSelect(cat.n)}>
          <img src={cat.img} alt={cat.label} className={styles.compImg} draggable={false} />
          <span className={styles.compLabel}>{cat.label}</span>
        </button>
      ))}
    </div>
  );
}
