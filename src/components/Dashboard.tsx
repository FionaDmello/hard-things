import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { NightBeforePrompt } from './NightBeforePrompt'
import { WeeklyReview } from './WeeklyReview'
import { CollapseHandler } from './CollapseHandler'

export function Dashboard() {
  const [showCollapse, setShowCollapse] = useState(false)
  const today = new Date()
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = today.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-light">
      <div className="max-w-lg mx-auto px-6 pt-14 pb-20">

        {/* Editorial date header */}
        <header className="mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-mid mb-2">{dayName}</p>
          <h1
            className="text-primary leading-none"
            style={{ fontFamily: "'Cormorant', Georgia, serif", fontWeight: 300, fontSize: 'clamp(2.8rem, 10vw, 4rem)' }}
          >
            {dateStr}
          </h1>
          <div className="mt-8 h-px bg-mid/20" />
        </header>

        {/* Contextual prompts */}
        <NightBeforePrompt />
        <WeeklyReview />

        {/* Situational tools — for right now */}
        <section className="mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-mid mb-4">Right now</p>
          <div className="space-y-2">
            <button className="w-full py-4 px-5 bg-accent text-light rounded-xl text-left flex items-center justify-between group transition-opacity hover:opacity-90">
              <div>
                <p className="text-sm font-medium">Urge Protocol</p>
                <p className="text-xs mt-0.5 opacity-70">Running an urge right now</p>
              </div>
              <span className="opacity-60 group-hover:opacity-100 transition-opacity text-sm">→</span>
            </button>

            <button
              onClick={() => setShowCollapse(true)}
              className="w-full py-4 px-5 border border-mid/25 text-primary rounded-xl text-left flex items-center justify-between group hover:border-mid/50 transition-colors"
            >
              <div>
                <p className="text-sm font-medium">Collapse Handler</p>
                <p className="text-xs text-mid mt-0.5">Something slipped</p>
              </div>
              <span className="text-mid opacity-40 group-hover:opacity-80 transition-opacity text-sm">→</span>
            </button>
          </div>
        </section>

        {/* Primary navigation */}
        <nav>
          <p className="text-xs uppercase tracking-[0.2em] text-mid mb-4">Sections</p>
          <div className="space-y-2">

            <Link
              to="/break"
              className="flex items-center justify-between w-full py-5 px-5 bg-accent-light border border-mid/10 rounded-xl hover:border-mid/30 transition-colors group"
            >
              <div>
                <p className="font-medium text-primary">Break</p>
                <p className="text-xs text-mid mt-0.5 tracking-wide">Reduce · Investigate · Replace</p>
              </div>
              <span className="text-mid opacity-30 group-hover:opacity-70 transition-opacity text-sm">→</span>
            </Link>

            <Link
              to="/build"
              className="flex items-center justify-between w-full py-5 px-5 bg-accent-light border border-mid/10 rounded-xl hover:border-mid/30 transition-colors group"
            >
              <div>
                <p className="font-medium text-primary">Build</p>
                <p className="text-xs text-mid mt-0.5 tracking-wide">Minimum Viable Habit</p>
              </div>
              <span className="text-mid opacity-30 group-hover:opacity-70 transition-opacity text-sm">→</span>
            </Link>

            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/understand"
                className="py-4 px-4 bg-accent-light border border-mid/10 rounded-xl hover:border-mid/30 transition-colors group"
              >
                <p className="font-medium text-primary text-sm">Understand</p>
                <p className="text-xs text-mid mt-0.5">Patterns</p>
              </Link>

              <Link
                to="/settings"
                className="py-4 px-4 bg-accent-light border border-mid/10 rounded-xl hover:border-mid/30 transition-colors group"
              >
                <p className="font-medium text-primary text-sm">Settings</p>
                <p className="text-xs text-mid mt-0.5">Theme & account</p>
              </Link>
            </div>

          </div>
        </nav>

      </div>

      {showCollapse && <CollapseHandler onClose={() => setShowCollapse(false)} />}
    </div>
  )
}
