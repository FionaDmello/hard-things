import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { HabitReferenceCard } from '../components/HabitReferenceCard'
import { CheckInFormBuild } from '../components/CheckInFormBuild'
import type { BuildHabit } from '../types/database'

export const Route = createFileRoute('/build')({
  component: BuildHabits,
})

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
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-2">
        Habits to Build
      </h1>
      <p className="text-mid mb-8">Minimum Viable Habit protocol</p>

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
              <CheckInFormBuild habit={habit} />
              <HabitReferenceCard habit={habit} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
