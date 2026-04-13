import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { HabitReferenceCard } from '../components/HabitReferenceCard'
import { CheckInFormBreak } from '../components/CheckInFormBreak'
import type { BreakHabit } from '../types/database'

export const Route = createFileRoute('/break')({
  component: BreakHabits,
})

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
    <div className="max-w-lg mx-auto px-6 pt-14 pb-24">
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-mid hover:text-primary transition-colors mb-10">
        <span>←</span>
        <span className="uppercase tracking-[0.15em]">Dashboard</span>
      </Link>

      <header className="mb-10">
        <h1
          className="text-primary leading-tight"
          style={{ fontFamily: "'Cormorant', Georgia, serif", fontWeight: 300, fontSize: 'clamp(2.4rem, 8vw, 3.2rem)' }}
        >
          Break
        </h1>
        <p className="text-xs uppercase tracking-[0.2em] text-mid mt-2">Reduce · Investigate · Replace</p>
        <div className="mt-6 h-px bg-mid/20" />
      </header>

      {habits.length === 0 ? (
        <p className="text-mid">No habits configured yet.</p>
      ) : (
        <div className="space-y-4">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="bg-accent-light p-4 rounded-lg border border-mid/20"
            >
              <h2 className="font-medium text-primary">{habit.name}</h2>
              {habit.current_phase && (
                <p className="text-sm text-mid mt-1 capitalize">
                  {habit.current_phase.replace(/_/g, ' ')}
                </p>
              )}
              <CheckInFormBreak habit={habit} />
              <HabitReferenceCard habit={habit} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
