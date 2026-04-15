import { useState, useEffect } from 'react'

type TomorrowType = 'yoga' | 'gym' | 'rest'

const TOMORROW: Record<number, TomorrowType> = {
  0: 'yoga',
  1: 'gym',
  2: 'gym',
  3: 'gym',
  4: 'yoga',
  5: 'yoga',
  6: 'rest',
}

const STORAGE_KEY = 'night_before_dismissed'

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function isDismissed() {
  return localStorage.getItem(STORAGE_KEY) === getTodayKey()
}

function dismiss() {
  localStorage.setItem(STORAGE_KEY, getTodayKey())
}

export function NightBeforePrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const hour = new Date().getHours()
    const tomorrow = TOMORROW[new Date().getDay()]
    if (hour >= 18 && tomorrow !== 'rest' && !isDismissed()) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  const tomorrow = TOMORROW[new Date().getDay()]
  const isGym = tomorrow === 'gym'

  return (
    <section className="mb-10">
      <p className="eyebrow mb-3">Tonight</p>
      <div style={{
        backgroundColor: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: '0.75rem',
        padding: '20px',
      }}>
        <p style={{
          fontFamily: "'Cormorant', Georgia, serif",
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: '1.15rem',
          color: 'var(--color-primary)',
          marginBottom: '6px',
        }}>
          {isGym ? 'Gym tomorrow.' : 'Yoga tomorrow.'}
        </p>
        <p style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 300,
          fontSize: '13px',
          color: 'var(--color-mid)',
          marginBottom: '16px',
        }}>
          {isGym ? 'Day bag packed? Both bags at the door?' : 'Clothes on top of phone?'}
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => { dismiss(); setVisible(false) }}
            style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontWeight: 500,
              fontSize: '12px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            Done
          </button>
          <button
            onClick={() => { dismiss(); setVisible(false) }}
            style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontWeight: 400,
              fontSize: '12px',
              color: 'var(--color-mid)',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </section>
  )
}
