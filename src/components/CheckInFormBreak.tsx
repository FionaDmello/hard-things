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
      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <span className={`font-sans font-medium text-[13px] ${existing.occurred === false ? 'text-primary' : 'text-mid'}`}>
            {existing.occurred === false ? '● Clean' : '○ Slipped'}
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
        job_if_slipped:   occurred ? jobIfSlipped    || null : null,
        replacement_note: occurred ? replacementNote || null : null,
        urge_intensity:   occurred ? urgeIntensity        : null,
        sentence_note:    sentenceNote || null,
      })
      if (error) throw error
    },
    onSuccess: onSaved,
  })

  const actions = (onNext: () => void, nextLabel = 'Next', canNext = true) => (
    <div className="flex gap-4 items-center mt-4">
      <button
        className="btn-primary"
        onClick={onNext}
        disabled={!canNext}
        style={{ opacity: canNext ? 1 : 0.35 }}
      >
        {nextLabel}
      </button>
      <button className="btn-secondary" onClick={onCancel}>Cancel</button>
    </div>
  )

  // ── Step: discernment ──
  if (step === 'discernment') {
    return (
      <div className="mt-3">
        <p className="font-display italic font-light text-[1.1rem] text-primary leading-snug mb-4">
          {habit.discernment_question}
        </p>
        {actions(() => setStep('occurred'))}
      </div>
    )
  }

  // ── Step: occurred ──
  if (step === 'occurred') {
    return (
      <div className="mt-3">
        <p className="font-display italic font-light text-[1.1rem] text-primary leading-snug mb-4">
          Did it happen today?
        </p>
        <div className="flex gap-2">
          {[
            { value: false, label: 'Clean' },
            { value: true,  label: 'Slipped' },
          ].map(({ value, label }) => {
            const selected = occurred === value
            return (
              <button
                key={label}
                onClick={() => setOccurred(value)}
                className={`flex-1 py-2.5 rounded-lg border font-sans text-[13px] cursor-pointer transition-all duration-150 ${
                  selected ? 'border-accent bg-card font-medium text-primary' : 'border-border bg-transparent font-normal text-mid'
                }`}
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
      <div className="mt-3">
        <p className="font-display italic font-light text-[1.1rem] text-primary leading-snug mb-4">
          Which job was it doing?
        </p>
        <div className="flex flex-wrap gap-2 mb-1">
          {habit.habit_drivers.map((driver) => {
            const selected = jobIfSlipped === driver.key
            return (
              <button
                key={driver.key}
                onClick={() => setJobIfSlipped(driver.key)}
                className={`px-3.5 py-2 rounded-full border font-sans text-[13px] cursor-pointer transition-all duration-150 whitespace-nowrap ${
                  selected ? 'border-accent bg-card font-medium text-primary' : 'border-border bg-transparent font-normal text-mid'
                }`}
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
      <div className="mt-3">
        <p className="font-display italic font-light text-[1.1rem] text-primary leading-snug mb-4">
          Urge intensity — {urgeIntensity !== null ? `${urgeIntensity} / 10` : '?'}
        </p>
        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
            const selected = urgeIntensity === n
            return (
              <button
                key={n}
                onClick={() => setUrgeIntensity(n)}
                className={`py-2.5 rounded-lg border font-sans text-[13px] cursor-pointer transition-all duration-150 ${
                  selected ? 'border-accent bg-card font-medium text-primary' : 'border-border bg-transparent font-normal text-mid'
                }`}
              >
                {n}
              </button>
            )
          })}
        </div>
        <div className="mt-3">
          <label className="label-field">What replacement was available? (optional)</label>
          <input
            type="text"
            value={replacementNote}
            onChange={(e) => setReplacementNote(e.target.value)}
            className="input-base"
          />
        </div>
        {actions(() => setStep('note'))}
      </div>
    )
  }

  // ── Step: note ──
  if (step === 'note') {
    return (
      <div className="mt-3">
        <p className="font-display italic font-light text-[1.1rem] text-primary leading-snug mb-4">
          One sentence.
        </p>
        <input
          type="text"
          value={sentenceNote}
          onChange={(e) => setSentenceNote(e.target.value)}
          autoFocus
          className="input-base"
        />
        <div className="flex gap-4 items-center mt-4">
          <button
            className="btn-primary"
            onClick={() => save()}
            disabled={isPending}
            style={{ opacity: isPending ? 0.5 : 1 }}
          >
            {isPending ? 'Saving...' : 'Save'}
          </button>
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    )
  }

  return null
}
