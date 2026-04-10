import { useState } from 'react'
import type { AnyHabit } from '../types/database'

interface Props {
  habit: AnyHabit
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

function PracticeLevelsSection({ practice }: { practice: { full_description: string; minimum_description: string; non_negotiable: string } }) {
  return (
    <ul className="space-y-1">
      <li><span className="font-medium">Full:</span> {practice.full_description}</li>
      <li><span className="font-medium">Minimum:</span> {practice.minimum_description}</li>
      <li><span className="font-medium">Non-negotiable:</span> {practice.non_negotiable}</li>
    </ul>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function HabitReferenceCard({ habit }: Props) {
  const [open, setOpen] = useState(false)

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

          {/* Current phase — break habits only */}
          {habit.section === 'break' && habit.current_phase && (
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

          {/* Drivers — break habits */}
          {habit.section === 'break' && habit.habit_drivers.length > 0 && (
            <CollapsibleSection title="The jobs this habit is doing">
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

          {/* Replacements — break habits */}
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

          {/* Practice levels — simple build habit */}
          {habit.section === 'build' && habit.practice && (
            <CollapsibleSection title="The three versions">
              <PracticeLevelsSection practice={habit.practice} />
            </CollapsibleSection>
          )}

          {/* Practice levels — sub-habit build habit */}
          {habit.section === 'build' && habit.sub_habits && (
            <CollapsibleSection title="The three versions">
              {Object.entries(habit.sub_habits).map(([subHabit, data]) => (
                <div key={subHabit} className="mb-3">
                  <p className="font-medium capitalize mb-1">{subHabit}</p>
                  <div className="ml-2">
                    <PracticeLevelsSection practice={data} />
                  </div>
                </div>
              ))}
            </CollapsibleSection>
          )}

          {/* Distress tolerance */}
          {habit.distress_tolerance && (
            <CollapsibleSection title="Distress tolerance layer">
              <p>{habit.distress_tolerance}</p>
            </CollapsibleSection>
          )}

          {/* Discernment question — break habits and simple build habits */}
          {habit.discernment_question && (
            <CollapsibleSection title="Discernment question">
              <p>{habit.discernment_question}</p>
            </CollapsibleSection>
          )}

          {/* Discernment questions — sub-habit build habits */}
          {habit.section === 'build' && habit.sub_habits && (
            <CollapsibleSection title="Discernment questions">
              {Object.entries(habit.sub_habits).map(([subHabit, data]) => (
                <div key={subHabit} className="mb-2">
                  <p className="font-medium capitalize">{subHabit}</p>
                  <p className="text-mid">{data.discernment_question}</p>
                </div>
              ))}
            </CollapsibleSection>
          )}

        </div>
      )}
    </div>
  )
}
