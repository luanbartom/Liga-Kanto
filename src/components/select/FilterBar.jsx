import styles from '@/styles/SelectPokemon.module.css';
import { MAX_SEARCH_LEN } from '@/constants';

export default function FilterBar({
  searchTerm,
  setSearchTerm,
  selectedType,
  setSelectedType,
  evolutionStage,
  setEvolutionStage,
}) {
  return (
    <div className={styles.filterBar}>
      <input
        type="text"
        placeholder="Buscar Pokémon..."
        value={searchTerm}
        maxLength={MAX_SEARCH_LEN}
        onChange={(e) => setSearchTerm(e.target.value.slice(0, MAX_SEARCH_LEN).toLowerCase())}
        className={styles.searchInput}
      />

      <select
        value={selectedType}
        onChange={(e) => setSelectedType(e.target.value)}
        className={styles.select}
      >
        <option value="">Todos os tipos</option>
        {[
          'normal',
          'fire',
          'water',
          'grass',
          'electric',
          'ice',
          'fighting',
          'poison',
          'ground',
          'flying',
          'psychic',
          'bug',
          'rock',
          'ghost',
          'dragon',
          'dark',
          'steel',
          'fairy',
        ].map((type) => (
          <option key={type} value={type}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </option>
        ))}
      </select>

      <select
        value={evolutionStage}
        onChange={(e) => setEvolutionStage(e.target.value)}
        className={styles.select}
      >
        <option value="">Todos os estágios</option>
        <option value="1">Estágio 1</option>
        <option value="2">Estágio 2</option>
        <option value="3">Estágio 3</option>
      </select>
    </div>
  );
}
