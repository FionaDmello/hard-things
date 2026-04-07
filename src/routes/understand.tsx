import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/understand')({
  component: UnderstandPatterns,
})

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-mid/20 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex justify-between items-center p-4 text-left bg-accent-light hover:bg-mid/10"
      >
        <span className="font-medium text-primary">{title}</span>
        <span className="text-mid text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="p-4 space-y-3 text-sm text-primary leading-relaxed">
          {children}
        </div>
      )}
    </div>
  )
}

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

        {/* C1 — Emotional Eating & the Restriction-Collapse Cycle */}
        <section>
          <h2 className="font-medium text-primary mb-3">
            Emotional Eating & the Restriction-Collapse Cycle
          </h2>
          <div className="space-y-3">

            <CollapsibleSection title="The cycle">
              <p>Restriction → depletion → collapse → shame → rebound.</p>
              <p>
                Each phase feeds the next. Restriction creates depletion — physical,
                emotional, motivational. Depletion makes collapse inevitable, not
                a failure of willpower. Collapse triggers shame. Shame demands
                rebound. Rebound becomes the next restriction.
              </p>
              <p>The cycle is self-sustaining. Breaking it requires understanding it, not overriding it.</p>
            </CollapsibleSection>

            <CollapsibleSection title="What is actually driving the pattern">
              <p>
                This is not about food. Food is the site where other things land —
                comfort-seeking, self-soothing, relief from constraint, reward for
                endurance, punishment for perceived failure.
              </p>
              <p>
                The restriction phase often feels like self-care or discipline.
                It is frequently neither. It is a form of control applied to the
                body when other things feel uncontrollable.
              </p>
            </CollapsibleSection>

            <CollapsibleSection title="The four specific pattern characteristics">
              <ul className="space-y-2 list-none">
                <li>
                  <span className="font-medium">All-or-nothing framing.</span>{' '}
                  A rule is either kept perfectly or abandoned entirely. There is
                  no middle. The slip becomes the permission structure for collapse.
                </li>
                <li>
                  <span className="font-medium">Shame as accelerant.</span>{' '}
                  Shame after eating does not reduce eating. It increases the
                  need for the soothing that eating provides.
                </li>
                <li>
                  <span className="font-medium">Restriction as identity.</span>{' '}
                  The rules become a story about who you are. Breaking them is
                  experienced as a self-betrayal, not a behaviour.
                </li>
                <li>
                  <span className="font-medium">The depletion blindspot.</span>{' '}
                  The moment before collapse rarely feels like depletion. It
                  feels like choice. The signal is missed until it is too late.
                </li>
              </ul>
            </CollapsibleSection>

            <CollapsibleSection title="What it calls for">
              <p>
                Not more discipline. Not a better plan. Not stricter rules.
              </p>
              <p>
                Curiosity about what the restriction is protecting against.
                Attention to depletion before it becomes collapse. Removal of
                shame from the equation — not as a reward, but as a precondition
                for anything else to work.
              </p>
              <p>
                The question is not: how do I stop collapsing? The question is:
                what does the collapse need that I have not yet found another way
                to give?
              </p>
            </CollapsibleSection>

          </div>
        </section>

        {/* C2 — Self-Neglect as Pathway to Self-Permission */}
        <section>
          <h2 className="font-medium text-primary mb-3">
            Self-Neglect as Pathway to Self-Permission
          </h2>
          <div className="space-y-3">

            <CollapsibleSection title="The pattern">
              <p>
                A period of genuine effort, care, and discipline — wellness and
                all the weight that comes with maintaining it — eventually reaches
                a threshold. The threshold is crossed quietly. What follows is a
                period of neglect that functions as permission: permission to rest,
                to stop performing, to be unobserved, to have something without
                earning it first.
              </p>
              <p>
                Recovery follows. The return to care. And then the cycle begins again.
              </p>
            </CollapsibleSection>

            <CollapsibleSection title="The cycle">
              <ul className="space-y-2 list-none">
                <li>
                  <span className="font-medium">Wellness and its weight.</span>{' '}
                  Doing well carries its own burden — the effort of maintenance,
                  the visibility of it, the expectation that it will continue.
                </li>
                <li>
                  <span className="font-medium">Neglect.</span>{' '}
                  Something is let go. Then something else. The neglect is rarely
                  chosen consciously — it arrives as fatigue, avoidance,
                  distraction.
                </li>
                <li>
                  <span className="font-medium">Threshold.</span>{' '}
                  A point is reached where the gap between the maintained self
                  and the current self is large enough to feel permanent, or at
                  least far away. This is where permission is granted.
                </li>
                <li>
                  <span className="font-medium">Permission granted.</span>{' '}
                  The release. The eating, the not-going, the staying in, the
                  not-trying. It does not feel like failure here — it feels like
                  relief.
                </li>
                <li>
                  <span className="font-medium">Recovery and the return.</span>{' '}
                  Guilt or discomfort eventually tips the balance back. The return
                  to care begins. The weight of wellness resumes.
                </li>
              </ul>
            </CollapsibleSection>

            <CollapsibleSection title="What this is and is not">
              <p>
                This is not laziness or lack of commitment. It is a system that
                has learned to get rest and permission the only way it knows how —
                through breakdown.
              </p>
              <p>
                The neglect phase is not the problem. It is a symptom. The problem
                is the absence of legitimate rest, permission, and relief inside
                the wellness phase — so the system has to manufacture a collapse
                to get them.
              </p>
            </CollapsibleSection>

            <CollapsibleSection title="What it is asking for">
              <p>
                Permission that does not require earning. Rest that does not
                require breakdown as a precondition. Care that does not carry
                the weight of performance.
              </p>
              <p>
                The question is not: how do I maintain consistency? The question
                is: what would it feel like to rest without having first fallen
                apart?
              </p>
            </CollapsibleSection>

          </div>
        </section>

      </div>
    </div>
  )
}
