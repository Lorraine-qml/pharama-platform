import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  INITIAL_AI_NODES,
  INITIAL_EXTERNAL_PARTNERS,
  INITIAL_KB_DOCUMENTS,
  INITIAL_KNOWLEDGE_BASES,
  INITIAL_VIRTUAL_PROJECTS,
} from './ecoMock'
import type {
  AiAbilityNode,
  ExternalPartner,
  KbDocument,
  KnowledgeBase,
  VirtualProject,
} from './ecoTypes'

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

type EcoContextValue = {
  virtualProjects: VirtualProject[]
  addVirtualProject: (row: Omit<VirtualProject, 'id'>) => void
  updateVirtualProject: (id: string, patch: Partial<VirtualProject>) => void
  removeVirtualProject: (id: string) => void

  partners: ExternalPartner[]
  addPartner: (row: Omit<ExternalPartner, 'id'>) => void
  updatePartner: (id: string, patch: Partial<ExternalPartner>) => void
  removePartner: (id: string) => void

  aiNodes: AiAbilityNode[]
  refreshAiDemo: () => void

  knowledgeBases: KnowledgeBase[]
  addKnowledgeBase: (row: Omit<KnowledgeBase, 'id' | 'updatedAt'>) => void
  updateKnowledgeBase: (id: string, patch: Partial<KnowledgeBase>) => void
  tryRemoveKnowledgeBase: (id: string) => { ok: true } | { ok: false; message: string }

  getDocuments: (kbId: string) => KbDocument[]
  addKbDocument: (kbId: string, row: Omit<KbDocument, 'id' | 'kbId'>) => void
  removeKbDocument: (kbId: string, docId: string) => void
}

const EcoContext = createContext<EcoContextValue | null>(null)

export function EcoProvider({ children }: { children: ReactNode }) {
  const [virtualProjects, setVirtualProjects] = useState<VirtualProject[]>(() => [...INITIAL_VIRTUAL_PROJECTS])
  const [partners, setPartners] = useState<ExternalPartner[]>(() => [...INITIAL_EXTERNAL_PARTNERS])
  const [aiNodes, setAiNodes] = useState<AiAbilityNode[]>(() => [...INITIAL_AI_NODES])
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>(() => [...INITIAL_KNOWLEDGE_BASES])
  const [documentsByKb, setDocumentsByKb] = useState<Record<string, KbDocument[]>>(() => {
    const next: Record<string, KbDocument[]> = {}
    for (const [k, v] of Object.entries(INITIAL_KB_DOCUMENTS)) {
      next[k] = v.map((d) => ({ ...d }))
    }
    return next
  })

  const addVirtualProject = useCallback((row: Omit<VirtualProject, 'id'>) => {
    setVirtualProjects((prev) => [...prev, { ...row, id: newId('eco-vp') }])
  }, [])

  const updateVirtualProject = useCallback((id: string, patch: Partial<VirtualProject>) => {
    setVirtualProjects((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }, [])

  const removeVirtualProject = useCallback((id: string) => {
    setVirtualProjects((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const addPartner = useCallback((row: Omit<ExternalPartner, 'id'>) => {
    setPartners((prev) => [...prev, { ...row, id: newId('eco-ep') }])
  }, [])

  const updatePartner = useCallback((id: string, patch: Partial<ExternalPartner>) => {
    setPartners((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }, [])

  const removePartner = useCallback((id: string) => {
    setPartners((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const refreshAiDemo = useCallback(() => {
    setAiNodes((prev) =>
      prev.map((n) => ({
        ...n,
        calls30d: Math.max(10, n.calls30d + Math.floor(Math.random() * 40) - 15),
        successPct: Math.min(99.9, Math.max(90, n.successPct + (Math.random() * 2 - 1))),
      })),
    )
  }, [])

  const addKnowledgeBase = useCallback((row: Omit<KnowledgeBase, 'id' | 'updatedAt'>) => {
    const id = newId('kb')
    const today = new Date().toISOString().slice(0, 10)
    setKnowledgeBases((prev) => [...prev, { ...row, id, updatedAt: today }])
    setDocumentsByKb((prev) => ({ ...prev, [id]: [] }))
  }, [])

  const updateKnowledgeBase = useCallback((id: string, patch: Partial<KnowledgeBase>) => {
    const today = new Date().toISOString().slice(0, 10)
    setKnowledgeBases((prev) =>
      prev.map((k) => (k.id === id ? { ...k, ...patch, updatedAt: today } : k)),
    )
  }, [])

  const tryRemoveKnowledgeBase = useCallback(
    (id: string): { ok: true } | { ok: false; message: string } => {
      const docs = documentsByKb[id] ?? []
      if (docs.length > 0) {
        return { ok: false, message: `该知识库仍有 ${docs.length} 个文档，请先清空文档后再删除。` }
      }
      setKnowledgeBases((prev) => prev.filter((k) => k.id !== id))
      setDocumentsByKb((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      return { ok: true }
    },
    [documentsByKb],
  )

  const getDocuments = useCallback(
    (kbId: string) => documentsByKb[kbId] ?? [],
    [documentsByKb],
  )

  const addKbDocument = useCallback((kbId: string, row: Omit<KbDocument, 'id' | 'kbId'>) => {
    const doc: KbDocument = { ...row, id: newId('doc'), kbId }
    setDocumentsByKb((prev) => ({
      ...prev,
      [kbId]: [...(prev[kbId] ?? []), doc],
    }))
    const today = new Date().toISOString().slice(0, 10)
    setKnowledgeBases((bases) =>
      bases.map((b) => (b.id === kbId ? { ...b, updatedAt: today } : b)),
    )
  }, [])

  const removeKbDocument = useCallback((kbId: string, docId: string) => {
    setDocumentsByKb((prev) => ({
      ...prev,
      [kbId]: (prev[kbId] ?? []).filter((d) => d.id !== docId),
    }))
    const today = new Date().toISOString().slice(0, 10)
    setKnowledgeBases((bases) =>
      bases.map((b) => (b.id === kbId ? { ...b, updatedAt: today } : b)),
    )
  }, [])

  const value = useMemo(
    () => ({
      virtualProjects,
      addVirtualProject,
      updateVirtualProject,
      removeVirtualProject,
      partners,
      addPartner,
      updatePartner,
      removePartner,
      aiNodes,
      refreshAiDemo,
      knowledgeBases,
      addKnowledgeBase,
      updateKnowledgeBase,
      tryRemoveKnowledgeBase,
      getDocuments,
      addKbDocument,
      removeKbDocument,
    }),
    [
      virtualProjects,
      addVirtualProject,
      updateVirtualProject,
      removeVirtualProject,
      partners,
      addPartner,
      updatePartner,
      removePartner,
      aiNodes,
      refreshAiDemo,
      knowledgeBases,
      addKnowledgeBase,
      updateKnowledgeBase,
      tryRemoveKnowledgeBase,
      getDocuments,
      addKbDocument,
      removeKbDocument,
    ],
  )

  return <EcoContext.Provider value={value}>{children}</EcoContext.Provider>
}

export function useEco() {
  const v = useContext(EcoContext)
  if (!v) throw new Error('useEco 需在 EcoProvider 内使用')
  return v
}
