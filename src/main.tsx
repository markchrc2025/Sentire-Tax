import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { RepositoryProvider } from "./lib/repository/RepositoryProvider";
import "./styles/tokens.css";
import "./styles/bir-form.css";
import "./styles/app.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <RepositoryProvider>
        <App />
      </RepositoryProvider>
    </BrowserRouter>
  </StrictMode>,
);
