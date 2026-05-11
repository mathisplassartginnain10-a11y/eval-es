import React, { Suspense } from "react"
import { Scene } from "./components/Scene.jsx"

function ShellFallback() {
  return (
    <div className="shell-fallback">
      <div className="shell-fallback__ring" />
      <p>Chargement du moteur 3D…</p>
    </div>
  )
}

class EarthErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error("[Earth GLB]", error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-panel">
          <h2>Impossible de charger le modèle</h2>
          <p>
            Vérifie que <code>public/models/earth.glb</code> existe.
          </p>
          <pre>{String(this.state.error.message || this.state.error)}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <div className="app">
      <div className="app__chrome">
        <header className="app__header">
          <span className="app__badge">ORBITAL VIEW</span>
          <h1>Earth</h1>
          <p className="app__subtitle">React Three Fiber · Vite · drei</p>
        </header>
        <footer className="app__footer">
          <span>Glisser pour orbiter · Molette pour zoomer</span>
        </footer>
      </div>

      <EarthErrorBoundary>
        <Suspense fallback={<ShellFallback />}>
          <div className="app__canvas">
            <Scene />
          </div>
        </Suspense>
      </EarthErrorBoundary>
    </div>
  )
}
