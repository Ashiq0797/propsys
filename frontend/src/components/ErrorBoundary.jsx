import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="m-8 p-6 rounded-lg border border-red-200 bg-red-50 text-red-800">
          <h2 className="text-lg font-semibold mb-2">Something broke</h2>
          <p className="text-sm mb-3">{String(this.state.error?.message || this.state.error)}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-3 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700"
          >
            Dismiss
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
