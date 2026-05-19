import { useEffect, useMemo, useRef, useState } from 'react'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import { SysTableWrap } from './SystemPageChrome'

type FlowStatus = 'active' | 'inactive' | 'draft'

type FlowVersionRow = {
  ver: string
  createdAt: string
  publisher: string
  state: FlowStatus
}

type CanvasNodeType = 'start' | 'end' | 'approval' | 'gateway' | 'subprocess' | 'call' | 'reject' | 'resubmit'

/** 审批类节点扩展配置（存于画布节点） */
type ApprovalConfig = {
  signerType: 'user' | 'role' | 'dept_head' | 'leader' | 'starter'
  /** 指定角色时使用 */
  roleName: string
  /** 指定用户时使用（演示下拉） */
  assigneeUser: string
  signMode: 'all' | 'any' | 'seq'
  formPerms: { projectName: boolean; applicant: boolean; budget: boolean }
  timeoutD1: string
  timeoutAct1: 'remind'
  timeoutD2: string
  timeoutAct2: 'transfer' | 'agree' | 'reject'
  actions: { agree: boolean; reject: boolean; transfer: boolean; addSigner: boolean }
}

function defaultApproval(): ApprovalConfig {
  return {
    signerType: 'role',
    roleName: '部门主管',
    assigneeUser: 'zhangsan',
    signMode: 'all',
    formPerms: { projectName: true, applicant: true, budget: false },
    timeoutD1: '3',
    timeoutAct1: 'remind',
    timeoutD2: '5',
    timeoutAct2: 'transfer',
    actions: { agree: true, reject: true, transfer: true, addSigner: false },
  }
}

type CanvasNode = {
  id: string
  /** 流程引擎/BPMN 用稳定节点 ID（可编辑） */
  technicalId: string
  type: CanvasNodeType
  label: string
  description: string
  x: number
  y: number
  approval?: ApprovalConfig
}

type CanvasEdge = { id: string; from: string; to: string; label?: string }

const MOCK_ASSIGNEE_USERS = [
  { value: 'zhangsan', label: 'zhangsan · 张三' },
  { value: 'lisi', label: 'lisi · 李四' },
  { value: 'wangwu', label: 'wangwu · 王五' },
]

const NODE_W_APPROX = 140
const NODE_H_APPROX = 48

function getApproval(n: CanvasNode): ApprovalConfig {
  return { ...defaultApproval(), ...n.approval }
}

function sanitizeTechId(raw: string, fallback: string): string {
  const t = raw.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[0-9]/, '_$&')
  return (t.length ? t : fallback).slice(0, 48)
}

function defaultCanvas(): { nodes: CanvasNode[]; edges: CanvasEdge[] } {
  /** 自上而下主流 + 驳回环，坐标拉开避免重叠（示意：约 980×420 画布） */
  return {
    nodes: [
      { id: 'n1', technicalId: 'start_event', type: 'start', label: '开始', description: '', x: 72, y: 200, approval: undefined },
      { id: 'n2', technicalId: 'approve_dept', type: 'approval', label: '部门主管审批', description: '部门负责人对本阶段资料合规性审核', x: 298, y: 188, approval: defaultApproval() },
      { id: 'n3', technicalId: 'approve_ops', type: 'approval', label: '运营总监审批', description: '总监终审把关', x: 556, y: 188, approval: { ...defaultApproval(), roleName: '运营总监', signerType: 'role' } },
      { id: 'n4', technicalId: 'end_event', type: 'end', label: '结束', description: '', x: 800, y: 200 },
      { id: 'n5', technicalId: 'task_reject', type: 'reject', label: '驳回', description: '', x: 440, y: 352 },
      { id: 'n6', technicalId: 'task_resubmit', type: 'resubmit', label: '重新提交', description: '', x: 120, y: 352 },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2' },
      { id: 'e2', from: 'n2', to: 'n3' },
      { id: 'e3', from: 'n3', to: 'n4' },
      { id: 'e4', from: 'n2', to: 'n5', label: '驳回' },
      { id: 'e5', from: 'n5', to: 'n6' },
      { id: 'e6', from: 'n6', to: 'n2', label: '重新提交' },
    ],
  }
}

type FlowRow = {
  id: string
  name: string
  code: string
  category: string
  status: FlowStatus
  version: string
  updatedAt: string
  description: string
  versions: FlowVersionRow[]
  /** 设计器草稿（演示：与当前列表行绑定） */
  canvas: { nodes: CanvasNode[]; edges: CanvasEdge[] }
}

const CATEGORIES = ['全部', '审批类', '通知类', '变更类'] as const
const STATUS_FILTER = ['全部', '启用中', '停用', '草稿'] as const

const STATUS_LABEL: Record<FlowStatus, string> = {
  active: '启用中',
  inactive: '停用',
  draft: '草稿',
}


const TOOLBOX: { key: string; type: CanvasNodeType; label: string; hint: string }[] = [
  { key: 'start', type: 'start', label: '开始节点', hint: '流程入口' },
  { key: 'end', type: 'end', label: '结束节点', hint: '流程出口' },
  { key: 'approval', type: 'approval', label: '审批节点', hint: '人工审批' },
  { key: 'gateway-xor', type: 'gateway', label: '条件分支', hint: '排他/条件' },
  { key: 'gateway-par', type: 'gateway', label: '网关', hint: '并行或包容（演示）' },
  { key: 'subprocess', type: 'subprocess', label: '子流程', hint: '嵌套子流程' },
  { key: 'call', type: 'call', label: '调用活动', hint: '外部调用' },
]

/** 画布拖放 MIME（浏览器兼容：同时写 text/plain 备用解析） */
const FLOW_DND_KEY = 'application/pharma-flow-node'

const INITIAL_ROWS: FlowRow[] = [
  {
    id: '1',
    name: '项目注册审核流程',
    code: 'project_reg_audit',
    category: '审批类',
    status: 'active',
    version: 'v2',
    updatedAt: '2025-05-14 14:20',
    description: '科创策源项目注册后进入该审批流。',
    versions: [
      { ver: 'v2', createdAt: '2025-05-14 10:00', publisher: 'admin', state: 'active' },
      { ver: 'v1', createdAt: '2025-04-01 08:00', publisher: 'lisi', state: 'inactive' },
    ],
    canvas: defaultCanvas(),
  },
  {
    id: '2',
    name: '资源申请审批流程',
    code: 'resource_apply',
    category: '审批类',
    status: 'active',
    version: 'v1',
    updatedAt: '2025-05-12 09:41',
    description: '资源运营侧申请与发放审批。',
    versions: [{ ver: 'v1', createdAt: '2025-05-12 09:00', publisher: 'admin', state: 'active' }],
    canvas: defaultCanvas(),
  },
  {
    id: '3',
    name: '入孵决策审批流程',
    code: 'incubation_decide',
    category: '审批类',
    status: 'inactive',
    version: 'v2',
    updatedAt: '2025-03-01 08:00',
    description: '入孵决策会使用该流程。',
    versions: [
      { ver: 'v2', createdAt: '2025-03-01 07:55', publisher: 'admin', state: 'inactive' },
      { ver: 'v1', createdAt: '2025-01-15 09:00', publisher: 'lisi', state: 'inactive' },
    ],
    canvas: defaultCanvas(),
  },
  {
    id: '4',
    name: '空间扩租审批流程',
    code: 'space_expand',
    category: '审批类',
    status: 'active',
    version: 'v1',
    updatedAt: '2025-04-20 11:08',
    description: '物理空间扩租审批。',
    versions: [{ ver: 'v1', createdAt: '2025-04-20 10:30', publisher: 'admin', state: 'active' }],
    canvas: defaultCanvas(),
  },
  {
    id: '5',
    name: '项目变更审批流程',
    code: 'project_change',
    category: '变更类',
    status: 'draft',
    version: 'v1',
    updatedAt: '2025-05-10 16:02',
    description: '项目关键字段变更审批（草稿）。',
    versions: [{ ver: 'v1', createdAt: '2025-05-10 15:40', publisher: 'zhangsan', state: 'draft' }],
    canvas: defaultCanvas(),
  },
  {
    id: '6',
    name: '专家入驻通知流',
    code: 'expert_notify',
    category: '通知类',
    status: 'active',
    version: 'v1',
    updatedAt: '2025-04-02 09:15',
    description: '仅通知链路，不走人工节点。',
    versions: [{ ver: 'v1', createdAt: '2025-04-02 09:00', publisher: 'admin', state: 'active' }],
    canvas: { nodes: [{ id: 'n1', technicalId: 'start_event', type: 'start', label: '开始', description: '', x: 320, y: 220 }], edges: [] },
  },
  {
    id: '7',
    name: '租赁合同用印审批',
    code: 'contract_seal',
    category: '审批类',
    status: 'inactive',
    version: 'v1',
    updatedAt: '2025-02-11 13:00',
    description: '已停用，待法务二期改造。',
    versions: [{ ver: 'v1', createdAt: '2025-02-11 12:00', publisher: 'admin', state: 'inactive' }],
    canvas: defaultCanvas(),
  },
  {
    id: '8',
    name: '预算追加审批',
    code: 'budget_addon',
    category: '审批类',
    status: 'draft',
    version: 'v0',
    updatedAt: '2025-05-13 10:00',
    description: '尚未发布。',
    versions: [{ ver: 'v0', createdAt: '2025-05-13 10:00', publisher: 'admin', state: 'draft' }],
    canvas: defaultCanvas(),
  },
]

function statusBadgeClass(s: FlowStatus): string {
  if (s === 'active') return 'bg-success/12 text-success'
  if (s === 'inactive') return 'bg-muted/30 text-muted'
  return 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
}

function nextVersion(ver: string): string {
  const m = /^v(\d+)$/.exec(ver)
  if (m) return `v${Number(m[1]) + 1}`
  return 'v1'
}

function buildBpmnXml(flow: FlowRow): string {
  const safeId = (s: string) => s.replace(/[^a-zA-Z0-9_]/g, '_')
  const procId = `proc_${safeId(flow.code)}`
  let body = ''
  let flows = ''
  for (const n of flow.canvas.nodes) {
    const nid = safeId(n.technicalId || n.id)
    if (n.type === 'start') body += `    <startEvent id="${nid}" name="${escapeXml(n.label)}"/>\n`
    else if (n.type === 'end') body += `    <endEvent id="${nid}" name="${escapeXml(n.label)}"/>\n`
    else if (n.type === 'gateway') body += `    <exclusiveGateway id="${nid}" name="${escapeXml(n.label)}"/>\n`
    else body += `    <userTask id="${nid}" name="${escapeXml(n.label)}"/>\n`
  }
  for (const e of flow.canvas.edges) {
    const fid = safeId(e.id)
    const fromN = flow.canvas.nodes.find((n) => n.id === e.from)
    const toN = flow.canvas.nodes.find((n) => n.id === e.to)
    const sr = safeId(fromN?.technicalId || fromN?.id || e.from)
    const tr = safeId(toN?.technicalId || toN?.id || e.to)
    flows += `    <sequenceFlow id="${fid}" sourceRef="${sr}" targetRef="${tr}"${e.label ? ` name="${escapeXml(e.label)}"` : ''}/>\n`
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  id="Definitions_1" targetNamespace="http://pharma-platform.local/bpmn">
  <process id="${procId}" name="${escapeXml(flow.name)}" isExecutable="true">
${body}${flows}  </process>
</definitions>
`
}

function escapeXml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
}

function normalizeCanvas(canvas: FlowRow['canvas']): FlowRow['canvas'] {
  return {
    edges: [...canvas.edges],
    nodes: canvas.nodes.map((raw) => {
      const n = raw as CanvasNode
      const tid = (n.technicalId && n.technicalId.trim()) || sanitizeTechId(`${n.type}_${n.label}_${n.id}`, `node_${n.id}`)
      const approvalTypes: CanvasNodeType[] = ['approval', 'subprocess', 'call']
      const approval = approvalTypes.includes(n.type) ? { ...defaultApproval(), ...n.approval } : undefined
      return {
        ...n,
        technicalId: tid,
        description: typeof n.description === 'string' ? n.description : '',
        approval,
      }
    }),
  }
}

function nodeApproxSize(n: CanvasNode): { w: number; h: number } {
  if (n.type === 'gateway') return { w: 64, h: 64 }
  return { w: NODE_W_APPROX, h: NODE_H_APPROX }
}

function anchorOut(n: CanvasNode): { x: number; y: number } {
  const { w, h } = nodeApproxSize(n)
  return { x: n.x + w, y: n.y + h / 2 }
}

function anchorIn(n: CanvasNode): { x: number; y: number } {
  const { h } = nodeApproxSize(n)
  return { x: n.x, y: n.y + h / 2 }
}

function validateCanvasForPublish(canvas: FlowRow['canvas']): string | null {
  const { nodes } = canvas
  const starts = nodes.filter((n) => n.type === 'start')
  if (starts.length !== 1) return '画布须且仅能包含 1 个「开始」节点才能发布（当前：' + String(starts.length) + '）'
  const ends = nodes.filter((n) => n.type === 'end')
  if (ends.length === 0) return '画布至少须有 1 个「结束」节点才能发布'

  /** 校验 technicalId 在画布内唯一 */
  const idSet = new Set<string>()
  for (const n of nodes) {
    const tid = sanitizeTechId(n.technicalId, `fallback_${n.id}`)
    const key = tid.toLowerCase()
    if (idSet.has(key)) return `节点 ID「${tid}」重复，请在属性面板修改为唯一标识`
    idSet.add(key)
  }

  /** 校验审批节点配置完整（演示校验） */
  for (const n of nodes.filter((x) => x.type === 'approval' || x.type === 'subprocess' || x.type === 'call')) {
    const a = getApproval(n)
    if (a.signerType === 'role' && !(a.roleName ?? '').trim()) return `节点「${n.label}」未填写角色名称`
    if (a.signerType === 'user' && !a.assigneeUser) return `节点「${n.label}」未选择指派用户`
  }

  return null
}

function parseBpmnPreview(xml: string): string[] {
  const names: string[] = []
  const re = /(?:userTask|startEvent|endEvent|exclusiveGateway)[^>]*name="([^"]+)"/g
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) names.push(m[1])
  return names.length ? names : ['（未解析到节点名称，仍将作为草稿导入）']
}

export default function SystemWorkflowsPage() {
  const toast = useToast()
  const [mainTab, setMainTab] = useState<'defs' | 'instances'>('defs')
  const [rows, setRows] = useState<FlowRow[]>(INITIAL_ROWS)
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTER)[number]>('全部')
  const [categoryFilter, setCategoryFilter] = useState<(typeof CATEGORIES)[number]>('全部')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [newOpen, setNewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<FlowRow | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importPreview, setImportPreview] = useState<string[] | null>(null)
  const [importRaw, setImportRaw] = useState('')
  const [importCode, setImportCode] = useState('')
  const [versionOpen, setVersionOpen] = useState(false)
  const [versionFlow, setVersionFlow] = useState<FlowRow | null>(null)

  const [designOpen, setDesignOpen] = useState(false)
  const [designFlow, setDesignFlow] = useState<FlowRow | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [wireFromId, setWireFromId] = useState<string | null>(null)
  const [wireGhost, setWireGhost] = useState<{ x: number; y: number } | null>(null)
  const canvasBoardRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null)
  const designFlowIdRef = useRef<string | null>(null)

  /** 连线拖拽：鼠标释放时命中节点 id */
  const wireDropTargetRef = useRef<string | null>(null)

  const newForm = useRef({ name: '', code: '', category: '审批类' as string, description: '', templateId: '' })
  const editForm = useRef({ name: '', code: '', category: '', description: '' })
  const [newCodeErr, setNewCodeErr] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== '全部') {
        const map: Record<string, FlowStatus> = { 启用中: 'active', 停用: 'inactive', 草稿: 'draft' }
        if (r.status !== map[statusFilter]) return false
      }
      if (categoryFilter !== '全部' && r.category !== categoryFilter) return false
      const q = search.trim().toLowerCase()
      if (q && !`${r.name} ${r.code}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [rows, statusFilter, categoryFilter, search])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageSafe = Math.min(page, pageCount)
  const pageRows = filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize)

  useEffect(() => {
    setPage((p) => Math.min(p, pageCount))
  }, [pageCount])

  const openDesign = (r: FlowRow) => {
    const normalized = normalizeCanvas(JSON.parse(JSON.stringify(r.canvas)))
    setDesignFlow({ ...r, canvas: normalized })
    designFlowIdRef.current = r.id
    setSelectedNodeId(normalized.nodes.find((n) => n.type === 'approval')?.id ?? normalized.nodes[0]?.id ?? null)
    setWireFromId(null)
    setWireGhost(null)
    wireDropTargetRef.current = null
    setDesignOpen(true)
  }

  function closeDesign() {
    setDesignOpen(false)
    setDesignFlow(null)
    designFlowIdRef.current = null
    setWireFromId(null)
    setWireGhost(null)
    wireDropTargetRef.current = null
  }

  /** 与设计流 id 同步更新 rows */
  function patchFlowById(id: string, patch: Partial<FlowRow> | ((f: FlowRow) => FlowRow)) {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row
        return typeof patch === 'function' ? patch(row) : { ...row, ...patch }
      }),
    )
    setDesignFlow((cur) => {
      if (!cur || cur.id !== id) return cur
      return typeof patch === 'function' ? patch(cur) : { ...cur, ...patch }
    })
  }

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const d = dragRef.current
      const fid = designFlowIdRef.current
      if (!d || !fid) return
      const board = canvasBoardRef.current
      const br = board?.getBoundingClientRect()
      if (!br) return
      const SNAP = 20
      let nx = Math.round((e.clientX - br.left - d.dx) / SNAP) * SNAP
      let ny = Math.round((e.clientY - br.top - d.dy) / SNAP) * SNAP
      nx = Math.max(8, nx)
      ny = Math.max(8, ny)
      setRows((prev) =>
        prev.map((row) =>
          row.id !== fid
            ? row
            : {
                ...row,
                canvas: {
                  ...row.canvas,
                  nodes: row.canvas.nodes.map((n) => (n.id === d.id ? { ...n, x: nx, y: ny } : n)),
                },
              },
        ),
      )
      setDesignFlow((cur) => {
        if (!cur || cur.id !== fid) return cur
        return {
          ...cur,
          canvas: {
            ...cur.canvas,
            nodes: cur.canvas.nodes.map((n) => (n.id === d.id ? { ...n, x: nx, y: ny } : n)),
          },
        }
      })
    }
    function onUp() {
      dragRef.current = null
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  /** 拖拽连线预览 */
  useEffect(() => {
    if (!wireFromId) {
      setWireGhost(null)
      return
    }

    function mv(ev: MouseEvent) {
      const br = canvasBoardRef.current?.getBoundingClientRect()
      if (!br) return
      setWireGhost({ x: ev.clientX - br.left, y: ev.clientY - br.top })
    }
    function up() {
      const fromId = wireFromId
      const flowId = designFlowIdRef.current
      const toId = wireDropTargetRef.current
      if (!flowId || !fromId) {
        setWireFromId(null)
        setWireGhost(null)
        wireDropTargetRef.current = null
        return
      }
      if (toId && toId !== fromId) {
        patchFlowById(flowId, (flow) => {
          if (!flow.canvas.nodes.some((n) => n.id === fromId) || !flow.canvas.nodes.some((n) => n.id === toId)) return flow
          const dup = flow.canvas.edges.some((e) => e.from === fromId && e.to === toId)
          if (dup) {
            toast.show('这两点之间已存在连线', 'warning')
            return flow
          }
          const edgeId = `e_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`
          toast.show('已添加流转路径', 'success')
          return {
            ...flow,
            canvas: {
              ...flow.canvas,
              edges: [...flow.canvas.edges, { id: edgeId, from: fromId, to: toId }],
            },
          }
        })
      }
      setWireFromId(null)
      setWireGhost(null)
      wireDropTargetRef.current = null
    }

    window.addEventListener('mousemove', mv)
    window.addEventListener('mouseup', up, true)
    return () => {
      window.removeEventListener('mousemove', mv)
      window.removeEventListener('mouseup', up, true)
    }
  }, [wireFromId])

  function onWireStartMouseDown(e: React.MouseEvent, fromNodeId: string) {
    e.stopPropagation()
    e.preventDefault()
    if (!designFlow?.canvas.nodes.find((n) => n.id === fromNodeId)) return
    const br = canvasBoardRef.current?.getBoundingClientRect()
    setWireGhost(br ? { x: e.clientX - br.left, y: e.clientY - br.top } : null)
    setWireFromId(fromNodeId)
  }

  function onCanvasNodeBodyDown(e: React.MouseEvent, nodeId: string) {
    if (!designFlow || wireFromId) return
    e.stopPropagation()
    setSelectedNodeId(nodeId)
    const node = designFlow.canvas.nodes.find((n) => n.id === nodeId)
    if (!node || !canvasBoardRef.current) return
    const br = canvasBoardRef.current.getBoundingClientRect()
    const mx = e.clientX - br.left
    const my = e.clientY - br.top
    dragRef.current = { id: nodeId, dx: mx - node.x, dy: my - node.y }
  }

  function toolboxFallbackLabel(type: CanvasNodeType) {
    return TOOLBOX.find((x) => x.type === type)?.label ?? '节点'
  }

  /** 单击工具箱：添加到画布视图中心附近 */
  function addToolboxClicked(t: CanvasNodeType, labelHint?: string) {
    const board = canvasBoardRef.current
    const rect = board?.getBoundingClientRect()
    const lx = rect ? Math.round(rect.width * 0.4) : 200
    const ly = rect ? Math.round(rect.height * 0.42) : 220
    spawnNodeAt(t, lx, ly, labelHint ?? toolboxFallbackLabel(t))
  }

  function dropPayloadToType(raw: string | null): { type: CanvasNodeType; label?: string } | null {
    try {
      if (!raw) return null
      const o = JSON.parse(raw) as { type?: CanvasNodeType; label?: string }
      if (!o.type) return null
      return { type: o.type, label: o.label }
    } catch {
      return null
    }
  }

  function spawnNodeAt(type: CanvasNodeType, lx: number, ly: number, displayLabel?: string) {
    if (!designFlow) return
    if (type === 'start' && designFlow.canvas.nodes.some((n) => n.type === 'start')) {
      toast.show('画布只能有 1 个「开始」节点', 'warning')
      return
    }
    const flowId = designFlow.id
    const label = (displayLabel?.trim() || toolboxFallbackLabel(type)).slice(0, 40)
    const SNAP = 20
    const x = Math.max(12, Math.round(lx / SNAP) * SNAP)
    const y = Math.max(12, Math.round(ly / SNAP) * SNAP)
    const nid = `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`

    patchFlowById(flowId, (f) => {
      const techBase = sanitizeTechId(`${type}_${label}_${nid.slice(-4)}`, `node_${nid}`)
      const needsApp = (['approval', 'subprocess', 'call'] as CanvasNodeType[]).includes(type)
      const node: CanvasNode = {
        id: nid,
        technicalId: techBase,
        type,
        label,
        description: '',
        x,
        y,
        approval: needsApp ? defaultApproval() : undefined,
      }
      return { ...f, canvas: { nodes: [...f.canvas.nodes, node], edges: f.canvas.edges } }
    })
    toast.show(`已添加「${label}」`, 'success')
    setSelectedNodeId(nid)
  }

  /** 拖拽释放到画布创建节点 */
  function handleCanvasBoardDrop(ev: React.DragEvent<HTMLDivElement>) {
    ev.preventDefault()
    const parsed = dropPayloadToType(ev.dataTransfer.getData(FLOW_DND_KEY)) ?? dropPayloadToType(ev.dataTransfer.getData('text/plain'))
    if (!parsed || !canvasBoardRef.current) return
    const br = canvasBoardRef.current.getBoundingClientRect()
    const lx = ev.clientX - br.left
    const ly = ev.clientY - br.top
    spawnNodeAt(parsed.type, lx, ly, parsed.label ?? toolboxFallbackLabel(parsed.type))
  }

  function deleteSelectedNode() {
    if (!designFlow || !selectedNodeId) return
    const node = designFlow.canvas.nodes.find((n) => n.id === selectedNodeId)
    if (node?.type === 'start') {
      toast.show('开始节点不可删除', 'warning')
      return
    }
    if (selectedNodeId === wireFromId) {
      setWireFromId(null)
      setWireGhost(null)
    }
    patchFlowById(designFlow.id, (f) => ({
      ...f,
      canvas: {
        nodes: f.canvas.nodes.filter((n) => n.id !== selectedNodeId),
        edges: f.canvas.edges.filter((e) => e.from !== selectedNodeId && e.to !== selectedNodeId),
      },
    }))
    setSelectedNodeId(null)
  }

  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if (!designOpen || ev.key !== 'Delete' && ev.key !== 'Backspace') return
      const t = ev.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return
      ev.preventDefault()
      deleteSelectedNode()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [designOpen, designFlow, selectedNodeId])

  function validateCode(code: string, excludeId?: string) {
    if (!/^[a-z][a-z0-9_]*$/.test(code)) return '流程标识须为小写字母开头的英文小写+下划线'
    if (rows.some((r) => r.code === code && r.id !== excludeId)) return '标识已存在，请更换'
    return ''
  }

  function confirmNewFlow() {
    const f = newForm.current
    const err = validateCode(f.code.trim())
    setNewCodeErr(err)
    if (!f.name.trim()) {
      toast.show('请填写流程名称', 'warning')
      return
    }
    if (err) return
    let canvas = defaultCanvas()
    if (f.templateId) {
      const tpl = rows.find((r) => r.id === f.templateId)
      if (tpl) canvas = JSON.parse(JSON.stringify(tpl.canvas))
    }
    const id = String(Date.now())
    const row: FlowRow = {
      id,
      name: f.name.trim(),
      code: f.code.trim(),
      category: f.category,
      status: 'draft',
      version: 'v1',
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      description: f.description.trim(),
      versions: [{ ver: 'v1', createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '), publisher: '当前用户', state: 'draft' }],
      canvas,
    }
    setRows((prev) => [row, ...prev])
    setNewOpen(false)
    toast.show('已创建草稿，可进入设计器完善节点', 'success')
    openDesign(row)
  }

  function saveEditBasic() {
    if (!editTarget) return
    const f = editForm.current
    const err = validateCode(f.code.trim(), editTarget.id)
    setNewCodeErr(err)
    if (!f.name.trim()) {
      toast.show('请填写流程名称', 'warning')
      return
    }
    if (err) return
    setRows((prev) =>
      prev.map((r) =>
        r.id === editTarget.id
          ? { ...r, name: f.name.trim(), code: f.code.trim(), category: f.category, description: f.description.trim(), updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') }
          : r,
      ),
    )
    setEditOpen(false)
    setEditTarget(null)
    toast.show('基本信息已更新（未改变节点配置）', 'success')
  }

  function deleteFlow(r: FlowRow) {
    if (r.status !== 'draft') {
      toast.show('仅草稿可删除；已启用/停用流程请先归档或降级为草稿', 'warning')
      return
    }
    if (!window.confirm(`确定删除流程【${r.name}】吗？删除后不可恢复。`)) return
    setRows((prev) => prev.filter((x) => x.id !== r.id))
    toast.show('已删除草稿流程', 'warning')
  }

  function exportBpmn(r: FlowRow) {
    const xml = buildBpmnXml(r)
    const blob = new Blob([xml], { type: 'application/xml' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${r.code}.bpmn`
    a.click()
    URL.revokeObjectURL(a.href)
    toast.show('已下载 BPMN 2.0 文件（演示导出）', 'success')
  }

  function applyImport(overwriteId?: string) {
    if (!importRaw.trim()) return
    const code = importCode.trim() || `imported_${Date.now()}`
    const err = validateCode(code, overwriteId)
    if (err && !overwriteId) {
      const exist = rows.find((r) => r.code === code)
      if (exist) {
        if (!window.confirm(`流程标识「${code}」已存在，是否覆盖该流程的草稿画布？`)) return
        patchFlowById(exist.id, {
          canvas: {
            nodes: INITIAL_ROWS[0].canvas.nodes,
            edges: INITIAL_ROWS[0].canvas.edges,
          },
          updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        })
        toast.show('已用导入结构覆盖画布（演示）', 'success')
        setImportOpen(false)
        setImportPreview(null)
        setImportRaw('')
        return
      }
      setNewCodeErr(err)
      return
    }
    const id = String(Date.now())
    const previewNames = parseBpmnPreview(importRaw)
    const row: FlowRow = {
      id,
      name: previewNames[0] ? `导入·${previewNames[0]}` : '导入流程',
      code,
      category: '审批类',
      status: 'draft',
      version: 'v1',
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      description: '由 BPMN 导入生成（演示）',
      versions: [{ ver: 'v1', createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '), publisher: 'import', state: 'draft' }],
      canvas: defaultCanvas(),
    }
    setRows((prev) => [row, ...prev])
    setImportOpen(false)
    setImportPreview(null)
    setImportRaw('')
    toast.show(`已导入草稿，解析到节点：${previewNames.slice(0, 5).join('、')}`, 'success')
  }

  function publishDesign() {
    if (!designFlow) return
    const err = validateCanvasForPublish(normalizeCanvas(designFlow.canvas))
    if (err) {
      toast.show(err, 'warning')
      return
    }
    const id = designFlow.id
    const snapshot = designFlow.canvas
    let publishedVer = ''
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const nv = nextVersion(r.version)
        publishedVer = nv
        const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
        const newVers: FlowVersionRow[] = r.versions.map((v) => ({ ...v, state: v.state === 'active' ? 'inactive' : v.state }))
        newVers.unshift({ ver: nv, createdAt: now, publisher: '当前用户', state: 'active' })
        return {
          ...r,
          version: nv,
          status: 'active',
          updatedAt: now,
          versions: newVers,
          canvas: snapshot,
        }
      }),
    )
    toast.show(`已发布 ${publishedVer}，原有启用版本已自动停用（演示）`, 'success')
    closeDesign()
  }

  function saveDesignDraft() {
    if (!designFlow) return
    patchFlowById(designFlow.id, { canvas: designFlow.canvas, updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') })
    toast.show('草稿已保存，不影响运行中实例（演示）', 'info')
  }

  function activateVersion(flowId: string, ver: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== flowId) return r
        const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
        const versions = r.versions.map((v) => ({
          ...v,
          state: v.ver === ver ? ('active' as FlowStatus) : v.state === 'draft' ? v.state : ('inactive' as FlowStatus),
        }))
        return {
          ...r,
          version: ver,
          status: 'active',
          versions,
          updatedAt: now,
        }
      }),
    )
    toast.show(`已启用 ${ver}，原启用版本已停用`, 'success')
  }

  function demoteVersion(flowId: string, ver: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== flowId) return r
        const versions = r.versions.map((v) => (v.ver === ver ? { ...v, state: 'draft' as FlowStatus } : v))
        const demotedActiveRow = r.version === ver && r.status === 'active'
        return { ...r, versions, status: demotedActiveRow ? 'draft' : r.status }
      }),
    )
    toast.show(`${ver} 已降为草稿`, 'info')
  }

  const selectedNode = designFlow?.canvas.nodes.find((n) => n.id === selectedNodeId)

  function updateCanvasNode(nodeId: string, mapFn: (n: CanvasNode) => CanvasNode) {
    if (!designFlow) return
    patchFlowById(designFlow.id, (f) => ({
      ...f,
      canvas: { ...f.canvas, nodes: f.canvas.nodes.map((n) => (n.id === nodeId ? mapFn(n) : n)) },
    }))
  }

  /** 画布连线 + 拖拽连线预览 */
  const connectorSvg =
    designFlow ? (
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible select-none" aria-hidden>
        {designFlow.canvas.edges.map((e) => {
          const a = designFlow.canvas.nodes.find((x) => x.id === e.from)
          const b = designFlow.canvas.nodes.find((x) => x.id === e.to)
          if (!a || !b) return null
          const p0 = anchorOut(a)
          const p1 = anchorIn(b)
          const spread = Math.min(220, Math.max(96, Math.abs(p1.x - p0.x) * 0.5))
          const c1x = p0.x + spread
          const c2x = p1.x - spread
          return (
            <g key={e.id}>
              <path
                d={`M ${p0.x} ${p0.y} C ${c1x} ${p0.y}, ${c2x} ${p1.y}, ${p1.x} ${p1.y}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeDasharray="7 6"
                strokeOpacity={0.55}
                className="text-primary"
              />
              {e.label ? (
                <text x={(p0.x + p1.x) / 2} y={(p0.y + p1.y) / 2 - 8} textAnchor="middle" className="text-[11px]" fill="currentColor" style={{ opacity: 0.5 }}>
                  {e.label}
                </text>
              ) : null}
            </g>
          )
        })}
        {(() => {
          if (!wireFromId || !wireGhost) return null
          const fn = designFlow.canvas.nodes.find((x) => x.id === wireFromId)
          if (!fn) return null
          const o = anchorOut(fn)
          const gx = wireGhost.x
          const gy = wireGhost.y
          return (
            <path
              d={`M ${o.x} ${o.y} L ${gx} ${gy}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeDasharray="4 4"
              strokeOpacity={0.9}
              className="text-primary"
            />
          )
        })()}
      </svg>
    ) : null

  return (
    <>
      <div className="mb-5 rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider pb-3">
          <h2 className="text-[17px] font-bold text-foreground">流程配置</h2>
        </div>
        <div className="mt-4 flex gap-1 rounded-[var(--radius-card)] border border-divider bg-page p-1">
          <button
            type="button"
            onClick={() => setMainTab('defs')}
            className={cn('flex-1 rounded-[var(--radius-button)] px-4 py-2 text-[13px] font-semibold transition-colors', mainTab === 'defs' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-foreground')}
          >
            流程定义
          </button>
          <button
            type="button"
            onClick={() => setMainTab('instances')}
            className={cn('flex-1 rounded-[var(--radius-button)] px-4 py-2 text-[13px] font-semibold transition-colors', mainTab === 'instances' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-foreground')}
          >
            流程实例监控（V2）
          </button>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          可视化设计器、版本发布、BPMN 导入导出（演示）；实例监控支撑催办、转办与中止占位。
        </p>
      </div>

      {mainTab === 'defs' ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-panel)] border border-divider bg-surface px-4 py-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-[var(--radius-button)] bg-primary px-4 py-2 text-[12px] font-semibold text-white hover:bg-primary-hover"
                onClick={() => {
                  newForm.current = { name: '', code: '', category: '审批类', description: '', templateId: '' }
                  setNewCodeErr('')
                  setNewOpen(true)
                }}
              >
                + 新建流程
              </button>
              <button type="button" className="rounded-[var(--radius-button)] border border-divider px-3 py-2 text-[12px] font-semibold hover:bg-page" onClick={() => setImportOpen(true)}>
                导入流程
              </button>
              <button type="button" className="rounded-[var(--radius-button)] border border-divider px-3 py-2 text-[12px] font-semibold hover:bg-page" onClick={() => toast.show('列表已刷新', 'info')}>
                刷新
              </button>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-end gap-3 rounded-[var(--radius-panel)] border border-divider bg-surface px-4 py-3 text-[13px]">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted">状态</span>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as (typeof STATUS_FILTER)[number]); setPage(1) }} className="rounded border border-divider px-2 py-1.5">
                {STATUS_FILTER.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted">分类</span>
              <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value as (typeof CATEGORIES)[number]); setPage(1) }} className="rounded border border-divider px-2 py-1.5">
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="flex min-w-[200px] flex-1 flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted">搜索流程名称 / 标识</span>
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="🔍 project_reg_audit" className="rounded border border-divider px-3 py-1.5" />
            </label>
          </div>

          <SysTableWrap>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-[13px]">
                <thead className="border-b border-divider bg-page text-[11px] font-semibold uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3">流程名称</th>
                    <th className="px-4 py-3 font-sans normal-case">流程标识</th>
                    <th className="px-4 py-3">版本</th>
                    <th className="px-4 py-3">状态</th>
                    <th className="px-4 py-3">修改时间</th>
                    <th className="px-4 py-3 text-end">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {pageRows.map((r) => (
                    <tr key={r.id} className="hover:bg-page/70">
                      <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                      <td className="px-4 py-3 font-mono text-[12px] text-muted">{r.code}</td>
                      <td className="px-4 py-3 tabular-nums text-foreground">{r.version}</td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-semibold', statusBadgeClass(r.status))}>{STATUS_LABEL[r.status]}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{r.updatedAt}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-end">
                        <button type="button" className="me-2 text-[12px] font-semibold text-primary hover:underline" onClick={() => openDesign(rows.find((x) => x.id === r.id)!)}>
                          设计
                        </button>
                        <button
                          type="button"
                          className="me-2 text-[12px] font-semibold text-foreground hover:underline"
                          onClick={() => {
                            setEditTarget(rows.find((x) => x.id === r.id)!)
                            editForm.current = { name: r.name, code: r.code, category: r.category, description: r.description }
                            setNewCodeErr('')
                            setEditOpen(true)
                          }}
                        >
                          编辑
                        </button>
                        <button type="button" className="me-2 text-[12px] font-semibold text-danger hover:underline" onClick={() => deleteFlow(r)}>
                          删除
                        </button>
                        <button type="button" className="me-2 text-[12px] font-semibold text-foreground hover:underline" onClick={() => { setVersionFlow(rows.find((x) => x.id === r.id)!); setVersionOpen(true) }}>
                          版本
                        </button>
                        <button type="button" className="text-[12px] font-semibold text-foreground hover:underline" onClick={() => exportBpmn(rows.find((x) => x.id === r.id)!)}>
                          导出
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-divider px-4 py-2 text-[12px] text-muted">
              <span>共 {filtered.length} 条</span>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" disabled={pageSafe <= 1} className="rounded border border-divider px-2 py-0.5 disabled:opacity-40" onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  &lt;
                </button>
                <span>
                  {pageSafe} / {pageCount}
                </span>
                <button type="button" disabled={pageSafe >= pageCount} className="rounded border border-divider px-2 py-0.5 disabled:opacity-40" onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
                  &gt;
                </button>
                <label className="ms-2 flex items-center gap-1">
                  每页
                  <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }} className="rounded border border-divider px-1 py-0.5">
                    {[10, 20, 50, 100].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                  条
                </label>
              </div>
            </div>
          </SysTableWrap>
        </>
      ) : (
        <InstanceMonitorPanel toast={toast} />
      )}

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="新建流程" footer={<><button type="button" className="rounded-[var(--radius-button)] border border-divider px-5 py-2 text-[13px]" onClick={() => setNewOpen(false)}>取消</button><button type="button" className="rounded-[var(--radius-button)] bg-primary px-6 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover" onClick={confirmNewFlow}>确定</button></>}>
        <div className="space-y-3 text-[13px]">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-muted">流程名称（必填）</span>
            <input className="rounded border border-divider px-3 py-2" onChange={(e) => { newForm.current.name = e.target.value }} placeholder="如：租赁合同用印审批" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-muted">流程标识（必填，英文小写+下划线）</span>
            <input className={cn('rounded border px-3 py-2', newCodeErr ? 'border-danger' : 'border-divider')} onChange={(e) => { newForm.current.code = e.target.value; setNewCodeErr('') }} placeholder="lease_seal_flow" />
            {newCodeErr ? <span className="text-[11px] text-danger">{newCodeErr}</span> : null}
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-muted">流程分类</span>
            <select className="rounded border border-divider px-3 py-2" defaultValue="审批类" onChange={(e) => { newForm.current.category = e.target.value }}>
              <option>审批类</option>
              <option>通知类</option>
              <option>变更类</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-muted">描述</span>
            <textarea className="min-h-[72px] rounded border border-divider px-3 py-2" onChange={(e) => { newForm.current.description = e.target.value }} placeholder="补充业务说明..." />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-muted">从模板创建（可选）</span>
            <select className="rounded border border-divider px-3 py-2" defaultValue="" onChange={(e) => { newForm.current.templateId = e.target.value }}>
              <option value="">空白画布</option>
              {rows.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}（{r.code}）
                </option>
              ))}
            </select>
          </label>
        </div>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="编辑流程基本信息" footer={<><button type="button" className="rounded-[var(--radius-button)] border border-divider px-5 py-2 text-[13px]" onClick={() => setEditOpen(false)}>取消</button><button type="button" className="rounded-[var(--radius-button)] bg-primary px-6 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover" onClick={saveEditBasic}>保存</button></>}>
        {editTarget ? (
          <div className="space-y-3 text-[13px]">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted">流程名称</span>
              <input key={editTarget.id} defaultValue={editTarget.name} className="rounded border border-divider px-3 py-2" onChange={(e) => { editForm.current.name = e.target.value }} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted">流程标识</span>
              <input defaultValue={editTarget.code} className={cn('rounded border px-3 py-2', newCodeErr ? 'border-danger' : 'border-divider')} onChange={(e) => { editForm.current.code = e.target.value; setNewCodeErr('') }} />
              {newCodeErr ? <span className="text-[11px] text-danger">{newCodeErr}</span> : null}
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted">流程分类</span>
              <select defaultValue={editTarget.category} className="rounded border border-divider px-3 py-2" onChange={(e) => { editForm.current.category = e.target.value }}>
                <option>审批类</option>
                <option>通知类</option>
                <option>变更类</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted">描述</span>
              <textarea defaultValue={editTarget.description} className="min-h-[72px] rounded border border-divider px-3 py-2" onChange={(e) => { editForm.current.description = e.target.value }} />
            </label>
            <p className="text-[11px] text-muted">修改基本信息不涉及画布节点；节点请在「设计」中调整。</p>
          </div>
        ) : null}
      </Modal>

      <Modal open={importOpen} onClose={() => { setImportOpen(false); setImportPreview(null); setImportRaw('') }} title="导入 BPMN 流程" footer={<><button type="button" className="rounded-[var(--radius-button)] border border-divider px-5 py-2 text-[13px]" onClick={() => { setImportOpen(false); setImportPreview(null); setImportRaw('') }}>取消</button><button type="button" disabled={!importPreview} className="rounded-[var(--radius-button)] bg-primary px-6 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover disabled:opacity-40" onClick={() => applyImport()}>确认导入</button></>}>
        <div className="space-y-3 text-[13px]">
          <input ref={fileInputRef} type="file" accept=".bpmn,.xml" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0]
            if (!f) return
            const r = new FileReader()
            r.onload = () => {
              const text = String(r.result ?? '')
              setImportRaw(text)
              setImportPreview(parseBpmnPreview(text))
            }
            r.readAsText(f)
          }} />
          <button type="button" className="rounded border border-divider px-3 py-2 text-[12px] font-semibold hover:bg-page" onClick={() => fileInputRef.current?.click()}>
            选择 .bpmn / .xml 文件
          </button>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-muted">新流程标识（若文件内已存在则提示覆盖）</span>
            <input value={importCode} onChange={(e) => setImportCode(e.target.value)} className="rounded border border-divider px-3 py-2" placeholder="留空则自动生成 imported_xxx" />
          </label>
          {importPreview ? (
            <div className="rounded border border-divider bg-page/60 p-3">
              <p className="mb-2 text-[12px] font-semibold text-foreground">解析预览 · 节点名称</p>
              <ul className="list-inside list-disc text-[12px] text-muted">{importPreview.map((n, i) => <li key={i}>{n}</li>)}</ul>
              <details className="mt-2 text-[11px] text-muted"><summary className="cursor-pointer">原始片段</summary><pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap font-mono text-[10px]">{importRaw.slice(0, 800)}</pre></details>
            </div>
          ) : (
            <p className="text-[12px] text-muted">上传后将校验并预览结构，确认后生成草稿流程。</p>
          )}
        </div>
      </Modal>

      <Modal open={versionOpen} onClose={() => setVersionOpen(false)} title={versionFlow ? `版本管理：${versionFlow.name}` : ''} panelClassName="max-w-2xl" footer={<button type="button" className="rounded-[var(--radius-button)] border border-divider px-5 py-2 text-[13px]" onClick={() => setVersionOpen(false)}>关闭</button>}>
        {versionFlow ? (
          <div className="space-y-3 text-[13px]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="border-b border-divider text-muted"><tr><th className="py-2">版本</th><th className="py-2">创建时间</th><th className="py-2">发布人</th><th className="py-2">状态</th><th className="py-2 text-end">操作</th></tr></thead>
                <tbody className="divide-y divide-divider">
                  {versionFlow.versions.map((v) => (
                    <tr key={v.ver}>
                      <td className="py-2 font-mono">{v.ver}</td>
                      <td className="py-2 text-muted">{v.createdAt}</td>
                      <td className="py-2">{v.publisher}</td>
                      <td className="py-2">{STATUS_LABEL[v.state]}</td>
                      <td className="py-2 text-end whitespace-nowrap">
                        {v.state !== 'active' && v.state !== 'draft' ? (
                          <button type="button" className="me-2 text-primary hover:underline" onClick={() => activateVersion(versionFlow.id, v.ver)}>启用此版</button>
                        ) : null}
                        {v.state === 'active' ? (
                          <button type="button" className="me-2 text-muted hover:underline" onClick={() => demoteVersion(versionFlow.id, v.ver)}>设为草稿</button>
                        ) : null}
                        <button type="button" className="text-foreground hover:underline" onClick={() => toast.show(`预览 ${v.ver} 设计图（演示）`, 'info')}>查看设计</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] leading-relaxed text-muted">每次发布生成新版本，旧版本自动停用。手动启用任一历史版本时，原启用版本会自动停用。</p>
          </div>
        ) : null}
      </Modal>

      <Modal
        fillHeight
        open={designOpen}
        onClose={closeDesign}
        title={`流程设计器：${designFlow?.name ?? ''}`}
        panelClassName="w-[calc(100vw-16px)] max-w-none sm:max-w-[min(98vw,1600px)]"
        footer={
          <>
            <button type="button" className="rounded-[var(--radius-button)] border border-divider px-6 py-2.5 text-[13px]" onClick={closeDesign}>
              关闭
            </button>
            <button type="button" className="rounded-[var(--radius-button)] border border-divider px-6 py-2.5 text-[13px]" onClick={saveDesignDraft}>
              保存
            </button>
            <button type="button" className="rounded-[var(--radius-button)] bg-primary px-8 py-2.5 text-[13px] font-semibold text-white hover:bg-primary-hover" onClick={publishDesign}>
              发布
            </button>
          </>
        }
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="rounded-[var(--radius-card)] border border-divider bg-page/40 px-4 py-3 text-[13px] leading-relaxed text-muted">
            <strong className="font-semibold text-foreground">操作说明：</strong>
            从左侧<strong className="text-foreground">按住组件拖到画布释放</strong>即可创建节点；拖动节点<strong className="text-foreground">右侧蓝色圆点</strong>
            拉出连线至目标节点的<strong className="text-foreground">左侧绿点（或松开在节点上方）</strong>生成路径；拖拽节点本体调整坐标（自动吸附 20px 网格）。
            <kbd className="mx-1 rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] shadow-sm">Del</kbd>
            删除选中（开始节点受保护）。
          </div>

          <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden rounded-[var(--radius-panel)] border border-divider bg-surface shadow-inner">
            <div className="flex h-[min(520px,calc(100dvh-260px))] w-full min-w-[1080px]">
            {/* 左侧工具箱 — 固定宽，不参与挤压中间列 */}
            <aside className="flex w-[220px] shrink-0 flex-col overflow-hidden border-r border-divider bg-page/50">
              <div className="border-b border-divider bg-surface px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">组件库</p>
                <p className="mt-1 text-[13px] font-bold text-foreground">工具箱</p>
                <p className="mt-0.5 text-[12px] leading-snug text-muted">拖入画布或点此快速居中创建</p>
              </div>
              <ul className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
                {TOOLBOX.map((t) => (
                  <li key={t.key}>
                    <button
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        const payload = JSON.stringify({ type: t.type, label: t.label })
                        e.dataTransfer.setData(FLOW_DND_KEY, payload)
                        e.dataTransfer.setData('text/plain', payload)
                        e.dataTransfer.effectAllowed = 'copy'
                      }}
                      onClick={() => addToolboxClicked(t.type, t.label)}
                      className="flex w-full flex-col items-start rounded-[var(--radius-card)] border border-divider bg-surface px-4 py-3 text-left shadow-sm transition-colors hover:border-primary/50 hover:bg-primary/[0.06]"
                    >
                      <span className="text-[13px] font-semibold text-foreground">{t.label}</span>
                      <span className="mt-1 text-[12px] leading-snug text-muted">{t.hint}</span>
                      <span className="mt-2 text-[11px] text-primary/80">⟵ 可拖至画布</span>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            {/* 中间画布 — 禁止被压成细条：显式 min-width + flex-1 */}
            <div className="relative flex min-h-0 min-w-[480px] flex-1 basis-0 flex-col bg-[color-mix(in_oklab,var(--foreground)_4%,var(--surface))]">
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-divider bg-surface/95 px-4 py-3 sm:px-5 backdrop-blur-sm">
                <div className="min-w-0">
                  <span className="block text-[13px] font-semibold leading-snug text-foreground sm:text-[14px]">画布 · 可视化流程</span>
                  <span className="mt-1 block text-[12px] leading-snug text-muted">在此绘制节点与连线，支持横向滚动查看全图</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
                  <span className="rounded-full border border-divider bg-page px-3 py-1 font-mono tabular-nums">网格 20px</span>
                  <span className="rounded-full border border-divider bg-page px-3 py-1">演示缩放 100%</span>
                </div>
              </div>

              <div className="relative min-h-0 flex-1 overflow-auto bg-page/50" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedNodeId(null) }}>
                <div className="relative box-border min-h-full min-w-full p-6 sm:p-8">
                  <div
                    ref={canvasBoardRef}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'copy'
                    }}
                    onDrop={handleCanvasBoardDrop}
                    className="canvas-board relative mx-auto box-border min-h-[480px] w-full max-w-[1200px] rounded-xl border-2 border-dashed border-primary/40 bg-page shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06] sm:min-h-[520px]"
                    style={{
                      minHeight: 'min(520px, calc(100dvh - 320px))',
                      minWidth: 'min(100%, 960px)',
                      backgroundImage:
                        'radial-gradient(circle at center, color-mix(in oklab, var(--foreground) 14%, transparent) 1.2px, transparent 1.2px)',
                      backgroundSize: '20px 20px',
                    }}
                    onMouseDown={(e) => {
                      if (e.target === e.currentTarget) setSelectedNodeId(null)
                    }}
                  >
                    <div className="pointer-events-none absolute start-4 top-3 select-none text-[12px] font-semibold text-muted">画布工作区 · 从工具箱拖入组件；节点右侧拖出连线</div>
                    {connectorSvg}
                    {designFlow?.canvas.nodes.map((n) => {
                      const selected = n.id === selectedNodeId
                      const hoverLink = !!wireFromId
                      const shape =
                        n.type === 'start'
                          ? 'rounded-full border-success bg-success/15'
                          : n.type === 'end'
                            ? 'rounded-full border-muted bg-muted/20'
                            : n.type === 'gateway'
                              ? 'flex h-16 w-16 items-center justify-center rotate-45 rounded-md border-2 border-amber-500/80 bg-amber-500/12'
                              : n.type === 'reject' || n.type === 'resubmit'
                                ? 'rounded-[var(--radius-card)] border-amber-600/40 bg-amber-500/10'
                                : 'rounded-[var(--radius-card)] border-primary/50 bg-primary/10'
                      return (
                        <div
                          key={n.id}
                          data-flow-node-id={n.id}
                          className={cn('absolute', selected ? 'z-20' : 'z-[3]')}
                          style={{ left: n.x, top: n.y }}
                          onMouseEnter={() => {
                            if (wireFromId) wireDropTargetRef.current = n.id
                          }}
                          onMouseLeave={() => {
                            if (wireDropTargetRef.current === n.id) wireDropTargetRef.current = null
                          }}
                        >
                          {/* 入边锚点 */}
                          <button
                            type="button"
                            title="连线落点（将上一节点出线拖至本节点上方）"
                            className={cn(
                              'absolute -start-3 top-1/2 z-30 size-3 -translate-y-1/2 rounded-full border-2 shadow-sm transition-transform pointer-events-auto',
                              hoverLink && wireFromId !== n.id ? 'scale-125 border-emerald-500 bg-emerald-400 ring-2 ring-emerald-300/70' : 'border-emerald-600/80 bg-emerald-100/90',
                            )}
                          />
                          <button
                            type="button"
                            onMouseDown={(e) => onCanvasNodeBodyDown(e, n.id)}
                            className={cn(
                              'pointer-events-auto border-2 px-4 py-2.5 text-[13px] font-semibold shadow-md transition-[box-shadow,transform] hover:shadow-lg',
                              shape,
                              selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-page' : '',
                              n.type === 'gateway' ? '' : 'min-w-[132px] max-w-[200px]',
                            )}
                          >
                            <span className={n.type === 'gateway' ? 'block max-w-[5rem] -rotate-45 text-center text-[11px] leading-tight' : 'block text-center leading-snug'}>
                              {n.label}
                            </span>
                          </button>
                          {/* 出边锚点：从此处按住拖向目标 */}
                          <button
                            type="button"
                            title="拖拽到目标节点以创建连线"
                            onMouseDown={(e) => onWireStartMouseDown(e, n.id)}
                            className="pointer-events-auto absolute -end-3 top-1/2 z-30 size-3 -translate-y-1/2 rounded-full border-2 border-sky-500 bg-sky-200/95 shadow-[0_0_0_2px_rgba(14,165,233,0.25)]"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧属性 — 固定宽，避免挤占中间画布 */}
            <aside className="flex w-[380px] shrink-0 flex-col overflow-hidden border-s border-divider bg-page/40">
              <div className="border-b border-divider bg-surface px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">属性面板</p>
                <p className="mt-1 text-[15px] font-bold text-foreground">{selectedNode ? `当前选中：${selectedNode.label}` : '未选中节点'}</p>
              </div>
              <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6 text-[13px] leading-relaxed">
                {selectedNode ? (
                  <>
                    <section className="space-y-3">
                      <h5 className="text-[12px] font-bold text-foreground">通用属性</h5>
                      <label className="flex flex-col gap-2">
                        <span className="text-[12px] font-medium text-muted">节点名称</span>
                        <input
                          className="rounded-[var(--radius-card)] border border-divider bg-surface px-3 py-2.5 text-[13px] outline-none ring-primary/20 focus:ring-2"
                          value={selectedNode.label}
                          onChange={(e) => updateCanvasNode(selectedNode.id, (x) => ({ ...x, label: e.target.value }))}
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-[12px] font-medium text-muted">节点 ID（technicalId）</span>
                        <input
                          className="rounded-[var(--radius-card)] border border-divider bg-surface px-3 py-2.5 font-mono text-[12px]"
                          value={selectedNode.technicalId}
                          placeholder="英文字母开头，建议与引擎任务键一致"
                          onChange={(e) => updateCanvasNode(selectedNode.id, (x) => ({ ...x, technicalId: e.target.value }))}
                          onBlur={() =>
                            updateCanvasNode(selectedNode.id, (x) => ({
                              ...x,
                              technicalId: sanitizeTechId(x.technicalId || x.id, `node_${x.id}`),
                            }))
                          }
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-[12px] font-medium text-muted">描述</span>
                        <textarea
                          className="min-h-[72px] rounded-[var(--radius-card)] border border-divider bg-surface px-3 py-2.5 text-[13px]"
                          value={selectedNode.description}
                          onChange={(e) => updateCanvasNode(selectedNode.id, (x) => ({ ...x, description: e.target.value }))}
                          placeholder="节点说明（可选），用于设计者备注"
                        />
                      </label>
                    </section>

                    {(['approval', 'subprocess', 'call'] as CanvasNodeType[]).includes(selectedNode.type) ? (
                      <>
                        <section className="space-y-4 border-t border-divider pt-6">
                          <h5 className="text-[12px] font-bold text-foreground">审批人配置</h5>
                          <label className="flex flex-col gap-2">
                            <span className="text-[12px] font-medium text-muted">审批人类型</span>
                            <select
                              className="rounded-[var(--radius-card)] border border-divider bg-surface px-3 py-2.5 text-[13px]"
                              value={getApproval(selectedNode).signerType}
                              onChange={(e) =>
                                updateCanvasNode(selectedNode.id, (x) => ({
                                  ...x,
                                  approval: { ...getApproval(x), signerType: e.target.value as ApprovalConfig['signerType'] },
                                }))
                              }
                            >
                              <option value="user">指定用户（选择具体用户）</option>
                              <option value="role">指定角色（该角色下任一用户）</option>
                              <option value="dept_head">部门负责人</option>
                              <option value="leader">上级领导</option>
                              <option value="starter">发起人自选</option>
                            </select>
                          </label>
                          {getApproval(selectedNode).signerType === 'role' ? (
                            <label className="flex flex-col gap-2">
                              <span className="text-[12px] font-medium text-muted">角色名称</span>
                              <input
                                className="rounded-[var(--radius-card)] border border-divider bg-surface px-3 py-2.5"
                                value={getApproval(selectedNode).roleName}
                                onChange={(e) =>
                                  updateCanvasNode(selectedNode.id, (x) => ({
                                    ...x,
                                    approval: { ...getApproval(x), roleName: e.target.value },
                                  }))
                                }
                                placeholder="如：部门主管"
                              />
                            </label>
                          ) : null}
                          {getApproval(selectedNode).signerType === 'user' ? (
                            <label className="flex flex-col gap-2">
                              <span className="text-[12px] font-medium text-muted">指派用户（演示）</span>
                              <select
                                className="rounded-[var(--radius-card)] border border-divider bg-surface px-3 py-2.5"
                                value={getApproval(selectedNode).assigneeUser}
                                onChange={(e) =>
                                  updateCanvasNode(selectedNode.id, (x) => ({
                                    ...x,
                                    approval: { ...getApproval(x), assigneeUser: e.target.value },
                                  }))
                                }
                              >
                                {MOCK_ASSIGNEE_USERS.map((u) => (
                                  <option key={u.value} value={u.value}>
                                    {u.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          ) : null}
                        </section>

                        <section className="space-y-3 border-t border-divider pt-6">
                          <h5 className="text-[12px] font-bold text-foreground">多人审批方式</h5>
                          <select
                            className="w-full rounded-[var(--radius-card)] border border-divider bg-surface px-3 py-2.5 text-[13px]"
                            value={getApproval(selectedNode).signMode}
                            onChange={(e) =>
                              updateCanvasNode(selectedNode.id, (x) => ({
                                ...x,
                                approval: { ...getApproval(x), signMode: e.target.value as ApprovalConfig['signMode'] },
                              }))
                            }
                          >
                            <option value="all">会签 · 所有审批人通过才流转</option>
                            <option value="any">或签 · 任一审批人通过即可</option>
                            <option value="seq">依次审批 · 按顺序逐个通过</option>
                          </select>
                        </section>

                        <section className="space-y-3 border-t border-divider pt-6">
                          <h5 className="text-[12px] font-bold text-foreground">表单权限（可编辑字段）</h5>
                          <p className="text-[12px] text-muted">控制审批人在当前节点可操作 / 必填的表单域（演示占位字段）</p>
                          <div className="space-y-3 rounded-[var(--radius-card)] border border-divider bg-surface p-4">
                            {(
                              [
                                ['projectName', '项目名称'],
                                ['applicant', '申请人'],
                                ['budget', '预算金额'],
                              ] as const
                            ).map(([k, lab]) => (
                              <label key={k} className="flex cursor-pointer items-center gap-3">
                                <input
                                  type="checkbox"
                                  className="size-4 rounded border-divider"
                                  checked={getApproval(selectedNode).formPerms[k]}
                                  onChange={(e) =>
                                    updateCanvasNode(selectedNode.id, (x) => ({
                                      ...x,
                                      approval: {
                                        ...getApproval(x),
                                        formPerms: { ...getApproval(x).formPerms, [k]: e.target.checked },
                                      },
                                    }))
                                  }
                                />
                                <span>{lab}</span>
                              </label>
                            ))}
                          </div>
                        </section>

                        <section className="space-y-4 border-t border-divider pt-6">
                          <h5 className="text-[12px] font-bold text-foreground">超时处理</h5>
                          <div className="rounded-[var(--radius-card)] border border-divider bg-surface p-4 space-y-3">
                            <div className="flex flex-wrap items-center gap-2 text-[13px]">
                              <span className="text-muted whitespace-nowrap">超</span>
                              <input
                                className="w-14 rounded border border-divider px-2 py-2 text-center font-mono tabular-nums"
                                inputMode="numeric"
                                value={getApproval(selectedNode).timeoutD1}
                                onChange={(e) =>
                                  updateCanvasNode(selectedNode.id, (x) => ({
                                    ...x,
                                    approval: { ...getApproval(x), timeoutD1: e.target.value.replace(/\D/g, '') },
                                  }))
                                }
                              />
                              <span className="text-muted">天后</span>
                              <select
                                className="min-w-[8rem] flex-1 rounded border border-divider px-2 py-1.5 text-[12px]"
                                value={getApproval(selectedNode).timeoutAct1}
                                disabled
                              >
                                <option value="remind">自动提醒审批人（默认）</option>
                              </select>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[13px]">
                              <span className="text-muted whitespace-nowrap">再超</span>
                              <input
                                className="w-14 rounded border border-divider px-2 py-2 text-center font-mono tabular-nums"
                                inputMode="numeric"
                                value={getApproval(selectedNode).timeoutD2}
                                onChange={(e) =>
                                  updateCanvasNode(selectedNode.id, (x) => ({
                                    ...x,
                                    approval: { ...getApproval(x), timeoutD2: e.target.value.replace(/\D/g, '') },
                                  }))
                                }
                              />
                              <span className="text-muted">天后</span>
                              <select
                                className="min-w-[10rem] flex-1 rounded border border-divider px-2 py-1.5 text-[12px]"
                                value={getApproval(selectedNode).timeoutAct2}
                                onChange={(e) =>
                                  updateCanvasNode(selectedNode.id, (x) => ({
                                    ...x,
                                    approval: { ...getApproval(x), timeoutAct2: e.target.value as ApprovalConfig['timeoutAct2'] },
                                  }))
                                }
                              >
                                <option value="transfer">转交上级</option>
                                <option value="agree">自动同意</option>
                                <option value="reject">自动拒绝</option>
                              </select>
                            </div>
                          </div>
                        </section>

                        <section className="space-y-3 border-t border-divider pt-6">
                          <h5 className="text-[12px] font-bold text-foreground">节点操作按钮</h5>
                          <div className="flex flex-wrap gap-x-5 gap-y-2">
                            {(['agree', 'reject', 'transfer', 'addSigner'] as const).map((k) => (
                              <label key={k} className="flex cursor-pointer items-center gap-2">
                                <input
                                  type="checkbox"
                                  className="size-4 rounded border-divider"
                                  checked={getApproval(selectedNode).actions[k]}
                                  onChange={(e) =>
                                    updateCanvasNode(selectedNode.id, (x) => ({
                                      ...x,
                                      approval: {
                                        ...getApproval(x),
                                        actions: { ...getApproval(x).actions, [k]: e.target.checked },
                                      },
                                    }))
                                  }
                                />
                                {k === 'agree' ? '同意' : k === 'reject' ? '驳回' : k === 'transfer' ? '转审' : '加签'}
                              </label>
                            ))}
                          </div>
                        </section>

                        <button
                          type="button"
                          className="w-full rounded-[var(--radius-card)] border border-dashed border-divider py-3 text-[13px] font-medium text-muted transition-colors hover:border-primary/40 hover:bg-primary/[0.04] hover:text-foreground"
                          onClick={() => toast.show('审批意见模板配置（演示）', 'info')}
                        >
                          配置审批意见模板…
                        </button>
                      </>
                    ) : (
                      <p className="rounded-[var(--radius-card)] border border-divider bg-surface px-4 py-6 text-center text-[13px] text-muted">
                        该节点类型走引擎默认行为；若需详细审批配置，请使用「审批节点 / 子流程 / 调用活动」。
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-divider bg-surface/80 px-6 py-16 text-center">
                    <p className="text-[14px] font-semibold text-foreground">尚未选中节点</p>
                    <p className="max-w-[240px] text-[13px] leading-relaxed text-muted">在中间画布点击流程节点后，在此处编辑名称与审批属性。</p>
                  </div>
                )}
              </div>
            </aside>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}

function InstanceMonitorPanel({ toast }: { toast: ReturnType<typeof useToast> }) {
  const DEMO = [
    { id: '1001', name: '项目注册审核流程', node: '部门主管审批', starter: '张三', time: '2025-05-15 08:12', status: '处理中' },
    { id: '1002', name: '资源申请审批流程', node: '平台管理员', starter: '李四', time: '2025-05-14 19:03', status: '超时' },
    { id: '1003', name: '入孵决策审批流程', node: '运营总监审批', starter: '王五', time: '2025-05-13 09:41', status: '处理中' },
  ]
  return (
    <SysTableWrap>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider px-4 py-3">
        <h3 className="text-[14px] font-bold text-foreground">运行中的流程实例</h3>
        <div className="flex gap-2">
          <button type="button" className="rounded-[var(--radius-button)] border border-divider px-3 py-1.5 text-[12px] font-semibold hover:bg-page" onClick={() => toast.show('实例列表已刷新', 'info')}>
            刷新
          </button>
          <button type="button" className="rounded-[var(--radius-button)] border border-divider px-3 py-1.5 text-[12px] font-semibold hover:bg-page" onClick={() => toast.show('导出当前实例 CSV（演示）', 'success')}>
            导出
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] text-left text-[13px]">
          <thead className="border-b border-divider bg-page text-[11px] font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">实例 ID</th>
              <th className="px-4 py-3">流程名称</th>
              <th className="px-4 py-3">当前节点</th>
              <th className="px-4 py-3">发起人</th>
              <th className="px-4 py-3">发起时间</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3 text-end">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {DEMO.map((r) => (
              <tr key={r.id} className="hover:bg-page/70">
                <td className="px-4 py-3 font-mono text-[12px]">{r.id}</td>
                <td className="px-4 py-3 font-medium">{r.name}</td>
                <td className="px-4 py-3 text-muted">{r.node}</td>
                <td className="px-4 py-3">{r.starter}</td>
                <td className="px-4 py-3 text-muted">{r.time}</td>
                <td className="px-4 py-3">{r.status}</td>
                <td className="px-4 py-3 text-end whitespace-nowrap">
                  <button type="button" className="me-2 text-[12px] font-semibold text-primary hover:underline" onClick={() => toast.show(`已向审批人推送催办 · #${r.id}`, 'success')}>催办</button>
                  <button type="button" className="me-2 text-[12px] font-semibold text-foreground hover:underline" onClick={() => toast.show(`转办弹窗占位 · #${r.id}`, 'info')}>转办</button>
                  <button type="button" className="text-[12px] font-semibold text-danger hover:underline" onClick={() => { if (window.confirm(`中止实例 #${r.id}？`)) toast.show('流程已中止（演示）', 'warning') }}>中止</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SysTableWrap>
  )
}
