import { Link, Navigate, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import { reviewsForResource } from './resopsV1Mock'
import { useResopsV1 } from './ResopsV1Context'
import { demoApplicantForRole, feeSummary, RESOURCE_STATUS_LABEL } from './resopsV1Labels'
import type { ResOpenScope } from './resopsV1Types'
import {
  isMainStepCompleted,
  isMainStepCurrent,
  isRejected,
  LIFECYCLE_MAIN_STEPS,
  mainFlowStepIndex,
  opsStatusSuffix,
} from './resopsResourceFlow'

const SCOPE_LABEL: Record<ResOpenScope, string> = {
  all: '全部项目方',
  physical_only: '仅实体项目',
  virtual_only: '仅虚拟项目',
  whitelist: '指定项目方',
}

const TABS = [
  { id: 'base', label: '基础信息' },
  { id: 'qual', label: '资质材料' },
  { id: 'stats', label: '使用统计' },
  { id: 'audit', label: '审核记录' },
  { id: 'reviews', label: '评价列表' },
] as const

export default function ResopsResourceDetailPage() {
  const { resourceId } = useParams<{ resourceId: string }>()
  const { user } = useAuth()
  const toast = useToast()
  const { resources, submitApplication, setResourceStatus, publishResource, updateResource } = useResopsV1()
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('base')
  const [bookOpen, setBookOpen] = useState(false)
  const [bindOpen, setBindOpen] = useState(false)
  const [bindInput, setBindInput] = useState('')
  const [slot, setSlot] = useState('05-28 09:00-11:00')
  const [stepTip, setStepTip] = useState<string | null>(null)

  const r = useMemo(() => resources.find((x) => x.id === resourceId), [resources, resourceId])
  const reviews = useMemo(() => (resourceId ? reviewsForResource(resourceId) : []), [resourceId])

  const showOps = Boolean(user)
  const applicant = user ? demoApplicantForRole(user.role) : { key: '', label: '' }

  if (!user) return <Navigate to="/login" replace />
  if (!r) return <p className="text-[13px] text-muted">未找到资源。</p>

  const res = r

  const suffix = opsStatusSuffix(res.status)
  const rejected = isRejected(res.status)
  const mainIdx = mainFlowStepIndex(res.status)

  function onStepClick(stepIdx: number) {
    const logs = res.auditLog ?? []
    const ev = logs[stepIdx] ?? logs[0]
    setStepTip(ev ? `${ev.at} · ${ev.actor} · ${ev.label}${ev.detail ? `：${ev.detail}` : ''}` : '暂无节点记录')
  }

  function openBind() {
    setBindInput(res.twinBindNote ?? '')
    setBindOpen(true)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/resops/mgmt" className="text-[13px] font-semibold text-primary hover:underline">
          ← 返回资源管理
        </Link>
        <div className="flex flex-wrap gap-2">
          {res.status === 'listed' ? (
            <button type="button" onClick={() => setBookOpen(true)} className="rounded-md bg-primary px-4 py-2 text-[13px] font-bold text-white shadow-sm hover:bg-primary-hover">
              立即预约
            </button>
          ) : null}
          <button type="button" className="rounded-md border border-divider px-3 py-2 text-[12px]" onClick={() => toast.show('完整编辑表单（演示）', 'info')}>
            编辑
          </button>
        </div>
      </div>

      <header className="rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold text-foreground">资源详情 · {res.name}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-[13px]">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-bold text-primary">{RESOURCE_STATUS_LABEL[res.status]}</span>
              {suffix ? <span className="text-muted">当前运营状态：{suffix}</span> : null}
              {res.status === 'listed' ? <span className="text-success">● {res.availabilityLabel}</span> : <span className="text-muted">{res.availabilityLabel}</span>}
            </p>
          </div>
        </div>

        {showOps ? (
          <div className="mt-5 rounded-lg border border-divider bg-page/50 p-4">
            <p className="text-[12px] font-bold text-muted">流程进度</p>
            {rejected ? (
              <p className="mt-2 text-[13px] font-semibold text-danger">审核已拒绝，流程终止（演示数据不可恢复）。</p>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-1 text-[11px] sm:text-[12px]">
                {LIFECYCLE_MAIN_STEPS.map((s, i) => {
                  const done = isMainStepCompleted(res.status, i)
                  const cur = isMainStepCurrent(res.status, i)
                  return (
                    <div key={s.key} className="flex min-w-0 flex-1 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onStepClick(i)}
                        className={cn(
                          'w-full rounded-md border px-1 py-2 text-center font-semibold transition-colors',
                          cur ? 'border-primary bg-primary-light text-primary' : done ? 'border-success/40 bg-success/10 text-success' : 'border-divider text-muted',
                        )}
                      >
                        {done ? '✓ ' : cur ? '● ' : '○ '}
                        {s.label}
                      </button>
                      {i < LIFECYCLE_MAIN_STEPS.length - 1 ? <span className="shrink-0 text-muted">→</span> : null}
                    </div>
                  )
                })}
                {suffix ? <span className="ms-2 shrink-0 rounded-md border border-divider bg-surface px-2 py-1 font-semibold text-foreground">{suffix}</span> : null}
              </div>
            )}
            {stepTip ? <p className="mt-2 text-[12px] text-muted">节点记录：{stepTip}</p> : null}
            <p className="mt-3 text-[12px] text-muted">
              {mainIdx === 3 && res.status === 'listed' ? '资源已上架，项目方可见可申请。如需临时维护，请使用下方操作。' : null}
              {res.status === 'pending_listing' ? '资源已通过审核，请点击「上架」后项目方即可在目录中检索。' : null}
              {res.status === 'pending_review' ? '资源待平台审核，请在资源管理列表处理审核。' : null}
            </p>
          </div>
        ) : null}

        {showOps ? (
          <div className="mt-4 rounded-lg border border-primary/20 bg-primary-light/30 p-4">
            <p className="text-[12px] font-bold text-foreground">状态维护</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {res.status === 'pending_listing' ? (
                <button type="button" className="rounded-md bg-primary px-3 py-2 text-[12px] font-bold text-white" onClick={() => { publishResource(res.id); toast.show('已上架', 'success') }}>
                  上架
                </button>
              ) : null}
              {res.status === 'listed' ? (
                <>
                  <button type="button" className="rounded-md border border-divider bg-surface px-3 py-2 text-[12px] font-semibold" onClick={() => { setResourceStatus(res.id, 'maintenance'); toast.show('已设为维护中', 'info') }}>
                    设为维护中
                  </button>
                  <button type="button" className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-[12px] font-semibold text-warning" onClick={() => { setResourceStatus(res.id, 'anomaly'); toast.show('已标记异常', 'warning') }}>
                    标记异常
                  </button>
                  <button type="button" className="rounded-md border border-divider px-3 py-2 text-[12px] font-semibold" onClick={() => { setResourceStatus(res.id, 'delisted'); toast.show('已下架', 'success') }}>
                    下架
                  </button>
                </>
              ) : null}
              {res.status === 'maintenance' || res.status === 'anomaly' ? (
                <button type="button" className="rounded-md bg-primary px-3 py-2 text-[12px] font-bold text-white" onClick={() => { setResourceStatus(res.id, 'listed'); toast.show('已恢复为已上架', 'success') }}>
                  恢复正常
                </button>
              ) : null}
              <button type="button" className="rounded-md border border-divider px-3 py-2 text-[12px] font-semibold" onClick={openBind}>
                孪生绑定
              </button>
            </div>
          </div>
        ) : null}
      </header>

      <div className="flex flex-wrap gap-2 border-b border-divider pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn('rounded-md px-3 py-2 text-[12px] font-semibold transition-colors', tab === t.id ? 'bg-primary text-white' : 'text-muted hover:bg-page')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'base' ? (
        <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-5 shadow-sm">
          <dl className="grid gap-2 text-[13px] sm:grid-cols-2">
            <div className="flex justify-between gap-2 border-b border-divider py-2">
              <dt className="text-muted">资源名称</dt>
              <dd className="text-end font-medium">{res.name}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-divider py-2">
              <dt className="text-muted">一级类型</dt>
              <dd className="text-end">{res.level1}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-divider py-2">
              <dt className="text-muted">二级类型</dt>
              <dd className="text-end">{res.level2}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-divider py-2">
              <dt className="text-muted">提供方</dt>
              <dd className="text-end font-medium">{res.providerName}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-divider py-2">
              <dt className="text-muted">联系人</dt>
              <dd className="text-end">{res.contactName}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-divider py-2">
              <dt className="text-muted">电话</dt>
              <dd className="text-end">{res.phone}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-divider py-2 sm:col-span-2">
              <dt className="text-muted">开放时间</dt>
              <dd className="text-end">{res.hours}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-divider py-2 sm:col-span-2">
              <dt className="text-muted">资源简介</dt>
              <dd className="max-w-xl text-end">{res.intro}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-divider py-2 sm:col-span-2">
              <dt className="text-muted">能力描述</dt>
              <dd className="max-w-xl text-end">{res.capability}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-divider py-2">
              <dt className="text-muted">适用对象</dt>
              <dd className="text-end">
                {SCOPE_LABEL[res.scope]}
                {res.scope === 'whitelist' && res.scopeWhitelistNote ? `（${res.scopeWhitelistNote}）` : ''}
              </dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-divider py-2">
              <dt className="text-muted">收费</dt>
              <dd className="text-end font-semibold text-primary">{feeSummary(res.feeMode, res.priceAmount, res.priceUnit, res.remark)}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-divider py-2 sm:col-span-2">
              <dt className="text-muted">备注</dt>
              <dd className="text-end">{res.remark ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-divider py-2 sm:col-span-2">
              <dt className="text-muted">其他</dt>
              <dd className="text-end text-[12px] text-muted">
                {res.needPlatformReview ? '需平台监管审核 · ' : ''}
                {res.limitConcurrency ? '限制并发 · ' : ''}
                {!res.needPlatformReview && !res.limitConcurrency ? '—' : ''}
              </dd>
            </div>
            <div className="flex justify-between gap-2 border-b border-divider py-2 sm:col-span-2">
              <dt className="text-muted">位置</dt>
              <dd className="text-end">
                {res.location}{' '}
                <button type="button" className="ms-2 font-semibold text-primary hover:underline" onClick={() => toast.show('打开孪生地图（演示）', 'info')}>
                  查看孪生地图
                </button>
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      {tab === 'qual' ? (
        <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-5 shadow-sm">
          <h2 className="text-[14px] font-bold">资质材料</h2>
          <ul className="mt-3 space-y-2 text-[13px]">
            {(res.qualificationFiles ?? []).length ? (
              (res.qualificationFiles ?? []).map((f) => (
                <li key={f.id} className="flex items-center justify-between rounded-lg border border-divider bg-page/50 px-3 py-2">
                  <span>{f.name}</span>
                  <button type="button" className="text-primary hover:underline" onClick={() => toast.show('预览（演示）', 'info')}>
                    预览
                  </button>
                </li>
              ))
            ) : (
              <p className="text-muted">暂无上传材料。</p>
            )}
          </ul>
        </section>
      ) : null}

      {tab === 'stats' ? (
        <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-5 shadow-sm">
          <h2 className="text-[14px] font-bold">使用统计（演示）</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { k: '累计预约', v: String(res.reviewCount * 3 + 12) },
              { k: '本月使用', v: String(Math.max(1, res.reviewCount)) },
              { k: '平均评分', v: res.rating.toFixed(1) },
            ].map((x) => (
              <div key={x.k} className="rounded-lg border border-divider bg-page/40 px-3 py-3 text-center">
                <p className="text-[12px] text-muted">{x.k}</p>
                <p className="mt-1 text-[20px] font-bold text-foreground">{x.v}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {tab === 'audit' ? (
        <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-5 shadow-sm">
          <h2 className="text-[14px] font-bold">审核记录</h2>
          <ul className="mt-3 space-y-2 text-[13px]">
            {(res.auditLog ?? []).length ? (
              [...(res.auditLog ?? [])]
                .slice()
                .reverse()
                .map((e) => (
                  <li key={e.id} className="rounded-lg border border-divider bg-page/50 px-3 py-2">
                    <span className="font-mono text-[12px] text-muted">{e.at}</span> <span className="font-semibold">{e.actor}</span> · {e.label}
                    {e.detail ? <p className="mt-1 text-[12px] text-muted">{e.detail}</p> : null}
                  </li>
                ))
            ) : (
              <p className="text-muted">暂无审核记录。</p>
            )}
          </ul>
        </section>
      ) : null}

      {tab === 'reviews' ? (
        <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-5 shadow-sm">
          <h2 className="text-[14px] font-bold">评价列表</h2>
          <ul className="mt-3 space-y-2 text-[13px]">
            {reviews.map((rv) => (
              <li key={rv.id} className="rounded-lg border border-divider bg-page/50 px-3 py-2">
                <span className="text-warning">{'★'.repeat(rv.stars)}</span>
                <span className="text-muted">{'☆'.repeat(5 - rv.stars)}</span>
                <span className="ms-2 text-muted">{rv.at}</span> <span className="font-medium">{rv.author}</span>：{rv.text}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {res.status === 'listed' && tab === 'base' ? (
        <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-5 shadow-sm">
          <h2 className="text-[14px] font-bold text-foreground">预约日历（月视图 · 演示）</h2>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-muted">
            {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
            {Array.from({ length: 28 }, (_, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-md py-2 text-[12px]',
                  i % 7 === 0 || i % 7 === 6 ? 'bg-page text-muted' : i === 12 || i === 13 ? 'bg-muted/30 text-muted line-through' : 'cursor-pointer bg-primary/8 font-semibold text-primary hover:bg-primary/15',
                )}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <Modal open={bookOpen} title="发起预约申请" onClose={() => setBookOpen(false)} panelClassName="max-w-md">
        <p className="text-[12px] text-muted">申请方：{applicant.label}</p>
        <label className="mt-3 block text-[13px] text-muted">
          使用时段
          <input className="mt-1 w-full rounded-md border border-divider px-3 py-2" value={slot} onChange={(e) => setSlot(e.target.value)} />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-md border border-divider px-3 py-2 text-[13px]" onClick={() => setBookOpen(false)}>
            取消
          </button>
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-2 text-[13px] font-bold text-white"
            onClick={() => {
              submitApplication({ resourceId: res.id, applicantKey: applicant.key, applicantLabel: applicant.label, slot })
              setBookOpen(false)
              toast.show('申请已提交 · 待提供方确认', 'success')
            }}
          >
            提交申请
          </button>
        </div>
      </Modal>

      <Modal open={bindOpen} title="孪生空间绑定" onClose={() => setBindOpen(false)} panelClassName="max-w-md">
        <textarea className="mt-1 w-full rounded-md border border-divider px-3 py-2 text-[13px]" rows={3} value={bindInput} onChange={(e) => setBindInput(e.target.value)} />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-md border border-divider px-3 py-2 text-[13px]" onClick={() => setBindOpen(false)}>
            取消
          </button>
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-2 text-[13px] font-bold text-white"
            onClick={() => {
              updateResource(res.id, { twinBindNote: bindInput, location: bindInput.slice(0, 16) || res.location })
              setBindOpen(false)
              toast.show('绑定已保存', 'success')
            }}
          >
            保存
          </button>
        </div>
      </Modal>
    </div>
  )
}
