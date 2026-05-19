import type { SjProject, SjStage, SjTimelineEvt } from './innovationTypes'

/** 导出供状态变更后重算纵向时间线 */
export function sjBaseTimeline(stage: SjStage, flags: { returned?: boolean; aiScore?: number }): SjTimelineEvt[] {
  const rows: SjTimelineEvt[] = [
    {
      id: 'tl1',
      title: '注册提交',
      tone: 'success',
      subtitle: '2025-05-10 09:15',
      detail: '处理人：项目方',
      expandable: false,
    },
  ]
  if (flags.returned) {
    rows.push({
      id: 'tl_r',
      title: '退回补充资料',
      tone: 'danger',
      subtitle: '2025-05-09 17:42',
      detail: '审批人：园区运营 · 李伟\n意见：证明材料不完整。',
      expandable: true,
    })
  }

  rows.push({
    id: 'tl_mat',
    title: '资料审核',
    tone: stage === 'pending_material_review' ? 'primary' : 'success',
    subtitle: stage !== 'pending_material_review' ? '2025-05-10 14:30 · 李四（运营） · 审核通过' : undefined,
    expandable: stage !== 'pending_material_review',
  })

  const aiDone = !['pending_material_review', 'returned_supplement'].includes(stage)
  rows.push({
    id: 'tl_ai',
    title: 'AI 评估',
    tone: aiDone ? 'success' : stage === 'pending_ai' ? 'primary' : 'muted',
    subtitle: aiDone ? `系统自动 · 综合评分 ${flags.aiScore ?? 86}` : undefined,
    expandable: aiDone,
  })

  const assignDone = ['expert_reviewing', 'review_done', 'pending_decision', 'decision_pass', 'decision_reject'].includes(stage)
  rows.push({
    id: 'tl_as',
    title: '专家分配',
    tone: assignDone ? 'success' : stage === 'pending_expert_assign' ? 'primary' : 'muted',
    subtitle: assignDone ? '2025-05-11 10:05 · 王五 · 分配 3 人' : undefined,
    expandable: assignDone,
  })

  const reviewActive = stage === 'expert_reviewing'
  rows.push({
    id: 'tl_ex',
    title: '专家评审',
    tone:
      stage === 'decision_pass' || stage === 'decision_reject'
        ? 'success'
        : reviewActive || stage === 'review_done' || stage === 'pending_decision'
          ? reviewActive || stage === 'review_done'
            ? 'primary'
            : 'success'
          : 'muted',
    subtitle:
      stage === 'expert_reviewing'
        ? '进行中'
        : stage === 'pending_decision' || stage === 'review_done'
          ? '已完成'
          : undefined,
    expandable: true,
  })

  rows.push({
    id: 'tl_dc',
    title: '入孵决策',
    tone: stage === 'decision_pass' || stage === 'decision_reject' ? 'success' : 'muted',
    subtitle:
      stage === 'decision_pass'
        ? '决策通过 · 实体入孵'
        : stage === 'decision_reject'
          ? '决策不予入孵'
          : undefined,
    expandable: Boolean(stage === 'decision_pass' || stage === 'decision_reject'),
  })

  return rows
}

export function createInitialSjProjects(): SjProject[] {
  const checklist = [
    { label: '主体资质证明', ok: true },
    { label: '项目 BP / 研究路线', ok: true },
    { label: '技术资料包', ok: false },
    { label: '核心团队简历', ok: true },
  ]

  const p1: SjProject = {
    id: 'sj-101',
    name: '基因治疗项目',
    applicantOwned: true,
    track: '细胞治疗',
    submittedAt: '2025-05-10 14:30',
    entityTypeLabel: '企业',
    orgFullName: '北京清源生物医药科技有限公司',
    registerAddress: '北京市海淀区中关村大街1号',
    establishedAt: '2020年06月',
    lastModifiedAt: '2025-05-12 09:00',
    frontierTech: true,
    creditCode: '91110105MA01234XXX',
    contact: '周敏',
    phone: '13812345678',
    email: 'zhoumin@example.com',
    phase: '概念验证',
    intentLabel: '实体入孵',
    stage: 'pending_material_review',
    currentNodePublic: '待资料审核',
    attachments: [
      { category: '主体资质证明', name: '营业执照.jpg', sizeLabel: '2.3MB', uploadedAt: '2025-05-10' },
      { category: '商业计划书', name: 'BP.pdf', sizeLabel: '5.1MB', uploadedAt: '2025-05-10' },
      { category: '技术资料', name: '技术路线.docx', sizeLabel: '1.2MB', uploadedAt: '2025-05-10' },
      { category: '知识产权资料', name: '专利证书.pdf', sizeLabel: '3.0MB', uploadedAt: '2025-05-10' },
      { category: '团队资料', name: '团队简历.docx', sizeLabel: '0.8MB', uploadedAt: '2025-05-10' },
    ],
    checklist,
    timeline: sjBaseTimeline('pending_material_review', {}),
    experts: [],
  }

  const p2: SjProject = {
    id: 'sj-102',
    name: 'AI 新药筛选平台',
    applicantOwned: true,
    track: 'AI+CRO',
    submittedAt: '2025-05-01',
    entityTypeLabel: '高校课题组',
    orgFullName: '某某大学药学院重点实验室',
    creditCode: '12100004XXXX56789X',
    contact: '林晨',
    phone: '13900001111',
    email: 'linchen@univ.edu.cn',
    phase: '小试放大',
    intentLabel: '虚拟入孵',
    stage: 'expert_reviewing',
    currentNodePublic: '专家评审中',
    aiEvaluatedAt: '2025-05-12 15:30',
    lastModifiedAt: '2025-05-13 11:00',
    attachments: [
      { category: '商业计划书', name: 'BP.pdf', sizeLabel: '4.2MB', uploadedAt: '2025-05-01' },
      { category: '技术资料', name: '算法白皮书.pdf', sizeLabel: '1.8MB', uploadedAt: '2025-05-02' },
    ],
    checklist: checklist.map((c) => ({ ...c, ok: true })),
    timeline: sjBaseTimeline('expert_reviewing', { aiScore: 88 }),
    aiReport: {
      overall: 88,
      levelLabel: '优秀',
      dims: [
        { key: '产业匹配', value: 92 },
        { key: '技术创新', value: 88 },
        { key: '团队能力', value: 84 },
        { key: '市场潜力', value: 81 },
        { key: '合规风险', value: 76 },
        { key: '资源适配', value: 88 },
      ],
      pros: '算法链路清晰；团队具备头部药企合作履历。',
      risks: '部分训练数据权属说明尚需补强。',
      suggest: '建议优先匹配开放实验室与中试代工资源。',
    },
    experts: [
      {
        expertId: 'exp_zhang',
        name: '张教授',
        field: '细胞治疗',
        matchPct: 92,
        aiPick: true,
        state: 'done',
        score: 92,
        opinion: '技术领先，算法与业务场景结合紧密，推荐推进虚拟入孵并绑定数据中台合规审计。',
        dimScores: { industry: 92, tech: 90, team: 88, market: 80, compliance: 85 },
        submittedAt: '2025-05-14',
        deadline: '2025-05-17',
      },
      {
        expertId: 'exp_li',
        name: '李博士',
        field: '基因编辑',
        matchPct: 85,
        aiPick: true,
        state: 'done',
        score: 90,
        opinion: '算法工程化路径清晰。',
        dimScores: { industry: 88, tech: 85, team: 85, market: 75, compliance: 90 },
        submittedAt: '2025-05-13',
        deadline: '2025-05-17',
      },
      {
        expertId: 'exp_wang',
        name: '王主任',
        field: '肿瘤免疫',
        matchPct: 78,
        state: 'pending',
        deadline: '2025-05-17',
      },
    ],
  }

  const p3: SjProject = {
    id: 'sj-103',
    name: '细胞治疗临床转化',
    applicantOwned: true,
    track: '细胞治疗',
    submittedAt: '2025-04-28',
    entityTypeLabel: '医院',
    orgFullName: '某某三甲医院转化医学中心',
    creditCode: '12100001XXXXX12345',
    contact: '许航',
    phone: '13766669999',
    email: 'xuh@hospital.cn',
    phase: 'IND 准备',
    intentLabel: '实体入孵',
    stage: 'returned_supplement',
    currentNodePublic: '待补充资料',
    returnReason: '营业执照扫描件不清晰，请重新上传并补充伦理批件电子版。',
    attachments: [
      { category: '主体资质证明', name: '营业执照.jpg', sizeLabel: '1.1MB', uploadedAt: '2025-04-28' },
      { category: '伦理与合规', name: '伦理批件.pdf（待替换）', sizeLabel: '0.6MB', uploadedAt: '2025-04-29' },
      { category: '商业计划书', name: 'BP.pdf', sizeLabel: '3.4MB', uploadedAt: '2025-04-28' },
    ],
    checklist,
    timeline: sjBaseTimeline('returned_supplement', { returned: true }),
    experts: [],
  }

  const p4: SjProject = {
    id: 'sj-104',
    name: '抗体药中试项目',
    applicantOwned: false,
    track: '大分子药',
    submittedAt: '2025-05-07',
    entityTypeLabel: '企业',
    orgFullName: '瑞抗体生物医药有限公司',
    creditCode: '91310115MA98765YYY',
    contact: '马越',
    phone: '13611112222',
    email: 'may@rnd.com',
    phase: '中试放大',
    intentLabel: '实体入孵',
    stage: 'pending_decision',
    currentNodePublic: '评审完成 · 待运营决策',
    aiEvaluatedAt: '2025-05-08 10:00',
    attachments: [
      { category: '商业计划书', name: 'BP.pdf', sizeLabel: '6.0MB', uploadedAt: '2025-05-07' },
      { category: '技术资料', name: '毒理简报.pdf', sizeLabel: '1.4MB', uploadedAt: '2025-05-07' },
    ],
    checklist: checklist.map((c) => ({ ...c, ok: true })),
    timeline: sjBaseTimeline('pending_decision', { aiScore: 82 }),
    aiReport: {
      overall: 82,
      levelLabel: '良好',
      dims: [
        { key: '产业匹配', value: 80 },
        { key: '技术创新', value: 78 },
        { key: '团队能力', value: 88 },
        { key: '市场潜力', value: 86 },
        { key: '合规风险', value: 74 },
        { key: '资源适配', value: 83 },
      ],
      pros: 'CMC 经验充足，目标客户明确。',
      risks: '毒理与外协实验室合同尚待齐备。',
      suggest: '建议实体入孵并绑定园区共享灌装线。',
      opinionConsensus: '三位专家认为技术成熟度较高，赞同推进实体入驻。',
      opinionConflict: '在「市场风险」上与「合规补强周期」存在一定分歧。',
    },
    experts: [
      {
        expertId: 'exp_zhao',
        name: '赵研究员',
        field: '药理学',
        state: 'done',
        score: 82,
        opinion: '成药性路径清楚，建议在园区完成毒理补齐。',
        dimScores: { industry: 82, tech: 80, team: 86, market: 78, compliance: 80 },
        submittedAt: '2025-05-12',
        deadline: '2025-05-14',
      },
      {
        expertId: 'exp_sun',
        name: '孙教授',
        field: '临床前毒理',
        state: 'done',
        score: 85,
        opinion: '毒理关注点已列清单，可按园区模板整改。',
        dimScores: { industry: 80, tech: 78, team: 88, market: 82, compliance: 85 },
        submittedAt: '2025-05-12',
        deadline: '2025-05-14',
      },
    ],
  }

  const p5: SjProject = {
    id: 'sj-105',
    name: 'mRNA 递送载体平台',
    applicantOwned: true,
    track: '创新药',
    submittedAt: '2025-05-09',
    entityTypeLabel: '研究所',
    orgFullName: '中科院某所核酸药物工程中心',
    creditCode: '12100000400001234X',
    contact: '韩磊',
    phone: '13500005555',
    email: 'hanlei@demo.ac.cn',
    phase: '概念验证',
    intentLabel: '实体入孵',
    stage: 'pending_ai',
    currentNodePublic: '待 AI 评估',
    attachments: [{ category: '商业计划书', name: 'BP.pdf', sizeLabel: '2.1MB', uploadedAt: '2025-05-09' }],
    checklist: checklist.map((c) => ({ ...c, ok: true })),
    timeline: sjBaseTimeline('pending_ai', {}),
    experts: [],
  }

  /** 已决策通过：用于详情「决策记录」完整示意 + 池内「查看」单入口 */
  const p6: SjProject = {
    id: 'sj-106',
    name: '小分子靶向药平台',
    applicantOwned: true,
    track: '小分子创新药',
    submittedAt: '2025-05-02 10:00',
    entityTypeLabel: '企业',
    orgFullName: '杭州某某制药有限公司',
    creditCode: '91330100MA0000DEMO',
    contact: '陈琪',
    phone: '13800001234',
    email: 'chenqi@demo.com',
    phase: '临床前',
    intentLabel: '实体入孵',
    stage: 'decision_pass',
    currentNodePublic: '决策通过 · 实体入孵',
    aiEvaluatedAt: '2025-05-06 11:20',
    lastModifiedAt: '2025-05-16 10:35',
    attachments: [{ category: '商业计划书', name: 'BP.pdf', sizeLabel: '3.0MB', uploadedAt: '2025-05-02' }],
    checklist: checklist.map((c) => ({ ...c, ok: true })),
    timeline: sjBaseTimeline('decision_pass', { aiScore: 84 }),
    aiReport: {
      overall: 84,
      levelLabel: '良好',
      dims: [
        { key: '产业匹配', value: 85 },
        { key: '技术创新', value: 82 },
        { key: '团队能力', value: 80 },
        { key: '市场潜力', value: 86 },
        { key: '合规风险', value: 88 },
        { key: '资源适配', value: 83 },
      ],
      pros: '靶点清晰，与园区产业协同度高。',
      risks: '临床批件时间表需与园区招商节奏对齐。',
      suggest: '推荐实体入孵并接入园区毒理协作平台。',
      opinionConsensus: '专家一致认为可推进实体入驻。',
    },
    experts: [
      {
        expertId: 'exp_zhao',
        name: '赵研究员',
        field: '药理学',
        state: 'done',
        score: 84,
        opinion: '成药路径可行，建议签约。',
        dimScores: { industry: 85, tech: 82, team: 80, market: 86, compliance: 88 },
        submittedAt: '2025-05-14',
        deadline: '2025-05-16',
      },
    ],
    decisionChoice: 'physical',
    decisionComment: '同意专家意见，准予实体入孵；请同步完善安评补充材料并完成签约。',
    decisionAt: '2025-05-16 10:30',
    decisionBy: '运营主管-王五',
    incubationArchiveStatus: '待签约',
    hatchArchiveProjectId: 'h-proj-1',
  }

  return [p1, p2, p3, p4, p5, p6]
}
