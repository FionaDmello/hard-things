import { useState } from 'react'
import type { Habit } from '../types/database'

interface Props {
  habit: Habit
}

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-mid/20 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex justify-between items-center p-3 text-left bg-accent-light hover:bg-mid/10"
      >
        <span className="text-sm font-medium text-primary">{title}</span>
        <span className="text-mid text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="p-3 space-y-2 text-sm text-primary leading-relaxed bg-light">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function HabitReferenceCard({ habit }: Props) {
  const [open, setOpen] = useState(false)

  // B1 discernment_question may be stored as JSON {"yoga":"...","gym":"..."}
  let discernmentContent: React.ReactNode
  try {
    const parsed = JSON.parse(habit.discernment_question)
    if (parsed.yoga && parsed.gym) {
      discernmentContent = (
        <div className="space-y-2">
          <p><span className="font-medium">Yoga days:</span> {parsed.yoga}</p>
          <p><span className="font-medium">Gym days:</span> {parsed.gym}</p>
        </div>
      )
    } else {
      discernmentContent = <p>{habit.discernment_question}</p>
    }
  } catch {
    discernmentContent = <p>{habit.discernment_question}</p>
  }

  // Group habit_versions by sub_habit for the build section
  const versionsBySubHabit = habit.habit_versions.reduce<Record<string, typeof habit.habit_versions>>(
    (acc, v) => {
      if (!acc[v.sub_habit]) acc[v.sub_habit] = []
      acc[v.sub_habit].push(v)
      return acc
    },
    {}
  )

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm text-mid hover:text-primary"
      >
        {open ? 'Hide reference' : 'View reference'}
      </button>

      {open && (
        <div className="mt-3 space-y-2">

          {/* Current phase — Section break only */}
          {habit.current_phase && (
            <CollapsibleSection title="Current phase">
              <p className="capitalize">{habit.current_phase.replace(/_/g, ' ')}</p>
              {habit.current_phase === 'phase_1_observe' && (
                <p className="text-mid">Observation phase — log every instance to identify patterns, triggers, and drivers before replacing.</p>
              )}
              {habit.current_phase === 'phase_2_replace' && (
                <p className="text-mid">Replacement phase — execute the replacement protocol every time an urge or instance occurs.</p>
              )}
              {habit.current_phase === 'phase_3_quit' && (
                <p className="text-mid">Quit phase — the replacement is the full response. The habit no longer has a sanctioned role.</p>
              )}
            </CollapsibleSection>
          )}

          {/* Drivers / jobs */}
          {habit.habit_drivers.length > 0 && (
            <CollapsibleSection title={habit.section === 'build' ? 'Why this habit' : 'The jobs this habit is doing'}>
              <ul className="space-y-2">
                {habit.habit_drivers.map((driver) => (
                  <li key={driver.key}>
                    <span className="font-medium">{driver.label}.</span>{' '}
                    {driver.description}
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Versions — Section build */}
          {habit.section === 'build' && Object.keys(versionsBySubHabit).length > 0 && (
            <CollapsibleSection title="The three versions">
              {Object.entries(versionsBySubHabit).map(([subHabit, versions]) => (
                <div key={subHabit} className="mb-3">
                  <p className="font-medium capitalize mb-1">{subHabit}</p>
                  <ul className="space-y-1 ml-2">
                    {versions.map((v) => (
                      <li key={v.level}>
                        <span className="font-medium capitalize">{v.level.replace(/_/g, ' ')}:</span>{' '}
                        {v.description}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CollapsibleSection>
          )}

          {/* Replacements — Section break */}
          {habit.section === 'break' && habit.habit_drivers.some((d) => d.replacement) && (
            <CollapsibleSection title="Replacement strategies">
              <ul className="space-y-2">
                {habit.habit_drivers.map((driver) => (
                  <li key={driver.key}>
                    <span className="font-medium">{driver.label}:</span>{' '}
                    {driver.replacement}
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Distress tolerance layer */}
          {habit.distress_tolerance && (
            <CollapsibleSection title="Distress tolerance layer">
              <p>{habit.distress_tolerance}</p>
            </CollapsibleSection>
          )}

          {/* Discernment question */}
          {habit.discernment_question && (
            <CollapsibleSection title="Discernment question">
              {discernmentContent}
            </CollapsibleSection>
          )}

        </div>
      )}
    </div>
  )
}
