import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/SelectTeam.module.css";
import { typeLabel } from "@/utils/i18n";
import ConfirmButton from "@/components/ui/ConfirmButton";
import { getPokemon } from "@/utils/api";

function PokeThumb({ pokemon, selected = false, onClick, enemy = false }) {
  if (!pokemon) return null;

  const baseSize = 96;

  // Escala base a partir da altura (decímetros -> metros)
  let scale = Math.min(Math.max(pokemon.height / 12, 0.8), 2.2);

  // Bônus por estágio via API (cobre todos os 151)
  const stage = Math.min(3, Math.max(1, parseInt(pokemon?.evolutionStage ?? 1, 10)));
  if (stage === 1) scale *= 1.15;
  else if (stage === 2) scale *= 1.35;
  else scale *= 1.55;

  // Reaplica limites após o bônus
  scale = Math.min(Math.max(scale, 0.8), 2.2);

  const spriteSize = baseSize * scale;

  return (
    <button
      type="button"
      className={`${styles.pokeThumb} ${enemy ? styles.enemy : ""}`}
      onClick={onClick}
      aria-pressed={selected}
      title={pokemon?.name || "pokemon"}
    >
      <img
        className={`${styles.sprite} ${
          enemy ? `${styles.mirror} ${styles.enemySprite}` : ""
        } ${selected && !enemy ? styles.spriteSelected : ""}`}
        src={pokemon.animated}
        alt={pokemon.name}
        width={spriteSize}
        height={spriteSize}
        style={{
          transform: `${enemy ? "scaleX(-1)" : "scaleX(1)"} scale(${scale})`,
          transformOrigin: "center bottom",
        }}
        onError={(e) => {
          const img = e.currentTarget;
          if (!img.dataset.fallback) {
            img.dataset.fallback = "1";
            img.src = pokemon.sprite; // fallback para PNG estático local
          }
        }}
      />

      <div className={styles.pokeMeta}>
        <div className={styles.pokeName}>{pokemon.name}</div>
        <div className={styles.pokeTypes}>
          {(pokemon.types || []).map((t, i) => (
            <span key={i} className={`${styles.type} ${styles[t] || ""}`}>
              {typeLabel(t)}
            </span>
          ))}
        </div>
      </div>

    </button>
  );
}




export default function SelectTeam() {
  const [team, setTeam] = useState([]);
  const [starterIndex, setStarterIndex] = useState(null);
  const [enemyPreview, setEnemyPreview] = useState([]);
  const [trainerId, setTrainerId] = useState(1);
  const router = useRouter();

  useEffect(() => {
    try {
      document?.body?.classList?.add("bg-select-team");
    } catch (e) { }

    const fixSprites = (arr = []) =>
      arr.map((p) =>
        p && p.id
          ? {
              ...p,
              sprite: `/sprites/statics/${p.id}.png`,
              animated: `/sprites/gif/${p.id}.gif`,
            }
          : p
      );

    const saved = localStorage.getItem("selectedTeam");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTeam(fixSprites(parsed));
      } catch {}
    }

    try {
      const storedTrainer = localStorage.getItem("selectedTrainer");
      const parsedTrainer = parseInt(storedTrainer || "1", 10);
      if (!Number.isNaN(parsedTrainer)) setTrainerId(parsedTrainer);
    } catch {}
    const savedStarter = localStorage.getItem("starterIndex");
    if (savedStarter !== null) {
      const n = parseInt(savedStarter, 10);
      if (!Number.isNaN(n)) setStarterIndex(n);
    }

    (async () => {
      try {
        const stored = localStorage.getItem("enemyTeam");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const fixed = fixSprites(parsed);
            setEnemyPreview(fixed);
            localStorage.setItem("enemyTeam", JSON.stringify(fixed));
            return;
          }
        }
        const ENEMIES = 3;
        const ids = Array.from({ length: ENEMIES }, () => Math.floor(Math.random() * 151) + 1);
        const enemies = await Promise.all(ids.map((id) => getPokemon(id)));
        const filtered = enemies.filter(Boolean);
        setEnemyPreview(filtered);
        localStorage.setItem("enemyTeam", JSON.stringify(filtered));
      } catch (e) { }
    })();

    return () => {
      try {
        document?.body?.classList?.remove("bg-select-team");
      } catch (e) { }
    };
  }, []);

  const handleStartBattle = () => {
    if (team.length === 0) return alert("Selecione pelo menos 1 Pokémon!");
    if (starterIndex === null) return alert("Escolha com qual Pokémon iniciar!");
    try {
      localStorage.setItem("starterIndex", String(starterIndex));
    } catch (e) { }
    router.push("/battle");
  };

  return (
    <div className={styles.selectTeamContainer}>
      <div className={styles.panel}>
        <h1>Selecione seu Pokémon para iniciar a batalha!</h1>

        <div className={styles.lineup}>
          {/* Pokémons inimigos */}
          {enemyPreview.map((p, i) => (
            <PokeThumb key={`enemy-${p.id}-${i}`} pokemon={p} enemy />
          ))}

          {/* Treinador inimigo (Gary) */}
          <img
            className={`${styles.trainer} ${styles.mirror}`}
            src="/images/gary.png"
            width={80}
            height={80}
            alt="Rival"
          />

          {/* VS */}
          <div className={styles.vs}>VS</div>

          {/* Seu treinador(a) selecionado na Home */}
          <img
            className={`${styles.trainer} ${trainerId === 2 ? styles.trainerAdjust : ""}`}
            src={`/images/trainer${trainerId}pixel.png`}
            width={80}
            height={80}
            alt="Você"
          />

          {/* Seus pokémons */}
          {team.map((p, idx) => (
            <PokeThumb
              key={`ally-${p.id}-${idx}`}
              pokemon={p}
              selected={starterIndex === idx}
              onClick={() => setStarterIndex(idx)}
            />
          ))}
        </div>

        <ConfirmButton
          className={styles.cta}
          onClick={handleStartBattle}
          disabled={team.length === 0 || starterIndex === null}
        >
          Batalhar!
        </ConfirmButton>
      </div>
    </div>
  );
}
