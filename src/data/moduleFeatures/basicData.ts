import type { ModuleFeatureDef } from './types'

export const basicEvaluationForms: ModuleFeatureDef = {
  moduleLabel: '基础数据',
  pageCode: '7.1',
  pageTitle: '评价表管理',
  intro: '维护专家评审、孵化评估等场景共用的维度、指标与算分策略。',
  features: [
    {
      name: '评价维度 / 指标 / 权重 / 等级配置',
      desc: '在运营后台定义评分维度树、指标口径、权重占比及等级分段。',
      flow: '进入配置页 → 表单编辑各项参数 → 保存并发布版本。',
      ai: '✨ AI建议：根据行业标准推荐初始权重配置',
    },
    {
      name: '评分规则配置',
      desc: '为不同业务场景（如初筛、专家评审、毕业评估）绑定差异化评分规则。',
      flow: '选择场景 → 关联指标模板 → 设定阈值与生效区间。',
      ai: '无',
    },
  ],
}

export const basicContractTemplates: ModuleFeatureDef = {
  moduleLabel: '基础数据',
  pageCode: '7.2',
  pageTitle: '合同模板管理',
  intro: '统一管理入孵协议、补充协议等模板的生命周期与版本。',
  features: [
    {
      name: '协议模板及版本管理',
      desc: '上传或在线维护合同模板，支持版本留痕与生效状态切换。',
      flow: '新建模板 → 富文本编辑条款 → 提交审核 → 发布版本。',
      ai: '✨ AI生成：根据入孵类型自动生成模板草稿',
    },
  ],
}

export const basicExpertLibrary: ModuleFeatureDef = {
  moduleLabel: '基础数据',
  pageCode: '7.3',
  pageTitle: '专家库管理',
  intro: '沉淀外部专家档案并支撑评审任务的智能撮合。',
  features: [
    {
      name: '专家信息维护、匹配规则配置',
      desc: '维护专家基本信息、研究方向与可用性，配置领域标签与权重规则。',
      flow: '列表检索 → 新增 / 编辑 → 保存；在规则页维护匹配策略。',
      ai: '✨ AI匹配：自动匹配项目与专家',
    },
  ],
}

export const basicRosters: ModuleFeatureDef = {
  moduleLabel: '基础数据',
  pageCode: '7.4',
  pageTitle: '名单管理',
  intro: '维护合作生态与风控相关的标准名单。',
  features: [
    {
      name: '外部合作机构 / 项目来源类型 / 黑名单',
      desc: '登记合作机构名录、合法来源类型枚举及黑名单主体，供业务下拉与校验引用。',
      flow: '列表视图 → 新增 / 编辑 / 停用 → 生效同步至引用模块。',
      ai: '无',
    },
  ],
}

export const basicDictionaries: ModuleFeatureDef = {
  moduleLabel: '基础数据',
  pageCode: '7.5',
  pageTitle: '字典标签管理',
  intro: '统一维护全局下拉字典与标签体系，避免口径漂移。',
  features: [
    {
      name: '各类字典下拉选项维护',
      desc: '按字典编码维护可选值、排序、启用状态及说明。',
      flow: '运营检索字典编码 → 列表增删改 → 保存即时生效。',
      ai: '无',
    },
  ],
}
