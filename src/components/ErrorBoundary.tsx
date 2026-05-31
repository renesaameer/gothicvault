import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("[ErrorBoundary] Caught:", error.message);
    // Attempt recovery on chunk load failures
    const isChunkError =
      error.message?.includes("Failed to fetch dynamically imported module") ||
      error.message?.includes("Importing a module script failed") ||
      error.message?.includes("Loading chunk") ||
      error.message?.includes("Loading CSS chunk");

    if (isChunkError) {
      const key = "__error_boundary_recovered__";
      if (sessionStorage.getItem(key) !== "1") {
        sessionStorage.setItem(key, "1");
        window.location.reload();
        return;
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
          <p className="text-lg font-medium">Something went wrong</p>
          <p className="text-sm text-muted-foreground max-w-md">{this.state.error?.message}</p>
          <button
            onClick={() => {
              sessionStorage.removeItem("__error_boundary_recovered__");
              sessionStorage.removeItem("__module_load_recovered_once__");
              window.location.reload();
            }}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
