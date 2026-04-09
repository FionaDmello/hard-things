import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores'
import { getTodayExerciseType } from '../stores'
import type { Habit, Database, PracticeLevel } from '../types/database'

type Checkin = Database['public']['Tables']['checkins']['Row']

interface Props {
  habit: Habit
}

const PRACTICE_LEVELS: { value: PracticeLevel; label: string; description: string }[] = [
  { value: 'full',           label: 'Full',            description: 'Full version completed' },
  { value: 'minimum',        label: 'Minimum',         description: 'Minimum version completed' },
  { value: 'non_negotiable', label: 'Non-negotiable',  description: 'Non-negotiable only' },
  { value: 'missed',         label: 'Missed',          description: 'Did not show up' },
]

const LEVEL_SYMBOL: Record<PracticeLevel, string> = {
  full:           '●',
  minimum:        '◑',
  non_negotiable: '·',
  missed:         '○',
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function getDiscernmentQuestion(habit: Habit): string {
  try {
    const parsed = JSON.parse(habit.discernment_question)
    const exerciseType = getTodayExerciseType()
    return parsed[exerciseType] ?? habit.discernment_question
  } catch {
    return habit.discernment_question
  }
}

export function CheckInFormBuild({ habit }: Props) {
  const [open, setOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()

  const today = todayISO()
  const queryKey = ['checkin', habit.id, today]

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
    return (
      <div className="mt-3 p-3 bg-light border border-mid/20 rounded-lg text-sm">
        <p className="text-mid mb-1">Today — logged</p>
        <p className="text-primary font-medium">
          {LEVEL_SYMBOL[existing.practice_level!]}{' '}
          {PRACTICE_LEVELS.find((l) => l.value === existing.practice_level)?.label}
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
          Log today's practice
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
  const [practiceLevel, setPracticeLevel] = useState<PracticeLevel | null>(null)
  const [resistanceNote, setResistanceNote] = useState('')
  const [helpedOrHindered, setHelpedOrHindered] = useState('')
  const [sentenceNote, setSentenceNote] = useState('')

  const discernmentQuestion = getDiscernmentQuestion(habit)

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('checkins').insert({
        user_id: userId,
        habit_id: habit.id,
        date: today,
        section: 'build',
        practice_level: practiceLevel!,
        resistance_note: resistanceNote || null,
        helped_or_hindered: helpedOrHindered || null,
        sentence_note: sentenceNote || null,
      })
      if (error) throw error
    },
    onSuccess: onSaved,
  })

  if (step === 'discernment') {
    return (
      <div className="mt-3 p-4 bg-accent-light border border-mid/20 rounded-lg space-y-4">
        <p className="text-sm text-mid italic">{discernmentQuestion}</p>
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

      {/* Practice level */}
      <div>
        <p className="text-sm font-medium text-primary mb-2">How did it go?</p>
        <div className="grid grid-cols-2 gap-2">
          {PRACTICE_LEVELS.map((level) => (
            <button
              key={level.value}
              onClick={() => setPracticeLevel(level.value)}
              className={`p-2 rounded-lg border text-left text-sm transition-all ${
                practiceLevel === level.value
                  ? 'border-accent bg-light'
                  : 'border-mid/20 hover:border-mid/40'
              }`}
            >
              <span className="mr-1">{LEVEL_SYMBOL[level.value]}</span>
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resistance note */}
      <div>
        <label className="block text-sm text-primary mb-1">
          What did the resistance feel like?
        </label>
        <textarea
          value={resistanceNote}
          onChange={(e) => setResistanceNote(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm rounded-lg border border-mid/30 bg-light focus:outline-none focus:border-accent resize-none"
        />
      </div>

      {/* Helped or hindered */}
      <div>
        <label className="block text-sm text-primary mb-1">
          What got you through, or what got in the way?
        </label>
        <textarea
          value={helpedOrHindered}
          onChange={(e) => setHelpedOrHindered(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm rounded-lg border border-mid/30 bg-light focus:outline-none focus:border-accent resize-none"
        />
      </div>

      {/* One sentence note */}
      <div>
        <label className="block text-sm text-primary mb-1">
          One sentence.
        </label>
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
          disabled={!practiceLevel || isPending}
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
