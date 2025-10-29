import React from "react";
import styles from "./AttackMenu.module.css";
import { typeLabel, moveName } from "@/utils/i18n";

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

  const tLabel = (t) => typeLabel(t || "");

  return (
    <div className={styles.menu}>
      <div className={styles.group}>
        {flat.map((mv) => (
          <button
            key={mv._key}
            className={styles.item}
            onClick={() => onSelect?.(mv)}
            title={String(moveName(mv) || "")}
          >
            <div className={styles.itemLine}>
              <span className={styles.itemName}>{String(moveName(mv) || "")}</span>
              <span className={`${styles.badge} ${styles[mv.type] || ""}`}>
                {tLabel(mv.type || "normal")}
              </span>
            </div>
            <div className={styles.meta}>
              <span>Poder {mv.power ?? 0}</span>
              <span>{"Precis\u00E3o "}{mv.accuracy ?? 100}%</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}







