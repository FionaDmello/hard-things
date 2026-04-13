import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores'
import type { BreakHabit, HabitDriver, ObservationStats, ObservationDay, ObservationEntry } from '../types/database'

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
        onConfirm={() => confirmPhaseChange()}
        isPending={isConfirming}
      />
    )
  }

  return (
    <div className="mt-4 space-y-5">
      {/* Progress */}
      <div className="flex items-baseline gap-2">
        <span
          className="text-primary"
          style={{ fontFamily: "'Cormorant', Georgia, serif", fontWeight: 400, fontSize: '1.6rem', lineHeight: 1 }}
        >
          {stats.distinct_days_logged}
        </span>
        <span className="text-xs uppercase tracking-[0.15em] text-mid">
          of {OBSERVATION_THRESHOLD} days observed
        </span>
      </div>

      <LogForm
        habit={habit}
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
  onConfirm,
  isPending,
}: {
  onConfirm: () => void
  isPending: boolean
}) {
  return (
    <div className="mt-4 space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-mid mb-3">Phase 1 complete</p>
        <h3
          className="text-primary leading-snug"
          style={{ fontFamily: "'Cormorant', Georgia, serif", fontWeight: 300, fontSize: 'clamp(1.4rem, 4vw, 1.75rem)' }}
        >
          14 days of observation. You have enough to work with.
        </h3>
      </div>
      <p className="text-sm text-mid leading-relaxed">
        The next phase is about replacing — finding what the habit is doing for you
        and giving that need another route.
      </p>
      <button
        onClick={onConfirm}
        disabled={isPending}
        className="w-full py-3 px-4 bg-primary text-light text-sm rounded-xl flex items-center justify-between disabled:opacity-50"
      >
        <span>{isPending ? 'Moving on...' : 'Move to next phase'}</span>
        <span className="opacity-60">→</span>
      </button>
    </div>
  )
}

// ─── Log Form ─────────────────────────────────────────────────────────────────

function LogForm({
  habit,
  userId,
  onSaved,
}: {
  habit: BreakHabit
  userId: string
  onSaved: () => void
}) {
  const [open, setOpen] = useState(false)
  const [triggerOrTask, setTriggerOrTask] = useState('')
  const [selectedDriver, setSelectedDriver] = useState<HabitDriver | null>(null)
  const [availableReplacement, setAvailableReplacement] = useState('')
  const [emotionalState, setEmotionalState] = useState('')
  const [fiveMinutesAfter, setFiveMinutesAfter] = useState('')
  const [physicalSensation, setPhysicalSensation] = useState('')

  function handleDriverSelect(driverKey: string) {
    const driver = habit.habit_drivers.find((d) => d.key === driverKey) ?? null
    setSelectedDriver(driver)
    setAvailableReplacement('')
  }

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('observations').insert({
        user_id: userId,
        habit_id: habit.id,
        trigger_or_task: triggerOrTask || null,
        driver: selectedDriver?.key || null,
        available_replacement: availableReplacement || null,
        emotional_state: emotionalState || null,
        five_minutes_after: fiveMinutesAfter || null,
        physical_sensation: physicalSensation || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      onSaved()
      setOpen(false)
      setTriggerOrTask('')
      setSelectedDriver(null)
      setAvailableReplacement('')
      setEmotionalState('')
      setFiveMinutesAfter('')
      setPhysicalSensation('')
    },
  })

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 px-4 border border-mid/25 text-primary rounded-xl text-left flex items-center justify-between group hover:border-mid/50 transition-colors"
      >
        <span className="text-sm">Log an observation</span>
        <span className="text-mid opacity-40 group-hover:opacity-80">+</span>
      </button>
    )
  }

  return (
    <div className="p-4 border border-mid/20 rounded-xl space-y-4">
      <p className="text-xs uppercase tracking-[0.2em] text-mid">New observation</p>

      <Field label="What were you doing or avoiding?" value={triggerOrTask} onChange={setTriggerOrTask} />

      <SelectField label="What job was it doing?">
        <select
          value={selectedDriver?.key ?? ''}
          onChange={(e) => handleDriverSelect(e.target.value)}
          className="w-full px-3 py-2 pr-8 text-sm rounded-lg border border-mid/30 bg-light focus:outline-none focus:border-accent appearance-none"
        >
          <option value="">Select a driver</option>
          {habit.habit_drivers.map((d) => (
            <option key={d.key} value={d.key}>{d.label}</option>
          ))}
        </select>
      </SelectField>

      {selectedDriver && selectedDriver.replacements.length > 0 && (
        <SelectField label="What was available at the moment?">
          <select
            value={availableReplacement}
            onChange={(e) => setAvailableReplacement(e.target.value)}
            className="w-full px-3 py-2 pr-8 text-sm rounded-lg border border-mid/30 bg-light focus:outline-none focus:border-accent appearance-none"
          >
            <option value="">Select a replacement</option>
            {selectedDriver.replacements.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </SelectField>
      )}

      <Field label="Emotional state at the time" value={emotionalState} onChange={setEmotionalState} />
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
      <label className="block text-xs uppercase tracking-[0.15em] text-mid mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 pr-8 text-sm rounded-lg border border-mid/30 bg-light focus:outline-none focus:border-accent appearance-none"
      />
    </div>
  )
}

function SelectField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-[0.15em] text-mid mb-1.5">{label}</label>
      <div className="relative">
        {children}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-primary text-sm">
          ▾
        </span>
      </div>
    </div>
  )
}

// ─── Observation History ──────────────────────────────────────────────────────

function ObservationHistory({ days }: { days: ObservationDay[] }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-mid mb-3">Past observations</p>
      <div>
        {days.map((day) => (
          <DayGroup key={day.date} day={day} />
        ))}
      </div>
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
    <div className="border-b border-mid/15 last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex justify-between items-center py-3 text-left group"
      >
        <span className="text-sm text-primary group-hover:text-accent transition-colors">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-mid">
            {day.entries.length} {day.entries.length === 1 ? 'entry' : 'entries'}
          </span>
          <span
            className="w-4 h-4 flex items-center justify-center text-mid transition-transform duration-200"
            style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
          >
            +
          </span>
        </div>
      </button>
      {open && (
        <div className="mt-1 mb-4 space-y-4">
          {day.entries.map((entry) => (
            <EntryRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}

function EntryRow({ entry }: { entry: ObservationEntry }) {
  const time = new Date(entry.created_at).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const fields: { label: string; value: string | null }[] = [
    { label: 'What was happening', value: entry.trigger_or_task },
    { label: 'Job it was doing', value: entry.driver },
    { label: 'What was available', value: entry.available_replacement },
    { label: 'Emotional state', value: entry.emotional_state },
    { label: 'Five minutes after', value: entry.five_minutes_after },
    { label: 'Physical sensation', value: entry.physical_sensation },
  ]

  const populated = fields.filter((f) => f.value)

  return (
    <div
      className="pl-4 space-y-1.5 text-sm"
      style={{ borderLeft: '2px solid var(--color-accent)', opacity: 0.85 }}
    >
      <p className="text-xs uppercase tracking-[0.15em] text-mid">{time}</p>
      {populated.map((f) => (
        <div key={f.label}>
          <span className="text-mid text-xs">{f.label}: </span>
          <span className="text-primary">{f.value}</span>
        </div>
      ))}
    </div>
  )
}
