import type { ModuleFeatureDef } from './types'

export const hatchSigning: ModuleFeatureDef = {
  moduleLabel: '入孵管理',
  pageCode: '2.1',
  pageTitle: '入孵签约管理',
  intro: '承接策源模块结论，落地协议签署与费用条款。',
  features: [
    {
      name: '入孵决策接收与类型确认',
      desc: '读取已通过的项目结论并锁定孵化路径。',
      flow: '系统自动带入 → 运营复核确认。',
      ai: '无',
    },
    {
      name: '入孵需求确认',
      desc: '复核空间面积、实验级别与共享设备诉求。',
      flow: '勾选清单 → 生成签约附录草稿。',
      ai: '✨ AI推荐：推荐空间与设备套餐组合',
    },
    {
      name: '入孵协议生成与合同模板管理',
      desc: '基于模板拼装个性化协议正文。',
      flow: '选择模板 → 「✨ 生成协议」→ 法务预览。',
      ai: '✅ AI Skill：contract_generator',
    },
    {
      name: '费用规则确认与签约跟踪',
      desc: '固化物业费、服务费与押金条款并跟踪签署进度。',
      flow: '勾选费用项 → 保存 → 电子签进度可视。',
      ai: '无',
    },
    {
      name: '合同到期提醒',
      desc: '按续约窗口自动推送提醒。',
      flow: '定时任务扫描合同 → 触发提醒工单。',
      ai: '无',
    },
  ],
}

export const hatchArchive: ModuleFeatureDef = {
  moduleLabel: '入孵管理',
  pageCode: '2.2',
  pageTitle: '入孵项目档案',
  intro: '沉淀项目画像与里程碑证据，支撑审计与复盘。',
  features: [
    {
      name: '项目基础档案',
      desc: '维护工商信息、联系人及孵化路径。',
      flow: '表单编辑 → 版本记录。',
      ai: '无',
    },
    {
      name: '入孵身份与标签管理',
      desc: '定义虚拟 / 实体 / 服务商认证身份并维护标签。',
      flow: '多选标签 → 自定义扩展。',
      ai: '✨ AI打标：依据资料自动推荐标签',
    },
    {
      name: '管线 / 团队 / 融资 / 知识产权档案',
      desc: '结构化登记管线节点与附件。',
      flow: '表单 + 批量附件。',
      ai: '✨ AI提取：解析文档回填结构化字段',
    },
    {
      name: '评估记录与重大事件关联',
      desc: '串联历次 AI / 专家评审结论。',
      flow: '手动新增里程碑 → 绑定附件。',
      ai: '✨ AI事件挖掘：提示潜在里程碑事件',
    },
    {
      name: '档案变更记录与 AI 画像关联',
      desc: '保留字段修改轨迹并可回溯画像。',
      flow: '系统自动审计日志。',
      ai: '无',
    },
  ],
}

export const hatchIdentity: ModuleFeatureDef = {
  moduleLabel: '入孵管理',
  pageCode: '2.3',
  pageTitle: '入孵身份与状态',
  intro: '维护孵化身份矩阵并驱动权限 / 资源的联动。',
  features: [
    {
      name: '入孵类型配置',
      desc: '定义实体 / 虚拟 / 服务商等多类型认证模板。',
      flow: '后台配置 → 租户生效。',
      ai: '无',
    },
    {
      name: '入孵状态管理',
      desc: '跟踪待签约、已入驻、暂停、退出等状态。',
      flow: '列表批量流转 → 写入变更原因。',
      ai: '✨ AI状态建议：依据活跃度提示调整建议',
    },
    {
      name: '类型转换审批',
      desc: '处理虚拟转实体等路径切换。',
      flow: '在线申请 → 运营审批。',
      ai: '无',
    },
    {
      name: '状态同步',
      desc: '向权限中心、孪生与资源目录广播最新状态。',
      flow: '事件总线异步推送。',
      ai: '无',
    },
  ],
}

export const hatchPhysicalSpace: ModuleFeatureDef = {
  moduleLabel: '入孵管理',
  pageCode: '2.4',
  pageTitle: '实体空间入孵',
  intro: '把孵化路径绑定到真实园区房间并完成交接。',
  features: [
    {
      name: '项目空间绑定与交接管理',
      desc: '在孪生地图上绑定房间并生成交接清单。',
      flow: '地图点选房间 → 填写交接记录。',
      ai: '✨ AI推荐：依据人数与工艺推荐楼层区域',
    },
    {
      name: '空间使用记录与到期提醒',
      desc: '登记扩租 / 缩租并触发续约提醒。',
      flow: '手动录入变更 → SLA 跟进。',
      ai: '无',
    },
    {
      name: '空间状态同步',
      desc: '房间占用状态实时刷新孪生图层。',
      flow: '后台事件驱动前端着色。',
      ai: '无',
    },
  ],
}

export const hatchChanges: ModuleFeatureDef = {
  moduleLabel: '入孵管理',
  pageCode: '2.5',
  pageTitle: '项目变更管理',
  intro: '沉淀各类变更审批证据以满足合规审计。',
  features: [
    {
      name: '信息 / 赛道 / 阶段 / 类型 / 空间变更',
      desc: '统一受理多维变更申请。',
      flow: '线上表单 → 附件佐证。',
      ai: '✨ AI合规检查：校验是否触碰协议红线',
    },
    {
      name: '变更审批与归档',
      desc: '多级审批完成后归档快照。',
      flow: '审批流引擎 → PDF 归档。',
      ai: '无',
    },
  ],
}

export const hatchExit: ModuleFeatureDef = {
  moduleLabel: '入孵管理',
  pageCode: '2.6',
  pageTitle: '项目退出 / 毕业管理',
  intro: '闭环孵化生命周期并妥善处理知识产权沉淀。',
  features: [
    {
      name: '退出 / 毕业申请与审批',
      desc: '收集退出原因或毕业佐证材料。',
      flow: '项目发起 → 运营复核。',
      ai: '✨ AI毕业评估：对照里程碑判断是否达标',
    },
    {
      name: '资源释放与权限关闭',
      desc: '自动回收门禁、账号与实验预约额度。',
      flow: '审批通过触发脚本。',
      ai: '无',
    },
    {
      name: '私有知识库处理',
      desc: '支持导出、封存或销毁策略。',
      flow: '责任人勾选处理方式。',
      ai: '✨ AI归档：打包目录索引',
    },
    {
      name: '档案归档与生态伙伴转化',
      desc: '转入历史档案并可标记生态伙伴身份。',
      flow: '系统自动归档 → 手动转化。',
      ai: '无',
    },
  ],
}

export const hatchAiPermissions: ModuleFeatureDef = {
  moduleLabel: '入孵管理',
  pageCode: '2.7',
  pageTitle: 'AI 服务权限管理',
  phase: 'V2',
  intro: '统筹租户可用的 AI Skill 配额与计费。',
  features: [
    {
      name: 'AI 服务套餐与调用额度',
      desc: '配置项目可用的 AI 能力与月度额度。',
      flow: '后台套餐编辑器保存 → 租户即时生效。',
      ai: '✨ AI建议：结合等级推荐套餐档位',
    },
    {
      name: '使用记录与停用',
      desc: '追踪调用明细并对违规租户熔断。',
      flow: '实时监控仪表盘 → 一键停用。',
      ai: '无',
    },
  ],
}
