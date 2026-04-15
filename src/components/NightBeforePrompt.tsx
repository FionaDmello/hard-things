import { useState, useEffect } from 'react'

type TomorrowType = 'yoga' | 'gym' | 'rest'

const TOMORROW: Record<number, TomorrowType> = {
  0: 'yoga',
  1: 'gym',
  2: 'gym',
  3: 'gym',
  4: 'yoga',
  5: 'yoga',
  6: 'rest',
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

  return (
    <section className="mb-10">
      <p className="eyebrow mb-3">Tonight</p>
      <div className="card p-5">
        <p className="font-display italic font-light text-[1.15rem] text-primary leading-snug mb-1.5">
          {isGym ? 'Gym tomorrow.' : 'Yoga tomorrow.'}
        </p>
        <p className="font-sans font-light text-[13px] text-mid mb-4">
          {isGym ? 'Day bag packed? Both bags at the door?' : 'Clothes on top of phone?'}
        </p>
        <div className="flex gap-3">
          <button className="btn-primary" onClick={() => { dismiss(); setVisible(false) }}>Done</button>
          <button className="btn-secondary" onClick={() => { dismiss(); setVisible(false) }}>Dismiss</button>
        </div>
      </div>
    </section>
  )
}
