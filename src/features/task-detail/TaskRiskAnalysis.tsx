import { Card } from '../../components/ui/Card'
import type { BatonTaskDetail } from '../../types/domain'
import { riskToneBackgroundClass, riskToneTextClass } from '@/shared/lib/riskToneStyles'

type TaskRiskAnalysisProps = {
  riskAnalysis: BatonTaskDetail['riskAnalysis']
}

export function TaskRiskAnalysis({ riskAnalysis }: TaskRiskAnalysisProps) {
  return (
    <Card className="h-fit space-y-3 p-5">
      <h3 className="text-sm font-semibold tracking-tight text-slate-800">Risk metrics</h3>
      <div className="space-y-3">
        {riskAnalysis.map((item) => (
          <div
            key={item.title}
            className={`rounded-lg border border-slate-100 p-4 ${riskToneBackgroundClass(item.tone)}`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.title}</p>
            </div>
            <p
              className={`mt-2 text-xl font-semibold tabular-nums tracking-tight ${riskToneTextClass(item.tone)}`}
            >
              {item.value}
            </p>
            {item.helper.trim() ? (
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.helper}</p>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  )
}
