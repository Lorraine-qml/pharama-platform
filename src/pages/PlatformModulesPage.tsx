import { Link } from 'react-router-dom'

const MODULES = [
  {
    title: '仪表盘 · 工作台',
    schematic: `
┌─────────────────────────────────┐
│ 顶栏 · 通知 · 账号               │
├───┬─────────────────────────────┤
│侧 │ KPI卡片 KPI KPI KPI          │
│栏 │ ─────────────────────────── │
│   │ 折线图 / 柱状图    │ TOP列表  │
└───┴─────────────────────────────┘`,
    points: [
      '总览孵化项目、资源使用、AI 调用等关键指标。',
      '快捷入口跳转各业务模块，支持按角色裁剪可见菜单。',
    ],
  },
  {
    title: '项目管理 · 策源招商',
    schematic: `
┌─────────────────────────────────┐
│ 筛选 │ 搜索……      │ [新建线索] │
├─────────────────────────────────┤
│ 线索 │ 阶段 │ AI评级 │ 跟进 │ ⋯ │
├─────────────────────────────────┤
│ ...表格行 / 分页 ...             │
└─────────────────────────────────┘`,
    points: ['线索池汇聚招商线索与 AI 评分；抽屉跟进与附件沉淀。', '入驻评估报告支持雷达图与人工修订、专家评审发起。'],
  },
  {
    title: '入驻服务 · 身份与空间',
    schematic: `
┌─────────────────────────────────┐
│ 平面图孪生 │ 楼栋层 │ 房间状态   │
├─────────────────────────────────┤
│ ▢ ▢ █ ▢                       │
│ █ = 已占 ▢ = 可选               │
└─────────────────────────────────┘`,
    points: ['实体空间分配结合平面图占位与选房确认流程。', '企业档案多标签维护入驻身份、套餐与画像数据。'],
  },
  {
    title: '资源中心 · 赋能',
    schematic: `
┌─────────────────────────────────┐
│ 资源卡片 │ 评分 │ [预约向导]    │
├─────────────────────────────────┤
│ 时段选择 → 用途 → 提交申请单    │
└─────────────────────────────────┘`,
    points: ['仪器设备与服务等资源的详情、时段预约与审批占位。', 'AI 供需撮合为企业推荐匹配资源与合作方。'],
  },
  {
    title: '孵化成长 · 运营',
    schematic: `
┌─────────────────────────────────┐
│ 成长评分 78 │ 风险预警 │ 邮件模版 │
├─────────────────────────────────┤
│ 维度雷达 │ AI 建议摘要           │
└─────────────────────────────────┘`,
    points: ['跟踪企业技术与商业化成长维度；触发运营触达动作占位。'],
  },
  {
    title: '数字孪生 · 园区空间',
    schematic: `
┌─────────────────────────────────┐
│ [图层] 企业 · 资源 · 预警       │
├─────────────────────────────────┤
│      3D / 平面图视窗占位        │
│          ●告警点位             │
└─────────────────────────────────┘`,
    points: ['园区孪生总览与图层切换；告警点位与详情弹窗占位。'],
  },
  {
    title: 'AI 能力中台',
    schematic: `
┌─────────────────────────────────┐
│ 触发器 ─► Skill ─► 大模型 ─► 写入 │
│        画布编排（低代码占位）    │
└─────────────────────────────────┘`,
    points: ['智能体与流程编排；统一调用模型与 Skill，可发布为可复用能力。'],
  },
  {
    title: '运营驾驶舱 · 问数',
    schematic: `
┌─────────────────────────────────┐
│ 招商漏斗 ████████░░              │
│ KPI 卡片                        │
├─────────────────────────────────┤
│ AI 问数：自然语言 → 图表（占位） │
└─────────────────────────────────┘`,
    points: ['管理侧看板与漏斗；AI 问数用对话生成图表与解读（演示）。'],
  },
  {
    title: '系统管理',
    schematic: `
┌─────────────────────────────────┐
│ 角色树 + 模块权限 + 数据范围     │
│ □ 查看 □ 编辑 □ 审批            │
└─────────────────────────────────┘`,
    points: ['角色、菜单与数据范围配置占位，可与企业目录同步对接。'],
  },
] as const

export default function PlatformModulesPage() {
  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-divider bg-surface px-6 py-8 shadow-sm sm:px-10">
        <Link to="/console" className="text-[13px] font-medium text-primary hover:underline">
          ← 返回登录
        </Link>
        <h1 className="mt-6 text-[24px] font-semibold tracking-tight text-foreground">核心功能模块 · 界面示意与说明</h1>
        <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-muted">
          以下为本平台（科技蓝 #1E6DFF + 白 / 浅灰底）主要业务域的<strong className="font-medium text-foreground">布局骨架示意</strong>
          ，用于需求对齐与视觉统一；实际页面以登录后左侧树形菜单为准。
        </p>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-10 sm:px-10">
        <div className="grid gap-6 md:grid-cols-2">
          {MODULES.map((m) => (
            <article
              key={m.title}
              className="flex flex-col rounded-[var(--radius-panel)] border border-divider bg-surface p-6 shadow-[var(--shadow-card)]"
            >
              <h2 className="text-[16px] font-semibold text-primary">{m.title}</h2>
              <pre className="mt-4 overflow-x-auto rounded-[var(--radius-card)] border border-divider bg-page p-4 text-[11px] leading-snug text-foreground/90">
                {m.schematic.trim()}
              </pre>
              <ul className="mt-4 list-inside list-disc space-y-2 text-[13px] leading-relaxed text-muted">
                {m.points.map((p) => (
                  <li key={p} className="marker:text-primary">
                    {p}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className="pb-8 text-center text-[12px] text-muted">
          登录方式：<span className="font-medium text-foreground">仅支持账号 + 密码</span>
          （用户名或邮箱）。© 2025 园区运营平台
        </p>
      </main>
    </div>
  )
}
