import { useState, useEffect, useRef } from 'react';
import HPBar from '@/components/HPBar';
import ConditionBar from '@/components/ConditionBar';
import { getPokemon, getMove, getAllPokemons } from '@/utils/api';
import { WEAK_MOVES_BY_TYPE } from '@/utils/moveRules';
import { STAGE_MOVES } from '@/utils/moves';
import { typeLabel, moveName } from '@/utils/i18n';
import styles from '@/styles/Battle.module.css';
import { TUNING, ATTACK_GAP_MS, ENEMIES_PER_BATTLE } from '@/constants';
import { calcDamage, calcMaxHp } from '@/utils/battle/damage';
import { typeMultiplier } from '@/utils/battle/typeChart';
import {
  setStatus as setStatusImp,
  clearStatus as clearStatusImp,
  modifyStage as modifyStageImp,
  applyStageMove as applyStageMoveImp,
  applyStartOfTurnEffects as applyStartOfTurnEffectsImp,
  applyEndOfTurnEffects as applyEndOfTurnEffectsImp,
} from '@/utils/battle/status';
import ConfirmButton from '@/components/ui/ConfirmButton';
import AttackMenu from '@/components/ui/AttackMenu';

// Helper simples para capitalizar nomes
const cap = (s) =>
  String(s || '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

// Cache de golpes
const moveCache = new Map();

// Cache global simples para nomes que possuem evolução seguinte
let namesWithNextEvo = null; // Set<string lowercased>

// Hook de screen shake com requestAnimationFrame
function useScreenShake(intensity = 8, duration = 200) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const frameRef = useRef(null);
  const startRef = useRef(null);

  const trigger = () => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    startRef.current = null;

    const step = (now) => {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const decay = 1 - t;

      const angle = Math.random() * Math.PI * 2;
      const radius = intensity * decay;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      setOffset({ x, y });

      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        setOffset({ x: 0, y: 0 });
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return { offset, trigger };
}

export default function Battle() {
  // Estado principal da batalha e controles de UI
  const [battle, setBattle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [log, setLog] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [team, setTeam] = useState([]);
  const [enemyTeam, setEnemyTeam] = useState([]);
  const [showMoves, setShowMoves] = useState(true);
  const [showSwitch, setShowSwitch] = useState(false);
  const [logExpanded, setLogExpanded] = useState(false);
  const [playerAnim, setPlayerAnim] = useState(null);
  const [enemyAnim, setEnemyAnim] = useState(null);
  const [playerTrainerId, setPlayerTrainerId] = useState(1);

  const [hoveredBall, setHoveredBall] = useState(-1);
  const [pendingSwitch, setPendingSwitch] = useState(null);
  const [defeatedEnemies, setDefeatedEnemies] = useState(0);
  const [bossPhase, setBossPhase] = useState(false);
  const [currentPartyIndex, setCurrentPartyIndex] = useState(0);

  // carta recém-liberada ao vencer boss pela primeira vez
  const [unlockedCard, setUnlockedCard] = useState(null);

  // Shake global da arena
  const { offset: shakeOffset, trigger: triggerShake } = useScreenShake(8, 200);

  // Auto-redirect depois de vitória de boss (quando NÃO tem carta nova na tela)
  useEffect(() => {
    if (
      battle?.winner === 'player' &&
      (battle?.bossPhase || bossPhase) &&
      !unlockedCard
    ) {
      const t = setTimeout(() => {
        try {
          localStorage.setItem('battleProgressRound', '0');
        } catch (_) {}
        window.location.href = '/select-pokemon';
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [battle?.winner, battle?.bossPhase, bossPhase, unlockedCard]);

  // Normaliza/resolve metadados de golpes
  async function enrichMoves(moves, owner = null) {
    const normalize = (raw) => {
      if (!raw) return null;
      if (typeof raw === 'string') return null;
      if (typeof raw === 'object') {
        const effectObj = raw.effect || null;
        const effects = Array.isArray(raw.effects)
          ? raw.effects
          : effectObj
            ? [{ type: effectObj.type, chance: effectObj.chance }]
            : [];
        return {
          name: raw.name || raw.id || '',
          display: raw.display || raw.name || '',
          type: (raw.type || raw.element || 'normal').toLowerCase(),
          damage_class: (raw.damage_class || raw.category || 'unknown').toLowerCase(),
          power: raw.power ?? null,
          accuracy: raw.accuracy ?? null,
          pp: raw.pp ?? null,
          priority: raw.priority ?? 0,
          effects,
          meta: raw.meta || undefined,
        };
      }
      return null;
    };

    const list = (moves || []).filter(Boolean);

    const resolved = await Promise.all(
      list.map(async (mv) => {
        if (typeof mv === 'string') {
          const key = mv.toLowerCase();
          if (moveCache.has(key)) return moveCache.get(key);
          try {
            const data = normalize(await getMove(key)) || {
              name: key,
              display: cap(key),
              power: 40,
              accuracy: 95,
              type: 'normal',
              damage_class: 'physical',
              effects: [],
            };
            moveCache.set(key, data);
            return data;
          } catch (_) {
            return {
              name: key,
              display: cap(key),
              power: 40,
              accuracy: 95,
              type: 'normal',
              damage_class: 'physical',
              effects: [],
            };
          }
        }

        const normalized = normalize(mv);
        if (normalized?.name) {
          const missingType = !normalized.type || normalized.type === '';
          const missingClass = !normalized.damage_class || normalized.damage_class === 'unknown';
          const missingPower = normalized.power == null;
          const missingAcc = normalized.accuracy == null;
          if (missingType || missingClass || missingPower || missingAcc) {
            try {
              const key = String(normalized.name).toLowerCase();
              const fetched = await getMove(key);
              const rich = normalize(fetched) || {};
              return {
                ...rich,
                ...normalized,
                type: normalized.type || rich.type || 'normal',
                damage_class:
                  normalized.damage_class && normalized.damage_class !== 'unknown'
                    ? normalized.damage_class
                    : rich.damage_class || 'physical',
                power: normalized.power ?? rich.power ?? 40,
                accuracy: normalized.accuracy ?? rich.accuracy ?? 95,
              };
            } catch (_) {
              return {
                ...normalized,
                type: normalized.type || 'normal',
                damage_class:
                  normalized.damage_class && normalized.damage_class !== 'unknown'
                    ? normalized.damage_class
                    : 'physical',
                power: normalized.power ?? 40,
                accuracy: normalized.accuracy ?? 95,
              };
            }
          }
          return normalized;
        }

        const name = typeof mv?.name === 'string' ? mv.name : 'unknown';
        return {
          name,
          display: cap(name),
          power: mv?.power ?? 40,
          accuracy: mv?.accuracy ?? 95,
          type: (mv?.type || 'normal').toLowerCase(),
          damage_class: (mv?.damage_class || 'physical').toLowerCase(),
          effects: Array.isArray(mv?.effects) ? mv.effects : [],
        };
      }),
    );

    // Descobrir quais nomes têm próxima evolução (cache global)
    try {
      if (!namesWithNextEvo) {
        const all = await getAllPokemons();
        const set = new Set(
          (all || [])
            .map((p) => (typeof p?.evolves_from === 'string' ? p.evolves_from.toLowerCase() : null))
            .filter(Boolean),
        );
        namesWithNextEvo = set;
      }
    } catch (_) {}

    const ownerName = String(owner?.name || '').toLowerCase();
    const ownerStage = parseInt(owner?.evolutionStage ?? 1, 10);
    const hasNext = ownerName ? !!namesWithNextEvo?.has(ownerName) : false;
    const isBasicWithNext = ownerStage === 1 && hasNext;

    if (!isBasicWithNext) {
      return resolved;
    }

    // Básico que evolui: só golpes fracos, até 4
    const POWER_CAP = 60;
    const byName = (m) => String(m?.name || '').toLowerCase();
    let filtered = resolved.filter((m) => {
      const pw = Number.isFinite(m?.power) ? m.power : 0;
      return pw <= POWER_CAP;
    });

    if (filtered.length < 4) {
      const types = Array.isArray(owner?.types) ? owner.types : [];
      const candidates = [];
      for (const t of types) {
        const key = String(t || '').toLowerCase();
        if (WEAK_MOVES_BY_TYPE[key]) candidates.push(...WEAK_MOVES_BY_TYPE[key]);
      }
      candidates.push('tackle', 'quick-attack', 'scratch', 'pound', 'swift');

      const have = new Set(filtered.map(byName));
      for (const name of candidates) {
        if (filtered.length >= 4) break;
        if (have.has(name)) continue;
        try {
          const fetched = await getMove(name);
          const mv = {
            name: fetched?.name || name,
            display: (fetched?.display || name).replace(/-/g, ' '),
            type: String(fetched?.type || 'normal').toLowerCase(),
            damage_class: String(fetched?.damage_class || 'physical').toLowerCase(),
            power: fetched?.power ?? 40,
            accuracy: fetched?.accuracy ?? 95,
            effects: Array.isArray(fetched?.effects) ? fetched.effects : [],
          };
          if ((mv.power ?? 0) <= POWER_CAP) {
            filtered.push(mv);
            have.add(name);
          }
        } catch (_) {}
      }
    }

    if (filtered.length > 4) filtered = filtered.slice(0, 4);
    while (filtered.length < 4) {
      filtered.push({
        name: 'tackle',
        display: 'tackle',
        type: 'normal',
        damage_class: 'physical',
        power: 40,
        accuracy: 95,
        effects: [],
      });
    }
    return filtered;
  }

  // Helpers de status
  function setStatus(target, type, logs) {
    return setStatusImp(target, type, logs);
  }

  function clearStatus(target, logs, msg) {
    return clearStatusImp(target, logs, msg);
  }

  function modifyStage(target, stat, delta, logs) {
    return modifyStageImp(target, stat, delta, logs);
  }

  function applyStageMove(user, target, move, logs) {
    return applyStageMoveImp(user, target, move, logs);
  }

  function applyStartOfTurnEffects(which, state, logs) {
    return applyStartOfTurnEffectsImp(which, state, logs);
  }

  function applyEndOfTurnEffects(which, state, logs) {
    return applyEndOfTurnEffectsImp(which, state, logs);
  }

  async function buildPlayerFrom(base) {
    if (!base) return null;
    let full = base;
    try {
      if (!base.height || !base.weight || !base.animated || !base.moves) {
        const fetched = await getPokemon(base.id || base.name);
        if (fetched) {
          full = { ...base, ...fetched, animated: base.animated || fetched.animated };
        }
      }
    } catch (_) {}
    return {
      ...full,
      isPlayer: true,
      maxHp: calcMaxHp(full.hp || 50),
      hp: calcMaxHp(full.hp || 50),
      moves: await enrichMoves((full.moves || []).slice(0, 4), full),
      status: null,
      condition: 'normal',
      stages: {
        attack: 0,
        defense: 0,
        spAttack: 0,
        spDefense: 0,
        speed: 0,
        accuracy: 0,
        evasion: 0,
      },
    };
  }

  useEffect(() => {
    const savedTeam = localStorage.getItem('selectedTeam');
    try {
      const storedTrainer = localStorage.getItem('selectedTrainer');
      const n = parseInt(storedTrainer || '1', 10);
      if (!Number.isNaN(n)) setPlayerTrainerId(n);
    } catch (_) {}

    if (savedTeam) {
      const parsed = JSON.parse(savedTeam);
      setTeam(parsed);
      let starter = 0;
      try {
        const savedStarter = localStorage.getItem('starterIndex');
        if (savedStarter !== null) {
          const n = parseInt(savedStarter, 10);
          if (!Number.isNaN(n) && n >= 0 && n < parsed.length) starter = n;
        }
      } catch (_) {}
      if (parsed.length > 0) {
        setCurrentIndex(starter);
        startBattle(parsed[starter]);
      }
    } else {
      setError('Nenhum time encontrado! Volte e selecione seus Pokémon.');
    }
  }, []);

  async function startBattle(selectedPokemon = null) {
    setLoading(true);
    setError(null);
    setUnlockedCard(null); // reset reward ao iniciar nova batalha

    // Lê bosses já derrotados (cartas liberadas)
    let unlockedBossIdsSet = new Set();
    try {
      const rawUnlocked = localStorage.getItem('unlockedBosses') || '[]';
      const arrUnlocked = Array.isArray(JSON.parse(rawUnlocked)) ? JSON.parse(rawUnlocked) : [];
      unlockedBossIdsSet = new Set(arrUnlocked.map((n) => Number(n)));
    } catch (_) {
      unlockedBossIdsSet = new Set();
    }

    // Recupera progresso de rounds (entre seleções de inimigos)
    try {
      const savedRound = parseInt(localStorage.getItem('battleProgressRound') || '0', 10);
      if (!Number.isNaN(savedRound) && savedRound >= 0) setDefeatedEnemies(savedRound);
      else setDefeatedEnemies(0);
    } catch (_) {
      setDefeatedEnemies(0);
    }

    const playerBase = selectedPokemon || {
      id: 25,
      name: 'Pikachu',
      hp: 100,
      condition: 'normal',
      moves: ['tackle', 'thunder-shock', 'quick-attack', 'tail-whip'],
      animated:
        'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/25.gif',
    };

    // Garantir height/weight para escala consistente
    let playerFull = playerBase;
    try {
      if (!playerBase?.height || !playerBase?.weight) {
        const fetched = await getPokemon(playerBase.id || playerBase.name);
        if (fetched) {
          playerFull = {
            ...playerBase,
            height: fetched.height,
            weight: fetched.weight,
            animated: playerBase.animated || fetched.animated,
          };
        }
      }
    } catch (_) {}

    const player = {
      ...playerFull,
      isPlayer: true,
      maxHp: calcMaxHp(playerFull.hp || 50),
      hp: calcMaxHp(playerFull.hp || 50),
      moves: await enrichMoves((playerFull.moves || []).slice(0, 4), playerFull),
      status: null,
      condition: 'normal',
      stages: {
        attack: 0,
        defense: 0,
        spAttack: 0,
        spDefense: 0,
        speed: 0,
        accuracy: 0,
        evasion: 0,
      },
    };

    try {
      let enemies = [];

      // 1) Tenta usar o enemyTeam salvo pela Select Team
      try {
        const stored = localStorage.getItem('enemyTeam');
        if (stored) {
          let parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const originallyHadBoss = parsed.some((e) => !!e?.boss);
            let hasBoss = originallyHadBoss;

            // Se tinha boss, remove bosses que já foram derrotados
            if (hasBoss) {
              parsed = parsed.filter(
                (e) => !(e?.boss && unlockedBossIdsSet.has(Number(e.id))),
              );
              hasBoss = parsed.some((e) => !!e?.boss);
            }

            // Se era batalha de boss mas todos dessa lista já foram derrotados,
            // tenta sortear um novo boss ainda não derrotado do pokedex
            if (originallyHadBoss && !hasBoss) {
              try {
                const allMons = await getAllPokemons();
                const candidates = (allMons || []).filter(
                  (p) => p.boss && !unlockedBossIdsSet.has(Number(p.id)),
                );
                if (candidates.length > 0) {
                  const idx = Math.floor(Math.random() * candidates.length);
                  parsed = [candidates[idx]];
                  hasBoss = true;
                }
              } catch (_) {
                // se der erro aqui, segue o fluxo normal sem boss
              }
            }

            if (hasBoss) {
              setBossPhase(true);
            } else {
              setBossPhase(false);
            }

            if (parsed.length > 0) {
              enemies = await Promise.all(
                parsed.slice(0, hasBoss ? 1 : 3).map(async (enemyData) => {
                  const isBoss = !!enemyData?.boss;
                  const baseMax = calcMaxHp(enemyData.hp || 50);
                  const boostedMax = isBoss
                    ? Math.floor(baseMax * (TUNING.BOSS_HP_MULT || 1))
                    : baseMax;
                  return {
                    ...enemyData,
                    maxHp: boostedMax,
                    hp: boostedMax,
                    condition: 'normal',
                    moves: await enrichMoves((enemyData.moves || []).slice(0, 4), enemyData),
                    status: null,
                    stages: {
                      attack: 0,
                      defense: 0,
                      spAttack: 0,
                      spDefense: 0,
                      speed: 0,
                      accuracy: 0,
                      evasion: 0,
                    },
                  };
                }),
              );
            }
          }
        }
      } catch (_) {
        // se der pau no enemyTeam salvo, cai no fallback abaixo
      }

      // 2) Fallback: se não tem inimigos (ou não tinha boss válido),
      // monta inimigos normais aleatórios (sem boss)
      if (enemies.length === 0) {
        const all = await getAllPokemons();
        const pool = (all || []).filter((p) => p && !p.boss);
        const stagePools = { 1: [], 2: [], 3: [] };
        for (const mon of pool) {
          const st = Math.min(3, Math.max(1, parseInt(mon?.evolutionStage ?? 1, 10)));
          stagePools[st].push(mon);
        }
        const pickFrom = (arr) => {
          if (!arr || arr.length === 0) return null;
          const idx = Math.floor(Math.random() * arr.length);
          return arr.splice(idx, 1)[0];
        };
        const picks = [];
        for (let st = 1; st <= 3; st++) {
          let chosen = pickFrom(stagePools[st]);
          if (!chosen) chosen = pickFrom(pool);
          if (chosen) picks.push(chosen);
        }
        for (const enemyData of picks) {
          const baseMax = calcMaxHp(enemyData.hp || 50);
          const enemy = {
            ...enemyData,
            maxHp: enemyData?.boss
              ? Math.floor(baseMax * (TUNING.BOSS_HP_MULT || 1))
              : baseMax,
            hp: enemyData?.boss
              ? Math.floor(baseMax * (TUNING.BOSS_HP_MULT || 1))
              : baseMax,
            condition: 'normal',
            moves: await enrichMoves((enemyData.moves || []).slice(0, 4), enemyData),
            status: null,
            stages: {
              attack: 0,
              defense: 0,
              spAttack: 0,
              spDefense: 0,
              speed: 0,
              accuracy: 0,
              evasion: 0,
            },
          };
          enemies.push(enemy);
        }
      }

      setEnemyTeam(enemies);
      setCurrentPartyIndex(0);
      setBattle({
        player,
        enemy: enemies[0],
        currentTurn: 'player',
        winner: null,
        bossPhase: bossPhase,
      });
      setLog(['Sua vez!', 'Batalha iniciada!']);
    } catch (err) {
      // fallback hardcore se der ruim em tudo
      const enemy = {
        id: 1,
        name: 'Bulbasaur',
        hp: calcMaxHp(45),
        maxHp: calcMaxHp(45),
        moves: await enrichMoves(['tackle', 'vine-whip', 'growl', 'sleep-powder'], {
          name: 'Bulbasaur',
          evolutionStage: 1,
        }),
        animated:
          'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/25.gif',
        condition: 'normal',
        status: null,
        stages: {
          attack: 0,
          defense: 0,
          spAttack: 0,
          spDefense: 0,
          speed: 0,
          accuracy: 0,
          evasion: 0,
        },
      };
      const enemies = Array.from({ length: ENEMIES_PER_BATTLE }, () => ({ ...enemy }));
      setEnemyTeam(enemies);
      setBattle({
        player,
        enemy: enemies[0],
        currentTurn: 'player',
        winner: null,
        bossPhase: false,
      });
      setLog(['Sua vez!', 'Batalha simulada iniciada!']);
    } finally {
      setLoading(false);
    }
  }


  async function restartBattleFullTeam() {
    try {
      const savedTeam = localStorage.getItem('selectedTeam');
      if (savedTeam) {
        const parsed = JSON.parse(savedTeam);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const clean = parsed.map((p) => ({
            ...p,
            fainted: false,
            status: null,
            condition: 'normal',
          }));
          const idx = Math.min(Math.max(0, currentIndex || 0), clean.length - 1);
          setTeam(clean);
          setCurrentIndex(idx);
          await startBattle(clean[idx]);
          return;
        }
      }
    } catch (_) {}

    try {
      const rebuilt = await Promise.all(
        (Array.isArray(team) ? team : []).map(async (p) => {
          try {
            const full = await getPokemon(p.id || p.name);
            const baseHp = full?.hp ?? p?.hp ?? 50;
            const max = calcMaxHp(baseHp);
            return {
              ...full,
              hp: max,
              maxHp: max,
              fainted: false,
              status: null,
              condition: 'normal',
            };
          } catch (_) {
            const baseHp = p?.hp ?? 50;
            const max = calcMaxHp(baseHp);
            return { ...p, hp: max, maxHp: max, fainted: false, status: null, condition: 'normal' };
          }
        }),
      );
      if (rebuilt.length > 0) {
        setTeam(rebuilt);
        const idx = Math.min(Math.max(0, currentIndex || 0), rebuilt.length - 1);
        await startBattle(rebuilt[idx]);
        return;
      }
    } catch (_) {}

    await startBattle(team[currentIndex]);
  }

  async function handleMove(move) {
    if (!battle || battle.winner || battle.currentTurn !== 'player') return;

    const newBattle = { ...battle };
    const newLog = [...log];

    const canPlayerAct = applyStartOfTurnEffects('player', newBattle, newLog);
    if (!canPlayerAct) {
      applyEndOfTurnEffects('player', newBattle, newLog);
      newBattle.currentTurn = 'enemy';
      setBattle(newBattle);
      setLog(newLog);

      setTimeout(async () => {
        const canEnemyAct = applyStartOfTurnEffects('enemy', newBattle, newLog);
        if (canEnemyAct) {
          const enemyMove =
            newBattle.enemy.moves[Math.floor(Math.random() * newBattle.enemy.moves.length)];
          setEnemyAnim('attack');
          setTimeout(() => setEnemyAnim(null), 1400);
          if (Math.random() * 100 > (enemyMove.accuracy || 95)) {
            newLog.unshift(`${newBattle.enemy.name} errou ${enemyMove.display || enemyMove.name}!`);
          } else {
            const { dmg: dmgE, effectiveness: multE } = calcDamage(
              newBattle.enemy,
              newBattle.player,
              enemyMove,
            );
            newBattle.player.hp = Math.max(newBattle.player.hp - dmgE, 0);

            triggerShake();

            setPlayerAnim('damage');
            setTimeout(() => setPlayerAnim(null), 1600);

            let effMsgE = '';
            if (multE === 0) effMsgE = ' Não teve efeito.';
            else if (multE > 1.5) effMsgE = ' Foi super efetivo!';
            else if (multE < 1) effMsgE = ' Não foi muito efetivo.';

            newLog.unshift(
              `${newBattle.enemy.name} usou ${enemyMove.display || enemyMove.name}! Causou ${dmgE} de dano!${effMsgE}`,
            );

            const isStatusMoveE =
              (enemyMove?.damage_class || '').toLowerCase() === 'status' ||
              (enemyMove?.power ?? 0) <= 0;
            if (isStatusMoveE) {
              applyStageMove(newBattle.enemy, newBattle.player, enemyMove, newLog);
            }

            if (!newBattle.player.status && Array.isArray(enemyMove.effects)) {
              for (const eff of enemyMove.effects) {
                if (Math.random() * 100 < (eff.chance ?? 0)) {
                  setStatus(newBattle.player, eff.type, newLog);
                  break;
                }
              }
            }
          }
        }

        if (newBattle.player.hp <= 0) {
          const updatedTeam = team.map((p, idx) =>
            idx === currentIndex ? { ...p, hp: 0, fainted: true } : p,
          );
          setTeam(updatedTeam);

          let nextIdx = -1;
          if (updatedTeam && updatedTeam.length > 1) {
            for (let step = 1; step <= updatedTeam.length; step++) {
              const idx = (currentIndex + step) % updatedTeam.length;
              if (
                idx !== currentIndex &&
                updatedTeam[idx] &&
                !updatedTeam[idx].fainted &&
                updatedTeam[idx].hp > 0
              ) {
                nextIdx = idx;
                break;
              }
            }
          }

          if (nextIdx === -1) {
            newBattle.winner = 'enemy';
            newLog.unshift(`${newBattle.enemy.name} venceu a batalha!`);
          } else {
            let nextPlayer = await buildPlayerFrom(team[nextIdx]);
            const saved = team[nextIdx];
            if (
              typeof saved?.hp === 'number' &&
                typeof saved?.maxHp === 'number' &&
                saved.maxHp > 0
            ) {
              nextPlayer.maxHp = saved.maxHp;
              nextPlayer.hp = Math.max(0, Math.min(saved.hp, saved.maxHp));
              nextPlayer.status = saved.status || null;
              nextPlayer.condition =
                saved.condition || (nextPlayer.status ? nextPlayer.status.type : 'normal');
            }
            setCurrentIndex(nextIdx);
            newLog.unshift(`Você enviou ${nextPlayer.name}.`);
            setBattle({
              player: nextPlayer,
              enemy: newBattle.enemy,
              currentTurn: 'player',
              winner: null,
            });
            setLog([...newLog]);
            return;
          }
        }

        applyEndOfTurnEffects('enemy', newBattle, newLog);
        newLog.unshift('Sua vez!');
        newBattle.currentTurn = 'player';
        setBattle({ ...newBattle });
        setLog([...newLog]);
      }, ATTACK_GAP_MS);
      return;
    }

    // Jogador atacando
    setPlayerAnim('attack');
    setTimeout(() => setPlayerAnim(null), 1400);

    const acc = (move && move.accuracy) || 95;
    if (Math.random() * 100 > acc) {
      newLog.unshift(`${newBattle.player.name} errou ${move.display || move.name}!`);
    } else {
      const { dmg, effectiveness: mult } = calcDamage(newBattle.player, newBattle.enemy, move);
      newBattle.enemy.hp = Math.max(newBattle.enemy.hp - dmg, 0);

      triggerShake();

      setEnemyAnim('damage');
      setTimeout(() => setEnemyAnim(null), 1600);

      let effMsg = '';
      if (mult === 0) effMsg = ' Não teve efeito.';
      else if (mult > 1.5) effMsg = ' Foi super efetivo!';
      else if (mult < 1) effMsg = ' Não foi muito efetivo.';

      newLog.unshift(
        `${newBattle.player.name} usou ${move.display || move.name}! Causou ${dmg} de dano!${effMsg}`,
      );

      const isStatusMoveP =
        (move?.damage_class || '').toLowerCase() === 'status' || (move?.power ?? 0) <= 0;
      if (isStatusMoveP) {
        applyStageMove(newBattle.player, newBattle.enemy, move, newLog);
      }

      if (!newBattle.enemy.status && move && Array.isArray(move.effects)) {
        for (const eff of move.effects) {
          const chance = eff.chance ?? 0;
          if (Math.random() * 100 < chance) {
            setStatus(newBattle.enemy, eff.type, newLog);
            break;
          }
        }
      }
    }

    // Inimigo derrotado
    if (newBattle.enemy.hp <= 0) {
      if (!bossPhase) {
        // Party do inimigo (mesmo treinador)
        if (currentPartyIndex < enemyTeam.length - 1) {
          const nextIdx = currentPartyIndex + 1;
          setCurrentPartyIndex(nextIdx);
          const nextEnemy = enemyTeam[nextIdx];
          newLog.unshift(`Oponente enviou ${nextEnemy.name}!`);
          setBattle({
            player: newBattle.player,
            enemy: nextEnemy,
            currentTurn: 'player',
            winner: null,
          });
          setLog(newLog);
          return;
        }

        // Round/treinador encerrado
        const defeated = defeatedEnemies + 1;
        setDefeatedEnemies(defeated);
        try {
          localStorage.setItem('battleProgressRound', String(defeated));
        } catch (_) {}
        if (defeated >= ENEMIES_PER_BATTLE) {
          window.location.href = '/select-team?nextRound=boss';
        } else {
          const nxt = defeated + 1;
          window.location.href = `/select-team?nextRound=${nxt}`;
        }
        return;
      } else {
        // Boss derrotado: vitória + possível nova carta
        newBattle.winner = 'player';
        newLog.unshift(`${newBattle.player.name} derrotou o Boss e venceu a batalha!`);

        try {
          const raw = localStorage.getItem('unlockedBosses') || '[]';
          const arr = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
          const id = newBattle.enemy?.id;

          if (id != null && !arr.includes(id)) {
            arr.push(id);
            localStorage.setItem('unlockedBosses', JSON.stringify(arr));

            setUnlockedCard({
              id,
              name: newBattle.enemy.name,
              sprite: newBattle.enemy.animated || newBattle.enemy.sprite,
              types: newBattle.enemy.types || [],
            });
          } else {
            setUnlockedCard(null);
          }
        } catch (_) {
          setUnlockedCard(null);
        }

        setBattle(newBattle);
        setLog(newLog);
        return;
      }
    }

    applyEndOfTurnEffects('player', newBattle, newLog);

    newBattle.currentTurn = 'enemy';
    setBattle(newBattle);
    setLog(newLog);

    setTimeout(async () => {
      const canEnemyAct = applyStartOfTurnEffects('enemy', newBattle, newLog);
      if (canEnemyAct) {
        const enemyMove =
          newBattle.enemy.moves[Math.floor(Math.random() * newBattle.enemy.moves.length)];
        setEnemyAnim('attack');
        setTimeout(() => setEnemyAnim(null), 1400);
        if (Math.random() * 100 > (enemyMove.accuracy || 95)) {
          newLog.unshift(`${newBattle.enemy.name} errou ${enemyMove.display || enemyMove.name}!`);
        } else {
          const { dmg: dmgE, effectiveness: multE } = calcDamage(
            newBattle.enemy,
            newBattle.player,
            enemyMove,
          );
          newBattle.player.hp = Math.max(newBattle.player.hp - dmgE, 0);

          triggerShake();

          setPlayerAnim('damage');
          setTimeout(() => setPlayerAnim(null), 1600);

          let effMsgE = '';
          if (multE === 0) effMsgE = ' Não teve efeito.';
          else if (multE > 1.5) effMsgE = ' Foi super efetivo!';
          else if (multE < 1) effMsgE = ' Não foi muito efetivo.';

          newLog.unshift(
            `${newBattle.enemy.name} usou ${enemyMove.display || enemyMove.name}! Causou ${dmgE} de dano!${effMsgE}`,
          );

          if (!newBattle.player.status && Array.isArray(enemyMove.effects)) {
            for (const eff of enemyMove.effects) {
              if (Math.random() * 100 < (eff.chance ?? 0)) {
                setStatus(newBattle.player, eff.type, newLog);
                break;
              }
            }
          }
        }
      }

      if (newBattle.player.hp <= 0) {
        const updatedTeam = team.map((p, idx) =>
          idx === currentIndex ? { ...p, hp: 0, fainted: true } : p,
        );
        setTeam(updatedTeam);

        let nextIdx = -1;
        if (updatedTeam && updatedTeam.length > 1) {
          for (let step = 1; step <= updatedTeam.length; step++) {
            const idx = (currentIndex + step) % updatedTeam.length;
            if (
              idx !== currentIndex &&
              updatedTeam[idx] &&
              !updatedTeam[idx].fainted &&
              updatedTeam[idx].hp > 0
            ) {
              nextIdx = idx;
              break;
            }
          }
        }

        if (nextIdx === -1) {
          newBattle.winner = 'enemy';
          newLog.unshift(`${newBattle.enemy.name} venceu a batalha!`);
        } else {
          let nextPlayer = await buildPlayerFrom(team[nextIdx]);
          const saved = team[nextIdx];
          if (
            typeof saved?.hp === 'number' &&
            typeof saved?.maxHp === 'number' &&
            saved.maxHp > 0
          ) {
            nextPlayer.maxHp = saved.maxHp;
            nextPlayer.hp = Math.max(0, Math.min(saved.hp, saved.maxHp));
            nextPlayer.status = saved.status || null;
            nextPlayer.condition =
              saved.condition || (nextPlayer.status ? nextPlayer.status.type : 'normal');
          }
          setCurrentIndex(nextIdx);
          newLog.unshift(`Você enviou ${nextPlayer.name}.`);
          setBattle({
            player: nextPlayer,
            enemy: newBattle.enemy,
            currentTurn: 'player',
            winner: null,
          });
          setLog([...newLog]);
          return;
        }
      }

      applyEndOfTurnEffects('enemy', newBattle, newLog);
      newLog.unshift('Sua vez!');
      newBattle.currentTurn = 'player';
      setBattle({ ...newBattle });
      setLog([...newLog]);
    }, ATTACK_GAP_MS);
  }

  async function handleSwitch(index) {
    if (index === currentIndex || !team[index]) return;

    const target = team[index];

    if (target.hp <= 0 || target.fainted) {
      setLog((prev) => [`${target.name} não pode lutar!`, ...prev]);
      return;
    }

    try {
      setTeam((prev) => {
        const list = Array.isArray(prev) ? [...prev] : [];
        if (list[currentIndex] && battle?.player) {
          list[currentIndex] = {
            ...list[currentIndex],
            hp: battle.player.hp,
            maxHp: battle.player.maxHp,
            status: battle.player.status || null,
            condition: battle.player.condition || 'normal',
          };
        }
        return list;
      });
    } catch (_) {}

    setCurrentIndex(index);
    let nextPlayer = await buildPlayerFrom(target);
    if (typeof target?.hp === 'number' && typeof target?.maxHp === 'number' && target.maxHp > 0) {
      nextPlayer.maxHp = target.maxHp;
      nextPlayer.hp = Math.max(0, Math.min(target.hp, target.maxHp));
      nextPlayer.status = target.status || null;
      nextPlayer.condition =
        target.condition || (nextPlayer.status ? nextPlayer.status.type : 'normal');
    }
    setBattle((prev) => ({ ...prev, player: nextPlayer }));
    setLog((prev) => [`Você trocou para ${target.name}`, ...prev]);
  }

  if (loading && !battle) return <p>Carregando batalha...</p>;
  if (error)
    return (
      <div className="container" style={{ padding: 20 }}>
        <p>{error}</p>
        <ConfirmButton onClick={() => restartBattleFullTeam()}>Tentar novamente</ConfirmButton>
      </div>
    );
  if (!battle) return null;

  const { player, enemy, winner, currentTurn } = battle;

  const getScale = (mon) => {
    const h = (mon?.height ?? 10) / 10;
    const wkg = (mon?.weight ?? 100) / 10;
    const raw = 0.6 * h + 0.4 * Math.sqrt(Math.max(10, wkg) / 30) + 0.2;
    return Math.max(0.65, Math.min(1.6, raw));
  };
  const pScale = getScale(player);
  const eScale = getScale(enemy);
  const playerTrainerSrc = `/images/trainer${playerTrainerId}pixel.png`;
  const enemyTrainerSrc = bossPhase
    ? '/images/gary.png'
    : `/images/enemy${Math.min(defeatedEnemies + 1, ENEMIES_PER_BATTLE)}.png`;

  const activeRound = bossPhase ? 'boss' : Math.min(defeatedEnemies + 1, ENEMIES_PER_BATTLE);
  const arenaBg =
    activeRound === 'boss'
      ? '/arenaBoss.png'
      : activeRound === 1
        ? '/arenaFighter.png'
        : activeRound === 2
          ? '/arenaIce.png'
          : activeRound === 3
            ? '/arenaShadow.png'
            : activeRound === 4
              ? '/arenaDragon.png'
              : '/arena.png';

  const containerStyle = bossPhase
    ? {
        backgroundImage: `url(${arenaBg})`,
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% 100%',
        backgroundAttachment: 'fixed',
        backgroundColor: '#000',
      }
    : { backgroundImage: `url(${arenaBg})` };

  return (
    <div className={styles.battleContainer} style={containerStyle}>
      <div
        className={styles.arena}
        style={{
          transform: `translate(${shakeOffset.x}px, ${shakeOffset.y}px)`,
        }}
      >
        {/* Progresso de rounds + boss */}
        <div className={styles.battleProgress}>
          <div className={styles.progressDots}>
            {Array.from({ length: ENEMIES_PER_BATTLE }).map((_, i) => {
              const done = i < defeatedEnemies;
              const active = i === defeatedEnemies && !bossPhase && !winner;
              return (
                <span
                  key={`dot-${i}`}
                  className={`${styles.progDot} ${done ? styles.progDotDone : ''} ${active ? styles.progDotActive : ''}`.trim()}
                />
              );
            })}
            <span
              className={`${styles.progBoss} ${bossPhase && !winner ? styles.progBossActive : ''} ${winner === 'player' && bossPhase ? styles.progBossDone : ''}`.trim()}
              title="Boss"
            >
              <img
                className={styles.bossIcon}
                src="/sprites/pokeballs/master-ball.png"
                alt="Boss"
              />
            </span>
          </div>
        </div>

        {/* Treinadores */}
        <div className={`${styles.trainers} ${bossPhase ? styles.trainersBoss : ''}`}>
          <img src={enemyTrainerSrc} alt="Treinador Inimigo" className={styles.trainerPlayer} />
          <img src={playerTrainerSrc} alt="Treinador Jogador" className={styles.trainerEnemy} />
        </div>

        {/* Inimigo */}
        <div className={styles.enemySection}>
          <div className={styles.switchRow}>
            {(enemyTeam || []).map((_, i) => {
              const defeated = i < (currentPartyIndex || 0);
              const active = i === (currentPartyIndex || 0);
              return (
                <div
                  key={`enemy-ball-${i}`}
                  className={`${styles.ballBtn} ${active ? styles.ballActive : ''} ${defeated ? styles.ballDefeated : ''}`}
                  style={{ cursor: 'default' }}
                >
                  <img src="/sprites/pokeballs/poke-ball.png" alt="Pokébola adversário" />
                </div>
              );
            })}
          </div>
          <div className={styles.hpPanel}>
            <div className={styles.nameCol}>
              <div className={styles.hpName}>{enemy.name}</div>
              <ConditionBar condition={enemy.condition} />
            </div>
            <HPBar hp={enemy.hp} maxHp={enemy.maxHp} color="red" />
            <div className={styles.hpText}>
              {enemy.hp} / {enemy.maxHp}
            </div>
          </div>
          <div
            className={styles.mirror}
            style={{
              ['--atkDist']: `${Math.max(30, Math.min(90, 36 * eScale)).toFixed(0)}px`,
              ['--shakeDist']: `${Math.max(3, Math.min(10, 5 * eScale)).toFixed(0)}px`,
            }}
          >
            <div className={`${styles.spriteBox} ${bossPhase ? styles.bossSprites : ''}`}>
              <div
                className={styles.spriteScale}
                style={{
                  ['--pokeScale']: `${eScale}`,
                  ['--groundScale']: `${eScale}`,
                }}
              >
                <img
                  src={enemy.animated}
                  alt={enemy.name}
                  className={`${styles.sprite} ${enemyAnim === 'attack' ? styles.attackEnemy : ''} ${enemyAnim === 'damage' ? styles.damageAnim : ''}`}
                  style={{
                    ['--shakeDist']: `${Math.max(3, Math.min(10, 5 * eScale)).toFixed(0)}px`,
                  }}
                />
              </div>
              <div className={styles.ground}></div>
            </div>
          </div>
        </div>

        {/* Jogador */}
        <div className={styles.playerSection}>
          <div className={styles.switchRow} onMouseLeave={() => setHoveredBall(-1)}>
            {team.map((p, idx) => {
              const isDead = p.hp <= 0 || p.fainted;
              return (
                <button
                  key={idx}
                  className={`${styles.ballBtn} 
        ${idx === currentIndex ? styles.ballActive : ''} 
        ${isDead ? styles.ballDefeated : ''}`}
                  title={p.name}
                  disabled={isDead}
                  onMouseEnter={() => setHoveredBall(idx)}
                  onFocus={() => setHoveredBall(idx)}
                  onBlur={() => setHoveredBall(-1)}
                  onClick={() => {
                    if (idx === currentIndex || isDead) return;
                    setPendingSwitch(idx);
                  }}
                >
                  <img src="/sprites/pokeballs/poke-ball.png" alt="Pokébola" />
                </button>
              );
            })}

            {hoveredBall >= 0 && team[hoveredBall] && (
              <div className={styles.ballTooltip}>{team[hoveredBall].name}</div>
            )}

            {pendingSwitch !== null && team[pendingSwitch] && (
              <div className={styles.confirmSwap}>
                <div className={styles.confirmText}>
                  Deseja trocar para {team[pendingSwitch].name}?
                </div>
                <div className={styles.confirmActions}>
                  <button
                    className={styles.confirmBtn}
                    onClick={() => {
                      const idx = pendingSwitch;
                      setPendingSwitch(null);
                      handleSwitch(idx);
                    }}
                  >
                    Sim
                  </button>
                  <button
                    className={styles.confirmBtnSecondary}
                    onClick={() => setPendingSwitch(null)}
                  >
                    Não
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className={styles.hpPanel}>
            <div className={styles.nameCol}>
              <div className={styles.hpName}>{player.name}</div>
              <ConditionBar condition={player.condition} />
            </div>
            <HPBar hp={player.hp} maxHp={player.maxHp} color="green" />
            <div className={styles.hpText}>
              {player.hp} / {player.maxHp}
            </div>
          </div>
          <div className={`${styles.spriteBox} ${bossPhase ? styles.bossSprites : ''}`}>
            <div
              className={styles.spriteScale}
              style={{
                ['--pokeScale']: `${pScale}`,
                ['--groundScale']: `${pScale}`,
              }}
            >
              <img
                src={player.animated}
                alt={player.name}
                className={`${styles.sprite} ${
                  playerAnim === 'attack' ? styles.attackPlayer : ''
                } ${playerAnim === 'damage' ? styles.damageAnim : ''}`}
                style={{
                  ['--atkDist']: `${Math.max(30, Math.min(90, 36 * pScale)).toFixed(0)}px`,
                  ['--shakeDist']: `${Math.max(3, Math.min(10, 5 * pScale)).toFixed(0)}px`,
                }}
              />
            </div>
            <div className={styles.ground}></div>
          </div>

          {false && (
            <>
              <button
                className={styles.attackMenuToggle}
                onClick={() => {
                  setShowMoves((v) => !v);
                  setShowSwitch(false);
                }}
              >
                {showMoves ? 'Fechar ataques' : 'Atacar'}
              </button>
              {showMoves && (
                <div className={styles.attackMenu}>
                  {player.moves.map((mv, idx) => {
                    const item =
                      typeof mv === 'string'
                        ? {
                            name: mv,
                            display: cap(mv),
                            power: 40,
                            accuracy: 95,
                            type: 'normal',
                            effects: [],
                          }
                        : mv;
                    const mult = typeMultiplier(item.type || 'normal', enemy.types || []);
                    const multClass =
                      mult === 1
                        ? styles.multNeutral
                        : mult === 0
                          ? styles.multBad
                          : mult > 1
                            ? styles.multGood
                            : styles.multBad;
                    const multLabel =
                      mult === 1
                        ? 'Efeito Normal'
                        : mult === 0
                          ? 'Sem efeito'
                          : mult > 1
                            ? 'Super efetivo'
                            : 'Não muito efetivo';
                    return (
                      <button
                        key={idx}
                        className={styles.moveItem}
                        onClick={() => {
                          setShowMoves(false);
                          handleMove(item);
                        }}
                      >
                        <div className={styles.moveHeader}>
                          <span className={styles.moveName}>{moveName(item)}</span>
                          <span className={`${styles.typeBadge} ${styles[item.type] || ''}`}>
                            {typeLabel(item.type || 'normal')}
                          </span>
                        </div>
                        <span className={styles.moveStats}>
                          Poder {item.power} Precisão {item.accuracy}%
                        </span>
                        <div className={styles.moveMeta}>
                          <span className={`${styles.moveMult} ${multClass}`}>{multLabel}</span>
                          {item.effects && item.effects.length > 0 && (
                            <span className={styles.moveEffects}>
                              {item.effects.map((e) => `${e.type} ${e.chance}%`).join(' ')}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {winner === 'enemy' && (
            <div className={styles.defeatOverlay}>
              <div className={styles.defeatBox}>
                <h2>Derrota</h2>
                <p>Você perdeu a batalha! O que deseja fazer agora?</p>
                <div className={styles.optionButtons}>
                  <ConfirmButton onClick={() => restartBattleFullTeam()}>
                    Tentar Novamente
                  </ConfirmButton>
                  <ConfirmButton
                    onClick={() => {
                      try {
                        localStorage.setItem('battleProgressRound', '0');
                      } catch (_) {}
                      window.location.href = '/select-pokemon';
                    }}
                  >
                    Voltar a tela de escolha
                  </ConfirmButton>
                </div>
              </div>
            </div>
          )}

          {winner && (
            <div className={styles.winner}>
              <h3>{winner === 'player' ? 'Você venceu!' : 'Você perdeu!'}</h3>
            </div>
          )}

          {winner === 'player' && (
            <div className={styles.victoryOverlay}>
              <div className={styles.victoryBox}>
                <h2>🏆 Vitória! 🏆</h2>

                {bossPhase && unlockedCard && (
                  <div className={styles.cardReward}>
                    <h3>Nova carta desbloqueada!</h3>
                    <div className={styles.cardRewardInner}>
                      <div className={styles.cardFrame}>
                        <img
                          src={unlockedCard.sprite}
                          alt={unlockedCard.name}
                          className={styles.cardSprite}
                        />
                        <div className={styles.cardName}>{unlockedCard.name}</div>
                        {unlockedCard.types && unlockedCard.types.length > 0 && (
                          <div className={styles.cardTypes}>
                            {unlockedCard.types.map((t) => (
                              <span
                                key={t}
                                className={`${styles.typeBadge} ${styles[t] || ''}`}
                              >
                                {typeLabel(t)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className={styles.cardHint}>
                        Essa carta agora está disponível na sua coleção e na tela de conquistas.
                      </p>
                    </div>
                  </div>
                )}

                {!bossPhase && <p>Você venceu a batalha!</p>}
                {bossPhase && !unlockedCard && (
                  <p>Você derrotou o Boss! (Nenhuma nova carta dessa vez.)</p>
                )}

                <p>O que deseja fazer agora?</p>

                <div className={styles.optionButtons}>
                  <ConfirmButton
                    onClick={() => {
                      try {
                        localStorage.setItem('battleProgressRound', '0');
                      } catch (_) {}
                      window.location.href = '/select-pokemon';
                    }}
                  >
                    Voltar à tela de escolha
                  </ConfirmButton>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Menu de ataque lateral */}
      {!winner && currentTurn === 'player' && (
        <div className={styles.attackSidebar}>
          <AttackMenu
            moves={player.moves.map((mv) =>
              typeof mv === 'string'
                ? {
                    name: mv,
                    display: cap(mv),
                    power: 40,
                    accuracy: 95,
                    type: 'normal',
                    damage_class: 'physical',
                    effects: [],
                  }
                : mv,
            )}
            attackerTypes={player.types || []}
            defenderTypes={enemy.types || []}
            onSelect={(item) => {
              handleMove(item);
            }}
          />
        </div>
      )}

      {/* Log no rodapé */}
      <div
        className={`${styles.battleLogBottom} ${!logExpanded ? styles.collapsed : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => setLogExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setLogExpanded((v) => !v);
        }}
        title={logExpanded ? 'Ocultar histórico' : 'Mostrar histórico'}
      >
        <ul>
          {log.map((entry, idx) => (
            <li key={idx}>{entry}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
