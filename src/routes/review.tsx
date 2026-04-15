import { createFileRoute, Link } from '@tanstack/react-router'
import { WeeklyReview } from '../components/WeeklyReview'

export const Route = createFileRoute('/review')({
  component: ReviewRoute,
})

function ReviewRoute() {
  const today = new Date()
  const isSunday = today.getDay() === 0
  const weekLabel = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

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
        <p className="eyebrow mb-2">{isSunday ? 'Sunday' : weekLabel}</p>
        <h1
          className="display"
          style={{ fontSize: 'clamp(2.4rem, 8vw, 3.2rem)' }}
        >
          Weekly Review
        </h1>
      </header>

      <WeeklyReview />

    </div>
  )
}
