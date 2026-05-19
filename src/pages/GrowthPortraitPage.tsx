import { useState } from 'react'
import { Modal } from '../components/Modal'
import { AiPanel } from '../components/AiPanels'
import { useToast } from '../components/ToastProvider'

export default function GrowthPortraitPage() {
  const toast = useToast()
  const [mailOpen, setMailOpen] = useState(false)

  const [mailBody, setMailBody] = useState(`张博士您好，

北海基因在近期 GLP-1 仿制药效验证更新较少，我们建议安排一次入园专家门诊，
围绕 GLP/GMP 对齐与申报材料清单做一次 45 分钟的集中答疑。

孵化器运营团队
`)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4 rounded-[var(--radius-card)] border border-divider bg-surface px-6 py-4 shadow-card">
        <div>
          <h2 className="text-[17px] font-semibold text-foreground">企业成长画像 · 北海基因（运营）</h2>
          <p className="mt-2 text-[14px] text-muted">
            AI成长评分：
            <span className="ml-2 text-[22px] font-bold text-primary">78</span>
            <span className="ml-2 text-muted">(良好)</span>
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-[var(--radius-card)] border border-divider bg-surface p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">技术成长</h2>
            <span aria-hidden className="text-warning">★★★★☆</span>
          </div>
          <p className="text-[13px] text-muted">
            <span className="font-medium text-foreground">商业化进度：</span>
            临床 II 期
          </p>
        </section>
        <section className="rounded-[var(--radius-card)] border border-divider bg-surface p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">融资成长</h2>
            <span aria-hidden className="text-warning">★★★☆☆</span>
          </div>
          <p className="text-[13px] text-muted">
            <span className="font-medium text-foreground">近期融资：</span>A 轮 · 5000 万 · 红杉领投
          </p>
        </section>
      </div>

      <section className="space-y-4 rounded-[var(--radius-panel)] border border-divider bg-surface p-6 shadow-card">
        <h2 className="text-[15px] font-semibold text-foreground">风险预警</h2>
        <div className="flex gap-4 rounded-[var(--radius-card)] border border-warning/40 bg-warning/10 px-4 py-3 text-[13px] text-foreground">
          <span>⚠️</span>
          <span>
            研发进度停滞预警：GLP-1项目 3个月无周报更新{' '}
            <button type="button" className="text-primary underline" onClick={() => toast.show('下钻工单', 'info')}>
              下钻
            </button>
          </span>
        </div>

        <AiPanel title="AI 孵化建议">
          <p>推荐对接注册申报专家<strong>张博士</strong>，已为您生成邀约邮件模版。</p>
          <button
            type="button"
            className="mt-3 rounded-[var(--radius-button)] bg-primary px-4 py-2 text-[13px] font-medium text-white"
            onClick={() => setMailOpen(true)}
          >
            发送
          </button>
        </AiPanel>
      </section>

      <Modal
        open={mailOpen}
        title="邮件预览（演示）"
        onClose={() => setMailOpen(false)}
        footer={
          <>
            <button type="button" className="text-[13px] text-muted" onClick={() => setMailOpen(false)}>
              取消
            </button>
            <button
              type="button"
              className="rounded-[var(--radius-button)] bg-primary px-4 py-2 text-[13px] text-white"
              onClick={() => {
                toast.show('已通过园区邮件中继发送（演示）', 'success')
                setMailOpen(false)
              }}
            >
              确认发送
            </button>
          </>
        }
      >
        <textarea
          className="h-52 w-full rounded-[var(--radius-card)] border border-divider bg-page p-3 text-[13px]"
          value={mailBody}
          onChange={(e) => setMailBody(e.target.value)}
        />
      </Modal>
    </div>
  )
}
