import { Link } from '@tanstack/react-router'
import { getTodayExerciseType, isLightestGymDay } from '../stores'

export function Dashboard() {
  const today = new Date()
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = today.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  })
  const exerciseType = getTodayExerciseType()
  const isLightDay = isLightestGymDay()

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <header className="mb-8">
        <p className="text-mid">{dayName}</p>
        <h1 className="text-2xl font-semibold text-primary">{dateStr}</h1>
      </header>

      {/* Today's scheduled habit */}
      <section className="mb-8">
        <div className="bg-accent-light p-4 rounded-lg border border-mid/20">
          <p className="text-sm text-mid mb-1">Today</p>
          <p className="font-medium text-primary">
            {exerciseType === 'yoga' && 'Yoga'}
            {exerciseType === 'gym' && (
              <>Gym{isLightDay && <span className="text-mid"> — lightest session</span>}</>
            )}
            {exerciseType === 'rest' && 'Yoga / Rest'}
          </p>
        </div>
      </section>

      {/* Quick access buttons */}
      <section className="mb-8 space-y-3">
        <button className="w-full py-3 px-4 bg-primary text-light rounded-lg text-left">
          Urge Protocol
        </button>
        <button className="w-full py-3 px-4 bg-mid/20 text-primary rounded-lg text-left">
          Collapse Handler
        </button>
      </section>

      {/* Navigation */}
      <nav className="grid grid-cols-2 gap-3">
        <Link
          to="/break"
          className="py-4 px-4 bg-accent-light rounded-lg text-center text-primary hover:bg-mid/10"
        >
          Break
        </Link>
        <Link
          to="/build"
          className="py-4 px-4 bg-accent-light rounded-lg text-center text-primary hover:bg-mid/10"
        >
          Build
        </Link>
        <Link
          to="/understand"
          className="py-4 px-4 bg-accent-light rounded-lg text-center text-primary hover:bg-mid/10"
        >
          Understand
        </Link>
        <Link
          to="/settings"
          className="py-4 px-4 bg-accent-light rounded-lg text-center text-primary hover:bg-mid/10"
        >
          Settings
        </Link>
      </nav>
    </div>
  )
}
