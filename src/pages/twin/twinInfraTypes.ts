/** 空间基础设施：园区 / 单体（楼宇）/ 空间（房间） */

export type ParkStatus = '启用' | '停用'

export type TwinPark = {
  id: string
  name: string
  code: string
  address: string
  areaMu: number
  contact: string
  phone: string
  remark: string
  status: ParkStatus
  lng: string
  lat: string
  floorPlanFile?: string
  updatedAt: string
}

export type BuildingType = '办公楼' | '实验楼' | '综合楼'

export type BuildingStatus = '启用' | '停用'

export type TwinBuilding = {
  id: string
  name: string
  code: string
  parkId: string
  floors: number
  areaM2: number
  buildingType: BuildingType
  status: BuildingStatus
  facadeFile?: string
  remark: string
  updatedAt: string
}

export type RoomType = '办公室' | '实验室' | '会议室' | '设备间' | '样本库' | '工位'

export type SpaceStatus = '空闲' | '占用' | '维护' | '停用'

export type SpaceResourceBind = { name: string; kind: string }

export type TwinSpace = {
  id: string
  name: string
  code: string
  buildingId: string
  floor: string
  roomType: RoomType
  areaM2: number
  capacity: string
  purpose: string
  status: SpaceStatus
  projectId?: string
  projectName?: string
  occupyStart?: string
  occupyEnd?: string
  resourceBindings: SpaceResourceBind[]
  updatedAt: string
}
