import { Navigate, useParams } from 'react-router-dom'

/** 旧链接兼容：评审改在任务中心弹窗完成 */
export default function InnovationExpertReviewWorkbenchPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const q = projectId ? `?review=${encodeURIComponent(projectId)}` : ''
  return <Navigate to={`/innovation/ops/workbench${q}`} replace />
}
