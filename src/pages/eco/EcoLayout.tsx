import { Outlet } from 'react-router-dom'
import { EcoProvider } from './EcoContext'

/** 生态协同子模块：虚拟资源与合作能力（与孪生实体台账解耦） */
export default function EcoLayout() {
  return (
    <EcoProvider>
      <Outlet />
    </EcoProvider>
  )
}
