import styles from '@/styles/SelectPokemon.module.css';
import { typeLabel } from '@/utils/i18n';

function formatMoveName(mv) {
  const raw = typeof mv === 'string' ? mv : (mv && mv.name) || '';
  if (!raw) return '';
  return raw.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PokemonGrid({
  pokemons = [],
  searchTerm = '',
  selectedType = '',
  evolutionStage = '',
  unlockedBossIds = new Set(),
  selected = [],
  toggleSelect,
}) {
  return (
    <div className={styles.pokemonGrid}>
      {pokemons
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchTerm) &&
            (selectedType ? p.types.includes(selectedType) : true) &&
            (evolutionStage ? p.evolutionStage === parseInt(evolutionStage) : true),
        )
        .map((p) => {
          const locked = p.boss && !unlockedBossIds.has(p.id);
          return (
            <div
              key={p.id}
              className={`${styles.pokemonCard} ${selected.includes(p) ? styles.selected : ''}`}
              onClick={() => toggleSelect && toggleSelect(p)}
              onMouseEnter={(e) => {
                if (locked) return;
                const animated = (p.sprites && p.sprites.animated) || p.animated;
                e.currentTarget.querySelector('img').src = animated;
              }}
              onMouseLeave={(e) => {
                const front = (p.sprites && p.sprites.front) || p.sprite;
                e.currentTarget.querySelector('img').src = front;
              }}
            >
              <img
                className={`${styles.pokemonImg} ${locked ? styles.bossLocked : ''}`}
                src={(p.sprites && p.sprites.front) || p.sprite}
                alt={p.name}
              />
              <h3 className={styles.pokemonName}>
                {p.name.charAt(0).toUpperCase() + p.name.slice(1)}
              </h3>

              <div className={styles.types}>
                {p.types.map((type, i) => (
                  <span key={i} className={`${styles.type} ${styles[type]}`}>
                    {typeLabel(type)}
                  </span>
                ))}
              </div>
              <h3 className={styles.golpes}>Golpes</h3>

              <ul className={styles.moves}>
                {(p.moves || []).map((move, i) => (
                  <li key={i}>{formatMoveName(move)}</li>
                ))}
              </ul>
            </div>
          );
        })}
    </div>
  );
}
