import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import { SysTableWrap, SystemPageChrome } from './SystemPageChrome'

const DEMO = [
  { id: 't1', name: '张江生物医药生态园', code: 'PARK-ZJ-A', users: 420, quota: '标准', tier: '旗舰' },
  { id: 't2', name: '姑苏医疗器械加速器', code: 'PARK-SZH-B', users: 186, quota: '经济', tier: '专业' },
  { id: 't3', name: '企业沙箱（测试）', code: 'SANDBOX', users: 12, quota: '试用', tier: '沙箱' },
] as const

export default function SystemOrgsPage() {
  const toast = useToast()

  return (
    <SystemPageChrome
      description="维护园区空间、租户隔离边界与配额；企业侧租户与平台租户可在同一控制台切换上下文（演示）。"
      actions={
        <button
          type="button"
          className="rounded-[var(--radius-button)] bg-primary px-4 py-2 text-[12px] font-semibold text-white hover:bg-primary-hover"
          onClick={() => toast.show('新建租户向导（演示）', 'info')}
        >
          新建租户空间
        </button>
      }
    >
      <SysTableWrap>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead className="border-b border-divider bg-page/90 text-[11px] font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">租户 / 园区名称</th>
                <th className="px-4 py-3">编码</th>
                <th className="px-4 py-3">席位</th>
                <th className="px-4 py-3">套餐</th>
                <th className="px-4 py-3">层级</th>
                <th className="px-4 py-3 text-end">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {DEMO.map((r) => (
                <tr key={r.id} className="hover:bg-page/70">
                  <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-muted">{r.code}</td>
                  <td className="px-4 py-3 tabular-nums text-foreground">{r.users}</td>
                  <td className="px-4 py-3 text-muted">{r.quota}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 text-[11px] font-semibold',
                        r.tier === '旗舰' && 'bg-primary/12 text-primary',
                        r.tier === '专业' && 'bg-success/12 text-success',
                        r.tier === '沙箱' && 'bg-muted/20 text-muted',
                      )}
                    >
                      {r.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <button
                      type="button"
                      className="text-[12px] font-semibold text-primary hover:underline"
                      onClick={() => toast.show(`配额与安全域 · ${r.name}（演示）`, 'info')}
                    >
                      配置
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
