import { useState, useEffect } from 'react'

type TomorrowType = 'yoga' | 'gym' | 'rest'

const TOMORROW: Record<number, TomorrowType> = {
  0: 'yoga',  // Sunday    → Monday yoga
  1: 'gym',   // Monday    → Tuesday gym
  2: 'gym',   // Tuesday   → Wednesday gym
  3: 'gym',   // Wednesday → Thursday gym
  4: 'yoga',  // Thursday  → Friday yoga
  5: 'yoga',  // Friday    → Saturday yoga
  6: 'rest',  // Saturday  → Sunday rest
}

const STORAGE_KEY = 'night_before_dismissed'

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function isDismissed() {
  return localStorage.getItem(STORAGE_KEY) === getTodayKey()
}

function dismiss() {
  localStorage.setItem(STORAGE_KEY, getTodayKey())
}

export function NightBeforePrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const hour = new Date().getHours()
    const tomorrow = TOMORROW[new Date().getDay()]
    if (hour >= 18 && tomorrow !== 'rest' && !isDismissed()) {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  const tomorrow = TOMORROW[new Date().getDay()]
  const isGym = tomorrow === 'gym'

  function handleConfirm() {
    dismiss()
    setVisible(false)
  }

  function handleDismiss() {
    dismiss()
    setVisible(false)
  }

  return (
    <div className="bg-accent-light border border-mid/20 rounded-lg p-4 mb-6">
      <p className="text-sm text-mid mb-1">Tonight</p>
      {isGym ? (
        <>
          <p className="font-medium text-primary mb-1">
            Gym tomorrow.
          </p>
          <p className="text-sm text-primary mb-4">Day bag packed? Both bags at the door?</p>
        </>
      ) : (
        <>
          <p className="font-medium text-primary mb-1">Yoga tomorrow.</p>
          <p className="text-sm text-primary mb-4">Clothes on top of phone?</p>
        </>
      )}
      <div className="flex gap-3">
        <button
          onClick={handleConfirm}
          className="px-4 py-1.5 bg-primary text-light text-sm rounded-lg"
        >
          Done
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 py-1.5 text-mid text-sm hover:text-primary"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
