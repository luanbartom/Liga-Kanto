// Weak move rules centralization

export const WEAK_POWER_CAP = 60;

// Ordered weak moves per type (<= 60 power when possible)
export const WEAK_MOVES_BY_TYPE = {
  normal: ["tackle", "quick-attack", "scratch", "pound", "swift"], // swift = 60
  fire: ["ember", "fire-spin", "flame-charge"], // flame-charge = 50
  water: ["bubble", "water-gun"],
  grass: ["vine-whip", "razor-leaf"], // razor-leaf = 55
  electric: ["thunder-shock", "charge-beam"],
  ice: ["powder-snow", "icy-wind"],
  fighting: ["mach-punch", "rock-smash"],
  poison: ["poison-sting", "acid"],
  ground: ["mud-slap", "bulldoze"], // bulldoze = 60
  flying: ["gust", "peck", "wing-attack"], // wing-attack = 60
  psychic: ["confusion"],
  bug: ["struggle-bug", "bug-bite"],
  rock: ["rock-throw", "smack-down"],
  ghost: ["lick", "astonish", "shadow-punch"], // shadow-punch = 60
  dragon: ["twister", "dragon-breath"], // dragon-breath = 60
  dark: ["snarl", "bite"], // bite = 60
  steel: ["metal-claw", "bullet-punch"],
  fairy: ["fairy-wind", "draining-kiss"],
};

const FALLBACK_NORMAL = ["tackle", "quick-attack", "scratch", "pound", "swift"];

function uniq(arr) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    if (!seen.has(x)) {
      seen.add(x);
      out.push(x);
    }
  }
  return out;
}

export function weakCandidatesForTypes(types = []) {
  const list = [];
  const t = Array.isArray(types) ? types : [types];
  for (const ty of t) {
    const key = String(ty || "").toLowerCase();
    if (WEAK_MOVES_BY_TYPE[key]) list.push(...WEAK_MOVES_BY_TYPE[key]);
  }
  list.push(...FALLBACK_NORMAL);
  return uniq(list);
}

// Ensure 4 weak moves for a basic-with-next mon
// existingMoves: array of strings (preferred) or objects with name
// movesIndex: Map name->details (may be null)
export function ensureFourWeakMoves(mon, existingMoves = [], movesIndex = null) {
  const nameOf = (m) => (typeof m === "string" ? m : String(m?.name || "")).toLowerCase();
  const types = Array.isArray(mon?.types) ? mon.types : [];
  const prefer = existingMoves.map(nameOf).filter(Boolean);
  const allowed = new Set();

  // Start with existing that are weak enough
  for (const mv of prefer) {
    if (!mv) continue;
    const inWhite = Object.values(WEAK_MOVES_BY_TYPE).some((arr) => arr.includes(mv));
    const pw = movesIndex?.get(mv)?.power;
    if (inWhite || (typeof pw === "number" && pw <= WEAK_POWER_CAP)) {
      allowed.add(mv);
      if (allowed.size >= 4) break;
    }
  }

  // Fill with type-appropriate candidates
  if (allowed.size < 4) {
    for (const mv of weakCandidatesForTypes(types)) {
      if (!allowed.has(mv)) {
        allowed.add(mv);
        if (allowed.size >= 4) break;
      }
    }
  }

  // Final list to length 4
  const out = Array.from(allowed).slice(0, 4);
  while (out.length < 4) out.push("tackle");
  return out;
}

