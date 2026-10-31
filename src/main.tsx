import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FirewoodLog } from "./firewood-log";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode><FirewoodLog /></StrictMode>,
);
