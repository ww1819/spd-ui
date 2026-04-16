import request from '@/utils/request'

/** 已审核备货验收单列表 */
export function listAuditedAcceptance(query) {
  return request({
    url: '/gz/refDoc/acceptance/audited',
    method: 'get',
    params: query
  })
}

/** 验收单在指定仓库下有库存的备货行 */
export function listAcceptanceDepotLines(orderId, warehouseId) {
  return request({
    url: '/gz/refDoc/acceptance/' + orderId + '/depotLines',
    method: 'get',
    params: { warehouseId }
  })
}

/** 已审核备货出库单 */
export function listAuditedShipment(query) {
  return request({
    url: '/gz/refDoc/shipment/audited',
    method: 'get',
    params: query
  })
}

/** 出库单在指定科室仍有库存的明细（退库引用） */
export function listShipmentLinesForTk(shipmentId, departmentId) {
  return request({
    url: '/gz/refDoc/shipment/' + shipmentId + '/linesForTk',
    method: 'get',
    params: { departmentId }
  })
}
