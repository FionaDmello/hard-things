import { useState, useEffect } from 'react'
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
  break:        ['The slip is logged.', 'The next urge — execute the protocol.'],
  build_return: ['Logged as non-negotiable.', 'You showed up at the minimum. That is the work.'],
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
      className="fixed inset-0 bg-light z-50 overflow-y-auto"
      style={{ animation: entryAnimation ?? 'slide-up 320ms cubic-bezier(0.32, 0.72, 0, 1)' }}
    >
      <div className="max-w-lg mx-auto px-6 pt-14 pb-24 min-h-screen">
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

function HabitPicker({
  habits,
  onSelect,
  onClose,
}: {
  habits: AnyHabit[]
  onSelect: (h: AnyHabit) => void
  onClose: () => void
}) {
  return (
    <div style={{ animation: 'fade-in 250ms ease-out' }}>
      <button
        onClick={onClose}
        className="inline-flex items-center gap-1.5 text-xs text-mid hover:text-primary transition-colors mb-10"
      >
        <span>←</span>
        <span className="uppercase tracking-[0.15em]">Close</span>
      </button>

      <header className="mb-10">
        <h1
          className="text-primary leading-tight"
          style={{ fontFamily: "'Cormorant', Georgia, serif", fontWeight: 300, fontSize: 'clamp(2.4rem, 8vw, 3.2rem)' }}
        >
          Something slipped.
        </h1>
        <p className="text-xs uppercase tracking-[0.2em] text-mid mt-3">Which habit?</p>
        <div className="mt-4 h-px bg-mid/20" />
      </header>

      <div className="space-y-3">
        {habits.map((habit) => (
          <button
            key={habit.id}
            onClick={() => onSelect(habit)}
            className="w-full flex items-center justify-between py-5 px-5 bg-accent-light border border-mid/10 rounded-xl hover:border-mid/30 transition-colors group"
          >
            <div className="text-left">
              <p className="font-medium text-primary">{habit.name}</p>
              <p className="text-xs text-mid mt-0.5 uppercase tracking-[0.15em]">
                {habit.section === 'break' ? 'Break' : 'Build'}
              </p>
            </div>
            <span className="text-mid opacity-30 group-hover:opacity-70 transition-opacity text-sm">→</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Entry Screen ─────────────────────────────────────────────────────────────

function EntryScreen({
  habitName,
  onContinue,
  onClose,
}: {
  habitName: string
  onContinue: () => void
  onClose: () => void
}) {
  return (
    <div style={{ animation: 'fade-in 300ms ease-out' }}>
      <button
        onClick={onClose}
        className="inline-flex items-center gap-1.5 text-xs text-mid hover:text-primary transition-colors mb-10"
      >
        <span>←</span>
        <span className="uppercase tracking-[0.15em]">Close</span>
      </button>

      <div className="flex flex-col min-h-[55vh] justify-center">
        <p className="text-xs uppercase tracking-[0.2em] text-mid mb-6">{habitName}</p>
        <h1
          className="text-primary leading-tight mb-10"
          style={{ fontFamily: "'Cormorant', Georgia, serif", fontWeight: 300, fontSize: 'clamp(2rem, 7vw, 2.8rem)' }}
        >
          It happened.<br />
          You opened this.<br />
          That's already the turn.
        </h1>
        <button
          onClick={onContinue}
          className="self-start px-6 py-2.5 bg-primary text-light text-sm rounded-xl"
        >
          Continue
        </button>
      </div>
    </div>
  )
}

// ─── Step Wrapper (animates on remount via key) ───────────────────────────────

function StepWrapper({ direction, children }: { direction: Direction; children: React.ReactNode }) {
  return (
    <div style={{ animation: `${direction === 'forward' ? 'slide-in-right' : 'slide-in-left'} 280ms ease-out` }}>
      {children}
    </div>
  )
}

// ─── Step Header ──────────────────────────────────────────────────────────────

function StepHeader({
  habitName,
  stepLabel,
  onBack,
  onClose,
}: {
  habitName: string
  stepLabel: string
  onBack?: () => void
  onClose: () => void
}) {
  return (
    <div className="mb-10">
      <div className="mb-8">
        {onBack ? (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs text-mid hover:text-primary transition-colors"
          >
            <span>←</span>
            <span className="uppercase tracking-[0.15em]">Back</span>
          </button>
        ) : (
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs text-mid hover:text-primary transition-colors"
          >
            <span>←</span>
            <span className="uppercase tracking-[0.15em]">Close</span>
          </button>
        )}
      </div>
      <p className="text-xs uppercase tracking-[0.2em] text-mid mb-1">{habitName}</p>
      <p className="text-xs text-mid/60">{stepLabel}</p>
      <div className="mt-4 h-px bg-mid/20" />
    </div>
  )
}

// ─── Closing Screen ───────────────────────────────────────────────────────────

function ClosingScreen({ variant, onClose }: { variant: ClosingVariant; onClose: () => void }) {
  const [showLine2, setShowLine2] = useState(false)
  const [line1, line2] = CLOSING_LINES[variant]

  useEffect(() => {
    const t1 = setTimeout(() => setShowLine2(true), 700)
    const t2 = setTimeout(() => onClose(), 4500)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [onClose])

  return (
    <div
      className="flex flex-col min-h-[60vh] justify-center cursor-pointer"
      onClick={onClose}
      style={{ animation: 'fade-in 300ms ease-out' }}
    >
      <p
        className="text-primary leading-snug mb-5"
        style={{
          fontFamily: "'Cormorant', Georgia, serif",
          fontWeight: 300,
          fontSize: 'clamp(1.8rem, 5vw, 2.4rem)',
          animation: 'fade-in 300ms ease-out',
        }}
      >
        {line1}
      </p>
      {showLine2 && (
        <p
          className="text-mid leading-relaxed"
          style={{
            fontFamily: "'Cormorant', Georgia, serif",
            fontWeight: 300,
            fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
            animation: 'fade-in 300ms ease-out',
          }}
        >
          {line2}
        </p>
      )}
    </div>
  )
}

// ─── Break Collapse Flow ──────────────────────────────────────────────────────

function BreakCollapseFlow({
  habit,
  userId,
  onClose,
}: {
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
    onSuccess: () => {
      setDirection('forward')
      setStep('closing')
    },
  })

  function go(next: Step) {
    setDirection('forward')
    setStep(next)
  }

  function back(prev: Step) {
    setDirection('back')
    setStep(prev)
  }

  if (step === 'entry') {
    return <EntryScreen habitName={habit.name} onContinue={() => go(1)} onClose={onClose} />
  }

  if (step === 'closing') {
    return <ClosingScreen variant="break" onClose={onClose} />
  }

  return (
    <StepWrapper key={step} direction={direction}>

      {step === 1 && (
        <div>
          <StepHeader habitName={habit.name} stepLabel="1 of 3" onClose={onClose} />
          <div className="space-y-6">
            <p
              className="text-primary leading-snug"
              style={{ fontFamily: "'Cormorant', Georgia, serif", fontWeight: 400, fontSize: 'clamp(1.4rem, 4vw, 1.75rem)' }}
            >
              What happened?
            </p>
            <p className="text-sm text-mid italic">Describe it as fact, not judgment.</p>
            <textarea
              value={whatHappened}
              onChange={(e) => setWhatHappened(e.target.value)}
              rows={4}
              autoFocus
              className="w-full px-4 py-3 text-sm rounded-xl border border-mid/30 bg-accent-light focus:outline-none focus:border-accent resize-none"
            />
            <button
              onClick={() => go(2)}
              disabled={!whatHappened.trim()}
              className="px-6 py-2.5 bg-primary text-light text-sm rounded-xl disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <StepHeader habitName={habit.name} stepLabel="2 of 3" onBack={() => back(1)} onClose={onClose} />
          <div className="space-y-6">
            <p
              className="text-primary leading-snug"
              style={{ fontFamily: "'Cormorant', Georgia, serif", fontWeight: 400, fontSize: 'clamp(1.4rem, 4vw, 1.75rem)' }}
            >
              Which job was it doing?
            </p>
            <div className="flex flex-wrap gap-2">
              {habit.habit_drivers.map((driver) => (
                <button
                  key={driver.key}
                  onClick={() => setJobIfBreak(driver.key)}
                  className={`px-4 py-2 rounded-xl border text-sm transition-all ${
                    jobIfBreak === driver.key
                      ? 'border-accent bg-accent-light text-primary'
                      : 'border-mid/20 text-primary hover:border-mid/40'
                  }`}
                >
                  {driver.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => go(3)}
              disabled={!jobIfBreak}
              className="px-6 py-2.5 bg-primary text-light text-sm rounded-xl disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <StepHeader habitName={habit.name} stepLabel="3 of 3" onBack={() => back(2)} onClose={onClose} />
          <div className="space-y-6">
            <p
              className="text-primary leading-snug"
              style={{ fontFamily: "'Cormorant', Georgia, serif", fontWeight: 400, fontSize: 'clamp(1.4rem, 4vw, 1.75rem)' }}
            >
              Which replacement wasn't available or wasn't enough?
            </p>
            <p className="text-sm text-mid italic">Optional.</p>
            <textarea
              value={replacementUnavailable}
              onChange={(e) => setReplacementUnavailable(e.target.value)}
              rows={3}
              autoFocus
              className="w-full px-4 py-3 text-sm rounded-xl border border-mid/30 bg-accent-light focus:outline-none focus:border-accent resize-none"
            />
            <button
              onClick={() => save()}
              disabled={isPending}
              className="px-6 py-2.5 bg-primary text-light text-sm rounded-xl disabled:opacity-40"
            >
              {isPending ? 'Saving...' : 'Done'}
            </button>
          </div>
        </div>
      )}

    </StepWrapper>
  )
}

// ─── Build Collapse Flow ──────────────────────────────────────────────────────

function BuildCollapseFlow({
  habit,
  userId,
  onClose,
}: {
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

  function go(next: Step) {
    setDirection('forward')
    setStep(next)
  }

  function back(prev: Step) {
    setDirection('back')
    setStep(prev)
  }

  if (step === 'entry') {
    return <EntryScreen habitName={habit.name} onContinue={() => go(1)} onClose={onClose} />
  }

  if (step === 'closing') {
    return <ClosingScreen variant={closingVariant} onClose={onClose} />
  }

  return (
    <StepWrapper key={step} direction={direction}>

      {step === 1 && (
        <div>
          <StepHeader habitName={habit.name} stepLabel="1 of 3" onClose={onClose} />
          <div className="space-y-6">
            <p
              className="text-primary leading-snug"
              style={{ fontFamily: "'Cormorant', Georgia, serif", fontWeight: 400, fontSize: 'clamp(1.4rem, 4vw, 1.75rem)' }}
            >
              What happened?
            </p>
            <p className="text-sm text-mid italic">Describe it as fact, not judgment.</p>
            <textarea
              value={whatHappened}
              onChange={(e) => setWhatHappened(e.target.value)}
              rows={4}
              autoFocus
              className="w-full px-4 py-3 text-sm rounded-xl border border-mid/30 bg-accent-light focus:outline-none focus:border-accent resize-none"
            />
            <button
              onClick={() => go(2)}
              disabled={!whatHappened.trim()}
              className="px-6 py-2.5 bg-primary text-light text-sm rounded-xl disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <StepHeader habitName={habit.name} stepLabel="2 of 3" onBack={() => back(1)} onClose={onClose} />
          <div className="space-y-6">
            <p
              className="text-primary leading-snug"
              style={{ fontFamily: "'Cormorant', Georgia, serif", fontWeight: 400, fontSize: 'clamp(1.4rem, 4vw, 1.75rem)' }}
            >
              What gave way?
            </p>
            <div className="space-y-2">
              {WHAT_GAVE_WAY_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => setWhatGaveWay(option)}
                  className={`w-full py-3.5 px-5 rounded-xl border text-left text-sm transition-all ${
                    whatGaveWay === option
                      ? 'border-accent bg-accent-light text-primary'
                      : 'border-mid/20 text-primary hover:border-mid/40'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              onClick={() => go(3)}
              disabled={!whatGaveWay}
              className="px-6 py-2.5 bg-primary text-light text-sm rounded-xl disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <StepHeader habitName={habit.name} stepLabel="3 of 3" onBack={() => back(2)} onClose={onClose} />
          <div className="space-y-6">
            <p
              className="text-primary leading-snug"
              style={{ fontFamily: "'Cormorant', Georgia, serif", fontWeight: 400, fontSize: 'clamp(1.4rem, 4vw, 1.75rem)' }}
            >
              Return at the minimum.
            </p>
            {nonNegotiable && (
              <div
                className="py-4 pl-5"
                style={{ borderLeft: '2px solid var(--color-accent)', animation: 'fade-in 300ms ease-out 100ms both' }}
              >
                <p className="text-xs uppercase tracking-[0.15em] text-mid mb-2">The non-negotiable version</p>
                <p className="text-sm text-primary leading-relaxed">{nonNegotiable}</p>
              </div>
            )}
            <p className="text-sm text-mid">Can you do this today?</p>
            <div className="flex gap-3">
              <button
                onClick={() => save(true)}
                disabled={isPending}
                className="flex-1 py-3 bg-primary text-light text-sm rounded-xl disabled:opacity-40"
              >
                Yes
              </button>
              <button
                onClick={() => save(false)}
                disabled={isPending}
                className="flex-1 py-3 border border-mid/30 text-primary text-sm rounded-xl disabled:opacity-40 hover:border-mid/50 transition-colors"
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
