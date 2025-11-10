// Centralized app constants

// Select Pokemon
export const MAX_SEARCH_LEN = 20;

// Trainer name (Home page)
export const MAX_TRAINER_NAME_LEN = 12;

// Battle flow
export const ENEMIES_PER_BATTLE = 4; // number of regular enemies before Boss
export const ATTACK_GAP_MS = 3200; // ms between attack turns

// Battle tuning
export const TUNING = {
  LEVEL: 50,
  HP_SCALE: 5,
  STAB: 1.85,
  CRIT_RATE: 0.5,
  CRIT_MULT: 2.5,
  RAND_MIN: 0.1,
  RAND_MAX: 0.3,
  CAP_SUPER: 2.8,
  FLOOR_RESIST: 0.9,
  HONOR_IMMUNITIES: true,
  // Balance nudges
  PLAYER_ATK_MULT: 2.9,
  ENEMY_ATK_MULT: 2.9,
  // Boss tuning
  BOSS_LEVEL: 100,
  PLAYER_BOSS_LEVEL: 60,
  BOSS_ATK_MULT: 3.4,
  BOSS_DEF_MULT: 1.85,
  BOSS_HP_MULT: 1.95,
};
