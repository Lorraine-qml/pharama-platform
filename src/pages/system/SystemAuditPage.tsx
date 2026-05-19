import { useMemo, useState } from 'react'
import { useToast } from '../../components/ToastProvider'
import { SysTableWrap, SystemPageChrome } from './SystemPageChrome'

type AuditRow = { time: string; operator: string; action: string; module: string; ip: string; result: '成功' | '失败' }

const DEMO: AuditRow[] = [
  { time: '2026-05-15 09:41:02', operator: 'zhang.yy', action: '更新角色矩阵', module: '系统管理', ip: '10.12.8.101', result: '成功' },
  { time: '2026-05-15 09:38:51', operator: 'li.hegui', action: '导出审计报表', module: '系统管理', ip: '10.12.2.88', result: '成功' },
  { time: '2026-05-15 09:31:06', operator: 'wang.park-a', action: '调整租户配额', module: '组织与租户', ip: '192.168.31.102', result: '成功' },
  { time: '2026-05-14 21:06:44', operator: 'unknown-bot', action: '登录尝试', module: '认证', ip: '45.**.**.**', result: '失败' },
]

export default function SystemAuditPage() {
  const toast = useToast()
  const [mod, setMod] = useState<string>('全部')
  const rows = useMemo(() => (mod === '全部' ? DEMO : DEMO.filter((r) => r.module.includes(mod))), [mod])

  return (
    <SystemPageChrome
      description="满足等保与安全运营要求：可按操作者、模块、结果过滤，支持归档到对象存储与 SIEM（演示占位）。"
      actions={
        <button
          type="button"
          className="rounded-[var(--radius-button)] border border-divider px-3 py-2 text-[12px] font-medium hover:bg-page"
          onClick={() => toast.show('已生成离线审计包下载链接（演示）', 'success')}
        >
          导出审计
        </button>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        {(['全部', '系统管理', '组织与租户', '认证'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMod(m)}
            className={`rounded-[var(--radius-button)] px-3 py-1.5 text-[12px] font-semibold transition-colors ${
              mod === m ? 'bg-primary text-white shadow-sm' : 'border border-divider bg-surface hover:bg-page'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <SysTableWrap>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-[13px]">
            <thead className="border-b border-divider bg-page/90 text-[11px] font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">时间</th>
                <th className="px-4 py-3">操作者</th>
                <th className="px-4 py-3">动作</th>
                <th className="px-4 py-3">模块</th>
                <th className="px-4 py-3">来源 IP</th>
                <th className="px-4 py-3">结果</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {rows.map((r, i) => (
                <tr key={`${r.time}-${i}`} className="hover:bg-page/70">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-muted">{r.time}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{r.operator}</td>
                  <td className="px-4 py-3 text-foreground">{r.action}</td>
                  <td className="px-4 py-3 text-muted">{r.module}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-muted">{r.ip}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${r.result === '成功' ? 'bg-success/12 text-success' : 'bg-danger/12 text-danger'}`}>
                      {r.result}
                    </span>
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
