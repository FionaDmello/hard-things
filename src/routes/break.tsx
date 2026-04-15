import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { HabitReferenceCard } from '../components/HabitReferenceCard'
import { ObservationLogger } from '../components/ObservationLogger'
import type { BreakHabit } from '../types/database'

export const Route = createFileRoute('/break')({
  component: BreakHabits,
})

const PHASE_LABELS: Record<string, string> = {
  phase_1_observe: 'Observing',
  phase_2_replace: 'Replacing',
  phase_3_quit:    'Quitting',
}

const PHASE_DESCRIPTION: Record<string, string> = {
  phase_1_observe: 'Log every instance. The goal is to identify patterns, triggers, and what job the habit is doing — not to stop yet.',
  phase_2_replace: 'Execute the replacement protocol when an urge or instance occurs. The habit still happens; the replacement is practised alongside it.',
  phase_3_quit:    'The replacement is the full response. The habit no longer has a sanctioned role.',
}

function BreakHabits() {
  const { data: habits = [], isLoading } = useQuery({
    queryKey: ['habits', 'break'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_break_habits')
      if (error) throw error
      return (data ?? []) as BreakHabit[]
    },
  })

  if (isLoading) return null

  return (
    <div className="max-w-lg mx-auto px-6 pt-24 pb-24">

      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 400,
          fontSize: '12px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-mid)',
          textDecoration: 'none',
          marginBottom: '40px',
        }}
      >
        <span>←</span>
        <span>Today</span>
      </Link>

      <header className="mb-10">
        <p className="eyebrow mb-2">Break</p>
        <h1
          className="display"
          style={{ fontSize: 'clamp(2.4rem, 8vw, 3.2rem)' }}
        >
          Reduce · Investigate · Replace
        </h1>
      </header>

      {habits.length === 0 ? (
        <p style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 300,
          fontSize: '14px',
          color: 'var(--color-mid)',
          fontStyle: 'italic',
        }}>
          Nothing configured yet.
        </p>
      ) : (
        <div className="space-y-8">
          {habits.map((habit) => (
            <HabitSection key={habit.id} habit={habit} />
          ))}
        </div>
      )}
    </div>
  )
}

function HabitSection({ habit }: { habit: BreakHabit }) {
  const phase = habit.current_phase

  return (
    <div>
      {/* Habit header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '8px',
      }}>
        <h2
          className="display"
          style={{ fontSize: 'clamp(1.5rem, 5vw, 1.9rem)' }}
        >
          {habit.name}
        </h2>
        {phase && (
          <span className="eyebrow" style={{ color: 'var(--color-mid)', paddingTop: '4px', flexShrink: 0 }}>
            {PHASE_LABELS[phase]}
          </span>
        )}
      </div>

      {/* Phase description */}
      {phase && PHASE_DESCRIPTION[phase] && (
        <p style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 300,
          fontSize: '13px',
          color: 'var(--color-mid)',
          lineHeight: 1.6,
          marginBottom: '20px',
        }}>
          {PHASE_DESCRIPTION[phase]}
        </p>
      )}

      {/* Observation logger — phase 1 only */}
      {phase === 'phase_1_observe' && (
        <div style={{
          backgroundColor: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: '0.75rem',
          padding: '20px',
          marginBottom: '12px',
        }}>
          <ObservationLogger habit={habit} />
        </div>
      )}

      {/* Reference card */}
      <div style={{
        backgroundColor: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: '0.75rem',
        padding: '20px',
      }}>
        <HabitReferenceCard habit={habit} />
      </div>
    </div>
  )
}
