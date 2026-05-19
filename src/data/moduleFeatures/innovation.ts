import type { ModuleFeatureDef } from './types'

export const innovationProjectRegistration: ModuleFeatureDef = {
  moduleLabel: '科创策源',
  pageCode: '1.1',
  pageTitle: '项目注册管理',
  intro: '面向企业 / 高校 / 研究所 / 医院等主体完成项目侧注册与候选池沉淀。',
  features: [
    {
      name: '项目账号注册',
      desc: '支持企业、高校、研究所、医院四类主体注册，采集登录与组织信息。',
      flow: '用户选择主体类型 → 填写表单 → 提交 → 进入审核。',
      ai: '无',
    },
    {
      name: '项目基础信息填写',
      desc: '采集项目名称、主体名称、统一社会信用代码等关键登记信息。',
      flow: '表单输入，实时校验（信用代码、必填项等）。',
      ai: '无',
    },
    {
      name: '项目来源类型选择',
      desc: '按来源类型分流展示字段与校验规则。',
      flow: '下拉选择主体类型 → 动态刷新表单分区。',
      ai: '无',
    },
    {
      name: '赛道 / 阶段 / 意向选择',
      desc: '选择三大先导产品赛道、当前项目阶段与入驻意向。',
      flow: '下拉与多选组合，自动联动推荐字段。',
      ai: '无',
    },
    {
      name: '注册状态管理',
      desc: '管理待提交、待审核、补充材料、评估中、已转入等状态。',
      flow: '状态机自动流转；运营在异常场景可手动纠偏。',
      ai: '无',
    },
    {
      name: '候选项目池管理',
      desc: '统一查看尚未正式入孵的注册与线索项目。',
      flow: '列表 + 多维筛选 + 搜索；支持批量打标签。',
      ai: '无',
    },
  ],
}

export const innovationProjectMaterials: ModuleFeatureDef = {
  moduleLabel: '科创策源',
  pageCode: '1.2',
  pageTitle: '项目资料管理',
  intro: '沉淀主体资质、商业与研发材料，并校验资料完整度。',
  features: [
    {
      name: '主体资质证明上传',
      desc: '按主体类型上传营业执照、法人证书或授权证明文件。',
      flow: '文件上传组件，支持 PDF / 图片等多格式；校验大小与清晰度。',
      ai: '无',
    },
    {
      name: '项目介绍 / 商业计划书',
      desc: '上传 BP、融资材料、科研计划书等。',
      flow: '拖拽上传 → 自动生成封面预览卡片。',
      ai: '✨ AI摘要：自动提取 BP 核心亮点生成项目摘要',
    },
    {
      name: '技术 / 知识产权资料',
      desc: '上传技术路线说明、专利证书、论文列表等。',
      flow: '多文件批量上传，支持标签归类。',
      ai: '✨ AI解析：识别关键技术词、专利号与期刊信息',
    },
    {
      name: '融资 / 资金资料',
      desc: '填写融资轮次、金额区间及投资机构等信息。',
      flow: '结构化表单录入并与附件联动归档。',
      ai: '✨ AI提取：从融资协议抽取要点自动回填字段',
    },
    {
      name: '团队构成资料',
      desc: '登记核心团队成员并上传简历附件。',
      flow: '表单 + 附件列表管理。',
      ai: '✨ AI解析：从简历抽取姓名、职务与背景摘要',
    },
    {
      name: '资源需求填写',
      desc: '声明空间、设备、专家服务及资金等资源诉求。',
      flow: '多选模板 + 自由文本描述。',
      ai: '✨ AI推荐：结合赛道与阶段推荐常用需求模板',
    },
    {
      name: '服务能力填写',
      desc: '登记可对外共享的实验、临床或生产能力。',
      flow: '多选 + 结构化开放范围字段。',
      ai: '无',
    },
    {
      name: '资料完整性检查',
      desc: '按配置规则自动检测缺失项并高亮提示。',
      flow: '保存时校验；提供「一键补齐」入口。',
      ai: '✨ AI完整性报告：输出缺失清单与补充建议',
    },
    {
      name: '资料补充提醒',
      desc: '向项目方推送资料补充或更新通知。',
      flow: '规则引擎触发站内信 / 邮件；记录回执。',
      ai: '✨ AI拟稿：生成个性化提醒话术',
    },
  ],
}

export const innovationAiEvaluation: ModuleFeatureDef = {
  moduleLabel: '科创策源',
  pageCode: '1.3',
  pageTitle: 'AI 智能评估',
  intro: '以多源材料为输入，输出评分、可行性建议与结构化研判报告。',
  features: [
    {
      name: 'AI 资料解析',
      desc: '解析多格式文档，抽取结构化字段与风险点。',
      flow: '点击「✨ AI 解析」→ 选择文件 → 返回 JSON 视图并可写回表单。',
      ai: '✅ AI Skill：document_parser',
    },
    {
      name: 'AI 初筛评分',
      desc: '从产业匹配度、技术创新性、团队成熟度等维度给出评分。',
      flow: '点击「✨ 智能评分」→ 展示雷达图与分项得分。',
      ai: '✅ AI Skill：project_pre_score',
    },
    {
      name: 'AI 入孵可行性判断',
      desc: '输出实体入孵 / 虚拟孵化 / 观察培育 / 暂不通过建议。',
      flow: '模型推理完成后写入评审纪要草稿。',
      ai: '✅ AI Skill：feasibility_judge',
    },
    {
      name: 'AI 项目研判报告',
      desc: '生成项目画像、匹配度分析、招商价值与策略建议。',
      flow: '点击「✨ 生成报告」→ HTML 预览 → 导出 PDF。',
      ai: '✅ AI Skill：research_report_gen',
    },
  ],
}

export const innovationExpertReview: ModuleFeatureDef = {
  moduleLabel: '科创策源',
  pageCode: '1.4',
  pageTitle: '专家评审管理',
  intro: '调度外部专家资源，沉淀评分表与共识纪要。',
  features: [
    {
      name: '专家分配与任务管理',
      desc: '依据学科与技术关键词匹配专家并下发评审任务。',
      flow: '运营勾选专家 → 生成任务 → 系统推送通知。',
      ai: '✨ AI推荐：推荐匹配度最高的 3 位专家',
    },
    {
      name: '项目资料在线查看',
      desc: '专家在隔离视图中预览附件与水印 PDF。',
      flow: '专家登录 → 打开任务 → 在线预览。',
      ai: '无',
    },
    {
      name: '专家评分与意见填写',
      desc: '按照模板录入分项评分与定性意见。',
      flow: '填写评分表 → 校验必填 → 提交。',
      ai: '✨ AI辅助填写：基于 AI 评估预填 editable 字段',
    },
    {
      name: '多专家意见汇总',
      desc: '并列展示各专家结论，辅助运营形成综合意见。',
      flow: '列表 + 对照视图 → 导出评审纪要素材。',
      ai: '✨ AI汇总：提炼共识与分歧点',
    },
    {
      name: '专家评审归档',
      desc: '按项目自动打包评审证据与评分表。',
      flow: '流程结束触发归档 → 与项目主档关联。',
      ai: '无',
    },
  ],
}

export const innovationIncubationDecision: ModuleFeatureDef = {
  moduleLabel: '科创策源',
  pageCode: '1.5',
  pageTitle: '入孵决策管理',
  intro: '把专家评估结论转换为正式孵化路径并触发下游入驻流程。',
  features: [
    {
      name: '实体 / 虚拟入孵通过',
      desc: '确认入孵路径并写入审批凭证。',
      flow: '运营点击「通过」→ 选择实体或虚拟 → 提交。',
      ai: '无',
    },
    {
      name: '观察培育 / 暂不通过',
      desc: '对潜力项目进行跟踪或对不符合要求的申请结案。',
      flow: '点击对应结论 → 填写原因 → 触发模板通知。',
      ai: '无',
    },
    {
      name: '决策结果通知',
      desc: '通知项目团队及参评专家。',
      flow: '系统自动发送站内消息 / 邮件。',
      ai: '✨ AI拟稿：生成个性化通知正文',
    },
    {
      name: '转入入孵管理',
      desc: '同步创建入驻工单与档案骨架。',
      flow: '审批通过后自动写入「入孵管理」队列。',
      ai: '无',
    },
  ],
}

export const innovationIndustryTrends: ModuleFeatureDef = {
  moduleLabel: '科创策源',
  pageCode: '1.6',
  pageTitle: '行业趋势分析',
  phase: 'V2',
  intro: '通过情报汇聚与图谱模型识别产业链机会与高潜力标的。',
  features: [
    {
      name: '产业方向配置',
      desc: '维护园区重点招商方向与技术标签。',
      flow: '运营维护标签体系 → 同步搜索排序权重。',
      ai: '✨ AI分析：基于行业报告给出招商方向建议',
    },
    {
      name: '目标项目线索采集',
      desc: '聚合路演、展会、公开数据库及第三方接口线索。',
      flow: '手动录入或 API 拉取 → 去重入库。',
      ai: '✨ AI匹配：从专利 / 融资新闻发现线索',
    },
    {
      name: '产业链上下游识别',
      desc: '标注上下游潜在合作伙伴并建立关系边。',
      flow: '运营在图谱界面增删节点与关系。',
      ai: '✨ AI推荐：结合在园项目推荐上下游企业',
    },
    {
      name: '高潜力项目 AI 推荐',
      desc: '输出重点跟进榜单与推荐理由。',
      flow: '点击「✨ 智能推荐」→ 查看列表并可一键建项。',
      ai: '✅ AI Skill：high_potential_finder',
    },
    {
      name: '招商线索池管理',
      desc: '维护线索等级、状态与责任人。',
      flow: '列表 + 筛选 + SLA 仪表盘。',
      ai: '✨ AI分级：自动给出 S/A/B/C 线索等级',
    },
  ],
}

export const innovationOutreach: ModuleFeatureDef = {
  moduleLabel: '科创策源',
  pageCode: '1.7',
  pageTitle: '招商触达辅助',
  phase: 'V2',
  intro: '生成高转化触达物料，并用模型评估沟通效果。',
  features: [
    {
      name: '话术 / 邮件 / 推介 / 入孵方案生成',
      desc: '结合项目画像批量生成个性化沟通素材。',
      flow: '选择线索 → 「✨ 生成话术」→ 预览 → 复制 / 发送。',
      ai: '✅ AI Skill：touch_copy_gen',
    },
    {
      name: '跟进记录摘要与转化分析',
      desc: '沉淀触达记录并预测成交概率。',
      flow: '录入沟通记录 → 「✨ 分析转化」→ 展示概率区间。',
      ai: '✅ AI Skill：conversion_analyzer',
    },
  ],
}
