import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { HabitReferenceCard } from '../components/HabitReferenceCard'
import { CheckInFormBuild } from '../components/CheckInFormBuild'
import type { BuildHabit } from '../types/database'

export const Route = createFileRoute('/build')({
  component: BuildHabits,
})

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function BuildHabits() {
  const { data: habits = [], isLoading } = useQuery({
    queryKey: ['habits', 'build'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_build_habits')
      if (error) throw error
      return (data ?? []) as BuildHabit[]
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
        <p className="eyebrow mb-2">Build</p>
        <h1
          className="display"
          style={{ fontSize: 'clamp(2.4rem, 8vw, 3.2rem)' }}
        >
          Minimum Viable Habit
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

function HabitSection({ habit }: { habit: BuildHabit }) {
  return (
    <div>
      {/* Habit header */}
      <h2
        className="display"
        style={{ fontSize: 'clamp(1.5rem, 5vw, 1.9rem)', marginBottom: '8px' }}
      >
        {habit.name}
      </h2>

      {/* Schedule — if sub-habits */}
      {habit.sub_habits && Object.keys(habit.habit_schedule).length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <p className="eyebrow" style={{ marginBottom: '10px' }}>Schedule</p>
          <div style={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.75rem',
            padding: '16px 20px',
          }}>
            <div className="space-y-2">
              {Object.entries(habit.habit_schedule).map(([dayIndex, subHabit]) => (
                <div
                  key={dayIndex}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <span style={{
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontWeight: 400,
                    fontSize: '13px',
                    color: 'var(--color-mid)',
                  }}>
                    {DAY_NAMES[Number(dayIndex)] ?? dayIndex}
                  </span>
                  <span style={{
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    fontWeight: 500,
                    fontSize: '13px',
                    color: 'var(--color-primary)',
                    textTransform: 'capitalize',
                  }}>
                    {subHabit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Check-in */}
      <div style={{
        backgroundColor: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: '0.75rem',
        padding: '20px',
        marginBottom: '12px',
      }}>
        <CheckInFormBuild habit={habit} />
      </div>

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
