import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

/** 0 停用 · 1 启用 */
export type ResourceTypeStatus = 0 | 1

export type ResourceTag = {
  id: string
  categoryId: string
  tagCode: string
  tagName: string
  description: string
  sortOrder: number
  status: ResourceTypeStatus
  isSystem: boolean
}

export type ResourceCategory = {
  id: string
  code: string
  name: string
  description: string
  sortOrder: number
  status: ResourceTypeStatus
  isSystem: boolean
  tags: ResourceTag[]
}

/** 供资源注册等下拉：仅启用的一级 + 启用的二级标签名 */
export type ResourceTypeSelectCategory = { id: string; name: string; tags: string[] }

export type AddTagInput = {
  tagName: string
  tagCode: string
  description?: string
  sortOrder: number
  status: ResourceTypeStatus
}

function nextTagId() {
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function mkTag(
  categoryId: string,
  partial: Omit<ResourceTag, 'id' | 'categoryId' | 'description'> & { id?: string; description?: string },
): ResourceTag {
  return {
    id: partial.id ?? nextTagId(),
    categoryId,
    tagCode: partial.tagCode,
    tagName: partial.tagName,
    description: partial.description ?? '',
    sortOrder: partial.sortOrder,
    status: partial.status,
    isSystem: partial.isSystem,
  }
}

/** 与演示资源 level1 / level2 文案对齐的预置数据 */
export function buildDefaultResourceCategories(): ResourceCategory[] {
  const carrier = 'rc-carrier'
  const industry = 'rc-industry'
  const sharing = 'rc-sharing'
  const finance = 'rc-finance'
  return [
    {
      id: carrier,
      code: 'carrier_incubation',
      name: '载体孵化（空间）',
      description: '提供物理空间与载体类孵化资源的分类',
      sortOrder: 10,
      status: 1,
      isSystem: true,
      tags: [
        mkTag(carrier, { tagCode: 'shared_lab', tagName: '共享实验室', sortOrder: 10, status: 1, isSystem: true }),
        mkTag(carrier, { tagCode: 'independent_office', tagName: '独立办公室', sortOrder: 20, status: 1, isSystem: true }),
        mkTag(carrier, { tagCode: 'meeting_room', tagName: '会议室', sortOrder: 30, status: 1, isSystem: true }),
        mkTag(carrier, { tagCode: 'roadshow_hall', tagName: '路演厅', sortOrder: 40, status: 1, isSystem: true }),
      ],
    },
    {
      id: industry,
      code: 'industry_linkage',
      name: '产业联动',
      description: 'CRO/CDMO、医院与高校等产业协同资源',
      sortOrder: 20,
      status: 1,
      isSystem: true,
      tags: [
        mkTag(industry, { tagCode: 'cro', tagName: 'CRO', sortOrder: 10, status: 1, isSystem: true }),
        mkTag(industry, { tagCode: 'cdmo', tagName: 'CDMO', sortOrder: 20, status: 1, isSystem: true }),
        mkTag(industry, { tagCode: 'hospital_coop', tagName: '医院合作', sortOrder: 30, status: 1, isSystem: true }),
        mkTag(industry, { tagCode: 'university_coop', tagName: '高校合作', sortOrder: 40, status: 1, isSystem: true }),
      ],
    },
    {
      id: sharing,
      code: 'resource_sharing',
      name: '资源共享',
      description: '设备、样本、专家与技术服务类共享资源',
      sortOrder: 30,
      status: 1,
      isSystem: true,
      tags: [
        mkTag(sharing, { tagCode: 'equipment', tagName: '设备', sortOrder: 10, status: 1, isSystem: true }),
        mkTag(sharing, { tagCode: 'sample', tagName: '样本', sortOrder: 20, status: 1, isSystem: true }),
        mkTag(sharing, { tagCode: 'expert', tagName: '专家', sortOrder: 30, status: 1, isSystem: true }),
        mkTag(sharing, { tagCode: 'tech_service', tagName: '技术服务', sortOrder: 40, status: 1, isSystem: true }),
      ],
    },
    {
      id: finance,
      code: 'financial_service',
      name: '金融服务',
      description: '投融资与政策性金融支持',
      sortOrder: 40,
      status: 1,
      isSystem: true,
      tags: [
        mkTag(finance, { tagCode: 'investment_inst', tagName: '投资机构', sortOrder: 10, status: 1, isSystem: true }),
        mkTag(finance, { tagCode: 'bank_loan', tagName: '银行贷款', sortOrder: 20, status: 1, isSystem: true }),
        mkTag(finance, { tagCode: 'policy_subsidy', tagName: '政策补贴', sortOrder: 30, status: 1, isSystem: true }),
      ],
    },
  ]
}

type Ctx = {
  categories: ResourceCategory[]
  /** 资源注册等：启用的一级分类及启用的二级标签（按排序号） */
  categoriesForRegister: ResourceTypeSelectCategory[]
  updateCategory: (id: string, patch: Partial<Pick<ResourceCategory, 'name' | 'description' | 'status' | 'sortOrder'>>) => void
  moveCategory: (id: string, dir: 'up' | 'down') => void
  addTag: (categoryId: string, input: AddTagInput) => { ok: true } | { ok: false; reason: string }
  updateTag: (
    categoryId: string,
    tagId: string,
    patch: Partial<Omit<ResourceTag, 'id' | 'categoryId' | 'isSystem'>>,
  ) => { ok: true } | { ok: false; reason: string }
  removeTag: (categoryId: string, tagId: string) => { ok: true } | { ok: false; reason: string }
  reorderTags: (categoryId: string, orderedTagIds: string[]) => void
  restoreDefaults: () => void
  tagCodeExists: (categoryId: string, code: string, exceptTagId?: string) => boolean
}

const Ctx = createContext<Ctx | null>(null)

function sortCats(cats: ResourceCategory[]): ResourceCategory[] {
  return [...cats].sort((a, b) => a.sortOrder - b.sortOrder)
}

function sortTags(tags: ResourceTag[]): ResourceTag[] {
  return [...tags].sort((a, b) => a.sortOrder - b.sortOrder)
}

export function ResourceTypesConfigProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<ResourceCategory[]>(() => sortCats(buildDefaultResourceCategories()))

  const categoriesForRegister = useMemo((): ResourceTypeSelectCategory[] => {
    return sortCats(categories)
      .filter((c) => c.status === 1)
      .map((c) => ({
        id: c.id,
        name: c.name,
        tags: sortTags(c.tags)
          .filter((t) => t.status === 1)
          .map((t) => t.tagName),
      }))
  }, [categories])

  const tagCodeExists = useCallback(
    (categoryId: string, code: string, exceptTagId?: string) => {
      const c = categories.find((x) => x.id === categoryId)
      if (!c) return false
      const norm = code.trim().toLowerCase()
      return c.tags.some((t) => t.tagCode.trim().toLowerCase() === norm && t.id !== exceptTagId)
    },
    [categories],
  )

  const updateCategory = useCallback((id: string, patch: Partial<Pick<ResourceCategory, 'name' | 'description' | 'status' | 'sortOrder'>>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }, [])

  const moveCategory = useCallback((id: string, dir: 'up' | 'down') => {
    setCategories((prev) => {
      const sorted = sortCats(prev)
      const i = sorted.findIndex((c) => c.id === id)
      if (i < 0) return prev
      const j = dir === 'up' ? i - 1 : i + 1
      if (j < 0 || j >= sorted.length) return prev
      const a = sorted[i]
      const b = sorted[j]
      const next = prev.map((c) => {
        if (c.id === a.id) return { ...c, sortOrder: b.sortOrder }
        if (c.id === b.id) return { ...c, sortOrder: a.sortOrder }
        return c
      })
      return next
    })
  }, [])

  const addTag = useCallback(
    (categoryId: string, input: AddTagInput): { ok: true } | { ok: false; reason: string } => {
      const name = input.tagName.trim()
      const code = input.tagCode.trim()
      if (!name) return { ok: false as const, reason: '请填写标签名称' }
      if (!code) return { ok: false as const, reason: '请填写标签标识' }
      const cat = categories.find((x) => x.id === categoryId)
      if (!cat) return { ok: false as const, reason: '分类不存在' }
      if (cat.tags.some((t) => t.tagName.trim() === name)) return { ok: false as const, reason: '同分类下标签名称已存在' }
      if (tagCodeExists(categoryId, code)) return { ok: false as const, reason: '标签标识在同一分类下需唯一' }
      const nextTag = mkTag(categoryId, {
        tagCode: code,
        tagName: name,
        description: input.description?.trim() ?? '',
        sortOrder: input.sortOrder,
        status: input.status,
        isSystem: false,
      })
      setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, tags: [...c.tags, nextTag] } : c)))
      return { ok: true as const }
    },
    [categories, tagCodeExists],
  )

  const updateTag = useCallback(
    (categoryId: string, tagId: string, patch: Partial<Omit<ResourceTag, 'id' | 'categoryId' | 'isSystem'>>) => {
      const code = patch.tagCode?.trim()
      if (code !== undefined && code.length === 0) return { ok: false as const, reason: '标签标识不能为空' }
      if (code && tagCodeExists(categoryId, code, tagId)) return { ok: false as const, reason: '标签标识在同一分类下需唯一' }
      const cat = categories.find((x) => x.id === categoryId)
      const cur = cat?.tags.find((t) => t.id === tagId)
      if (patch.tagName !== undefined && cur) {
        const nn = patch.tagName.trim()
        if (!nn) return { ok: false as const, reason: '标签名称不能为空' }
        if (cat?.tags.some((t) => t.id !== tagId && t.tagName.trim() === nn))
          return { ok: false as const, reason: '同分类下标签名称已存在' }
      }
      setCategories((prev) =>
        prev.map((c) => {
          if (c.id !== categoryId) return c
          return {
            ...c,
            tags: c.tags.map((t) => (t.id === tagId ? { ...t, ...patch, tagCode: code ?? t.tagCode } : t)),
          }
        }),
      )
      return { ok: true as const }
    },
    [categories, tagCodeExists],
  )

  const removeTag = useCallback((categoryId: string, tagId: string) => {
    const c = categories.find((x) => x.id === categoryId)
    const tag = c?.tags.find((t) => t.id === tagId)
    if (!tag) return { ok: false as const, reason: '标签不存在' }
    if (tag.isSystem) return { ok: false as const, reason: '系统预置标签不可删除' }
    setCategories((prev) =>
      prev.map((x) => (x.id === categoryId ? { ...x, tags: x.tags.filter((t) => t.id !== tagId) } : x)),
    )
    return { ok: true as const }
  }, [categories])

  const reorderTags = useCallback((categoryId: string, orderedTagIds: string[]) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== categoryId) return c
        const orderMap = new Map(orderedTagIds.map((id, idx) => [id, (idx + 1) * 10]))
        return {
          ...c,
          tags: c.tags.map((t) => ({ ...t, sortOrder: orderMap.get(t.id) ?? t.sortOrder })),
        }
      }),
    )
  }, [])

  const restoreDefaults = useCallback(() => {
    setCategories(sortCats(buildDefaultResourceCategories()))
  }, [])

  const value = useMemo(
    (): Ctx => ({
      categories: sortCats(categories).map((c) => ({ ...c, tags: sortTags(c.tags) })),
      categoriesForRegister,
      updateCategory,
      moveCategory,
      addTag,
      updateTag,
      removeTag,
      reorderTags,
      restoreDefaults,
      tagCodeExists,
    }),
    [
      categories,
      categoriesForRegister,
      updateCategory,
      moveCategory,
      addTag,
      updateTag,
      removeTag,
      reorderTags,
      restoreDefaults,
      tagCodeExists,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useResourceTypesConfig() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useResourceTypesConfig must be used within ResourceTypesConfigProvider')
  return v
}
