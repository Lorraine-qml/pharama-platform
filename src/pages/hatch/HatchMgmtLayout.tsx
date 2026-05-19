import { Outlet } from 'react-router-dom'

/** Provider 已上移至 AppShell，与科创策源等模块共享入孵演示状态 */
export default function HatchMgmtLayout() {
  return <Outlet />
}
