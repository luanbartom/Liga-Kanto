import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/SelectTeam.module.css";
import { typeLabel } from "@/utils/i18n";
import ConfirmButton from "@/components/ui/ConfirmButton";
import { getAllPokemons } from "@/utils/api";


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
        className={`${styles.sprite} ${enemy ? `${styles.mirror} ${styles.enemySprite}` : ""
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
  const nextRound = (router?.query?.nextRound || "1").toString();

  useEffect(() => {
    if (!router.isReady) return;
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
      } catch { }
    }

    try {
      const storedTrainer = localStorage.getItem("selectedTrainer");
      const parsedTrainer = parseInt(storedTrainer || "1", 10);
      if (!Number.isNaN(parsedTrainer)) setTrainerId(parsedTrainer);
    } catch { }
    const savedStarter = localStorage.getItem("starterIndex");
    if (savedStarter !== null) {
      const n = parseInt(savedStarter, 10);
      if (!Number.isNaN(n)) setStarterIndex(n);
    }
    
    (async () => {
      try {
        // Sempre gera um novo time inimigo, ignorando o salvo anteriormente
                const ENEMIES = 3;
        const all = await getAllPokemons();
        let picks = [];
        if ((router?.query?.nextRound || "").toString() === "boss") {
          const bosses = (all || []).filter((p) => p && p.boss);
          if (bosses.length > 0) {
            const idx = Math.floor(Math.random() * bosses.length);
            picks = [bosses[idx]];
          }
        } else {
          // Build pools following round rules (final evolutions only)
          const pool = (all || []).filter((p) => p && !p.boss);

          // Identify species that have evolutions (names that appear as evolves_from somewhere)
          const namesWithEvos = new Set((all || [])
            .map((p) => (typeof p?.evolves_from === 'string' ? p.evolves_from.toLowerCase() : null))
            .filter(Boolean));

          const isFinalEvolution = (mon) => !namesWithEvos.has(String(mon?.name || '').toLowerCase());

          // Allowed types by round
          const nr = (router?.query?.nextRound || "1").toString();
          const TYPE_RULES = {
            '1': ["fighting", "rock", "ground"],
            '2': ["water", "ice"],
            '3': ["ghost", "poison"],
            '4': ["dragon"],
          };
          const allowed = TYPE_RULES[nr] || [];

          const byTypeFinal = pool.filter((m) =>
            isFinalEvolution(m) && (m.types || []).some((t) => allowed.includes(String(t).toLowerCase()))
          );

          // Utility to pick unique random items
          const pickFrom = (arr) => {
            if (!arr || arr.length === 0) return null;
            const idx = Math.floor(Math.random() * arr.length);
            return arr.splice(idx, 1)[0];
          };

          // Round-specific composition
          if (nr === '3') {
            // Ensure Gengar is included
            const gengar = (all || []).find((p) => String(p?.name).toLowerCase() === 'gengar');
            if (gengar) picks.push(gengar);
            // Fill remaining with matching final evolutions excluding Gengar
            const poolEx = byTypeFinal.filter((m) => String(m?.name).toLowerCase() !== 'gengar');
            while (picks.length < ENEMIES && poolEx.length > 0) {
              const next = pickFrom(poolEx);
              if (next) picks.push(next);
            }
          } else {
            const work = [...byTypeFinal];
            while (picks.length < ENEMIES && work.length > 0) {
              const next = pickFrom(work);
              if (next) picks.push(next);
            }
          }

          // Fallbacks if not enough candidates: fill with any final evolutions (ignoring type), then any non-boss
          if (picks.length < ENEMIES) {
            const finalsAny = pool.filter(isFinalEvolution);
            // Remove already chosen
            const chosenNames = new Set(picks.map((p) => String(p.name).toLowerCase()));
            const finalsLeft = finalsAny.filter((m) => !chosenNames.has(String(m.name).toLowerCase()));
            while (picks.length < ENEMIES && finalsLeft.length > 0) {
              const next = pickFrom(finalsLeft);
              if (next) picks.push(next);
            }
          }
          if (picks.length < ENEMIES) {
            const poolLeft = pool.filter((m) => !picks.some((x) => x.id === m.id));
            while (picks.length < ENEMIES && poolLeft.length > 0) {
              const next = pickFrom(poolLeft);
              if (next) picks.push(next);
            }
          }
        }
        const fixed = picks.map((p) => ({
          ...p,
          sprite: `/sprites/static/${p.id}.png`,
          animated: `/sprites/gif/${p.id}.gif`,
        }));
        setEnemyPreview(fixed);
        // Salva o time e sincroniza o round para a Battle
        try {
          localStorage.setItem("enemyTeam", JSON.stringify(fixed));
          const nr = (router?.query?.nextRound || "1").toString();
          if (nr === "boss") {
            localStorage.setItem("battleProgressRound", "4");
          } else {
            const n = parseInt(nr || "1", 10);
            const roundIndex = Number.isNaN(n) ? 0 : Math.max(0, Math.min(3, n - 1));
            localStorage.setItem("battleProgressRound", String(roundIndex));
          }
        } catch (e) {}
      } catch (e) {
        console.error("Erro ao gerar time inimigo:", e);
      }
    })();

    return () => {
      try {
        document?.body?.classList?.remove("bg-select-team");
      } catch (e) { }
    };
  }, [router.isReady, router.query]);

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

          {/* Treinador inimigo (varia por round) */}
          <img
            className={`${styles.trainer} ${styles.mirror}`}
            src={nextRound === 'boss' ? '/images/gary.png' : `/images/enemy${parseInt(nextRound||'1',10)}.png`}
            width={80}
            height={80}
            alt={nextRound === 'boss' ? 'Gary' : `Oponente ${nextRound}`}
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


