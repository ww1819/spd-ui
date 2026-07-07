/** 高值备货库存列表查询参数（明细/汇总/导出共用） */
export function buildDepotInventoryQueryParams(queryParams, extra = {}) {
  const params = { ...queryParams, ...extra };
  const kw = params.materialKeyword != null ? String(params.materialKeyword).trim() : '';
  params.materialKeyword = kw || null;
  const inHospitalCode = params.inHospitalCode != null ? String(params.inHospitalCode).trim() : '';
  params.inHospitalCode = inHospitalCode || null;
  const orderNo = params.orderNo != null ? String(params.orderNo).trim() : '';
  params.orderNo = orderNo || null;
  // 院内码、入库单号为精确追溯，不受默认「近5天」日期窗口限制
  if (inHospitalCode || orderNo) {
    params.beginDate = null;
    params.endDate = null;
  }
  return params;
}
