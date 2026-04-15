import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores'
import type { BreakHabit, HabitDriver, ObservationStats, ObservationDay, ObservationEntry } from '../types/database'

const OBSERVATION_THRESHOLD = 14

interface Props {
  habit: BreakHabit
}

// ─── Root ─────────────────────────────────────────────────────────────────────

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
    return <AcknowledgementScreen onConfirm={() => confirmPhaseChange()} isPending={isConfirming} />
  }

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="font-display font-normal text-[2rem] text-primary leading-none">
          {stats.distinct_days_logged}
        </span>
        <span className="font-sans font-medium text-[11px] tracking-[0.12em] uppercase text-mid">
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

function AcknowledgementScreen({ onConfirm, isPending }: { onConfirm: () => void; isPending: boolean }) {
  return (
    <div>
      <p className="eyebrow mb-3">Phase 1 complete</p>
      <p className="font-display italic font-light text-primary leading-snug mb-2.5" style={{ fontSize: 'clamp(1.3rem, 4vw, 1.6rem)' }}>
        14 days of observation. You have enough to work with.
      </p>
      <p className="font-sans font-light text-[13px] text-mid leading-relaxed mb-5">
        The next phase is about replacing — finding what the habit is doing for you and giving that need another route.
      </p>
      <button
        className="btn-primary"
        onClick={onConfirm}
        disabled={isPending}
        style={{ opacity: isPending ? 0.5 : 1 }}
      >
        {isPending ? 'Moving on...' : 'Move to next phase →'}
      </button>
    </div>
  )
}

// ─── Log Form ─────────────────────────────────────────────────────────────────

function LogForm({ habit, userId, onSaved }: { habit: BreakHabit; userId: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [triggerOrTask, setTriggerOrTask] = useState('')
  const [selectedDriver, setSelectedDriver] = useState<HabitDriver | null>(null)
  const [availableReplacement, setAvailableReplacement] = useState('')
  const [emotionalState, setEmotionalState] = useState('')
  const [fiveMinutesAfter, setFiveMinutesAfter] = useState('')
  const [physicalSensation, setPhysicalSensation] = useState('')
  const [showDetail, setShowDetail] = useState(false)

  function handleDriverSelect(driver: HabitDriver) {
    setSelectedDriver(driver)
    setAvailableReplacement('')
  }

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('observations').insert({
        user_id: userId,
        habit_id: habit.id,
        trigger_or_task:       triggerOrTask       || null,
        driver:                selectedDriver?.key || null,
        available_replacement: availableReplacement || null,
        emotional_state:       emotionalState      || null,
        five_minutes_after:    fiveMinutesAfter    || null,
        physical_sensation:    physicalSensation   || null,
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
      setShowDetail(false)
    },
  })

  if (!open) {
    return <button className="btn-primary" onClick={() => setOpen(true)}>Log an observation</button>
  }

  return (
    <div className="flex flex-col gap-4">

      <div>
        <label className="label-field">What were you doing or avoiding?</label>
        <input
          type="text"
          value={triggerOrTask}
          onChange={(e) => setTriggerOrTask(e.target.value)}
          autoFocus
          className="input-base"
        />
      </div>

      <div>
        <label className="label-field">What job was it doing?</label>
        <div className="flex flex-wrap gap-2">
          {habit.habit_drivers.map((driver) => {
            const selected = selectedDriver?.key === driver.key
            return (
              <button
                key={driver.key}
                onClick={() => handleDriverSelect(driver)}
                className={`px-3.5 py-2 rounded-full border font-sans text-[13px] cursor-pointer transition-all duration-150 whitespace-nowrap ${
                  selected ? 'border-accent bg-canvas font-medium text-primary' : 'border-border bg-transparent font-normal text-mid'
                }`}
              >
                {driver.label}
              </button>
            )
          })}
        </div>
      </div>

      {!showDetail ? (
        <button
          onClick={() => setShowDetail(true)}
          className="font-sans font-normal text-[11px] tracking-[0.08em] text-mid bg-transparent border-none p-0 cursor-pointer self-start"
        >
          + Add more detail
        </button>
      ) : (
        <>
          {selectedDriver && selectedDriver.replacements.length > 0 && (
            <div>
              <label className="label-field">What was available at the moment?</label>
              <div className="flex flex-wrap gap-2">
                {selectedDriver.replacements.map((r) => {
                  const selected = availableReplacement === r
                  return (
                    <button
                      key={r}
                      onClick={() => setAvailableReplacement(r)}
                      className={`px-3.5 py-2 rounded-full border font-sans text-[13px] cursor-pointer transition-all duration-150 whitespace-nowrap ${
                        selected ? 'border-accent bg-canvas font-medium text-primary' : 'border-border bg-transparent font-normal text-mid'
                      }`}
                    >
                      {r}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <label className="label-field">Emotional state at the time</label>
            <input type="text" value={emotionalState} onChange={(e) => setEmotionalState(e.target.value)} className="input-base" />
          </div>

          <div>
            <label className="label-field">Physical sensation</label>
            <input type="text" value={physicalSensation} onChange={(e) => setPhysicalSensation(e.target.value)} className="input-base" />
          </div>

          <div>
            <label className="label-field">How did you feel five minutes after?</label>
            <input type="text" value={fiveMinutesAfter} onChange={(e) => setFiveMinutesAfter(e.target.value)} className="input-base" />
          </div>
        </>
      )}

      <div className="flex gap-4 justify-end">
        <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
        <button
          className="btn-primary"
          onClick={() => save()}
          disabled={isPending}
          style={{ opacity: isPending ? 0.5 : 1 }}
        >
          {isPending ? 'Saving...' : 'Save'}
        </button>
        
      </div>
    </div>
  )
}

// ─── Observation History ──────────────────────────────────────────────────────

function ObservationHistory({ days }: { days: ObservationDay[] }) {
  return (
    <div className="mt-6">
      <p className="font-sans font-medium text-[11px] tracking-[0.12em] uppercase text-mid mb-3">
        Past observations
      </p>
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
    <div className="border-b border-border">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex justify-between items-center py-3 bg-transparent border-none cursor-pointer text-left"
      >
        <span className="font-sans font-normal text-[13px] text-primary">{label}</span>
        <div className="flex items-center gap-2.5">
          <span className="font-sans text-[11px] text-mid">
            {day.entries.length} {day.entries.length === 1 ? 'entry' : 'entries'}
          </span>
          <span
            className="text-xs text-mid inline-block transition-transform duration-200"
            style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
          >
            +
          </span>
        </div>
      </button>
      {open && (
        <div className="pb-3 flex flex-col gap-3">
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
    { label: 'What was happening',  value: entry.trigger_or_task },
    { label: 'Job it was doing',    value: entry.driver },
    { label: 'What was available',  value: entry.available_replacement },
    { label: 'Emotional state',     value: entry.emotional_state },
    { label: 'Five minutes after',  value: entry.five_minutes_after },
    { label: 'Physical sensation',  value: entry.physical_sensation },
  ]

  const populated = fields.filter((f) => f.value)

  return (
    <div className="pl-3 border-l-2 border-accent opacity-85">
      <p className="font-sans font-medium text-[11px] tracking-[0.12em] uppercase text-mid mb-1.5">
        {time}
      </p>
      {populated.map((f) => (
        <div key={f.label} className="mb-0.5">
          <span className="font-sans text-xs text-mid">{f.label}: </span>
          <span className="font-sans font-normal text-xs text-primary">{f.value}</span>
        </div>
      ))}
    </div>
  )
}
