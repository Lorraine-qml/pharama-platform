import { useMemo, useState } from 'react'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import { SysTableWrap } from './SystemPageChrome'

type OpLog = {
  time: string
  user: string
  opType: string
  module: string
  target: string
  result: '成功' | '失败'
  ip: string
}

type LoginLog = {
  time: string
  user: string
  ip: string
  client: string
  result: string
}

const OP_DEMO: OpLog[] = [
  { time: '2025-05-15 09:23:12', user: 'zhangsan', opType: '新增', module: '用户管理', target: '用户:lisi', result: '成功', ip: '192.168.1.1' },
  { time: '2025-05-15 08:15:03', user: 'admin', opType: '删除', module: '项目评估', target: '项目ID:123', result: '成功', ip: '10.0.0.2' },
  { time: '2025-05-14 22:11:40', user: 'li_si', opType: '导出', module: '日志审计', target: '报表:202505', result: '成功', ip: '10.0.0.8' },
  { time: '2025-05-14 19:02:01', user: 'robot', opType: '登录', module: '认证', target: '—', result: '失败', ip: '45.33.**.**' },
]

const LOGIN_DEMO: LoginLog[] = [
  { time: '2025-05-15 08:00:01', user: 'zhangsan', ip: '192.168.1.1', client: 'Chrome 124', result: '成功' },
  { time: '2025-05-14 22:30:12', user: 'lisi', ip: '10.0.0.5', client: 'Safari 17', result: '失败-密码错误' },
  { time: '2025-05-14 18:12:45', user: 'admin', ip: '10.0.0.2', client: 'Edge 123', result: '成功' },
]

export default function SystemAuditLogsPage() {
  const toast = useToast()
  const [tab, setTab] = useState<'op' | 'login'>('op')
  const [userFilter, setUserFilter] = useState('全部')
  const [opType, setOpType] = useState('全部')
  const [resultFilter, setResultFilter] = useState('全部')
  const [start, setStart] = useState('2025-05-01')
  const [end, setEnd] = useState('2025-05-15')

  const opFiltered = useMemo(() => {
    return OP_DEMO.filter((r) => {
      if (userFilter !== '全部' && r.user !== userFilter) return false
      if (opType !== '全部' && r.opType !== opType) return false
      if (resultFilter !== '全部' && r.result !== resultFilter) return false
      return true
    })
  }, [userFilter, opType, resultFilter])

  return (
    <>
      <div className="mb-5 rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-divider pb-3">
          <h2 className="text-[17px] font-bold text-foreground">日志审计</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-[var(--radius-button)] border border-divider px-3 py-2 text-[12px] font-semibold hover:bg-page" onClick={() => toast.show('已导出当前筛选 CSV/Excel（演示）', 'success')}>
              导出
            </button>
            {tab === 'op' ? (
              <button type="button" className="rounded-[var(--radius-button)] border border-divider px-3 py-2 text-[12px] font-semibold hover:bg-page" onClick={() => { setUserFilter('全部'); setOpType('全部'); setResultFilter('全部'); toast.show('筛选已重置', 'info') }}>
                清空筛选
              </button>
            ) : null}
          </div>
        </div>
        <p className="mt-3 text-[13px] text-muted">操作日志与登录日志分栏展示；支持时间范围、用户、结果等组合过滤，满足等保审计（演示数据）。</p>
      </div>

      <div className="mb-4 flex gap-1 rounded-[var(--radius-card)] border border-divider bg-page p-1">
        {(
          [
            ['op', '操作日志'],
            ['login', '登录日志'],
          ] as const
        ).map(([id, lab]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'flex-1 rounded-[var(--radius-button)] px-4 py-2 text-[13px] font-semibold transition-colors',
              tab === id ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-foreground',
            )}
          >
            {lab}
          </button>
        ))}
      </div>

      {tab === 'op' ? (
        <>
          <div className="mb-4 flex flex-wrap items-end gap-3 rounded-[var(--radius-panel)] border border-divider bg-surface px-4 py-3 text-[13px]">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted">时间从</span>
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="rounded border border-divider px-2 py-1.5" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted">至</span>
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded border border-divider px-2 py-1.5" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted">用户</span>
              <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="rounded border border-divider px-2 py-1.5">
                {['全部', 'zhangsan', 'admin', 'li_si', 'robot'].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted">操作类型</span>
              <select value={opType} onChange={(e) => setOpType(e.target.value)} className="rounded border border-divider px-2 py-1.5">
                {['全部', '新增', '删除', '导出', '登录'].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-muted">结果</span>
              <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} className="rounded border border-divider px-2 py-1.5">
                {['全部', '成功', '失败'].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>

          <SysTableWrap>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-[13px]">
                <thead className="border-b border-divider bg-page text-[11px] font-semibold uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3">时间</th>
                    <th className="px-4 py-3">用户</th>
                    <th className="px-4 py-3">操作类型</th>
                    <th className="px-4 py-3">模块</th>
                    <th className="px-4 py-3">操作对象</th>
                    <th className="px-4 py-3">结果</th>
                    <th className="px-4 py-3">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {opFiltered.map((r, i) => (
                    <tr key={`${r.time}-${i}`} className="hover:bg-page/70">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-muted">{r.time}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{r.user}</td>
                      <td className="px-4 py-3 text-foreground">{r.opType}</td>
                      <td className="px-4 py-3 text-muted">{r.module}</td>
                      <td className="px-4 py-3">
                        <button type="button" className="text-left text-primary hover:underline" onClick={() => toast.show(`对象详情抽屉 · ${r.target}（演示）`, 'info')}>
                          {r.target}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-semibold', r.result === '成功' ? 'bg-success/12 text-success' : 'bg-danger/12 text-danger')}>
                          {r.result}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[12px] text-muted">{r.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-divider px-4 py-2 text-[12px] text-muted">共 {opFiltered.length.toLocaleString()} 条（演示）</div>
          </SysTableWrap>
        </>
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <button type="button" className="rounded-[var(--radius-button)] border border-divider px-3 py-2 text-[12px] font-semibold hover:bg-page" onClick={() => toast.show('登录日志导出（演示）', 'success')}>
              导出
            </button>
          </div>
          <SysTableWrap>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-[13px]">
                <thead className="border-b border-divider bg-page text-[11px] font-semibold uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3">时间</th>
                    <th className="px-4 py-3">用户</th>
                    <th className="px-4 py-3">登录 IP</th>
                    <th className="px-4 py-3">客户端</th>
                    <th className="px-4 py-3">结果</th>
                    <th className="px-4 py-3">详情</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {LOGIN_DEMO.map((r, i) => (
                    <tr key={`${r.time}-${i}`} className="hover:bg-page/70">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-[12px] text-muted">{r.time}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{r.user}</td>
                      <td className="px-4 py-3 font-mono text-[12px] text-muted">{r.ip}</td>
                      <td className="px-4 py-3 text-muted">{r.client}</td>
                      <td className="px-4 py-3 text-muted">{r.result}</td>
                      <td className="px-4 py-3">
                        <button type="button" className="text-[12px] font-semibold text-primary hover:underline" onClick={() => toast.show('UA / 链路追踪占位', 'info')}>
                          查看
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SysTableWrap>
        </>
      )}
    </>
  )
}
