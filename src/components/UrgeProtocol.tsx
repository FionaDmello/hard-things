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

const ACTIVE_STEPS = new Set<UrgeStep>(['surfing_active', 'replacement_active', 'delay_active'])

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

  useEffect(() => {
    if (!isLoading && breakHabits.length === 1 && step === 'habit_select') {
      setSelectedHabit(breakHabits[0])
      setStep('urge_entry')
    }
  }, [isLoading, breakHabits.length, step])

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

  const selectedDriver = selectedHabit?.habit_drivers.find(d => d.key === driverKey) ?? null

  const dragStyle: React.CSSProperties =
    dragY > 0
      ? { transform: `translateY(${dragY}px)`, transition: 'none' }
      : isSnapping
        ? { transform: 'translateY(0)', transition: 'transform 200ms ease-out' }
        : { animation: 'slide-up 320ms cubic-bezier(0.32, 0.72, 0, 1) both' }

  return (
    <div
      className="fixed inset-0 bg-canvas z-50 overflow-hidden"
      style={step === 'logged_success' ? undefined : dragStyle}
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
        <div className="max-w-lg mx-auto px-6 pt-12 pb-24 min-h-screen">

          {!isActive && (
            <div className="flex justify-center mb-8">
              <div className="w-10 h-1 rounded-full bg-mid opacity-30" />
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

function NavBar({ onBack, onClose }: { onBack?: () => void; onClose?: () => void }) {
  return (
    <div className="flex justify-between items-center mb-10">
      {onBack ? (
        <button onClick={onBack} className="inline-flex items-center gap-1.5 btn-secondary">
          <span>←</span><span>Back</span>
        </button>
      ) : (
        <div />
      )}
      {onClose && (
        <button onClick={onClose} className="btn-secondary">Close</button>
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
    <div className="flex justify-center">
      <svg width="140" height="140" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="45" fill="none" stroke="var(--color-mid)" strokeOpacity="0.15" strokeWidth="2" />
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
        <text
          x="60" y="60"
          textAnchor="middle"
          dominantBaseline="central"
          style={{ fill: 'var(--color-primary)', fontFamily: "'Cormorant', Georgia, serif", fontWeight: 300, fontSize: '18px' }}
        >
          {m}:{String(s).padStart(2, '0')}
        </text>
      </svg>
    </div>
  )
}

// ─── Habit select screen ──────────────────────────────────────────────────────

function HabitSelectScreen({ habits, isLoading, onSelect, onClose }: {
  habits: BreakHabit[]
  isLoading: boolean
  onSelect: (h: BreakHabit) => void
  onClose: () => void
}) {
  return (
    <div>
      <button onClick={onClose} className="inline-flex items-center gap-1.5 btn-secondary mb-10">
        <span>←</span><span>Close</span>
      </button>

      <header className="mb-10">
        <h1 className="font-display font-light text-primary leading-tight" style={{ fontSize: 'clamp(2.4rem, 8vw, 3.2rem)' }}>
          You're in an urge.
        </h1>
        <p className="font-sans font-medium text-[11px] tracking-[0.2em] uppercase text-mid mt-3">Which habit?</p>
        <div className="mt-4 h-px bg-border" />
      </header>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map((n) => <div key={n} className="h-16 rounded-xl bg-mid opacity-10" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {habits.map((h) => (
            <button
              key={h.id}
              onClick={() => onSelect(h)}
              className="card w-full flex items-center justify-between p-5 cursor-pointer text-left bg-transparent border-none"
            >
              <span className="font-sans font-medium text-sm text-primary">{h.name}</span>
              <span className="text-mid opacity-50 text-sm">→</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Urge entry screen ────────────────────────────────────────────────────────

function UrgeEntryScreen({ habitName, intensity, onSelect, onContinue, onBack, onClose }: {
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
      <div className="flex flex-col gap-8">
        <div>
          <p className="font-sans font-medium text-[11px] tracking-[0.2em] uppercase text-mid mb-5">{habitName}</p>
          <p className="font-display font-light text-primary leading-snug" style={{ fontSize: 'clamp(1.6rem, 5vw, 2rem)' }}>
            You're in an urge.<br />You opened the app.<br />That already matters.
          </p>
        </div>
        <div>
          <p className="font-sans font-medium text-[11px] tracking-[0.2em] uppercase text-mid mb-4">Intensity</p>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => onSelect(n)}
                className={`w-10 h-10 rounded-xl border font-sans text-[13px] cursor-pointer transition-all duration-150 ${
                  intensity === n
                    ? 'border-primary bg-primary text-canvas font-medium'
                    : intensity !== null
                      ? 'border-border text-primary opacity-40'
                      : 'border-border text-primary font-normal'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <button
          className="btn-primary self-start"
          onClick={onContinue}
          disabled={intensity === null}
          style={{ opacity: intensity !== null ? 1 : 0.4 }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

// ─── Driver select screen ─────────────────────────────────────────────────────

function DriverSelectScreen({ habit, driverKey, onSelect, onContinue, onBack, onClose }: {
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
      <div className="flex flex-col gap-8">
        <div>
          <p className="font-sans font-medium text-[11px] tracking-[0.2em] uppercase text-mid mb-5">{habit.name}</p>
          <p className="font-display font-normal text-primary leading-snug" style={{ fontSize: 'clamp(1.4rem, 4vw, 1.75rem)' }}>
            Which job is it doing right now?
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {habit.habit_drivers.map((d) => (
            <button
              key={d.key}
              onClick={() => onSelect(d.key)}
              className={`px-4 py-2.5 rounded-full border font-sans text-[13px] cursor-pointer transition-all duration-150 whitespace-nowrap ${
                driverKey === d.key
                  ? 'border-accent bg-card font-medium text-primary'
                  : driverKey !== null
                    ? 'border-border text-primary opacity-40'
                    : 'border-border text-primary font-normal'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <button
          className="btn-primary self-start"
          onClick={onContinue}
          disabled={!driverKey}
          style={{ opacity: driverKey ? 1 : 0.4 }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

// ─── Tool select screen ───────────────────────────────────────────────────────

const TOOLS: { id: 'surf' | 'replace' | 'delay'; name: string; description: string }[] = [
  { id: 'surf',    name: 'Surf it',    description: 'Observe the urge without acting. Breathing-paced timer.' },
  { id: 'replace', name: 'Replace it', description: 'Use a replacement for what this urge is doing.' },
  { id: 'delay',   name: 'Delay it',   description: "Ten minutes. If it's still there after, it can be." },
]

function ToolSelectScreen({ onStart, onBack, onClose }: {
  onStart: (t: 'surf' | 'replace' | 'delay') => void
  onBack: () => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState<'surf' | 'replace' | 'delay' | null>(null)

  return (
    <div>
      <NavBar onBack={onBack} onClose={onClose} />
      <div className="flex flex-col gap-8">
        <p className="font-display font-normal text-primary leading-snug" style={{ fontSize: 'clamp(1.4rem, 4vw, 1.75rem)' }}>
          Choose a tool.
        </p>
        <div className="flex flex-col gap-3">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setSelected(tool.id)}
              className={`w-full p-5 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                selected === tool.id ? 'border-accent bg-card' : 'border-border bg-transparent'
              }`}
            >
              <p className="font-sans font-medium text-[13px] text-primary mb-1">{tool.name}</p>
              <p className="font-sans font-light text-xs text-mid leading-relaxed">{tool.description}</p>
            </button>
          ))}
        </div>
        <button
          className="btn-primary self-start"
          onClick={() => selected && onStart(selected)}
          disabled={!selected}
          style={{ opacity: selected ? 1 : 0.4 }}
        >
          Start
        </button>
      </div>
    </div>
  )
}

// ─── Surfing active screen ────────────────────────────────────────────────────

function SurfingScreen({ elapsedMs, onActedOn, onPassed }: {
  elapsedMs: number
  onActedOn: () => void
  onPassed: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <p className="font-sans font-medium text-[11px] tracking-[0.2em] uppercase text-mid mb-12">Surfing</p>
      <BreathingArc elapsedMs={elapsedMs} totalMs={TIMER_MS} />
      <p className="font-display italic font-light text-base text-mid leading-relaxed text-center max-w-[200px] mt-10 mb-16">
        Observe it. You don't have to act on it.
      </p>
      <div className="flex flex-col items-center gap-4 w-full max-w-xs">
        <button
          onClick={onPassed}
          className="w-full py-3 bg-primary text-canvas font-sans font-medium text-[13px] rounded-xl border-none cursor-pointer"
        >
          It passed
        </button>
        <button onClick={onActedOn} className="btn-secondary opacity-70">I acted on it</button>
      </div>
    </div>
  )
}

// ─── Replacement select screen ────────────────────────────────────────────────

function ReplacementSelectScreen({ driver, onSelect, onBack, onClose }: {
  driver: HabitDriver
  onSelect: (r: string) => void
  onBack: () => void
  onClose: () => void
}) {
  return (
    <div>
      <NavBar onBack={onBack} onClose={onClose} />
      <div className="flex flex-col gap-8">
        <div>
          <p className="font-sans font-medium text-[11px] tracking-[0.2em] uppercase text-mid mb-5">{driver.label}</p>
          <p className="font-display font-normal text-primary leading-snug" style={{ fontSize: 'clamp(1.4rem, 4vw, 1.75rem)' }}>
            Which replacement?
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {driver.replacements.map((r) => (
            <button
              key={r}
              onClick={() => onSelect(r)}
              className="card w-full py-4 px-5 text-left font-sans font-normal text-[13px] text-primary cursor-pointer bg-transparent border-none"
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

function ReplacementActiveScreen({ replacement, onDone, onActedOn }: {
  replacement: string
  onDone: () => void
  onActedOn: () => void
}) {
  return (
    <div className="flex flex-col justify-center min-h-[65vh]">
      <div className="flex flex-col gap-10">
        <p className="font-display font-light text-primary leading-tight" style={{ fontSize: 'clamp(2rem, 6vw, 2.6rem)' }}>
          {replacement}
        </p>
        <div className="flex flex-col gap-4 items-start">
          <button
            onClick={onDone}
            className="py-3 px-6 bg-primary text-canvas font-sans font-medium text-[13px] rounded-xl border-none cursor-pointer"
          >
            Done
          </button>
          <button onClick={onActedOn} className="btn-secondary opacity-70">I acted on it anyway</button>
        </div>
      </div>
    </div>
  )
}

// ─── Delay active screen ──────────────────────────────────────────────────────

function DelayScreen({ elapsedMs, onActedOn, onPassed }: {
  elapsedMs: number
  onActedOn: () => void
  onPassed: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <p className="font-sans font-medium text-[11px] tracking-[0.2em] uppercase text-mid mb-12">Delay</p>
      <BreathingArc elapsedMs={elapsedMs} totalMs={TIMER_MS} />
      <p className="font-display italic font-light text-base text-mid leading-relaxed text-center max-w-[220px] mt-10 mb-16">
        Ten minutes. If it still wants to be there after that, it can.
      </p>
      <div className="flex flex-col items-center gap-4 w-full max-w-xs">
        <button
          onClick={onPassed}
          className="w-full py-3 bg-primary text-canvas font-sans font-medium text-[13px] rounded-xl border-none cursor-pointer"
        >
          It passed early
        </button>
        <button onClick={onActedOn} className="btn-secondary opacity-70">I acted on it</button>
      </div>
    </div>
  )
}

// ─── Resolution screen ────────────────────────────────────────────────────────

function ResolutionScreen({ onActedOn, onPassed }: { onActedOn: () => void; onPassed: () => void }) {
  return (
    <div className="flex flex-col justify-center min-h-[60vh] animate-[fade-in_300ms_ease-out]">
      <div className="flex flex-col gap-8">
        <p className="font-display font-light text-primary leading-snug" style={{ fontSize: 'clamp(1.6rem, 5vw, 2rem)' }}>
          Time's up.
        </p>
        <p className="font-sans font-light text-[13px] text-mid">How did it go?</p>
        <div className="flex flex-col gap-3 items-start">
          <button
            onClick={onPassed}
            className="py-3 px-6 bg-primary text-canvas font-sans font-medium text-[13px] rounded-xl border-none cursor-pointer min-w-[160px]"
          >
            It passed
          </button>
          <button
            onClick={onActedOn}
            className="py-3 px-6 border border-border text-primary font-sans font-normal text-[13px] rounded-xl bg-transparent cursor-pointer min-w-[160px]"
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

function SuccessScreen({ outcome, onClose, onLogCollapse }: {
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
    <div className="flex flex-col justify-center min-h-screen px-6 max-w-lg mx-auto">
      <p
        className="font-display font-light text-primary leading-snug mb-4 animate-[fade-in_300ms_ease-out]"
        style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)' }}
      >
        {line1}
      </p>

      {line2 && (
        <p
          className="font-display font-light text-mid leading-snug mb-10 transition-opacity duration-500"
          style={{ fontSize: 'clamp(1.2rem, 4vw, 1.6rem)', opacity: showLine2 ? 1 : 0 }}
        >
          {line2}
        </p>
      )}

      {onLogCollapse && (
        <div
          className="flex items-center justify-between transition-opacity duration-[400ms]"
          style={{ opacity: showAction ? 1 : 0 }}
        >
          <button
            onClick={onLogCollapse}
            className="py-3 px-6 bg-primary text-canvas font-sans font-medium text-[13px] rounded-xl border-none cursor-pointer"
          >
            Log the collapse
          </button>
          <button onClick={onClose} className="btn-secondary opacity-70">Not now</button>
        </div>
      )}

      {!onLogCollapse && (
        <div className="absolute inset-0 cursor-pointer" onClick={onClose} />
      )}
    </div>
  )
}
