import { checkWarehouseInboundEnabled } from '@/api/foundation/warehouse';

const DEFAULT_INBOUND_MSG = '该仓库已经停用，不能在进行入库';
const DEFAULT_STOCK_INBOUND_MSG = '该仓库已经停用，不能进行备货入库';

function resolveErrorMessage(err, fallback) {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  return fallback;
}

/** 调用后端校验仓库是否允许入库（不依赖下拉列表里的状态字段） */
export function assertWarehouseInboundEnabled(warehouseId, vm, message) {
  if (warehouseId == null || warehouseId === '') {
    return Promise.resolve(true);
  }
  const fallback = message || DEFAULT_INBOUND_MSG;
  return checkWarehouseInboundEnabled(warehouseId)
    .then(() => true)
    .catch((err) => {
      vm.$modal.msgWarning(resolveErrorMessage(err, fallback));
      return false;
    });
}

export function assertWarehouseStockInboundEnabled(warehouseId, vm) {
  return assertWarehouseInboundEnabled(warehouseId, vm, DEFAULT_STOCK_INBOUND_MSG);
}
