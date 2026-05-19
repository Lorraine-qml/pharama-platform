import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import { SysTableWrap, SystemPageChrome } from './SystemPageChrome'

const DEMO = [
  { id: 'n1', title: '关于「孪生图层」停机维护的公告', scope: '全平台', status: '已发布', time: '2026-05-14', reach: '12.4k' },
  { id: 'n2', title: '入孵评分模型 v2 灰度试点', scope: '张江园', status: '定时', time: '2026-05-18 09:00', reach: '—' },
  { id: 'n3', title: '劳动节假期客服响应 SLA 调整说明', scope: '全平台', status: '撤回', time: '2026-04-26', reach: '8.9k' },
] as const

export default function SystemNoticesPage() {
  const toast = useToast()

  return (
    <SystemPageChrome
      description="面向站内条幅、弹窗及邮件模版的多渠道投递；支持与审批流绑定（演示数据）。"
      actions={
        <button
          type="button"
          className="rounded-[var(--radius-button)] bg-primary px-4 py-2 text-[12px] font-semibold text-white hover:bg-primary-hover"
          onClick={() => toast.show('富文本编辑器 + 收件人预览（演示）', 'info')}
        >
          新建公告
        </button>
      }
    >
      <SysTableWrap>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-[13px]">
            <thead className="border-b border-divider bg-page/90 text-[11px] font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">标题</th>
                <th className="px-4 py-3">范围</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">时间</th>
                <th className="px-4 py-3">触达</th>
                <th className="px-4 py-3 text-end">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {DEMO.map((r) => (
                <tr key={r.id} className="hover:bg-page/70">
                  <td className="px-4 py-3 font-medium text-foreground">{r.title}</td>
                  <td className="px-4 py-3 text-muted">{r.scope}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 text-[11px] font-semibold',
                        r.status === '已发布' && 'bg-success/12 text-success',
                        r.status === '定时' && 'bg-primary/12 text-primary',
                        r.status === '撤回' && 'bg-muted/25 text-muted',
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{r.time}</td>
                  <td className="px-4 py-3 tabular-nums text-muted">{r.reach}</td>
                  <td className="px-4 py-3 text-end">
                    <button
                      type="button"
                      className="text-[12px] font-semibold text-primary hover:underline"
                      onClick={() => toast.show(`预览 / 撤回 · ${r.title.slice(0, 12)}…（演示）`, 'info')}
                    >
                      管理
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SysTableWrap>
    </SystemPageChrome>
  )
}
