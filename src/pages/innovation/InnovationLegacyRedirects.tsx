import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

/** 兼容旧侧边栏书签：科创策源老路径统一到新模块 */
export function InnovationLegacyRoutes({ variant }: { variant: 'registration' | 'materials' | 'ai' | 'expert-mgmt' | 'decision' }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />

  switch (variant) {
    case 'registration':
      return <Navigate to="/innovation/applicant/register" replace />
    case 'materials':
      return <Navigate to="/innovation/ops/pool" replace />
    case 'ai':
    case 'expert-mgmt':
    case 'decision':
      return <Navigate to="/innovation/ops/workbench" replace />
    default:
      return <Navigate to="/innovation" replace />
  }
}
