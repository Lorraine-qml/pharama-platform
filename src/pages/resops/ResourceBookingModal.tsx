import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { Modal } from '../../components/Modal'
import { useToast } from '../../components/ToastProvider'
import { useHatchMgmt } from '../hatch/HatchMgmtContext'
import { demoApplicantForRole } from './resopsV1Labels'
import type { ResResource } from './resopsV1Types'
import { useResopsV1 } from './ResopsV1Context'

export function canBookResResource(r: ResResource): boolean {
  if (r.status !== 'listed') return false
  const al = (r.availabilityLabel ?? '').toLowerCase()
  if (al.includes('占用') || al.includes('维护') || al.includes('异常') || al.includes('排队')) return false
  return al.includes('空闲') || al.includes('可预约') || al.includes('空闲中')
}

function resourceLocation(r: ResResource): string {
  return r.twinBindNote?.trim() || (r.location && r.location !== '—' ? `B栋-${r.location}` : '—')
}

function resourceTypeLabel(r: ResResource): string {
  return r.level2 || r.level1
}

export type ResourceBookingModalProps = {
  resource: ResResource | null
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ResourceBookingModal({ resource, open, onClose, onSuccess }: ResourceBookingModalProps) {
  const toast = useToast()
  const { user } = useAuth()
  const { archives } = useHatchMgmt()
  const { submitApplication } = useResopsV1()

  const [bookDate, setBookDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [bookStart, setBookStart] = useState('14:00')
  const [bookEnd, setBookEnd] = useState('16:00')
  const [bookPurpose, setBookPurpose] = useState('')
  const [bookTech, setBookTech] = useState(false)
  const [bookTrain, setBookTrain] = useState(false)

  const defaultProjectName = useMemo(
    () => archives.find((a) => a.name.includes('基因'))?.name ?? archives[0]?.name ?? '基因治疗项目',
    [archives],
  )

  const applicantName = useMemo(() => {
    const raw = user?.displayName ?? ''
    const part = raw.split('·')[0]?.trim()
    return part || '实体企业（演示）'
  }, [user?.displayName])

  const applicant = user ? demoApplicantForRole(user.role) : { key: 'demo', label: defaultProjectName }

  useEffect(() => {
    if (!open) return
    setBookDate(new Date().toISOString().slice(0, 10))
    setBookStart('14:00')
    setBookEnd('16:00')
    setBookPurpose('')
    setBookTech(false)
    setBookTrain(false)
  }, [open, resource?.id])

  function submit() {
    if (!resource) return
    if (!canBookResResource(resource)) {
      toast.show('当前资源不可预约', 'info')
      return
    }
    if (!bookPurpose.trim()) {
      toast.show('请填写使用用途', 'warning')
      return
    }
    const slot = `${bookDate.slice(5)} ${bookStart}-${bookEnd}`
    const extras = [bookTech && '需技术协助', bookTrain && '需培训'].filter(Boolean).join('；')
    const purposeNote = extras ? `${bookPurpose.trim()}（${extras}）` : bookPurpose.trim()

    submitApplication({
      resourceId: resource.id,
      applicantKey: applicant.key,
      applicantLabel: applicant.label,
      slot: `${slot} · ${purposeNote}`,
    })
    toast.show('预约已提交，已生成申请记录（演示）', 'success')
    onSuccess?.()
    onClose()
  }

  return (
    <Modal
      open={open && resource != null}
      title="预约资源"
      onClose={onClose}
      closeOnOverlayClick={false}
      panelClassName="max-w-lg"
      footer={
        <>
          <button type="button" className="rounded-md border border-divider px-4 py-2 text-[12px] font-bold hover:bg-muted/40" onClick={onClose}>
            取消
          </button>
          <button type="button" className="rounded-md bg-primary px-4 py-2 text-[12px] font-bold text-white hover:bg-primary-hover" onClick={submit}>
            提交预约
          </button>
        </>
      }
    >
      {resource ? (
        <div className="space-y-3 text-[13px]">
          <ul className="space-y-1 rounded-lg border border-divider bg-muted/10 p-3 text-[12px]">
            <li>
              <span className="text-muted">资源名称：</span>
              <span className="font-semibold">{resource.name}</span>
            </li>
            <li>
              <span className="text-muted">资源类型：</span>
              {resourceTypeLabel(resource)}
            </li>
            <li>
              <span className="text-muted">位置：</span>
              {resourceLocation(resource)}
            </li>
            <li>
              <span className="text-muted">开放时间：</span>
              {resource.hours || '工作日（演示）'}
            </li>
          </ul>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-[12px]">
              <span className="font-semibold text-muted">预约日期</span>
              <input type="date" className="mt-1 w-full rounded-md border border-divider bg-surface px-2 py-1.5" value={bookDate} onChange={(e) => setBookDate(e.target.value)} />
            </label>
            <label className="text-[12px]">
              <span className="font-semibold text-muted">开始时间</span>
              <input type="time" className="mt-1 w-full rounded-md border border-divider bg-surface px-2 py-1.5" value={bookStart} onChange={(e) => setBookStart(e.target.value)} />
            </label>
            <label className="text-[12px]">
              <span className="font-semibold text-muted">结束时间</span>
              <input type="time" className="mt-1 w-full rounded-md border border-divider bg-surface px-2 py-1.5" value={bookEnd} onChange={(e) => setBookEnd(e.target.value)} />
            </label>
          </div>
          <label className="block text-[12px]">
            <span className="font-semibold text-muted">使用用途</span>
            <textarea
              className="mt-1 w-full rounded-md border border-divider bg-surface px-2 py-2 text-[13px]"
              rows={2}
              placeholder="例：细胞表面标记分析实验"
              value={bookPurpose}
              onChange={(e) => setBookPurpose(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-4 text-[12px]">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={bookTech} onChange={(e) => setBookTech(e.target.checked)} />
              需要技术人员协助
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={bookTrain} onChange={(e) => setBookTrain(e.target.checked)} />
              需要培训
            </label>
          </div>
          <ul className="space-y-0.5 text-[12px] text-muted">
            <li>
              <span className="text-muted">预约人：</span>
              {applicantName}
            </li>
            <li>
              <span className="text-muted">所属项目：</span>
              {defaultProjectName}
            </li>
          </ul>
          <p className="rounded-md border border-[#FF8A34]/30 bg-[#FF8A34]/10 px-2 py-1.5 text-[11px] text-[#A65000]">
            请按时使用；取消需提前 2 小时（演示规则）。
          </p>
        </div>
      ) : null}
    </Modal>
  )
}
