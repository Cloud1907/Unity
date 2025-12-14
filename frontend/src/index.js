// 🔥 FORCE PREVIEW REBUILD — DO NOT REMOVE
console.log("FORCE_REBUILD_PREVIEW", Date.now());

import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// 🔓 Emergent Preview body-lock koruması (kalıcı)
(function protectBodyLock() {
  const unlock = () => {
    document.body.style.pointerEvents = "auto";
    document.body.style.overflow = "auto";
    document.body.removeAttribute("data-scroll-locked");
  };

  unlock();

  const observer = new MutationObserver(unlock);
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["style", "data-scroll-locked"],
  });
})();