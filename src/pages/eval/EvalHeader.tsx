import { useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'
import type { ProjectArchive } from '../hatch/hatchTypes'
import { DEFAULT_EVAL_PROJECT_ID } from './evalShared'

type Props = {
  title: string
  archives: ProjectArchive[]
  /** 仅实体入孵项目用于画像演示 */
  filter?: (a: ProjectArchive) => boolean
}

export function EvalPageHeader({ title, archives, filter }: Props) {
  const [sp, setSp] = useSearchParams()
  const list = useMemo(() => (filter ? archives.filter(filter) : archives), [archives, filter])
  const projectId = sp.get('projectId') ?? list[0]?.id ?? DEFAULT_EVAL_PROJECT_ID

  function setProjectId(id: string) {
    const next = new URLSearchParams(sp)
    next.set('projectId', id)
    setSp(next, { replace: true })
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider pb-4">
      <h1 className="text-lg font-bold text-foreground">{title}</h1>
      <label className="flex items-center gap-2 text-[13px] text-muted">
        <span className="shrink-0">选择项目</span>
        <select
          className="min-w-[200px] rounded-md border border-divider bg-surface px-3 py-2 text-[13px] text-foreground"
          value={list.some((a) => a.id === projectId) ? projectId : list[0]?.id ?? ''}
          onChange={(e) => setProjectId(e.target.value)}
        >
          {list.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

export function useEvalProjectId(archives: ProjectArchive[], filter?: (a: ProjectArchive) => boolean) {
  const [sp] = useSearchParams()
  const list = useMemo(() => (filter ? archives.filter(filter) : archives), [archives, filter])
  const projectId = sp.get('projectId') ?? list[0]?.id ?? DEFAULT_EVAL_PROJECT_ID
  const archive = useMemo(() => list.find((a) => a.id === projectId) ?? list[0], [list, projectId])
  return { projectId, archive, list }
}
