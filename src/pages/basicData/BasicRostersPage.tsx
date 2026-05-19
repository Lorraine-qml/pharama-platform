import { useState } from 'react'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import type { PartnerOrg } from './basicDataTypes'
import { useBasicDataDemo } from './BasicDataDemoContext'

type Rt = 'partners' | 'sources' | 'blocklist'

export default function BasicRostersPage() {
  const toast = useToast()
  const { partners, setPartners, sources, setSources, blocklist, setBlocklist } = useBasicDataDemo()

  const [tab, setTab] = useState<Rt>('partners')
  const [q, setQ] = useState('')

  const [partnerModal, setPartnerModal] = useState(false)
  const [pDraft, setPDraft] = useState<Partial<PartnerOrg>>({})

  return (
    <div className="space-y-4">
      <header className="rounded-[var(--radius-panel)] border border-primary/15 bg-gradient-to-r from-primary-light/35 via-surface to-surface px-5 py-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase text-muted">基础数据 · 7.4</p>
        <h1 className="mt-1 text-[21px] font-bold text-foreground">名单管理</h1>
      </header>

      <div className="flex flex-wrap gap-2 rounded-[var(--radius-panel)] border border-divider bg-surface p-2 shadow-sm">
        {([
          ['partners', '外部合作机构'],
          ['sources', '项目来源类型'],
          ['blocklist', '黑名单'],
        ] as const).map(([k, lb]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={cn('rounded-lg px-3 py-2 text-[12px] font-bold', tab === k ? 'bg-primary text-white' : 'text-muted hover:bg-page')}
          >
            {lb}
          </button>
        ))}
      </div>

      <section className="rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <input className="min-w-[200px] rounded-lg border px-3 py-2 text-[13px]" placeholder="🔍 搜索" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button type="button" className="rounded-lg border px-3 py-2 text-[12px]" onClick={() => toast.show('占位：Excel 导入', 'info')}>
              导入
            </button>
            <button type="button" className="rounded-lg border px-3 py-2 text-[12px]" onClick={() => toast.show('占位：导出筛选结果', 'info')}>
              导出
            </button>
            {tab === 'partners' ? (
              <button
                type="button"
                className="rounded-lg bg-primary px-4 py-2 text-[12px] font-bold text-white"
                onClick={() => {
                  setPDraft({})
                  setPartnerModal(true)
                }}
              >
                + 新增
              </button>
            ) : null}
          </div>
        </div>

        {tab === 'partners' ? (
          <table className="mt-4 w-full min-w-[640px] text-left text-[13px]">
            <thead className="border-b border-divider text-[11px] text-muted uppercase">
              <tr>
                <th className="py-2">机构名称</th>
                <th className="py-2">类型</th>
                <th className="py-2">联系人</th>
                <th className="py-2">电话</th>
                <th className="py-2">状态</th>
                <th className="py-2 text-end">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {partners
                .filter((p) => q.trim() === '' || p.name.includes(q.trim()))
                .map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 font-semibold">{p.name}</td>
                    <td className="py-2.5">{p.kind}</td>
                    <td className="py-2.5">{p.contact}</td>
                    <td className="py-2.5">{p.phone}</td>
                    <td className="py-2.5">{p.enabled ? '启用' : '停用'}</td>
                    <td className="py-2.5 text-end">
                      <button type="button" className="me-2 text-primary underline" onClick={() => toast.show('编辑占位', 'info')}>
                        编辑
                      </button>
                      <button type="button" className="me-2 text-muted hover:text-primary" onClick={() => setPartners((xs) => xs.map((y) => (y.id === p.id ? { ...y, enabled: !y.enabled } : y)))}>
                        {p.enabled ? '停用' : '启用'}
                      </button>
                      <button type="button" className="text-danger" onClick={() => toast.show('软删除占位', 'warning')}>
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : null}

        {tab === 'sources' ? (
          <table className="mt-4 w-full min-w-[500px] text-left text-[13px]">
            <thead className="border-b border-divider text-[11px] text-muted uppercase">
              <tr>
                <th className="py-2">名称</th>
                <th className="py-2">描述</th>
                <th className="py-2">启用</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {sources
                .filter((s) => q.trim() === '' || s.name.includes(q.trim()))
                .map((s) => (
                  <tr key={s.id}>
                    <td className="py-2.5 font-semibold">{s.name}</td>
                    <td className="py-2.5 text-muted">{s.description || '—'}</td>
                    <td className="py-2.5">
                      <input type="checkbox" checked={s.enabled} onChange={() => setSources((xs) => xs.map((y) => (y.id === s.id ? { ...y, enabled: !y.enabled } : y)))} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : null}

        {tab === 'blocklist' ? (
          <table className="mt-4 w-full min-w-[540px] text-left text-[13px]">
            <thead className="border-b border-divider text-[11px] text-muted uppercase">
              <tr>
                <th className="py-2">主体</th>
                <th className="py-2">拉黑原因</th>
                <th className="py-2">时间</th>
                <th className="py-2">启用</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {blocklist
                .filter((b) => q.trim() === '' || b.name.includes(q.trim()))
                .map((b) => (
                  <tr key={b.id}>
                    <td className="py-2.5 font-semibold">{b.name}</td>
                    <td className="py-2.5">{b.reason}</td>
                    <td className="py-2.5">{b.since}</td>
                    <td className="py-2.5">
                      <input type="checkbox" checked={b.enabled} onChange={() => setBlocklist((xs) => xs.map((y) => (y.id === b.id ? { ...y, enabled: !y.enabled } : y)))} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : null}
      </section>

      <Modal
        open={partnerModal}
        title={pDraft.name?.trim() ? '编辑外部合作机构' : '新增外部合作机构'}
        onClose={() => setPartnerModal(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-md border px-3 py-2 text-[13px]" onClick={() => setPartnerModal(false)}>
              取消
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-2 text-[13px] font-bold text-white"
              onClick={() => {
                if (!pDraft.name?.trim() || !pDraft.kind || !pDraft.contact?.trim()) {
                  toast.show('请填写必填项（名称/类型/联系人）', 'warning')
                  return
                }
                setPartners((list) => [
                  ...list,
                  {
                    id: `prt-${Math.random().toString(36).slice(2, 6)}`,
                    name: pDraft.name!.trim(),
                    kind: pDraft.kind as PartnerOrg['kind'],
                    contact: pDraft.contact!.trim(),
                    phone: pDraft.phone ?? '',
                    enabled: true,
                  },
                ])
                toast.show('机构已入账（演示）', 'success')
                setPartnerModal(false)
              }}
            >
              确定
            </button>
          </div>
        }
      >
        <label className="text-[12px] font-bold text-muted">机构名称 *</label>
        <input className="mt-1 w-full rounded border px-2 py-2" value={pDraft.name ?? ''} onChange={(e) => setPDraft((d) => ({ ...d, name: e.target.value }))} />
        <label className="mt-3 block text-[12px] font-bold text-muted">类型</label>
        <select className="mt-1 w-full rounded border px-2 py-2" value={pDraft.kind ?? 'CRO'} onChange={(e) => setPDraft((d) => ({ ...d, kind: e.target.value as PartnerOrg['kind'] }))}>
          {(['CRO', 'CDMO', '医院', '高校', '投资机构'] as const).map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
        <label className="mt-3 block text-[12px] font-bold text-muted">联系人</label>
        <input className="mt-1 w-full rounded border px-2 py-2" value={pDraft.contact ?? ''} onChange={(e) => setPDraft((d) => ({ ...d, contact: e.target.value }))} />
        <label className="mt-3 block text-[12px] font-bold text-muted">联系电话</label>
        <input className="mt-1 w-full rounded border px-2 py-2" value={pDraft.phone ?? ''} onChange={(e) => setPDraft((d) => ({ ...d, phone: e.target.value }))} />
      </Modal>
    </div>
  )
}
