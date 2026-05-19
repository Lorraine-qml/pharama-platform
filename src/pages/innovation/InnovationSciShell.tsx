import { Outlet } from 'react-router-dom'
import { InnovationDemoProvider } from './InnovationDemoContext'
import { InnovationInvestmentV2Provider } from './v2/InnovationInvestmentV2Context'

export default function InnovationSciShell() {
  return (
    <InnovationDemoProvider>
      <InnovationInvestmentV2Provider>
        <Outlet />
      </InnovationInvestmentV2Provider>
    </InnovationDemoProvider>
  )
}
