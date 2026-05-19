import type { ModuleFeatureDef } from './types'

export const evalPortrait: ModuleFeatureDef = {
  moduleLabel: '孵化评估',
  pageCode: '4.1',
  pageTitle: 'AI 项目画像',
  phase: 'V2',
  intro: '构建多维画像支撑精细化运营。',
  features: [
    {
      name: '多维度画像展示',
      desc: '聚合基础信息、技术路线、管线、团队与融资视图。',
      flow: '页面分区滚动浏览。',
      ai: '✨ AI生成：定期刷新画像快照',
    },
    {
      name: '资源需求 / 使用 / 供给画像',
      desc: '刻画资源契合度与利用率。',
      flow: '图表 + 明细表。',
      ai: '✨ AI分析：识别异常消耗模式',
    },
    {
      name: 'AI 能力使用 / 生态贡献 / 风险画像',
      desc: '叠加 AI Skill 用量与生态互动。',
      flow: '雷达图 + 标签云。',
      ai: '✨ AI风险识别：提示高风险标签',
    },
  ],
}

export const evalGrowthTracking: ModuleFeatureDef = {
  moduleLabel: '孵化评估',
  pageCode: '4.2',
  pageTitle: '项目成长跟踪',
  phase: 'V2',
  intro: '对齐里程碑并捕获外部情报。',
  features: [
    {
      name: '研发 / 管线 / 融资 / 专利 / 注册 / 临床跟踪',
      desc: '结构化沉淀关键里程碑。',
      flow: '手动录入或导入。',
      ai: '✨ AI跟踪：提示外部数据库新增进展',
    },
    {
      name: '团队 / 资源使用 / AI 资源跟踪',
      desc: '洞察人力投入与资源曲线。',
      flow: '趋势图组件。',
      ai: '✨ AI趋势预测：预估资源需求峰值',
    },
    {
      name: '重大事件记录',
      desc: '沉淀战略性节点。',
      flow: '事件时间轴。',
      ai: '✨ AI事件挖掘：抓取融资 / 获批新闻',
    },
  ],
}

export const evalGrowthScore: ModuleFeatureDef = {
  moduleLabel: '孵化评估',
  pageCode: '4.3',
  pageTitle: 'AI 成长评分',
  phase: 'V2',
  intro: '量化成长性并识别黑马项目。',
  features: [
    {
      name: '多维度自动评分',
      desc: '覆盖技术、商业化、融资与活跃度。',
      flow: '点击「✨ 刷新评分」。',
      ai: '✅ AI Skill：growth_score_calc',
    },
    {
      name: '高潜力项目识别',
      desc: '自动打标签并入榜单。',
      flow: '定时任务写入。',
      ai: '✅ AI Skill：high_potential_finder',
    },
  ],
}

export const evalEffectiveness: ModuleFeatureDef = {
  moduleLabel: '孵化评估',
  pageCode: '4.4',
  pageTitle: '孵化成效评价',
  phase: 'V2',
  intro: '衡量孵化产出并形成复盘材料。',
  features: [
    {
      name: '项目成长 / 里程碑达成评价',
      desc: '对照计划输出达成率。',
      flow: '仪表盘卡片。',
      ai: '✨ AI总结：生成长摘要',
    },
    {
      name: '融资 / 技术 / AI 赋能成果评价',
      desc: '量化专项 KPI。',
      flow: '多维柱状图。',
      ai: '无',
    },
    {
      name: '园区孵化成效 / 生态活跃度评价',
      desc: '宏观视角聚合。',
      flow: '运营驾驶舱接入。',
      ai: '✨ AI报告：生成季度复盘草稿',
    },
  ],
}

export const evalRiskAlerts: ModuleFeatureDef = {
  moduleLabel: '孵化评估',
  pageCode: '4.5',
  pageTitle: '风险预警',
  phase: 'V2',
  intro: '前置识别活跃度与合规风险。',
  features: [
    {
      name: '多维度风险自动预警',
      desc: '覆盖活跃度、研发停滞、融资风险等。',
      flow: '规则 + 模型驱动推送。',
      ai: '✅ AI Skill：risk_detector',
    },
  ],
}

export const evalIncubationAdvice: ModuleFeatureDef = {
  moduleLabel: '孵化评估',
  pageCode: '4.6',
  pageTitle: 'AI 孵化建议生成',
  phase: 'V2',
  intro: '输出个性化赋能清单。',
  features: [
    {
      name: '智能推荐赋能资源',
      desc: '推送专家、政策、融资及实验资源。',
      flow: '点击「✨ 获取建议」。',
      ai: '✅ AI Skill：incubation_advisor',
    },
    {
      name: '重点培育 / 虚拟转实体 / 毕业建议',
      desc: '在项目详情呈现策略卡片。',
      flow: '系统自动刷新。',
      ai: '✅ AI Skill：incubation_advisor',
    },
  ],
}
