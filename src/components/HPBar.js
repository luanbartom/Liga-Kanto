// Barra de HP com animação suave via requestAnimationFrame
import { useEffect, useRef, useState } from 'react';
import styles from './HPBar.module.css';

export default function HPBar({ hp, maxHp, color }) {
  // HP que está sendo exibido (animado)
  const [currentHp, setCurrentHp] = useState(hp);
  const [damaged, setDamaged] = useState(false);

  const prevHpRef = useRef(hp);
  const frameRef = useRef(null);
  const damageTimeoutRef = useRef(null);

  useEffect(() => {
    const from = prevHpRef.current;
    const to = hp;

    // Nada mudou, não anima
    if (from === to) return;

    // Se o HP diminuiu, dispara o estado de dano (shake/flash)
    if (to < from) {
      setDamaged(true);
      if (damageTimeoutRef.current) {
        clearTimeout(damageTimeoutRef.current);
      }
      damageTimeoutRef.current = setTimeout(() => {
        setDamaged(false);
      }, 1100); // mantém o mesmo tempo que você já usava
    }

    // Cancela animação anterior, se existir
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    const duration = 450; // duração da animação em ms
    const startTime = performance.now();

    const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);

    const step = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutQuad(t);

      const next = from + (to - from) * eased;
      setCurrentHp(next);

      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        // garante que termina exatamente no valor final
        setCurrentHp(to);
        prevHpRef.current = to;
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [hp]);

  useEffect(() => {
    return () => {
      if (damageTimeoutRef.current) {
        clearTimeout(damageTimeoutRef.current);
      }
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const safeMax = maxHp || 1;
  const hpPercent = Math.max(0, Math.min(100, (currentHp / safeMax) * 100));

  return (
    <div className={`${styles.container} ${damaged ? styles.shake : ''}`}>
      <div
        className={`${styles.fill} ${damaged ? styles.damage : ''}`}
        style={{
          width: `${hpPercent}%`,
          backgroundColor: color,
          // animação vem do requestAnimationFrame, então nada de transition aqui
          transition: 'none',
        }}
      />
    </div>
  );
}
