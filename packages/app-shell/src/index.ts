/**
 * @repo/app-shell — the parts every K&K app shares: root layout, login,
 * sign-up and the role guard. Each app adds its own screens on top.
 */
export { RootLayout } from './RootLayout'
export { LoginScreen } from './LoginScreen'
export { RegisterScreen } from './RegisterScreen'
export { RequireRole, FullScreenSpinner, webUrlForRole } from './RequireRole'
export { HomePlaceholder } from './HomePlaceholder'
