import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { useToast } from '../components/ToastProvider'
import type { IncubationType } from '../pages/basicData/basicDataTypes'
import type { HatchIncubationType } from '../pages/hatch/hatchTypes'

/** 与签约、列表展示一致 */
export type GlobalTemplateStatus = '启用中' | '草稿' | '已停用'

export type GlobalContractTemplate = {
  id: string
  lineageId: string
  name: string
  applicableType: IncubationType
  version: string
  status: GlobalTemplateStatus
  lastModified: string
  content: string
  description?: string
  modifiedBy: string
  /** 同一 lineage 仅一条为 true，供列表展示 */
  isCurrent: boolean
}

export function hatchTypeMatchesApplicable(h: HatchIncubationType, a: IncubationType): boolean {
  if (a === '联合孵化') return false
  if (h === '实体' && a === '实体入孵') return true
  if (h === '虚拟' && a === '虚拟入孵') return true
  if (h === '服务商' && a === '服务商认证') return true
  return false
}

function nextVersionLabel(v: string): string {
  const m = /^v(\d+)$/i.exec(v.trim())
  if (!m) return 'v2'
  const n = Number(m[1]) + 1
  return `v${n}`
}

const SEED: GlobalContractTemplate[] = [
  {
    id: 'tpl-1',
    lineageId: 'lin-entity',
    name: '实体入孵协议 v2',
    applicableType: '实体入孵',
    version: 'v2',
    status: '启用中',
    lastModified: '2025-04-01',
    modifiedBy: 'admin',
    isCurrent: true,
    description: '标准实体入孵主协议',
    content: `甲方：生物医药孵化运营平台
乙方：{{项目名称}}
统一社会信用代码：{{统一社会信用代码}}
一、孵化期限：自{{入孵开始日期}}至{{入孵结束日期}}。
二、空间位置：{{楼宇}}-{{楼层}}-{{房间号}}，面积{{面积}}平方米。
三、费用：租金{{租金}}元/月，物业费{{物业费}}元/月；AI 服务套餐：{{AI服务套餐}}。
（以下为正文条款占位，实际以法务审核为准。）`,
  },
  {
    id: 'tpl-1-v1',
    lineageId: 'lin-entity',
    name: '实体入孵协议 v1',
    applicableType: '实体入孵',
    version: 'v1',
    status: '已停用',
    lastModified: '2024-12-01',
    modifiedBy: 'lisi',
    isCurrent: false,
    content: '历史版本 v1 正文占位…',
  },
  {
    id: 'tpl-2',
    lineageId: 'lin-virtual',
    name: '虚拟入孵协议 v1',
    applicableType: '虚拟入孵',
    version: 'v1',
    status: '启用中',
    lastModified: '2025-03-15',
    modifiedBy: 'admin',
    isCurrent: true,
    content: '乙方：{{项目名称}} · 虚拟孵化服务条款…',
  },
  {
    id: 'tpl-3',
    lineageId: 'lin-svc',
    name: '服务商合作协议',
    applicableType: '服务商认证',
    version: 'v1',
    status: '草稿',
    lastModified: '2025-05-01',
    modifiedBy: 'admin',
    isCurrent: true,
    content: '服务商认证与结算条款… {{项目名称}}',
  },
  {
    id: 'tpl-4',
    lineageId: 'lin-lease',
    name: '租赁补充协议',
    applicableType: '实体入孵',
    version: 'v1',
    status: '已停用',
    lastModified: '2024-12-10',
    modifiedBy: 'admin',
    isCurrent: true,
    content: '租赁面积变更补充… {{面积}} {{租金}}',
  },
]

type Ctx = {
  /** 含历史版本；列表请用 currentHeads */
  templates: GlobalContractTemplate[]
  currentHeads: GlobalContractTemplate[]
  listVersions: (lineageId: string) => GlobalContractTemplate[]
  getById: (id: string) => GlobalContractTemplate | undefined
  /** 签约弹窗：启用中 + 类型匹配 */
  templatesForSigning: (hatchType: HatchIncubationType) => GlobalContractTemplate[]
  createTemplate: (p: {
    name: string
    applicableType: IncubationType
    description?: string
    mode: 'blank' | 'copy' | 'import'
    copyFromId?: string
    importFileName?: string
  }) => string
  updateTemplate: (id: string, patch: Partial<Pick<GlobalContractTemplate, 'name' | 'description' | 'content' | 'applicableType'>>) => void
  saveContent: (id: string, content: string, editor: string) => void
  saveAsNewVersion: (id: string, content: string, editor: string) => string
  setStatus: (id: string, status: GlobalTemplateStatus) => void
  deleteTemplate: (id: string) => boolean
  importOverwrite: (id: string, fileName: string, mockContent: string) => void
  activateVersion: (lineageId: string, versionId: string) => void
}

const Ctx = createContext<Ctx | null>(null)

export function ContractTemplatesProvider({ children }: { children: ReactNode }) {
  const toast = useToast()
  const [templates, setTemplates] = useState<GlobalContractTemplate[]>(() => structuredClone(SEED))

  const currentHeads = useMemo(() => templates.filter((t) => t.isCurrent), [templates])

  const listVersions = useCallback(
    (lineageId: string) =>
      [...templates.filter((t) => t.lineageId === lineageId)].sort((a, b) => {
        const na = Number(a.version.replace(/v/i, '')) || 0
        const nb = Number(b.version.replace(/v/i, '')) || 0
        return nb - na
      }),
    [templates],
  )

  const getById = useCallback((id: string) => templates.find((t) => t.id === id), [templates])

  const templatesForSigning = useCallback(
    (hatchType: HatchIncubationType) =>
      templates.filter((t) => t.isCurrent && t.status === '启用中' && hatchTypeMatchesApplicable(hatchType, t.applicableType)),
    [templates],
  )

  const createTemplate = useCallback(
    (p: {
      name: string
      applicableType: IncubationType
      description?: string
      mode: 'blank' | 'copy' | 'import'
      copyFromId?: string
      importFileName?: string
    }) => {
      const id = `tpl-${Date.now().toString(36)}`
      const lineageId = `lin-${Date.now().toString(36)}`
      setTemplates((prev) => {
        let content = '在此编辑合同正文，可使用右侧变量插入占位符。'
        if (p.mode === 'copy' && p.copyFromId) {
          const src = prev.find((t) => t.id === p.copyFromId)
          if (src) content = src.content
        }
        if (p.mode === 'import' && p.importFileName) {
          content = `【由文件「${p.importFileName}」解析导入的初稿 · 演示】\n\n${content}`
        }
        const row: GlobalContractTemplate = {
          id,
          lineageId,
          name: p.name.trim(),
          applicableType: p.applicableType,
          version: 'v1',
          status: '草稿',
          lastModified: new Date().toISOString().slice(0, 10),
          modifiedBy: 'admin',
          isCurrent: true,
          description: p.description,
          content,
        }
        return [...prev, row]
      })
      if (p.mode === 'import') toast.show('文件已解析（≤3s 演示）并完成病毒扫描占位', 'success')
      else if (p.mode === 'copy') toast.show('已从现有模板复制', 'success')
      else toast.show('模板已创建', 'success')
      return id
    },
    [toast],
  )

  const updateTemplate = useCallback((id: string, patch: Partial<Pick<GlobalContractTemplate, 'name' | 'description' | 'content' | 'applicableType'>>) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch, lastModified: new Date().toISOString().slice(0, 10) } : t)),
    )
  }, [])

  const saveContent = useCallback(
    (id: string, content: string, editor: string) => {
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, content, modifiedBy: editor, lastModified: new Date().toISOString().slice(0, 10) } : t)),
      )
      toast.show('已保存当前内容（未生成新版本）', 'success')
    },
    [toast],
  )

  const saveAsNewVersion = useCallback(
    (id: string, content: string, editor: string) => {
      const cur = templates.find((t) => t.id === id)
      if (!cur) return ''
      const newId = `tpl-${Date.now().toString(36)}`
      const nv = nextVersionLabel(cur.version)
      const next: GlobalContractTemplate = {
        ...cur,
        id: newId,
        version: nv,
        content,
        modifiedBy: editor,
        lastModified: new Date().toISOString().slice(0, 10),
        isCurrent: true,
        status: cur.status === '启用中' ? '启用中' : '草稿',
      }
      setTemplates((prev) =>
        prev
          .map((t) => {
            if (t.lineageId !== cur.lineageId) return t
            if (t.isCurrent) {
              return { ...t, isCurrent: false, status: t.status === '启用中' ? '已停用' : t.status }
            }
            return t
          })
          .concat(next),
      )
      toast.show(`已保存为新版本 ${nv}`, 'success')
      return newId
    },
    [templates, toast],
  )

  const setStatus = useCallback((id: string, status: GlobalTemplateStatus) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, status, lastModified: new Date().toISOString().slice(0, 10) } : t)))
  }, [])

  const deleteTemplate = useCallback(
    (id: string) => {
      const t = templates.find((x) => x.id === id)
      if (!t) return false
      if (t.status === '启用中') {
        toast.show('启用中的模板不可删除，请先停用', 'warning')
        return false
      }
      setTemplates((prev) => prev.filter((x) => x.id !== id))
      toast.show('已删除模板', 'success')
      return true
    },
    [templates, toast],
  )

  const importOverwrite = useCallback(
    (id: string, fileName: string, mockContent: string) => {
      if (fileName.toLowerCase().endsWith('.exe')) {
        toast.show('文件类型不允许', 'warning')
        return
      }
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                content: `${mockContent}\n\n（由 ${fileName} 导入覆盖，变量可继续调整）`,
                lastModified: new Date().toISOString().slice(0, 10),
              }
            : t,
        ),
      )
      toast.show('导入完成 · 已做病毒扫描占位 · ≤10MB', 'success')
    },
    [toast],
  )

  const activateVersion = useCallback(
    (lineageId: string, versionId: string) => {
      setTemplates((prev) =>
        prev.map((t) => {
          if (t.lineageId !== lineageId) return t
          if (t.id === versionId) return { ...t, isCurrent: true, status: '启用中' as const }
          return {
            ...t,
            isCurrent: false,
            status: t.isCurrent && t.status === '启用中' ? '已停用' : t.status,
          }
        }),
      )
      toast.show('已切换启用版本 · 原启用版本已停用', 'success')
    },
    [toast],
  )

  const value = useMemo(
    (): Ctx => ({
      templates,
      currentHeads,
      listVersions,
      getById,
      templatesForSigning,
      createTemplate,
      updateTemplate,
      saveContent,
      saveAsNewVersion,
      setStatus,
      deleteTemplate,
      importOverwrite,
      activateVersion,
    }),
    [
      templates,
      currentHeads,
      listVersions,
      getById,
      templatesForSigning,
      createTemplate,
      updateTemplate,
      saveContent,
      saveAsNewVersion,
      setStatus,
      deleteTemplate,
      importOverwrite,
      activateVersion,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useContractTemplates() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useContractTemplates 需在 ContractTemplatesProvider 内使用')
  return v
}
