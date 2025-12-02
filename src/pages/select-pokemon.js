import { useEffect, useMemo, useState } from 'react';
import { getFirstGenPokemons } from '../utils/api';
import { useRouter } from 'next/router';
import styles from '../styles/SelectPokemon.module.css';
import { MAX_SEARCH_LEN } from '@/constants';
import ConfirmButton from '@/components/ui/ConfirmButton';
import FilterBar from '@/components/select/FilterBar';
import PokemonGrid from '@/components/select/PokemonGrid';

// Retorna o ícone correto conforme o treinador escolhido
function getTrainerIcon(id) {
  return id === 1 ? '/icon/hildaIcon.png' : '/icon/REDIcon.png';
}

export default function SelectPokemon() {
  const [pokemons, setPokemons] = useState([]);

  // Guardamos apenas os IDs selecionados
  const [selectedIds, setSelectedIds] = useState([]);

  const [trainerName, setTrainerName] = useState('');
  const [trainerId, setTrainerId] = useState(1);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');      // '' ou 'all' = todos
  const [evolutionStage, setEvolutionStage] = useState('');  // '' ou 'all' = todos

  const [unlockedBossIds, setUnlockedBossIds] = useState(new Set());
  const [showAchievements, setShowAchievements] = useState(false);
  const [showBossInfo, setShowBossInfo] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleModalMsg, setRuleModalMsg] = useState('');
  const router = useRouter();

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

  // Lista de pokémons selecionados derivada dos IDs
  const selected = useMemo(
    () => pokemons.filter((p) => selectedIds.includes(p.id)),
    [pokemons, selectedIds],
  );

  // Lista filtrada por nome, tipo e estágio
  const filteredPokemons = useMemo(() => {
    const name = searchTerm.trim().toLowerCase();

    return pokemons.filter((p) => {
      // Filtro por nome
      if (name && !p.name.toLowerCase().includes(name)) return false;

      // Filtro por tipo
      if (selectedType && selectedType !== 'all') {
        const types = Array.isArray(p.types)
          ? p.types
          : [p.type].filter(Boolean);
        if (!types.includes(selectedType)) return false;
      }

      // Filtro por estágio
      if (evolutionStage && evolutionStage !== 'all') {
        if (String(p.evolutionStage) !== String(evolutionStage)) return false;
      }

      return true;
    });
  }, [pokemons, searchTerm, selectedType, evolutionStage]);

  // Lista final exibida:
  // 1) todos os selecionados no topo (independente do filtro)
  // 2) depois os pokémons filtrados que não estão selecionados
  const finalPokemonList = useMemo(() => {
    const selectedSet = new Set(selectedIds);

    const selectedOnTop = pokemons.filter((p) => selectedSet.has(p.id));

    const nonSelectedFiltered = filteredPokemons.filter(
      (p) => !selectedSet.has(p.id),
    );

    return [...selectedOnTop, ...nonSelectedFiltered];
  }, [pokemons, filteredPokemons, selectedIds]);

  const toggleSelect = (pokemon) => {
    if (pokemon?.boss && !unlockedBossIds.has(pokemon.id)) {
      setShowBossInfo(true);
      return;
    }

    const isSelected = selectedIds.includes(pokemon.id);

    // Se já está selecionado, remove pelo ID
    if (isSelected) {
      setSelectedIds((prev) => prev.filter((id) => id !== pokemon.id));
      return;
    }

    // Limite de 5 pokémon
    if (selectedIds.length < 5) {
      const nextIds = [...selectedIds, pokemon.id];
      setSelectedIds(nextIds);

      // Monta time completo depois da inclusão pra checar estágios
      const nextTeam = pokemons.filter((p) => nextIds.includes(p.id));
      const stages = new Set(nextTeam.map((p) => p.evolutionStage));
      const hasAll = stages.has(1) && stages.has(2) && stages.has(3);

      if (nextTeam.length === 5 && !hasAll) {
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

    // Salvamos os objetos completos selecionados
    localStorage.setItem('selectedTeam', JSON.stringify(selected));
    router.push('/select-team');
  };

  // Limite de caracteres na busca
  const handleSearchChange = (value) => {
    const trimmed = value.slice(0, MAX_SEARCH_LEN);
    setSearchTerm(trimmed);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Selecione sua Equipe Pokémon</h1>
      <p className={styles.subtitle}>Escolha 5 Pokémons para a batalha!</p>

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

      {/* Barra flutuante (regras + contagem de equipe) */}
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
          disabled={!hasAllEvolutionStages() || selected.length < 5}
        >
          Confirmar ({selected.length}/5)
        </ConfirmButton>
      </div>

      {/* Filtros */}
      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={handleSearchChange}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        evolutionStage={evolutionStage}
        setEvolutionStage={setEvolutionStage}
      />

      {/* Grid de Pokémons – já com selecionados no topo + filtro aplicado.
          ⚠️ Repara que NÃO mando mais searchTerm / selectedType / evolutionStage pro grid. */}
      <PokemonGrid
        pokemons={finalPokemonList}
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
