import { createFileRoute } from '@tanstack/react-router'
import { useHabitStore } from '../stores'

export const Route = createFileRoute('/break')({
  component: BreakHabits,
})

function BreakHabits() {
  const habits = useHabitStore((state) => state.getHabitsBySection('break'))

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
                <p className="text-sm text-mid mt-1">
                  Phase: {habit.current_phase.replace(/_/g, ' ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
