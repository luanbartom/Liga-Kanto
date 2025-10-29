// ========================================================
// i18n helpers (versão simplificada — nomes de golpes em inglês)
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

// ========================================================
// Funções auxiliares básicas
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

// ========================================================
// Simplificação — nomes de golpes sempre originais
// ========================================================

// Retorna o nome puro do golpe (sem tradução)
export function moveName(move) {
  if (!move) return "";
  if (typeof move === "string") return move;
  return move.display || move.name || move.move || move.id || "";
}

// Retorna JSX formatado (para telas que mostram tipo junto)
export function moveLabel(move) {
  if (!move) return "";
  const name = moveName(move);
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

export default { typeLabel, statusLabel, moveLabel, moveName };
