import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom'
import { PageLayout } from '../components/layout/PageLayout'
import { BatonBoardView } from '../features/baton/BatonBoardView'
import { DashboardView } from '../features/dashboard/DashboardView'
import { LoginPage } from '../pages/LoginPage'
import { TaskDetailPage } from '../pages/TaskDetailPage'
import { TeamDetailPage } from '../pages/TeamDetailPage'
import { RequireAuth, RequireRole } from './RouteGuards'
import { ROUTES } from './routes'

// eslint-disable-next-line react-refresh/only-export-components
function AppShell() {
  return (
    <PageLayout>
      <Outlet />
    </PageLayout>
  )
}

export const appRouter = createBrowserRouter([
  { path: '/', element: <Navigate to={ROUTES.login} replace /> },
  { path: ROUTES.login, element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            element: <RequireRole allowed={['resilience_manager', 'team_lead']} />,
            children: [{ path: ROUTES.resilienceDashboard, element: <DashboardView /> }],
          },
          { path: ROUTES.batons, element: <BatonBoardView /> },
          { path: '/teams/:id', element: <TeamDetailPage /> },
          { path: '/batons/:id', element: <TaskDetailPage /> },
          { path: '/dashboard', element: <Navigate to={ROUTES.resilienceDashboard} replace /> },
          { path: '/baton', element: <Navigate to={ROUTES.batons} replace /> },
          { path: '/team/:id', element: <Navigate to={ROUTES.resilienceDashboard} replace /> },
          { path: '/task/:id', element: <Navigate to={ROUTES.batons} replace /> },
        ],
      },
    ],
  },
])
