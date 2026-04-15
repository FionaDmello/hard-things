import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores'
import type { BreakHabit, HabitDriver, ObservationStats, ObservationDay, ObservationEntry } from '../types/database'

const OBSERVATION_THRESHOLD = 14

interface Props {
  habit: BreakHabit
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: 'var(--color-canvas)',
  border: '1px solid var(--color-border)',
  borderRadius: '0.5rem',
  padding: '10px 12px',
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontWeight: 300,
  fontSize: '14px',
  color: 'var(--color-primary)',
  outline: 'none',
  boxSizing: 'border-box' as const,
}

const labelStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontWeight: 500,
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: 'var(--color-mid)',
  display: 'block',
  marginBottom: '8px',
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

const btnSecondary: React.CSSProperties = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontWeight: 400,
  fontSize: '12px',
  color: 'var(--color-mid)',
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
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
      {/* Progress counter */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
        <span style={{
          fontFamily: "'Cormorant', Georgia, serif",
          fontWeight: 400,
          fontSize: '2rem',
          color: 'var(--color-primary)',
          lineHeight: 1,
        }}>
          {stats.distinct_days_logged}
        </span>
        <span style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 500,
          fontSize: '11px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-mid)',
        }}>
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
      <p style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontWeight: 500,
        fontSize: '11px',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--color-accent)',
        marginBottom: '12px',
      }}>
        Phase 1 complete
      </p>
      <p style={{
        fontFamily: "'Cormorant', Georgia, serif",
        fontStyle: 'italic',
        fontWeight: 300,
        fontSize: 'clamp(1.3rem, 4vw, 1.6rem)',
        color: 'var(--color-primary)',
        lineHeight: 1.3,
        marginBottom: '10px',
      }}>
        14 days of observation. You have enough to work with.
      </p>
      <p style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontWeight: 300,
        fontSize: '13px',
        color: 'var(--color-mid)',
        lineHeight: 1.6,
        marginBottom: '20px',
      }}>
        The next phase is about replacing — finding what the habit is doing for you and giving that need another route.
      </p>
      <button
        onClick={onConfirm}
        disabled={isPending}
        style={{ ...btnPrimary, opacity: isPending ? 0.5 : 1 }}
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
    return (
      <button onClick={() => setOpen(true)} style={btnPrimary}>
        Log an observation
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Essential: trigger / task */}
      <div>
        <label style={labelStyle}>What were you doing or avoiding?</label>
        <input
          type="text"
          value={triggerOrTask}
          onChange={(e) => setTriggerOrTask(e.target.value)}
          autoFocus
          style={inputStyle}
        />
      </div>

      {/* Essential: driver chips */}
      <div>
        <label style={labelStyle}>What job was it doing?</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {habit.habit_drivers.map((driver) => {
            const selected = selectedDriver?.key === driver.key
            return (
              <button
                key={driver.key}
                onClick={() => handleDriverSelect(driver)}
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
      </div>

      {/* Enriching detail — toggle */}
      {!showDetail ? (
        <button
          onClick={() => setShowDetail(true)}
          style={{ ...btnSecondary, fontSize: '11px', letterSpacing: '0.08em', alignSelf: 'flex-start' }}
        >
          + Add more detail
        </button>
      ) : (
        <>
          {/* Available replacement — chips if driver has replacements, otherwise text */}
          {selectedDriver && selectedDriver.replacements.length > 0 && (
            <div>
              <label style={labelStyle}>What was available at the moment?</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedDriver.replacements.map((r) => {
                  const selected = availableReplacement === r
                  return (
                    <button
                      key={r}
                      onClick={() => setAvailableReplacement(r)}
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
                      {r}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>Emotional state at the time</label>
            <input type="text" value={emotionalState} onChange={(e) => setEmotionalState(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Physical sensation</label>
            <input type="text" value={physicalSensation} onChange={(e) => setPhysicalSensation(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>How did you feel five minutes after?</label>
            <input type="text" value={fiveMinutesAfter} onChange={(e) => setFiveMinutesAfter(e.target.value)} style={inputStyle} />
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <button
          onClick={() => save()}
          disabled={isPending}
          style={{ ...btnPrimary, opacity: isPending ? 0.5 : 1 }}
        >
          {isPending ? 'Saving...' : 'Save'}
        </button>
        <button onClick={() => setOpen(false)} style={btnSecondary}>Cancel</button>
      </div>
    </div>
  )
}

// ─── Observation History ──────────────────────────────────────────────────────

function ObservationHistory({ days }: { days: ObservationDay[] }) {
  return (
    <div style={{ marginTop: '24px' }}>
      <p style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontWeight: 500,
        fontSize: '11px',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--color-mid)',
        marginBottom: '12px',
      }}>
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
    <div style={{ borderBottom: '1px solid var(--color-border)' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 400,
          fontSize: '13px',
          color: 'var(--color-primary)',
        }}>
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: '11px',
            color: 'var(--color-mid)',
          }}>
            {day.entries.length} {day.entries.length === 1 ? 'entry' : 'entries'}
          </span>
          <span style={{
            fontSize: '12px',
            color: 'var(--color-mid)',
            display: 'inline-block',
            transition: 'transform 200ms ease',
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          }}>
            +
          </span>
        </div>
      </button>
      {open && (
        <div style={{ paddingBottom: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
    <div style={{
      paddingLeft: '12px',
      borderLeft: '2px solid var(--color-accent)',
      opacity: 0.85,
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
        {time}
      </p>
      {populated.map((f) => (
        <div key={f.label} style={{ marginBottom: '3px' }}>
          <span style={{
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: '12px',
            color: 'var(--color-mid)',
          }}>
            {f.label}:{' '}
          </span>
          <span style={{
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontWeight: 400,
            fontSize: '12px',
            color: 'var(--color-primary)',
          }}>
            {f.value}
          </span>
        </div>
      ))}
    </div>
  )
}
