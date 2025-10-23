// Simple i18n helpers for pt-BR display labels

const TYPE_PT = {
  "normal": "Normal",
  "fire": "Fogo",
  "water": "Água",
  "grass": "Planta",
  "electric": "Elétrico",
  "ice": "Gelo",
  "fighting": "Lutador",
  "poison": "Venenoso",
  "ground": "Terra",
  "flying": "Voador",
  "psychic": "Psíquico",
  "bug": "Inseto",
  "rock": "Pedra",
  "ghost": "Fantasma",
  "dragon": "Dragão",
  "dark": "Sombrio",
  "steel": "Aço",
  "fairy": "Fada",
};

const STATUS_PT = {
  "asleep": "Adormecido",
  "frozen": "Congelado",
  "burned": "Queimado",
  "poisoned": "Envenenado",
  "paralyzed": "Paralisado",
  "confused": "Confuso",
};

// Common Gen 1/classic moves mapping (extend as needed)
const MOVE_PT = {
  "razor-leaf": "Folha Navalha",
  "vine-whip": "Chicote de Vinha",
  "sleep-powder": "Pó do Sono",
  "solar-beam": "Raio Solar",
  "leech-seed": "Semente Sanguessuga",
  "mega-punch": "Mega Soco",
  "mega-kick": "Mega Chute",
  "fire-punch": "Soco de Fogo",
  "thunder-punch": "Soco Trovoada",
  "scratch": "Arranhão",
  "tackle": "Investida",
  "growl": "Rosnado",
  "thunder-shock": "Choque do Trovão",
  "ember": "Brasa",
  "ice-beam": "Raio de Gelo",
  "poison-sting": "Ferroada Venenosa",
  "gust": "Rajada de Vento",
  "wing-attack": "Ataque de Asa",
  "hydro-pump": "Hidro Bomba",
  "surf": "Surf",
  "water-gun": "Jato d'Água",
  "bubble-beam": "Raio de Bolhas",
  "bubble": "Bolha",
  "body-slam": "Pancada Corporal",
  "headbutt": "Cabeçada",
  "bind": "Prender",
  "cut": "Corte",
  "string-shot": "Fio de Seda",
  "harden": "Endurecer",
  "iron-defense": "Defesa de Ferro",
  "bug-bite": "Mordida de Inseto",
  "snore": "Ronco",
  "vine-whip": "Chicote de Vinha",
};

function titleCase(str = "") {
  return String(str)
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function typeLabel(type) {
  return TYPE_PT[type] || titleCase(type || "");
}

export function statusLabel(status) {
  return STATUS_PT[status] || titleCase(status || "");
}

export function moveLabel(name) {
  if (!name) return "";
  const key = String(name).toLowerCase();
  if (MOVE_PT[key]) return MOVE_PT[key];
  // fallback: replace hyphens and title-case
  return titleCase(key.replace(/-/g, " "));
}

export default { typeLabel, statusLabel, moveLabel };

