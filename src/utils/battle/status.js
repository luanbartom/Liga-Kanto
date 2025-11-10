// Status helpers: application, decay and stage modifiers
import { STAGE_MOVES } from '@/utils/moves';

export const STATUS_DURATIONS = { asleep: [2, 3], frozen: [2, 3] };

const randIn = (range) => Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];

export function setStatus(target, type, logs) {
  if (!type || type === 'normal') return;
  if (target.condition && target.condition !== 'normal') return;
  target.condition = type;
  if (STATUS_DURATIONS[type]) target.status = { type, turns: randIn(STATUS_DURATIONS[type]) };
  else target.status = { type, turns: -1 };
  const labels = {
    asleep: 'adormeceu',
    frozen: 'foi congelado',
    burned: 'foi queimado',
    poisoned: 'foi envenenado',
    paralyzed: 'ficou paralisado',
  };
  logs?.unshift(`${target.name} ${labels[type] || 'sofreu um status'}.`);
}

export function clearStatus(target, logs, msg) {
  target.condition = 'normal';
  target.status = null;
  if (msg) logs?.unshift(msg);
}

export function modifyStage(target, stat, delta, logs) {
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
    'attack',
    'defense',
    'spAttack',
    'spDefense',
    'speed',
    'accuracy',
    'evasion',
  ]);
  const key = valid.has(stat) ? stat : 'attack';
  const before = target.stages[key] || 0;
  const after = Math.max(-6, Math.min(6, before + delta));
  target.stages[key] = after;
  const labels = {
    attack: 'Ataque',
    defense: 'Defesa',
    spAttack: 'Ataque Esp.',
    spDefense: 'Defesa Esp.',
    speed: 'Velocidade',
    accuracy: 'Precisão',
    evasion: 'Evasão',
  };
  const changeLabel = delta < 0 ? 'caiu' : 'aumentou';
  if (after !== before)
    logs?.unshift(`${target.name} teve o ${labels[key] || key} ${changeLabel}!`);
}

export function applyStageMove(user, target, move, logs) {
  const n = (move?.name || move?.id || '').toString().toLowerCase();
  const defs = STAGE_MOVES[n];
  if (!defs) return;
  for (const eff of defs) {
    const tgt = eff.target === 'self' ? user : target;
    modifyStage(tgt, eff.stat, eff.delta, logs);
  }
}

export function applyStartOfTurnEffects(which, state, logs) {
  const actor = which === 'player' ? state.player : state.enemy;
  if (!actor.status) return true;
  const { type } = actor.status;

  if (type === 'asleep' || type === 'frozen') {
    actor.status.turns -= 1;
    if (actor.status.turns > 0) {
      const label = type === 'asleep' ? 'dormindo' : 'congelado';
      logs.unshift(`${actor.name} está ${label} e não pode agir!`);
      return false;
    } else {
      const endMsg = type === 'asleep' ? `${actor.name} acordou!` : `${actor.name} descongelou!`;
      clearStatus(actor, logs, endMsg);
      return true;
    }
  }

  if (type === 'paralyzed') {
    if (Math.random() < 0.25) {
      logs.unshift(`${actor.name} está paralisado e não se moveu!`);
      return false;
    }
  }
  return true;
}

export function applyEndOfTurnEffects(which, state, logs) {
  const actor = which === 'player' ? state.player : state.enemy;
  if (!actor.status) return;
  const { type } = actor.status;
  if (type === 'burned' || type === 'poisoned') {
    const tick = Math.max(1, Math.floor(5 + Math.random() * 5));
    actor.hp = Math.max(0, actor.hp - tick);
    const label = type === 'burned' ? 'queimado' : 'envenenado';
    logs.unshift(`${actor.name} sofreu ${tick} de dano (${label}).`);
  }
}
