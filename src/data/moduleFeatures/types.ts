export type ModuleFeatureItem = {
  /** 三级功能点名称 */
  name: string
  /** 功能说明 */
  desc: string
  /** 交互流程 */
  flow: string
  /** AI Skill / 辅助说明；null 表示无 */
  ai?: string | null
}

export type ModuleFeatureDef = {
  /** 一级菜单 */
  moduleLabel: string
  /** 二级页面标题 */
  pageTitle: string
  /** 编号如 1.1 */
  pageCode: string
  /** 规划阶段标记 */
  phase?: 'V2'
  /** 页面导语 */
  intro?: string
  features: ModuleFeatureItem[]
}
