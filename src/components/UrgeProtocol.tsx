import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores'
import { CollapseHandler } from './CollapseHandler'
import type { BreakHabit, HabitDriver } from '../types/database'

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMER_MS = 10 * 60 * 1000
const CIRCUMFERENCE = 2 * Math.PI * 45

type UrgeStep =
  | 'habit_select'
  | 'urge_entry'
  | 'driver_select'
  | 'tool_select'
  | 'surfing_active'
  | 'replacement_select'
  | 'replacement_active'
  | 'delay_active'
  | 'resolution'
  | 'logged_success'

type Outcome = 'passed' | 'acted_on'

// Active tool steps — swipe-down dismiss is disabled here
const ACTIVE_STEPS = new Set<UrgeStep>(['surfing_active', 'replacement_active', 'delay_active'])

// ─── Shared styles ────────────────────────────────────────────────────────────

const eyebrowStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontWeight: 500,
  fontSize: '11px',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--color-mid)',
}

const navBtnStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontWeight: 400,
  fontSize: '12px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--color-mid)',
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
}

const primaryBtnStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontWeight: 500,
  fontSize: '13px',
  backgroundColor: 'var(--color-primary)',
  color: 'var(--color-canvas)',
  border: 'none',
  borderRadius: '0.75rem',
  padding: '12px 24px',
  cursor: 'pointer',
}

const ghostBtnStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontWeight: 400,
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--color-mid)',
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  opacity: 0.7,
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void
}

export function UrgeProtocol({ onClose }: Props) {
  const user = useAuthStore((s) => s.user)

  const { data: breakHabits = [], isLoading } = useQuery({
    queryKey: ['habits', 'break'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_break_habits')
      if (error) throw error
      return (data ?? []) as BreakHabit[]
    },
  })

  // ── Flow state ────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<UrgeStep>('habit_select')
  const [selectedHabit, setSelectedHabit] = useState<BreakHabit | null>(null)
  const [intensity, setIntensity] = useState<number | null>(null)
  const [driverKey, setDriverKey] = useState<string | null>(null)
  const [toolUsed, setToolUsed] = useState<'surf' | 'replace' | 'delay' | null>(null)
  const [replacementUsed, setReplacementUsed] = useState<string | null>(null)
  const [timerStartMs, setTimerStartMs] = useState<number | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [showCollapseHandoff, setShowCollapseHandoff] = useState(false)
  const [urgeLogId, setUrgeLogId] = useState<string | null>(null)

  // Auto-advance when only 1 break habit
  useEffect(() => {
    if (!isLoading && breakHabits.length === 1 && step === 'habit_select') {
      setSelectedHabit(breakHabits[0])
      setStep('urge_entry')
    }
  }, [isLoading, breakHabits.length, step])

  // Timer — stored as start time so it survives background/foreground
  useEffect(() => {
    if (timerStartMs === null) return
    const tick = () => {
      const elapsed = Date.now() - timerStartMs
      setElapsedMs(elapsed)
      if (elapsed >= TIMER_MS) setStep('resolution')
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [timerStartMs])

  // ── Save ──────────────────────────────────────────────────────────────────────
  const { mutate: saveLog } = useMutation({
    mutationFn: async ({ outcome }: { outcome: 'passed' | 'acted_on' }) => {
      if (!selectedHabit || !driverKey) return
      const { data } = await supabase.from('urge_logs').insert({
        user_id: user!.id,
        habit_id: selectedHabit.id,
        urge_intensity: intensity,
        tool_used: toolUsed,
        driver_key: driverKey,
        replacement_used: replacementUsed,
        outcome,
        routed_to_collapse: false,
      }).select('id').single()
      if (data) setUrgeLogId(data.id)
    },
  })

  const { mutate: markRoutedToCollapse } = useMutation({
    mutationFn: async () => {
      if (!urgeLogId) return
      await supabase.from('urge_logs').update({ routed_to_collapse: true }).eq('id', urgeLogId)
    },
  })

  // ── Handlers ──────────────────────────────────────────────────────────────────
  function handleResolution(o: Outcome) {
    setOutcome(o)
    saveLog({ outcome: o })
    setStep('logged_success')
  }

  function startTool(tool: 'surf' | 'replace' | 'delay') {
    setToolUsed(tool)
    if (tool === 'replace') {
      setStep('replacement_select')
    } else {
      setTimerStartMs(Date.now())
      setElapsedMs(0)
      setStep(tool === 'surf' ? 'surfing_active' : 'delay_active')
    }
  }

  // ── Swipe to dismiss ──────────────────────────────────────────────────────────
  const isActive = ACTIVE_STEPS.has(step)
  const [dragY, setDragY] = useState(0)
  const [isSnapping, setIsSnapping] = useState(false)
  const dragRef = useRef({ y: 0, t: 0 })

  function onTouchStart(e: React.TouchEvent) {
    if (isActive) return
    dragRef.current = { y: e.touches[0].clientY, t: Date.now() }
  }
  function onTouchMove(e: React.TouchEvent) {
    if (isActive) return
    const dy = e.touches[0].clientY - dragRef.current.y
    if (dy > 0) setDragY(dy)
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (isActive) return
    const dy = e.changedTouches[0].clientY - dragRef.current.y
    const vel = (dy / Math.max(Date.now() - dragRef.current.t, 1)) * 1000
    if (dy > 150 || (dy > 80 && vel > 300)) {
      onClose()
    } else {
      setIsSnapping(true)
      setDragY(0)
      setTimeout(() => setIsSnapping(false), 200)
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────────
  const selectedDriver = selectedHabit?.habit_drivers.find(d => d.key === driverKey) ?? null

  const overlayMotion: React.CSSProperties =
    dragY > 0
      ? { transform: `translateY(${dragY}px)`, transition: 'none' }
      : isSnapping
        ? { transform: 'translateY(0)', transition: 'transform 200ms ease-out' }
        : { animation: 'slide-up 320ms cubic-bezier(0.32, 0.72, 0, 1) both' }

  const overlayBase: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'var(--color-canvas)',
    zIndex: 50,
    overflow: 'hidden',
  }

  return (
    <div
      style={step === 'logged_success' ? overlayBase : { ...overlayBase, ...overlayMotion }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {step === 'logged_success' ? (
        <SuccessScreen
          outcome={outcome ?? 'passed'}
          onClose={onClose}
          onLogCollapse={outcome === 'acted_on' ? () => { markRoutedToCollapse(); setShowCollapseHandoff(true) } : undefined}
        />
      ) : (
        <div style={{
          maxWidth: '32rem',
          margin: '0 auto',
          padding: '48px 24px 96px',
          minHeight: '100vh',
        }}>

          {/* Drag handle — visible on swipeable states only */}
          {!isActive && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
              <div style={{
                width: '40px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: 'var(--color-mid)',
                opacity: 0.3,
              }} />
            </div>
          )}

          {step === 'habit_select' && (
            <HabitSelectScreen
              habits={breakHabits}
              isLoading={isLoading}
              onSelect={(h) => { setSelectedHabit(h); setStep('urge_entry') }}
              onClose={onClose}
            />
          )}

          {step === 'urge_entry' && selectedHabit && (
            <UrgeEntryScreen
              habitName={selectedHabit.name}
              intensity={intensity}
              onSelect={setIntensity}
              onContinue={() => setStep('driver_select')}
              onBack={breakHabits.length > 1 ? () => setStep('habit_select') : undefined}
              onClose={onClose}
            />
          )}

          {step === 'driver_select' && selectedHabit && (
            <DriverSelectScreen
              habit={selectedHabit}
              driverKey={driverKey}
              onSelect={setDriverKey}
              onContinue={() => setStep('tool_select')}
              onBack={() => setStep('urge_entry')}
              onClose={onClose}
            />
          )}

          {step === 'tool_select' && (
            <ToolSelectScreen
              onStart={startTool}
              onBack={() => setStep('driver_select')}
              onClose={onClose}
            />
          )}

          {step === 'surfing_active' && (
            <SurfingScreen
              elapsedMs={elapsedMs}
              onActedOn={() => handleResolution('acted_on')}
              onPassed={() => handleResolution('passed')}
            />
          )}

          {step === 'replacement_select' && selectedDriver && (
            <ReplacementSelectScreen
              driver={selectedDriver}
              onSelect={(r) => { setReplacementUsed(r); setStep('replacement_active') }}
              onBack={() => setStep('tool_select')}
              onClose={onClose}
            />
          )}

          {step === 'replacement_active' && replacementUsed && (
            <ReplacementActiveScreen
              replacement={replacementUsed}
              onDone={() => handleResolution('passed')}
              onActedOn={() => handleResolution('acted_on')}
            />
          )}

          {step === 'delay_active' && (
            <DelayScreen
              elapsedMs={elapsedMs}
              onActedOn={() => handleResolution('acted_on')}
              onPassed={() => handleResolution('passed')}
            />
          )}

          {step === 'resolution' && (
            <ResolutionScreen
              onActedOn={() => handleResolution('acted_on')}
              onPassed={() => handleResolution('passed')}
            />
          )}

        </div>
      )}

      {showCollapseHandoff && selectedHabit && (
        <CollapseHandler
          habit={selectedHabit}
          onClose={onClose}
          entryAnimation="fade-in 250ms ease-out"
        />
      )}
    </div>
  )
}

// ─── Shared nav ───────────────────────────────────────────────────────────────

function NavBar({
  onBack,
  onClose,
}: {
  onBack?: () => void
  onClose?: () => void
}) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '40px',
    }}>
      {onBack ? (
        <button onClick={onBack} style={navBtnStyle}>
          <span>←</span>
          <span>Back</span>
        </button>
      ) : (
        <div />
      )}
      {onClose && (
        <button onClick={onClose} style={navBtnStyle}>Close</button>
      )}
    </div>
  )
}

// ─── Breathing arc ────────────────────────────────────────────────────────────

function BreathingArc({ elapsedMs, totalMs }: { elapsedMs: number; totalMs: number }) {
  const progress = Math.min(elapsedMs / totalMs, 1)
  const dashOffset = progress * CIRCUMFERENCE
  const secondsLeft = Math.max(0, Math.ceil((totalMs - elapsedMs) / 1000))
  const m = Math.floor(secondsLeft / 60)
  const s = secondsLeft % 60

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width="140" height="140" viewBox="0 0 120 120">
        {/* Track */}
        <circle
          cx="60" cy="60" r="45"
          fill="none"
          stroke="var(--color-mid)"
          strokeOpacity="0.15"
          strokeWidth="2"
        />
        {/* Depleting arc — breathes via CSS animation */}
        <circle
          cx="60" cy="60" r="45"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 60 60)"
          style={{ animation: 'breathe 4000ms ease-in-out infinite' }}
        />
        {/* Time remaining */}
        <text
          x="60" y="60"
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fill: 'var(--color-primary)',
            fontFamily: "'Cormorant', Georgia, serif",
            fontWeight: 300,
            fontSize: '18px',
          }}
        >
          {m}:{String(s).padStart(2, '0')}
        </text>
      </svg>
    </div>
  )
}

// ─── Habit select screen ──────────────────────────────────────────────────────

function HabitSelectScreen({
  habits,
  isLoading,
  onSelect,
  onClose,
}: {
  habits: BreakHabit[]
  isLoading: boolean
  onSelect: (h: BreakHabit) => void
  onClose: () => void
}) {
  return (
    <div>
      <button onClick={onClose} style={{ ...navBtnStyle, marginBottom: '40px' }}>
        <span>←</span>
        <span>Close</span>
      </button>

      <header style={{ marginBottom: '40px' }}>
        <h1 style={{
          fontFamily: "'Cormorant', Georgia, serif",
          fontWeight: 300,
          fontSize: 'clamp(2.4rem, 8vw, 3.2rem)',
          color: 'var(--color-primary)',
          lineHeight: 1.1,
        }}>
          You're in an urge.
        </h1>
        <p style={{ ...eyebrowStyle, marginTop: '12px' }}>Which habit?</p>
        <div style={{
          marginTop: '16px',
          height: '1px',
          backgroundColor: 'var(--color-border)',
        }} />
      </header>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2].map((n) => (
            <div key={n} style={{
              height: '64px',
              borderRadius: '0.75rem',
              backgroundColor: 'var(--color-mid)',
              opacity: 0.1,
            }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {habits.map((h) => (
            <button
              key={h.id}
              onClick={() => onSelect(h)}
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
              <span style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontWeight: 500,
                fontSize: '14px',
                color: 'var(--color-primary)',
              }}>
                {h.name}
              </span>
              <span style={{
                fontSize: '13px',
                color: 'var(--color-mid)',
                opacity: 0.5,
              }}>
                →
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Urge entry screen ────────────────────────────────────────────────────────

function UrgeEntryScreen({
  habitName,
  intensity,
  onSelect,
  onContinue,
  onBack,
  onClose,
}: {
  habitName: string
  intensity: number | null
  onSelect: (n: number) => void
  onContinue: () => void
  onBack?: () => void
  onClose: () => void
}) {
  return (
    <div>
      <NavBar onBack={onBack} onClose={onClose} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
          <p style={{ ...eyebrowStyle, marginBottom: '20px' }}>{habitName}</p>
          <p style={{
            fontFamily: "'Cormorant', Georgia, serif",
            fontWeight: 300,
            fontSize: 'clamp(1.6rem, 5vw, 2rem)',
            color: 'var(--color-primary)',
            lineHeight: 1.35,
          }}>
            You're in an urge.<br />
            You opened the app.<br />
            That already matters.
          </p>
        </div>

        <div>
          <p style={{ ...eyebrowStyle, marginBottom: '16px' }}>Intensity</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => onSelect(n)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '0.75rem',
                  border: `1px solid ${intensity === n ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  backgroundColor: intensity === n ? 'var(--color-primary)' : 'transparent',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontWeight: intensity === n ? 500 : 400,
                  fontSize: '13px',
                  color: intensity === n ? 'var(--color-canvas)' : intensity !== null ? 'var(--color-mid)' : 'var(--color-primary)',
                  opacity: intensity !== null && intensity !== n ? 0.4 : 1,
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onContinue}
          disabled={intensity === null}
          style={{ ...primaryBtnStyle, opacity: intensity !== null ? 1 : 0.4, alignSelf: 'flex-start' }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

// ─── Driver select screen ─────────────────────────────────────────────────────

function DriverSelectScreen({
  habit,
  driverKey,
  onSelect,
  onContinue,
  onBack,
  onClose,
}: {
  habit: BreakHabit
  driverKey: string | null
  onSelect: (k: string) => void
  onContinue: () => void
  onBack: () => void
  onClose: () => void
}) {
  return (
    <div>
      <NavBar onBack={onBack} onClose={onClose} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
          <p style={{ ...eyebrowStyle, marginBottom: '20px' }}>{habit.name}</p>
          <p style={{
            fontFamily: "'Cormorant', Georgia, serif",
            fontWeight: 400,
            fontSize: 'clamp(1.4rem, 4vw, 1.75rem)',
            color: 'var(--color-primary)',
            lineHeight: 1.3,
          }}>
            Which job is it doing right now?
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {habit.habit_drivers.map((d) => (
            <button
              key={d.key}
              onClick={() => onSelect(d.key)}
              style={{
                padding: '8px 16px',
                borderRadius: '2rem',
                border: `1px solid ${driverKey === d.key ? 'var(--color-accent)' : 'var(--color-border)'}`,
                backgroundColor: driverKey === d.key ? 'var(--color-card)' : 'transparent',
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontWeight: driverKey === d.key ? 500 : 400,
                fontSize: '13px',
                color: driverKey === d.key ? 'var(--color-primary)' : 'var(--color-mid)',
                opacity: driverKey !== null && driverKey !== d.key ? 0.4 : 1,
                cursor: 'pointer',
                transition: 'all 150ms ease',
                whiteSpace: 'nowrap',
              }}
            >
              {d.label}
            </button>
          ))}
        </div>

        <button
          onClick={onContinue}
          disabled={!driverKey}
          style={{ ...primaryBtnStyle, opacity: driverKey ? 1 : 0.4, alignSelf: 'flex-start' }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

// ─── Tool select screen ───────────────────────────────────────────────────────

const TOOLS: { id: 'surf' | 'replace' | 'delay'; name: string; description: string }[] = [
  {
    id: 'surf',
    name: 'Surf it',
    description: 'Observe the urge without acting. Breathing-paced timer.',
  },
  {
    id: 'replace',
    name: 'Replace it',
    description: 'Use a replacement for what this urge is doing.',
  },
  {
    id: 'delay',
    name: 'Delay it',
    description: "Ten minutes. If it's still there after, it can be.",
  },
]

function ToolSelectScreen({
  onStart,
  onBack,
  onClose,
}: {
  onStart: (t: 'surf' | 'replace' | 'delay') => void
  onBack: () => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState<'surf' | 'replace' | 'delay' | null>(null)

  return (
    <div>
      <NavBar onBack={onBack} onClose={onClose} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <p style={{
          fontFamily: "'Cormorant', Georgia, serif",
          fontWeight: 400,
          fontSize: 'clamp(1.4rem, 4vw, 1.75rem)',
          color: 'var(--color-primary)',
          lineHeight: 1.3,
        }}>
          Choose a tool.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setSelected(tool.id)}
              style={{
                width: '100%',
                padding: '20px',
                borderRadius: '0.75rem',
                border: `1px solid ${selected === tool.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                backgroundColor: selected === tool.id ? 'var(--color-card)' : 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
            >
              <p style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontWeight: 500,
                fontSize: '13px',
                color: 'var(--color-primary)',
                marginBottom: '4px',
              }}>
                {tool.name}
              </p>
              <p style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontWeight: 300,
                fontSize: '12px',
                color: 'var(--color-mid)',
                lineHeight: 1.5,
              }}>
                {tool.description}
              </p>
            </button>
          ))}
        </div>

        <button
          onClick={() => selected && onStart(selected)}
          disabled={!selected}
          style={{ ...primaryBtnStyle, opacity: selected ? 1 : 0.4, alignSelf: 'flex-start' }}
        >
          Start
        </button>
      </div>
    </div>
  )
}

// ─── Surfing active screen ────────────────────────────────────────────────────

function SurfingScreen({
  elapsedMs,
  onActedOn,
  onPassed,
}: {
  elapsedMs: number
  onActedOn: () => void
  onPassed: () => void
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
    }}>
      <p style={{ ...eyebrowStyle, marginBottom: '48px' }}>Surfing</p>

      <BreathingArc elapsedMs={elapsedMs} totalMs={TIMER_MS} />

      <p style={{
        fontFamily: "'Cormorant', Georgia, serif",
        fontStyle: 'italic',
        fontWeight: 300,
        fontSize: '1rem',
        color: 'var(--color-mid)',
        lineHeight: 1.6,
        textAlign: 'center',
        maxWidth: '200px',
        margin: '40px 0 64px',
      }}>
        Observe it. You don't have to act on it.
      </p>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        width: '100%',
        maxWidth: '280px',
      }}>
        <button
          onClick={onPassed}
          style={{ ...primaryBtnStyle, width: '100%', textAlign: 'center' }}
        >
          It passed
        </button>
        <button onClick={onActedOn} style={ghostBtnStyle}>
          I acted on it
        </button>
      </div>
    </div>
  )
}

// ─── Replacement select screen ────────────────────────────────────────────────

function ReplacementSelectScreen({
  driver,
  onSelect,
  onBack,
  onClose,
}: {
  driver: HabitDriver
  onSelect: (r: string) => void
  onBack: () => void
  onClose: () => void
}) {
  return (
    <div>
      <NavBar onBack={onBack} onClose={onClose} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div>
          <p style={{ ...eyebrowStyle, marginBottom: '20px' }}>{driver.label}</p>
          <p style={{
            fontFamily: "'Cormorant', Georgia, serif",
            fontWeight: 400,
            fontSize: 'clamp(1.4rem, 4vw, 1.75rem)',
            color: 'var(--color-primary)',
            lineHeight: 1.3,
          }}>
            Which replacement?
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {driver.replacements.map((r) => (
            <button
              key={r}
              onClick={() => onSelect(r)}
              style={{
                width: '100%',
                padding: '16px 20px',
                borderRadius: '0.75rem',
                border: '1px solid var(--color-border)',
                backgroundColor: 'transparent',
                textAlign: 'left',
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontWeight: 400,
                fontSize: '13px',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Replacement active screen ────────────────────────────────────────────────

function ReplacementActiveScreen({
  replacement,
  onDone,
  onActedOn,
}: {
  replacement: string
  onDone: () => void
  onActedOn: () => void
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      minHeight: '65vh',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        <p style={{
          fontFamily: "'Cormorant', Georgia, serif",
          fontWeight: 300,
          fontSize: 'clamp(2rem, 6vw, 2.6rem)',
          color: 'var(--color-primary)',
          lineHeight: 1.2,
        }}>
          {replacement}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
          <button onClick={onDone} style={primaryBtnStyle}>
            Done
          </button>
          <button onClick={onActedOn} style={ghostBtnStyle}>
            I acted on it anyway
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Delay active screen ──────────────────────────────────────────────────────

function DelayScreen({
  elapsedMs,
  onActedOn,
  onPassed,
}: {
  elapsedMs: number
  onActedOn: () => void
  onPassed: () => void
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '70vh',
    }}>
      <p style={{ ...eyebrowStyle, marginBottom: '48px' }}>Delay</p>

      <BreathingArc elapsedMs={elapsedMs} totalMs={TIMER_MS} />

      <p style={{
        fontFamily: "'Cormorant', Georgia, serif",
        fontStyle: 'italic',
        fontWeight: 300,
        fontSize: '1rem',
        color: 'var(--color-mid)',
        lineHeight: 1.6,
        textAlign: 'center',
        maxWidth: '220px',
        margin: '40px 0 64px',
      }}>
        Ten minutes. If it still wants to be there after that, it can.
      </p>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        width: '100%',
        maxWidth: '280px',
      }}>
        <button
          onClick={onPassed}
          style={{ ...primaryBtnStyle, width: '100%', textAlign: 'center' }}
        >
          It passed early
        </button>
        <button onClick={onActedOn} style={ghostBtnStyle}>
          I acted on it
        </button>
      </div>
    </div>
  )
}

// ─── Resolution screen (shown when timer ends naturally) ──────────────────────

function ResolutionScreen({
  onActedOn,
  onPassed,
}: {
  onActedOn: () => void
  onPassed: () => void
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      minHeight: '60vh',
      animation: 'fade-in 300ms ease-out',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <p style={{
          fontFamily: "'Cormorant', Georgia, serif",
          fontWeight: 300,
          fontSize: 'clamp(1.6rem, 5vw, 2rem)',
          color: 'var(--color-primary)',
          lineHeight: 1.3,
        }}>
          Time's up.
        </p>
        <p style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 300,
          fontSize: '13px',
          color: 'var(--color-mid)',
        }}>
          How did it go?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
          <button
            onClick={onPassed}
            style={{ ...primaryBtnStyle, minWidth: '160px' }}
          >
            It passed
          </button>
          <button
            onClick={onActedOn}
            style={{
              fontFamily: "'DM Sans', system-ui, sans-serif",
              fontWeight: 400,
              fontSize: '13px',
              color: 'var(--color-primary)',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: '0.75rem',
              padding: '12px 24px',
              cursor: 'pointer',
              minWidth: '160px',
            }}
          >
            I acted on it
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Success screen ───────────────────────────────────────────────────────────

const CLOSING_COPY: Record<Outcome, [string, string | null]> = {
  passed:   ["You ran the protocol.", "That's the work."],
  acted_on: ["It happened.", "You tried to create space before acting. That's what matters."],
}

function SuccessScreen({
  outcome,
  onClose,
  onLogCollapse,
}: {
  outcome: Outcome
  onClose: () => void
  onLogCollapse?: () => void
}) {
  const [showLine2, setShowLine2] = useState(false)
  const [showAction, setShowAction] = useState(false)
  const [line1, line2] = CLOSING_COPY[outcome]

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    if (line2) timers.push(setTimeout(() => setShowLine2(true), 700))
    if (outcome === 'acted_on') {
      timers.push(setTimeout(() => setShowAction(true), 1400))
    } else {
      timers.push(setTimeout(() => onCloseRef.current(), 3000))
    }
    return () => timers.forEach(clearTimeout)
  }, [outcome, line2])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '0 24px',
      maxWidth: '32rem',
      margin: '0 auto',
    }}>
      <p
        style={{
          fontFamily: "'Cormorant', Georgia, serif",
          fontWeight: 300,
          fontSize: 'clamp(1.8rem, 5vw, 2.4rem)',
          color: 'var(--color-primary)',
          lineHeight: 1.3,
          marginBottom: '16px',
          animation: 'fade-in 300ms ease-out',
        }}
      >
        {line1}
      </p>

      {line2 && (
        <p
          style={{
            fontFamily: "'Cormorant', Georgia, serif",
            fontWeight: 300,
            fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
            color: 'var(--color-mid)',
            lineHeight: 1.4,
            marginBottom: '40px',
            opacity: showLine2 ? 1 : 0,
            transition: 'opacity 500ms ease-out',
          }}
        >
          {line2}
        </p>
      )}

      {onLogCollapse && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: showAction ? 1 : 0,
            transition: 'opacity 400ms ease-out',
          }}
        >
          <button onClick={onLogCollapse} style={primaryBtnStyle}>
            Log the collapse
          </button>
          <button onClick={onClose} style={ghostBtnStyle}>
            Not now
          </button>
        </div>
      )}

      {!onLogCollapse && (
        <div
          style={{ cursor: 'pointer', position: 'absolute', inset: 0 }}
          onClick={onClose}
        />
      )}
    </div>
  )
}
