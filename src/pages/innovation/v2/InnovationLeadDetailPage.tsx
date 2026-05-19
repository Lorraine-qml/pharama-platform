import { Link, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { Modal } from '../../../components/Modal'
import { useToast } from '../../../components/ToastProvider'
import { cn } from '../../../utils/cn'
import type { InvestmentLeadGrade, InvestmentLeadStatus } from './innovationInvestmentTypes'
import { useInnovationInvestmentV2 } from './InnovationInvestmentV2Context'

const ASSIGN = ['张三', '李四', '王五', '—']

export default function InnovationLeadDetailPage() {
  const { leadId } = useParams<{ leadId: string }>()
  const v = useInnovationInvestmentV2()
  const toast = useToast()

  const lead = useMemo(() => v.leads.find((x) => x.id === leadId), [leadId, v.leads])

  const [followOpen, setFollowOpen] = useState(false)
  const [channel, setChannel] = useState('电话')
  const [summ, setSumm] = useState('')
  const [nextPlan, setNextPlan] = useState('')

  if (!lead) {
    return (
      <div className="flex h-full flex-col justify-center px-10 py-14 text-[13px] text-muted">
        未找到该线索。
        <Link className="ms-2 text-primary underline" to="/innovation/outreach">
          返回池
        </Link>
      </div>
    )
  }

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.show(`${label} 已复制`, 'success')
    } catch {
      toast.show('浏览器未授权剪贴板', 'warning')
    }
  }

  const ai = lead.aiCopy
  const conv = lead.conversion

  return (
    <div className="flex flex-col divide-y divide-divider">
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
        <div>
          <p className="text-[11px] font-bold uppercase text-muted">线索</p>
          <h2 className="mt-1 text-[18px] font-bold tracking-tight text-foreground">{lead.name}</h2>
          <div className="mt-3 flex flex-wrap gap-4 text-[12px] text-muted">
            <label className="flex items-center gap-2 font-semibold text-foreground">
              等级
              <select
                className="rounded-md border px-2 py-1 font-normal text-foreground"
                value={lead.grade || ''}
                onChange={(e) => v.updateLead(lead.id, { grade: e.target.value as InvestmentLeadGrade })}
              >
                <option value="">未分级</option>
                <option>S</option>
                <option>A</option>
                <option>B</option>
                <option>C</option>
              </select>
            </label>
            <label className="flex items-center gap-2 font-semibold text-foreground">
              跟进人
              <select
                className="rounded-md border px-2 py-1 font-normal text-foreground"
                value={lead.assignee || '—'}
                onChange={(e) => v.updateLead(lead.id, { assignee: e.target.value === '—' ? '' : e.target.value })}
              >
                {ASSIGN.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 font-semibold text-foreground">
              状态
              <select
                className="rounded-md border px-2 py-1 font-normal text-foreground"
                value={lead.status}
                onChange={(e) => v.updateLead(lead.id, { status: e.target.value as InvestmentLeadStatus })}
              >
                {(['新建', '跟进中', '已触达', '意向确认', '已转化', '已流失'] as const).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-lg border px-4 py-2 text-[13px]" to="/innovation/outreach">
            返回列表
          </Link>
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white"
            onClick={() => toast.show('跳转项目注册占位（演示）', 'info')}
          >
            转项目档案
          </button>
        </div>
      </header>

      <div className="grid gap-0 lg:grid-cols-5">
        <section className="border-divider px-5 py-4 lg:col-span-2 lg:border-r">
          <h3 className="text-[13px] font-bold text-foreground">企业信息</h3>
          <dl className="mt-3 grid gap-2 text-[13px] text-muted">
            <div className="flex justify-between gap-4">
              <dt>赛道</dt>
              <dd className="text-end font-medium text-foreground">{lead.track || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>城市</dt>
              <dd className="text-end text-foreground">{lead.region || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>联系人</dt>
              <dd className="text-end text-foreground">{lead.contact || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>线索来源</dt>
              <dd className="text-end text-primary">{lead.source}</dd>
            </div>
          </dl>
          {lead.oneLiner ? (
            <p className="mt-4 rounded-lg border border-primary/22 bg-primary-light/40 p-3 text-[12px] text-foreground">{lead.oneLiner}</p>
          ) : null}
        </section>

        <section className="px-5 py-4 lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-divider pb-3">
            <h3 className="text-[13px] font-bold text-foreground">✨ 智能生成 · touch_copy_gen</h3>
            <button
              type="button"
              className="rounded-lg bg-gradient-to-r from-primary to-[#4890ff] px-4 py-2 text-[12px] font-bold text-white shadow-sm"
              onClick={() => v.triggerTouchCopyGen(lead.id)}
            >
              一键生成话术及物料
            </button>
          </div>

          {!ai ? (
            <p className="mt-6 rounded-lg border border-dashed border-divider px-4 py-6 text-[13px] text-muted">尚无 AI 草稿 · 可先点击右上角生成。</p>
          ) : (
            <div className="mt-4 space-y-6 text-[13px] leading-relaxed">
              <article>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-foreground">沟通话术</h4>
                  <button type="button" className="text-[12px] font-semibold text-primary hover:underline" onClick={() => void copyText('话术', ai.script)}>
                    复制
                  </button>
                </div>
                <blockquote className="mt-2 rounded-xl border border-divider bg-page/90 p-4 text-[13px] text-foreground">「{ai.script}」</blockquote>
              </article>

              <article>
                <div className="flex flex-wrap gap-3">
                  <h4 className="font-bold text-foreground">邀约邮件</h4>
                  <button type="button" className="text-[12px] text-primary underline" onClick={() => toast.show('占位：富文本编辑器', 'info')}>
                    编辑
                  </button>
                  <button type="button" className="text-[12px] text-primary underline" onClick={() => toast.show('占位：SMTP 连接器', 'warning')}>
                    发送
                  </button>
                </div>
                <p className="mt-1 text-[12px] font-semibold">{ai.emailSubject}</p>
                <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap rounded-lg border px-3 py-2 text-[12px] text-muted">{ai.emailBody}</pre>
              </article>

              <article className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-divider px-4 py-3">
                <div className="min-w-[200px]">
                  <h4 className="font-bold">定制化推介 PDF</h4>
                  <p className="mt-1 text-[12px] text-muted">{ai.pitchPdfHint}</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-primary px-3 py-1.5 text-[12px] font-bold text-primary"
                  onClick={() => toast.show('占位：服务端合成 PDF', 'info')}
                >
                  下载 PDF（演示）
                </button>
              </article>

              <article>
                <h4 className="font-bold text-foreground">入孵方案建议</h4>
                <ul className="mt-2 list-disc space-y-2 ps-5 text-muted">
                  {ai.incubationBullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </article>
            </div>
          )}
        </section>
      </div>

      <section className="px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[13px] font-bold text-foreground">跟进记录</h3>
          <button
            type="button"
            className="rounded-lg bg-primary-light px-3 py-2 text-[12px] font-bold text-primary hover:bg-primary-light/80"
            onClick={() => setFollowOpen(true)}
          >
            + 添加跟进
          </button>
        </div>
        {!lead.followUps.length ? (
          <p className="mt-3 text-[13px] text-muted">暂无记录。</p>
        ) : (
          <table className="mt-4 w-full min-w-[600px] text-left text-[12px]">
            <thead className="border-b border-divider text-muted">
              <tr>
                <th className="py-2">时间</th>
                <th className="py-2">方式</th>
                <th className="py-2">摘要</th>
                <th className="py-2">下次计划</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {lead.followUps.map((f) => (
                <tr key={f.id}>
                  <td className="py-2">{f.at}</td>
                  <td className="py-2">{f.channel}</td>
                  <td className="py-2">{f.summary}</td>
                  <td className="py-2 text-primary">{f.nextPlan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-6 rounded-xl border border-primary/30 bg-gradient-to-br from-primary-light/45 via-page to-page p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/25 pb-3">
            <h3 className="text-[14px] font-bold text-foreground">✨ AI 转化分析 · conversion_analyzer</h3>
            <button type="button" className="text-[13px] font-bold text-primary hover:underline" onClick={() => v.triggerConversionAnalyzer(lead.id)}>
              刷新分析
            </button>
          </div>

          {!conv ? (
            <p className="mt-5 text-[13px] text-muted">可先补充跟进后在上方建模。</p>
          ) : (
            <div className="mt-5 space-y-4 text-[13px]">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-muted">当前概率</span>
                <strong className="text-[20px] text-primary">{conv.prob}%</strong>
                <span className="rounded-md bg-white/80 px-2 py-0.5 text-[11px] font-bold text-muted ring-1 ring-divider">{conv.levelLabel}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/55 ring-1 ring-divider">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-[#4890ff]" style={{ width: `${conv.prob}%` }} />
              </div>
              <div>
                <p className="font-bold text-foreground">关键信号</p>
                <ul className="mt-2 space-y-2">
                  {conv.signals.map((s, i) => (
                    <li
                      key={i}
                      className={cn(
                        'rounded-lg px-3 py-2 ring-1',
                        s.tone === 'pos' && 'bg-success/12 text-success ring-success/35',
                        s.tone === 'warn' && 'bg-warning/12 text-warning ring-warning/30',
                        s.tone === 'neutral' && 'bg-white/85 text-muted ring-divider',
                      )}
                    >
                      {s.tone === 'pos' ? '✓ ' : s.tone === 'warn' ? '⚠ ' : '· '}
                      {s.text}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="rounded-lg bg-white/80 p-4 text-muted ring-1 ring-divider">
                <span className="font-semibold text-foreground">下一步：</span>
                {conv.suggest}
              </p>
            </div>
          )}
        </div>
      </section>

      <Modal
        open={followOpen}
        title="添加跟进记录"
        onClose={() => setFollowOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-md border border-divider px-3 py-2 text-[13px]" onClick={() => setFollowOpen(false)}>
              取消
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-2 text-[13px] font-bold text-white"
              onClick={() => {
                if (!summ.trim()) {
                  toast.show('请填写摘要', 'warning')
                  return
                }
                v.addFollowUp(lead.id, {
                  at: new Date().toISOString().slice(0, 10),
                  channel,
                  summary: summ.trim(),
                  nextPlan: nextPlan.trim(),
                })
                setFollowOpen(false)
                setSumm('')
                setNextPlan('')
              }}
            >
              保存
            </button>
          </div>
        }
      >
        <label className="text-[12px] font-bold text-muted">方式</label>
        <select className="mt-1 w-full rounded-lg border px-3 py-2 text-[13px]" value={channel} onChange={(e) => setChannel(e.target.value)}>
          {(['电话', '邮件', '微信', '路演', '会面'] as const).map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <label className="mt-3 block text-[12px] font-bold text-muted">摘要</label>
        <textarea className="mt-1 w-full rounded-lg border px-3 py-2 text-[13px]" rows={3} value={summ} onChange={(e) => setSumm(e.target.value)} />
        <label className="mt-3 block text-[12px] font-bold text-muted">下次计划</label>
        <input className="mt-1 w-full rounded-lg border px-3 py-2 text-[13px]" value={nextPlan} onChange={(e) => setNextPlan(e.target.value)} />
      </Modal>
    </div>
  )
}
