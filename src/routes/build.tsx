import { createFileRoute } from '@tanstack/react-router'
import { useHabitStore } from '../stores'

export const Route = createFileRoute('/build')({
  component: BuildHabits,
})

function BuildHabits() {
  const habits = useHabitStore((state) => state.getHabitsBySection('B'))

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
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
