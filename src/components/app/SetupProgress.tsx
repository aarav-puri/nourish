import { CircleCheck, CircleDot, Circle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

export interface SetupStep {
  label: string
  completed: boolean
}

/** How far through setup someone is: a bar, a count, and each step by name. */
export default function SetupProgress({ steps, current }: { steps: SetupStep[]; current: number }) {
  const completed = steps.filter((s) => s.completed).length

  return (
    <div className="card w-full space-y-4 p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Setup progress</span>
        <span className="text-xs text-ink-3">
          {completed} of {steps.length} steps
        </span>
      </div>
      <Progress value={(completed / steps.length) * 100} label="Setup progress" />
      <ol className="flex flex-col gap-2.5">
        {steps.map((step, i) => {
          const Icon = step.completed ? CircleCheck : i === current ? CircleDot : Circle
          return (
            <li
              key={step.label}
              aria-current={i === current ? 'step' : undefined}
              className={`flex items-center gap-2.5 text-sm ${
                step.completed || i === current ? 'text-ink' : 'text-ink-3'
              } ${i === current ? 'font-semibold' : ''}`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {step.label}
              {step.completed && <span className="sr-only">(done)</span>}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
