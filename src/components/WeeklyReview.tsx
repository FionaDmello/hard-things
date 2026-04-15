import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores'
import type { Database } from '../types/database'

type WeeklyReview = Database['public']['Tables']['weekly_reviews']['Row']

function getWeekStartDate(): string {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay())
  return d.toISOString().slice(0, 10)
}

function formatWeekLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

const STEPS = [
  { key: 'what_i_did',       prompt: 'What did I actually do this week?' },
  { key: 'what_got_in_way',  prompt: 'What got in the way on the days I missed or slipped?' },
  { key: 'carrying_forward', prompt: 'What am I carrying into next week?' },
]

// ─── Shared styles ────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  backgroundColor: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '0.75rem',
  padding: '20px',
}

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
  textTransform: 'uppercase',
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

// ─── Root component ───────────────────────────────────────────────────────────

export function WeeklyReview() {
  const [open, setOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const isSunday = new Date().getDay() === 0
  const weekStart = getWeekStartDate()

  const { data: thisWeek } = useQuery({
    queryKey: ['weekly-review', weekStart],
    queryFn: async () => {
      const { data } = await supabase
        .from('weekly_reviews')
        .select('*')
        .eq('user_id', user!.id)
        .eq('week_start_date', weekStart)
        .maybeSingle()
      return data as WeeklyReview | null
    },
    enabled: !!user,
  })

  const { data: history } = useQuery({
    queryKey: ['weekly-review-history'],
    queryFn: async () => {
      const { data } = await supabase
        .from('weekly_reviews')
        .select('*')
        .eq('user_id', user!.id)
        .order('week_start_date', { ascending: false })
        .limit(10)
      return (data ?? []) as WeeklyReview[]
    },
    enabled: !!user && showHistory,
  })

  // This week completed
  if (thisWeek && !open) {
    return (
      <div>
        <div style={card}>
          <p className="eyebrow" style={{ marginBottom: '12px' }}>
            Week of {formatWeekLabel(weekStart)}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
            {thisWeek.sentence_practiced && (
              <p style={{
                fontFamily: "'Cormorant', Georgia, serif",
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: '1.05rem',
                color: 'var(--color-primary)',
                lineHeight: 1.5,
              }}>
                "{thisWeek.sentence_practiced}"
              </p>
            )}
            {thisWeek.sentence_hard && (
              <p style={{
                fontFamily: "'Cormorant', Georgia, serif",
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: '1.05rem',
                color: 'var(--color-mid)',
                lineHeight: 1.5,
              }}>
                "{thisWeek.sentence_hard}"
              </p>
            )}
            {thisWeek.sentence_carrying && (
              <p style={{
                fontFamily: "'Cormorant', Georgia, serif",
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: '1.05rem',
                color: 'var(--color-mid)',
                lineHeight: 1.5,
              }}>
                "{thisWeek.sentence_carrying}"
              </p>
            )}
          </div>
          <button
            onClick={() => setShowHistory((s) => !s)}
            style={btnSecondary}
          >
            {showHistory ? 'Hide past reviews' : 'Past reviews'}
          </button>
        </div>

        {showHistory && history && history.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.filter(r => r.id !== thisWeek.id).map((review) => (
              <ReviewEntry key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Not yet written
  return (
    <div>
      {!open ? (
        <div style={card}>
          <p style={{
            fontFamily: "'Cormorant', Georgia, serif",
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: '1.05rem',
            color: 'var(--color-mid)',
            marginBottom: '16px',
          }}>
            {isSunday
              ? 'Today is Sunday. A good time to close the week.'
              : `Week of ${formatWeekLabel(weekStart)}.`}
          </p>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button onClick={() => setOpen(true)} style={btnPrimary}>
              {isSunday ? 'Write review' : 'Write review'}
            </button>
            {!showHistory && (
              <button onClick={() => setShowHistory(true)} style={btnSecondary}>
                Past reviews
              </button>
            )}
          </div>
        </div>
      ) : (
        <ReviewForm
          userId={user!.id}
          weekStart={weekStart}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['weekly-review', weekStart] })
            queryClient.invalidateQueries({ queryKey: ['weekly-review-history'] })
            setOpen(false)
          }}
          onCancel={() => setOpen(false)}
        />
      )}

      {showHistory && history && history.length > 0 && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {history.map((review) => (
            <ReviewEntry key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Review Form ──────────────────────────────────────────────────────────────

interface FormProps {
  userId: string
  weekStart: string
  onSaved: () => void
  onCancel: () => void
}

function ReviewForm({ userId, weekStart, onSaved, onCancel }: FormProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [showSentences, setShowSentences] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({
    what_i_did: '',
    what_got_in_way: '',
    carrying_forward: '',
    sentence_practiced: '',
    sentence_hard: '',
    sentence_carrying: '',
  })

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('weekly_reviews').insert({
        user_id: userId,
        week_start_date: weekStart,
        what_i_did:          answers.what_i_did          || null,
        what_got_in_way:     answers.what_got_in_way     || null,
        carrying_forward:    answers.carrying_forward    || null,
        sentence_practiced:  answers.sentence_practiced  || null,
        sentence_hard:       answers.sentence_hard       || null,
        sentence_carrying:   answers.sentence_carrying   || null,
      })
      if (error) throw error
    },
    onSuccess: onSaved,
  })

  function setAnswer(key: string, value: string) {
    setAnswers((a) => ({ ...a, [key]: value }))
  }

  // Reflection steps
  if (stepIndex < STEPS.length) {
    const step = STEPS[stepIndex]
    const isLast = stepIndex === STEPS.length - 1
    return (
      <div style={card}>
        <p className="eyebrow" style={{ marginBottom: '16px' }}>
          Reflection {stepIndex + 1} of {STEPS.length}
        </p>
        <p style={{
          fontFamily: "'Cormorant', Georgia, serif",
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: '1.15rem',
          color: 'var(--color-primary)',
          marginBottom: '16px',
          lineHeight: 1.4,
        }}>
          {step.prompt}
        </p>
        <textarea
          value={answers[step.key]}
          onChange={(e) => setAnswer(step.key, e.target.value)}
          rows={4}
          autoFocus
          style={{ ...inputStyle, marginBottom: '16px' }}
        />
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button
            onClick={() => {
              if (isLast) setShowSentences(true)
              setStepIndex((i) => i + 1)
            }}
            style={btnPrimary}
          >
            {isLast ? 'Continue' : 'Next'}
          </button>
          <button onClick={onCancel} style={btnSecondary}>Cancel</button>
        </div>
      </div>
    )
  }

  // Transition
  if (!showSentences) {
    return (
      <div style={card}>
        <p style={{
          fontFamily: "'Cormorant', Georgia, serif",
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: '1.15rem',
          color: 'var(--color-primary)',
          marginBottom: '8px',
        }}>
          Now distill it into three sentences.
        </p>
        <p style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontWeight: 300,
          fontSize: '13px',
          color: 'var(--color-mid)',
          marginBottom: '20px',
        }}>
          These stay with you as a summary of the week.
        </p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={() => setShowSentences(true)} style={btnPrimary}>Continue</button>
          <button onClick={onCancel} style={btnSecondary}>Cancel</button>
        </div>
      </div>
    )
  }

  // Three sentences
  return (
    <div style={card}>
      <p className="eyebrow" style={{ marginBottom: '20px' }}>Three sentences</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
        <div>
          <label style={labelStyle}>What I practised this week.</label>
          <input
            type="text"
            value={answers.sentence_practiced}
            onChange={(e) => setAnswer('sentence_practiced', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>What was hard.</label>
          <input
            type="text"
            value={answers.sentence_hard}
            onChange={(e) => setAnswer('sentence_hard', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>What I am carrying forward.</label>
          <input
            type="text"
            value={answers.sentence_carrying}
            onChange={(e) => setAnswer('sentence_carrying', e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
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

// ─── Review Entry (history) ───────────────────────────────────────────────────

function ReviewEntry({ review }: { review: WeeklyReview }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      backgroundColor: 'var(--color-card)',
      border: '1px solid var(--color-border)',
      borderRadius: '0.75rem',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
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
          Week of {formatWeekLabel(review.week_start_date)}
        </span>
        <span style={{
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: '12px',
          color: 'var(--color-mid)',
          transition: 'transform 200ms ease',
          display: 'inline-block',
          transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
        }}>
          +
        </span>
      </button>

      {open && (
        <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {review.what_i_did && (
            <div>
              <p style={{ ...labelStyle, marginBottom: '4px' }}>What I actually did</p>
              <p style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontWeight: 300,
                fontSize: '13px',
                color: 'var(--color-primary)',
                lineHeight: 1.6,
              }}>
                {review.what_i_did}
              </p>
            </div>
          )}
          {review.what_got_in_way && (
            <div>
              <p style={{ ...labelStyle, marginBottom: '4px' }}>What got in the way</p>
              <p style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontWeight: 300,
                fontSize: '13px',
                color: 'var(--color-primary)',
                lineHeight: 1.6,
              }}>
                {review.what_got_in_way}
              </p>
            </div>
          )}
          {review.carrying_forward && (
            <div>
              <p style={{ ...labelStyle, marginBottom: '4px' }}>Carrying into next week</p>
              <p style={{
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontWeight: 300,
                fontSize: '13px',
                color: 'var(--color-primary)',
                lineHeight: 1.6,
              }}>
                {review.carrying_forward}
              </p>
            </div>
          )}
          {(review.sentence_practiced || review.sentence_hard || review.sentence_carrying) && (
            <div style={{
              paddingTop: '12px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              {review.sentence_practiced && (
                <p style={{
                  fontFamily: "'Cormorant', Georgia, serif",
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: '1rem',
                  color: 'var(--color-primary)',
                  lineHeight: 1.5,
                }}>
                  "{review.sentence_practiced}"
                </p>
              )}
              {review.sentence_hard && (
                <p style={{
                  fontFamily: "'Cormorant', Georgia, serif",
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: '1rem',
                  color: 'var(--color-mid)',
                  lineHeight: 1.5,
                }}>
                  "{review.sentence_hard}"
                </p>
              )}
              {review.sentence_carrying && (
                <p style={{
                  fontFamily: "'Cormorant', Georgia, serif",
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: '1rem',
                  color: 'var(--color-mid)',
                  lineHeight: 1.5,
                }}>
                  "{review.sentence_carrying}"
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
