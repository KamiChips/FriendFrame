import "./styles.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { createQueryClient } from "@/api/queries";

import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App queryClient={createQueryClient()} />
  </StrictMode>,
);
