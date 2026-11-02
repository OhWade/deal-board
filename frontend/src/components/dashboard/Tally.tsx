import styles from "./Dashboard.module.css";

const MAX_MARKS = 40;

/** Sales-board tally marks: groups of four strokes with a slash through for the fifth */
export default function Tally({ count }: { count: number }) {
  const shown = Math.min(count, MAX_MARKS);
  const groups = Math.ceil(shown / 5);
  const overflow = count - shown;

  if (count === 0) return <p className={styles.tallyEmpty}>No units yet</p>;

  return (
    <div className={styles.tally} aria-hidden="true">
      {Array.from({ length: groups }, (_, g) => {
        const marks = Math.min(5, shown - g * 5);
        return (
          <svg key={g} viewBox="0 0 34 28" className={styles.tallyGroup}>
            {Array.from({ length: Math.min(marks, 4) }, (_, i) => (
              <path key={i} d={`M${5 + i * 7} 3 L${4 + i * 7} 25`} />
            ))}
            {marks === 5 && <path d="M1 20 L32 7" />}
          </svg>
        );
      })}
      {overflow > 0 && <span className={styles.tallyMore}>+{overflow}</span>}
    </div>
  );
}
