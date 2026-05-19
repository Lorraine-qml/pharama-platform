import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import type { ProjectArchive } from '../hatch/hatchTypes'
import { useHatchMgmt } from '../hatch/HatchMgmtContext'
import { incubationDurationLabel } from './evalShared'
import { EvalPageHeader, useEvalProjectId } from './EvalHeader'

function physicalIncubationFilter(a: ProjectArchive) {
  return a.incubationType === '实体' && a.status !== '退出' && a.status !== '毕业'
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 text-[13px]">
      <span className="text-muted">{label}</span>
      <span className="text-end font-medium text-foreground">{value}</span>
    </div>
  )
}

export default function EvalPortraitPage() {
  const { archives } = useHatchMgmt()
  const list = archives.filter(physicalIncubationFilter)
  const baseList = list.length ? list : archives
  const { archive } = useEvalProjectId(baseList)

  return (
    <div className="space-y-5 pb-10">
      <ModuleIntroCard
        title="🧬 AI 项目画像"
        lines={[
          '聚合入孵档案、资源使用与 AI 调用等数据，形成多维画像卡片；点击下钻链接可跳转档案对应板块（演示）。',
          '权限：园区运营 / 企业管理员；项目方请通过「我的项目」查看受限画像（后续对接）。',
        ]}
      />
      <EvalPageHeader title="AI 项目画像" archives={baseList} filter={list.length ? physicalIncubationFilter : undefined} />

      <PortraitBody archive={archive} />
    </div>
  )
}

function PortraitBody({ archive }: { archive: ProjectArchive | undefined }) {
  useEffect(() => {
    if (typeof window === 'undefined' || !archive) return
    if (window.location.hash === '#risk-portrait') {
      document.getElementById('risk-portrait')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [archive])

  if (!archive) {
    return <p className="text-[13px] text-muted">暂无项目档案数据。</p>
  }
  const pipe = archive.pipeline[0]
  const fund = archive.funding[0]
  const teamN = Math.max(archive.team.length, 1)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-lg border border-divider bg-surface p-4 shadow-sm">
        <h2 className="mb-3 text-[13px] font-bold text-foreground">基础画像</h2>
        <div className="space-y-2">
          <Field label="项目名称" value={archive.name} />
          <Field label="赛道" value={archive.tags.slice(0, 2).join('、') || '—'} />
          <Field label="阶段" value={pipe?.stage ?? '—'} />
          <Field label="入孵类型" value={archive.incubationType} />
          <Field label="入孵时长" value={incubationDurationLabel(archive.incubationStart)} />
          <Field label="团队规模" value={`${teamN} 人`} />
        </div>
      </section>

      <section className="rounded-lg border border-divider bg-surface p-4 shadow-sm">
        <h2 className="mb-3 text-[13px] font-bold text-foreground">技术能力画像</h2>
        <div className="space-y-2">
          <Field label="核心技术" value={archive.tags.includes('细胞治疗') ? 'CRISPR-Cas9 基因编辑' : '平台与工艺技术栈'} />
          <Field label="技术成熟度" value="实验室验证阶段（演示）" />
          <Field label="专利数量" value="3 项发明专利（演示）" />
          <Field label="论文" value="5 篇 SCI（演示）" />
        </div>
      </section>

      <section className="rounded-lg border border-divider bg-surface p-4 shadow-sm">
        <h2 className="mb-3 text-[13px] font-bold text-foreground">产品管线画像</h2>
        {pipe ? (
          <div className="space-y-2">
            <Field label="管线名称" value={pipe.productName} />
            <Field label="适应症" value={pipe.indication} />
            <Field label="研发阶段" value={pipe.stage} />
            <Field label="关键里程碑" value={pipe.milestone ?? '—'} />
          </div>
        ) : (
          <p className="text-[13px] text-muted">暂无管线数据，请在档案中维护。</p>
        )}
        <Link to={`/hatch/archive/${archive.id}`} className="mt-3 inline-block text-[12px] font-semibold text-primary hover:underline">
          下钻管线详情 →
        </Link>
      </section>

      <section className="rounded-lg border border-divider bg-surface p-4 shadow-sm">
        <h2 className="mb-3 text-[13px] font-bold text-foreground">融资阶段画像</h2>
        {fund ? (
          <div className="space-y-2">
            <Field label="融资轮次" value={fund.round} />
            <Field label="融资金额" value={fund.amount} />
            <Field label="投资机构" value={fund.investor} />
            <Field label="资金需求" value="下一轮计划 1 亿（演示）" />
          </div>
        ) : (
          <p className="text-[13px] text-muted">暂无融资记录。</p>
        )}
      </section>

      <section className="rounded-lg border border-divider bg-surface p-4 shadow-sm">
        <h2 className="mb-3 text-[13px] font-bold text-foreground">资源需求画像</h2>
        <p className="text-[13px] leading-relaxed text-foreground">{archive.resourceDemand || '—'}</p>
      </section>

      <section className="rounded-lg border border-divider bg-surface p-4 shadow-sm">
        <h2 className="mb-3 text-[13px] font-bold text-foreground">资源使用画像</h2>
        <div className="space-y-2 text-[13px]">
          <Field label="累计使用资源" value="12 次（演示）" />
          <Field label="热门资源" value="共享实验室（8 次）" />
          <Field label="总费用" value="5,600 元（演示）" />
        </div>
      </section>

      <section className="rounded-lg border border-divider bg-surface p-4 shadow-sm">
        <h2 className="mb-3 text-[13px] font-bold text-foreground">AI 能力使用画像</h2>
        <div className="space-y-2 text-[13px]">
          <Field label="调用大模型" value="156 次（演示）" />
          <Field label="使用智能体" value="项目评估、资源撮合" />
          <Field label="Skill 使用" value="报告生成、专利摘要" />
        </div>
      </section>

      <section className="rounded-lg border border-divider bg-surface p-4 shadow-sm">
        <h2 className="mb-3 text-[13px] font-bold text-foreground">生态贡献画像</h2>
        <div className="space-y-2 text-[13px]">
          <Field label="提供资源" value="2 次（设备共享，演示）" />
          <Field label="参与协作" value="3 个联合项目（演示）" />
          <Field label="使用单评价" value="4.8 分（演示）" />
        </div>
      </section>

      <section id="risk-portrait" className="rounded-lg border border-divider bg-surface p-4 shadow-sm lg:col-span-2">
        <h2 className="mb-3 text-[13px] font-bold text-foreground">风险画像</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-[13px]">
          <div className="rounded-md border border-divider bg-muted/10 px-3 py-2">⚠️ 研发风险：管线进展正常</div>
          <div className="rounded-md border border-divider bg-muted/10 px-3 py-2">💰 融资风险：资金充足</div>
          <div className="rounded-md border border-divider bg-muted/10 px-3 py-2">⚠️ 合规风险：伦理材料已补充</div>
          <div className="rounded-md border border-divider bg-muted/10 px-3 py-2">🔥 活跃度风险：近 30 天登录正常</div>
        </div>
        <Link to={`/hatch/archive/${archive.id}`} className="mt-3 inline-block text-[12px] font-semibold text-primary hover:underline">
          下钻风险与档案 →
        </Link>
      </section>
    </div>
  )
}
