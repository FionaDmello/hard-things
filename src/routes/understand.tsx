import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/understand')({
  component: UnderstandPatterns,
})

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-mid/15 last:border-b-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex justify-between items-center py-4 text-left group"
      >
        <span className="text-sm text-primary group-hover:text-accent transition-colors pr-4">{title}</span>
        <span
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-mid transition-transform duration-200"
          style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          +
        </span>
      </button>
      {open && (
        <div className="mt-4 mb-6">
          <div
            className="py-4 pl-5 space-y-6 text-sm text-primary leading-relaxed"
            style={{ borderLeft: '2px solid var(--color-accent)', opacity: 0.9 }}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

function PatternSection({
  index,
  title,
  children,
}: {
  index: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-14">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-mid mb-2">{index}</p>
        <h2
          className="text-primary leading-tight"
          style={{ fontFamily: "'Cormorant', Georgia, serif", fontWeight: 400, fontSize: 'clamp(1.6rem, 5vw, 2rem)' }}
        >
          {title}
        </h2>
        <div className="mt-4 h-px bg-mid/20" />
      </div>
      <div>{children}</div>
    </section>
  )
}

function UnderstandPatterns() {
  return (
    <div className="max-w-lg mx-auto px-6 pt-14 pb-24">

      {/* Back navigation */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-mid hover:text-primary transition-colors mb-10">
        <span>←</span>
        <span className="uppercase tracking-[0.15em]">Dashboard</span>
      </Link>

      {/* Page header */}
      <header className="mb-14">
        <h1
          className="text-primary mb-4 leading-tight"
          style={{ fontFamily: "'Cormorant', Georgia, serif", fontWeight: 300, fontSize: 'clamp(2.4rem, 8vw, 3.2rem)' }}
        >
          Patterns to Understand
        </h1>
        <p className="text-sm text-mid leading-relaxed" style={{ fontStyle: 'italic' }}>
          These are not protocols. They are patterns to understand — to be read,
          returned to, and held alongside the habit work.
        </p>
      </header>

      {/* C1 */}
      <PatternSection index="Pattern I" title="Emotional Eating & the Restriction-Collapse Cycle">
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
          <ul className="space-y-6 list-none">
            <li>
              <p className="font-medium text-primary mb-1">All-or-nothing framing.</p>
              <p className="text-mid">
                A rule is either kept perfectly or abandoned entirely. There is
                no middle. The slip becomes the permission structure for collapse.
              </p>
            </li>
            <li>
              <p className="font-medium text-primary mb-1">Shame as accelerant.</p>
              <p className="text-mid">
                Shame after eating does not reduce eating. It increases the
                need for the soothing that eating provides.
              </p>
            </li>
            <li>
              <p className="font-medium text-primary mb-1">Restriction as identity.</p>
              <p className="text-mid">
                The rules become a story about who you are. Breaking them is
                experienced as a self-betrayal, not a behaviour.
              </p>
            </li>
            <li>
              <p className="font-medium text-primary mb-1">The depletion blindspot.</p>
              <p className="text-mid">
                The moment before collapse rarely feels like depletion. It
                feels like choice. The signal is missed until it is too late.
              </p>
            </li>
          </ul>
        </CollapsibleSection>

        <CollapsibleSection title="What it calls for">
          <p>Not more discipline. Not a better plan. Not stricter rules.</p>
          <p>
            Curiosity about what the restriction is protecting against.
            Attention to depletion before it becomes collapse. Removal of
            shame from the equation — not as a reward, but as a precondition
            for anything else to work.
          </p>
          <p className="text-mid italic">
            The question is not: how do I stop collapsing? The question is:
            what does the collapse need that I have not yet found another way
            to give?
          </p>
        </CollapsibleSection>
      </PatternSection>

      {/* C2 */}
      <PatternSection index="Pattern II" title="Self-Neglect as Pathway to Self-Permission">
        <CollapsibleSection title="The pattern">
          <p>
            A period of genuine effort, care, and discipline — wellness and
            all the weight that comes with maintaining it — eventually reaches
            a threshold. The threshold is crossed quietly. What follows is a
            period of neglect that functions as permission: permission to rest,
            to stop performing, to be unobserved, to have something without
            earning it first.
          </p>
          <p>Recovery follows. The return to care. And then the cycle begins again.</p>
        </CollapsibleSection>

        <CollapsibleSection title="The cycle">
          <ul className="space-y-6 list-none">
            <li>
              <p className="font-medium text-primary mb-1">Wellness and its weight.</p>
              <p className="text-mid">
                Doing well carries its own burden — the effort of maintenance,
                the visibility of it, the expectation that it will continue.
              </p>
            </li>
            <li>
              <p className="font-medium text-primary mb-1">Neglect.</p>
              <p className="text-mid">
                Something is let go. Then something else. The neglect is rarely
                chosen consciously — it arrives as fatigue, avoidance, distraction.
              </p>
            </li>
            <li>
              <p className="font-medium text-primary mb-1">Threshold.</p>
              <p className="text-mid">
                A point is reached where the gap between the maintained self
                and the current self is large enough to feel permanent, or at
                least far away. This is where permission is granted.
              </p>
            </li>
            <li>
              <p className="font-medium text-primary mb-1">Permission granted.</p>
              <p className="text-mid">
                The release. The eating, the not-going, the staying in, the
                not-trying. It does not feel like failure here — it feels like relief.
              </p>
            </li>
            <li>
              <p className="font-medium text-primary mb-1">Recovery and the return.</p>
              <p className="text-mid">
                Guilt or discomfort eventually tips the balance back. The return
                to care begins. The weight of wellness resumes.
              </p>
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
          <p className="text-mid italic">
            The question is not: how do I maintain consistency? The question
            is: what would it feel like to rest without having first fallen apart?
          </p>
        </CollapsibleSection>
      </PatternSection>

    </div>
  )
}
