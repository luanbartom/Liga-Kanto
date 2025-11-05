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

// Retorna o ícone correto conforme o treinador escolhido
function getTrainerIcon(id) {
  return id === 1 ? "/icon/hildaIcon.png" : "/icon/REDIcon.png";
}

export default function SelectPokemon() {
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
  const router = useRouter();

  useEffect(() => {
    try {
      document?.body?.classList?.add("bg-select-pokemon");
    } catch (e) {}

    // Carrega preferências do(a) treinador(a) e dataset de pokémons
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

  useEffect(() => {}, [searchTerm, selectedType, evolutionStage]);

  const toggleSelect = (pokemon) => {
    if (pokemon?.boss && !unlockedBossIds.has(pokemon.id)) {
      setShowBossInfo(true);
      return;
    }

    if (selected.includes(pokemon)) {
      setSelected(selected.filter((p) => p !== pokemon));
      return;
    }

    if (selected.length < 5) {
      const next = [...selected, pokemon];
      const stages = new Set(next.map((p) => p.evolutionStage));
      const hasAll = stages.has(1) && stages.has(2) && stages.has(3);

      setSelected(next);

      if (next.length === 5 && !hasAll) {
        const missing = [1, 2, 3].filter((s) => !stages.has(s));
        setRuleModalMsg(
          `Você pode escolher até 5 Pokémon, mas precisa ter pelo menos um de cada estágio (1, 2 e 3). Faltam: ${missing.join(", ")}.`
        );
        setShowRuleModal(true);
      }
    }
  };

  const hasAllEvolutionStages = () => {
    if (selected.length < 3) return false;
    const stages = new Set(selected.map((p) => p.evolutionStage));
    return stages.has(1) && stages.has(2) && stages.has(3);
  };

  const confirmTeam = () => {
    if (selected.length < 3 || selected.length > 5 || !hasAllEvolutionStages()) {
      const stages = new Set(selected.map((p) => p.evolutionStage));
      const missing = [1, 2, 3].filter((s) => !stages.has(s));
      let msg = "";

      if (selected.length < 3)
        msg = "Selecione pelo menos 3 Pokémon.";
      else if (selected.length > 5)
        msg = "Você pode selecionar no máximo 5 Pokémon.";
      else
        msg = `Sua equipe precisa ter pelo menos um Pokémon de cada estágio (1, 2 e 3). Faltam: ${missing.join(", ")}.`;

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
      <p className={styles.subtitle}>Escolha até 5 Pokémon para a batalha!</p>

      {/* Barra de conquistas (treinador + botão) */}
      <div className={styles.achievementsBar}>
        <img
          className={styles.trainerIcon}
          src={getTrainerIcon(trainerId)}
          alt="Treinador"
        />
        <div className={styles.trainerNameOnly}>{trainerName}</div>
        <button
          type="button"
          className={styles.achievementsBtn}
          onClick={() => setShowAchievements(true)}
        >
          Conquistas{" "}
          <span className={styles.badgeCount}>
            {[...unlockedBossIds].length}
          </span>
        </button>
      </div>

      {/* Barra flutuante (somente regras + seleção) */}
      <div className={styles.trainerBar}>
        <div className={styles.pokeballs}>
          {[...Array(5)].map((_, index) => (
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
            Regra: selecione pelo menos um Pokémon de cada estágio (1, 2 e 3).
            Você pode adicionar até 2 extras de qualquer estágio.
          </p>
        </div>

        <ConfirmButton
          onClick={confirmTeam}
          disabled={!hasAllEvolutionStages() || selected.length < 3}
        >
          Confirmar ({selected.length}/5)
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
              (evolutionStage
                ? p.evolutionStage === parseInt(evolutionStage)
                : true)
          )
          .map((p) => {
            const locked = p.boss && !unlockedBossIds.has(p.id);
            return (
              <div
                key={p.id}
                className={`${styles.pokemonCard} ${
                  selected.includes(p) ? styles.selected : ""
                }`}
                onClick={() => toggleSelect(p)}
                onMouseEnter={(e) => {
                  if (locked) return;
                  const animated =
                    (p.sprites && p.sprites.animated) || p.animated;
                  e.currentTarget.querySelector("img").src = animated;
                }}
                onMouseLeave={(e) => {
                  const front = (p.sprites && p.sprites.front) || p.sprite;
                  e.currentTarget.querySelector("img").src = front;
                }}
              >
                <img
                  className={`${styles.pokemonImg} ${
                    locked ? styles.bossLocked : ""
                  }`}
                  src={(p.sprites && p.sprites.front) || p.sprite}
                  alt={p.name}
                />
                <h3 className={styles.pokemonName}>
                  {p.name.charAt(0).toUpperCase() + p.name.slice(1)}
                </h3>

                <div className={styles.types}>
                  {p.types.map((type, i) => (
                    <span
                      key={i}
                      className={`${styles.type} ${styles[type]}`}
                    >
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
              Pokémon marcados como <strong>Boss</strong> aparecem em cinza e
              não podem ser selecionados ainda. Vença as batalhas estabelecidas
              para desbloqueá-los e usá-los no seu time.
            </p>
            <ConfirmButton onClick={() => setShowBossInfo(false)}>
              Entendi
            </ConfirmButton>
          </div>
        </div>
      )}

      {showAchievements && (
        <div className={styles.infoOverlay}>
          <div
            className={styles.infoBoxConquistas}
            role="dialog"
            aria-modal="true"
          >
            <h2>Conquistas</h2>
            <p>
              Vença as batalhas estabelecidas para desbloqueá-los e usá-los no
              seu time.
            </p>
            <div className={styles.achGrid}>
              {pokemons
                .filter((p) => p.boss)
                .map((p) => {
                  const unlocked = unlockedBossIds.has(p.id);
                  return (
                    <div
                      key={`all-ach-${p.id}`}
                      className={`${styles.achCell} ${
                        unlocked ? styles.achUnlocked : styles.achLocked
                      }`}
                      title={p.name}
                    >
                      <img
                        className={styles.achIconLg}
                        src={p.sprite}
                        alt={p.name}
                      />
                      <div className={styles.achLabel}>{p.name}</div>
                    </div>
                  );
                })}
            </div>
            <ConfirmButton onClick={() => setShowAchievements(false)}>
              Fechar
            </ConfirmButton>
          </div>
        </div>
      )}

      {showRuleModal && (
        <div className={styles.infoOverlay}>
          <div className={styles.infoBox} role="dialog" aria-modal="true">
            <h2>Regras de Seleção</h2>
            <p>{ruleModalMsg}</p>
            <ConfirmButton onClick={() => setShowRuleModal(false)}>
              Ok
            </ConfirmButton>
          </div>
        </div>
      )}
    </div>
  );
}
