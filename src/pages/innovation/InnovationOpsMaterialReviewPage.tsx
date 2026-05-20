import { Link, useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../../components/ToastProvider'
import { useInnovationDemo } from './InnovationDemoContext'
import { MaterialReviewModal } from './MaterialReviewModal'

export default function InnovationOpsMaterialReviewPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { getProject, passMaterialReview, returnMaterialReview } = useInnovationDemo()
  const p = projectId ? getProject(projectId) : undefined

  if (!p) return <p className="text-muted">未找到项目。</p>

  const proj = p

  function handleSubmit(outcome: 'pass' | 'return', comment: string) {
    if (outcome === 'pass') {
      passMaterialReview(proj.id, comment)
      toast.show('资料审核通过，已进入 AI 评估阶段；已通知项目方（演示站内信）', 'success')
    } else {
      returnMaterialReview(proj.id, comment)
      toast.show('已退回修改，已通知项目方补充资料（演示站内信）', 'warning')
    }
    navigate('/innovation/ops/workbench')
  }

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-muted">
        <Link to="/innovation/ops/workbench" className="text-primary hover:underline">
          任务中心
        </Link>
        <span className="mx-2 text-divider">/</span>
        资料审核
      </p>
      <MaterialReviewModal project={proj} open onClose={() => navigate('/innovation/ops/workbench')} onSubmit={handleSubmit} />
    </div>
  )
}
