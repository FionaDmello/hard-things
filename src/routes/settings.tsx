import { createFileRoute } from '@tanstack/react-router'
import { ThemePicker } from '../components/ThemePicker'

export const Route = createFileRoute('/settings')({
  component: Settings,
})

function Settings() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-8">Settings</h1>

      <section className="mb-8">
        <h2 className="font-medium text-primary mb-4">Theme</h2>
        <ThemePicker />
      </section>
    </div>
  )
}
