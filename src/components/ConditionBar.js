import styles from "./ConditionBar.module.css";

export default function ConditionBar({ condition }) {
  if (!condition || condition === "normal") return null;

  const colors = {
    poisoned: "#9b30ff",
    paralyzed: "#ffcc00",
    asleep: "#66ccff",
    burned: "#ff3300",
    frozen: "#a6e0ff",
  };

  return (
    <div
      className={styles.bar}
      style={{
        backgroundColor: colors[condition] || "gray",
        transition: "opacity 0.5s",
      }}
    >
      {condition}
    </div>
  );
}
