import React from "react";
import styles from "./AttackMenu.module.css";

// Lista simples de ataques (sem Ã­cones/cabeÃ§alhos entre os itens)
export default function AttackMenu({ moves = [], onSelect }) {
  const groups = { physical: [], special: [], status: [], unknown: [] };

  moves.forEach((mv, idx) => {
    const key = (mv?.damage_class || "unknown").toLowerCase();
    (groups[key] || groups.unknown).push({ ...mv, _key: String(idx) });
  });

  const flat = [
    ...groups.physical,
    ...groups.special,
    ...groups.status,
    ...groups.unknown,
  ];

  // Local labels for types (pt-BR)
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
  const tLabel = (t) => (t ? TYPE_PT[t] || (t.charAt(0).toUpperCase() + t.slice(1)) : "");

  return (
    <div className={styles.menu}>
      <div className={styles.group}>
        {flat.map((mv) => (
          <button
            key={mv._key}
            className={styles.item}
            onClick={() => onSelect?.(mv)}
            title={`${mv.display || mv.name}`}
          >
            <div className={styles.itemLine}>
              <span className={styles.itemName}>{mv.display || mv.name}</span>
              <span className={`${styles.badge} ${styles[mv.type] || ""}`}>
                {tLabel(mv.type || "normal")}
              </span>
            </div>
            <div className={styles.meta}>
              <span>Poder {mv.power ?? 0}</span>
              <span>PrecisÃ£o {mv.accuracy ?? 100}%</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

