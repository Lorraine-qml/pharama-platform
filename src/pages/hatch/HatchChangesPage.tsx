import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import { useHatchMgmt } from './HatchMgmtContext'
import type { ChangeRequest } from './hatchTypes'

const EXIT_CHECKS = ['空间已释放', '门禁权限已关闭', '平台账号已停用', 'AI 服务已停用', '私有知识库已处理', '资源使用单已结清', '费用已结清'] as const

export default function HatchChangesPage() {
  const { user } = useAuth()
  const toast = useToast()
  const h = useHatchMgmt()
  const isOps = Boolean(user)

  const [fStatus, setFStatus] = useState<'全部' | ChangeRequest['status']>('全部')
  const [approveOpen, setApproveOpen] = useState<ChangeRequest | null>(null)
  const [exitOpen, setExitOpen] = useState<ChangeRequest | null>(null)
  const [opinion, setOpinion] = useState('')
  const [spaceSuggest, setSpaceSuggest] = useState('B 栋 302 室')
  const [checks, setChecks] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(EXIT_CHECKS.map((k) => [k, false])),
  )

  const rows = useMemo(() => {
    return h.changes.filter((c) => fStatus === '全部' || c.status === fStatus)
  }, [h.changes, fStatus])

  return (
    <div className="space-y-5 pb-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-bold text-foreground">项目变更管理</h1>
          <p className="mt-1 text-[12px] text-muted">类型转换、空间、退出/毕业等统一审批 · 通过后自动执行关联动作（演示）</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="rounded-md border px-3 py-2 text-[13px]" onClick={() => toast.show('筛选（演示）', 'info')}>
            筛选
          </button>
          {isOps ? (
            <button type="button" className="rounded-md border px-3 py-2 text-[13px]" onClick={() => toast.show('导出（演示）', 'info')}>
              导出
            </button>
          ) : null}
        </div>
      </header>

      <div className="rounded-lg border border-divider bg-surface p-4 shadow-sm">
        <label className="text-[12px] text-muted">
          状态
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value as typeof fStatus)} className="mt-1 block rounded-md border bg-page px-2 py-2 text-[13px]">
            {(['全部', '待审批', '已通过', '已驳回'] as const).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-lg border border-divider bg-surface shadow-sm">
        <table className="min-w-[960px] w-full border-collapse text-[13px]">
          <thead className="border-b border-divider bg-page text-left text-[12px] font-bold text-muted">
            <tr>
              <th className="px-4 py-3">项目名称</th>
              <th className="px-4 py-3">变更类型</th>
              <th className="px-4 py-3">摘要</th>
              <th className="px-4 py-3">申请人</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3 text-end">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b border-divider">
                <td className="px-4 py-3 font-medium">{c.projectName}</td>
                <td className="px-4 py-3 text-muted">{c.changeType}</td>
                <td className="max-w-[240px] px-4 py-3 text-muted">{c.summary}</td>
                <td className="px-4 py-3">{c.applicant}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-bold',
                      c.status === '待审批' && 'bg-warning/15 text-warning',
                      c.status === '已通过' && 'bg-success/15 text-success',
                      c.status === '已驳回' && 'bg-danger/10 text-danger',
                    )}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-end">
                  <Link to={`/hatch/archive/${c.projectId}`} className="text-primary hover:underline">
                    查看
                  </Link>
                  {isOps && c.status === '待审批' ? (
                    <>
                      {c.changeType === '退出/毕业' ? (
                        <button type="button" className="ms-3 font-semibold text-primary hover:underline" onClick={() => { setExitOpen(c); setChecks(Object.fromEntries(EXIT_CHECKS.map((k) => [k, false]))); setOpinion('') }}>
                          审批
                        </button>
                      ) : (
                        <button type="button" className="ms-3 font-semibold text-primary hover:underline" onClick={() => { setApproveOpen(c); setOpinion(''); setSpaceSuggest('B 栋 302 室') }}>
                          审批
                        </button>
                      )}
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={approveOpen !== null}
        title="审批变更申请"
        onClose={() => setApproveOpen(null)}
        panelClassName="max-w-lg"
        footer={
          <>
            <button type="button" className="rounded-md border px-4 py-2" onClick={() => approveOpen && h.rejectChange(approveOpen.id, opinion || '不同意')}>
              驳回
            </button>
            <button type="button" className="rounded-md bg-primary px-5 py-2 font-bold text-white" onClick={() => approveOpen && h.approveChange(approveOpen.id, opinion, spaceSuggest)}>
              同意
            </button>
          </>
        }
      >
        {approveOpen ? (
          <div className="space-y-3 text-[13px]">
            <p>
              项目：<span className="font-semibold">{approveOpen.projectName}</span>
            </p>
            <p>
              类型：<span className="font-semibold">{approveOpen.changeType}</span>
            </p>
            <p className="text-muted">变更详情：{approveOpen.detail ?? approveOpen.summary}</p>
            <div className="rounded-md border border-divider bg-page p-3 text-[12px]">
              <p className="font-bold">影响评估（系统自动生成 · 演示）</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-muted">
                {approveOpen.changeType === '入孵类型变更' ? (
                  <>
                    <li>需分配实体空间</li>
                    <li>权限模板切换为「实体项目模板」</li>
                    <li>合同需重新签署</li>
                  </>
                ) : (
                  <>
                    <li>更新空间绑定与费用试算</li>
                    <li>孪生地图同步</li>
                  </>
                )}
              </ul>
            </div>
            {approveOpen.changeType === '入孵类型变更' ? (
              <label className="flex flex-col gap-1 text-muted">
                空间分配建议
                <input value={spaceSuggest} onChange={(e) => setSpaceSuggest(e.target.value)} className="rounded-md border px-3 py-2" />
              </label>
            ) : null}
            <label className="flex flex-col gap-1 text-muted">
              审批意见
              <textarea value={opinion} onChange={(e) => setOpinion(e.target.value)} rows={3} className="rounded-md border px-3 py-2" />
            </label>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={exitOpen !== null}
        title={exitOpen ? `退出审批 · ${exitOpen.projectName}` : ''}
        onClose={() => setExitOpen(null)}
        panelClassName="max-w-lg"
        footer={
          <>
            <button type="button" className="rounded-md border px-4 py-2" onClick={() => exitOpen && h.rejectChange(exitOpen.id, opinion || '驳回')}>
              驳回
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-5 py-2 font-bold text-white disabled:opacity-40"
              disabled={!EXIT_CHECKS.every((k) => checks[k])}
              onClick={() => exitOpen && h.completeExit(exitOpen.id, opinion)}
            >
              确认完成退出
            </button>
          </>
        }
      >
        {exitOpen ? (
          <div className="space-y-4 text-[13px]">
            <p>
              退出类型：<span className="font-bold">{exitOpen.exitType ?? '退出'}</span>
            </p>
            <p className="text-muted">原因：{exitOpen.reason ?? '—'}</p>
            <div>
              <p className="mb-2 font-bold">退出前检查（须全部勾选）</p>
              <ul className="space-y-2">
                {EXIT_CHECKS.map((k) => (
                  <li key={k}>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={checks[k]} onChange={() => setChecks((s) => ({ ...s, [k]: !s[k] }))} />
                      {k}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
            <label className="flex flex-col gap-1 text-muted">
              审批意见
              <textarea value={opinion} onChange={(e) => setOpinion(e.target.value)} rows={2} className="rounded-md border px-3 py-2" />
            </label>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
