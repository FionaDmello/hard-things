import { createFileRoute } from '@tanstack/react-router'
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
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-2">
        Habits to Break
      </h1>
      <p className="text-mid mb-8">Reduce, Investigate, Replace protocol</p>

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
