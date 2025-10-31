import { useState, useEffect, useRef } from "react";
import HPBar from "@/components/HPBar";
import ConditionBar from "@/components/ConditionBar";
import { getPokemon, getMove, getAllPokemons } from "@/utils/api";
import { STAGE_MOVES } from "@/utils/moves";
import { typeLabel, moveName } from "@/utils/i18n";
import styles from "@/styles/Battle.module.css";
import ConfirmButton from "@/components/ui/ConfirmButton";
import AttackMenu from "@/components/ui/AttackMenu";

// Cache simples para os detalhes de golpes (evita múltiplos fetches do mesmo golpe)
const moveCache = new Map();

export default function Battle() {
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

  // Ajustes de balanceamento (facilmente tunáveis)
  const TUNING = {
    LEVEL: 30,
    HP_SCALE: 5, // 90% do HP vanilla para lutas mais dinâmicas
    STAB: 1.35, // bônus por golpe do mesmo tipo
    CRIT_RATE: 0.1, // 10% de chance de crítico
    CRIT_MULT: 1.5, // crítico aumenta dano em 50%
    RAND_MIN: 0.9, // variação aleatória do dano
    RAND_MAX: 1.1,
    CAP_SUPER: 2.0, // limite para super efetivo
    FLOOR_RESIST: 0.5, // mínimo para pouco efetivo
    HONOR_IMMUNITIES: true, // manter imunidades (normal->ghost etc.)
    // Buff leve para o jogador
    PLAYER_ATK_MULT: 1.2,
    // Boss tuning
    BOSS_LEVEL: 48, // nível efetivo para Boss
    BOSS_ATK_MULT: 1.4, // Boss causa mais dano
    BOSS_DEF_MULT: 1.35, // Boss recebe menos dano
    BOSS_HP_MULT: 1.45, // Boss tem mais HP
  };

  const ATTACK_GAP_MS = 3200; // intervalo maior para separar turnos
  const [hoveredBall, setHoveredBall] = useState(-1);
  const [pendingSwitch, setPendingSwitch] = useState(null);
  // Número de oponentes normais antes do Boss
  const ENEMIES_PER_BATTLE = 4;
  const [defeatedEnemies, setDefeatedEnemies] = useState(0);
  const [bossPhase, setBossPhase] = useState(false);
  const [currentPartyIndex, setCurrentPartyIndex] = useState(0);
  
  // Auto-redirect to Select Pokemon after defeating the Boss
  useEffect(() => {
    if (battle?.winner === "player" && (battle?.bossPhase || bossPhase)) {
      const t = setTimeout(() => {
        try { localStorage.setItem("battleProgressRound", "0"); } catch (_) {}
        window.location.href = "/select-pokemon";
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [battle?.winner, battle?.bossPhase, bossPhase]);

  async function enrichMoves(moves) {
    // Normaliza golpes vindos como string (ex.: "tackle") ou objeto do pokedex.json
    const normalize = (raw) => {
      if (!raw) return null;
      if (typeof raw === "string") return null; // será resolvido via getMove abaixo
      if (typeof raw === "object") {
        const effectObj = raw.effect || null;
        const effects = Array.isArray(raw.effects)
          ? raw.effects
          : effectObj
            ? [{ type: effectObj.type, chance: effectObj.chance }]
            : [];
        return {
          name: raw.name || raw.id || "",
          display: raw.display || raw.name || "",
          type: (raw.type || raw.element || "normal").toLowerCase(),
          damage_class: (raw.damage_class || raw.category || "unknown").toLowerCase(),
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

    // Resolve detalhes para entradas string via getMove (puxando do pokedex.json)
    const resolved = await Promise.all(
      list.map(async (mv) => {
        // Cache por chave de string para evitar buscas repetidas
        if (typeof mv === "string") {
          const key = mv.toLowerCase();
          if (moveCache.has(key)) return moveCache.get(key);
          try {
            const data = normalize(await getMove(key)) || {
              name: key,
              display: cap(key),
              power: 40,
              accuracy: 95,
              type: "normal",
              damage_class: "physical",
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
              type: "normal",
              damage_class: "physical",
              effects: [],
            };
          }
        }

        // Se já é objeto, apenas normaliza (não precisa buscar)
        const normalized = normalize(mv);
        if (normalized?.name) return normalized;

        // Fallback muito defensivo
        const name = typeof mv?.name === "string" ? mv.name : "unknown";
        return {
          name,
          display: cap(name),
          power: mv?.power ?? 40,
          accuracy: mv?.accuracy ?? 95,
          type: (mv?.type || "normal").toLowerCase(),
          damage_class: (mv?.damage_class || "physical").toLowerCase(),
          effects: Array.isArray(mv?.effects) ? mv.effects : [],
        };
      })
    );

    return resolved;
  }

  function typeMultiplier(moveType, defenderTypes = []) {
    const chart = {
      normal: { rock: 0.5, ghost: 0, steel: 0.5 },
      fire: { grass: 2, ice: 2, bug: 2, steel: 2, fire: 0.5, water: 0.5, rock: 0.5, dragon: 0.5 },
      water: { fire: 2, ground: 2, rock: 2, water: 0.5, grass: 0.5, dragon: 0.5 },
      electric: { water: 2, flying: 2, electric: 0.5, grass: 0.5, dragon: 0.5, ground: 0 },
      grass: { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, dragon: 0.5, steel: 0.5 },
      ice: { grass: 2, ground: 2, flying: 2, dragon: 2, fire: 0.5, water: 0.5, ice: 0.5, steel: 0.5 },
      fighting: { normal: 2, ice: 2, rock: 2, dark: 2, steel: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, fairy: 0.5, ghost: 0 },
      poison: { grass: 2, fairy: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0 },
      ground: { fire: 2, electric: 2, poison: 2, rock: 2, steel: 2, grass: 0.5, bug: 0.5, flying: 0 },
      flying: { grass: 2, fighting: 2, bug: 2, electric: 0.5, rock: 0.5, steel: 0.5 },
      psychic: { fighting: 2, poison: 2, psychic: 0.5, steel: 0.5, dark: 0 },
      bug: { grass: 2, psychic: 2, dark: 2, fire: 0.5, fighting: 0.5, poison: 0.5, flying: 0.5, ghost: 0.5, steel: 0.5, fairy: 0.5 },
      rock: { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5, ground: 0.5, steel: 0.5 },
      ghost: { ghost: 2, psychic: 2, dark: 0.5, normal: 0 },
      dragon: { dragon: 2, steel: 0.5, fairy: 0 },
      dark: { psychic: 2, ghost: 2, fighting: 0.5, dark: 0.5, fairy: 0.5 },
      steel: { ice: 2, rock: 2, fairy: 2, fire: 0.5, water: 0.5, electric: 0.5, steel: 0.5 },
      fairy: { fighting: 2, dragon: 2, dark: 2, fire: 0.5, poison: 0.5, steel: 0.5 },
    };
    const def = defenderTypes || [];
    let mult = def.reduce((acc, t) => acc * (chart[moveType]?.[t] ?? 1), 1);
    if (!TUNING.HONOR_IMMUNITIES && mult === 0) mult = TUNING.FLOOR_RESIST;
    if (mult > TUNING.CAP_SUPER) mult = TUNING.CAP_SUPER;
    if (mult > 0 && mult < TUNING.FLOOR_RESIST) mult = TUNING.FLOOR_RESIST;
    return mult;
  }

  // Cálculo de dano
  function calcDamage(attacker, defender, move) {
    const attackerIsBoss = !!(attacker && attacker.boss);
    const defenderIsBoss = !!(defender && defender.boss);
    const attackerIsPlayer = !!(attacker && attacker.isPlayer);
    const level = attackerIsBoss ? (TUNING.BOSS_LEVEL || TUNING.LEVEL) : TUNING.LEVEL;
    const isStatusMove = (move?.damage_class || "").toLowerCase() === "status" || (move?.power ?? 0) <= 0;
    if (isStatusMove) {
      return { dmg: 0, effectiveness: 1 };
    }

    const stageMult = (s = 0) => {
      const n = Math.max(-6, Math.min(6, s));
      if (n >= 0) return (2 + n) / 2;
      return 2 / (2 - n);
    };

    const isSpecial = (move?.damage_class || "").toLowerCase() === "special";
    const baseAtk = isSpecial
      ? (attacker?.special_attack ?? attacker?.spAttack ?? attacker?.sp_atk ?? attacker?.attack ?? 50)
      : (attacker?.attack ?? 50);
    const baseDef = isSpecial
      ? (defender?.special_defense ?? defender?.spDefense ?? defender?.sp_def ?? defender?.defense ?? 50)
      : (defender?.defense ?? 50);
    const atkStage = isSpecial
      ? (attacker?.stages?.spAttack ?? attacker?.stages?.attack ?? 0)
      : (attacker?.stages?.attack ?? 0);
    const defStage = isSpecial
      ? (defender?.stages?.spDefense ?? defender?.stages?.defense ?? 0)
      : (defender?.stages?.defense ?? 0);
    let atk = baseAtk * stageMult(atkStage);
    if (attackerIsPlayer) atk *= (TUNING.PLAYER_ATK_MULT || 1);
    let def = baseDef * stageMult(defStage);
    if (attackerIsBoss) atk *= (TUNING.BOSS_ATK_MULT || 1);
    if (defenderIsBoss) def *= (TUNING.BOSS_DEF_MULT || 1);

    const power = Math.max(1, move?.power ?? 40);
    const stab = move?.type && (attacker?.types || []).includes(move.type) ? TUNING.STAB : 1;
    const effectiveness = typeMultiplier(move?.type || "normal", defender?.types || []);
    const rand = TUNING.RAND_MIN + Math.random() * (TUNING.RAND_MAX - TUNING.RAND_MIN);
    const base = (((2 * level) / 5 + 2) * power * (atk / Math.max(1, def))) / 50 + 2;
    const crit = Math.random() < TUNING.CRIT_RATE ? TUNING.CRIT_MULT : 1;
    const dmg = Math.max(1, Math.floor(base * stab * effectiveness * rand * crit));
    return { dmg, effectiveness };
  }

  const LEVEL = 30;
  function calcMaxHp(baseHp, level = LEVEL) {
    const iv = 15; // baseline de IV
    const ev = 0;  // sem EVs
    const vanilla = Math.max(
      1,
      Math.floor(((2 * baseHp + iv + Math.floor(ev / 4)) * level) / 100) + level + 10
    );
    return Math.max(1, Math.floor(vanilla * TUNING.HP_SCALE));
  }

  // --- Status helpers (persist/decay) ---
  const STATUS_DURATIONS = { asleep: [2, 3], frozen: [2, 3] };
  const randIn = (range) =>
    Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];

  function setStatus(target, type, logs) {
    if (!type || type === "normal") return;
    if (target.condition && target.condition !== "normal") return;
    target.condition = type;
    if (STATUS_DURATIONS[type])
      target.status = { type, turns: randIn(STATUS_DURATIONS[type]) };
    else target.status = { type, turns: -1 };
    const labels = {
      asleep: "adormeceu",
      frozen: "foi congelado",
      burned: "foi queimado",
      poisoned: "foi envenenado",
      paralyzed: "ficou paralisado",
    };
    logs?.unshift(`${target.name} ${labels[type] || "sofreu um status"}.`);
  }

  function clearStatus(target, logs, msg) {
    target.condition = "normal";
    target.status = null;
    if (msg) logs?.unshift(msg);
  }

  function modifyStage(target, stat, delta, logs) {
    if (!target.stages)
      target.stages = {
        attack: 0,
        defense: 0,
        spAttack: 0,
        spDefense: 0,
        speed: 0,
        accuracy: 0,
        evasion: 0,
      };
    const valid = new Set([
      "attack",
      "defense",
      "spAttack",
      "spDefense",
      "speed",
      "accuracy",
      "evasion",
    ]);
    const key = valid.has(stat) ? stat : "attack";
    const before = target.stages[key] || 0;
    const after = Math.max(-6, Math.min(6, before + delta));
    target.stages[key] = after;
    const labels = {
      attack: "Ataque",
      defense: "Defesa",
      spAttack: "Ataque Esp.",
      spDefense: "Defesa Esp.",
      speed: "Velocidade",
      accuracy: "Precisão",
      evasion: "Evasão",
    };
    const changeLabel = delta < 0 ? "caiu" : "aumentou";
    if (after !== before)
      logs?.unshift(`${target.name} teve o ${labels[key] || key} ${changeLabel}!`);
  }


  function applyStageMove(user, target, move, logs) {
    const n = (move?.name || move?.id || "").toString().toLowerCase();
    const defs = STAGE_MOVES[n];
    if (!defs) return;
    for (const eff of defs) {
      const tgt = eff.target === "self" ? user : target;
      modifyStage(tgt, eff.stat, eff.delta, logs);
    }
  }

  function applyStartOfTurnEffects(which, state, logs) {
    const actor = which === "player" ? state.player : state.enemy;
    if (!actor.status) return true;
    const { type } = actor.status;

    if (type === "asleep" || type === "frozen") {
      actor.status.turns -= 1;
      if (actor.status.turns > 0) {
        const label = type === "asleep" ? "dormindo" : "congelado";
        logs.unshift(`${actor.name} está ${label} e não pode agir!`);
        return false;
      } else {
        const endMsg =
          type === "asleep"
            ? `${actor.name} acordou!`
            : `${actor.name} descongelou!`;
        clearStatus(actor, logs, endMsg);
        return true;
      }
    }

    if (type === "paralyzed") {
      if (Math.random() < 0.25) {
        logs.unshift(`${actor.name} está paralisado e não se moveu!`);
        return false;
      }
    }
    return true;
  }

  function applyEndOfTurnEffects(which, state, logs) {
    const actor = which === "player" ? state.player : state.enemy;
    if (!actor.status) return;
    const { type } = actor.status;
    if (type === "burned" || type === "poisoned") {
      const tick = Math.max(1, Math.floor(5 + Math.random() * 5));
      actor.hp = Math.max(0, actor.hp - tick);
      const label = type === "burned" ? "queimado" : "envenenado";
      logs.unshift(`${actor.name} sofreu ${tick} de dano (${label}).`);
    }
  }

  // Local move data fallback
  const MOVEDEX = {
    tackle: { power: 40, accuracy: 95, effects: [] },
    "quick-attack": { power: 40, accuracy: 100, effects: [] },
    "thunder-shock": { power: 40, accuracy: 100, effects: [{ type: "paralyzed", chance: 10 }] },
    "vine-whip": { power: 45, accuracy: 100, effects: [] },
    ember: { power: 40, accuracy: 100, effects: [{ type: "burned", chance: 10 }] },
    "water-gun": { power: 40, accuracy: 100, effects: [] },
    "ice-beam": { power: 90, accuracy: 100, effects: [{ type: "frozen", chance: 10 }] },
    "poison-sting": { power: 15, accuracy: 70, effects: [{ type: "poisoned", chance: 20 }] },
    "sleep-powder": { power: 0, accuracy: 75, effects: [{ type: "asleep", chance: 100 }] },
    "tail-whip": { power: 0, accuracy: 100, effects: [] },
    growl: { power: 0, accuracy: 100, effects: [] },
  };

  function cap(s) {
    if (!s) return "";
    return String(s)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }


  // Build a fresh, battle-ready player from a team entry
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
    } catch (e) { }
    return {
      ...full,
      isPlayer: true,
      maxHp: calcMaxHp(full.hp || 50),
      hp: calcMaxHp(full.hp || 50),
      condition: "normal",
      status: null,
      stages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
      moves: await enrichMoves((full.moves || []).slice(0, 4)),
    };
  }

  useEffect(() => {
    const savedTeam = localStorage.getItem("selectedTeam");
    // Lê o treinador escolhido na Home
    try {
      const storedTrainer = localStorage.getItem("selectedTrainer");
      const n = parseInt(storedTrainer || "1", 10);
      if (!Number.isNaN(n)) setPlayerTrainerId(n);
    } catch (e) { }
    if (savedTeam) {
      const parsed = JSON.parse(savedTeam);
      setTeam(parsed);
      let starter = 0;
      try {
        const savedStarter = localStorage.getItem("starterIndex");
        if (savedStarter !== null) {
          const n = parseInt(savedStarter, 10);
          if (!Number.isNaN(n) && n >= 0 && n < parsed.length) starter = n;
        }
      } catch (e) { }
      if (parsed.length > 0) {
        setCurrentIndex(starter);
        startBattle(parsed[starter]);
      }
    } else {
      setError("Nenhum time encontrado! Volte e selecione seus Pokémon.");
    }
  }, []);

  async function startBattle(selectedPokemon = null) {
    setLoading(true);
    setError(null);
    // Recupera progresso de rounds (entre seleções de inimigos)
    try {
      const savedRound = parseInt(localStorage.getItem("battleProgressRound") || "0", 10);
      if (!Number.isNaN(savedRound) && savedRound >= 0) setDefeatedEnemies(savedRound);
      else setDefeatedEnemies(0);
    } catch (_) {
      setDefeatedEnemies(0);
    }

    const playerBase = selectedPokemon || {
      id: 25,
      name: "Pikachu",
      hp: 100,
      condition: "normal",
      moves: ["tackle", "thunder-shock", "quick-attack", "tail-whip"],
      animated:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/25.gif",
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
    } catch (e) { }

    const player = {
      ...playerFull,
      isPlayer: true,
      maxHp: calcMaxHp(playerFull.hp || 50),
      hp: calcMaxHp(playerFull.hp || 50),
      moves: await enrichMoves((playerFull.moves || []).slice(0, 4)),
      status: null,
      condition: "normal",
      stages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
    };

    try {
      let enemies = [];
      // Use a prévia se existir (definida na Select Team)
      try {
        const stored = localStorage.getItem("enemyTeam");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const hasBoss = parsed.some((e) => !!e?.boss);
            if (hasBoss) setBossPhase(true);
            enemies = await Promise.all(
              parsed.slice(0, hasBoss ? 1 : 3).map(async (enemyData) => {
                const isBoss = !!enemyData?.boss;
                const baseMax = calcMaxHp(enemyData.hp || 50);
                const boostedMax = isBoss ? Math.floor(baseMax * (TUNING.BOSS_HP_MULT || 1)) : baseMax;
                return ({
                  ...enemyData,
                  maxHp: boostedMax,
                  hp: boostedMax,
                  condition: "normal",
                  moves: await enrichMoves((enemyData.moves || []).slice(0, 4)),
                  status: null,
                  stages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
                });
              })
            );
          }
        }
      } catch (e) { }

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
          const enemy = {
            ...enemyData,
            maxHp: (() => { const base = calcMaxHp(enemyData.hp || 50); return enemyData?.boss ? Math.floor(base * (TUNING.BOSS_HP_MULT || 1)) : base; })(),
            hp: (() => { const base = calcMaxHp(enemyData.hp || 50); return enemyData?.boss ? Math.floor(base * (TUNING.BOSS_HP_MULT || 1)) : base; })(),
            condition: "normal",
            moves: await enrichMoves((enemyData.moves || []).slice(0, 4)),
            status: null,
            stages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
          };
          enemies.push(enemy);
        }
      }
      setEnemyTeam(enemies);
      setCurrentPartyIndex(0);
      setBattle({ player, enemy: enemies[0], currentTurn: "player", winner: null, bossPhase: false });
      setLog(["Sua vez!", "Batalha iniciada!"]);
    } catch (err) {
      const enemy = {
        id: 1,
        name: "Bulbasaur",
        hp: calcMaxHp(45),
        maxHp: calcMaxHp(45),
        moves: await enrichMoves(["tackle", "vine-whip", "growl", "sleep-powder"]),
        animated:
          "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/25.gif",
        condition: "normal",
        status: null,
        stages: { attack: 0, defense: 0, spAttack: 0, spDefense: 0, speed: 0, accuracy: 0, evasion: 0 },
      };
      const enemies = Array.from({ length: ENEMIES_PER_BATTLE }, () => ({ ...enemy }));
      setEnemyTeam(enemies);
      setBattle({ player, enemy: enemies[0], currentTurn: "player", winner: null, bossPhase: false });
      setLog(["Sua vez!", "Batalha simulada iniciada!"]);
    } finally {
      setLoading(false);
    }
  }

  async function handleMove(move) {
    if (!battle || battle.winner || battle.currentTurn !== "player") return;

    const newBattle = { ...battle };
    const newLog = [...log];

    // Checagem de status do jogador no início do turno (sleep/freeze/paralyze)
    const canPlayerAct = applyStartOfTurnEffects("player", newBattle, newLog);
    if (!canPlayerAct) {
      // Fim do turno do jogador (dano residual etc.)
      applyEndOfTurnEffects("player", newBattle, newLog);

      // Passa a vez para o inimigo
      newBattle.currentTurn = "enemy";
      setBattle(newBattle);
      setLog(newLog);

      setTimeout(async () => {
        const canEnemyAct = applyStartOfTurnEffects("enemy", newBattle, newLog);
        if (canEnemyAct) {
          const enemyMove =
            newBattle.enemy.moves[
            Math.floor(Math.random() * newBattle.enemy.moves.length)
            ];
          setEnemyAnim("attack");
          setTimeout(() => setEnemyAnim(null), 1400);
          if (Math.random() * 100 > (enemyMove.accuracy || 95)) {
            newLog.unshift(
              `${newBattle.enemy.name} errou ${enemyMove.display || enemyMove.name}!`
            );
          } else {
            const { dmg: dmgE, effectiveness: multE } = calcDamage(
              newBattle.enemy,
              newBattle.player,
              enemyMove
            );
            newBattle.player.hp = Math.max(newBattle.player.hp - dmgE, 0);

            setPlayerAnim("damage");
            setTimeout(() => setPlayerAnim(null), 1600);

            let effMsgE = "";
            if (multE === 0) effMsgE = " Não teve efeito.";
            else if (multE > 1.5) effMsgE = " Foi super efetivo!";
            else if (multE < 1) effMsgE = " Não foi muito efetivo.";

            newLog.unshift(
              `${newBattle.enemy.name} usou ${enemyMove.display || enemyMove.name}! Causou ${dmgE} de dano!${effMsgE}`
            );

            // Efeitos de estágios para golpes de status do inimigo
            const isStatusMoveE = (enemyMove?.damage_class || "").toLowerCase() === "status" || (enemyMove?.power ?? 0) <= 0;
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

        // Checagem de derrota do jogador
        if (newBattle.player.hp <= 0) {
          const updatedTeam = team.map((p, idx) =>
            idx === currentIndex ? { ...p, hp: 0, fainted: true } : p
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
            newBattle.winner = "enemy";
            newLog.unshift(`${newBattle.enemy.name} venceu a batalha!`);
          } else {
            let nextPlayer = await buildPlayerFrom(team[nextIdx]);
            // Se esse slot já possuir HP/estado salvo, preserva
            const saved = team[nextIdx];
            if (typeof saved?.hp === 'number' && typeof saved?.maxHp === 'number' && saved.maxHp > 0) {
              nextPlayer.maxHp = saved.maxHp;
              nextPlayer.hp = Math.max(0, Math.min(saved.hp, saved.maxHp));
              nextPlayer.status = saved.status || null;
              nextPlayer.condition = saved.condition || (nextPlayer.status ? nextPlayer.status.type : "normal");
            }
            setCurrentIndex(nextIdx);
            newLog.unshift(`Você enviou ${nextPlayer.name}.`);
            setBattle({
              player: nextPlayer,
              enemy: newBattle.enemy,
              currentTurn: "player",
              winner: null,
            });
            setLog([...newLog]);
            return;
          }
        }

        applyEndOfTurnEffects("enemy", newBattle, newLog);
        newLog.unshift("Sua vez!");
        newBattle.currentTurn = "player";
        setBattle({ ...newBattle });
        setLog([...newLog]);
      }, ATTACK_GAP_MS);
      return;
    }

    // Animação: jogador atacando
    setPlayerAnim("attack");
    setTimeout(() => setPlayerAnim(null), 1400);

    const acc = (move && move.accuracy) || 95;
    if (Math.random() * 100 > acc) {
      newLog.unshift(`${newBattle.player.name} errou ${move.display || move.name}!`);
    } else {
      const { dmg, effectiveness: mult } = calcDamage(
        newBattle.player,
        newBattle.enemy,
        move
      );
      newBattle.enemy.hp = Math.max(newBattle.enemy.hp - dmg, 0);

      // Animação: inimigo levando dano
      setEnemyAnim("damage");
      setTimeout(() => setEnemyAnim(null), 1600);

      let effMsg = "";
      if (mult === 0) effMsg = " Não teve efeito.";
      else if (mult > 1.5) effMsg = " Foi super efetivo!";
      else if (mult < 1) effMsg = " Não foi muito efetivo.";

      newLog.unshift(
        `${newBattle.player.name} usou ${move.display || move.name}! Causou ${dmg} de dano!${effMsg}`
      );

      // Efeitos de estágios para golpes de status do jogador
      const isStatusMoveP = (move?.damage_class || "").toLowerCase() === "status" || (move?.power ?? 0) <= 0;
      if (isStatusMoveP) {
        applyStageMove(newBattle.player, newBattle.enemy, move, newLog);
      }

      // Chance de aplicar status
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

    // Checagem de derrota do inimigo (conta rounds, não pokémons)
    if (newBattle.enemy.hp <= 0) {
      if (!bossPhase) {
        // Se ainda há pokémon no party atual, apenas troca (não avança round)
        if (currentPartyIndex < (enemyTeam.length - 1)) {
          const nextIdx = currentPartyIndex + 1;
          setCurrentPartyIndex(nextIdx);
          const nextEnemy = enemyTeam[nextIdx];
          newLog.unshift(`Oponente enviou ${nextEnemy.name}!`);
          setBattle({ player: newBattle.player, enemy: nextEnemy, currentTurn: "player", winner: null });
          setLog(newLog);
          return;
        }

        // Party acabou -> avança para o próximo oponente (round)
        const defeated = defeatedEnemies + 1;
        setDefeatedEnemies(defeated);
        // Salva progresso e abre Select Team para o próximo inimigo (ou Boss)
        try {
          localStorage.setItem("battleProgressRound", String(defeated));
        } catch (_) {}
        if (defeated >= ENEMIES_PER_BATTLE) {
          window.location.href = "/select-team?nextRound=boss";
        } else {
          const nxt = defeated + 1; // próxima rodada começa no enemy<nxt>
          window.location.href = `/select-team?nextRound=${nxt}`;
        }
        return;
      } else {
        // Boss derrotado => vitória e desbloqueio específico
        newBattle.winner = "player";
        newLog.unshift(`${newBattle.player.name} derrotou o Boss e venceu a batalha!`);
        try {
          const raw = localStorage.getItem("unlockedBosses") || "[]";
          const arr = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
          const id = newBattle.enemy?.id;
          if (id != null && !arr.includes(id)) {
            arr.push(id);
            localStorage.setItem("unlockedBosses", JSON.stringify(arr));
          }
        } catch (e) { }
        setBattle(newBattle);
        setLog(newLog);
        return;
      }
    }

    // Dano residual do jogador (fim do turno)
    applyEndOfTurnEffects("player", newBattle, newLog);

    // Vez do inimigo
    newBattle.currentTurn = "enemy";
    setBattle(newBattle);
    setLog(newLog);

    setTimeout(async () => {
      const canEnemyAct = applyStartOfTurnEffects("enemy", newBattle, newLog);
      if (canEnemyAct) {
        const enemyMove =
          newBattle.enemy.moves[
          Math.floor(Math.random() * newBattle.enemy.moves.length)
          ];
        // Animação: inimigo tentando atacar
        setEnemyAnim("attack");
        setTimeout(() => setEnemyAnim(null), 1400);
        if (Math.random() * 100 > (enemyMove.accuracy || 95)) {
          newLog.unshift(
            `${newBattle.enemy.name} errou ${enemyMove.display || enemyMove.name}!`
          );
        } else {
          const { dmg: dmgE, effectiveness: multE } = calcDamage(
            newBattle.enemy,
            newBattle.player,
            enemyMove
          );
          newBattle.player.hp = Math.max(newBattle.player.hp - dmgE, 0);

          // Animação: jogador levando dano
          setPlayerAnim("damage");
          setTimeout(() => setPlayerAnim(null), 1600);

          let effMsgE = "";
          if (multE === 0) effMsgE = " Não teve efeito.";
          else if (multE > 1.5) effMsgE = " Foi super efetivo!";
          else if (multE < 1) effMsgE = " Não foi muito efetivo.";

          newLog.unshift(
            `${newBattle.enemy.name} usou ${enemyMove.display || enemyMove.name}! Causou ${dmgE} de dano!${effMsgE}`
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

      // Checagem de derrota do jogador
      if (newBattle.player.hp <= 0) {
        // Marca o Pokémon atual como derrotado
        const updatedTeam = team.map((p, idx) =>
          idx === currentIndex ? { ...p, hp: 0, fainted: true } : p
        );
        setTeam(updatedTeam);

        // Encontra o próximo Pokémon vivo
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
          newBattle.winner = "enemy";
          newLog.unshift(`${newBattle.enemy.name} venceu a batalha!`);
        } else {
          let nextPlayer = await buildPlayerFrom(team[nextIdx]);
          const saved = team[nextIdx];
          if (typeof saved?.hp === 'number' && typeof saved?.maxHp === 'number' && saved.maxHp > 0) {
            nextPlayer.maxHp = saved.maxHp;
            nextPlayer.hp = Math.max(0, Math.min(saved.hp, saved.maxHp));
            nextPlayer.status = saved.status || null;
            nextPlayer.condition = saved.condition || (nextPlayer.status ? nextPlayer.status.type : "normal");
          }
          setCurrentIndex(nextIdx);
          newLog.unshift(`Você enviou ${nextPlayer.name}.`);
          setBattle({
            player: nextPlayer,
            enemy: newBattle.enemy,
            currentTurn: "player",
            winner: null,
          });
          setLog([...newLog]);
          return;
        }
      }

      applyEndOfTurnEffects("enemy", newBattle, newLog);
      // anunciar volta do jogador
      newLog.unshift("Sua vez!");
      newBattle.currentTurn = "player";
      setBattle({ ...newBattle });
      setLog([...newLog]);
    }, ATTACK_GAP_MS);
  }

  async function handleSwitch(index) {
    if (index === currentIndex || !team[index]) return;

    const target = team[index];

    // ? Impede troca para Pokémon derrotado
    if (target.hp <= 0 || target.fainted) {
      setLog((prev) => [`${target.name} não pode lutar!`, ...prev]);
      return;
    }

    // Persiste estado do atual no array do time antes de sair
    try {
      setTeam((prev) => {
        const list = Array.isArray(prev) ? [...prev] : [];
        if (list[currentIndex] && battle?.player) {
          list[currentIndex] = {
            ...list[currentIndex],
            hp: battle.player.hp,
            maxHp: battle.player.maxHp,
            status: battle.player.status || null,
            condition: battle.player.condition || "normal",
          };
        }
        return list;
      });
    } catch (_) {}

    // Troca válida
    setCurrentIndex(index);
    let nextPlayer = await buildPlayerFrom(target);
    if (typeof target?.hp === 'number' && typeof target?.maxHp === 'number' && target.maxHp > 0) {
      nextPlayer.maxHp = target.maxHp;
      nextPlayer.hp = Math.max(0, Math.min(target.hp, target.maxHp));
      nextPlayer.status = target.status || null;
      nextPlayer.condition = target.condition || (nextPlayer.status ? nextPlayer.status.type : "normal");
    }
    setBattle((prev) => ({ ...prev, player: nextPlayer }));
    setLog((prev) => [`Você trocou para ${target.name}`, ...prev]);
  }


  if (loading && !battle) return <p>Carregando batalha...</p>;
  if (error)
    return (
      <div className="container" style={{ padding: 20 }}>
        <p>{error}</p>
        <ConfirmButton onClick={() => startBattle(team[currentIndex])}>
          Tentar novamente
        </ConfirmButton>
      </div>
    );
  if (!battle) return null;

  const { player, enemy, winner, currentTurn } = battle;
  const getScale = (mon) => {
    const h = (mon?.height ?? 10) / 10; // m
    const wkg = (mon?.weight ?? 100) / 10; // kg
    const raw = 0.6 * h + 0.4 * Math.sqrt(Math.max(10, wkg) / 30) + 0.2; // mix height + weight
    return Math.max(0.65, Math.min(1.6, raw));
  };
  const pScale = getScale(player);
  const eScale = getScale(enemy);
  const playerTrainerSrc = `/images/trainer${playerTrainerId}pixel.png`;
  const enemyTrainerSrc = bossPhase ? "/images/gary.png" : `/images/enemy${Math.min(defeatedEnemies + 1, ENEMIES_PER_BATTLE)}.png`;

  

  const activeRound = bossPhase ? 'boss' : Math.min(defeatedEnemies + 1, ENEMIES_PER_BATTLE);
  const arenaBg = (
    activeRound === 'boss' ? '/arenaBoss.png'
    : activeRound === 1 ? '/arenaFighter.png'
    : activeRound === 2 ? '/arenaIce.png'
    : activeRound === 3 ? '/arenaShadow.png'
    : activeRound === 4 ? '/arenaDragon.png'
    : '/arena.png'
  );

  const containerStyle = bossPhase
    ? {
        backgroundImage: `url(${arenaBg})`,
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        // Flatten vertically a bit to avoid overflow while covering width
        backgroundSize: '100% 100%',
        backgroundAttachment: 'fixed',
        backgroundColor: '#000',
      }
    : { backgroundImage: `url(${arenaBg})` };

  return (
    <div className={styles.battleContainer} style={containerStyle}>
      <div className={styles.arena}>
        {/* Indicador de progresso das batalhas (4 normais + Boss) */}
        <div className={styles.battleProgress}>
          <div className={styles.progressDots}>
            {Array.from({ length: ENEMIES_PER_BATTLE }).map((_, i) => {
              const done = i < defeatedEnemies;
              const active = i === defeatedEnemies && !bossPhase && !winner;
              return (
                <span
                  key={`dot-${i}`}
                  className={`${styles.progDot} ${done ? styles.progDotDone : ""} ${active ? styles.progDotActive : ""}`.trim()}
                />
              );
            })}
            <span
              className={`${styles.progBoss} ${bossPhase && !winner ? styles.progBossActive : ""} ${winner === "player" && bossPhase ? styles.progBossDone : ""}`.trim()}
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
        {/* Inimigo */}
        {/* Treinadores (posicionados nas laterais da arena) */}
        <div className={`${styles.trainers} ${bossPhase ? styles.trainersBoss : ""}`}>
          <img
            src={enemyTrainerSrc}
            alt="Treinador Inimigo"
            className={styles.trainerPlayer}
          />
          <img
            src={playerTrainerSrc}
            alt="Treinador Jogador"
            className={styles.trainerEnemy}
          />
        </div>

        <div className={styles.enemySection}>
          <div className={styles.switchRow}>
            {(enemyTeam || []).map((_, i) => {
              const defeated = i < (currentPartyIndex || 0);
              const active = i === (currentPartyIndex || 0);
              return (
                <div
                  key={`enemy-ball-${i}`}
                  className={`${styles.ballBtn} ${active ? styles.ballActive : ""} ${defeated ? styles.ballDefeated : ""}`}
                  style={{ cursor: "default" }}
                >
                  <img src="/sprites/pokeballs/poke-ball.png" alt="PokAbola adversArio" />
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
              ["--atkDist"]: `${Math.max(30, Math.min(90, 36 * eScale)).toFixed(0)}px`,
              ["--shakeDist"]: `${Math.max(3, Math.min(10, 5 * eScale)).toFixed(0)}px`,
            }}
          >
            <div className={`${styles.spriteBox} ${bossPhase ? styles.bossSprites : ""}`}>
              <div
                className={styles.spriteScale}
                style={{
                  ["--pokeScale"]: `${eScale}` ,
                  ["--groundScale"]: `${eScale}` ,
                }}
              >
                <img
                  src={enemy.animated}
                  alt={enemy.name}
                  className={`${styles.sprite} ${enemyAnim === "attack" ? styles.attackEnemy : ""} ${enemyAnim === "damage" ? styles.damageAnim : ""}`}
                  style={{
                    ["--shakeDist"]: `${Math.max(3, Math.min(10, 5 * eScale)).toFixed(0)}px`,
                  }}
                />
              </div>
              <div className={styles.ground}></div>
            </div>
          </div>
        </div>
        {/* Jogador */}
        <div className={styles.playerSection}>
          {/* Linha de troca com pokébolas (acima do HP) */}
          <div
            className={styles.switchRow}
            onMouseLeave={() => setHoveredBall(-1)}
          >
            {team.map((p, idx) => {
              const isDead = p.hp <= 0 || p.fainted;
              return (
                <button
                  key={idx}
                  className={`${styles.ballBtn} 
        ${idx === currentIndex ? styles.ballActive : ""} 
        ${isDead ? styles.ballDefeated : ""}`}
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
                  <img
                    src="/sprites/pokeballs/poke-ball.png"
                    alt="Pokébola"
                  />
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
          <div className={`${styles.spriteBox} ${bossPhase ? styles.bossSprites : ""}`}>
            <div
              className={styles.spriteScale}
              style={{
                ["--pokeScale"]: `${pScale}`,
                ["--groundScale"]: `${pScale}`,
              }}
            >
              <img
                src={player.animated}
                alt={player.name}
                className={`${styles.sprite} ${playerAnim === "attack" ? styles.attackPlayer : ""
                  } ${playerAnim === "damage" ? styles.damageAnim : ""}`}
                style={{
                  ["--atkDist"]: `${Math.max(30, Math.min(90, 36 * pScale)).toFixed(0)}px`,
                  ["--shakeDist"]: `${Math.max(3, Math.min(10, 5 * pScale)).toFixed(0)}px`,
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
                {showMoves ? "Fechar ataques" : "Atacar"}
              </button>
              {showMoves && (
                <div className={styles.attackMenu}>
                  {player.moves.map((mv, idx) => {
                    const item =
                      typeof mv === "string"
                        ? {
                          name: mv,
                          display: cap(mv),
                          power: 40,
                          accuracy: 95,
                          type: "normal",
                          effects: [],
                        }
                        : mv;
                    const mult = typeMultiplier(
                      item.type || "normal",
                      enemy.types || []
                    );
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
                        ? "Efeito Normal"
                        : mult === 0
                          ? "Sem efeito"
                          : mult > 1
                            ? "Super efetivo"
                            : "Não muito efetivo";
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
                          <span className={`${styles.typeBadge} ${styles[item.type] || ""}`}>
                            {typeLabel(item.type || "normal")}
                          </span>
                        </div>
                        <span className={styles.moveStats}>
                          Poder {item.power} Precisão {item.accuracy}%
                        </span>
                        <div className={styles.moveMeta}>
                          <span className={`${styles.moveMult} ${multClass}`}>
                            {multLabel}
                          </span>
                          {item.effects && item.effects.length > 0 && (
                            <span className={styles.moveEffects}>
                              {item.effects
                                .map((e) => `${e.type} ${e.chance}%`)
                                .join(" ")}
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

          {winner === "enemy" && (
            <div className={styles.defeatOverlay}>
              <div className={styles.defeatBox}>
                <h2>Derrota</h2>
                <p>Você perdeu a batalha! O que deseja fazer agora?</p>
                <div className={styles.optionButtons}>
                  <ConfirmButton onClick={() => startBattle(team[currentIndex])}>
                    Tentar Novamente
                  </ConfirmButton>
                  <ConfirmButton onClick={() => { try { localStorage.setItem("battleProgressRound", "0"); } catch (_) {} window.location.href = "/select-pokemon"; }}>
                    Voltar a tela de escolha
                  </ConfirmButton>
                </div>
              </div>
            </div>
          )}

          {winner && (
            <div className={styles.winner}>
              <h3>{winner === "player" ? "Você venceu!" : "Você perdeu!"}</h3>
            </div>
          )}
          {winner === "player" && (
            <div className={styles.victoryOverlay}>
              <div className={styles.victoryBox}>
                <h2>?? Vitória! ??</h2>
                <p>Você venceu a batalha! O que deseja fazer agora?</p>
                <div className={styles.optionButtons}>
                  <ConfirmButton onClick={() => { try { localStorage.setItem("battleProgressRound", "0"); } catch (_) {} window.location.href = "/select-pokemon"; }}>
                    Voltar à tela de escolha
                  </ConfirmButton>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Menu de ataque no canto direito */}
      {!winner && currentTurn === "player" && (
        <div className={styles.attackSidebar}>
          <AttackMenu
            moves={player.moves.map((mv) =>
              typeof mv === "string"
                ? {
                  name: mv,
                  display: cap(mv),
                  power: 40,
                  accuracy: 95,
                  type: "normal",
                  damage_class: "physical",
                  effects: [],
                }
                : mv
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
        className={`${styles.battleLogBottom} ${!logExpanded ? styles.collapsed : ""}`}
        role="button"
        tabIndex={0}
        onClick={() => setLogExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setLogExpanded((v) => !v);
        }}
        title={logExpanded ? "Ocultar histórico" : "Mostrar histórico"}
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





