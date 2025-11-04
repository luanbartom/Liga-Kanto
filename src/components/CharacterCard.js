// Cartão de personagem/treinador clicável
import styles from "./CharacterCard.module.css";

export default function CharacterCard({ name, onSelect }) {
  // Componente minimalista apenas para clique/seleção
  return (
    <div className={styles.card} onClick={onSelect}>
      <h3>{name}</h3>
    </div>
  );
}
