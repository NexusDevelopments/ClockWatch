import React, { useEffect, useRef, useState } from 'react'

function formatTime(ms) {
  const s = Math.floor(ms / 1000)
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  const cs = String(Math.floor((ms % 1000) / 10)).padStart(2, '0')
  return `${mm}:${ss}.${cs}`
}

export default function ClockWatch() {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(null)
  const rafRef = useRef(null)
  const [laps, setLaps] = useState([])

  const [mode, setMode] = useState('stopwatch')

  // Timer state
  const [timerValue, setTimerValue] = useState(60) // seconds
  const [remaining, setRemaining] = useState(60)
  const [timerRunning, setTimerRunning] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      clearInterval(timerRef.current)
    }
  }, [])

  // Stopwatch logic
  function tick() {
    const now = performance.now()
    setElapsed(prev => now - startRef.current + prev)
    rafRef.current = requestAnimationFrame(tick)
  }

  const handleStartStop = () => {
    if (!running) {
      startRef.current = performance.now()
      rafRef.current = requestAnimationFrame(function loop() {
        const now = performance.now()
        setElapsed(prev => now - startRef.current + prev)
        startRef.current = now
        rafRef.current = requestAnimationFrame(loop)
      })
      setRunning(true)
    } else {
      cancelAnimationFrame(rafRef.current)
      setRunning(false)
    }
  }

  const handleReset = () => {
    cancelAnimationFrame(rafRef.current)
    setRunning(false)
    setElapsed(0)
    setLaps([])
  }

  // Laps and sound
  function playBeep(type = 'short') {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = type === 'short' ? 880 : 520
      g.gain.value = 0.05
      o.connect(g)
      g.connect(ctx.destination)
      o.start()
      setTimeout(() => {
        o.stop()
        ctx.close()
      }, type === 'short' ? 80 : 420)
    } catch (e) {
      // ignore audio errors
    }
  }

  const addLap = () => {
    setLaps(prev => {
      const next = [{ id: Date.now(), time: elapsed }, ...prev]
      return next
    })
    playBeep('short')
  }

  const clearLaps = () => setLaps([])

  // Timer logic
  useEffect(() => {
    setRemaining(timerValue)
  }, [timerValue])

  useEffect(() => {
    if (!timerRunning) return
    timerRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(timerRef.current)
          setTimerRunning(false)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [timerRunning])

  const startTimer = () => {
    if (remaining <= 0) setRemaining(timerValue)
    setTimerRunning(true)
  }
  const pauseTimer = () => setTimerRunning(false)
  const resetTimer = () => {
    setTimerRunning(false)
    setRemaining(timerValue)
  }

  // Simple animated progress for timer
  const timerPct = Math.max(0, Math.min(1, remaining / Math.max(1, timerValue)))

  return (
    <div className="clockwatch">
      <div className="controls">
        <button className={`mode-btn ${mode==='stopwatch'?'active':''}`} onClick={() => setMode('stopwatch')}>Stopwatch</button>
        <button className={`mode-btn ${mode==='timer'?'active':''}`} onClick={() => setMode('timer')}>Timer</button>
      </div>

      {mode === 'stopwatch' ? (
        <div className="panel stopwatch">
          <div className="dial">
            <div className="time-display">{formatTime(elapsed)}</div>
          </div>
          <div className="actions">
            <button className="big" onClick={handleStartStop}>{running ? 'Pause' : 'Start'}</button>
            <button className="ghost" onClick={addLap} disabled={!running}>Lap</button>
            <button className="ghost" onClick={handleReset}>Reset</button>
          </div>
          {laps.length > 0 && (
            <div className="laps">
              <div className="laps-head">
                <strong>Laps</strong>
                <button className="ghost" onClick={clearLaps}>Clear</button>
              </div>
              <ol>
                {laps.map(l => (
                  <li key={l.id}>{formatTime(l.time)}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      ) : (
        <div className="panel timer">
          <div className="timer-top">
            <div className="timer-display">{String(Math.floor(remaining/60)).padStart(2,'0')}:{String(remaining%60).padStart(2,'0')}</div>
            <div className="ring" style={{['--pct']: 1 - timerPct}} />
          </div>

          <div className="timer-setup">
            <label>Minutes:</label>
            <input type="number" min="0" value={Math.floor(timerValue/60)} onChange={e=>{const m=Math.max(0,Number(e.target.value)||0); setTimerValue(m*60)}} />
            <label>Seconds:</label>
            <input type="number" min="0" max="59" value={timerValue%60} onChange={e=>{const s=Math.max(0,Math.min(59,Number(e.target.value)||0)); setTimerValue(Math.floor(timerValue/60)*60 + s)}} />
          </div>

          <div className="actions">
            <button className="big" onClick={timerRunning?pauseTimer:startTimer}>{timerRunning ? 'Pause' : 'Start'}</button>
            <button className="ghost" onClick={resetTimer}>Reset</button>
          </div>
        </div>
      )}

      <div className="credit-wrap">
        <a className="credit-btn" href="https://github.com/NexusDev" target="_blank" rel="noreferrer">Created/Owned by NexusDev</a>
      </div>
    </div>
  )
}
