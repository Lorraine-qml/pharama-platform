import { useMemo, useState } from 'react'
import { ListPaginationBar } from '../../components/list/ListPaginationBar'
import { ListToolbarRow } from '../../components/list/ListToolbarRow'
import { Modal } from '../../components/Modal'
import { ModuleIntroCard } from '../../components/moduleIntro/ModuleIntroCard'
import { useToast } from '../../components/ToastProvider'
import type { AiAbilityNode, AiNodeStatus } from './ecoTypes'
import { useEco } from './EcoContext'

function statusDot(status: AiNodeStatus) {
  if (status === '在线') return <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" aria-hidden />在线</span>
  if (status === '维护中') return <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-500" aria-hidden />维护中</span>
  return <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-slate-400" aria-hidden />离线</span>
}

export default function EcoAiAbilityPage() {
  const toast = useToast()
  const { aiNodes, refreshAiDemo } = useEco()

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [detail, setDetail] = useState<AiAbilityNode | null>(null)

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize
    return aiNodes.slice(start, start + pageSize)
  }, [aiNodes, page, pageSize])

  return (
    <div className="space-y-5 pb-10">
      <ModuleIntroCard
        title="🧠 AI 能力"
        lines={[
          'V1 为静态示例数据，支持详情弹窗与手动刷新统计；「调用测试」「同步 AI 中台」为 V2 预留。',
          '所有登录角色默认可查看列表与详情。',
        ]}
      />

      <h1 className="text-lg font-bold text-foreground">AI 能力</h1>

      <ListToolbarRow
        left={
          <>
            <button
              type="button"
              className="rounded-md border border-divider bg-surface px-3 py-2 text-[13px]"
              onClick={() => {
                refreshAiDemo()
                toast.show('已刷新示例统计（演示）', 'success')
              }}
            >
              刷新
            </button>
            <button
              type="button"
              className="rounded-md border border-divider bg-surface px-3 py-2 text-[13px] text-muted"
              disabled
              title="V2 对接 AI 中台后开放"
              onClick={() => toast.show('V2 对接 AI 中台', 'info')}
            >
              同步 AI 中台（V2）
            </button>
          </>
        }
        right={null}
      />

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-divider bg-surface text-[14px] shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full border-collapse">
            <thead className="sticky top-0 z-[1] border-b border-divider bg-[#F5F7FA] text-left text-[12px] font-bold text-muted">
              <tr>
                <th className="px-4 py-3">名称</th>
                <th className="px-4 py-3">类型</th>
                <th className="px-4 py-3">描述</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3 text-end">操作</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((r) => (
                <tr key={r.id} className="h-12 border-b border-divider hover:bg-primary-light/15">
                  <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                  <td className="px-4 py-3 text-muted">{r.kind}</td>
                  <td className="max-w-[360px] truncate px-4 py-3 text-muted" title={r.description}>
                    {r.description}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-muted">{statusDot(r.status)}</td>
                  <td className="px-4 py-3 text-end text-[13px]">
                    {r.kind === '知识库' ? (
                      <button type="button" className="text-primary hover:underline" onClick={() => toast.show('请前往「知识库」模块访问（演示）', 'info')}>
                        访问
                      </button>
                    ) : (
                      <button type="button" className="text-primary hover:underline" onClick={() => setDetail(r)}>
                        详情
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ListPaginationBar
          total={aiNodes.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(n) => {
            setPageSize(n)
            setPage(1)
          }}
        />
      </div>

      <Modal
        open={Boolean(detail)}
        title={detail ? `AI 能力详情 · ${detail.name}` : ''}
        onClose={() => setDetail(null)}
        panelClassName="max-w-lg"
        footer={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-divider px-3 py-2 text-[13px] text-muted"
              disabled
              title="V2 开放调用测试"
            >
              调用测试（V2）
            </button>
            <button type="button" className="rounded-md border border-divider px-3 py-2 text-[13px]" onClick={() => toast.show('文档中心（演示）', 'info')}>
              查看文档
            </button>
            <button type="button" className="rounded-md bg-primary px-4 py-2 text-[13px] font-semibold text-white" onClick={() => setDetail(null)}>
              关闭
            </button>
          </div>
        }
      >
        {detail ? (
          <dl className="space-y-2 text-[13px]">
            <div className="flex justify-between gap-2">
              <dt className="text-muted">类型</dt>
              <dd>{detail.kind}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">版本</dt>
              <dd>{detail.version}</dd>
            </div>
            <div>
              <dt className="text-muted">描述</dt>
              <dd className="mt-1 text-foreground">{detail.description}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">调用方式</dt>
              <dd>{detail.invoke}</dd>
            </div>
            <div>
              <dt className="text-muted">使用记录（近 30 天）</dt>
              <dd className="mt-1">
                调用 {detail.calls30d} 次，成功率 {detail.successPct.toFixed(1)}%（演示数据）
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted">状态</dt>
              <dd>{statusDot(detail.status)}</dd>
            </div>
          </dl>
        ) : null}
      </Modal>
    </div>
  )
}
