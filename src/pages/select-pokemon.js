import { useEffect, useState } from "react";
import { getFirstGenPokemons } from "@/utils/api";
import { useRouter } from "next/router";
import styles from "../styles/SelectPokemon.module.css";
import { typeLabel, moveLabel } from "@/utils/i18n";
import ConfirmButton from "@/components/ui/ConfirmButton";

export default function SelectPokemon() {
  const [pokemons, setPokemons] = useState([]);
  const [selected, setSelected] = useState([]);
  const [trainerName, setTrainerName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [evolutionStage, setEvolutionStage] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Aplica background de tela especÃ­fico desta pÃ¡gina
    try {
      document?.body?.classList?.add("bg-select-pokemon");
    } catch (e) {}

    const name = localStorage.getItem("trainerName") || "Treinador";
    setTrainerName(name);

    async function loadPokemons() {
      const data = await getFirstGenPokemons();
      setPokemons(data);
    }
    loadPokemons();

    // Cleanup: remove o background ao sair da pÃ¡gina
    return () => {
      try {
        document?.body?.classList?.remove("bg-select-pokemon");
      } catch (e) {}
    };
  }, []);

  const toggleSelect = (pokemon) => {
    if (selected.includes(pokemon)) {
      setSelected(selected.filter((p) => p !== pokemon));
    } else if (selected.length < 3) {
      // Bloqueia escolhas que inviabilizam completar 1-2-3 estÃ¡gios
      const next = [...selected, pokemon];
      const uniqueStages = new Set(next.map((p) => p.evolutionStage)).size;
      const remaining = 3 - next.length;
      const feasible = uniqueStages + remaining >= 3;
      if (!feasible) {
        const stages = new Set(selected.map((p) => p.evolutionStage));
        const missing = [1, 2, 3].filter((s) => !stages.has(s));
        alert(
          `Para confirmar, selecione 3 PokÃ©mon â€” um de cada estÃ¡gio (1, 2 e 3). Faltam: ${missing.join(", ")}.`
        );
        return;
      }
      setSelected(next);
    }
  };

    const hasAllEvolutionStages = () => {
    if (selected.length !== 3) return false;
    const stages = new Set(selected.map((p) => p.evolutionStage));
    return stages.has(1) && stages.has(2) && stages.has(3);
  };

  const confirmTeam = () => {
    if (!hasAllEvolutionStages()) {
      const stages = new Set(selected.map((p) => p.evolutionStage));
      const missing = [1, 2, 3].filter((s) => !stages.has(s));
      const stageName = (s) => `EstÃ¡gio ${s}`;
      const msg = selected.length !== 3
        ? 'Selecione exatamente 3 Pokémon.'
        : `Sua equipe precisa ter 1 Pokémon de cada estágio de evolução: ${missing.map(stageName).join(', ')}.`;
      alert(msg);
      return;
    }
    localStorage.setItem("selectedTeam", JSON.stringify(selected));
    router.push("/select-team");
  };

  return (
    <div className={styles.container}>

      <h1 className={styles.title}>Selecione sua Equipe Pokemon</h1>
      <p className={styles.subtitle}>Escolha ate 3 Pokemon para a batalha!</p>
      {/* Barra flutuante */}
      <div className={styles.trainerBar}>
        <span className={styles.trainerName}>
          <img
            className={styles.trainerIcon}
            src="/trainerIcon.png"
            alt="Trainer Icon"
          />
          {trainerName}
        </span>

        <div className={styles.pokeballs}>
          {[...Array(3)].map((_, index) => (
            <img
              key={index}
              className={
                index < selected.length ? styles.filled : styles.empty
              }
              src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
              alt="Pokeball"
            />
          ))}
        </div>
<div className={styles.infoPanel}>
        <p className={styles.ruleHint}>
          Regra: selecione 3 Pokemon, um de cada estagio de evolucao (1, 2 e 3).
        </p>
      </div>

        <ConfirmButton onClick={confirmTeam} disabled={!hasAllEvolutionStages()}>
          Confirmar ({selected.length}/3)
        </ConfirmButton>
      </div>


      {/* ðŸ” Filtros de busca e seleÃ§Ã£o */}
      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Buscar Pokémon..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
          className={styles.searchInput}
        />

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className={styles.select}
        >
          <option value="">Todos os tipos</option>
          {[
            "normal",
            "fire",
            "water",
            "grass",
            "electric",
            "ice",
            "fighting",
            "poison",
            "ground",
            "flying",
            "psychic",
            "bug",
            "rock",
            "ghost",
            "dragon",
            "dark",
            "steel",
            "fairy",
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

      {/* ðŸ§© Grid de PokÃ©mons filtrados */}
      <div className={styles.pokemonGrid}>
        {pokemons
          .filter(
            (p) =>
              p.name.toLowerCase().includes(searchTerm) && // busca
              (selectedType ? p.types.includes(selectedType) : true) && // tipo
              (evolutionStage
                ? p.evolutionStage === parseInt(evolutionStage)
                : true) // estÃ¡gio
          )
          .map((p) => (
            <div
              key={p.id}
              className={`${styles.pokemonCard} ${
                selected.includes(p) ? styles.selected : ""
              }`}
              onClick={() => toggleSelect(p)}
              onMouseEnter={(e) =>
                (e.currentTarget.querySelector("img").src = p.animated)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.querySelector("img").src = p.sprite)
              }
            >
              <img
                className={styles.pokemonImg}
                src={p.sprite}
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
                {p.moves.map((move, i) => (
                  <li key={i}>{moveLabel(move)}</li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </div>
  );
}











