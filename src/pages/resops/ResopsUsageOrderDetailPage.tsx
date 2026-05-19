import { Link, Navigate, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { useToast } from '../../components/ToastProvider'
import { useResopsV1 } from './ResopsV1Context'
import { USAGE_ORDER_STATUS_LABEL } from './resopsV1Labels'

export default function ResopsUsageOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const { user } = useAuth()
  const toast = useToast()
  const { usageOrders, uploadUsageResult, completeUsageByApplicant } = useResopsV1()
  const [stars, setStars] = useState(5)
  const [reviewText, setReviewText] = useState('设备很好，预约流程清晰。')

  const o = useMemo(() => usageOrders.find((x) => x.id === orderId), [usageOrders, orderId])

  if (!user) return <Navigate to="/login" replace />
  if (!o) return <p className="text-[13px] text-muted">未找到使用单。</p>

  const isApplicant = Boolean(user)
  const isProvider = Boolean(user)

  return (
    <div className="space-y-5">
      <Link to="/resops/usage-orders" className="text-[13px] font-semibold text-primary hover:underline">
        ← 返回列表
      </Link>

      <header className="rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
        <h1 className="text-[20px] font-bold text-foreground">使用单详情 · {o.code}</h1>
        <p className="mt-2 text-[13px] text-muted">
          资源：{o.resourceName} · 提供方：{o.providerName}
        </p>
      </header>

      <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-5 shadow-sm">
        <dl className="grid gap-2 text-[13px] sm:grid-cols-2">
          <div className="flex justify-between border-b border-divider py-2">
            <dt className="text-muted">申请方</dt>
            <dd className="font-medium">{o.applicantLabel}</dd>
          </div>
          <div className="flex justify-between border-b border-divider py-2">
            <dt className="text-muted">申请时间</dt>
            <dd className="tabular-nums">{o.createdAt}</dd>
          </div>
          <div className="flex justify-between border-b border-divider py-2 sm:col-span-2">
            <dt className="text-muted">使用时段</dt>
            <dd>{o.slot}</dd>
          </div>
          <div className="flex justify-between border-b border-divider py-2">
            <dt className="text-muted">总费用</dt>
            <dd className="font-semibold text-primary">{o.totalFeeLabel}</dd>
          </div>
          <div className="flex justify-between border-b border-divider py-2">
            <dt className="text-muted">状态</dt>
            <dd>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[12px] font-bold text-primary">{USAGE_ORDER_STATUS_LABEL[o.status]}</span>
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-5 shadow-sm">
        <h2 className="text-[14px] font-bold">执行记录</h2>
        <ul className="mt-3 space-y-2 text-[13px]">
          {o.timeline.map((e) => (
            <li key={e.id} className="flex gap-2 border-s-2 border-primary/30 ps-3">
              <span className="tabular-nums text-muted">{e.at}</span>
              <span>{e.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-5 shadow-sm">
        <h2 className="text-[14px] font-bold">执行结果（提供方上传）</h2>
        <ul className="mt-2 text-[13px]">
          {o.resultFiles.map((f) => (
            <li key={f.name} className="py-1">
              <button type="button" className="font-semibold text-primary hover:underline" onClick={() => toast.show(`预览 ${f.name}`, 'info')}>
                {f.name}
              </button>{' '}
              <button type="button" className="text-muted hover:underline" onClick={() => toast.show(`下载 ${f.name}`, 'info')}>
                下载
              </button>
            </li>
          ))}
        </ul>
        {isProvider && o.status === 'in_progress' ? (
          <button
            type="button"
            className="mt-3 rounded-md border border-divider px-3 py-2 text-[12px] font-semibold"
            onClick={() => {
              uploadUsageResult(o.id, `检测报告-${Date.now()}.pdf`)
              toast.show('已上传结果文件（演示）', 'success')
            }}
          >
            上传结果
          </button>
        ) : null}
      </section>

      <section className="rounded-[var(--radius-panel)] border border-divider bg-surface p-5 shadow-sm">
        <h2 className="text-[14px] font-bold">评价</h2>
        {o.applicantReviewStars != null ? (
          <p className="mt-2 text-[13px]">
            <span className="text-warning">{'★'.repeat(o.applicantReviewStars)}</span>
            <span className="text-muted">{'☆'.repeat(5 - o.applicantReviewStars)}</span>
            <span className="ms-2">{o.applicantReviewText}</span>
          </p>
        ) : (
          <p className="mt-2 text-[13px] text-muted">项目方尚未评价。</p>
        )}
        {isApplicant && o.status === 'in_progress' ? (
          <div className="mt-4 space-y-2">
            <label className="block text-[12px] text-muted">
              星级
              <input type="range" min={1} max={5} value={stars} onChange={(e) => setStars(Number(e.target.value))} className="mt-1 block w-full accent-primary" />
            </label>
            <label className="block text-[12px] text-muted">
              评价内容
              <textarea className="mt-1 w-full rounded-md border border-divider px-3 py-2 text-[13px]" rows={3} value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md bg-primary px-4 py-2 text-[13px] font-bold text-white"
                onClick={() => {
                  completeUsageByApplicant(o.id, stars, reviewText)
                  toast.show('已确认完成并提交评价', 'success')
                }}
              >
                确认完成并评价
              </button>
              <button type="button" className="rounded-md border border-divider px-4 py-2 text-[13px]" onClick={() => toast.show('异常上报（演示）', 'warning')}>
                异常上报
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
