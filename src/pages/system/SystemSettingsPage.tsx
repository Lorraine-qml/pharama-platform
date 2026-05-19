import { useState, type ReactNode } from 'react'
import { useToast } from '../../components/ToastProvider'
import { cn } from '../../utils/cn'
import { SystemPageChrome } from './SystemPageChrome'

function Field({
  title,
  desc,
  children,
}: {
  title: string
  desc?: string
  children: ReactNode
}) {
  return (
    <div className="border-b border-divider py-4 last:border-0">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0 sm:max-w-xs">
          <div className="text-[13px] font-semibold text-foreground">{title}</div>
          {desc ? <p className="mt-1 text-[12px] leading-relaxed text-muted">{desc}</p> : null}
        </div>
        <div className="mt-3 shrink-0 sm:mt-0">{children}</div>
      </div>
    </div>
  )
}

export default function SystemSettingsPage() {
  const toast = useToast()
  const [idle, setIdle] = useState('45')
  const [mfa, setMfa] = useState(true)
  const [watermark, setWatermark] = useState(true)

  return (
    <SystemPageChrome
      description="影响全平台租户的运行参数；高风险项变更将强制二次校验并写入审计（演示交互）。"
      actions={
        <button
          type="button"
          className="rounded-[var(--radius-button)] bg-primary px-5 py-2 text-[13px] font-semibold text-white hover:bg-primary-hover"
          onClick={() => toast.show('配置已发布 · 异步生效（演示）', 'success')}
        >
          保存全部
        </button>
      }
    >
      <div className="rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-2 shadow-[var(--shadow-card)]">
        <h3 className="border-b border-divider py-3 text-[13px] font-bold text-foreground">安全与会话</h3>
        <Field
          title="会话闲置超时（分钟）"
          desc="超过闲置时间自动登出控制台，建议与 IdP SSO 对齐。"
        >
          <select
            value={idle}
            onChange={(e) => setIdle(e.target.value)}
            className="rounded-[var(--radius-card)] border border-divider bg-page px-3 py-2 text-[13px] outline-none focus:border-primary"
          >
            {['30', '45', '60', '120'].map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field title="控制台强制 MFA" desc="对所有平台运维账号启用 TOTP/WebAuthn。">
          <button
            type="button"
            role="switch"
            aria-checked={mfa}
            onClick={() => setMfa((v) => !v)}
            className={cn(
              'relative h-7 w-12 rounded-full transition-colors',
              mfa ? 'bg-primary' : 'bg-divider',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 size-6 rounded-full bg-white shadow-sm transition-[left]',
                mfa ? 'left-6' : 'left-0.5',
              )}
            />
          </button>
        </Field>
        <Field title="附件下载动态水印" desc="含账号与时间戳叠加水印 PDF/图片预览。">
          <button
            type="button"
            role="switch"
            aria-checked={watermark}
            onClick={() => setWatermark((v) => !v)}
            className={cn('relative h-7 w-12 rounded-full transition-colors', watermark ? 'bg-primary' : 'bg-divider')}
          >
            <span
              className={cn(
                'absolute top-0.5 size-6 rounded-full bg-white shadow-sm transition-[left]',
                watermark ? 'left-6' : 'left-0.5',
              )}
            />
          </button>
        </Field>
      </div>

      <div className="rounded-[var(--radius-panel)] border border-divider bg-surface px-5 py-2 shadow-[var(--shadow-card)]">
        <h3 className="border-b border-divider py-3 text-[13px] font-bold text-foreground">上传与网关</h3>
        <Field title="单文件大小上限（MB）" desc="合同与 BP 等大文件阈值；超出走分片上传。">
          <input
            defaultValue={80}
            type="number"
            className="w-28 rounded-[var(--radius-card)] border border-divider px-3 py-2 text-[13px] outline-none focus:border-primary"
          />
        </Field>
        <Field title="API 网关速率限制（次/分钟·租户）" desc="保护与第三方开放接口 QoS。">
          <input
            defaultValue={1200}
            type="number"
            className="w-36 rounded-[var(--radius-card)] border border-divider px-3 py-2 text-[13px] outline-none focus:border-primary"
          />
        </Field>
      </div>
    </SystemPageChrome>
  )
}
