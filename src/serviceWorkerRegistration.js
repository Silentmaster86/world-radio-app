// src/serviceWorkerRegistration.js
export function register() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log("[SW] Registered:", registration);
          })
          .catch((error) => {
            console.error("[SW] Registration failed:", error);
          });
      });
    }
  }
  