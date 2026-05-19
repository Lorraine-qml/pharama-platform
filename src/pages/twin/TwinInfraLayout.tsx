import { Outlet } from 'react-router-dom'
import { TwinInfraProvider } from './TwinInfraContext'

export default function TwinInfraLayout() {
  return (
    <TwinInfraProvider>
      <Outlet />
    </TwinInfraProvider>
  )
}
