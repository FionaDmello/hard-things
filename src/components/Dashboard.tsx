import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { NightBeforePrompt } from './NightBeforePrompt'
import { CollapseHandler } from './CollapseHandler'
import { UrgeProtocol } from './UrgeProtocol'
import { CheckInFormBreak } from './CheckInFormBreak'
import { CheckInFormBuild } from './CheckInFormBuild'
import type { BreakHabit, BuildHabit } from '../types/database'

const PHASE_LABELS: Record<string, string> = {
  phase_1_observe: 'Observing',
  phase_2_replace: 'Replacing',
  phase_3_quit:    'Quitting',
}

const card: React.CSSProperties = {
  backgroundColor: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '0.75rem',
}

const cardAccent: React.CSSProperties = {
  backgroundColor: 'var(--color-canvas)',
  borderRadius: '0.75rem',
}

export function Dashboard() {
  const [showCollapse, setShowCollapse] = useState(false)
  const [showUrge, setShowUrge] = useState(false)

  const today = new Date()
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  const { data: breakHabits = [] } = useQuery({
    queryKey: ['habits', 'break'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_break_habits')
      if (error) throw error
      return (data ?? []) as BreakHabit[]
    },
  })

  const { data: buildHabits = [] } = useQuery({
    queryKey: ['habits', 'build'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_build_habits')
      if (error) throw error
      return (data ?? []) as BuildHabit[]
    },
  })

  const hasHabits = breakHabits.length > 0 || buildHabits.length > 0

  return (
    <div className="max-w-lg mx-auto px-6 pt-24 pb-24">

      {/* Date header */}
      <header className="mb-10">
        <p className="eyebrow mb-2">{dayName}</p>
        <h1
          className="display"
          style={{ fontSize: 'clamp(2.8rem, 10vw, 4rem)' }}
        >
          {dateStr}
        </h1>
      </header>

      {/* Right now — crisis tools */}
      <section className="mb-10">
        <p className="eyebrow mb-3">Right now</p>
        <div className="space-y-2">

          {/* Urge Protocol — accent-warm card */}
          <button
            onClick={() => setShowUrge(true)}
            style={{
              ...cardAccent,
              width: '100%',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              background: 'none',
              textAlign: 'left',
            }}
            className="card-accent"
          >
            <div>
              <p style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontWeight: 500,
                fontSize: '15px',
                color: 'var(--color-primary)',
              }}>
                Urge Protocol
              </p>
              <p style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontWeight: 400,
                fontSize: '12px',
                color: 'var(--color-mid)',
                marginTop: '2px',
              }}>
                Running an urge right now
              </p>
            </div>
            <span style={{ color: 'var(--color-accent)', fontSize: '14px', opacity: 0.7 }}>→</span>
          </button>

          {/* Collapse Handler — standard card */}
          <button
            onClick={() => setShowCollapse(true)}
            style={{
              ...card,
              width: '100%',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              background: 'var(--color-card)',
              textAlign: 'left',
            }}
          >
            <div>
              <p style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontWeight: 500,
                fontSize: '15px',
                color: 'var(--color-primary)',
              }}>
                Collapse Handler
              </p>
              <p style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontWeight: 400,
                fontSize: '12px',
                color: 'var(--color-mid)',
                marginTop: '2px',
              }}>
                Something slipped
              </p>
            </div>
            <span style={{ color: 'var(--color-mid)', fontSize: '14px', opacity: 0.5 }}>→</span>
          </button>

        </div>
      </section>

      {/* Tonight — conditional, NightBeforePrompt handles its own visibility */}
      <NightBeforePrompt />

      {/* Today's habits — inline check-ins */}
      {hasHabits && (
        <section className="mb-10">
          <p className="eyebrow mb-3">Today</p>
          <div className="space-y-3">

            {breakHabits.map((habit) => (
              <div key={habit.id} style={{ ...card, padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '4px' }}>
                  <h2
                    style={{
                      fontFamily: "'Cormorant', Georgia, serif",
                      fontStyle: 'italic',
                      fontWeight: 300,
                      fontSize: '1.2rem',
                      color: 'var(--color-primary)',
                      lineHeight: 1.2,
                    }}
                  >
                    {habit.name}
                  </h2>
                  {habit.current_phase && (
                    <span className="eyebrow" style={{ color: 'var(--color-mid)', flexShrink: 0, paddingTop: '3px' }}>
                      {PHASE_LABELS[habit.current_phase]}
                    </span>
                  )}
                </div>
                <CheckInFormBreak habit={habit} />
              </div>
            ))}

            {buildHabits.map((habit) => (
              <div key={habit.id} style={{ ...card, padding: '20px' }}>
                <h2
                  style={{
                    fontFamily: "'Cormorant', Georgia, serif",
                    fontStyle: 'italic',
                    fontWeight: 300,
                    fontSize: '1.2rem',
                    color: 'var(--color-primary)',
                    lineHeight: 1.2,
                    marginBottom: '4px',
                  }}
                >
                  {habit.name}
                </h2>
                <CheckInFormBuild habit={habit} />
              </div>
            ))}

          </div>
        </section>
      )}

      {showUrge && <UrgeProtocol onClose={() => setShowUrge(false)} />}
      {showCollapse && <CollapseHandler onClose={() => setShowCollapse(false)} />}
    </div>
  )
}
