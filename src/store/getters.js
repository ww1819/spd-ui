const getters = {
  sidebar: state => state.app.sidebar,
  size: state => state.app.size,
  device: state => state.app.device,
  dict: state => state.dict.dict,
  visitedViews: state => state.tagsView.visitedViews,
  cachedViews: state => state.tagsView.cachedViews,
  token: state => state.user.token,
  avatar: state => state.user.avatar,
  name: state => state.user.name,
  introduction: state => state.user.introduction,
  roles: state => state.user.roles,
  permissions: state => state.user.permissions,
  tenant: state => state.user.tenant,
  customerId: state => (state.user.tenant && state.user.tenant.customerId) ? state.user.tenant.customerId : '',
  /** 科室导入：衡水市第三人民医院须填 HIS 科室 ID（tenantKey=HS_003 或 customerId 与 TenantEnum.HS_003 一致） */
  departImportRequiresHisDeptId: state => {
    const t = state.user.tenant
    if (!t) return false
    return t.tenantKey === 'HS_003' || t.customerId === 'hengsui-third-001'
  },
  /** 供应商：衡水市第三人民医院须填 HIS 供应商 ID（与 TenantEnum.HS_003 一致） */
  supplierImportRequiresHisId: state => {
    const t = state.user.tenant
    if (!t) return false
    return t.tenantKey === 'HS_003' || t.customerId === 'hengsui-third-001'
  },
  /** 生产厂家：衡水须填 HIS 生产厂家 ID（与 TenantEnum.HS_003 一致） */
  factoryImportRequiresHisId: state => {
    const t = state.user.tenant
    if (!t) return false
    return t.tenantKey === 'HS_003' || t.customerId === 'hengsui-third-001'
  },
  permission_routes: state => state.permission.routes,
  topbarRouters:state => state.permission.topbarRouters,
  defaultRoutes:state => state.permission.defaultRoutes,
  sidebarRouters:state => state.permission.sidebarRouters,
}
export default getters
