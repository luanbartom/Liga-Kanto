// ========================================================
// i18n helpers (versão sem tradução - usa valores originais)
// ========================================================

// Sem mapas de tradução: retorna os valores originais (EN)

export function typeLabel(type) {
  if (type == null) return "";
  return typeof type === "string" ? type : String(type);
}

export function statusLabel(status) {
  if (status == null) return "";
  return typeof status === "string" ? status : String(status);
}

// Nomes de golpes sempre originais (já era assim)
export function moveName(move) {
  if (!move) return "";
  if (typeof move === "string") return move;
  return move.display || move.name || move.move || move.id || "";
}

// Rótulo para UI: mantém chip de tipo usando valor original
export function moveLabel(move) {
  if (!move) return "";
  const name = moveName(move);
  const type = (move && (move.type || move.element)) ? String(move.type || move.element) : "";

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
// Helpers sem tradução: usa valores originais (EN)

