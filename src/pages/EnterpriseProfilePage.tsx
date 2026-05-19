import { useState } from 'react'
import { Modal } from '../components/Modal'
import { AiPanel } from '../components/AiPanels'
import { RadarChart } from '../components/RadarChart'
import { useToast } from '../components/ToastProvider'
import { cn } from '../utils/cn'

const tabs = ['基础信息', '入驻身份', '空间 / 资源', 'AI画像'] as const

const portraitAxes = [
  { key: '技术', value: 76 },
  { key: '融资', value: 68 },
  { key: '生态', value: 72 },
]

export default function EnterpriseProfilePage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>('基础信息')
  const [changeModal, setChangeModal] = useState(false)
  const toast = useToast()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[17px] font-semibold text-foreground">北海基因 · 企业档案</h2>
          <p className="mt-1 text-[13px] text-muted">基因治疗 · 临床 II 期</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-divider pb-2">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            className={cn(
              'rounded-[var(--radius-button)] px-4 py-2 text-[13px] font-medium',
              tab === t ? 'bg-primary-light text-primary' : 'text-muted hover:bg-page',
            )}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-[var(--radius-panel)] border border-divider bg-surface p-6 shadow-card">
        {tab === '基础信息' && (
          <div className="max-w-xl space-y-4 text-[14px]">
            <fieldset className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-[12px] text-muted">联系人</span>
                <input defaultValue="张敏" className="w-full rounded-[var(--radius-button)] border border-divider px-3 py-2" />
              </label>
              <label className="space-y-1">
                <span className="text-[12px] text-muted">手机号</span>
                <input defaultValue="138****1024" className="w-full rounded-[var(--radius-button)] border border-divider px-3 py-2" />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="text-[12px] text-muted">赛道标签</span>
                <input defaultValue="基因治疗 / AAV / 肝病" className="w-full rounded-[var(--radius-button)] border border-divider px-3 py-2" />
              </label>
            </fieldset>
            <button
              type="button"
              className="rounded-[var(--radius-button)] bg-primary px-5 py-2 text-[13px] font-medium text-white hover:bg-primary-hover"
              onClick={() => toast.show('档案已保存', 'success')}
            >
              保存基础信息
            </button>
          </div>
        )}

        {tab === '入驻身份' && (
          <div className="flex flex-wrap items-start gap-10 text-[14px]">
            <dl className="grid gap-2 text-[13px]">
              <div className="flex gap-8">
                <dt className="text-muted">入驻类型</dt>
                <dd className="font-medium">实体入驻</dd>
              </div>
              <div className="flex gap-8">
                <dt className="text-muted">权限套餐</dt>
                <dd className="font-medium">产学研旗舰包</dd>
              </div>
              <div className="flex gap-8">
                <dt className="text-muted">AI 服务额度</dt>
                <dd className="font-medium">
                  <span className="text-primary">12,600</span> tokens / 月
                </dd>
              </div>
            </dl>
            <button
              type="button"
              className="rounded-[var(--radius-button)] border border-divider px-4 py-2 text-[13px] hover:border-warning hover:text-warning"
              onClick={() => setChangeModal(true)}
            >
              变更类型
            </button>
          </div>
        )}

        {tab === '空间 / 资源' && (
          <div className="space-y-6 text-[13px]">
            <div>
              <h3 className="mb-2 text-[13px] font-semibold text-foreground">已分配空间</h3>
              <ul className="rounded-[var(--radius-card)] border border-divider">
                <li className="flex justify-between border-b border-divider px-4 py-3">
                  <span>B303 共享实验区</span>
                  <span className="text-muted">120㎡</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-[13px] font-semibold text-foreground">在途资源使用单</h3>
              <ul className="rounded-[var(--radius-card)] border border-divider">
                <li className="flex justify-between px-4 py-3">
                  <span>BD 流式细胞仪 · REQ-9821</span>
                  <span className="rounded-[var(--radius-button)] bg-primary-light px-2 py-0.5 text-[11px] text-primary">
                    履约中
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {tab === 'AI画像' && (
          <div className="flex flex-wrap items-start gap-10">
            <RadarChart axes={portraitAxes} />
            <AiPanel title="AI 成长建议">
              <p className="text-[14px]">
                建议优先补齐 IND 申报资料包，并预约园区注册申报专家门诊；与邻座企业共享生物安全评估供应商可降本 12%（模型估算）。
              </p>
            </AiPanel>
          </div>
        )}
      </div>

      <Modal
        open={changeModal}
        title="变更入驻类型（审批流）"
        onClose={() => setChangeModal(false)}
        footer={
          <>
            <button
              type="button"
              className="rounded-[var(--radius-button)] border border-divider px-4 py-2 text-[13px]"
              onClick={() => setChangeModal(false)}
            >
              取消
            </button>
            <button
              type="button"
              className="rounded-[var(--radius-button)] bg-primary px-4 py-2 text-[13px] font-medium text-white"
              onClick={() => {
                toast.show('已提交审批，通知运营经理', 'success')
                setChangeModal(false)
              }}
            >
              提交审批
            </button>
          </>
        }
      >
        <p className="text-[14px] text-muted">变更将触发二级审批与合同补充协议流程（演示）。</p>
      </Modal>
    </div>
  )
}
