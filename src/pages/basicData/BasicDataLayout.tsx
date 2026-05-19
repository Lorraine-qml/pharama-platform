import { Outlet } from 'react-router-dom'
import { BasicDataDemoProvider } from './BasicDataDemoContext'

export default function BasicDataLayout() {
  return (
    <BasicDataDemoProvider>
      <Outlet />
    </BasicDataDemoProvider>
  )
}
