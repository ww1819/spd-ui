/** @deprecated 请使用 @/api/material/customer */
export {
  getTenantEnumList,
  addCustomer,
  delCustomer,
  listHcCustomers as listCustomer,
  getHcCustomer as getCustomer,
  updateHcCustomer as updateCustomer,
  changeHcStatus as changeCustomerStatus,
  getHcCustomerMenuIds as getCustomerMenuIds,
  saveHcCustomerMenus as saveCustomerMenus
} from '@/api/material/customer'
