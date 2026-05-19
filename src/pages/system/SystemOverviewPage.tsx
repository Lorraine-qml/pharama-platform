import { Link } from 'react-router-dom'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import { SystemPageChrome } from './SystemPageChrome'

const MODULES: { title: string; desc: string; to: string; icon: string; tone: 'blue' | 'green' | 'amber' | 'slate' }[] = [
  {
    title: '用户管理',
    desc: '平台账号生命周期、重置密码与安全策略',
    to: '/system/users',
    icon: '👥',
    tone: 'blue',
  },
  {
    title: '角色权限',
    desc: '模块矩阵与数据范围，适配多园区治理',
    to: '/system/roles',
    icon: '🔐',
    tone: 'green',
  },
  {
    title: '组织与租户',
    desc: '园区主体、租户空间与配额',
    to: '/system/orgs',
    icon: '🏛️',
    tone: 'slate',
  },
  {
    title: '操作审计',
    desc: '关键操作留痕检索与导出',
    to: '/system/audit',
    icon: '📜',
    tone: 'amber',
  },
  {
    title: '系统参数',
    desc: '全局开关、会话与安全基线',
    to: '/system/settings',
    icon: '⚙️',
    tone: 'slate',
  },
  {
    title: '消息公告',
    desc: '站内通知、模版与投递范围',
    to: '/system/notices',
    icon: '📣',
    tone: 'blue',
  },
]

const tones: Record<(typeof MODULES)[number]['tone'], string> = {
  blue: 'from-primary/[0.08] to-transparent ring-primary/15',
  green: 'from-success/[0.08] to-transparent ring-success/20',
  amber: 'from-warning/[0.1] to-transparent ring-warning/25',
  slate: 'from-foreground/[0.04] to-transparent ring-divider',
}

export default function SystemOverviewPage() {
  const toast = useToast()

  return (
    <SystemPageChrome description="统一管理用户、权限、租户与运维配置；以下为常用入口与安全态势摘要（演示数据）。">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: '平台用户', val: '1,248', sub: '+12 本周' },
          { label: '活跃角色', val: '18', sub: '含自定义 6 个' },
          { label: '今日审计事件', val: '3.4k', sub: '写操作占比 21%' },
          { label: '待处理告警', val: '2', sub: '会话策略 / SSL' },
        ].map((k) => (
          <button
            key={k.label}
            type="button"
            className="relative overflow-hidden rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 text-left shadow-sm transition-[box-shadow,border-color] hover:border-primary/30 hover:shadow-[0_8px_28px_-12px_rgba(30,109,255,0.25)]"
            onClick={() => toast.show(`${k.label} 详情跳转（演示）`, 'info')}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{k.label}</div>
            <div className="mt-2 text-[26px] font-black tabular-nums tracking-tight text-foreground">{k.val}</div>
            <div className="mt-1 text-[11px] text-primary">{k.sub}</div>
          </button>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-[14px] font-bold text-foreground">功能模块</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <Link
              key={m.to}
              to={m.to}
              className={cn(
                'group relative flex flex-col overflow-hidden rounded-[var(--radius-panel)] border border-divider bg-gradient-to-br px-5 py-4 shadow-sm ring-1 transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:shadow-md',
                tones[m.tone],
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-[22px] drop-shadow-sm" aria-hidden>
                  {m.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-[15px] font-semibold text-foreground group-hover:text-primary">{m.title}</span>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{m.desc}</p>
                </div>
              </div>
              <span className="mt-4 text-[12px] font-semibold text-primary">进入 →</span>
            </Link>
          ))}
        </div>
      </div>
    </SystemPageChrome>
  )
}
