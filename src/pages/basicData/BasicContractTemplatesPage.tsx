import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { useContractTemplates, type GlobalTemplateStatus } from '../../contexts/ContractTemplatesContext'
import { cn } from '../../utils/cn'
import type { IncubationType } from './basicDataTypes'

const INC_TYPES: (IncubationType | '全部')[] = ['全部', '实体入孵', '虚拟入孵', '服务商认证', '联合孵化']
const STATUSES: (GlobalTemplateStatus | '全部')[] = ['全部', '启用中', '草稿', '已停用']

/** 系统预定义变量库（演示：与字典/后端对齐） */
const CONTRACT_VARIABLE_KEYS = [
  '项目名称',
  '主体全称',
  '统一社会信用代码',
  '入孵开始日期',
  '入孵结束日期',
  '楼宇',
  '楼层',
  '房间号',
  '面积',
  '租金',
  '物业费',
  'AI服务套餐',
] as const

function previewWithFakeData(content: string) {
  const map: Record<string, string> = {
    项目名称: '示例生物医药项目',
    主体全称: '南京示例生物科技有限公司',
    统一社会信用代码: '91320100MA1EXAMPLE',
    入孵开始日期: '2025-05-10',
    入孵结束日期: '2026-05-09',
    楼宇: 'B 栋',
    楼层: '3 层',
    房间号: '301',
    面积: '80',
    租金: '5000',
    物业费: '500',
    AI服务套餐: '标准版（1000 次/月）',
    信用代码: '91320100MA1EXAMPLE',
    入孵开始: '2025-05-10',
    入孵结束: '2026-05-09',
  }
  let out = content
  for (const [k, v] of Object.entries(map)) {
    out = out.split(`{{${k}}}`).join(v)
  }
  return out
}

export default function BasicContractTemplatesPage() {
  const toast = useToast()
  const { user } = useAuth()
  const isOps = Boolean(user)
  const ct = useContractTemplates()

  const [fType, setFType] = useState<(typeof INC_TYPES)[number]>('全部')
  const [fStatus, setFStatus] = useState<(typeof STATUSES)[number]>('全部')
  const [q, setQ] = useState('')

  const [newOpen, setNewOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newInc, setNewInc] = useState<IncubationType>('实体入孵')
  const [newMode, setNewMode] = useState<'blank' | 'copy' | 'import'>('blank')
  const [copyFromId, setCopyFromId] = useState('')
  const [importName, setImportName] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [bodyDraft, setBodyDraft] = useState('')
  const [verOpen, setVerOpen] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState<string | null>(null)
  const [importTargetId, setImportTargetId] = useState<string | null>(null)

  const editor = useMemo(() => (editingId ? ct.getById(editingId) : undefined), [ct, editingId])

  const rows = useMemo(() => {
    return ct.currentHeads.filter((t) => {
      if (fType !== '全部' && t.applicableType !== fType) return false
      if (fStatus !== '全部' && t.status !== fStatus) return false
      if (q.trim() && !t.name.toLowerCase().includes(q.trim().toLowerCase())) return false
      return true
    })
  }, [ct.currentHeads, fType, fStatus, q])

  function openEditor(id: string) {
    const t = ct.getById(id)
    if (!t) return
    setEditingId(id)
    setBodyDraft(t.content)
  }

  function insertVar(key: string) {
    const ph = `{{${key}}}`
    setBodyDraft((b) => (b ? `${b}${ph}` : ph))
  }

  function toolbarWrap(prefix: string, suffix: string) {
    setBodyDraft((b) => `${b}${prefix}选区文字${suffix}`)
  }

  return (
    <div className="space-y-5 pb-10">
      <header className="rounded-[var(--radius-panel)] border border-primary/15 bg-gradient-to-r from-primary-light/35 via-surface to-surface px-5 py-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase text-muted">基础数据 · 合同模板</p>
        <h1 className="mt-1 text-[21px] font-bold text-foreground">合同模板管理</h1>
        <p className="mt-2 text-[13px] text-muted">
          维护入孵协议、租赁补充、服务协议等模板（非具体合同实例）。与
          <Link to="/hatch/signing" className="mx-1 font-semibold text-primary hover:underline">
            入孵签约管理
          </Link>
          联动：签约时仅可选择「启用中」且适用类型匹配的模板。
        </p>
      </header>

      <section className="rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-[12px] text-muted">
              适用类型
              <select value={fType} onChange={(e) => setFType(e.target.value as (typeof INC_TYPES)[number])} className="mt-1 block rounded-md border border-divider bg-page px-2 py-2 text-[13px]">
                {INC_TYPES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="text-[12px] text-muted">
              状态
              <select value={fStatus} onChange={(e) => setFStatus(e.target.value as (typeof STATUSES)[number])} className="mt-1 block rounded-md border border-divider bg-page px-2 py-2 text-[13px]">
                {STATUSES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="min-w-[200px] flex-1 text-[12px] text-muted">
              搜索模板名称
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍" className="mt-1 w-full rounded-md border border-divider px-3 py-2 text-[13px]" />
            </label>
          </div>
          {isOps ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-[var(--radius-button)] border border-divider bg-surface px-4 py-2 text-[13px] font-semibold hover:border-primary/40"
                onClick={() => toast.show('请使用表格行内「导入」上传 .docx / .pdf 至指定模板', 'info')}
              >
                导入
              </button>
              <button
                type="button"
                className="rounded-[var(--radius-button)] bg-primary px-4 py-2 text-[13px] font-bold text-white hover:bg-primary-hover"
                onClick={() => {
                  setNewName('')
                  setNewDesc('')
                  setNewInc('实体入孵')
                  setNewMode('blank')
                  setCopyFromId(ct.currentHeads[0]?.id ?? '')
                  setImportName('')
                  setNewOpen(true)
                }}
              >
                ＋ 新建模板
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[960px] w-full border-collapse text-left text-[13px]">
            <thead className="border-b border-divider bg-page text-[12px] font-bold text-muted">
              <tr>
                <th className="px-3 py-2">模板名称</th>
                <th className="px-3 py-2">适用类型</th>
                <th className="px-3 py-2">版本</th>
                <th className="px-3 py-2">状态</th>
                <th className="px-3 py-2">最后修改</th>
                <th className="px-3 py-2 text-end">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {rows.map((t) => (
                <tr key={t.id}>
                  <td className="px-3 py-2.5 font-semibold text-foreground">{t.name}</td>
                  <td className="px-3 py-2.5 text-muted">{t.applicableType}</td>
                  <td className="px-3 py-2.5 font-mono text-[12px]">{t.version}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-bold',
                        t.status === '启用中' && 'bg-success/15 text-success',
                        t.status === '草稿' && 'bg-warning/10 text-warning',
                        t.status === '已停用' && 'text-muted',
                      )}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-muted">{t.lastModified}</td>
                  <td className="px-3 py-2.5 text-end">
                    {isOps ? (
                      <div className="flex flex-wrap justify-end gap-x-2 gap-y-1 text-[12px]">
                        <button type="button" className="font-semibold text-primary hover:underline" onClick={() => openEditor(t.id)}>
                          编辑
                        </button>
                        <button type="button" className="text-primary hover:underline" onClick={() => setPreviewOpen(t.id)}>
                          预览
                        </button>
                        {t.status === '启用中' ? (
                          <button type="button" className="text-muted hover:underline" onClick={() => ct.setStatus(t.id, '已停用')}>
                            停用
                          </button>
                        ) : (
                          <button type="button" className="text-success hover:underline" onClick={() => ct.setStatus(t.id, '启用中')}>
                            启用
                          </button>
                        )}
                        <button type="button" className="text-primary hover:underline" onClick={() => setVerOpen(t.lineageId)}>
                          版本
                        </button>
                        {t.status === '草稿' || t.status === '已停用' ? (
                          <button type="button" className="text-danger hover:underline" onClick={() => ct.deleteTemplate(t.id)}>
                            删除
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="text-muted hover:underline"
                          onClick={() => setImportTargetId(t.id)}
                        >
                          导入
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted">仅查看</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editor && editingId ? (
        <section className="rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-divider pb-3">
            <h2 className="text-[15px] font-bold">编辑模板：{editor.name}</h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="rounded-md border px-2 py-1 text-[12px] font-bold" onClick={() => toolbarWrap('**', '**')}>
                B
              </button>
              <button type="button" className="rounded-md border px-2 py-1 text-[12px] italic" onClick={() => toolbarWrap('_', '_')}>
                I
              </button>
              <button type="button" className="rounded-md border px-2 py-1 text-[12px]" onClick={() => toolbarWrap('<u>', '</u>')}>
                U
              </button>
              <button type="button" className="rounded-md border px-2 py-1 text-[12px]" onClick={() => toast.show('插入图片（演示占位）', 'info')}>
                图片
              </button>
              <button type="button" className="rounded-md border px-2 py-1 text-[12px]" onClick={() => setBodyDraft((b) => `${b}\n| 列1 | 列2 |\n| --- | --- |`)}>
                表格
              </button>
              <button type="button" className="rounded-md bg-primary-light px-3 py-1.5 text-[12px] font-semibold text-primary ring-1 ring-primary/25" onClick={() => setPreviewOpen(editingId)}>
                预览
              </button>
              <button type="button" className="rounded-md border px-3 py-1.5 text-[12px]" onClick={() => ct.importOverwrite(editingId, 're-import.docx', '【编辑器内再次导入】')}>
                导入覆盖
              </button>
              <button type="button" className="rounded-md bg-primary px-3 py-1.5 text-[12px] font-bold text-white" onClick={() => ct.saveContent(editingId, bodyDraft, user?.displayName ?? 'admin')}>
                保存
              </button>
              <button
                type="button"
                className="rounded-md border border-primary px-3 py-1.5 text-[12px] font-bold text-primary"
                onClick={() => {
                  const nid = ct.saveAsNewVersion(editingId, bodyDraft, user?.displayName ?? 'admin')
                  if (nid) setEditingId(nid)
                }}
              >
                保存为新版本
              </button>
              <button type="button" className="rounded-md border px-3 py-1.5 text-[12px]" onClick={() => setEditingId(null)}>
                关闭
              </button>
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
            <textarea
              className="min-h-[280px] w-full rounded-lg border border-divider px-4 py-3 font-mono text-[13px] leading-relaxed"
              value={bodyDraft}
              onChange={(e) => setBodyDraft(e.target.value)}
            />
            <div className="rounded-lg border border-divider bg-page p-3">
              <p className="text-[12px] font-bold text-foreground">变量面板</p>
              <p className="mt-1 text-[11px] text-muted">点击插入到光标末尾（演示）</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {CONTRACT_VARIABLE_KEYS.map((v) => (
                  <button key={v} type="button" className="rounded border border-divider bg-surface px-2 py-1 text-[11px] hover:border-primary/40" onClick={() => insertVar(v)}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <Modal
        open={newOpen}
        title="新建模板"
        onClose={() => setNewOpen(false)}
        panelClassName="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-md border px-4 py-2 text-[13px]" onClick={() => setNewOpen(false)}>
              取消
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-[13px] font-bold text-white"
              onClick={() => {
                if (!newName.trim()) {
                  toast.show('模板名称必填', 'warning')
                  return
                }
                if (newMode === 'import' && !importName.trim()) {
                  toast.show('请填写导入文件名', 'warning')
                  return
                }
                const nid = ct.createTemplate({
                  name: newName.trim(),
                  applicableType: newInc,
                  description: newDesc.trim() || undefined,
                  mode: newMode,
                  copyFromId: newMode === 'copy' ? copyFromId : undefined,
                  importFileName: newMode === 'import' ? importName.trim() : undefined,
                })
                setNewOpen(false)
                openEditor(nid)
              }}
            >
              确定
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-[13px]">
          <label className="text-muted">
            模板名称（必填）
            <input className="mt-1 w-full rounded-md border px-3 py-2" value={newName} onChange={(e) => setNewName(e.target.value)} />
          </label>
          <label className="text-muted">
            适用类型（入孵类型字典）
            <select className="mt-1 w-full rounded-md border bg-page px-3 py-2" value={newInc} onChange={(e) => setNewInc(e.target.value as IncubationType)}>
              {(['实体入孵', '虚拟入孵', '服务商认证', '联合孵化'] as const).map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          <label className="text-muted">
            描述（可选）
            <input className="mt-1 w-full rounded-md border px-3 py-2" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          </label>
          <div>
            <p className="mb-2 font-semibold">创建方式</p>
            <label className="flex items-center gap-2 py-1">
              <input type="radio" checked={newMode === 'blank'} onChange={() => setNewMode('blank')} />
              空白模板
            </label>
            <label className="flex items-center gap-2 py-1">
              <input type="radio" checked={newMode === 'copy'} onChange={() => setNewMode('copy')} />
              从现有模板复制
            </label>
            {newMode === 'copy' ? (
              <select className="mt-1 w-full rounded-md border bg-page px-3 py-2 text-[12px]" value={copyFromId} onChange={(e) => setCopyFromId(e.target.value)}>
                {ct.currentHeads.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}（{t.version}）
                  </option>
                ))}
              </select>
            ) : null}
            <label className="mt-2 flex items-center gap-2 py-1">
              <input type="radio" checked={newMode === 'import'} onChange={() => setNewMode('import')} />
              导入文件（.docx / .pdf）
            </label>
            {newMode === 'import' ? (
              <input className="mt-1 w-full rounded-md border px-3 py-2 text-[12px]" placeholder="文件名，如 template.docx" value={importName} onChange={(e) => setImportName(e.target.value)} />
            ) : null}
          </div>
        </div>
      </Modal>

      <Modal
        open={verOpen !== null}
        title={verOpen ? `版本历史 · ${ct.listVersions(verOpen)[0]?.name ?? ''}` : ''}
        onClose={() => setVerOpen(null)}
        panelClassName="max-w-lg"
        footer={<button className="rounded-md border px-4 py-2 text-[13px]" onClick={() => setVerOpen(null)}>关闭</button>}
      >
        {verOpen ? (
          <table className="w-full border-collapse text-[13px]">
            <thead className="border-b bg-page text-[12px] text-muted">
              <tr>
                <th className="py-2 text-start">版本</th>
                <th className="py-2 text-start">修改时间</th>
                <th className="py-2 text-start">修改人</th>
                <th className="py-2 text-start">状态</th>
                <th className="py-2 text-end">操作</th>
              </tr>
            </thead>
            <tbody>
              {ct.listVersions(verOpen).map((r) => (
                <tr key={r.id} className="border-b border-divider">
                  <td className="py-2 font-mono">{r.version}</td>
                  <td className="py-2 text-muted">{r.lastModified}</td>
                  <td className="py-2">{r.modifiedBy}</td>
                  <td className="py-2">{r.status}</td>
                  <td className="py-2 text-end">
                    <button type="button" className="text-primary hover:underline" onClick={() => setPreviewOpen(r.id)}>
                      预览
                    </button>
                    {!(r.isCurrent && r.status === '启用中') ? (
                      <button type="button" className="ms-2 text-primary hover:underline" onClick={() => ct.activateVersion(verOpen, r.id)}>
                        启用此版
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </Modal>

      <Modal
        open={previewOpen !== null}
        title="模板预览（假数据替换变量）"
        onClose={() => setPreviewOpen(null)}
        panelClassName="max-w-2xl"
        footer={
          <button type="button" className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white" onClick={() => setPreviewOpen(null)}>
            关闭
          </button>
        }
      >
        {previewOpen ? (
          <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-md border border-divider bg-page p-4 text-[13px] leading-relaxed">
            {previewWithFakeData(ct.getById(previewOpen)?.content ?? '')}
          </pre>
        ) : null}
      </Modal>

      <Modal
        open={importTargetId !== null}
        title="导入模板文件"
        onClose={() => setImportTargetId(null)}
        panelClassName="max-w-md"
        footer={
          <>
            <button type="button" className="rounded-md border px-4 py-2" onClick={() => setImportTargetId(null)}>
              取消
            </button>
            <label className="inline-flex cursor-pointer rounded-md bg-primary px-4 py-2 text-[13px] font-bold text-white">
              选择文件
              <input
                type="file"
                accept=".doc,.docx,.pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (!f || !importTargetId) return
                  const mb = f.size / (1024 * 1024)
                  if (mb > 10) {
                    toast.show('文件超过 10MB 限制', 'warning')
                    return
                  }
                  ct.importOverwrite(importTargetId, f.name, `【解析自 ${f.name} 的正文占位 · ${Math.round(mb * 100) / 100}MB】`)
                  setImportTargetId(null)
                }}
              />
            </label>
          </>
        }
      >
        <p className="text-[13px] text-muted">支持 .docx / .pdf，≤10MB，演示解析与病毒扫描占位。</p>
      </Modal>
    </div>
  )
}
