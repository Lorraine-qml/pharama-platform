import { Outlet } from 'react-router-dom'
import { ToastProvider } from '../components/ToastProvider'

/** 登录 / 注册 / 找回密码等游客页共用 Toast */
export default function PublicLayout() {
  return (
    <ToastProvider>
      <Outlet />
    </ToastProvider>
  )
}
