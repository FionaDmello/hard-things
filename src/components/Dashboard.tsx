import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { NightBeforePrompt } from './NightBeforePrompt'
import { CollapseHandler } from './CollapseHandler'
import { UrgeProtocol } from './UrgeProtocol'
import { CheckInFormBreak } from './CheckInFormBreak'
import { CheckInFormBuild } from './CheckInFormBuild'
import type { BreakHabit, BuildHabit } from '../types/database'

const PHASE_LABELS: Record<string, string> = {
  phase_1_observe: 'Observing',
  phase_2_replace: 'Replacing',
  phase_3_quit:    'Quitting',
}

export function Dashboard() {
  const [showCollapse, setShowCollapse] = useState(false)
  const [showUrge, setShowUrge] = useState(false)

  const today = new Date()
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' })
  const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  const { data: breakHabits = [] } = useQuery({
    queryKey: ['habits', 'break'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_break_habits')
      if (error) throw error
      return (data ?? []) as BreakHabit[]
    },
  })

  const { data: buildHabits = [] } = useQuery({
    queryKey: ['habits', 'build'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_build_habits')
      if (error) throw error
      return (data ?? []) as BuildHabit[]
    },
  })

  const hasHabits = breakHabits.length > 0 || buildHabits.length > 0

  return (
    <div className="max-w-lg mx-auto px-6 pt-24 pb-24">

      {/* Date header */}
      <header className="mb-10">
        <p className="eyebrow mb-2">{dayName}</p>
        <h1 className="display" style={{ fontSize: 'clamp(2.8rem, 10vw, 4rem)' }}>
          {dateStr}
        </h1>
      </header>

      {/* Right now — crisis tools */}
      <section className="mb-10">
        <p className="eyebrow mb-3">Right now</p>
        <div className="flex flex-col gap-2">

          <button
            onClick={() => setShowUrge(true)}
            className="card-accent w-full flex items-center justify-between p-5 cursor-pointer text-left bg-transparent border-none"
          >
            <div>
              <p className="font-sans font-medium text-[15px] text-primary">Urge Protocol</p>
              <p className="font-sans font-normal text-xs text-mid mt-0.5">Running an urge right now</p>
            </div>
            <span className="text-accent text-sm opacity-70">→</span>
          </button>

          <button
            onClick={() => setShowCollapse(true)}
            className="card w-full flex items-center justify-between px-5 py-4 cursor-pointer text-left bg-transparent border-none"
          >
            <div>
              <p className="font-sans font-medium text-[15px] text-primary">Collapse Handler</p>
              <p className="font-sans font-normal text-xs text-mid mt-0.5">Something slipped</p>
            </div>
            <span className="text-mid text-sm opacity-50">→</span>
          </button>

        </div>
      </section>

      {/* Tonight */}
      <NightBeforePrompt />

      {/* Today's habits */}
      {hasHabits && (
        <section className="mb-10">
          <p className="eyebrow mb-3">Today</p>
          <div className="flex flex-col gap-3">

            {breakHabits.map((habit) => (
              <div key={habit.id} className="card p-5">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h2
                    className="font-display italic font-light text-[1.2rem] text-primary leading-tight"
                  >
                    {habit.name}
                  </h2>
                  {habit.current_phase && (
                    <span className="eyebrow text-mid shrink-0 pt-0.5">
                      {PHASE_LABELS[habit.current_phase]}
                    </span>
                  )}
                </div>
                <CheckInFormBreak habit={habit} />
              </div>
            ))}

            {buildHabits.map((habit) => (
              <div key={habit.id} className="card p-5">
                <h2 className="font-display italic font-light text-[1.2rem] text-primary leading-tight mb-1">
                  {habit.name}
                </h2>
                <CheckInFormBuild habit={habit} />
              </div>
            ))}

          </div>
        </section>
      )}

      {showUrge && <UrgeProtocol onClose={() => setShowUrge(false)} />}
      {showCollapse && <CollapseHandler onClose={() => setShowCollapse(false)} />}
    </div>
  )
}
