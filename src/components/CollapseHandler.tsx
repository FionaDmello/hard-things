import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore, useHabitStore } from '../stores'
import type { Habit } from '../types/database'

interface Props {
  // If provided, skip the habit picker and go straight to the flow
  habit?: Habit
  onClose: () => void
}

const WHAT_GAVE_WAY_OPTIONS = [
  'distress tolerance was low',
  'logistics got in the way',
  'emotional load was too high',
  'not sure',
]

export function CollapseHandler({ habit: initialHabit, onClose }: Props) {
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(initialHabit ?? null)
  const habits = useHabitStore((state) => state.habits)
  const user = useAuthStore((state) => state.user)

  return (
    <div className="fixed inset-0 bg-light z-50 overflow-y-auto">
      <div className="p-6 max-w-2xl mx-auto min-h-screen">
        <button
          onClick={onClose}
          className="text-mid text-sm hover:text-primary mb-6"
        >
          ← Close
        </button>

        {!selectedHabit ? (
          <HabitPicker habits={habits} onSelect={setSelectedHabit} />
        ) : selectedHabit.section === 'build' ? (
          <BuildCollapseFlow
            habit={selectedHabit}
            userId={user!.id}
            onClose={onClose}
          />
        ) : (
          <BreakCollapseFlow
            habit={selectedHabit}
            userId={user!.id}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  )
}

// ─── Habit Picker ─────────────────────────────────────────────────────────────

function HabitPicker({ habits, onSelect }: { habits: Habit[]; onSelect: (h: Habit) => void }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-primary">Collapse handler</h1>
      <p className="text-mid">Which habit?</p>
      <div className="space-y-2">
        {habits.map((habit) => (
          <button
            key={habit.id}
            onClick={() => onSelect(habit)}
            className="w-full p-4 bg-accent-light border border-mid/20 rounded-lg text-left hover:border-mid/40"
          >
            <p className="font-medium text-primary">{habit.name}</p>
            <p className="text-sm text-mid capitalize">{habit.section === 'break' ? 'Habits to break' : 'Habits to build'}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Build Collapse Flow ──────────────────────────────────────────────────────

function BuildCollapseFlow({ habit, userId, onClose }: { habit: Habit; userId: string; onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [whatHappened, setWhatHappened] = useState('')
  const [whatGaveWay, setWhatGaveWay] = useState('')
  const [returnConfirmed, setReturnConfirmed] = useState<boolean | null>(null)

  // Determine today's sub-habit for non-negotiable version
  const today = new Date().getDay()
  const subHabit = habit.habit_schedule[String(today)] ?? Object.values(habit.habit_schedule)[0] ?? 'yoga'
  const nonNegotiable =
    habit.habit_versions[subHabit]?.find((v) => v.level === 'non_negotiable')?.description ??
    Object.values(habit.habit_versions).flat().find((v) => v.level === 'non_negotiable')?.description

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

      // If returning at minimum, upsert today's check-in as non-negotiable
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
    onSuccess: onClose,
  })

  if (step === 1) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-primary">{habit.name}</h1>
        <p className="text-mid font-medium">What happened? Describe it as fact, not judgment.</p>
        <textarea
          value={whatHappened}
          onChange={(e) => setWhatHappened(e.target.value)}
          rows={4}
          autoFocus
          className="w-full px-3 py-2 text-sm rounded-lg border border-mid/30 bg-accent-light focus:outline-none focus:border-accent resize-none"
        />
        <button
          onClick={() => setStep(2)}
          disabled={!whatHappened.trim()}
          className="px-4 py-2 bg-primary text-light text-sm rounded-lg disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-primary">{habit.name}</h1>
        <p className="text-mid font-medium">Identify what gave way.</p>
        <div className="space-y-2">
          {WHAT_GAVE_WAY_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => setWhatGaveWay(option)}
              className={`w-full p-3 rounded-lg border text-left text-sm transition-all ${
                whatGaveWay === option
                  ? 'border-accent bg-accent-light font-medium text-primary'
                  : 'border-mid/20 text-primary hover:border-mid/40'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <button
          onClick={() => setStep(3)}
          disabled={!whatGaveWay}
          className="px-4 py-2 bg-primary text-light text-sm rounded-lg disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-primary">{habit.name}</h1>
      <p className="text-mid font-medium">Return at the minimum.</p>
      {nonNegotiable && (
        <div className="p-4 bg-accent-light border border-mid/20 rounded-lg">
          <p className="text-sm text-mid mb-1">The non-negotiable version</p>
          <p className="text-primary">{nonNegotiable}</p>
        </div>
      )}
      <p className="text-primary">Can you do this today?</p>
      <div className="flex gap-3">
        <button
          onClick={() => { setReturnConfirmed(true); save(true) }}
          disabled={isPending}
          className="flex-1 py-2 bg-primary text-light text-sm rounded-lg disabled:opacity-50"
        >
          Yes
        </button>
        <button
          onClick={() => { setReturnConfirmed(false); save(false) }}
          disabled={isPending}
          className="flex-1 py-2 border border-mid/30 text-primary text-sm rounded-lg disabled:opacity-50"
        >
          Not today
        </button>
      </div>
      {returnConfirmed === false && !isPending && (
        <p className="text-mid text-sm">Logged. Rest, and return tomorrow.</p>
      )}
    </div>
  )
}

// ─── Break Collapse Flow ──────────────────────────────────────────────────────

function BreakCollapseFlow({ habit, userId, onClose }: { habit: Habit; userId: string; onClose: () => void }) {
  const [step, setStep] = useState(1)
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
    onSuccess: onClose,
  })

  if (step === 1) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-primary">{habit.name}</h1>
        <p className="text-mid font-medium">It happened. Describe it as fact, not judgment.</p>
        <textarea
          value={whatHappened}
          onChange={(e) => setWhatHappened(e.target.value)}
          rows={4}
          autoFocus
          className="w-full px-3 py-2 text-sm rounded-lg border border-mid/30 bg-accent-light focus:outline-none focus:border-accent resize-none"
        />
        <button
          onClick={() => setStep(2)}
          disabled={!whatHappened.trim()}
          className="px-4 py-2 bg-primary text-light text-sm rounded-lg disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-primary">{habit.name}</h1>
        <p className="text-mid font-medium">Which job was it doing?</p>
        <div className="flex flex-wrap gap-2">
          {habit.habit_drivers.map((driver) => (
            <button
              key={driver.key}
              onClick={() => setJobIfBreak(driver.key)}
              className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                jobIfBreak === driver.key
                  ? 'border-accent bg-accent-light font-medium text-primary'
                  : 'border-mid/20 text-primary hover:border-mid/40'
              }`}
            >
              {driver.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setStep(3)}
          disabled={!jobIfBreak}
          className="px-4 py-2 bg-primary text-light text-sm rounded-lg disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-primary">{habit.name}</h1>
      <p className="text-mid font-medium">Which replacement was unavailable or insufficient?</p>
      <textarea
        value={replacementUnavailable}
        onChange={(e) => setReplacementUnavailable(e.target.value)}
        rows={3}
        autoFocus
        className="w-full px-3 py-2 text-sm rounded-lg border border-mid/30 bg-accent-light focus:outline-none focus:border-accent resize-none"
      />
      <div className="p-4 bg-accent-light border border-mid/20 rounded-lg">
        <p className="text-primary text-sm">
          The slip ends here. The next urge — execute the protocol.
        </p>
      </div>
      <button
        onClick={() => save()}
        disabled={isPending}
        className="px-4 py-2 bg-primary text-light text-sm rounded-lg disabled:opacity-50"
      >
        {isPending ? 'Saving...' : 'Done'}
      </button>
    </div>
  )
}
