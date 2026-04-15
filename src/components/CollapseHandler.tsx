import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores'
import type { AnyHabit, BreakHabit, BuildHabit } from '../types/database'

interface Props {
  habit?: AnyHabit
  onClose: () => void
  entryAnimation?: string
}

const WHAT_GAVE_WAY_OPTIONS = [
  'Distress tolerance was low',
  'Logistics got in the way',
  'Emotional load was too high',
  'Not sure',
]

type Step = 'entry' | 1 | 2 | 3 | 'closing'
type Direction = 'forward' | 'back'
type ClosingVariant = 'break' | 'build_return' | 'build_rest'

const CLOSING_LINES: Record<ClosingVariant, [string, string]> = {
  break:        ['The slip is logged.', 'You came back to the protocol. That\'s the work.'],
  build_return: ['Returned at the minimum.', 'That\'s what the non-negotiable is for. It held.'],
  build_rest:   ['Logged.', 'Rest without judgment. Return tomorrow.'],
}

// ─── Overlay ──────────────────────────────────────────────────────────────────

export function CollapseHandler({ habit: initialHabit, onClose, entryAnimation }: Props) {
  const [selectedHabit, setSelectedHabit] = useState<AnyHabit | null>(initialHabit ?? null)

  const { data: breakHabits = [] } = useQuery({
    queryKey: ['habits', 'break'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_break_habits')
      if (error) throw error
      return (data ?? []) as BreakHabit[]
    },
    enabled: !initialHabit,
  })

  const { data: buildHabits = [] } = useQuery({
    queryKey: ['habits', 'build'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_build_habits')
      if (error) throw error
      return (data ?? []) as BuildHabit[]
    },
    enabled: !initialHabit,
  })

  const user = useAuthStore((state) => state.user)
  const allHabits: AnyHabit[] = [...breakHabits, ...buildHabits]

  return (
    <div
      className="fixed inset-0 bg-canvas z-50 overflow-y-auto"
      style={{ animation: entryAnimation ?? 'slide-up 320ms cubic-bezier(0.32, 0.72, 0, 1)' }}
    >
      <div className="max-w-[430px] mx-auto px-6 pt-14 pb-24">
        {!selectedHabit ? (
          <HabitPicker habits={allHabits} onSelect={setSelectedHabit} onClose={onClose} />
        ) : selectedHabit.section === 'build' ? (
          <BuildCollapseFlow habit={selectedHabit} userId={user!.id} onClose={onClose} />
        ) : (
          <BreakCollapseFlow habit={selectedHabit} userId={user!.id} onClose={onClose} />
        )}
      </div>
    </div>
  )
}

// ─── Habit Picker ─────────────────────────────────────────────────────────────

function HabitPicker({ habits, onSelect, onClose }: {
  habits: AnyHabit[]
  onSelect: (h: AnyHabit) => void
  onClose: () => void
}) {
  return (
    <div className="animate-[fade-in_250ms_ease-out]">
      <button onClick={onClose} className="inline-flex items-center gap-1.5 btn-secondary mb-10">
        <span>←</span><span>Close</span>
      </button>

      <header className="mb-10">
        <p className="eyebrow mb-2.5">Collapse Handler</p>
        <h1 className="font-display italic font-light text-primary leading-tight mb-2" style={{ fontSize: 'clamp(2.2rem, 7vw, 3rem)' }}>
          Something slipped.
        </h1>
        <p className="font-sans font-light text-[13px] text-mid">Which habit?</p>
      </header>

      <div className="flex flex-col gap-2">
        {habits.map((habit) => (
          <button
            key={habit.id}
            onClick={() => onSelect(habit)}
            className="card w-full flex items-center justify-between p-5 cursor-pointer text-left bg-transparent border-none"
          >
            <div>
              <p className="font-sans font-medium text-[15px] text-primary">{habit.name}</p>
              <p className="font-sans font-medium text-[10px] tracking-[0.15em] uppercase text-mid mt-0.5">
                {habit.section === 'break' ? 'Break' : 'Build'}
              </p>
            </div>
            <span className="text-mid text-sm opacity-50">→</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Entry Screen ─────────────────────────────────────────────────────────────

function EntryScreen({ habitName, onContinue, onClose }: {
  habitName: string
  onContinue: () => void
  onClose: () => void
}) {
  return (
    <div className="animate-[fade-in_300ms_ease-out]">
      <button onClick={onClose} className="inline-flex items-center gap-1.5 btn-secondary mb-10">
        <span>←</span><span>Close</span>
      </button>

      <div className="flex flex-col min-h-[55vh] justify-center">
        <p className="font-sans font-medium text-[11px] tracking-[0.18em] uppercase text-mid mb-6">
          {habitName}
        </p>
        <h1 className="font-display italic font-light text-primary leading-snug mb-10" style={{ fontSize: 'clamp(2rem, 7vw, 2.8rem)' }}>
          It happened.<br />
          You opened this.<br />
          That's already the turn.
        </h1>
        <button className="btn-primary self-end" onClick={onContinue}>Continue →</button>
      </div>
    </div>
  )
}

// ─── Step Wrapper ─────────────────────────────────────────────────────────────

function StepWrapper({ direction, children }: { direction: Direction; children: React.ReactNode }) {
  return (
    <div style={{ animation: `${direction === 'forward' ? 'slide-in-right' : 'slide-in-left'} 280ms ease-out` }}>
      {children}
    </div>
  )
}

// ─── Step Header ──────────────────────────────────────────────────────────────

function StepHeader({ habitName, stepLabel, onBack, onClose }: {
  habitName: string
  stepLabel: string
  onBack?: () => void
  onClose: () => void
}) {
  return (
    <div className="mb-10">
      <button
        onClick={onBack ?? onClose}
        className="inline-flex items-center gap-1.5 btn-secondary mb-8"
      >
        <span>←</span>
        <span>{onBack ? 'Back' : 'Close'}</span>
      </button>
      <p className="font-sans font-medium text-[11px] tracking-[0.18em] uppercase text-mid mb-1">
        {habitName}
      </p>
      <p className="font-sans font-normal text-[11px] text-mid opacity-60 mb-4">
        {stepLabel}
      </p>
      <div className="h-px bg-border" />
    </div>
  )
}

// ─── Closing Screen ───────────────────────────────────────────────────────────

function ClosingScreen({ variant, onClose }: { variant: ClosingVariant; onClose: () => void }) {
  const [showLine2, setShowLine2] = useState(false)
  const [line1, line2] = CLOSING_LINES[variant]
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const t1 = setTimeout(() => setShowLine2(true), 700)
    const t2 = setTimeout(() => onCloseRef.current(), 1400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div
      onClick={onClose}
      className="flex flex-col min-h-[60vh] justify-center cursor-pointer animate-[fade-in_300ms_ease-out]"
    >
      <p
        className="font-display italic font-light text-primary leading-snug mb-5 animate-[fade-in_300ms_ease-out]"
        style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)' }}
      >
        {line1}
      </p>
      <p
        className="font-display italic font-light text-mid leading-snug transition-opacity duration-500"
        style={{ fontSize: 'clamp(1.1rem, 3.5vw, 1.5rem)', opacity: showLine2 ? 1 : 0 }}
      >
        {line2}
      </p>
    </div>
  )
}

// ─── Break Collapse Flow ──────────────────────────────────────────────────────

function BreakCollapseFlow({ habit, userId, onClose }: {
  habit: BreakHabit
  userId: string
  onClose: () => void
}) {
  const [step, setStep] = useState<Step>('entry')
  const [direction, setDirection] = useState<Direction>('forward')
  const [whatHappened, setWhatHappened] = useState('')
  const [jobIfBreak, setJobIfBreak] = useState('')
  const [replacementUnavailable, setReplacementUnavailable] = useState('')

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('collapses').insert({
        user_id: userId,
        habit_id: habit.id,
        section: 'break',
        what_happened: whatHappened,
        job_if_break: jobIfBreak || null,
        replacement_unavailable: replacementUnavailable || null,
      })
      if (error) throw error
    },
    onSuccess: () => { setDirection('forward'); setStep('closing') },
  })

  function go(next: Step) { setDirection('forward'); setStep(next) }
  function back(prev: Step) { setDirection('back'); setStep(prev) }

  if (step === 'entry') return <EntryScreen habitName={habit.name} onContinue={() => go(1)} onClose={onClose} />
  if (step === 'closing') return <ClosingScreen variant="break" onClose={onClose} />

  return (
    <StepWrapper key={step} direction={direction}>

      {step === 1 && (
        <div>
          <StepHeader habitName={habit.name} stepLabel="1 of 3" onClose={onClose} />
          <div className="flex flex-col gap-5">
            <p className="font-display italic font-light text-primary leading-snug" style={{ fontSize: 'clamp(1.4rem, 4vw, 1.75rem)' }}>
              What happened?
            </p>
            <p className="font-sans font-light text-[13px] text-mid italic">
              Just the facts — no interpretation needed.
            </p>
            <textarea
              value={whatHappened}
              onChange={(e) => setWhatHappened(e.target.value)}
              rows={4}
              autoFocus
              className="input-base"
            />
            <button
              className="btn-primary self-end"
              onClick={() => go(2)}
              disabled={!whatHappened.trim()}
              style={{ opacity: whatHappened.trim() ? 1 : 0.35 }}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <StepHeader habitName={habit.name} stepLabel="2 of 3" onBack={() => back(1)} onClose={onClose} />
          <div className="flex flex-col gap-5">
            <p className="font-display italic font-light text-primary leading-snug" style={{ fontSize: 'clamp(1.4rem, 4vw, 1.75rem)' }}>
              Which job was it handling?
            </p>
            <div className="flex flex-wrap gap-2">
              {habit.habit_drivers.map((driver) => {
                const selected = jobIfBreak === driver.key
                return (
                  <button
                    key={driver.key}
                    onClick={() => setJobIfBreak(driver.key)}
                    className={`px-3.5 py-2 rounded-full border font-sans text-[13px] cursor-pointer transition-all duration-150 whitespace-nowrap ${
                      selected ? 'border-accent bg-canvas font-medium text-primary' : 'border-border bg-transparent font-normal text-mid'
                    }`}
                  >
                    {driver.label}
                  </button>
                )
              })}
            </div>
            <button className="btn-primary self-end" onClick={() => go(3)}>Continue →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <StepHeader habitName={habit.name} stepLabel="3 of 3" onBack={() => back(2)} onClose={onClose} />
          <div className="flex flex-col gap-5">
            <p className="font-display italic font-light text-primary leading-snug" style={{ fontSize: 'clamp(1.4rem, 4vw, 1.75rem)' }}>
              What wasn't available or didn't land?
            </p>
            <p className="font-sans font-light text-[13px] text-mid italic">Optional</p>
            <textarea
              value={replacementUnavailable}
              onChange={(e) => setReplacementUnavailable(e.target.value)}
              rows={3}
              autoFocus
              className="input-base"
            />
            <button
              className="btn-primary self-end"
              onClick={() => save()}
              disabled={isPending}
              style={{ opacity: isPending ? 0.5 : 1 }}
            >
              {isPending ? 'Saving...' : 'Done →'}
            </button>
          </div>
        </div>
      )}

    </StepWrapper>
  )
}

// ─── Build Collapse Flow ──────────────────────────────────────────────────────

function BuildCollapseFlow({ habit, userId, onClose }: {
  habit: BuildHabit
  userId: string
  onClose: () => void
}) {
  const [step, setStep] = useState<Step>('entry')
  const [direction, setDirection] = useState<Direction>('forward')
  const [closingVariant, setClosingVariant] = useState<ClosingVariant>('build_rest')
  const [whatHappened, setWhatHappened] = useState('')
  const [whatGaveWay, setWhatGaveWay] = useState('')

  const today = new Date().getDay()
  const subHabit = habit.habit_schedule[String(today)] ?? Object.values(habit.habit_schedule)[0] ?? null
  const nonNegotiable = subHabit
    ? habit.sub_habits?.[subHabit]?.non_negotiable
    : habit.practice?.non_negotiable

  const { mutate: save, isPending } = useMutation({
    mutationFn: async (confirmed: boolean) => {
      const todayISO = new Date().toISOString().slice(0, 10)
      await supabase.from('collapses').insert({
        user_id: userId,
        habit_id: habit.id,
        section: 'build',
        what_happened: whatHappened,
        what_gave_way: whatGaveWay || null,
        return_confirmed: confirmed,
      })
      if (confirmed) {
        await supabase.from('checkins').upsert({
          user_id: userId,
          habit_id: habit.id,
          date: todayISO,
          section: 'build',
          practice_level: 'non_negotiable',
        }, { onConflict: 'user_id,habit_id,date' })
      }
    },
    onSuccess: (_, confirmed) => {
      setClosingVariant(confirmed ? 'build_return' : 'build_rest')
      setDirection('forward')
      setStep('closing')
    },
  })

  function go(next: Step) { setDirection('forward'); setStep(next) }
  function back(prev: Step) { setDirection('back'); setStep(prev) }

  if (step === 'entry') return <EntryScreen habitName={habit.name} onContinue={() => go(1)} onClose={onClose} />
  if (step === 'closing') return <ClosingScreen variant={closingVariant} onClose={onClose} />

  return (
    <StepWrapper key={step} direction={direction}>

      {step === 1 && (
        <div>
          <StepHeader habitName={habit.name} stepLabel="1 of 3" onClose={onClose} />
          <div className="flex flex-col gap-5">
            <p className="font-display italic font-light text-primary leading-snug" style={{ fontSize: 'clamp(1.4rem, 4vw, 1.75rem)' }}>
              What happened?
            </p>
            <p className="font-sans font-light text-[13px] text-mid italic">
              Just the facts — no interpretation needed.
            </p>
            <textarea
              value={whatHappened}
              onChange={(e) => setWhatHappened(e.target.value)}
              rows={4}
              autoFocus
              className="input-base"
            />
            <button
              className="btn-primary self-start"
              onClick={() => go(2)}
              disabled={!whatHappened.trim()}
              style={{ opacity: whatHappened.trim() ? 1 : 0.35 }}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <StepHeader habitName={habit.name} stepLabel="2 of 3" onBack={() => back(1)} onClose={onClose} />
          <div className="flex flex-col gap-5">
            <p className="font-display italic font-light text-primary leading-snug" style={{ fontSize: 'clamp(1.4rem, 4vw, 1.75rem)' }}>
              What gave way?
            </p>
            <div className="flex flex-col gap-2">
              {WHAT_GAVE_WAY_OPTIONS.map((option) => {
                const selected = whatGaveWay === option
                return (
                  <button
                    key={option}
                    onClick={() => setWhatGaveWay(option)}
                    className={`w-full py-3.5 px-4 rounded-xl border font-sans text-sm cursor-pointer transition-all duration-150 text-left ${
                      selected ? 'border-accent bg-canvas font-medium text-primary' : 'border-border bg-transparent font-normal text-mid'
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
            <button
              className="btn-primary self-start"
              onClick={() => go(3)}
              disabled={!whatGaveWay}
              style={{ opacity: whatGaveWay ? 1 : 0.35 }}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <StepHeader habitName={habit.name} stepLabel="3 of 3" onBack={() => back(2)} onClose={onClose} />
          <div className="flex flex-col gap-5">
            <p className="font-display italic font-light text-primary leading-snug" style={{ fontSize: 'clamp(1.4rem, 4vw, 1.75rem)' }}>
              Return at the minimum.
            </p>
            {nonNegotiable && (
              <div className="pl-4 border-l-2 border-accent animate-[fade-in_300ms_ease-out_100ms_both]">
                <p className="font-sans font-medium text-[11px] tracking-[0.12em] uppercase text-mid mb-1.5">
                  The non-negotiable version
                </p>
                <p className="font-sans font-light text-sm text-primary leading-relaxed">
                  {nonNegotiable}
                </p>
              </div>
            )}
            <p className="font-sans font-light text-[13px] text-mid">Can you do this today?</p>
            <div className="flex gap-3">
              <button
                onClick={() => save(true)}
                disabled={isPending}
                className="flex-1 py-3.5 rounded-xl bg-card border border-accent font-sans font-medium text-[13px] text-accent cursor-pointer"
                style={{ opacity: isPending ? 0.5 : 1 }}
              >
                Yes
              </button>
              <button
                onClick={() => save(false)}
                disabled={isPending}
                className="flex-1 py-3.5 rounded-xl bg-transparent border border-border font-sans font-normal text-[13px] text-mid cursor-pointer"
                style={{ opacity: isPending ? 0.5 : 1 }}
              >
                Not today
              </button>
            </div>
          </div>
        </div>
      )}

    </StepWrapper>
  )
}
