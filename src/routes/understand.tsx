import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/understand')({
  component: UnderstandPatterns,
})

function UnderstandPatterns() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-primary mb-2">
        Patterns to Understand
      </h1>
      <p className="text-mid mb-8 italic">
        These are not protocols. They are patterns to understand — to be read,
        returned to, and held alongside the habit work.
      </p>

      <div className="space-y-6">
        <section className="bg-accent-light p-6 rounded-lg">
          <h2 className="font-medium text-primary mb-3">
            Emotional Eating & the Restriction-Collapse Cycle
          </h2>
          <p className="text-mid text-sm">
            The cycle: restriction → depletion → collapse → shame → rebound
          </p>
        </section>

        <section className="bg-accent-light p-6 rounded-lg">
          <h2 className="font-medium text-primary mb-3">
            Self-Neglect as Pathway to Self-Permission
          </h2>
          <p className="text-mid text-sm">
            The pattern: wellness and its weight → neglect → threshold →
            permission granted → recovery and the return
          </p>
        </section>
      </div>
    </div>
  )
}
