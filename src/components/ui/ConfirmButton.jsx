import React from "react";
import styles from "./ConfirmButton.module.css";

export default function ConfirmButton({
  children,
  onClick,
  disabled = false,
  type = "button",
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      className={`${styles.confirm} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

