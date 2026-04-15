import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores'
import type { BreakHabit, Database } from '../types/database'
import { ObservationLogger } from './ObservationLogger'

type Checkin = Database['public']['Tables']['checkins']['Row']
type Step = 'discernment' | 'occurred' | 'driver' | 'intensity' | 'note'

interface Props {
  habit: BreakHabit
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
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

export function CheckInFormBreak({ habit }: Props) {
  const [open, setOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()

  const today = todayISO()
  const queryKey = ['checkin', habit.id, today]
  const isObservationPhase = habit.current_phase === 'phase_1_observe'

  const { data: existing, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data } = await supabase
        .from('checkins')
        .select('*')
        .eq('habit_id', habit.id)
        .eq('date', today)
        .maybeSingle()
      return data as Checkin | null
    },
    enabled: !!user && !isObservationPhase,
  })

  if (isObservationPhase) return <ObservationLogger habit={habit} />
  if (isLoading) return null

  if (existing) {
    return (
      <div style={{ marginTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontWeight: 500,
            fontSize: '13px',
            color: existing.occurred === false ? 'var(--color-primary)' : 'var(--color-mid)',
          }}>
            {existing.occurred === false ? '● Clean' : '○ Slipped'}
          </span>
          {existing.sentence_note && (
            <span style={{
              fontFamily: "'Cormorant', Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: '0.95rem',
              color: 'var(--color-mid)',
            }}>
              — {existing.sentence_note}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: '12px' }}>
      {!open ? (
        <button onClick={() => setOpen(true)} style={btnPrimary}>
          Log today
        </button>
      ) : (
        <CheckInForm
          habit={habit}
          userId={user!.id}
          today={today}
          onSaved={() => { queryClient.invalidateQueries({ queryKey }); setOpen(false) }}
          onCancel={() => setOpen(false)}
        />
      )}
    </div>
  )
}

// ─── Multi-step form ──────────────────────────────────────────────────────────

interface FormProps {
  habit: BreakHabit
  userId: string
  today: string
  onSaved: () => void
  onCancel: () => void
}

function CheckInForm({ habit, userId, today, onSaved, onCancel }: FormProps) {
  const [step, setStep] = useState<Step>('discernment')
  const [occurred, setOccurred] = useState<boolean | null>(null)
  const [jobIfSlipped, setJobIfSlipped] = useState('')
  const [replacementNote, setReplacementNote] = useState('')
  const [urgeIntensity, setUrgeIntensity] = useState<number | null>(null)
  const [sentenceNote, setSentenceNote] = useState('')

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('checkins').insert({
        user_id: userId,
        habit_id: habit.id,
        date: today,
        section: 'break',
        occurred: occurred!,
        job_if_slipped:    occurred ? jobIfSlipped    || null : null,
        replacement_note:  occurred ? replacementNote || null : null,
        urge_intensity:    occurred ? urgeIntensity        : null,
        sentence_note:     sentenceNote || null,
      })
      if (error) throw error
    },
    onSuccess: onSaved,
  })

  const prompt: React.CSSProperties = {
    fontFamily: "'Cormorant', Georgia, serif",
    fontStyle: 'italic',
    fontWeight: 300,
    fontSize: '1.1rem',
    color: 'var(--color-primary)',
    lineHeight: 1.4,
    marginBottom: '16px',
  }

  const actions = (onNext: () => void, nextLabel = 'Next', canNext = true) => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '16px' }}>
      <button
        onClick={onNext}
        disabled={!canNext}
        style={{ ...btnPrimary, opacity: canNext ? 1 : 0.35 }}
      >
        {nextLabel}
      </button>
      <button onClick={onCancel} style={btnSecondary}>Cancel</button>
    </div>
  )

  // ── Step: discernment ──
  if (step === 'discernment') {
    return (
      <div style={{ marginTop: '12px' }}>
        <p style={prompt}>{habit.discernment_question}</p>
        {actions(() => setStep('occurred'))}
      </div>
    )
  }

  // ── Step: occurred ──
  if (step === 'occurred') {
    return (
      <div style={{ marginTop: '12px' }}>
        <p style={prompt}>Did it happen today?</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { value: false, label: 'Clean' },
            { value: true,  label: 'Slipped' },
          ].map(({ value, label }) => {
            const selected = occurred === value
            return (
              <button
                key={label}
                onClick={() => setOccurred(value)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '0.5rem',
                  border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  backgroundColor: selected ? 'var(--color-canvas)' : 'transparent',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontWeight: selected ? 500 : 400,
                  fontSize: '13px',
                  color: selected ? 'var(--color-primary)' : 'var(--color-mid)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
        {actions(
          () => occurred ? setStep('driver') : setStep('note'),
          'Continue',
          occurred !== null,
        )}
      </div>
    )
  }

  // ── Step: driver (slip only) ──
  if (step === 'driver') {
    return (
      <div style={{ marginTop: '12px' }}>
        <p style={prompt}>Which job was it doing?</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
          {habit.habit_drivers.map((driver) => {
            const selected = jobIfSlipped === driver.key
            return (
              <button
                key={driver.key}
                onClick={() => setJobIfSlipped(driver.key)}
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
        {actions(() => setStep('intensity'))}
      </div>
    )
  }

  // ── Step: urge intensity (slip only) ──
  if (step === 'intensity') {
    return (
      <div style={{ marginTop: '12px' }}>
        <p style={prompt}>
          Urge intensity — {urgeIntensity !== null ? `${urgeIntensity} / 10` : '?'}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
            const selected = urgeIntensity === n
            return (
              <button
                key={n}
                onClick={() => setUrgeIntensity(n)}
                style={{
                  padding: '10px 0',
                  borderRadius: '0.5rem',
                  border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  backgroundColor: selected ? 'var(--color-canvas)' : 'transparent',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontWeight: selected ? 500 : 400,
                  fontSize: '13px',
                  color: selected ? 'var(--color-primary)' : 'var(--color-mid)',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {n}
              </button>
            )
          })}
        </div>
        <div style={{ marginTop: '12px' }}>
          <label style={{
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontWeight: 500,
            fontSize: '11px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--color-mid)',
            display: 'block',
            marginBottom: '8px',
          }}>
            What replacement was available? (optional)
          </label>
          <input
            type="text"
            value={replacementNote}
            onChange={(e) => setReplacementNote(e.target.value)}
            style={inputStyle}
          />
        </div>
        {actions(() => setStep('note'))}
      </div>
    )
  }

  // ── Step: note (final for both paths) ──
  if (step === 'note') {
    return (
      <div style={{ marginTop: '12px' }}>
        <p style={prompt}>One sentence.</p>
        <input
          type="text"
          value={sentenceNote}
          onChange={(e) => setSentenceNote(e.target.value)}
          autoFocus
          style={inputStyle}
        />
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '16px' }}>
          <button
            onClick={() => save()}
            disabled={isPending}
            style={{ ...btnPrimary, opacity: isPending ? 0.5 : 1 }}
          >
            {isPending ? 'Saving...' : 'Save'}
          </button>
          <button onClick={onCancel} style={btnSecondary}>Cancel</button>
        </div>
      </div>
    )
  }

  return null
}
