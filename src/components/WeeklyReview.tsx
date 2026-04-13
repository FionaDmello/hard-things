import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores'
import type { Database } from '../types/database'

type WeeklyReview = Database['public']['Tables']['weekly_reviews']['Row']

// Most recent Sunday as week start
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
  { key: 'what_i_did',      prompt: 'What did I actually do this week?' },
  { key: 'what_got_in_way', prompt: 'What got in the way on the days I missed or slipped?' },
  { key: 'carrying_forward', prompt: 'What am I carrying into next week?' },
]

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
      <div className="mb-8">
        <div className="p-4 bg-accent-light border border-mid/20 rounded-lg">
          <p className="text-sm text-mid mb-1">Weekly review — week of {formatWeekLabel(weekStart)}</p>
          <p className="text-primary text-sm italic">"{thisWeek.sentence_practiced}"</p>
          <button
            onClick={() => setShowHistory((s) => !s)}
            className="mt-3 text-sm text-mid hover:text-primary"
          >
            {showHistory ? 'Hide history' : 'View past reviews'}
          </button>
        </div>
        {showHistory && history && (
          <div className="mt-3 space-y-3">
            {history.map((review) => (
              <ReviewEntry key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="mb-8">
      {!open ? (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            className={`text-sm px-4 py-2 rounded-lg ${
              isSunday
                ? 'bg-primary text-light'
                : 'bg-accent-light text-primary border border-mid/20'
            }`}
          >
            {isSunday ? 'Weekly review — today' : 'Write weekly review'}
          </button>
          {history && history.length > 0 && (
            <button
              onClick={() => setShowHistory((s) => !s)}
              className="text-sm text-mid hover:text-primary"
            >
              {showHistory ? 'Hide history' : 'Past reviews'}
            </button>
          )}
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
      {showHistory && history && (
        <div className="mt-3 space-y-3">
          {history.map((review) => (
            <ReviewEntry key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Review Form ─────────────────────────────────────────────────────────────

interface FormProps {
  userId: string
  weekStart: string
  onSaved: () => void
  onCancel: () => void
}

function ReviewForm({ userId, weekStart, onSaved, onCancel }: FormProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [showTransition, setShowTransition] = useState(false)
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
        what_i_did: answers.what_i_did || null,
        what_got_in_way: answers.what_got_in_way || null,
        carrying_forward: answers.carrying_forward || null,
        sentence_practiced: answers.sentence_practiced || null,
        sentence_hard: answers.sentence_hard || null,
        sentence_carrying: answers.sentence_carrying || null,
      })
      if (error) throw error
    },
    onSuccess: onSaved,
  })

  function setAnswer(key: string, value: string) {
    setAnswers((a) => ({ ...a, [key]: value }))
  }

  // Steps 0-2: reflection prompts
  if (stepIndex < STEPS.length) {
    const step = STEPS[stepIndex]
    const isLastReflection = stepIndex === STEPS.length - 1
    return (
      <div className="p-4 bg-accent-light border border-mid/20 rounded-lg space-y-4">
        <p className="text-sm text-mid">Reflection {stepIndex + 1} of {STEPS.length}</p>
        <p className="font-medium text-primary">{step.prompt}</p>
        <textarea
          value={answers[step.key]}
          onChange={(e) => setAnswer(step.key, e.target.value)}
          rows={4}
          autoFocus
          className="w-full px-3 py-2 text-sm rounded-lg border border-mid/30 bg-light focus:outline-none focus:border-accent resize-none"
        />
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (isLastReflection) {
                setStepIndex((i) => i + 1)
                setShowTransition(true)
              } else {
                setStepIndex((i) => i + 1)
              }
            }}
            className="px-4 py-1.5 bg-primary text-light text-sm rounded-lg"
          >
            Next
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-mid text-sm hover:text-primary"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // Transition screen
  if (showTransition) {
    return (
      <div className="p-4 bg-accent-light border border-mid/20 rounded-lg space-y-4">
        <p className="font-medium text-primary">Now distill it into three sentences.</p>
        <p className="text-sm text-mid">These will be shown on your dashboard as a reminder of the week.</p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTransition(false)}
            className="px-4 py-1.5 bg-primary text-light text-sm rounded-lg"
          >
            Continue
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-mid text-sm hover:text-primary"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // Summary step
  return (
    <div className="p-4 bg-accent-light border border-mid/20 rounded-lg space-y-4">
      <p className="text-sm text-mid">Summary</p>
      <p className="font-medium text-primary">Three sentences to close the week.</p>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-primary mb-1">What I practiced this week.</label>
          <input
            type="text"
            value={answers.sentence_practiced}
            onChange={(e) => setAnswer('sentence_practiced', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-mid/30 bg-light focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-sm text-primary mb-1">What was hard.</label>
          <input
            type="text"
            value={answers.sentence_hard}
            onChange={(e) => setAnswer('sentence_hard', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-mid/30 bg-light focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-sm text-primary mb-1">What I am carrying forward.</label>
          <input
            type="text"
            value={answers.sentence_carrying}
            onChange={(e) => setAnswer('sentence_carrying', e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-mid/30 bg-light focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => save()}
          disabled={isPending}
          className="px-4 py-1.5 bg-primary text-light text-sm rounded-lg disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 text-mid text-sm hover:text-primary"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Review Entry (history) ───────────────────────────────────────────────────

function ReviewEntry({ review }: { review: WeeklyReview }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-mid/20 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex justify-between items-center p-3 text-left bg-accent-light hover:bg-mid/10"
      >
        <span className="text-sm text-primary">Week of {formatWeekLabel(review.week_start_date)}</span>
        <span className="text-mid text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="p-4 space-y-3 text-sm bg-light">
          {review.what_i_did && (
            <div>
              <p className="text-mid text-xs mb-1">What I actually did</p>
              <p className="text-primary">{review.what_i_did}</p>
            </div>
          )}
          {review.what_got_in_way && (
            <div>
              <p className="text-mid text-xs mb-1">What got in the way</p>
              <p className="text-primary">{review.what_got_in_way}</p>
            </div>
          )}
          {review.carrying_forward && (
            <div>
              <p className="text-mid text-xs mb-1">Carrying into next week</p>
              <p className="text-primary">{review.carrying_forward}</p>
            </div>
          )}
          {(review.sentence_practiced || review.sentence_hard || review.sentence_carrying) && (
            <div className="pt-2 border-t border-mid/20 space-y-1">
              {review.sentence_practiced && <p className="text-primary italic">"{review.sentence_practiced}"</p>}
              {review.sentence_hard && <p className="text-primary italic">"{review.sentence_hard}"</p>}
              {review.sentence_carrying && <p className="text-primary italic">"{review.sentence_carrying}"</p>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
