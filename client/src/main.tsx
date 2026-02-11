import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import KeyboardDismiss from "./components/KeyboardDismiss";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <KeyboardDismiss />
    </BrowserRouter>
  </React.StrictMode>
);
