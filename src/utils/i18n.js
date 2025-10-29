// ========================================================
// i18n helpers (pt-BR)
// ========================================================

// ---------- TIPOS ----------
const TYPE_PT = {
  normal: "Normal",
  fire: "Fogo",
  water: "Água",
  grass: "Planta",
  electric: "Elétrico",
  ice: "Gelo",
  fighting: "Lutador",
  poison: "Venenoso",
  ground: "Terra",
  flying: "Voador",
  psychic: "Psíquico",
  bug: "Inseto",
  rock: "Pedra",
  ghost: "Fantasma",
  dragon: "Dragão",
  dark: "Sombrio",
  steel: "Aço",
  fairy: "Fada",
};

// ---------- STATUS ----------
const STATUS_PT = {
  asleep: "Adormecido",
  frozen: "Congelado",
  burned: "Queimado",
  poisoned: "Envenenado",
  paralyzed: "Paralisado",
  confused: "Confuso",
};

// ---------- GOLPES (subset grande; pode expandir à vontade) ----------
const MOVE_PT = {
  "absorb": "Absorver",
  "acid": "Ácido",
  "aerial-ace": "Ataque Aéreo",
  "agility": "Agilidade",
  "amnesia": "Amnésia",
  "ancient-power": "Poder Antigo",
  "arm-thrust": "Empurrão de Braço",
  "assist": "Auxílio",
  "astonish": "Assustar",
  "attract": "Atrair",
  "aurora-beam": "Raio Aurora",
  "barrage": "Bombardeio",
  "barrier": "Barreira",
  "baton-pass": "Passagem de Bastão",
  "bite": "Mordida",
  "blizzard": "Nevasca",
  "body-slam": "Pancada Corporal",
  "bone-club": "Clava de Osso",
  "bonemerang": "Bumerangue de Osso",
  "bubble": "Bolha",
  "bubble-beam": "Raio de Bolhas",
  "calm-mind": "Mente Calma",
  "charge": "Carga",
  "clamp": "Aperto",
  "comet-punch": "Soco Meteórico",
  "confuse-ray": "Raio Confuso",
  "confusion": "Confusão",
  "constrict": "Constrição",
  "conversion": "Conversão",
  "counter": "Contra-ataque",
  "crabhammer": "Martelo Caranguejo",
  "cross-chop": "Corte Cruzado",
  "crunch": "Mordida Feroz",
  "cut": "Corte",
  "defense-curl": "Enrolar-se",
  "dig": "Cavar",
  "disable": "Desativar",
  "dizzy-punch": "Soco Giratório",
  "double-edge": "Investida Dupla",
  "double-kick": "Chute Duplo",
  "double-slap": "Tapa Duplo",
  "dragon-breath": "Sopro do Dragão",
  "dragon-claw": "Garra do Dragão",
  "dragon-rage": "Fúria do Dragão",
  "dream-eater": "Devorador de Sonhos",
  "drill-peck": "Bicada Perfurante",
  "earthquake": "Terremoto",
  "egg-bomb": "Bomba de Ovo",
  "ember": "Brasa",
  "explosion": "Explosão",
  "extreme-speed": "Velocidade Extrema",
  "fire-blast": "Explosão de Fogo",
  "fire-punch": "Soco de Fogo",
  "flamethrower": "Lança-chamas",
  "flash": "Clarão",
  "fly": "Voar",
  "focus-energy": "Concentrar Energia",
  "fury-attack": "Ataque de Fúria",
  "fury-cutter": "Corte de Fúria",
  "fury-swipes": "Arranhões Furiosos",
  "giga-drain": "Mega Dreno",
  "gust": "Rajada de Vento",
  "harden": "Endurecer",
  "headbutt": "Cabeçada",
  "heal-bell": "Sino da Cura",
  "high-jump-kick": "Chute de Alta Altura",
  "horn-attack": "Ataque de Chifre",
  "horn-drill": "Broca de Chifre",
  "hydro-pump": "Hidro Bomba",
  "hyper-beam": "Hiper-raio",
  "hyper-fang": "Presas Hipersônicas",
  "hypnosis": "Hipnose",
  "ice-beam": "Raio de Gelo",
  "ice-punch": "Soco de Gelo",
  "icy-wind": "Vento Gélido",
  "iron-defense": "Defesa de Ferro",
  "iron-tail": "Cauda de Ferro",
  "karate-chop": "Golpe de Karatê",
  "leech-life": "Dreno Vital",
  "leech-seed": "Semente Sanguessuga",
  "lick": "Lambida",
  "light-screen": "Tela de Luz",
  "low-kick": "Chute Baixo",
  "mach-punch": "Soco Rápido",
  "mega-drain": "Mega Dreno",
  "mega-kick": "Mega Chute",
  "mega-punch": "Mega Soco",
  "metronome": "Metrônomo",
  "mud-slap": "Lama na Cara",
  "night-shade": "Sombra Noturna",
  "peck": "Bicada",
  "poison-sting": "Ferroada Venenosa",
  "pound": "Pancada",
  "psybeam": "Raio Psíquico",
  "psychic": "Psíquico",
  "quick-attack": "Ataque Rápido",
  "rage": "Raiva",
  "razor-leaf": "Folha Navalha",
  "razor-wind": "Vento Cortante",
  "recover": "Recuperar",
  "reflect": "Refletir",
  "rest": "Descansar",
  "roar": "Rugido",
  "rock-slide": "Deslize de Rocha",
  "rock-throw": "Lançamento de Pedra",
  "sand-attack": "Ataque de Areia",
  "scratch": "Arranhão",
  "screech": "Grito",
  "seismic-toss": "Arremesso Sísmico",
  "self-destruct": "Autodestruição",
  "sing": "Cantar",
  "skull-bash": "Cabeçada Poderosa",
  "sky-attack": "Ataque Aéreo Supremo",
  "slam": "Pancada",
  "sleep-powder": "Pó do Sono",
  "sludge": "Lodo",
  "sludge-bomb": "Bomba de Lodo",
  "smog": "Fumaça",
  "smokescreen": "Cortina de Fumaça",
  "solar-beam": "Raio Solar",
  "sonic-boom": "Explosão Sônica",
  "spark": "Faísca",
  "spike-cannon": "Canhão de Espinhos",
  "splash": "Borrifada",
  "strength": "Força",
  "string-shot": "Fio de Seda",
  "stun-spore": "Esporos Paralizantes",
  "submission": "Submissão",
  "substitute": "Substituto",
  "super-fang": "Presas Superiores",
  "surf": "Surf",
  "swift": "Rápido",
  "swords-dance": "Dança das Espadas",
  "tackle": "Investida",
  "tail-whip": "Chicote de Cauda",
  "take-down": "Derrubar",
  "teleport": "Teleporte",
  "thunder": "Trovão",
  "thunder-shock": "Choque do Trovão",
  "thunder-wave": "Onda de Trovão",
  "thunderbolt": "Raio Trovejante",
  "toxic": "Tóxico",
  "transform": "Transformar",
  "vine-whip": "Chicote de Vinha",
  "water-gun": "Jato d'Água",
  "water-pulse": "Pulso de Água",
  "whirlwind": "Redemoinho",
  "wing-attack": "Ataque de Asa",
  "wrap": "Enroscar",
  "x-scissor": "Tesoura X",
  "growl": "Rosnado",
  "leer": "Encarar",
  "slash": "Corte",
};

// ========================================================
// Funções auxiliares
// ========================================================
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

function translateMove(raw = "") {
  const key = String(raw).toLowerCase();
  if (MOVE_PT[key]) return MOVE_PT[key];
  return titleCase(key.replace(/-/g, " "));
}

// ========================================================
// Resolvedor robusto de nome de golpe (evita [Object Object])
// ========================================================
function resolveRawMoveName(move) {
  if (!move) return "";
  if (typeof move === "string") return move;

  // candidatos mais comuns
  const candidates = [
    move.display,
    move.name,
    move.move,
    move.id,
    move.key,
  ];

  for (const c of candidates) {
    if (!c) continue;

    if (typeof c === "string") return c;

    if (typeof c === "object") {
      // formatos { pt, en } | { "pt-BR", en } | { default }
      if (typeof c.pt === "string") return c.pt;
      if (typeof c["pt-BR"] === "string") return c["pt-BR"];
      if (typeof c.br === "string") return c.br;
      if (typeof c.en === "string") return c.en;
      if (typeof c.default === "string") return c.default;

      // arrays (pega primeira string)
      if (Array.isArray(c)) {
        const first = c.find((x) => typeof x === "string");
        if (first) return first;
      }
    }
  }

  // formatos alternativos: names: {pt, en}, locale: {pt, en}
  const alt = move.names || move.locale;
  if (alt && typeof alt === "object") {
    return alt.pt || alt["pt-BR"] || alt.br || alt.en || alt.default || "";
  }

  return "";
}

// ========================================================
// Formatadores de golpe
// ========================================================
export function moveLabel(move) {
  const raw = resolveRawMoveName(move);
  if (!raw) return "";

  const name = translateMove(raw);
  const type = (move && (move.type || move.element)) ? String(move.type || move.element).toLowerCase() : "";

  return (
    <span>
      {type ? (
        <span
          style={{
            display: "inline-block",
            padding: "0 6px",
            marginRight: 6,
            borderRadius: 8,
            fontSize: 12,
            lineHeight: "16px",
            color: "#fff",
            backgroundColor: "#888",
            verticalAlign: "middle",
          }}
        >
          {typeLabel(type)}
        </span>
      ) : null}
      {name}
    </span>
  );
}

// Apenas o nome em texto (sem JSX) — ideal para menus/logs
export function moveName(move) {
  const raw = resolveRawMoveName(move);
  return translateMove(raw || "");
}

export default { typeLabel, statusLabel, moveLabel, moveName };
