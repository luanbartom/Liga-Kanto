import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/Home.module.css";
import ConfirmButton from "@/components/ui/ConfirmButton";

export default function Home() {
  const router = useRouter();
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [trainerName, setTrainerName] = useState("");

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

  const trainers = [
    { id: 1, image: "/images/trainer1.png" },
    { id: 2, image: "/images/trainer2.png" },
  ];

  function handleContinue() {
    if (selectedTrainer && trainerName.trim() !== "") {
      try {
        localStorage.setItem("trainerName", trainerName.trim());
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
            <>
              <div className={`${styles.trainerName} ${styles.appear}`}>
                <input
                  type="text"
                  placeholder="Digite um nome"
                  value={trainerName}
                  onChange={(e) => setTrainerName(e.target.value)}
                  aria-label="Nome do treinador"
                />
              </div>

              <ConfirmButton
                className={`${styles.confirmFull} ${styles.appearDelayed}`}
                onClick={handleContinue}
                disabled={!selectedTrainer || trainerName.trim() === ""}
              >
                VAMOS LA!
              </ConfirmButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
