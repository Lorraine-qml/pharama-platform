import type { ModuleFeatureDef } from './types'

export const resopsTypes: ModuleFeatureDef = {
  moduleLabel: '资源运营',
  pageCode: '3.1',
  pageTitle: '资源类型管理',
  intro: '搭建统一的资源本体模型与扩展字段。',
  features: [
    {
      name: '资源分类体系与属性配置',
      desc: '定义空间、设备、样本、专家等大类及扩展属性。',
      flow: '后台配置页面编辑 Schema。',
      ai: '无',
    },
  ],
}

export const resopsRegistration: ModuleFeatureDef = {
  moduleLabel: '资源运营',
  pageCode: '3.2',
  pageTitle: '资源登记管理',
  intro: '引导供给方登记资源并可追踪草稿。',
  features: [
    {
      name: '资源注册入口与信息登记',
      desc: '提供统一的资源建档向导。',
      flow: '分步表单填写 → 校验必填。',
      ai: '✨ AI辅助：根据名称推荐分类与标签',
    },
    {
      name: '能力描述 / 资质材料 / 开放范围 / 收费规则',
      desc: '细化服务能力与合规附件。',
      flow: '上传附件 → 表单结构化录入。',
      ai: '✨ AI解析：抽取有效期与适用范围',
    },
    {
      name: '草稿保存与提交',
      desc: '允许保存草稿并完成准入提交。',
      flow: '保存草稿 → 预览 → 提交审核。',
      ai: '无',
    },
  ],
}

export const resopsReviewAdmission: ModuleFeatureDef = {
  moduleLabel: '资源运营',
  pageCode: '3.3',
  pageTitle: '资源审核与准入',
  intro: '保障上架资源符合园区治理标准。',
  features: [
    {
      name: '资源审核流程',
      desc: '串联质检、法务与安全复核节点。',
      flow: '运营接收队列 → 填写意见。',
      ai: '✨ AI审核预检：检测材料缺失与过期资质',
    },
    {
      name: '审核意见 / 退回补充 / 准入通过 / 拒绝',
      desc: '标准化审核动作并可附带模板。',
      flow: '按钮驱动流程 → 必填意见。',
      ai: '✨ AI拟稿：生成退回补充模板',
    },
  ],
}

export const resopsCatalog: ModuleFeatureDef = {
  moduleLabel: '资源运营',
  pageCode: '3.4',
  pageTitle: '资源目录与上架',
  intro: '面向需求侧的可发现目录与曝光策略。',
  features: [
    {
      name: '资源目录管理与详情页',
      desc: '维护列表 / 卡片视图与详情。',
      flow: 'CMS 编排字段 → 发布。',
      ai: '无',
    },
    {
      name: '上架 / 下架 / 状态设置',
      desc: '控制需求侧可见性与库存。',
      flow: '批量切换状态。',
      ai: '✨ AI建议：依据预约率建议下架低效资源',
    },
    {
      name: '搜索 / 筛选 / 推荐位',
      desc: '提供多维检索与运营推荐位。',
      flow: '关键词输入 → 排序刷新。',
      ai: '✨ AI智能排序：结合画像动态排序',
    },
    {
      name: '评价与使用统计展示',
      desc: '沉淀评分与利用率。',
      flow: '系统自动聚合图表。',
      ai: '无',
    },
  ],
}

export const resopsSpatialBind: ModuleFeatureDef = {
  moduleLabel: '资源运营',
  pageCode: '3.5',
  pageTitle: '资源空间绑定',
  intro: '把设备与服务映射到孪生坐标。',
  features: [
    {
      name: '实体空间 / 设备位置绑定',
      desc: '把设备锚点到园区图层。',
      flow: '拖拽绑定 → 保存坐标。',
      ai: '无',
    },
    {
      name: '专家资源位置配置',
      desc: '标注线下实验室或服务半径。',
      flow: '表单配置地理围栏。',
      ai: '无',
    },
  ],
}

export const resopsStatus: ModuleFeatureDef = {
  moduleLabel: '资源运营',
  pageCode: '3.6',
  pageTitle: '资源状态管理',
  intro: '实时感知资源可用性与异常。',
  features: [
    {
      name: '状态维护',
      desc: '支持手动或 IoT 驱动的状态刷新。',
      flow: '供给方更新或系统自动写入。',
      ai: '✨ AI异常检测：识别离线或未归还风险',
    },
    {
      name: '状态变更记录与异常提醒',
      desc: '沉淀轨迹并向管理员告警。',
      flow: '推送站内消息。',
      ai: '无',
    },
  ],
}

export const resopsBooking: ModuleFeatureDef = {
  moduleLabel: '资源运营',
  pageCode: '3.7',
  pageTitle: '资源申请与预约',
  intro: '面向租户的一站式预约入口。',
  features: [
    {
      name: '申请提交与信息填写',
      desc: '填写用途、样品信息与联系人。',
      flow: '选择资源 → 表单校验。',
      ai: '✨ AI智能推荐时段：依据偏好给出时间段建议',
    },
    {
      name: '预约时间选择与冲突检测',
      desc: '日历控件实时校验占用。',
      flow: '拖拽时间段 → 即时反馈。',
      ai: '无',
    },
    {
      name: '申请状态跟踪',
      desc: '展示排队、驳回与执行中等节点。',
      flow: '列表 + 详情抽屉。',
      ai: '无',
    },
    {
      name: '申请取消 / 变更 / 记录查询',
      desc: '允许在规定时间内自助调整。',
      flow: '按钮触发二次确认。',
      ai: '无',
    },
  ],
}

export const resopsApplicationReview: ModuleFeatureDef = {
  moduleLabel: '资源运营',
  pageCode: '3.8',
  pageTitle: '资源审核与确认',
  intro: '多方协同确认高风险预约。',
  features: [
    {
      name: '提供方确认与平台审核',
      desc: '设备主人确认可行性后平台抽检。',
      flow: '两级按钮流转。',
      ai: '✨ AI风险评估：识别生物安全等高风险预约',
    },
    {
      name: '多级审批',
      desc: '支持配置多级审批模板。',
      flow: '可视化编排审批链。',
      ai: '无',
    },
    {
      name: '申请通过生成使用单 / 驳回',
      desc: '自动生成执行单据。',
      flow: '通过后写入工单编号。',
      ai: '无',
    },
  ],
}

export const resopsUsageOrders: ModuleFeatureDef = {
  moduleLabel: '资源运营',
  pageCode: '3.9',
  pageTitle: '资源使用单管理',
  intro: '闭环记录交付结果并沉淀满意度。',
  features: [
    {
      name: '使用单生成与编号',
      desc: '唯一编码串联结算与追溯。',
      flow: '系统自动编号。',
      ai: '无',
    },
    {
      name: '执行结果记录与评价',
      desc: '上传实验记录或检测报告。',
      flow: '提交完成 → 双向评分。',
      ai: '✨ AI评价分析：抽取关键词生成满意度趋势',
    },
    {
      name: '使用单归档',
      desc: '审计友好的封存策略。',
      flow: '完成后自动封存。',
      ai: '无',
    },
  ],
}

export const resopsProviderWorkbench: ModuleFeatureDef = {
  moduleLabel: '资源运营',
  pageCode: '3.10',
  pageTitle: '资源提供方工作台',
  intro: '赋能供给侧自助维护资源与预约履约。',
  features: [
    {
      name: '我的资源与信息维护',
      desc: '查看自有资源矩阵。',
      flow: '列表 → 编辑。',
      ai: '无',
    },
    {
      name: '申请处理与使用单管理',
      desc: '受理预约并跟踪执行。',
      flow: '卡片审批 → 备注。',
      ai: '无',
    },
    {
      name: '执行结果上传与评价查看',
      desc: '提交交付附件并浏览反馈。',
      flow: '上传文件 → 关联工单。',
      ai: '无',
    },
    {
      name: '运营数据统计',
      desc: '查看预约量与收益。',
      flow: '图表仪表盘。',
      ai: '✨ AI报告：生成资源运营周报',
    },
  ],
}

export const resopsReputation: ModuleFeatureDef = {
  moduleLabel: '资源运营',
  pageCode: '3.11',
  pageTitle: '资源评价与信用',
  phase: 'V2',
  intro: '构建供给侧信用画像支撑撮合。',
  features: [
    {
      name: '双向互评',
      desc: '租户与供给方互相打分。',
      flow: '完成后弹出评价表单。',
      ai: '✨ AI情感分析：提炼评语情感倾向',
    },
    {
      name: '资源评分与提供方信用分',
      desc: '融合履约率与星级。',
      flow: '夜间任务汇总。',
      ai: '✨ AI信用模型：综合履约 / 投诉加权',
    },
    {
      name: '投诉管理与低分预警',
      desc: '客服闭环并触发熔断。',
      flow: '工单流转。',
      ai: '✨ AI预警：低分资源推送管理员',
    },
  ],
}

export const resopsSupervision: ModuleFeatureDef = {
  moduleLabel: '资源运营',
  pageCode: '3.12',
  pageTitle: '平台资源监管',
  phase: 'V2',
  intro: '总部视角的资源治理驾驶舱。',
  features: [
    {
      name: '资源总览 / 准入 / 使用 / 异常监管',
      desc: '聚合 KPI、告警与稽核队列。',
      flow: 'Tab 切换视图。',
      ai: '✨ AI异常检测：生成异常洞察简报',
    },
    {
      name: '热门 / 低效 / 供需缺口分析',
      desc: '识别结构性失衡。',
      flow: '点击「✨ 分析」。',
      ai: '✅ AI Skill：resource_gap_analysis',
    },
    {
      name: '监管报表生成',
      desc: '导出监管报送模板。',
      flow: '一键导出 Excel / PDF。',
      ai: '✨ AI报表：自动生成月度报表草稿',
    },
  ],
}
