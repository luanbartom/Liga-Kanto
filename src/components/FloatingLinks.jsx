import { useState } from "react";
import styles from "./FloatingLinks.module.css";
import { Github, Linkedin } from "lucide-react"; // opcional

export default function FloatingLinks() {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.container}>
      <div className={`${styles.menu} ${open ? styles.open : ""}`}>

        {/* GitHub Luan */}
        <a
          href="https://github.com/luanbartom"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.item}
        >
          <Github size={22} />
          <span>Luan Bartom Silva e Silva</span>
        </a>

        {/* LinkedIn Luan */}
        <a
          href="https://www.linkedin.com/in/luan-silvabartom/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.item}
        >
          <Linkedin size={22} />
          <span>Luan Bartom Silva e Silva</span>
        </a>

        {/* GitHub Ivan */}
        <a
          href="https://github.com/ivanlucasmiorandi"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.item}
        >
          <Github size={22} />
          <span>Ivan Lucas Miorandi</span>
        </a>

        {/* LinkedIn Ivan */}
        <a
          href="https://www.linkedin.com/in/ivan-lucas-miorandi-8115457b/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.item}
        >
          <Linkedin size={22} />
          <span>Ivan Lucas Miorandi</span>
        </a>
      </div>

      <button
        className={styles.toggle}
        onClick={() => setOpen(!open)}
      >
        {open ? "×" : "Conheça os criadores"}
      </button>
    </div>
  );
}
