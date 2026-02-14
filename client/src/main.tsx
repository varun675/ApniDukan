import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import KeyboardDismiss from "./components/KeyboardDismiss";
import { registerPWA } from "./lib/pwa";
import "./responsive.css";
import "./index.css";

// Register PWA
registerPWA();

const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
      <KeyboardDismiss />
    </BrowserRouter>
  </React.StrictMode>
);
