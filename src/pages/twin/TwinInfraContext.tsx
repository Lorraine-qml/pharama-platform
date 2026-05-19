import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { SpaceStatus, TwinBuilding, TwinPark, TwinSpace } from './twinInfraTypes'
import { INITIAL_BUILDINGS, INITIAL_PARKS, INITIAL_SPACES } from './twinInfraSeed'

type Ctx = {
  parks: TwinPark[]
  buildings: TwinBuilding[]
  spaces: TwinSpace[]
  stats: {
    parkCount: number
    buildingCount: number
    spaceCount: number
    spaceStatus: Record<string, number>
    spaceRoomType: Record<string, number>
  }
  buildingCountForPark: (parkId: string) => number
  spaceCountForBuilding: (buildingId: string) => number
  parkById: (id: string) => TwinPark | undefined
  buildingById: (id: string) => TwinBuilding | undefined
  addPark: (p: Omit<TwinPark, 'id' | 'updatedAt'>) => { ok: boolean; msg?: string }
  updatePark: (id: string, patch: Partial<TwinPark>) => { ok: boolean; msg?: string }
  deletePark: (id: string) => { ok: boolean; msg?: string }
  addBuilding: (b: Omit<TwinBuilding, 'id' | 'updatedAt'>) => { ok: boolean; msg?: string }
  updateBuilding: (id: string, patch: Partial<TwinBuilding>) => { ok: boolean; msg?: string }
  deleteBuilding: (id: string) => { ok: boolean; msg?: string }
  addSpace: (s: Omit<TwinSpace, 'id' | 'updatedAt'>) => { ok: boolean; msg?: string }
  updateSpace: (id: string, patch: Partial<TwinSpace>) => { ok: boolean; msg?: string }
  deleteSpace: (id: string) => void
  batchUpdateSpaceStatus: (ids: string[], status: SpaceStatus) => void
  /** 合并「空间表中的楼层」与「批量生成的虚拟楼层」，无空间时回退为单体声明的楼层数骨架 */
  listFloorsForBuilding: (buildingId: string) => string[]
  /** 将楼层标签写入虚拟楼层集合（用于批量生成楼层） */
  registerVirtualFloors: (buildingId: string, floors: string[]) => void
  suggestBuildingCode: (parkId: string, name: string) => string
  suggestSpaceCode: (buildingId: string, floor: string, room: string) => string
}

const C = createContext<Ctx | null>(null)

function nowStr() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

export function TwinInfraProvider({ children }: { children: ReactNode }) {
  const [parks, setParks] = useState<TwinPark[]>(INITIAL_PARKS)
  const [buildings, setBuildings] = useState<TwinBuilding[]>(INITIAL_BUILDINGS)
  const [spaces, setSpaces] = useState<TwinSpace[]>(INITIAL_SPACES)
  /** 批量生成的楼层标签（可与空间表中已有楼层合并展示） */
  const [virtualFloorsByBuilding, setVirtualFloorsByBuilding] = useState<Record<string, string[]>>({})

  const buildingCountForPark = useCallback(
    (parkId: string) => buildings.filter((b) => b.parkId === parkId).length,
    [buildings],
  )

  const spaceCountForBuilding = useCallback(
    (buildingId: string) => spaces.filter((s) => s.buildingId === buildingId).length,
    [spaces],
  )

  const parkById = useCallback((id: string) => parks.find((p) => p.id === id), [parks])
  const buildingById = useCallback((id: string) => buildings.find((b) => b.id === id), [buildings])

  const stats = useMemo(() => {
    const spaceStatus: Record<string, number> = { 空闲: 0, 占用: 0, 维护: 0, 停用: 0 }
    const spaceRoomType: Record<string, number> = {}
    for (const s of spaces) {
      spaceStatus[s.status] = (spaceStatus[s.status] ?? 0) + 1
      spaceRoomType[s.roomType] = (spaceRoomType[s.roomType] ?? 0) + 1
    }
    return {
      parkCount: parks.length,
      buildingCount: buildings.length,
      spaceCount: spaces.length,
      spaceStatus,
      spaceRoomType,
    }
  }, [parks.length, buildings.length, spaces])

  const addPark = useCallback(
    (p: Omit<TwinPark, 'id' | 'updatedAt'>) => {
      if (parks.some((x) => x.code === p.code)) return { ok: false, msg: '园区编码已存在，请更换' }
      const id = `park-${Date.now()}`
      setParks((xs) => [...xs, { ...p, id, updatedAt: nowStr() }])
      return { ok: true }
    },
    [parks],
  )

  const updatePark = useCallback(
    (id: string, patch: Partial<TwinPark>) => {
      if (patch.code != null && parks.some((x) => x.id !== id && x.code === patch.code)) {
        return { ok: false, msg: '园区编码与其他园区重复' }
      }
      setParks((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: nowStr() } : x)))
      return { ok: true }
    },
    [parks],
  )

  const deletePark = useCallback(
    (id: string) => {
      if (buildings.some((b) => b.parkId === id)) {
        return { ok: false, msg: '请先删除该园区下的所有单体' }
      }
      setParks((xs) => xs.filter((x) => x.id !== id))
      return { ok: true }
    },
    [buildings],
  )

  const addBuilding = useCallback(
    (b: Omit<TwinBuilding, 'id' | 'updatedAt'>) => {
      if (buildings.some((x) => x.parkId === b.parkId && x.code === b.code)) {
        return { ok: false, msg: '该园区下单体编码已存在' }
      }
      const id = `bd-${Date.now()}`
      setBuildings((xs) => [...xs, { ...b, id, updatedAt: nowStr() }])
      return { ok: true }
    },
    [buildings],
  )

  const updateBuilding = useCallback(
    (id: string, patch: Partial<TwinBuilding>) => {
      const cur = buildings.find((x) => x.id === id)
      if (!cur) return { ok: false, msg: '未找到单体' }
      const nextPark = patch.parkId ?? cur.parkId
      const nextCode = patch.code ?? cur.code
      if (buildings.some((x) => x.id !== id && x.parkId === nextPark && x.code === nextCode)) {
        return { ok: false, msg: '该园区下单体编码已存在' }
      }
      setBuildings((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: nowStr() } : x)))
      return { ok: true }
    },
    [buildings],
  )

  const deleteBuilding = useCallback(
    (id: string) => {
      if (spaces.some((s) => s.buildingId === id)) {
        return { ok: false, msg: '请先删除该单体下的所有空间' }
      }
      setBuildings((xs) => xs.filter((x) => x.id !== id))
      return { ok: true }
    },
    [spaces],
  )

  const addSpace = useCallback(
    (s: Omit<TwinSpace, 'id' | 'updatedAt'>) => {
      if (spaces.some((x) => x.code === s.code)) return { ok: false, msg: '空间编码已存在' }
      const id = `sp-${Date.now()}`
      setSpaces((xs) => [...xs, { ...s, id, updatedAt: nowStr() }])
      return { ok: true }
    },
    [spaces],
  )

  const updateSpace = useCallback(
    (id: string, patch: Partial<TwinSpace> & { clearProject?: boolean }) => {
      if (patch.code != null && spaces.some((x) => x.id !== id && x.code === patch.code)) {
        return { ok: false, msg: '空间编码与其他空间重复' }
      }
      const { clearProject, ...rest } = patch
      setSpaces((xs) =>
        xs.map((x) => {
          if (x.id !== id) return x
          let next: TwinSpace = { ...x, ...rest }
          if (clearProject) {
            next = {
              ...next,
              projectId: undefined,
              projectName: undefined,
              occupyStart: undefined,
              occupyEnd: undefined,
              status: next.status === '占用' ? '空闲' : next.status,
            }
          } else if (rest.projectId) {
            next = { ...next, status: '占用' }
          }
          return { ...next, updatedAt: nowStr() }
        }),
      )
      return { ok: true }
    },
    [spaces],
  )

  const deleteSpace = useCallback((id: string) => {
    setSpaces((xs) => xs.filter((x) => x.id !== id))
  }, [])

  const batchUpdateSpaceStatus = useCallback((ids: string[], status: SpaceStatus) => {
    setSpaces((xs) =>
      xs.map((x) => (ids.includes(x.id) ? { ...x, status, updatedAt: nowStr() } : x)),
    )
  }, [])

  const listFloorsForBuilding = useCallback(
    (buildingId: string) => {
      const b = buildings.find((x) => x.id === buildingId)
      const set = new Set<string>()
      for (const s of spaces) {
        if (s.buildingId === buildingId) set.add(s.floor)
      }
      for (const f of virtualFloorsByBuilding[buildingId] ?? []) {
        set.add(f)
      }
      if (set.size === 0 && b) {
        for (let i = 1; i <= Math.max(1, b.floors); i++) set.add(`${i}F`)
      }
      return [...set].sort((a, b) => {
        const na = parseInt(String(a).replace(/\D/g, ''), 10) || 0
        const nb = parseInt(String(b).replace(/\D/g, ''), 10) || 0
        return na - nb
      })
    },
    [buildings, spaces, virtualFloorsByBuilding],
  )

  const registerVirtualFloors = useCallback((buildingId: string, floors: string[]) => {
    setVirtualFloorsByBuilding((prev) => {
      const cur = new Set(prev[buildingId] ?? [])
      for (const f of floors) cur.add(f)
      return { ...prev, [buildingId]: [...cur] }
    })
  }, [])

  const suggestBuildingCode = useCallback(
    (parkId: string, name: string) => {
      const p = parks.find((x) => x.id === parkId)
      const prefix = p?.code?.split('-')[0] ?? 'P'
      const abbr = name.replace(/栋|座|楼/g, '').slice(0, 1) || 'X'
      return `${prefix}-${abbr}`
    },
    [parks],
  )

  const suggestSpaceCode = useCallback(
    (buildingId: string, floor: string, room: string) => {
      const b = buildings.find((x) => x.id === buildingId)
      const f = floor.replace(/层|楼/gi, '')
      const r = room.replace(/室/g, '')
      return b ? `${b.code}-${f}-${r}` : `SP-${f}-${r}`
    },
    [buildings],
  )

  const value = useMemo(
    (): Ctx => ({
      parks,
      buildings,
      spaces,
      stats,
      buildingCountForPark,
      spaceCountForBuilding,
      parkById,
      buildingById,
      addPark,
      updatePark,
      deletePark,
      addBuilding,
      updateBuilding,
      deleteBuilding,
      addSpace,
      updateSpace,
      deleteSpace,
      batchUpdateSpaceStatus,
      listFloorsForBuilding,
      registerVirtualFloors,
      suggestBuildingCode,
      suggestSpaceCode,
    }),
    [
      parks,
      buildings,
      spaces,
      stats,
      buildingCountForPark,
      spaceCountForBuilding,
      parkById,
      buildingById,
      addPark,
      updatePark,
      deletePark,
      addBuilding,
      updateBuilding,
      deleteBuilding,
      addSpace,
      updateSpace,
      deleteSpace,
      batchUpdateSpaceStatus,
      listFloorsForBuilding,
      registerVirtualFloors,
      suggestBuildingCode,
      suggestSpaceCode,
    ],
  )

  return <C.Provider value={value}>{children}</C.Provider>
}

export function useTwinInfra() {
  const v = useContext(C)
  if (!v) throw new Error('useTwinInfra must be used within TwinInfraProvider')
  return v
}
