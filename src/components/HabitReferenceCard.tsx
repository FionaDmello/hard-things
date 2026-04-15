import { useState } from 'react'
import type { AnyHabit } from '../types/database'

interface Props {
  habit: AnyHabit
}

export function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-mid/15 last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex justify-between items-center py-3 text-left group"
      >
        <span className="text-sm text-primary group-hover:text-accent transition-colors pr-4">{title}</span>
        <span
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-mid transition-transform duration-200"
          style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          +
        </span>
      </button>
      {open && (
        <div className="mt-1 mb-4">
          <div
            className="py-3 pl-4 space-y-3 text-sm text-primary leading-relaxed"
            style={{ borderLeft: '2px solid var(--color-accent)', opacity: 0.9 }}
          >
            {children}
          </div>
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
    <div className="mt-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex justify-between items-center py-2 text-left group"
      >
        <span className="text-xs uppercase tracking-[0.2em] text-mid group-hover:text-primary transition-colors">
          Reference
        </span>
        <span
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-mid transition-transform duration-200"
          style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          +
        </span>
      </button>

      {open && (
        <div className="mt-1 space-y-0">

          {/* Current phase — break habits only */}
          {habit.section === 'break' && habit.current_phase && (
            <CollapsibleSection title="Current phase">
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
          {habit.section === 'break' && habit.habit_drivers.some((d) => d.replacements.length > 0) && (
            <CollapsibleSection title="Replacement strategies">
              <ul className="space-y-3">
                {habit.habit_drivers.filter((d) => d.replacements.length > 0).map((driver) => (
                  <li key={driver.key}>
                    <span className="font-medium">{driver.label}:</span>
                    <ul className="mt-1 space-y-1 pl-3">
                      {driver.replacements.map((r) => (
                        <li key={r} className="text-mid">— {r}</li>
                      ))}
                    </ul>
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
