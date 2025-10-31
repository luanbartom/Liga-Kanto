"use client";
import React, { useState } from "react";
import ReactDOM from "react-dom";
import styles from "./AttackMenu.module.css";
import { typeLabel, moveName } from "@/utils/i18n";
import { describeMove, STAGE_MOVES, typeMultiplier } from "@/utils/moves";

// Lista de ataques com tooltip detalhado ao passar o mouse
export default function AttackMenu({ moves = [], onSelect, attackerTypes = [], defenderTypes = [] }) {
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

  const tLabel = (t) => typeLabel(t || "");
  const [hover, setHover] = useState({ show: false, mv: null, pos: { top: 0, left: 0 } });

  const onEnter = (ev, mv) => {
    const top = Math.round((ev.clientY || 0) + (window.scrollY || 0) + 12);
    const left = Math.round((ev.clientX || 0) + (window.scrollX || 0) + 12);
    setHover({ show: true, mv, pos: { top, left } });
  };
  const onMove = (ev) => {
    if (!hover.show) return;
    const vw = window.innerWidth || 0;
    const vh = window.innerHeight || 0;
    const margin = 12;
    const ttWidth = 280; // css max-width
    const ttHeight = 180; // rough estimate
    let left = Math.round((ev.clientX || 0) + (window.scrollX || 0) + margin);
    let top = Math.round((ev.clientY || 0) + (window.scrollY || 0) + margin);
    if (left + ttWidth > (vw + (window.scrollX || 0))) {
      left = Math.max(margin, Math.round((ev.clientX || 0) + (window.scrollX || 0) - ttWidth - margin));
    }
    if (top + ttHeight > (vh + (window.scrollY || 0))) {
      top = Math.max(margin, Math.round((ev.clientY || 0) + (window.scrollY || 0) - ttHeight - margin));
    }
    setHover((h) => ({ ...h, pos: { top, left } }));
  };
  const onLeave = () => setHover({ show: false, mv: null, pos: { top: 0, left: 0 } });

  const Tooltip = ({ children, top, left }) => {
    if (typeof document === "undefined") return null;
    return ReactDOM.createPortal(
      <div className={styles.tooltip} style={{ top, left, pointerEvents: "none" }}>
        {children}
      </div>,
      document.body
    );
  };

  return (
    <div className={styles.menu} onMouseLeave={onLeave} onMouseMove={onMove}>
      <div className={styles.group}>
        {flat.map((mv) => (
          <button
            key={mv._key}
            className={styles.item}
            onClick={() => onSelect?.(mv)}
            onMouseEnter={(e) => onEnter(e, mv)}
            onMouseMove={(e) => onEnter(e, mv)}
          >
            <div className={styles.itemLine}>
              <span className={styles.itemName}>{String(moveName(mv) || "")}</span>
              <span className={`${styles.badge} ${styles[mv.type] || ""}`}>
                {tLabel(mv.type || "normal")}
              </span>
            </div>
          </button>
        ))}
      </div>
      {hover.show && hover.mv && (
        <Tooltip top={hover.pos.top} left={hover.pos.left}>
          <div className={styles.tooltipHeader}>
            <span className={styles.tooltipTitle}>{moveName(hover.mv)}</span>
            <span className={`${styles.badge} ${styles[hover.mv.type] || ""}`}>{tLabel(hover.mv.type || "normal")}</span>
          </div>
          <div className={styles.tooltipRow}>
            <span>Classe: {(hover.mv.damage_class || "status").toString()}</span>
            <span>Poder: {hover.mv.power ?? 0}</span>
            <span>Precisão: {hover.mv.accuracy ?? 100}%</span>
          </div>
          <div className={styles.tooltipRow}>
            {Array.isArray(defenderTypes) && defenderTypes.length > 0 && (
              <span>
                {(() => {
                  const mult = typeMultiplier(hover.mv.type || "normal", defenderTypes);
                  if (mult === 0) return "Sem efeito";
                  if (mult > 1) return `Super efetivo x${mult}`;
                  if (mult < 1) return `Pouco efetivo x${mult}`;
                  return "Efeito normal x1";
                })()}
              </span>
            )}
            {Array.isArray(attackerTypes) && attackerTypes.includes(hover.mv.type) && (
              <span>Recebe STAB</span>
            )}
          </div>
          <div className={styles.tooltipSectionTitle}>Efeitos</div>
          <div className={styles.tooltipList}>
            {(() => {
              const key = (hover.mv?.name || hover.mv?.id || "").toString().toLowerCase();
              const defs = STAGE_MOVES[key] || [];
              const labels = { attack: "Ataque", defense: "Defesa", spAttack: "Ataque Esp.", spDefense: "Defesa Esp.", speed: "Velocidade", accuracy: "Precisão", evasion: "Evasão" };
              return defs.map((d, i) => (
                <div key={`st-${i}`}>• {(d.target === "self" ? "Usuário" : "Alvo")} {labels[d.stat] || d.stat} {d.delta > 0 ? "+" : ""}{d.delta}</div>
              ));
            })()}
            {Array.isArray(hover.mv.effects) && hover.mv.effects.length > 0 && hover.mv.effects.map((e, i) => (
              <div key={`se-${i}`}>• {String(e.type)} ({e.chance ?? 0}%)</div>
            ))}
            {(() => {
              const key = (hover.mv?.name || hover.mv?.id || "").toString().toLowerCase();
              const noneStages = !(STAGE_MOVES[key] && STAGE_MOVES[key].length);
              const noneStatus = !(Array.isArray(hover.mv.effects) && hover.mv.effects.length);
              return (noneStages && noneStatus) ? <div>• Nenhum efeito adicional</div> : null;
            })()}
          </div>
          <div className={styles.tooltipSectionTitle}>Resumo</div>
          <div className={styles.tooltipList}>{describeMove(hover.mv)}</div>
        </Tooltip>
      )}
    </div>
  );
}
