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
      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <span className={`font-sans font-medium text-[13px] ${existing.practice_level === 'missed' ? 'text-mid' : 'text-primary'}`}>
            {level?.symbol} {level?.label}
          </span>
          {existing.sentence_note && (
            <span className="font-display italic font-light text-[0.95rem] text-mid">
              — {existing.sentence_note}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3">
      {subHabit && (
        <p className="font-sans font-normal text-xs text-mid capitalize mb-2">{subHabit}</p>
      )}
      {!open ? (
        <button className="btn-primary" onClick={() => setOpen(true)}>Log today</button>
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
        resistance_note:    resistanceNote   || null,
        helped_or_hindered: helpedOrHindered || null,
        sentence_note:      sentenceNote     || null,
      })
      if (error) throw error
    },
    onSuccess: onSaved,
  })

  // ── Step: discernment ──
  if (step === 'discernment') {
    return (
      <div className="mt-3">
        <p className="font-display italic font-light text-[1.1rem] text-primary leading-snug mb-4">
          {discernmentQuestion}
        </p>
        <div className="flex gap-4 justify-end">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={() => setStep('level')}>Continue</button>
        </div>
      </div>
    )
  }

  // ── Step: practice level ──
  if (step === 'level') {
    return (
      <div className="mt-3">
        <p className="font-display italic font-light text-[1.1rem] text-primary leading-snug mb-4">
          How did it go?
        </p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {LEVELS.map(({ value, symbol, label }) => {
            const selected = practiceLevel === value
            return (
              <button
                key={value}
                onClick={() => setPracticeLevel(value)}
                className={`py-3.5 px-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all duration-150 text-left ${
                  selected ? 'border-mid bg-card' : 'border-border bg-transparent'
                }`}
              >
                <span className={`font-sans text-base leading-none ${selected ? 'text-accent' : 'text-mid'}`}>
                  {symbol}
                </span>
                <span className={`font-sans text-[13px] ${selected ? 'font-medium text-accent' : 'font-normal text-mid'}`}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
        <div className="flex gap-4 justify-end">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className="btn-primary"
            onClick={() => setStep('note')}
            disabled={!practiceLevel}
            style={{ opacity: practiceLevel ? 1 : 0.35 }}
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  // ── Step: note ──
  if (step === 'note') {
    const isMissed = practiceLevel === 'missed'
    return (
      <div className="mt-3">
        {isMissed && (
          <p className="font-display italic font-light text-base text-mid leading-snug mb-4">
            What would the minimum version have looked like today?
          </p>
        )}
        <div className="mb-4">
          <label className="label-field">{`How do you feel having ${isMissed ? "not": ""} showed up today?`}</label>
          <input
            type="text"
            value={sentenceNote}
            onChange={(e) => setSentenceNote(e.target.value)}
            autoFocus
            className="input-base"
          />
        </div>
        {!isMissed && (
          <div className="mb-4">
            {!showDetail ? (
              <button
                onClick={() => setShowDetail(true)}
                className="font-sans font-normal text-[11px] tracking-[0.08em] text-mid bg-transparent border-none p-0 cursor-pointer"
              >
                + Add detail
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="label-field">What did the resistance feel like? (optional)</label>
                  <textarea
                    value={resistanceNote}
                    onChange={(e) => setResistanceNote(e.target.value)}
                    rows={2}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="label-field">What helped or got in the way? (optional)</label>
                  <textarea
                    value={helpedOrHindered}
                    onChange={(e) => setHelpedOrHindered(e.target.value)}
                    rows={2}
                    className="input-base"
                  />
                </div>
              </div>
            )}
          </div>
        )}
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

  return null
}
