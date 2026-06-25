import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { RepositoryProvider } from "./lib/repository/RepositoryProvider";
import "./styles/tokens.css";
import "./styles/bir-form.css";
import "./styles/app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RepositoryProvider>
      <App />
    </RepositoryProvider>
  </StrictMode>,
);
