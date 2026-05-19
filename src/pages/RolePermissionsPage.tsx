import { useState } from 'react'
import { useToast } from '../components/ToastProvider'
import { cn } from '../utils/cn'

const MODULES = [
  '企业策源与精准招商',
  '企业入驻与身份管理',
  '资源运营与企业赋能',
  '孵化评估与成长运营',
  '数字孪生空间底座',
  'AI能力中台',
  '运营驾驶舱',
  '平台系统管理',
] as const

type Ops = { view: boolean; edit: boolean; approve: boolean }

const emptyOps = (): Ops => ({ view: false, edit: false, approve: false })

export default function RolePermissionsPage() {
  const toast = useToast()
  const roleName = '运营经理'

  const [enabled, setEnabled] = useState(() => {
    const e: Partial<Record<(typeof MODULES)[number], boolean>> = {}
    MODULES.forEach((m) => {
      e[m] = false
    })
    MODULES.slice(0, 2).forEach((m) => {
      e[m] = true
    })
    MODULES.slice(2, 3).forEach((m) => {
      e[m] = false
    })
    e['孵化评估与成长运营'] = true
    return e as Record<(typeof MODULES)[number], boolean>
  })

  const [ops, setOps] = useState(() => {
    const o: Record<(typeof MODULES)[number], Ops> = MODULES.reduce(
      (acc, m) => {
        acc[m] = emptyOps()
        return acc
      },
      {} as Record<(typeof MODULES)[number], Ops>,
    )
    o['企业策源与精准招商'] = { view: true, edit: true, approve: true }
    o['企业入驻与身份管理'] = { view: true, edit: true, approve: true }
    o['资源运营与企业赋能'] = emptyOps()
    o['孵化评估与成长运营'] = { view: true, edit: false, approve: false }
    return o
  })

  type DataScope = 'self' | 'dept' | 'campus'
  const [dataScope, setDataScope] = useState<DataScope>('campus')

  function toggleModule(mod: (typeof MODULES)[number], on: boolean) {
    setEnabled((prev) => ({ ...prev, [mod]: on }))
    setOps((prev) => ({
      ...prev,
      [mod]: on
        ? { view: true, edit: true, approve: mod.includes('策源') || mod.includes('入驻') }
        : emptyOps(),
    }))
  }

  function setOp(mod: (typeof MODULES)[number], k: keyof Ops, val: boolean) {
    setOps((prev) => ({ ...prev, [mod]: { ...prev[mod]!, [k]: val } }))
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h2 className="text-[17px] font-semibold text-foreground">角色：{roleName}</h2>
          <p className="mt-1 text-[13px] text-muted">模块权限勾选后，可细分查看 / 编辑 / 审批。</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-[var(--radius-button)] border border-divider px-3 py-2 text-[12px]"
            onClick={() => toast.show('切换至编辑草稿（演示）', 'info')}
          >
            编辑
          </button>
          <button
            type="button"
            className="rounded-[var(--radius-button)] border border-divider px-3 py-2 text-[12px]"
            onClick={() => toast.show('复制角色（演示）', 'info')}
          >
            复制
          </button>
          <button
            type="button"
            className="rounded-[var(--radius-button)] border border-danger/40 px-3 py-2 text-[12px] text-danger"
            onClick={() => toast.show('敏感操作二次确认（演示）', 'warning')}
          >
            删除
          </button>
        </div>
      </div>

      <fieldset className="rounded-[var(--radius-panel)] border border-divider bg-surface p-6 shadow-card">
        <legend className="px-2 text-[14px] font-semibold text-foreground">模块权限</legend>
        <ul className="mt-6 space-y-5">
          {MODULES.map((mod) => {
            const modOn = enabled[mod]
            const rowOps = ops[mod] ?? emptyOps()
            const disableApproveUi = mod === '资源运营与企业赋能'

            return (
              <li key={mod} className={cn(!modOn && 'opacity-60')}>
                <div className="flex flex-wrap items-start gap-x-6 gap-y-3 border-b border-divider pb-4 last:border-0">
                  <label className="flex shrink-0 items-center gap-2 text-[13px] font-medium text-foreground">
                    <input
                      type="checkbox"
                      checked={modOn}
                      onChange={(e) => toggleModule(mod, e.target.checked)}
                    />
                    {mod}
                  </label>
                  <div className="flex flex-wrap gap-5 text-[12px] text-muted">
                    <label className={cn(!modOn ? 'cursor-not-allowed' : '')}>
                      <input
                        type="checkbox"
                        checked={rowOps.view}
                        disabled={!modOn}
                        onChange={(e) => setOp(mod, 'view', e.target.checked)}
                      />{' '}
                      [查看]
                    </label>
                    <label className={cn(!modOn ? 'cursor-not-allowed' : '')}>
                      <input
                        type="checkbox"
                        checked={rowOps.edit}
                        disabled={!modOn}
                        onChange={(e) => setOp(mod, 'edit', e.target.checked)}
                      />{' '}
                      [编辑]
                    </label>
                    <label
                      className={cn(
                        !modOn || disableApproveUi ? 'cursor-not-allowed text-muted line-through' : '',
                      )}
                      title={
                        disableApproveUi ? '此模块不涉及审批占位' : ''
                      }
                    >
                      <input
                        type="checkbox"
                        checked={rowOps.approve && !disableApproveUi}
                        disabled={!modOn || disableApproveUi}
                        onChange={(e) => setOp(mod, 'approve', e.target.checked)}
                      />{' '}
                      [{disableApproveUi ? '-' : '审批'}]
                    </label>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </fieldset>

      <fieldset className="rounded-[var(--radius-panel)] border border-divider bg-surface p-6 shadow-card">
        <legend className="px-2 text-[14px] font-semibold text-foreground">数据权限</legend>
        <div className="mt-6 flex flex-wrap gap-8 text-[13px] text-foreground">
          {(
            [
              { id: 'self' as const, label: '仅自己数据' },
              { id: 'dept' as const, label: '本部门' },
              { id: 'campus' as const, label: '全部园区' },
            ] satisfies { id: DataScope; label: string }[]
          ).map((o) => (
            <label key={o.id} className="inline-flex cursor-pointer items-center gap-2">
              <input type="radio" name="dsp" checked={dataScope === o.id} onChange={() => setDataScope(o.id)} />
              <span className={dataScope === o.id ? 'font-medium text-primary' : ''}>
                {dataScope === o.id ? '●' : '○'} {o.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex justify-end gap-3 pb-16">
        <button type="button" className="rounded-[var(--radius-button)] border border-divider px-6 py-2.5 text-[13px]"
          onClick={() => toast.show('取消', 'info')}>取消</button>
        <button type="button" className="rounded-[var(--radius-button)] bg-primary px-8 py-2.5 text-[13px] font-semibold text-white"
          onClick={() => toast.show('权限矩阵已持久化 · 写入审计日志', 'success')}>保存</button>
      </div>
    </div>
  )
}
