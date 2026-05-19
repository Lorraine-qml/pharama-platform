/** 空间运营分析 V1 演示聚合数据（T+1 汇总由后端提供，此处为静态 + 可刷新抖动） */

export type BuildingUsageRow = { id: string; name: string; ratePct: number }

export type RoomTypeUsageRow = { type: string; ratePct: number; color: string }

export type FloorUsageRow = { floor: string; ratePct: number }

export type VacantRoomRow = {
  id: string
  name: string
  location: string
  areaM2: number
  vacantDays: number
  roomType: string
  /** 长期 >90 */
  bucket: 'long' | 'short'
}

export type LabTrendPoint = { day: string; ratePct: number }

export type LabRankRow = { id: string; name: string; loadPct: number }

export type LabAppointmentRow = { time: string; project: string; hours: number; status: string }

export const BASE_BUILDING_USAGE: BuildingUsageRow[] = [
  { id: 'b-b', name: 'B 栋', ratePct: 82 },
  { id: 'b-a', name: 'A 栋', ratePct: 65 },
  { id: 'b-c', name: 'C 栋', ratePct: 43 },
]

export const ROOM_TYPE_USAGE: RoomTypeUsageRow[] = [
  { type: '办公室', ratePct: 78, color: 'bg-sky-500' },
  { type: '实验室', ratePct: 65, color: 'bg-emerald-500' },
  { type: '会议室', ratePct: 32, color: 'bg-amber-500' },
]

/** 楼宇 → 各楼层使用率（下钻） */
export const FLOORS_BY_BUILDING: Record<string, FloorUsageRow[]> = {
  B: [
    { floor: '5F', ratePct: 72 },
    { floor: '4F', ratePct: 68 },
    { floor: '3F', ratePct: 81 },
    { floor: '2F', ratePct: 76 },
    { floor: '1F', ratePct: 88 },
  ],
  A: [
    { floor: '4F', ratePct: 70 },
    { floor: '3F', ratePct: 62 },
    { floor: '2F', ratePct: 58 },
    { floor: '1F', ratePct: 71 },
  ],
  C: [
    { floor: '3F', ratePct: 38 },
    { floor: '2F', ratePct: 45 },
    { floor: '1F', ratePct: 46 },
  ],
}

export const LAB_TREND_7D: LabTrendPoint[] = [
  { day: 'D-6', ratePct: 58 },
  { day: 'D-5', ratePct: 61 },
  { day: 'D-4', ratePct: 59 },
  { day: 'D-3', ratePct: 64 },
  { day: 'D-2', ratePct: 67 },
  { day: 'D-1', ratePct: 63 },
  { day: '今天', ratePct: 65 },
]

export const LAB_RANK_TOP: LabRankRow[] = [
  { id: 'lab-a', name: '共享实验室 A', loadPct: 85 },
  { id: 'lab-cell', name: '细胞房', loadPct: 72 },
  { id: 'lab-mol', name: '分子实验室', loadPct: 60 },
  { id: 'lab-bio', name: '生物安全二级实验室', loadPct: 55 },
  { id: 'lab-img', name: '影像分析室', loadPct: 48 },
]

export const VACANT_ROOMS: VacantRoomRow[] = [
  {
    id: 'v1',
    name: 'C 栋 205 室',
    location: 'C 栋-2F-205',
    areaM2: 50,
    vacantDays: 95,
    roomType: '办公室',
    bucket: 'long',
  },
  {
    id: 'v2',
    name: 'A 栋 110 室',
    location: 'A 栋-1F-110',
    areaM2: 30,
    vacantDays: 7,
    roomType: '工位',
    bucket: 'short',
  },
  {
    id: 'v3',
    name: 'B 栋 318 室',
    location: 'B 栋-3F-318',
    areaM2: 45,
    vacantDays: 120,
    roomType: '办公室',
    bucket: 'long',
  },
  {
    id: 'v4',
    name: 'C 栋 会议室 2',
    location: 'C 栋-1F-M02',
    areaM2: 40,
    vacantDays: 14,
    roomType: '会议室',
    bucket: 'short',
  },
]

export const LAB_APPOINTMENTS_BY_ID: Record<string, LabAppointmentRow[]> = {
  'lab-a': [
    { time: '2026-05-18 09:00', project: '基因治疗项目', hours: 4, status: '已完成' },
    { time: '2026-05-18 14:00', project: '细胞治疗项目', hours: 3, status: '使用中' },
    { time: '2026-05-19 10:00', project: '抗体项目', hours: 5, status: '已预约' },
  ],
  'lab-cell': [
    { time: '2026-05-17 08:30', project: '基因治疗项目', hours: 6, status: '已完成' },
    { time: '2026-05-18 08:30', project: '细胞治疗项目', hours: 6, status: '已完成' },
  ],
  'lab-mol': [{ time: '2026-05-18 13:00', project: 'AI 新药平台', hours: 3, status: '已预约' }],
  'lab-bio': [{ time: '2026-05-16 09:00', project: '抗体项目', hours: 4, status: '已完成' }],
  'lab-img': [{ time: '2026-05-15 10:00', project: '基因治疗项目', hours: 2, status: '已完成' }],
}

/** 与 PRD 示例对齐的人均分析演示行（与入孵档案 id 对齐便于跳转） */
export const PROJECT_SPACE_DEMO: Record<
  string,
  { teamSize: number; occupiedM2: number; suggestPerCapitaM2: number; dominantType: '办公室' | '实验室' }
> = {
  'h-proj-1': { teamSize: 8, occupiedM2: 130, suggestPerCapitaM2: 12, dominantType: '办公室' },
  'h-proj-3': { teamSize: 5, occupiedM2: 35, suggestPerCapitaM2: 12, dominantType: '办公室' },
  'h-proj-4': { teamSize: 15, occupiedM2: 280, suggestPerCapitaM2: 12, dominantType: '办公室' },
}
