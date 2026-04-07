import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores'
import type { Database } from '../types/database'

type Habit = Database['public']['Tables']['habits']['Row']
type Checkin = Database['public']['Tables']['checkins']['Row']

interface Props {
  habit: Habit
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

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

  // Phase 1 — observation logger handles this habit, not check-in
  if (isObservationPhase) {
    return (
      <p className="mt-2 text-sm text-mid">
        Observation phase — use the observation log to record instances.
      </p>
    )
  }

  if (isLoading) return null

  if (existing) {
    return (
      <div className="mt-3 p-3 bg-light border border-mid/20 rounded-lg text-sm">
        <p className="text-mid mb-1">Today — logged</p>
        <p className="text-primary font-medium">
          {existing.occurred === false ? '● Clean' : '○ Slip'}
        </p>
        {existing.sentence_note && (
          <p className="text-mid mt-1 italic">"{existing.sentence_note}"</p>
        )}
      </div>
    )
  }

  return (
    <div className="mt-3">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-accent hover:opacity-80"
        >
          Log today's check-in
        </button>
      ) : (
        <CheckInForm
          habit={habit}
          userId={user!.id}
          today={today}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey })
            setOpen(false)
          }}
          onCancel={() => setOpen(false)}
        />
      )}
    </div>
  )
}

// ─── Form ────────────────────────────────────────────────────────────────────

interface FormProps {
  habit: Habit
  userId: string
  today: string
  onSaved: () => void
  onCancel: () => void
}

function CheckInForm({ habit, userId, today, onSaved, onCancel }: FormProps) {
  const [step, setStep] = useState<'discernment' | 'form'>('discernment')
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
        job_if_slipped: occurred ? jobIfSlipped || null : null,
        replacement_note: occurred ? replacementNote || null : null,
        urge_intensity: occurred ? urgeIntensity : null,
        sentence_note: sentenceNote || null,
      })
      if (error) throw error
    },
    onSuccess: onSaved,
  })

  const canSave =
    occurred !== null &&
    (!occurred || (jobIfSlipped !== '' && urgeIntensity !== null)) &&
    !isPending

  if (step === 'discernment') {
    return (
      <div className="mt-3 p-4 bg-accent-light border border-mid/20 rounded-lg space-y-4">
        <p className="text-sm text-mid italic">{habit.discernment_question}</p>
        <div className="flex gap-3">
          <button
            onClick={() => setStep('form')}
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

  return (
    <div className="mt-3 p-4 bg-accent-light border border-mid/20 rounded-lg space-y-4">

      {/* Did it occur? */}
      <div>
        <p className="text-sm font-medium text-primary mb-2">Did it happen today?</p>
        <div className="flex gap-2">
          <button
            onClick={() => setOccurred(true)}
            className={`flex-1 py-2 rounded-lg border text-sm transition-all ${
              occurred === true
                ? 'border-accent bg-light font-medium'
                : 'border-mid/20 hover:border-mid/40'
            }`}
          >
            Yes — slipped
          </button>
          <button
            onClick={() => setOccurred(false)}
            className={`flex-1 py-2 rounded-lg border text-sm transition-all ${
              occurred === false
                ? 'border-accent bg-light font-medium'
                : 'border-mid/20 hover:border-mid/40'
            }`}
          >
            No — clean
          </button>
        </div>
      </div>

      {/* Slip fields */}
      {occurred === true && (
        <>
          {/* Which job */}
          <div>
            <p className="text-sm font-medium text-primary mb-2">Which job was it doing?</p>
            <div className="flex flex-wrap gap-2">
              {habit.drivers.map((driver) => (
                <button
                  key={driver}
                  onClick={() => setJobIfSlipped(driver)}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                    jobIfSlipped === driver
                      ? 'border-accent bg-light font-medium'
                      : 'border-mid/20 hover:border-mid/40'
                  }`}
                >
                  {driver}
                </button>
              ))}
            </div>
          </div>

          {/* Replacement note */}
          <div>
            <label className="block text-sm text-primary mb-1">
              What replacement was available or unavailable?
            </label>
            <textarea
              value={replacementNote}
              onChange={(e) => setReplacementNote(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border border-mid/30 bg-light focus:outline-none focus:border-accent resize-none"
            />
          </div>

          {/* Urge intensity */}
          <div>
            <p className="text-sm font-medium text-primary mb-2">
              Urge intensity — {urgeIntensity ?? '?'} / 10
            </p>
            <div className="flex gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setUrgeIntensity(n)}
                  className={`flex-1 py-1.5 rounded text-xs border transition-all ${
                    urgeIntensity === n
                      ? 'bg-primary text-light border-primary'
                      : 'border-mid/20 text-mid hover:border-mid/40'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* One sentence note */}
      <div>
        <label className="block text-sm text-primary mb-1">One sentence.</label>
        <input
          type="text"
          value={sentenceNote}
          onChange={(e) => setSentenceNote(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-mid/30 bg-light focus:outline-none focus:border-accent"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => save()}
          disabled={!canSave}
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
