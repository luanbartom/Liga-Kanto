// Página inicial: permite escolher o(a) treinador(a) e definir o nome.
// Salva as escolhas no localStorage e navega para a seleção de Pokémon.
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/Home.module.css";
import ConfirmButton from "@/components/ui/ConfirmButton";

export default function Home() {
  const router = useRouter();
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [trainerName, setTrainerName] = useState("");
  const MAX_NAME = 12;

  // Aplica background da Home
  useEffect(() => {
    try {
      document?.body?.classList?.add("bg-home");
    } catch (e) {}
    return () => {
      try {
        document?.body?.classList?.remove("bg-home");
      } catch (e) {}
    };
  }, []);

  // Lista de treinadores disponíveis (id + imagem)
  const trainers = [
    { id: 1, image: "/images/trainer1.png" },
    { id: 2, image: "/images/trainer2.png" },
  ];

  // Prossegue para a próxima página quando houver um treinador escolhido
  // e um nome válido preenchido. Persiste no localStorage.
  function handleContinue() {
    const cleanName = trainerName
      .trim()
      .replace(/[^\p{L}]/gu, "")
      .slice(0, MAX_NAME);

    if (selectedTrainer && cleanName !== "") {
      try {
        localStorage.setItem("trainerName", cleanName);
        localStorage.setItem("selectedTrainer", String(selectedTrainer));
      } catch (e) {}
      router.push("/select-pokemon");
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>KANTO LEAGUE</h1>
      <h2 className={styles.subtitle}>Escolha seu treinador</h2>

      <div className={styles.contentRow}>
        <div className={styles.leftCol}>
          <div className={styles.trainerGrid}>
            {trainers.map((trainer) => (
              <div
                key={trainer.id}
                className={`${styles.trainerCard} ${
                  selectedTrainer === trainer.id ? styles.selected : ""
                }`}
                onClick={() => setSelectedTrainer(trainer.id)}
              >
                <img src={trainer.image} alt={`Treinador ${trainer.id}`} />
              </div>
            ))}
          </div>
        </div>

        <div className={styles.sidebar}>
          {selectedTrainer && (
            <form
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                handleContinue();
              }}
            >
              <div className={`${styles.trainerName} ${styles.appear}`}>
                <input
                  type="text"
                  placeholder="Digite um nome"
                  value={trainerName}
                  maxLength={MAX_NAME}
                  name="trainerName"
                  id="trainerName"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  inputMode="text"
                  onChange={(e) => {
                    const onlyLetters = e.target.value.replace(/[^\p{L}]/gu, "");
                    setTrainerName(onlyLetters.slice(0, MAX_NAME));
                  }}
                  aria-label="Nome do treinador"
                />
              </div>

              <ConfirmButton
                type="submit"
                className={`${styles.confirmFull} ${styles.appearDelayed}`}
                style={{ width: "100%", minWidth: 0 }}
                disabled={!selectedTrainer || trainerName.trim() === ""}
              >
                VAMOS LA!
              </ConfirmButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
