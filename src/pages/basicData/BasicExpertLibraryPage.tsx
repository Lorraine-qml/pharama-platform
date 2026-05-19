import { useMemo, useState } from 'react'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import type { ExpertRecord } from './basicDataTypes'
import { useBasicDataDemo } from './BasicDataDemoContext'

const FIELD_OPTIONS = ['细胞治疗', '基因编辑', 'AI制药', '药理学', '临床肿瘤', '伦理', '合成生物']

export default function BasicExpertLibraryPage() {
  const toast = useToast()
  const { experts, setExperts, expertWeights, setExpertWeights, optimizeExpertWeights } = useBasicDataDemo()
  const [q, setQ] = useState('')
  const [field, setField] = useState('全部')

  const [edit, setEdit] = useState<ExpertRecord | null>(null)

  const filtered = useMemo(() => {
    return experts.filter((e) => {
      const hit = q.trim() === '' || e.name.includes(q) || e.org.includes(q)
      const fHit = field === '全部' || e.fields.some((fl) => fl.includes(field))
      return hit && fHit
    })
  }, [experts, field, q])

  const sumWx = expertWeights.techKeyword + expertWeights.stageFit + expertWeights.historySimilar + expertWeights.regionFit + expertWeights.loadBalance

  return (
    <div className="space-y-4">
      <header className="rounded-[var(--radius-panel)] border border-primary/15 bg-gradient-to-r from-primary-light/35 via-surface to-surface px-5 py-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase text-muted">基础数据 · 7.3</p>
        <h1 className="mt-1 text-[21px] font-bold text-foreground">专家库管理</h1>
        <p className="mt-2 text-[13px] text-muted">
          科创策源「分配专家」可读取此处的匹配权重；
          <span className="font-semibold text-primary">✨ expert_matcher</span>（业务侧占位）。
        </p>
      </header>

      <section className="rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <select value={field} onChange={(e) => setField(e.target.value)} className="rounded-lg border px-3 py-2 text-[13px]">
              <option>全部</option>
              {FIELD_OPTIONS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
            <input className="min-w-[200px] rounded-lg border px-3 py-2 text-[13px]" placeholder="🔍 搜索姓名/单位" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button type="button" className="rounded-lg border px-3 py-2 text-[12px]" onClick={() => toast.show('占位：批量导入 Excel', 'info')}>
              导入
            </button>
            <button type="button" className="rounded-lg border px-3 py-2 text-[12px]" onClick={() => toast.show('占位：导出所选', 'info')}>
              导出
            </button>
            <button
              type="button"
              className="rounded-lg bg-primary px-4 py-2 text-[12px] font-bold text-white"
              onClick={() =>
                setEdit({
                  id: `ex-${Math.random().toString(36).slice(2, 6)}`,
                  name: '',
                  org: '',
                  fields: [],
                  reviewCount: 0,
                  avgScore: 0,
                  status: '启用中',
                })
              }
            >
              + 新增专家
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead className="border-b border-divider text-[11px] text-muted uppercase">
              <tr>
                <th className="py-2">姓名</th>
                <th className="py-2">单位</th>
                <th className="py-2">专业领域</th>
                <th className="py-2">评审次数</th>
                <th className="py-2">平均分</th>
                <th className="py-2">状态</th>
                <th className="py-2 text-end">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td className="py-2.5 font-semibold">{e.name}</td>
                  <td className="py-2.5">{e.org}</td>
                  <td className="py-2.5 text-muted">{e.fields.join('、')}</td>
                  <td className="py-2.5">{e.reviewCount}</td>
                  <td className="py-2.5 font-mono text-primary">{e.avgScore.toFixed(1)}</td>
                  <td className="py-2.5">{e.status}</td>
                  <td className="py-2.5 text-end">
                    <button type="button" className="me-2 text-[12px] font-semibold text-primary underline" onClick={() => setEdit(structuredClone(e))}>
                      编辑
                    </button>
                    <button type="button" className="text-[12px] text-muted hover:text-primary" onClick={() => toast.show('占位：履历时间线抽屉', 'info')}>
                      详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[var(--radius-panel)] border border-primary/25 bg-gradient-to-br from-primary-light/35 via-page to-page px-5 py-4 shadow-inner">
        <h2 className="text-[14px] font-bold text-foreground">匹配规则权重（五项之和应为 100%）</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ['技术关键词匹配度', 'techKeyword'],
            ['项目阶段匹配', 'stageFit'],
            ['历史相似项目', 'historySimilar'],
            ['地区偏好', 'regionFit'],
            ['负载均衡', 'loadBalance'],
          ].map(([label, key]) => (
            <label key={key} className="block text-[13px]">
              <span className="font-semibold text-muted">{label}</span>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="w-full rounded-lg border px-3 py-2"
                  value={expertWeights[key as keyof typeof expertWeights]}
                  onChange={(ev) =>
                    setExpertWeights((w) => ({ ...w, [key]: Math.max(0, Math.min(100, Number(ev.target.value))) }))
                  }
                />
                <span className="text-muted">%</span>
              </div>
            </label>
          ))}
        </div>
        <p className={cn('mt-3 text-[12px]', sumWx === 100 ? 'text-success font-semibold' : 'text-danger font-semibold')}>
          合计：{sumWx}% {sumWx === 100 ? '（校验通过）' : '— 不满足 100% 请调整'}
        </p>
        <button type="button" className="mt-4 rounded-lg bg-primary px-4 py-2 text-[12px] font-bold text-white" onClick={() => toast.show('已保存演示权重（本地）', 'success')}>
          保存权重
        </button>
        <button type="button" className="ms-3 rounded-lg border border-primary px-4 py-2 text-[12px] font-semibold text-primary" onClick={optimizeExpertWeights}>
          ✨ AI 推荐优化
        </button>
      </section>

      <Modal
        open={edit !== null}
        title={edit?.name?.trim() ? `编辑专家：${edit.name}` : '新增专家'}
        onClose={() => setEdit(null)}
        panelClassName="max-w-lg"
        footer={
          edit ? (
            <div className="flex justify-end gap-2">
              <button type="button" className="rounded-md border px-3 py-2 text-[13px]" onClick={() => setEdit(null)}>
                取消
              </button>
              <button
                type="button"
                className="rounded-md bg-primary px-3 py-2 text-[13px] font-bold text-white"
                onClick={() => {
                  if (!edit.name.trim() || !edit.org.trim()) {
                    toast.show('请填写姓名与单位', 'warning')
                    return
                  }
                  setExperts((list) => {
                    const ix = list.findIndex((x) => x.id === edit.id)
                    if (ix === -1) return [...list, edit]
                    const copy = [...list]
                    copy[ix] = edit
                    return copy
                  })
                  toast.show('专家档案已更新（演示）', 'success')
                  setEdit(null)
                }}
              >
                保存
              </button>
            </div>
          ) : null
        }
      >
        {edit ? (
          <div className="space-y-3 text-[13px]">
            <div className="grid gap-2 sm:grid-cols-2">
              <label>
                <span className="text-muted">姓名</span>
                <input className="mt-1 w-full rounded border px-2 py-1.5" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
              </label>
              <label>
                <span className="text-muted">单位</span>
                <input className="mt-1 w-full rounded border px-2 py-1.5" value={edit.org} onChange={(e) => setEdit({ ...edit, org: e.target.value })} />
              </label>
            </div>
            <label>
              <span className="text-muted">联系电话</span>
              <input className="mt-1 w-full rounded border px-2 py-1.5" value={edit.phone ?? ''} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} />
            </label>
            <label>
              <span className="text-muted">电子邮箱</span>
              <input className="mt-1 w-full rounded border px-2 py-1.5" value={edit.email ?? ''} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
            </label>
            <label>
              <span className="text-muted">简介</span>
              <textarea className="mt-1 w-full rounded border px-2 py-1.5" rows={3} value={edit.intro ?? ''} onChange={(e) => setEdit({ ...edit, intro: e.target.value })} />
            </label>
            <div>
              <p className="text-muted">专业领域</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {FIELD_OPTIONS.map((f) => {
                  const sel = edit.fields.includes(f)
                  return (
                    <button
                      key={f}
                      type="button"
                      className={cn('rounded-full border px-3 py-1 text-[11px]', sel ? 'border-primary bg-primary-light text-primary' : 'border-divider')}
                      onClick={() =>
                        setEdit({
                          ...edit,
                          fields: sel ? edit.fields.filter((x) => x !== f) : [...edit.fields, f],
                        })
                      }
                    >
                      {f}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <label>
                <span className="text-muted">评审次数（演示）</span>
                <input
                  type="number"
                  className="mt-1 w-full rounded border px-2 py-1.5"
                  value={edit.reviewCount}
                  onChange={(e) => setEdit({ ...edit, reviewCount: Number(e.target.value) })}
                />
              </label>
              <label>
                <span className="text-muted">平均分</span>
                <input
                  type="number"
                  className="mt-1 w-full rounded border px-2 py-1.5"
                  value={edit.avgScore}
                  onChange={(e) => setEdit({ ...edit, avgScore: Number(e.target.value) })}
                />
              </label>
              <label>
                <span className="text-muted">状态</span>
                <select
                  className="mt-1 w-full rounded border px-2 py-1.5"
                  value={edit.status}
                  onChange={(e) => setEdit({ ...edit, status: e.target.value as ExpertRecord['status'] })}
                >
                  <option>启用中</option>
                  <option>停用</option>
                </select>
              </label>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
