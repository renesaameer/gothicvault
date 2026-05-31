import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Safe sessionStorage helper — never throws
const safeSession = {
  get(key: string): string | null {
    try { return sessionStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string) {
    try { sessionStorage.setItem(key, value); } catch { /* ignore */ }
  },
};

const MODULE_LOAD_RECOVERY_KEY = "__module_load_recovered_once__";

const isModuleScriptLoadError = (msg: string) =>
  msg.includes("Importing a module script failed") ||
  msg.includes("Failed to fetch dynamically imported module") ||
  msg.includes("Loading chunk") ||
  msg.includes("Loading CSS chunk");

window.addEventListener(
  "error",
  (event) => {
    const message = event.message || "";
    const errorMessage = event.error instanceof Error ? event.error.message : "";
    const combined = message + " " + errorMessage;

    if (!isModuleScriptLoadError(combined)) return;
    if (safeSession.get(MODULE_LOAD_RECOVERY_KEY) === "1") return;

    safeSession.set(MODULE_LOAD_RECOVERY_KEY, "1");
    window.location.reload();
  },
  true
);

window.addEventListener("unhandledrejection", (event) => {
  const msg = event.reason?.message || String(event.reason);
  if (isModuleScriptLoadError(msg) && safeSession.get(MODULE_LOAD_RECOVERY_KEY) !== "1") {
    safeSession.set(MODULE_LOAD_RECOVERY_KEY, "1");
    window.location.reload();
  }
});

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
  (window as any).__app_booted__ = true;
}
