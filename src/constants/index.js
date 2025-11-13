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
  // Nível padrão dos pokémon durante a batalha.
  // É um valor base para calcular status como HP, ataque, defesa etc.
  // Mantém todo mundo no mesmo “poder básico”.
  // Evita desequilíbrio entre pokémon de níveis diferentes.
  HP_SCALE: 5,
  // Multiplica o HP final para deixar a luta mais longa ou mais curta.
  // 5 = HP 5x maior do que o cálculo padrão.
  // Se tu quiser batalhas mais rápidas: diminui.
  // Se quiser batalhas tipo “Stall”, aumenta.

  STAB: 1.6,
  // STAB = Same Type Attack Bonus.
  // Quando um pokémon usa um golpe do mesmo tipo que ele, o dano aumenta por esse multiplicador.
  // Normal no Pokémon é 1.5.
  // Tu botou 1.6 → mais impactante sem virar loucura.
  CRIT_RATE: 0.2,
  // Chance de crítico.
  // 0.2 = 20% de chance.
  // Ou seja, 1 em cada 5 golpes.
  // Pokémon original gira em torno de 6,25%.
  // Aqui tá mais ofensivo, deixando o jogo mais dinâmico.
  CRIT_MULT: 2.0,
  // Quanto o crítico multiplica o dano.
  // Com crítico → dano × 2.0
  // Mantém crítico forte, mas sem virar absurdo.
  RAND_MIN: 0.90,
  // Mínimo da variação aleatória do dano.
  // Golpes nunca dão menos que 90% do dano base.
  // Evita aquele dano “ridículo” que frustra o jogador.
  RAND_MAX: 1.15,
  // Máximo da variação aleatória.
  // Golpes podem dar até 115% do dano base.
  // Deixa aquela sensação boa de “UHHH veio um dano alto!”.
  // Sem virar loteria exagerada.
  CAP_SUPER: 1.9,
  // Multiplicador de golpe super eficaz.
  // Golpe superefetivo → × 2.5
  // No Pokémon normal é × 2.0.
  // Aqui ficou um pouco mais agressivo:
  // “É super efetivo!” realmente bate forte.
  FLOOR_RESIST: 0.5,
  // Multiplicador quando o golpe é pouco efetivo.
  // Resistido → × 0.6
  // Um golpe pouco efetivo reduz para 60% do dano.
  // Evita ficar inútil demais (no Pokémon original vai até 0.25).
  HONOR_IMMUNITIES: true,
  // Se o tipo é imune, o golpe não bate nunca.
  // Normal vs Ghost? 0 de dano.
  // Elétrico vs Ground? 0 de dano.
  // Mantem a lógica canônica.

  PLAYER_ATK_MULT: 1.3,
  // Bônus geral de ataque do jogador.
  // Todos os golpes do player são 30% mais fortes.
  // Isso dá aquela sensação de protagonismo.
  ENEMY_ATK_MULT: 1.2,
  // Bônus geral do ataque dos inimigos comuns.
  // Eles batem 20% mais forte.
  // Mantém o jogo desafiador, mas não injusto.
  BOSS_LEVEL: 90,
  // Nível base dos chefes.
  // Eles entram mais fortes que os pokémon normais.
  // Aumenta bastante ataque, defesa e HP.
  PLAYER_BOSS_LEVEL: 60,
  // Nível que o player usa contra boss.
  // Aumenta a curva de poder do player quando chega num boss.
  // Deixa a luta épica sem ser impossível.
  BOSS_ATK_MULT: 1.2,
  // Chefes batem 50% mais forte.
  // Para realmente parecer boss.
  // Mas sem virar golpe one-shot obrigatório.

  BOSS_DEF_MULT: 1.3,
  // Chefe recebe menos dano (defesa maior).
  // 30% a mais de resistência.
  // O jogador sente que precisa de estratégia.

  BOSS_HP_MULT: 2.0,
  // HP do chefe é o dobro.
  // Garante lutas mais longas e climáticas.
  // Não morre em 2 tapas igual aos inimigos normais.
};