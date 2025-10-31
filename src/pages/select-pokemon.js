import { useEffect, useState } from "react";
import { getFirstGenPokemons } from "../utils/api";
import { useRouter } from "next/router";
import styles from "../styles/SelectPokemon.module.css";
import { typeLabel } from "@/utils/i18n";
import ConfirmButton from "@/components/ui/ConfirmButton";

// Exibe o nome bruto do golpe (sem tradução), apenas formatando para leitura
function formatMoveName(mv) {
  const raw = typeof mv === "string" ? mv : (mv && mv.name) || "";
  if (!raw) return "";
  return raw.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SelectPokemon() {
  const TRAINER_ICONS = [
    '/icon/trainerIcon.png',
    '/icon/REDIcon.png',
    '/icon/hildaIcon.png',
  ];
  const [pokemons, setPokemons] = useState([]);
  const [selected, setSelected] = useState([]);
  const [trainerName, setTrainerName] = useState("");
  const [trainerId, setTrainerId] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [evolutionStage, setEvolutionStage] = useState("");
  const [unlockedBossIds, setUnlockedBossIds] = useState(new Set());
  const [showAchievements, setShowAchievements] = useState(false);
  const [showBossInfo, setShowBossInfo] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleModalMsg, setRuleModalMsg] = useState("");
  // Removed trainer icon picker option
  const router = useRouter();

  useEffect(() => {
    try {
      document?.body?.classList?.add("bg-select-pokemon");
    } catch (e) {}

    const name = localStorage.getItem("trainerName") || "Treinador";
    setTrainerName(name);
    try {
      const storedTrainer = localStorage.getItem("selectedTrainer");
      const n = parseInt(storedTrainer || "1", 10);
      if (!Number.isNaN(n)) setTrainerId(n);
    } catch (e) {}

    async function loadPokemons() {
      const data = await getFirstGenPokemons();
      setPokemons(data);
    }
    loadPokemons();

    try {
      const raw = localStorage.getItem("unlockedBosses") || "[]";
      const arr = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
      setUnlockedBossIds(new Set(arr.map((n) => Number(n))));
    } catch (e) {}

    return () => {
      try {
        document?.body?.classList?.remove("bg-select-pokemon");
      } catch (e) {}
    };
  }, []);

  // Reinicia paginação quando filtros mudam (mantido para compatibilidade)
  useEffect(() => {}, [searchTerm, selectedType, evolutionStage]);

  const toggleSelect = (pokemon) => {
    if (pokemon?.boss && !unlockedBossIds.has(pokemon.id)) {
      setShowBossInfo(true);
      return;
    }
    if (selected.includes(pokemon)) {
      setSelected(selected.filter((p) => p !== pokemon));
    } else if (selected.length < 3) {
      // Regra existente de 1-2-3 estágios
      const next = [...selected, pokemon];
      const uniqueStages = new Set(next.map((p) => p.evolutionStage)).size;
      const remaining = 3 - next.length;
      const feasible = uniqueStages + remaining >= 3;
      if (!feasible) {
        const stages = new Set(selected.map((p) => p.evolutionStage));
        const missing = [1, 2, 3].filter((s) => !stages.has(s));
        setRuleModalMsg(`Para confirmar, selecione 3 Pokémon — um de cada estágio (1, 2 e 3). Faltam: ${missing.join(", ")}.`);
        setShowRuleModal(true);
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
      const stageName = (s) => `Estágio ${s}`;
      const msg =
        selected.length !== 3
          ? "Selecione exatamente 3 Pokémon."
          : `Sua equipe precisa ter 1 Pokémon de cada estágio de evolução: ${missing
              .map(stageName)
              .join(", ")}.`;
      setRuleModalMsg(msg);
      setShowRuleModal(true);
      return;
    }
    localStorage.setItem("selectedTeam", JSON.stringify(selected));
    router.push("/select-team");
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Selecione sua Equipe Pokémon</h1>
      <p className={styles.subtitle}>Escolha até 3 Pokémon para a batalha!</p>

      {/* Barra de conquistas (treinador + botão) */}
      <div className={styles.achievementsBar}>
        <img className={styles.trainerIcon} src={TRAINER_ICONS[(Math.max(1, trainerId) - 1) % TRAINER_ICONS.length]} alt="Treinador" />
        <div className={styles.trainerNameOnly}>{trainerName}</div>
        <button type="button" className={styles.achievementsBtn} onClick={() => setShowAchievements(true)}>
          Conquistas <span className={styles.badgeCount}>{[...unlockedBossIds].length}</span>
        </button>
        {/* Icon change option removed */}
      </div>

      {/* Barra flutuante (somente regras + seleção) */}
      <div className={styles.trainerBar}>

        <div className={styles.pokeballs}>
          {[...Array(3)].map((_, index) => (
            <img
              key={index}
              className={index < selected.length ? styles.filled : styles.empty}
              src="/sprites/pokeballs/poke-ball.png"
              alt="Pokeball"
            />
          ))}
        </div>

        <div className={styles.infoPanel}>
          <p className={styles.ruleHint}>
            Regra: selecione 3 Pokémon, um de cada estágio de evolução (1, 2 e 3).
          </p>
        </div>

        <ConfirmButton onClick={confirmTeam} disabled={!hasAllEvolutionStages()}>
          Confirmar ({selected.length}/3)
        </ConfirmButton>
      </div>

      {/* Filtros */}
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

      {/* Grid de Pokémons */}
      <div className={styles.pokemonGrid}>
        {pokemons
          .filter(
            (p) =>
              p.name.toLowerCase().includes(searchTerm) &&
              (selectedType ? p.types.includes(selectedType) : true) &&
              (evolutionStage ? p.evolutionStage === parseInt(evolutionStage) : true)
          )
          .map((p) => {
            const locked = p.boss && !unlockedBossIds.has(p.id);
            return (
              <div
                key={p.id}
                className={`${styles.pokemonCard} ${selected.includes(p) ? styles.selected : ""}`}
                onClick={() => toggleSelect(p)}
                onMouseEnter={(e) => {
                  if (locked) return;
                  const animated = (p.sprites && p.sprites.animated) || p.animated;
                  e.currentTarget.querySelector("img").src = animated;
                }}
                onMouseLeave={(e) => {
                  const front = (p.sprites && p.sprites.front) || p.sprite;
                  e.currentTarget.querySelector("img").src = front;
                }}
              >
                <img
                  className={`${styles.pokemonImg} ${locked ? styles.bossLocked : ""}`}
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

      {showBossInfo && (
        <div className={styles.infoOverlay}>
          <div className={styles.infoBox} role="dialog" aria-modal="true">
            <h2>Pokémon Boss bloqueado</h2>
            <p>
              Pokémon marcados como <strong>Boss</strong> aparecem em cinza e não podem ser selecionados ainda.
              Vença as batalhas estabelecidas para desbloqueá-los e usá-los no seu time.
            </p>
            <ConfirmButton onClick={() => setShowBossInfo(false)}>Entendi</ConfirmButton>
          </div>
        </div>
      )}

      {showAchievements && (
        <div className={styles.infoOverlay}>
          <div className={styles.infoBox} role="dialog" aria-modal="true">
            <h2>Conquistas</h2>
            <p>Vença as batalhas estabelecidas para desbloqueá-los e usá-los no seu time.</p>
            <div className={styles.achGrid}>
              {pokemons
                .filter((p) => p.boss)
                .map((p) => {
                  const unlocked = unlockedBossIds.has(p.id);
                  return (
                    <div key={`all-ach-${p.id}`} className={`${styles.achCell} ${unlocked ? styles.achUnlocked : styles.achLocked}`} title={p.name}>
                      <img className={styles.achIconLg} src={p.sprite} alt={p.name} />
                      <div className={styles.achLabel}>{p.name}</div>
                    </div>
                  );
                })}
            </div>
            <ConfirmButton onClick={() => setShowAchievements(false)}>Fechar</ConfirmButton>
          </div>
        </div>
      )}
      {showRuleModal && (
        <div className={styles.infoOverlay}>
          <div className={styles.infoBox} role="dialog" aria-modal="true">
            <h2>Regras de Seleção</h2>
            <p>{ruleModalMsg}</p>
            <ConfirmButton onClick={() => setShowRuleModal(false)}>Ok</ConfirmButton>
          </div>
        </div>
      )}

      {/* Trainer icon picker modal removed */}
    </div>
  );
}


