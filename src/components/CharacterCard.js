import styles from "./CharacterCard.module.css";

export default function CharacterCard({ name, onSelect }) {
  return (
    <div className={styles.card} onClick={onSelect}>
      <h3>{name}</h3>
    </div>
  );
}
