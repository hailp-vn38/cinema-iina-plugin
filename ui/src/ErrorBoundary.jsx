import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-shell" style={{ padding: "20px" }}>
          <div
            style={{
              color: "red",
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
            }}
          >
            <h2>React Error</h2>
            <p>{String(this.state.error)}</p>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
