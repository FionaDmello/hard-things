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

// ─── Shared styles ────────────────────────────────────────────────────────────

const navBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontWeight: 500,
  fontSize: '11px',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: 'var(--color-mid)',
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'var(--color-canvas)',
  border: '1px solid var(--color-border)',
  borderRadius: '0.5rem',
  padding: '12px 14px',
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontWeight: 300,
  fontSize: '14px',
  color: 'var(--color-primary)',
  outline: 'none',
  resize: 'none' as const,
  boxSizing: 'border-box' as const,
}

const btnPrimary: React.CSSProperties = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontWeight: 500,
  fontSize: '12px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: 'var(--color-accent)',
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
}

const stepPrompt: React.CSSProperties = {
  fontFamily: "'Cormorant', Georgia, serif",
  fontStyle: 'italic',
  fontWeight: 300,
  fontSize: 'clamp(1.4rem, 4vw, 1.75rem)',
  color: 'var(--color-primary)',
  lineHeight: 1.3,
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
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--color-canvas)',
        zIndex: 50,
        overflowY: 'auto',
        animation: entryAnimation ?? 'slide-up 320ms cubic-bezier(0.32, 0.72, 0, 1)',
      }}
    >
      <div style={{ maxWidth: '430px', margin: '0 auto', padding: '56px 24px 96px' }}>
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
    <div style={{ animation: 'fade-in 250ms ease-out' }}>
      <button onClick={onClose} style={{ ...navBtn, marginBottom: '40px' }}>
        <span>←</span><span>Close</span>
      </button>

      <header style={{ marginBottom: '40px' }}>
        <p style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 500,
          fontSize: '11px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--color-accent)',
          marginBottom: '10px',
        }}>
          Collapse Handler
        </p>
        <h1 style={{
          fontFamily: "'Cormorant', Georgia, serif",
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: 'clamp(2.2rem, 7vw, 3rem)',
          color: 'var(--color-primary)',
          lineHeight: 1.1,
          marginBottom: '8px',
        }}>
          Something slipped.
        </h1>
        <p style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 300,
          fontSize: '13px',
          color: 'var(--color-mid)',
        }}>
          Which habit?
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {habits.map((habit) => (
          <button
            key={habit.id}
            onClick={() => onSelect(habit)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px',
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '0.75rem',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div>
              <p style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontWeight: 500,
                fontSize: '15px',
                color: 'var(--color-primary)',
              }}>
                {habit.name}
              </p>
              <p style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontWeight: 500,
                fontSize: '10px',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--color-mid)',
                marginTop: '3px',
              }}>
                {habit.section === 'break' ? 'Break' : 'Build'}
              </p>
            </div>
            <span style={{ color: 'var(--color-mid)', fontSize: '14px', opacity: 0.5 }}>→</span>
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
    <div style={{ animation: 'fade-in 300ms ease-out' }}>
      <button onClick={onClose} style={{ ...navBtn, marginBottom: '40px' }}>
        <span>←</span><span>Close</span>
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '55vh', justifyContent: 'center' }}>
        <p style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 500,
          fontSize: '11px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--color-mid)',
          marginBottom: '24px',
        }}>
          {habitName}
        </p>
        <h1 style={{
          fontFamily: "'Cormorant', Georgia, serif",
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: 'clamp(2rem, 7vw, 2.8rem)',
          color: 'var(--color-primary)',
          lineHeight: 1.2,
          marginBottom: '40px',
        }}>
          It happened.<br />
          You opened this.<br />
          That's already the turn.
        </h1>
        <button onClick={onContinue} style={btnPrimary}>
          Continue →
        </button>
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
    <div style={{ marginBottom: '40px' }}>
      <button
        onClick={onBack ?? onClose}
        style={{ ...navBtn, marginBottom: '32px' }}
      >
        <span>←</span>
        <span>{onBack ? 'Back' : 'Close'}</span>
      </button>
      <p style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontWeight: 500,
        fontSize: '11px',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'var(--color-mid)',
        marginBottom: '4px',
      }}>
        {habitName}
      </p>
      <p style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontWeight: 400,
        fontSize: '11px',
        color: 'var(--color-mid)',
        opacity: 0.6,
        marginBottom: '16px',
      }}>
        {stepLabel}
      </p>
      <div style={{ height: '1px', backgroundColor: 'var(--color-border)' }} />
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
    const t2 = setTimeout(() => onCloseRef.current(), 4500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div
      onClick={onClose}
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '60vh',
        justifyContent: 'center',
        cursor: 'pointer',
        animation: 'fade-in 300ms ease-out',
      }}
    >
      <p style={{
        fontFamily: "'Cormorant', Georgia, serif",
        fontStyle: 'italic',
        fontWeight: 300,
        fontSize: 'clamp(1.8rem, 5vw, 2.4rem)',
        color: 'var(--color-primary)',
        lineHeight: 1.2,
        marginBottom: '20px',
        animation: 'fade-in 300ms ease-out',
      }}>
        {line1}
      </p>
      <p style={{
        fontFamily: "'Cormorant', Georgia, serif",
        fontStyle: 'italic',
        fontWeight: 300,
        fontSize: 'clamp(1.1rem, 3.5vw, 1.5rem)',
        color: 'var(--color-mid)',
        lineHeight: 1.5,
        opacity: showLine2 ? 1 : 0,
        transition: 'opacity 500ms ease-out',
      }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={stepPrompt}>What happened?</p>
            <p style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontWeight: 300,
              fontSize: '13px',
              color: 'var(--color-mid)',
              fontStyle: 'italic',
            }}>
              Just the facts — no interpretation needed.
            </p>
            <textarea
              value={whatHappened}
              onChange={(e) => setWhatHappened(e.target.value)}
              rows={4}
              autoFocus
              style={textareaStyle}
            />
            <button
              onClick={() => go(2)}
              disabled={!whatHappened.trim()}
              style={{ ...btnPrimary, opacity: whatHappened.trim() ? 1 : 0.35, alignSelf: 'flex-start' }}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <StepHeader habitName={habit.name} stepLabel="2 of 3" onBack={() => back(1)} onClose={onClose} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={stepPrompt}>Which job was it doing?</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {habit.habit_drivers.map((driver) => {
                const selected = jobIfBreak === driver.key
                return (
                  <button
                    key={driver.key}
                    onClick={() => setJobIfBreak(driver.key)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '2rem',
                      border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      backgroundColor: selected ? 'var(--color-canvas)' : 'transparent',
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      fontWeight: selected ? 500 : 400,
                      fontSize: '13px',
                      color: selected ? 'var(--color-primary)' : 'var(--color-mid)',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      whiteSpace: 'nowrap' as const,
                    }}
                  >
                    {driver.label}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => go(3)}
              style={{ ...btnPrimary, alignSelf: 'flex-start' }}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <StepHeader habitName={habit.name} stepLabel="3 of 3" onBack={() => back(2)} onClose={onClose} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={stepPrompt}>What wasn't available or didn't land?</p>
            <p style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontWeight: 300,
              fontSize: '13px',
              color: 'var(--color-mid)',
              fontStyle: 'italic',
            }}>
              Optional.
            </p>
            <textarea
              value={replacementUnavailable}
              onChange={(e) => setReplacementUnavailable(e.target.value)}
              rows={3}
              autoFocus
              style={textareaStyle}
            />
            <button
              onClick={() => save()}
              disabled={isPending}
              style={{ ...btnPrimary, opacity: isPending ? 0.5 : 1, alignSelf: 'flex-start' }}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={stepPrompt}>What happened?</p>
            <p style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontWeight: 300,
              fontSize: '13px',
              color: 'var(--color-mid)',
              fontStyle: 'italic',
            }}>
              Just the facts — no interpretation needed.
            </p>
            <textarea
              value={whatHappened}
              onChange={(e) => setWhatHappened(e.target.value)}
              rows={4}
              autoFocus
              style={textareaStyle}
            />
            <button
              onClick={() => go(2)}
              disabled={!whatHappened.trim()}
              style={{ ...btnPrimary, opacity: whatHappened.trim() ? 1 : 0.35, alignSelf: 'flex-start' }}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <StepHeader habitName={habit.name} stepLabel="2 of 3" onBack={() => back(1)} onClose={onClose} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={stepPrompt}>What gave way?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {WHAT_GAVE_WAY_OPTIONS.map((option) => {
                const selected = whatGaveWay === option
                return (
                  <button
                    key={option}
                    onClick={() => setWhatGaveWay(option)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '0.625rem',
                      border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      backgroundColor: selected ? 'var(--color-canvas)' : 'transparent',
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      fontWeight: selected ? 500 : 400,
                      fontSize: '14px',
                      color: selected ? 'var(--color-primary)' : 'var(--color-mid)',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      textAlign: 'left' as const,
                    }}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => go(3)}
              disabled={!whatGaveWay}
              style={{ ...btnPrimary, opacity: whatGaveWay ? 1 : 0.35, alignSelf: 'flex-start' }}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <StepHeader habitName={habit.name} stepLabel="3 of 3" onBack={() => back(2)} onClose={onClose} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={stepPrompt}>Return at the minimum.</p>
            {nonNegotiable && (
              <div style={{
                paddingLeft: '16px',
                borderLeft: '2px solid var(--color-accent)',
                animation: 'fade-in 300ms ease-out 100ms both',
              }}>
                <p style={{
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontWeight: 500,
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--color-mid)',
                  marginBottom: '6px',
                }}>
                  The non-negotiable version
                </p>
                <p style={{
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontWeight: 300,
                  fontSize: '14px',
                  color: 'var(--color-primary)',
                  lineHeight: 1.6,
                }}>
                  {nonNegotiable}
                </p>
              </div>
            )}
            <p style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontWeight: 300,
              fontSize: '13px',
              color: 'var(--color-mid)',
            }}>
              Can you do this today?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => save(true)}
                disabled={isPending}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '0.625rem',
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-accent)',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontWeight: 500,
                  fontSize: '13px',
                  color: 'var(--color-accent)',
                  cursor: 'pointer',
                  opacity: isPending ? 0.5 : 1,
                }}
              >
                Yes
              </button>
              <button
                onClick={() => save(false)}
                disabled={isPending}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '0.625rem',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--color-border)',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontWeight: 400,
                  fontSize: '13px',
                  color: 'var(--color-mid)',
                  cursor: 'pointer',
                  opacity: isPending ? 0.5 : 1,
                }}
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
