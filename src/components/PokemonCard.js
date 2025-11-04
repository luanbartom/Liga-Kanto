// Cartão simples para listar/selecionar um Pokémon com hover para animar sprite
import styles from "./PokemonCard.module.css";

export default function PokemonCard({ pokemon, selected, onSelect, hovered, setHovered }) {
  // Ao passar o mouse, alterna sprite estática/animada
  return (
    <div
      className={`${styles.card} ${selected ? styles.selected : ""}`}
      onClick={onSelect}
      onMouseEnter={() => setHovered(pokemon.id)}
      onMouseLeave={() => setHovered(null)}
    >
      <img
        src={hovered === pokemon.id ? pokemon.animated : (pokemon.image || pokemon.sprite)}
        alt={pokemon.name}
        className={styles.pokeImg}
      />
      <h3>{pokemon.name}</h3>
    </div>
  );
}
