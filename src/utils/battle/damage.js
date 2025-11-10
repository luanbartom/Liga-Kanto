import { TUNING as DEFAULT_TUNING } from '@/constants';
import { typeMultiplier } from './typeChart';

// Main damage calculation
export function calcDamage(attacker, defender, move, tuning = DEFAULT_TUNING) {
  const attackerIsBoss = !!(attacker && attacker.boss);
  const defenderIsBoss = !!(defender && defender.boss);
  const attackerIsPlayer = !!(attacker && attacker.isPlayer);
  const defenderIsPlayer = !!(defender && defender.isPlayer);
  const level = attackerIsBoss
    ? attackerIsPlayer
      ? tuning.PLAYER_BOSS_LEVEL || tuning.LEVEL
      : tuning.BOSS_LEVEL || tuning.LEVEL
    : tuning.LEVEL;

  const isStatusMove =
    (move?.damage_class || '').toLowerCase() === 'status' || (move?.power ?? 0) <= 0;
  if (isStatusMove) return { dmg: 0, effectiveness: 1 };

  const stageMult = (s = 0) => {
    const n = Math.max(-6, Math.min(6, s));
    if (n >= 0) return (2 + n) / 2;
    return 2 / (2 - n);
  };

  const isSpecial = (move?.damage_class || '').toLowerCase() === 'special';
  const baseAtk = isSpecial
    ? (attacker?.special_attack ?? attacker?.spAttack ?? attacker?.sp_atk ?? attacker?.attack ?? 50)
    : (attacker?.attack ?? 50);
  const baseDef = isSpecial
    ? (defender?.special_defense ??
      defender?.spDefense ??
      defender?.sp_def ??
      defender?.defense ??
      50)
    : (defender?.defense ?? 50);

  const atkStage = isSpecial
    ? (attacker?.stages?.spAttack ?? attacker?.stages?.attack ?? 0)
    : (attacker?.stages?.attack ?? 0);
  const defStage = isSpecial
    ? (defender?.stages?.spDefense ?? defender?.stages?.defense ?? 0)
    : (defender?.stages?.defense ?? 0);

  let atk = baseAtk * stageMult(atkStage);
  if (attackerIsPlayer) atk *= tuning.PLAYER_ATK_MULT || 1;
  else if (!attackerIsBoss) atk *= tuning.ENEMY_ATK_MULT || 1;

  let def = baseDef * stageMult(defStage);
  // Boss multipliers only when Boss is the opponent
  if (attackerIsBoss && !attackerIsPlayer) atk *= tuning.BOSS_ATK_MULT || 1;
  if (defenderIsBoss && !defenderIsPlayer) def *= tuning.BOSS_DEF_MULT || 1;

  const power = Math.max(1, move?.power ?? 40);
  const stab = move?.type && (attacker?.types || []).includes(move.type) ? tuning.STAB : 1;
  const effectiveness = typeMultiplier(move?.type || 'normal', defender?.types || [], tuning);
  const rand = tuning.RAND_MIN + Math.random() * (tuning.RAND_MAX - tuning.RAND_MIN);
  const base = (((2 * level) / 5 + 2) * power * (atk / Math.max(1, def))) / 50 + 2;
  const crit = Math.random() < tuning.CRIT_RATE ? tuning.CRIT_MULT : 1;
  const dmg = Math.max(1, Math.floor(base * stab * effectiveness * rand * crit));
  return { dmg, effectiveness };
}

// Vanilla-like max HP with project tuning
export function calcMaxHp(baseHp, level = DEFAULT_TUNING.LEVEL, tuning = DEFAULT_TUNING) {
  const iv = 15; // baseline IV
  const ev = 0; // no EVs
  const vanilla = Math.max(
    1,
    Math.floor(((2 * baseHp + iv + Math.floor(ev / 4)) * level) / 100) + level + 10,
  );
  return Math.max(1, Math.floor(vanilla * tuning.HP_SCALE));
}

export default { calcDamage, calcMaxHp };
