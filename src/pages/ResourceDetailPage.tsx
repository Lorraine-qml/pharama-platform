import { useState } from 'react'
import { Modal } from '../components/Modal'
import { Drawer } from '../components/Drawer'
import { useToast } from '../components/ToastProvider'

const STEPS = ['选择时段', '实验目的', '确认提交'] as const

export default function ResourceDetailPage() {
  const toast = useToast()
  const [wizardOpen, setWizardOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [slot, setSlot] = useState('2026-05-21 13:30–15:30')
  const [purpose, setPurpose] = useState('肿瘤细胞因子 panel 复检')

  const [aiBookOpen, setAiBookOpen] = useState(false)
  const [nl, setNl] = useState('我想下周三下午使用2小时')
  const [aiSuggestOpen, setAiSuggestOpen] = useState(false)

  function openWizardFromStart() {
    setStep(0)
    setWizardOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius-panel)] border border-divider bg-surface shadow-card">
        <div className="border-b border-divider px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="flex flex-wrap items-center gap-3 text-[20px] font-semibold text-foreground">
                🔬 BD流式细胞仪
                <span className="text-[14px] font-normal text-muted">⭐ 4.8</span>
              </h1>
              <p className="mt-2 text-[13px] text-muted">公共实验平台 · A栋101室 · 高精度配置</p>
            </div>
            <button
              type="button"
              className="rounded-[var(--radius-button)] border border-divider px-4 py-2 text-[13px]"
              onClick={() => toast.show('已加入收藏夹', 'info')}
            >
              收藏
            </button>
          </div>
        </div>

        <div className="grid gap-8 p-6 lg:grid-cols-[minmax(0,380px)_1fr]">
          <div className="flex aspect-[4/3] items-center justify-center rounded-[var(--radius-card)] bg-gradient-to-br from-primary-light via-surface to-page text-[13px] text-muted ring-1 ring-divider">
            设备图（占位）
          </div>
          <div className="flex flex-col justify-between gap-6">
            <dl className="grid gap-2 text-[14px]">
              <div>
                <dt className="text-[12px] text-muted">提供方</dt>
                <dd className="font-medium text-foreground">公共实验平台</dd>
              </div>
              <div>
                <dt className="text-[12px] text-muted">位置</dt>
                <dd className="text-foreground">A栋 101室</dd>
              </div>
              <div>
                <dt className="text-[12px] text-muted">价格</dt>
                <dd className="text-[18px] font-semibold text-primary">200元 / 小时</dd>
              </div>
            </dl>
            <div>
              <p className="text-[12px] text-muted">可预约时段</p>
              <button
                type="button"
                className="mt-1 rounded-[var(--radius-button)] border border-primary px-4 py-2 text-[13px] font-medium text-primary hover:bg-primary-light"
                onClick={() => toast.show('跳转日历控件（孪生占位）', 'info')}
              >
                查看日历
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-[var(--radius-button)] border border-divider px-5 py-2.5 text-[14px]"
                onClick={() => setAiBookOpen(true)}
              >
                AI帮你预约
              </button>
              <button
                type="button"
                className="rounded-[var(--radius-button)] bg-primary px-5 py-2.5 text-[14px] font-medium text-white hover:bg-primary-hover"
                onClick={openWizardFromStart}
              >
                立即申请
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-divider px-6 py-5 text-[14px]">
          <h2 className="mb-2 font-semibold text-foreground">资源介绍</h2>
          <p className="leading-relaxed text-muted">
            Cytek Aurora CS 高配版，适配多色免疫分型与稀疏样本；可申请驻场支持与方法学打磨。
          </p>
          <p className="mt-6 font-semibold text-foreground">评价摘录</p>
          <blockquote className="mt-3 border-l-4 border-primary pl-4 text-[13px] text-muted">
            「平台工程师响应非常快，预处理 SOP 与园区危化管理无缝衔接。」
          </blockquote>
        </div>
      </div>

      <Drawer
        title="AI 帮你预约（自然语言）"
        width={480}
        open={aiBookOpen}
        onClose={() => setAiBookOpen(false)}
        footer={
          <button
            type="button"
            className="w-full rounded-[var(--radius-button)] bg-primary py-3 font-medium text-white"
            onClick={() => {
              setAiSuggestOpen(true)
              setAiBookOpen(false)
            }}
          >
            AI 校验日历 &amp; 给出推荐时段
          </button>
        }
      >
        <AiNlHint />
        <label className="mt-6 block space-y-2 text-[13px]">
          <span className="text-muted">用一句话描述时间与时长</span>
          <textarea
            value={nl}
            onChange={(e) => setNl(e.target.value)}
            rows={4}
            className="w-full rounded-[var(--radius-card)] border border-divider p-4"
          />
        </label>
      </Drawer>

      <Modal
        open={aiSuggestOpen}
        title="AI 推荐时段（演示）"
        onClose={() => setAiSuggestOpen(false)}
        footer={
          <button
            type="button"
            className="rounded-[var(--radius-button)] bg-primary px-4 py-2 text-[13px] font-medium text-white"
            onClick={() => {
              setSlot('2026-05-14（周三）13:30–15:30')
              setAiSuggestOpen(false)
              openWizardFromStart()
              toast.show('时段已填入申请向导', 'success')
            }}
          >
            使用推荐时段并开始申请
          </button>
        }
      >
        <p className="text-[14px] leading-relaxed text-foreground">
          根据日历冲突检测，系统在 <strong className="text-primary">周三 13:30–15:30</strong>{' '}
          腾出连续 2 小时可用窗口。
        </p>
      </Modal>

      <Modal
        open={wizardOpen}
        title="资源申请 · 向导"
        onClose={() => setWizardOpen(false)}
        footer={
          <>
            {step > 0 ? (
              <button type="button" className="text-[13px] text-muted" onClick={() => setStep(step - 1)}>
                ← 上一步
              </button>
            ) : (
              <span />
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                className="rounded-[var(--radius-button)] bg-primary px-4 py-2 text-[13px] text-white"
                onClick={() => setStep(step + 1)}
              >
                下一步
              </button>
            ) : (
              <button
                type="button"
                className="rounded-[var(--radius-button)] bg-success px-4 py-2 text-[13px] font-medium text-white"
                onClick={() => {
                  toast.show('已生成资源使用单 RES-92831', 'success')
                  setWizardOpen(false)
                }}
              >
                提交生成使用单
              </button>
            )}
          </>
        }
      >
        <div className="mb-4 flex flex-wrap gap-3 text-[11px] text-muted">
          {STEPS.map((label, i) => (
            <span key={label} className={i === step ? 'font-semibold text-primary' : ''}>{`${i + 1}. ${label}`}</span>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4 text-[14px]">
            <p className="text-muted">已选时段</p>
            <input
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className="w-full rounded-[var(--radius-button)] border border-divider px-3 py-2"
            />
          </div>
        )}
        {step === 1 && (
          <div className="space-y-3 text-[13px]">
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={4}
              className="w-full rounded-[var(--radius-card)] border border-divider p-3"
            />
            <p className="text-muted">方案附件拖拽上传占位</p>
          </div>
        )}
        {step === 2 && (
          <ul className="space-y-2 text-[13px] text-muted">
            <li>设备：BD 流式细胞仪</li>
            <li>时段：{slot}</li>
            <li>目的：{purpose}</li>
          </ul>
        )}
      </Modal>
    </div>
  )
}

function AiNlHint() {
  return (
    <div className="rounded-[var(--radius-card)] border border-primary-light bg-primary-light/50 p-3">
      <div className="mb-2 flex justify-between gap-2 text-[13px] font-semibold text-foreground">
        <span>NLP · 日历解析</span>
        <span className="text-primary">✨ AI</span>
      </div>
      <p className="text-[12px] text-muted">系统将识别「下周三」「下午」「2小时」并对齐资源日历。</p>
    </div>
  )
}
