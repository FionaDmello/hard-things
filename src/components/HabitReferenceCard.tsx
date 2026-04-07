import { useState } from 'react'
import type { Database } from '../types/database'

type Habit = Database['public']['Tables']['habits']['Row']

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

// ─── Static per-habit content ────────────────────────────────────────────────

const STATIC: Record<string, {
  jobs: { key: string; label: string; description: string }[]
  distanceTolerance: string
}> = {
  'Smoking': {
    jobs: [
      { key: 'morning_anchor',        label: 'Morning anchor',        description: 'The cigarette that starts the day — ritual, orientation, the first moment of quiet.' },
      { key: 'meal_closure',          label: 'Meal closure',          description: 'The signal that a meal or a break is complete. Permission to stop.' },
      { key: 'stress_valve',          label: 'Stress valve',          description: 'A release when the pressure has built to a point where something has to give.' },
      { key: 'legitimate_exit',       label: 'Legitimate exit',       description: 'A socially acceptable reason to leave a situation, a room, a conversation.' },
      { key: 'uncomplicated_pleasure',label: 'Uncomplicated pleasure','description': 'Something that is just for you, with no performance or justification required.' },
    ],
    distanceTolerance: 'The urge will peak and pass. Ten minutes is the window. Go to the location, run the protocol, wait it out. The craving is not a command.',
  },
  'Avoidance & Procrastination': {
    jobs: [
      { key: 'failure_fear',    label: 'Failure fear',    description: 'The task feels like a test of worth, not a task. Starting risks confirming something about yourself.' },
      { key: 'overwhelm',       label: 'Overwhelm',       description: 'The full scope is visible all at once. There is no entry point, only the whole thing.' },
      { key: 'emotional_weight',label: 'Emotional weight','description': 'Something underneath the task — grief, resentment, dread — makes beginning feel impossible.' },
      { key: 'pointlessness',   label: 'Pointlessness',   description: 'The task feels disconnected from anything that matters. The effort has no visible destination.' },
    ],
    distanceTolerance: 'Find the entry point only. Not the task — the first physical action. Write one line. Open one file. Set a twenty-five minute timer and stop when it ends.',
  },
  'Exercise': {
    jobs: [
      { key: 'consistency',   label: 'Build consistency',    description: 'Show up on schedule regardless of motivation. The practice becomes the habit.' },
      { key: 'minimum',       label: 'Honour the minimum',   description: 'The non-negotiable version counts. A small version done is better than a full version skipped.' },
      { key: 'momentum',      label: 'Protect momentum',     description: 'Each session makes the next one easier to start. Missing makes missing easier.' },
    ],
    distanceTolerance: 'The non-negotiable exists for this moment. It is the floor, not the ceiling. Clothes on, mat out, or walk to the door — begin there.',
  },
}

// ─── Component ───────────────────────────────────────────────────────────────

export function HabitReferenceCard({ habit }: Props) {
  const [open, setOpen] = useState(false)
  const static_ = STATIC[habit.name]
  const versions = habit.versions as Record<string, Record<string, string>>
  const replacements = habit.replacements as Record<string, string>

  // B1 discernment_question is stored as JSON {"yoga":"...","gym":"..."}
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

          {/* Jobs */}
          {static_ && (
            <CollapsibleSection title={habit.section === 'build' ? 'Why this habit' : 'The jobs this habit is doing'}>
              <ul className="space-y-2">
                {static_.jobs.map((job) => (
                  <li key={job.key}>
                    <span className="font-medium">{job.label}.</span>{' '}
                    {job.description}
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Versions — Section build */}
          {habit.section === 'build' && Object.keys(versions).length > 0 && (
            <CollapsibleSection title="The three versions">
              {Object.entries(versions).map(([subHabit, levels]) => (
                <div key={subHabit} className="mb-3">
                  <p className="font-medium capitalize mb-1">{subHabit}</p>
                  <ul className="space-y-1 ml-2">
                    {Object.entries(levels).map(([level, description]) => (
                      <li key={level}>
                        <span className="font-medium capitalize">{level.replace('_', ' ')}:</span>{' '}
                        {description}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CollapsibleSection>
          )}

          {/* Replacements — Section break */}
          {habit.section === 'break' && Object.keys(replacements).length > 0 && (
            <CollapsibleSection title="Replacement strategies">
              <ul className="space-y-2">
                {Object.entries(replacements).map(([job, replacement]) => (
                  <li key={job}>
                    <span className="font-medium capitalize">{job.replace(/_/g, ' ')}:</span>{' '}
                    {replacement}
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Distress tolerance layer */}
          {static_ && (
            <CollapsibleSection title="Distress tolerance layer">
              <p>{static_.distanceTolerance}</p>
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
