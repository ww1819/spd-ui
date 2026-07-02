/** 与耗材 is_use / 仓库 warehouse_status 一致：1=启用，2=停用 */
export const WAREHOUSE_STATUS_ENABLED = '1';
export const WAREHOUSE_STATUS_DISABLED = '2';

export function readWarehouseStatus(warehouse) {
  if (!warehouse) return null;
  const status = warehouse.warehouseStatus != null ? warehouse.warehouseStatus : warehouse.warehouse_status;
  if (status == null || status === '') return null;
  return String(status).trim();
}

/** @returns {true|false|null} null 表示本地无法判断，需走后端校验 */
export function isWarehouseDisabled(warehouse) {
  const status = readWarehouseStatus(warehouse);
  if (status == null) return null;
  if (status === WAREHOUSE_STATUS_DISABLED) return true;
  if (status === WAREHOUSE_STATUS_ENABLED) return false;
  return null;
}

export function isWarehouseEnabled(warehouse) {
  const disabled = isWarehouseDisabled(warehouse);
  if (disabled == null) return null;
  return !disabled;
}

export function findWarehouseById(options, warehouseId) {
  if (warehouseId == null || warehouseId === '') return null;
  return (options || []).find(item => String(item.id) === String(warehouseId));
}
