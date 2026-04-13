import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores'
import type { BreakHabit, ObservationStats, ObservationDay, ObservationEntry } from '../types/database'

const OBSERVATION_THRESHOLD = 14

interface Props {
  habit: BreakHabit
}

export function ObservationLogger({ habit }: Props) {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const queryKey = ['observations', habit.id]

  const { data: stats, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_observation_stats', { p_habit_id: habit.id })
      if (error) throw error
      return data as ObservationStats
    },
    enabled: !!user,
  })

  const { mutate: confirmPhaseChange, isPending: isConfirming } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('habits')
        .update({ current_phase: 'phase_2_replace' })
        .eq('id', habit.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', 'break'] })
    },
  })

  if (isLoading || !stats) return null

  const isComplete = stats.distinct_days_logged >= OBSERVATION_THRESHOLD

  if (isComplete) {
    return (
      <AcknowledgementScreen
        habitName={habit.name}
        onConfirm={() => confirmPhaseChange()}
        isPending={isConfirming}
      />
    )
  }

  return (
    <div className="mt-3 space-y-4">
      <p className="text-sm text-mid">
        {stats.days_remaining} {stats.days_remaining === 1 ? 'day' : 'days'} remaining in observation phase
      </p>
      <LogForm
        habitId={habit.id}
        userId={user!.id}
        onSaved={() => queryClient.invalidateQueries({ queryKey })}
      />
      {stats.observations_by_day.length > 0 && (
        <ObservationHistory days={stats.observations_by_day} />
      )}
    </div>
  )
}

// ─── Acknowledgement Screen ───────────────────────────────────────────────────

function AcknowledgementScreen({
  habitName,
  onConfirm,
  isPending,
}: {
  habitName: string
  onConfirm: () => void
  isPending: boolean
}) {
  return (
    <div className="mt-3 p-4 bg-accent-light border border-mid/20 rounded-lg space-y-4">
      <p className="font-medium text-primary">{habitName}</p>
      <p className="text-primary">
        You've completed 14 days of observation. You have enough to work with.
      </p>
      <p className="text-sm text-mid">
        The next phase is about replacing — finding what the habit is doing for you and
        giving that need another route.
      </p>
      <button
        onClick={onConfirm}
        disabled={isPending}
        className="px-4 py-2 bg-primary text-light text-sm rounded-lg disabled:opacity-50"
      >
        {isPending ? 'Moving on...' : 'Move to next phase'}
      </button>
    </div>
  )
}

// ─── Log Form ─────────────────────────────────────────────────────────────────

function LogForm({
  habitId,
  userId,
  onSaved,
}: {
  habitId: string
  userId: string
  onSaved: () => void
}) {
  const [open, setOpen] = useState(false)
  const [triggerOrTask, setTriggerOrTask] = useState('')
  const [driver, setDriver] = useState('')
  const [escapeRoute, setEscapeRoute] = useState('')
  const [emotionalState, setEmotionalState] = useState('')
  const [timeOfDay, setTimeOfDay] = useState('')
  const [fiveMinutesAfter, setFiveMinutesAfter] = useState('')
  const [physicalSensation, setPhysicalSensation] = useState('')

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('observations').insert({
        user_id: userId,
        habit_id: habitId,
        trigger_or_task: triggerOrTask || null,
        driver: driver || null,
        escape_route: escapeRoute || null,
        emotional_state: emotionalState || null,
        time_of_day: timeOfDay || null,
        five_minutes_after: fiveMinutesAfter || null,
        physical_sensation: physicalSensation || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      onSaved()
      setOpen(false)
      setTriggerOrTask('')
      setDriver('')
      setEscapeRoute('')
      setEmotionalState('')
      setTimeOfDay('')
      setFiveMinutesAfter('')
      setPhysicalSensation('')
    },
  })

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-accent hover:opacity-80"
      >
        Log an observation
      </button>
    )
  }

  return (
    <div className="p-4 bg-accent-light border border-mid/20 rounded-lg space-y-3">
      <p className="text-sm font-medium text-primary">Log an observation</p>

      <Field label="What were you doing or avoiding?" value={triggerOrTask} onChange={setTriggerOrTask} />
      <Field label="What job was it doing?" value={driver} onChange={setDriver} />
      <Field label="Was there an escape route available?" value={escapeRoute} onChange={setEscapeRoute} />
      <Field label="Emotional state at the time" value={emotionalState} onChange={setEmotionalState} />
      <Field label="Time of day" value={timeOfDay} onChange={setTimeOfDay} />
      <Field label="How did you feel five minutes after?" value={fiveMinutesAfter} onChange={setFiveMinutesAfter} />
      <Field label="Physical sensation" value={physicalSensation} onChange={setPhysicalSensation} />

      <div className="flex gap-3 pt-1">
        <button
          onClick={() => save()}
          disabled={isPending}
          className="px-4 py-1.5 bg-primary text-light text-sm rounded-lg disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-4 py-1.5 text-mid text-sm hover:text-primary"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-sm text-primary mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-mid/30 bg-light focus:outline-none focus:border-accent"
      />
    </div>
  )
}

// ─── Observation History ──────────────────────────────────────────────────────

function ObservationHistory({ days }: { days: ObservationDay[] }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-mid">Past observations</p>
      {days.map((day) => (
        <DayGroup key={day.date} day={day} />
      ))}
    </div>
  )
}

function DayGroup({ day }: { day: ObservationDay }) {
  const [open, setOpen] = useState(false)

  const label = new Date(day.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <div className="border border-mid/20 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex justify-between items-center p-3 text-left bg-accent-light hover:bg-mid/10"
      >
        <span className="text-sm text-primary">{label}</span>
        <span className="text-mid text-xs">
          {day.entries.length} {day.entries.length === 1 ? 'entry' : 'entries'} {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div className="divide-y divide-mid/10">
          {day.entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}

function EntryRow({ entry }: { entry: ObservationEntry }) {
  const fields: { label: string; value: string | null }[] = [
    { label: 'What was happening', value: entry.trigger_or_task },
    { label: 'Job it was doing', value: entry.driver },
    { label: 'Escape route', value: entry.escape_route },
    { label: 'Emotional state', value: entry.emotional_state },
    { label: 'Time of day', value: entry.time_of_day },
    { label: 'Five minutes after', value: entry.five_minutes_after },
    { label: 'Physical sensation', value: entry.physical_sensation },
  ]

  const populated = fields.filter((f) => f.value)

  return (
    <div className="p-3 space-y-1 bg-light text-sm">
      {populated.map((f) => (
        <div key={f.label}>
          <span className="text-mid text-xs">{f.label}: </span>
          <span className="text-primary">{f.value}</span>
        </div>
      ))}
    </div>
  )
}
