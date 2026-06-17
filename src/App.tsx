import { Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from './components/RequireAuth'
import AppShell from './layouts/AppShell'
import PublicLayout from './layouts/PublicLayout'
import HomePage from './pages/HomePage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import PlatformModulesPage from './pages/PlatformModulesPage'
import StrategySourceCockpitPage from './pages/strategyCockpit/StrategySourceCockpitPage'
import MatchmakingPage from './pages/MatchmakingPage'
import AiWorkflowPage from './pages/AiWorkflowPage'
import CockpitPage from './pages/CockpitPage'
import AiQueryPage from './pages/AiQueryPage'
import DataAssetsPage from './pages/DataAssetsPage'
import DataQualityPage from './pages/DataQualityPage'
import SystemUsersPage from './pages/system/SystemUsersPage'
import SystemRolesPage from './pages/system/SystemRolesPage'
import SystemWorkflowsPage from './pages/system/SystemWorkflowsPage'
import SystemAuditLogsPage from './pages/system/SystemAuditLogsPage'
import SystemParamsPage from './pages/system/SystemParamsPage'
import EvalEffectivenessPage from './pages/eval/EvalEffectivenessPage'
import EvalGrowthScorePage from './pages/eval/EvalGrowthScorePage'
import EvalGrowthTrackingPage from './pages/eval/EvalGrowthTrackingPage'
import EvalIncubationAdvicePage from './pages/eval/EvalIncubationAdvicePage'
import EvalPortraitPage from './pages/eval/EvalPortraitPage'
import EvalRiskAlertsPage from './pages/eval/EvalRiskAlertsPage'
import BasicDataLayout from './pages/basicData/BasicDataLayout'
import BasicEvaluationFormsPage from './pages/basicData/BasicEvaluationFormsPage'
import BasicContractTemplatesPage from './pages/basicData/BasicContractTemplatesPage'
import BasicExpertLibraryPage from './pages/basicData/BasicExpertLibraryPage'
import BasicRostersPage from './pages/basicData/BasicRostersPage'
import BasicDictionariesPage from './pages/basicData/BasicDictionariesPage'
import BasicResourceTypesPage from './pages/basicData/BasicResourceTypesPage'
import InnovationSciShell from './pages/innovation/InnovationSciShell'
import InnovationIndexRedirect from './pages/innovation/InnovationIndexRedirect'
import { InnovationLegacyRoutes } from './pages/innovation/InnovationLegacyRedirects'
import IncubationProjectRegisterWizardPage from './pages/innovation/IncubationProjectRegisterWizardPage'
import InnovationProjectDetailPage from './pages/innovation/InnovationProjectDetailPage'
import InnovationOpsWorkbenchPage from './pages/innovation/InnovationOpsWorkbenchPage'
import InnovationOpsPoolPage from './pages/innovation/InnovationOpsPoolPage'
import InnovationOpsAiHubPage from './pages/innovation/InnovationOpsAiHubPage'
import InnovationOpsMaterialReviewPage from './pages/innovation/InnovationOpsMaterialReviewPage'
import InnovationOpsAiEvalPage from './pages/innovation/InnovationOpsAiEvalPage'
import InnovationOpsAssignExpertsPage from './pages/innovation/InnovationOpsAssignExpertsPage'
import InnovationOpsDecisionPage from './pages/innovation/InnovationOpsDecisionPage'
import InnovationExpertReviewWorkbenchPage from './pages/innovation/InnovationExpertReviewWorkbenchPage'
import InnovationIndustryTrendsHubPage from './pages/innovation/v2/InnovationIndustryTrendsHubPage'
import InnovationLeadDetailPage from './pages/innovation/v2/InnovationLeadDetailPage'
import InnovationOutreachHub from './pages/innovation/v2/InnovationOutreachHub'
import InnovationOutreachIndexPlaceholder from './pages/innovation/v2/InnovationOutreachIndexPlaceholder'
import HatchMgmtLayout from './pages/hatch/HatchMgmtLayout'
import { HatchOpsWorkbenchPage } from './pages/hatch/HatchOpsWorkbenchPage'
import HatchArchivePage from './pages/hatch/HatchArchivePage'
import HatchArchiveDetailPage from './pages/hatch/HatchArchiveDetailPage'
import HatchPhysicalSpacePage, { HatchSpaceDetailPage } from './pages/hatch/HatchPhysicalSpacePage'
import TwinInfraLayout from './pages/twin/TwinInfraLayout'
import TwinInfraOverviewPage from './pages/twin/TwinInfraOverviewPage'
import TwinInfraParksPage from './pages/twin/TwinInfraParksPage'
import TwinInfraBuildingsPage from './pages/twin/TwinInfraBuildingsPage'
import TwinInfraSpacesPage from './pages/twin/TwinInfraSpacesPage'
import TwinInfraModelsPage from './pages/twin/TwinInfraModelsPage'
import TwinDistributionLayout from './pages/twin/TwinDistributionLayout'
import TwinProjectSpaceDistributionPage from './pages/twin/TwinProjectSpaceDistributionPage'
import TwinResourceSpaceDistributionPage from './pages/twin/TwinResourceSpaceDistributionPage'
import TwinSpaceAnalyticsPage from './pages/twin/TwinSpaceAnalyticsPage'
import EcoLayout from './pages/eco/EcoLayout'
import EcoVirtualProjectsPage from './pages/eco/EcoVirtualProjectsPage'
import EcoExternalPartnersPage from './pages/eco/EcoExternalPartnersPage'
import EcoAiAbilityPage from './pages/eco/EcoAiAbilityPage'
import EcoKnowledgeBasePage from './pages/eco/EcoKnowledgeBasePage'
import EcoKnowledgeDocsPage from './pages/eco/EcoKnowledgeDocsPage'
import ResopsV1Shell from './pages/resops/ResopsV1Shell'
import ResopsMgmtPage from './pages/resops/ResopsMgmtPage'
import ResopsCatalogBrowsePage from './pages/resops/ResopsCatalogBrowsePage'
import ResopsListingApplyPage from './pages/resops/ResopsListingApplyPage'
import ResopsListingAuditPage from './pages/resops/ResopsListingAuditPage'
import ResopsResourceDetailPage from './pages/resops/ResopsResourceDetailPage'
import ResopsMyApplicationsPage from './pages/resops/ResopsMyApplicationsPage'
import ResopsUsageOrdersPage from './pages/resops/ResopsUsageOrdersPage'
import ResopsUsageOrderDetailPage from './pages/resops/ResopsUsageOrderDetailPage'
import ResopsProviderWorkbenchPage from './pages/resops/ResopsProviderWorkbenchPage'
import ResopsBoardPage from './pages/resops/ResopsBoardPage'
import ResopsAiMatchPage from './pages/resops/ResopsAiMatchPage'
import ResopsMatchAnalyticsPage from './pages/resops/ResopsMatchAnalyticsPage'

export default function App() {
  return (
    <Routes>
      <Route index element={<StrategySourceCockpitPage />} />
      <Route path="/platform-modules" element={<PlatformModulesPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route element={<PublicLayout />}>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="console" element={<HomePage />} />

          {/* 科创策源（演示：DemoProvider 仅包裹本前缀） */}
          <Route path="innovation" element={<InnovationSciShell />}>
            <Route index element={<InnovationIndexRedirect />} />
            <Route path="applicant/projects" element={<Navigate to="/innovation/ops/pool" replace />} />
            <Route path="applicant/register" element={<IncubationProjectRegisterWizardPage />} />
            <Route path="project/:projectId" element={<InnovationProjectDetailPage />} />
            <Route path="ops/workbench" element={<InnovationOpsWorkbenchPage />} />
            <Route path="ops/pool" element={<InnovationOpsPoolPage />} />
            <Route path="ops/ai-hub" element={<InnovationOpsAiHubPage />} />
            <Route path="ops/expert-mgmt" element={<Navigate to="/innovation/ops/workbench" replace />} />
            <Route path="ops/decision-hub" element={<Navigate to="/innovation/ops/workbench" replace />} />
            <Route path="ops/projects" element={<Navigate to="/innovation/ops/pool" replace />} />
            <Route path="ops/review/:projectId" element={<InnovationOpsMaterialReviewPage />} />
            <Route path="ops/ai/:projectId" element={<InnovationOpsAiEvalPage />} />
            <Route path="ops/assign/:projectId" element={<InnovationOpsAssignExpertsPage />} />
            <Route path="ops/decision/:projectId" element={<InnovationOpsDecisionPage />} />
            <Route path="expert/tasks" element={<Navigate to="/innovation/ops/workbench" replace />} />
            <Route path="expert/review/:projectId" element={<InnovationExpertReviewWorkbenchPage />} />
            <Route path="industry-trends" element={<InnovationIndustryTrendsHubPage />} />
            <Route path="outreach" element={<InnovationOutreachHub />}>
              <Route index element={<InnovationOutreachIndexPlaceholder />} />
              <Route path="leads/:leadId" element={<InnovationLeadDetailPage />} />
            </Route>
          </Route>
          <Route path="innovation/project-registration" element={<InnovationLegacyRoutes variant="registration" />} />
          <Route path="innovation/project-materials" element={<InnovationLegacyRoutes variant="materials" />} />
          <Route path="innovation/ai-evaluation" element={<InnovationLegacyRoutes variant="ai" />} />
          <Route path="innovation/expert-review" element={<InnovationLegacyRoutes variant="expert-mgmt" />} />
          <Route path="innovation/incubation-decision" element={<InnovationLegacyRoutes variant="decision" />} />

          {/* 入孵管理（精简菜单 + 共享演示状态） */}
          <Route path="hatch/identity" element={<Navigate to="/basic/dictionaries" replace />} />
          <Route path="hatch/exit" element={<Navigate to="/hatch/changes" replace />} />
          <Route path="hatch/ai-permissions" element={<Navigate to="/hatch/workbench" replace />} />
          <Route path="hatch/signing" element={<Navigate to="/hatch/workbench" replace />} />
          <Route path="hatch/signing/workbench" element={<Navigate to="/hatch/workbench" replace />} />
          <Route path="hatch/signing/list" element={<Navigate to="/hatch/archive" replace />} />
          <Route path="hatch/changes" element={<Navigate to="/hatch/workbench" replace />} />
          <Route path="hatch" element={<HatchMgmtLayout />}>
            <Route path="workbench" element={<HatchOpsWorkbenchPage />} />
            <Route index element={<Navigate to="/hatch/workbench" replace />} />
            <Route path="archive" element={<HatchArchivePage />} />
            <Route path="archive/:projectId" element={<HatchArchiveDetailPage />} />
            <Route path="physical-space" element={<HatchPhysicalSpacePage />} />
            <Route path="physical-space/:allocationId" element={<HatchSpaceDetailPage />} />
          </Route>

          {/* 资源运营 V1：统一演示上下文 */}
          <Route path="resops" element={<ResopsV1Shell />}>
            <Route index element={<Navigate to="/resops/catalog" replace />} />
            <Route path="board" element={<ResopsBoardPage />} />
            <Route path="mgmt" element={<ResopsMgmtPage />} />
            <Route path="catalog" element={<ResopsCatalogBrowsePage />} />
            <Route path="listing-apply" element={<ResopsListingApplyPage />} />
            <Route path="listing-audit" element={<ResopsListingAuditPage />} />
            <Route path="resource/:resourceId" element={<ResopsResourceDetailPage />} />
            <Route path="my-applications" element={<ResopsMyApplicationsPage />} />
            <Route path="usage-orders" element={<ResopsUsageOrdersPage />} />
            <Route path="usage-orders/:orderId" element={<ResopsUsageOrderDetailPage />} />
            <Route path="provider" element={<ResopsProviderWorkbenchPage />} />
            <Route path="ai-match" element={<ResopsAiMatchPage />} />
            <Route path="match-analytics" element={<ResopsMatchAnalyticsPage />} />
          </Route>
          <Route path="resops/resource-types" element={<Navigate to="/basic/resource-types" replace />} />
          <Route path="resops/registration" element={<Navigate to="/resops/mgmt" replace />} />
          <Route path="resops/review-admission" element={<Navigate to="/resops/mgmt" replace />} />
          <Route path="resops/spatial-bind" element={<Navigate to="/resops/mgmt" replace />} />
          <Route path="resops/status" element={<Navigate to="/resops/mgmt" replace />} />
          <Route path="resops/booking" element={<Navigate to="/resops/catalog" replace />} />
          <Route path="resops/application-review" element={<Navigate to="/resops/provider" replace />} />
          <Route path="resops/reputation" element={<Navigate to="/resops/catalog" replace />} />
          <Route path="resops/supervision" element={<Navigate to="/resops/mgmt" replace />} />

          {/* 孵化评估 */}
          <Route path="eval/portrait" element={<EvalPortraitPage />} />
          <Route path="eval/growth-tracking" element={<EvalGrowthTrackingPage />} />
          <Route path="eval/growth-score" element={<EvalGrowthScorePage />} />
          <Route path="eval/effectiveness" element={<EvalEffectivenessPage />} />
          <Route path="eval/risk" element={<EvalRiskAlertsPage />} />
          <Route path="eval/advice" element={<EvalIncubationAdvicePage />} />

          {/* 数字孪生空间 */}
          <Route path="twin/infrastructure" element={<TwinInfraLayout />}>
            <Route index element={<TwinInfraOverviewPage />} />
            <Route path="parks" element={<TwinInfraParksPage />} />
            <Route path="models" element={<TwinInfraModelsPage />} />
            <Route path="buildings" element={<TwinInfraBuildingsPage />} />
            <Route path="spaces" element={<TwinInfraSpacesPage />} />
          </Route>
          <Route path="twin/distribution" element={<TwinDistributionLayout />}>
            <Route path="projects" element={<TwinProjectSpaceDistributionPage />} />
            <Route path="resources" element={<TwinResourceSpaceDistributionPage />} />
          </Route>
          <Route path="twin/space-analytics" element={<TwinSpaceAnalyticsPage />} />
          <Route path="twin/park-model" element={<Navigate to="/twin/infrastructure" replace />} />
          <Route path="twin/spaces" element={<Navigate to="/twin/infrastructure/spaces" replace />} />
          <Route path="twin/project-map" element={<Navigate to="/twin/distribution/projects" replace />} />
          <Route path="twin/resource-map" element={<Navigate to="/twin/distribution/resources" replace />} />
          <Route path="twin/virtual-layer" element={<Navigate to="/twin/infrastructure" replace />} />
          <Route path="twin/analytics" element={<Navigate to="/twin/space-analytics" replace />} />

          {/* 生态协同（虚拟资源与合作能力，需求见 docs/eco-synergy/） */}
          <Route path="eco" element={<EcoLayout />}>
            <Route index element={<Navigate to="/eco/virtual-project" replace />} />
            <Route path="virtual-project" element={<EcoVirtualProjectsPage />} />
            <Route path="external-partner" element={<EcoExternalPartnersPage />} />
            <Route path="ai-ability" element={<EcoAiAbilityPage />} />
            <Route path="knowledge-base" element={<EcoKnowledgeBasePage />} />
            <Route path="knowledge-base/:libraryId/manage" element={<EcoKnowledgeDocsPage />} />
          </Route>

          {/* 基础数据（演示数据上下文） */}
          <Route path="basic" element={<BasicDataLayout />}>
            <Route path="evaluation-forms" element={<BasicEvaluationFormsPage />} />
            <Route path="contracts" element={<BasicContractTemplatesPage />} />
            <Route path="experts" element={<BasicExpertLibraryPage />} />
            <Route path="rosters" element={<BasicRostersPage />} />
            <Route path="dictionaries" element={<BasicDictionariesPage />} />
            <Route path="resource-types" element={<BasicResourceTypesPage />} />
          </Route>

          <Route path="portal/matchmaking" element={<MatchmakingPage />} />
          <Route path="ai-workflow" element={<AiWorkflowPage />} />
          <Route path="cockpit" element={<CockpitPage />} />
          <Route path="cockpit/ai-query" element={<AiQueryPage />} />
          <Route path="data/assets" element={<DataAssetsPage />} />
          <Route path="data/quality" element={<DataQualityPage />} />

          {/* 系统管理（孵化运营平台侧栏） */}
          <Route path="system/users" element={<SystemUsersPage />} />
          <Route path="system/roles" element={<SystemRolesPage />} />
          <Route path="system/workflows" element={<SystemWorkflowsPage />} />
          <Route path="system/audit" element={<SystemAuditLogsPage />} />
          <Route path="system/settings" element={<SystemParamsPage />} />
          <Route path="system/overview" element={<Navigate to="/system/users" replace />} />
          <Route path="system/orgs" element={<Navigate to="/system/users" replace />} />
          <Route path="system/notices" element={<Navigate to="/system/settings" replace />} />

          {/* 兼容旧 URL */}
          <Route path="leads" element={<Navigate to="/innovation/project-registration" replace />} />
          <Route path="leads/assessment" element={<Navigate to="/innovation/ai-evaluation" replace />} />
          <Route path="onboarding/space" element={<Navigate to="/hatch/physical-space" replace />} />
          <Route path="onboarding/profile" element={<Navigate to="/hatch/archive" replace />} />
          <Route path="resources/demo" element={<Navigate to="/resops/catalog" replace />} />
          <Route path="growth" element={<Navigate to="/eval/growth-tracking" replace />} />
          <Route path="digital-twin" element={<Navigate to="/twin/infrastructure" replace />} />
          <Route path="admin/roles" element={<Navigate to="/system/roles" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
