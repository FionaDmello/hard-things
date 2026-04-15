import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores'
import type { BuildHabit, Database, PracticeLevel } from '../types/database'

type Checkin = Database['public']['Tables']['checkins']['Row']
type Step = 'discernment' | 'level' | 'note'

interface Props {
  habit: BuildHabit
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function getDiscernmentQuestion(habit: BuildHabit): string {
  if (habit.sub_habits) {
    const todaySubHabit = habit.habit_schedule[String(new Date().getDay())]
    return habit.sub_habits[todaySubHabit]?.discernment_question ?? ''
  }
  return habit.discernment_question
}

function getTodaySubHabit(habit: BuildHabit): string | null {
  if (!habit.sub_habits) return null
  return habit.habit_schedule[String(new Date().getDay())] ?? null
}

const LEVELS: { value: PracticeLevel; symbol: string; label: string }[] = [
  { value: 'full',           symbol: '●', label: 'Full'           },
  { value: 'minimum',        symbol: '◑', label: 'Minimum'        },
  { value: 'non_negotiable', symbol: '·', label: 'Non-negotiable' },
  { value: 'missed',         symbol: '○', label: 'Missed'         },
]

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
  resize: 'none' as const,
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

const prompt: React.CSSProperties = {
  fontFamily: "'Cormorant', Georgia, serif",
  fontStyle: 'italic',
  fontWeight: 300,
  fontSize: '1.1rem',
  color: 'var(--color-primary)',
  lineHeight: 1.4,
  marginBottom: '16px',
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function CheckInFormBuild({ habit }: Props) {
  const [open, setOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()

  const today = todayISO()
  const queryKey = ['checkin', habit.id, today]
  const subHabit = getTodaySubHabit(habit)

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
    enabled: !!user,
  })

  if (isLoading) return null

  if (existing) {
    const level = LEVELS.find((l) => l.value === existing.practice_level)
    return (
      <div style={{ marginTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontWeight: 500,
            fontSize: '13px',
            color: existing.practice_level === 'missed' ? 'var(--color-mid)' : 'var(--color-primary)',
          }}>
            {level?.symbol} {level?.label}
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
      {subHabit && (
        <p style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 400,
          fontSize: '12px',
          color: 'var(--color-mid)',
          textTransform: 'capitalize',
          marginBottom: '8px',
        }}>
          {subHabit}
        </p>
      )}
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
  habit: BuildHabit
  userId: string
  today: string
  onSaved: () => void
  onCancel: () => void
}

function CheckInForm({ habit, userId, today, onSaved, onCancel }: FormProps) {
  const [step, setStep] = useState<Step>('discernment')
  const [practiceLevel, setPracticeLevel] = useState<PracticeLevel | null>(null)
  const [resistanceNote, setResistanceNote] = useState('')
  const [helpedOrHindered, setHelpedOrHindered] = useState('')
  const [sentenceNote, setSentenceNote] = useState('')
  const [showDetail, setShowDetail] = useState(false)

  const discernmentQuestion = getDiscernmentQuestion(habit)

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('checkins').insert({
        user_id: userId,
        habit_id: habit.id,
        date: today,
        section: 'build',
        practice_level: practiceLevel!,
        resistance_note:   resistanceNote   || null,
        helped_or_hindered: helpedOrHindered || null,
        sentence_note:     sentenceNote     || null,
      })
      if (error) throw error
    },
    onSuccess: onSaved,
  })

  // ── Step: discernment ──
  if (step === 'discernment') {
    return (
      <div style={{ marginTop: '12px' }}>
        <p style={prompt}>{discernmentQuestion}</p>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button onClick={() => setStep('level')} style={btnPrimary}>Continue</button>
          <button onClick={onCancel} style={btnSecondary}>Cancel</button>
        </div>
      </div>
    )
  }

  // ── Step: practice level ──
  if (step === 'level') {
    return (
      <div style={{ marginTop: '12px' }}>
        <p style={prompt}>How did it go?</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
          {LEVELS.map(({ value, symbol, label }) => {
            const selected = practiceLevel === value
            return (
              <button
                key={value}
                onClick={() => setPracticeLevel(value)}
                style={{
                  padding: '14px 12px',
                  borderRadius: '0.625rem',
                  border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  backgroundColor: selected ? 'var(--color-canvas)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  textAlign: 'left' as const,
                }}
              >
                <span style={{
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: '16px',
                  color: selected ? 'var(--color-primary)' : 'var(--color-mid)',
                  lineHeight: 1,
                }}>
                  {symbol}
                </span>
                <span style={{
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontWeight: selected ? 500 : 400,
                  fontSize: '13px',
                  color: selected ? 'var(--color-primary)' : 'var(--color-mid)',
                }}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button
            onClick={() => setStep('note')}
            disabled={!practiceLevel}
            style={{ ...btnPrimary, opacity: practiceLevel ? 1 : 0.35 }}
          >
            Continue
          </button>
          <button onClick={onCancel} style={btnSecondary}>Cancel</button>
        </div>
      </div>
    )
  }

  // ── Step: note + optional detail ──
  if (step === 'note') {
    const isMissed = practiceLevel === 'missed'

    return (
      <div style={{ marginTop: '12px' }}>

        {/* Missed — recommitment prompt */}
        {isMissed && (
          <p style={{
            fontFamily: "'Cormorant', Georgia, serif",
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: '1rem',
            color: 'var(--color-mid)',
            lineHeight: 1.5,
            marginBottom: '16px',
          }}>
            What would the minimum version have looked like today?
          </p>
        )}

        {/* One sentence */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>One sentence.</label>
          <input
            type="text"
            value={sentenceNote}
            onChange={(e) => setSentenceNote(e.target.value)}
            autoFocus
            style={inputStyle}
          />
        </div>

        {/* Optional detail — not shown for missed */}
        {!isMissed && (
          <div style={{ marginBottom: '16px' }}>
            {!showDetail ? (
              <button
                onClick={() => setShowDetail(true)}
                style={{ ...btnSecondary, fontSize: '11px', letterSpacing: '0.08em' }}
              >
                + Add detail
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>What did the resistance feel like? (optional)</label>
                  <textarea
                    value={resistanceNote}
                    onChange={(e) => setResistanceNote(e.target.value)}
                    rows={2}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>What helped or got in the way? (optional)</label>
                  <textarea
                    value={helpedOrHindered}
                    onChange={(e) => setHelpedOrHindered(e.target.value)}
                    rows={2}
                    style={inputStyle}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
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
