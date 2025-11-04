// Barra de HP com animação de dano (shake/flash) baseada em mudanças de valor.
import { useEffect, useRef, useState } from "react";
import styles from "./HPBar.module.css";

export default function HPBar({ hp, maxHp, color }) {
  // currentHp espelha a prop hp para animar transições de largura
  const [currentHp, setCurrentHp] = useState(hp);
  const [damaged, setDamaged] = useState(false);
  const prevHp = useRef(hp);

  useEffect(() => {
    // Dispara animação quando o HP diminui
    if (hp < prevHp.current) {
      setDamaged(true);
      const t = setTimeout(() => setDamaged(false), 1100);
      // clear timeout on unmount
      return () => clearTimeout(t);
    }
  }, [hp]);

  useEffect(() => {
    // Atualiza estado interno e referência do valor anterior
    setCurrentHp(hp);
    prevHp.current = hp;
  }, [hp]);

  const hpPercent = (currentHp / maxHp) * 100;

  return (
    <div className={`${styles.container} ${damaged ? styles.shake : ""}`}>
      <div
        className={`${styles.fill} ${damaged ? styles.damage : ""}`}
        style={{
          width: `${hpPercent}%`,
          backgroundColor: color,
          transition: "width 1.4s ease-in-out",
        }}
      ></div>
    </div>
  );
}
