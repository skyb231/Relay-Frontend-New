import { useEffect, useState } from 'react'
import { normalizeRole } from '@/roles'
import { relayService } from '@/services/relayService'

type AvailablePerson = { id: number; name: string; inOffice: boolean; role: string }

export function useAvailablePeople(teamId: number | null | undefined) {
  const [availablePeople, setAvailablePeople] = useState<AvailablePerson[]>([])

  useEffect(() => {
    if (teamId == null) return
    const resolvedTeamId = teamId
    let mounted = true

    async function loadTeamPeople() {
      try {
        const [teamTasks, roster] = await Promise.all([
          relayService.getBatonTasks({ teamId: resolvedTeamId }),
          relayService.getTeamRoster(String(resolvedTeamId)),
        ])
        if (!mounted) return

        const peopleMap = new Map<number, { name: string; inOffice: boolean; role: string }>()
        roster.forEach((member) => {
          peopleMap.set(member.id, {
            name: member.name.trim() || `User ${member.id}`,
            inOffice: member.in_office,
            role: member.role ?? '',
          })
        })
        teamTasks.forEach((task) => {
          const existing = peopleMap.get(task.ownerId)
          peopleMap.set(task.ownerId, {
            name: task.owner,
            inOffice: task.ownerInOffice,
            role: existing?.role ?? '',
          })
        })

        const people = Array.from(peopleMap.entries())
          .map(([personId, person]) => ({
            id: personId,
            name: person.name,
            inOffice: person.inOffice,
            role: person.role,
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
        setAvailablePeople(people)
      } catch {
        if (!mounted) return
        setAvailablePeople([])
      }
    }

    void loadTeamPeople()
    return () => {
      mounted = false
    }
  }, [teamId])

  const eligibleSuccessorPeople = availablePeople.filter(
    (person) => normalizeRole(person.role) !== 'resilience_manager',
  )

  return {
    availablePeople,
    eligibleSuccessorPeople,
  }
}

