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

// ─── Root ─────────────────────────────────────────────────────────────────────

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

  if (thisWeek && !open) {
    return (
      <div>
        <div className="card p-5">
          <p className="eyebrow mb-3">Week of {formatWeekLabel(weekStart)}</p>
          <div className="flex flex-col gap-1.5 mb-4">
            {thisWeek.sentence_practiced && (
              <p className="font-display italic font-light text-[1.05rem] text-primary leading-snug">
                "{thisWeek.sentence_practiced}"
              </p>
            )}
            {thisWeek.sentence_hard && (
              <p className="font-display italic font-light text-[1.05rem] text-mid leading-snug">
                "{thisWeek.sentence_hard}"
              </p>
            )}
            {thisWeek.sentence_carrying && (
              <p className="font-display italic font-light text-[1.05rem] text-mid leading-snug">
                "{thisWeek.sentence_carrying}"
              </p>
            )}
          </div>
          <button className="btn-secondary" onClick={() => setShowHistory((s) => !s)}>
            {showHistory ? 'Hide past reviews' : 'Past reviews'}
          </button>
        </div>

        {showHistory && history && history.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {history.filter(r => r.id !== thisWeek.id).map((review) => (
              <ReviewEntry key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {!open ? (
        <div className="card p-5">
          <p className="font-display italic font-light text-[1.05rem] text-mid mb-4">
            {isSunday
              ? 'Today is Sunday. A good time to close the week.'
              : `Week of ${formatWeekLabel(weekStart)}.`}
          </p>
          <div className="flex gap-4 justify-end">
            {history && history.length >0 && !showHistory && (
              <button className="btn-secondary" onClick={() => setShowHistory(true)}>Past reviews</button>
            )}
            <button className="btn-primary" onClick={() => setOpen(true)}>Write review</button>
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
        <div className="mt-3 flex flex-col gap-2">
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
        what_i_did:         answers.what_i_did         || null,
        what_got_in_way:    answers.what_got_in_way    || null,
        carrying_forward:   answers.carrying_forward   || null,
        sentence_practiced: answers.sentence_practiced || null,
        sentence_hard:      answers.sentence_hard      || null,
        sentence_carrying:  answers.sentence_carrying  || null,
      })
      if (error) throw error
    },
    onSuccess: onSaved,
  })

  function setAnswer(key: string, value: string) {
    setAnswers((a) => ({ ...a, [key]: value }))
  }

  if (stepIndex < STEPS.length) {
    const step = STEPS[stepIndex]
    const isLast = stepIndex === STEPS.length - 1
    return (
      <div className="card p-5">
        <p className="eyebrow mb-4">Reflection {stepIndex + 1} of {STEPS.length}</p>
        <p className="font-display italic font-light text-[1.15rem] text-primary leading-snug mb-4">
          {step.prompt}
        </p>
        <textarea
          value={answers[step.key]}
          onChange={(e) => setAnswer(step.key, e.target.value)}
          rows={4}
          autoFocus
          className="input-base mb-4"
        />
        <div className="flex gap-4 justify-end">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className="btn-primary"
            onClick={() => {
              if (isLast) setShowSentences(true)
              setStepIndex((i) => i + 1)
            }}
          >
            {isLast ? 'Continue' : 'Next'}
          </button>
        </div>
      </div>
    )
  }

  if (!showSentences) {
    return (
      <div className="card p-5">
        <p className="font-display italic font-light text-[1.15rem] text-primary mb-2">
          Now distill it into three sentences.
        </p>
        <p className="font-sans font-light text-[13px] text-mid mb-5">
          These stay with you as a summary of the week.
        </p>
        <div className="flex gap-4">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={() => setShowSentences(true)}>Continue</button>‚‚
        </div>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <p className="eyebrow mb-5">Summary</p>
      <div className="flex flex-col gap-4 mb-5">
        <div>
          <label className="label-field">What I practised this week</label>
          <input
            type="text"
            value={answers.sentence_practiced}
            onChange={(e) => setAnswer('sentence_practiced', e.target.value)}
            className="input-base"
          />
        </div>
        <div>
          <label className="label-field">What was hard</label>
          <input
            type="text"
            value={answers.sentence_hard}
            onChange={(e) => setAnswer('sentence_hard', e.target.value)}
            className="input-base"
          />
        </div>
        <div>
          <label className="label-field">What I am carrying forward</label>
          <input
            type="text"
            value={answers.sentence_carrying}
            onChange={(e) => setAnswer('sentence_carrying', e.target.value)}
            className="input-base"
          />
        </div>
      </div>
      <div className="flex gap-4 justify-end">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
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

// ─── Review Entry (history) ───────────────────────────────────────────────────

function ReviewEntry({ review }: { review: WeeklyReview }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex justify-between items-center px-5 py-4 bg-transparent border-none cursor-pointer text-left"
      >
        <span className="font-sans font-normal text-[13px] text-primary">
          Week of {formatWeekLabel(review.week_start_date)}
        </span>
        <span
          className="font-sans text-xs text-mid inline-block transition-transform duration-200"
          style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          +
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 flex flex-col gap-3">
          {review.what_i_did && (
            <div>
              <p className="label-field mb-1">What I actually did</p>
              <p className="font-sans font-light text-[13px] text-primary leading-relaxed">{review.what_i_did}</p>
            </div>
          )}
          {review.what_got_in_way && (
            <div>
              <p className="label-field mb-1">What got in the way</p>
              <p className="font-sans font-light text-[13px] text-primary leading-relaxed">{review.what_got_in_way}</p>
            </div>
          )}
          {review.carrying_forward && (
            <div>
              <p className="label-field mb-1">Carrying into next week</p>
              <p className="font-sans font-light text-[13px] text-primary leading-relaxed">{review.carrying_forward}</p>
            </div>
          )}
          {(review.sentence_practiced || review.sentence_hard || review.sentence_carrying) && (
            <div className="pt-3 border-t border-border flex flex-col gap-1">
              {review.sentence_practiced && (
                <p className="font-display italic font-light text-base text-primary leading-snug">
                  "{review.sentence_practiced}"
                </p>
              )}
              {review.sentence_hard && (
                <p className="font-display italic font-light text-base text-mid leading-snug">
                  "{review.sentence_hard}"
                </p>
              )}
              {review.sentence_carrying && (
                <p className="font-display italic font-light text-base text-mid leading-snug">
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
