import { useEffect, useState } from 'react';
import { getFirstGenPokemons } from '../utils/api';
import { useRouter } from 'next/router';
import styles from '../styles/SelectPokemon.module.css';
import { MAX_SEARCH_LEN } from '@/constants';
import { typeLabel } from '@/utils/i18n';
import ConfirmButton from '@/components/ui/ConfirmButton';
import FilterBar from '@/components/select/FilterBar';
import PokemonGrid from '@/components/select/PokemonGrid';

// Exibe o nome bruto do golpe (sem tradução), apenas formatando para leitura
function formatMoveName(mv) {
  const raw = typeof mv === 'string' ? mv : (mv && mv.name) || '';
  if (!raw) return '';
  return raw.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Retorna o ícone correto conforme o treinador escolhido
function getTrainerIcon(id) {
  return id === 1 ? '/icon/hildaIcon.png' : '/icon/REDIcon.png';
}

export default function SelectPokemon() {
  const [pokemons, setPokemons] = useState([]);
  const [selected, setSelected] = useState([]);
  const [trainerName, setTrainerName] = useState('');
  const [trainerId, setTrainerId] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [evolutionStage, setEvolutionStage] = useState('');
  const [unlockedBossIds, setUnlockedBossIds] = useState(new Set());
  const [showAchievements, setShowAchievements] = useState(false);
  const [showBossInfo, setShowBossInfo] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleModalMsg, setRuleModalMsg] = useState('');
  const router = useRouter();

  // Limite de caracteres para a busca (em constants)

  useEffect(() => {
    try {
      document?.body?.classList?.add('bg-select-pokemon');
    } catch (e) {}

    // Carrega preferências do(a) treinador(a) e dataset de pokémons
    const name = localStorage.getItem('trainerName') || 'Treinador';
    setTrainerName(name);

    try {
      const storedTrainer = localStorage.getItem('selectedTrainer');
      const n = parseInt(storedTrainer || '1', 10);
      if (!Number.isNaN(n)) setTrainerId(n);
    } catch (e) {}

    async function loadPokemons() {
      const data = await getFirstGenPokemons();
      setPokemons(data);
    }
    loadPokemons();

    try {
      const raw = localStorage.getItem('unlockedBosses') || '[]';
      const arr = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
      setUnlockedBossIds(new Set(arr.map((n) => Number(n))));
    } catch (e) {}

    return () => {
      try {
        document?.body?.classList?.remove('bg-select-pokemon');
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
          `Você pode escolher até 5 Pokémon, mas precisa ter pelo menos um de cada estágio (1, 2 e 3). Faltam: ${missing.join(', ')}.`,
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
      let msg = '';

      if (selected.length < 3) msg = 'Selecione pelo menos 3 Pokémon.';
      else if (selected.length > 5) msg = 'Você pode selecionar no máximo 5 Pokémon.';
      else
        msg = `Sua equipe precisa ter pelo menos um Pokémon de cada estágio (1, 2 e 3). Faltam: ${missing.join(', ')}.`;

      setRuleModalMsg(msg);
      setShowRuleModal(true);
      return;
    }

    localStorage.setItem('selectedTeam', JSON.stringify(selected));
    router.push('/select-team');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Selecione sua Equipe Pokémon</h1>
      <p className={styles.subtitle}>Escolha até 5 Pokémon para a batalha!</p>

      {/* Barra de conquistas (treinador + botão) */}
      <div className={styles.achievementsBar}>
        <img className={styles.trainerIcon} src={getTrainerIcon(trainerId)} alt="Treinador" />
        <div className={styles.trainerNameOnly}>{trainerName}</div>
        <button
          type="button"
          className={styles.achievementsBtn}
          onClick={() => setShowAchievements(true)}
        >
          Conquistas <span className={styles.badgeCount}>{[...unlockedBossIds].length}</span>
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
            Regra: selecione pelo menos um Pokémon de cada estágio (1, 2 e 3). Você pode adicionar
            até 2 extras de qualquer estágio.
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
      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        evolutionStage={evolutionStage}
        setEvolutionStage={setEvolutionStage}
      />

      {/* Grid de Pokémons */}
      <PokemonGrid
        pokemons={pokemons}
        searchTerm={searchTerm}
        selectedType={selectedType}
        evolutionStage={evolutionStage}
        unlockedBossIds={unlockedBossIds}
        selected={selected}
        toggleSelect={toggleSelect}
      />

      {showBossInfo && (
        <div className={styles.infoOverlay}>
          <div className={styles.infoBox} role="dialog" aria-modal="true">
            <h2>Pokémon Boss bloqueado</h2>
            <p>
              Pokémon marcados como <strong>Boss</strong> aparecem em cinza e não podem ser
              selecionados ainda. Vença as batalhas estabelecidas para desbloqueá-los e usá-los no
              seu time.
            </p>
            <ConfirmButton onClick={() => setShowBossInfo(false)}>Entendi</ConfirmButton>
          </div>
        </div>
      )}

      {showAchievements && (
        <div className={styles.infoOverlay}>
          <div className={styles.infoBoxConquistas} role="dialog" aria-modal="true">
            <h2>Conquistas</h2>
            <p>Vença as batalhas estabelecidas para desbloqueá-los e usá-los no seu time.</p>
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
    </div>
  );
}
