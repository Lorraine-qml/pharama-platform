import { Outlet } from 'react-router-dom'
import { TwinInfraProvider } from './TwinInfraContext'

/** 空间分布子模块：依赖园区/单体/空间台账与入孵档案联动 */
export default function TwinDistributionLayout() {
  return (
    <TwinInfraProvider>
      <Outlet />
    </TwinInfraProvider>
  )
}
