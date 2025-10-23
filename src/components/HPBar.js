import { useEffect, useRef, useState } from "react";
import styles from "./HPBar.module.css";

export default function HPBar({ hp, maxHp, color }) {
  const [currentHp, setCurrentHp] = useState(hp);
  const [damaged, setDamaged] = useState(false);
  const prevHp = useRef(hp);

  useEffect(() => {
    // Trigger damage animation when HP decreases
    if (hp < prevHp.current) {
      setDamaged(true);
      const t = setTimeout(() => setDamaged(false), 1100);
      // clear timeout on unmount
      return () => clearTimeout(t);
    }
  }, [hp]);

  useEffect(() => {
    // Always update currentHp and prev reference
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
