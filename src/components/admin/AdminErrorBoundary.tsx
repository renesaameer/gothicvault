import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: (reset: () => void, error: Error | null) => ReactNode;
  label?: string;
}
interface State { hasError: boolean; error: Error | null; }

class AdminErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error("[AdminErrorBoundary]", this.props.label ?? "", error.message);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback(this.reset, this.state.error);
      return (
        <div
          className="rounded-2xl p-5 text-sm flex flex-col items-start gap-3"
          style={{
            background: "hsl(var(--a-surface))",
            boxShadow: "var(--a-shadow-ring), var(--a-shadow-xs)",
            color: "hsl(var(--a-ink))",
          }}
        >
          <div>
            <p className="font-medium">Something went wrong loading this section.</p>
            <p className="text-[12px] mt-1" style={{ color: "hsl(var(--a-muted))" }}>
              {this.state.error?.message || "Unexpected error"}
            </p>
          </div>
          <button
            type="button"
            onClick={this.reset}
            className="px-3 h-8 rounded-lg text-[12px] font-medium"
            style={{ background: "hsl(var(--a-ink))", color: "white" }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default AdminErrorBoundary;
