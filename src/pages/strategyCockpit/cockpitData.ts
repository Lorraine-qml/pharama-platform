export const KPI_TOP = [
  { key: 'B', value: '10193229', suffix: '↑', unit: '个', label: '样本库存储量' },
  { key: 'D', value: '14', suffix: '', unit: '个', label: '公共健康数据源' },
  { key: 'T', value: '25', suffix: '', unit: '项', label: '数据产品交易量' },
  { key: 'M', value: '46', suffix: '', unit: '个', label: '药证产品总数' },
] as const

export const HUB_NODES = [
  { key: 'D', label: '学科建设与数据', labelEn: 'Discipline Construction and Data', angle: 0 },
  { key: 'B', label: '生物样本库', labelEn: 'Biobank', angle: -45 },
  { key: 'T', label: '转化研究', labelEn: 'Translational Research', angle: 45 },
  { key: 'C', label: '以健康为中心', labelEn: 'Health Centered', angle: 225 },
  { key: 'M', label: '精准医疗', labelEn: 'Precision Medicine', angle: 135 },
] as const

export const CENTER_DATE_FILTER = { unit: '月', value: '2026-06' } as const

export const DATA_PRODUCTS = [
  { label: '西医数据产品', value: 22, color: '#1e4a8a' },
  { label: '药物数据产品', value: 18, color: '#ff9a2e' },
  { label: '医疗器械数据产品', value: 16, color: '#facc15' },
  { label: '医疗数据产品', value: 14, color: '#22c55e' },
  { label: '中医数据产品', value: 12, color: '#7dd3fc' },
  { label: '其他数据产品', value: 10, color: '#14b8a6' },
] as const

/** 左栏 · 日期筛选 */
export const LEFT_DATE_FILTER = { unit: '月', value: '2026-06' } as const

export const THIRD_PARTY_STATS = [
  { label: '本期库存', value: '-' },
  { label: '本期入库', value: '-' },
  { label: '本期出库', value: '-' },
  { label: '前期库存', value: '-' },
] as const

export const THIRD_PARTY_BAR_CATEGORIES = ['细胞类', '血液类', '体液类', '衍生类', '其他类'] as const

/** 本期库存 / 前期库存 分组柱（示意图为空数据） */
export const THIRD_PARTY_GROUPED_BARS = THIRD_PARTY_BAR_CATEGORIES.map((label) => ({
  label,
  current: 0,
  previous: 0,
}))

export const RESEARCH_STATS = [
  { label: '本期入库', value: '-' },
  { label: '本期出库', value: '-' },
  { label: '本期借出', value: '-' },
  { label: '本期返还', value: '-' },
] as const

export const RESEARCH_INVENTORY = [
  { unit: '一管/块/张', label: '本期库存' },
  { unit: '一管/块/张', label: '前期库存' },
] as const

export const RESEARCH_BAR_CATEGORIES = ['冻存组织', '血液样本', '石蜡样本'] as const

export const RESEARCH_GROUPED_BARS = RESEARCH_BAR_CATEGORIES.map((label) => ({
  label,
  current: 0,
  previous: 0,
}))

export const HEALTH_MONTHS = ['五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'] as const

/** 按数据 · 数据总量(亿)，Y 轴 0–2500 */
export const HEALTH_DATA_VOLUME = [0, 45, 75, 120, 480, 1050, 1720, 2250] as const

/** 按人口（演示：平缓曲线） */
export const HEALTH_POPULATION = [0, 30, 55, 90, 180, 320, 520, 780] as const

export const HEALTH_Y_MAX = 2500
export const HEALTH_Y_TICKS = [0, 500, 1000, 1500, 2000, 2500] as const
export const HEALTH_LEGEND = '数据总量(亿)'

export const GROUPED_BAR_LEGEND = [
  { label: '本期库存', color: '#00a8e8' },
  { label: '前期库存', color: '#ff9a2e' },
] as const

export const GROUPED_BAR_Y_MAX = 1
export const GROUPED_BAR_Y_TICKS = [0, 0.2, 0.4, 0.6, 0.8, 1] as const

/** 右栏 · ccHpMM */
export const CCHPMM_STATS = [
  { value: '20821', label: 'Hp菌株数' },
  { value: '44895', label: '胃黏膜组织数' },
  { value: '474', label: '粪便样本例数' },
] as const

export const CYP2C19 = [
  { label: '中代谢型', value: 38, color: '#1e4a8a' },
  { label: '快代谢型', value: 34, color: '#00b7ee' },
  { label: '慢代谢型', value: 28, color: '#22c55e' },
] as const

export const ANTIBIOTIC_RESISTANCE = [
  { label: '克拉霉素', value: 52 },
  { label: '左氧氟沙星', value: 42 },
  { label: '阿莫西林', value: 0 },
  { label: '呋喃唑酮', value: 0 },
  { label: '四环素', value: 0 },
  { label: '甲硝唑', value: 90 },
] as const

export const ACHIEVEMENT_TREND = [208, 228, 248] as const
export const ACHIEVEMENT_YEARS = ['2023年', '2024年', '2025年'] as const
export const ACHIEVEMENT_Y_MIN = 210
export const ACHIEVEMENT_Y_MAX = 248
export const ACHIEVEMENT_TABS = ['重大项目', '奖项', '国家标准', '专利申请', '软著'] as const
export const ACHIEVEMENT_LEGEND = '重大项目'

export const DRUG_CERT_CATEGORIES = ['第一类医疗器械', '第二类医疗器械', '第三类医疗器械', 'CE'] as const

export const DRUG_CERT_SERIES = [
  { year: '2022年', color: '#1e4a8a', values: [17, 10, 7, 8] },
  { year: '2023年', color: '#00b7ee', values: [19, 10, 7, 8] },
  { year: '2024年', color: '#ff9a2e', values: [20, 10, 8, 8] },
] as const

export const DRUG_CERT_X_MAX = 20

export const SMART_OPS_MENU = [
  { label: '协同办公' },
  { label: '人力资源' },
  { label: '智慧园区' },
  { label: '入孵管理', to: '/console' },
] as const
