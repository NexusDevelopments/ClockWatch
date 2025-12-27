import React from 'react'
import ClockWatch from './ClockWatch'

export default function App() {
  return (
    <div className="app-root">
      <header className="app-header">ClockWatch</header>
      <main>
        <ClockWatch />
      </main>
      <footer className="app-footer">A simple stopwatch & timer</footer>
    </div>
  )
}
