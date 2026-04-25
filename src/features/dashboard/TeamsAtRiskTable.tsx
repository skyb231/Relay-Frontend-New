import { useState } from 'react'
import { Link } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import { ROUTES } from '../../app/routes'
import { Badge } from '../../components/ui/Badge'
import { ConfirmModal } from '../../components/ui/ConfirmModal'
import { Table } from '../../components/ui/Table'
import { relayService } from '../../services/relayService'
import type { TeamRisk } from '../../types/domain'
import { dashboardHeaders } from './dashboard.constants'

type TeamsAtRiskTableProps = {
  teams: TeamRisk[]
}

export function TeamsAtRiskTable({ teams }: TeamsAtRiskTableProps) {
  const [exportConfirm, setExportConfirm] = useState<TeamRisk | null>(null)

  async function runExport(team: TeamRisk) {
    const detail = await relayService.getTeamDetail(team.id)
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const left = 48
    const right = pageWidth - 48
    let y = 52
    const labelColWidth = 118
    const lineHeight = 16
    const blockGap = 10

    const addHeading = (text: string) => {
      if (y > pageHeight - 100) {
        doc.addPage()
        y = 52
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.text(text, left, y)
      y += 22
    }

    const addLine = (label: string, value: string) => {
      if (y > pageHeight - 72) {
        doc.addPage()
        y = 52
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(`${label}:`, left, y)
      doc.setFont('helvetica', 'normal')
      const wrappedRaw: unknown = doc.splitTextToSize(value || '—', right - left - labelColWidth)
      const wrapped = Array.isArray(wrappedRaw) ? wrappedRaw.map(String) : [String(wrappedRaw)]
      doc.text(wrapped, left + labelColWidth, y)
      y += Math.max(lineHeight + 4, wrapped.length * lineHeight) + 4
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.text(`${detail.name} - Team Export`, left, y)
    y += 28
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(`Generated: ${new Date().toLocaleString()}`, left, y)
    y += 32

    addHeading('Overview')
    addLine('Risk label', detail.riskLabel)
    addLine('Handover ready', detail.metrics.handoverReady)
    addLine('Unassigned', detail.metrics.unassigned)
    addLine('Avg reconstruction', detail.metrics.reconstructionTime)
    addLine('Critical delays', detail.metrics.criticalDelays)

    y += blockGap
    addHeading('Staff')
    detail.staff.forEach((person, index) => {
      const office = person.status === 'Active' ? 'In office' : 'Out of office'
      addLine(`${index + 1}. ${person.name}`, office)
    })

    y += blockGap
    addHeading('Batons')
    detail.batons.forEach((baton, index) => {
      if (y > pageHeight - 120) {
        doc.addPage()
        y = 52
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(`${index + 1}. ${baton.title}`, left, y)
      y += 20
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      const ownerOffice = baton.ownerStatus === 'Active' ? 'In office' : 'Out of office'
      const detailLine1 = `State: ${baton.state}`
      const detailLine2 = `ID ${baton.id} | Owner ${baton.owner} (${ownerOffice}) | Successor ${baton.successor} | Risk ${baton.risk} | Docs ${baton.docs}`
      doc.text(detailLine1, left, y)
      y += 14
      const wrapped2Raw: unknown = doc.splitTextToSize(detailLine2, right - left)
      const wrapped2 = Array.isArray(wrapped2Raw) ? wrapped2Raw.map(String) : [String(wrapped2Raw)]
      doc.text(wrapped2, left, y)
      y += Math.max(14, wrapped2.length * 12) + blockGap
    })

    doc.save(`${detail.name.toLowerCase().replace(/\s+/g, '-')}-team-view.pdf`)
  }

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Teams at Risk</h2>
          <p className="mt-0.5 text-xs text-slate-500">Ranked by highest operational risk</p>
        </div>
        <Table className="rounded-none border-0 shadow-none" headers={dashboardHeaders}>
          {teams.map((team) => (
            <tr key={team.id} className="transition-colors hover:bg-slate-50/90">
              <td className="px-3 py-3.5 text-sm font-semibold sm:px-4">
                <Link
                  to={ROUTES.teamDetail(team.id)}
                  state={{ from: 'dashboard' }}
                  className="text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-800"
                >
                  {team.name}
                </Link>
              </td>
              <td className="px-3 py-3.5 text-sm text-slate-600 sm:px-4">{team.division}</td>
              <td className="px-3 py-3.5 text-sm tabular-nums text-slate-700 sm:px-4">{team.staffAvailability}</td>
              <td className="px-3 py-3.5 text-sm font-medium tabular-nums text-slate-800 sm:px-4">
                {team.documentationReadiness}
              </td>
              <td className="px-3 py-3.5 text-sm font-medium tabular-nums text-slate-800 sm:px-4">
                {team.unassignedResponsibilities}%
              </td>
              <td className="px-3 py-3.5 sm:px-4">
                <Badge tone={team.tone} label={team.deliveryDelays} className="text-[11px] font-semibold" />
              </td>
              <td className="px-3 py-3.5 sm:px-4">
                <Badge tone={team.tone} label={team.riskScore} className="text-[11px] font-semibold" />
              </td>
              <td className="px-3 py-3.5 sm:px-4">
                <button
                  type="button"
                  onClick={() => setExportConfirm(team)}
                  className="inline-flex rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[var(--relay-navy)] shadow-sm hover:bg-slate-50"
                >
                  Export
                </button>
              </td>
            </tr>
          ))}
        </Table>
      </section>

      <ConfirmModal
        isOpen={exportConfirm != null}
        title="Export Team Report"
        message={
          exportConfirm ? (
            <p>
              Confirming will generate and download a PDF report for{' '}
              <span className="font-semibold text-slate-800">{exportConfirm.name}</span>.
            </p>
          ) : null
        }
        confirmLabel="Download"
        onCancel={() => setExportConfirm(null)}
        onConfirm={() => {
          const team = exportConfirm
          setExportConfirm(null)
          if (team) void runExport(team)
        }}
      />
    </>
  )
}
