/**
 * 汇总申购明细：从仓库定数选品结果填充行数据（含 warehouseId）
 */
export function buildAggEntryPickKey(row) {
  if (!row) return '';
  if (row.materialId != null && row.warehouseId != null) {
    return `${row.materialId}_${row.warehouseId}`;
  }
  return row.materialId != null ? String(row.materialId) : '';
}

export function fillAggEntryFromFixedNumber(row, material) {
  const mid = material.materialId != null ? material.materialId : material.id;
  row.materialId = mid;
  row.materialCode = material.code || '';
  row.materialName = material.name || '';
  row.materialSpec = material.speci || material.specification || '';
  row.unit = (material.fdUnit && material.fdUnit.unitName) || material.unitName || '';
  row.unitPrice = material.price || material.prince || '';
  row.brand = material.brand || '';
  row.supplierName = material.supplierName || (material.supplier && material.supplier.name) || '';
  row.model = material.model || '';
  row.producer = (material.fdFactory && material.fdFactory.factoryName) || material.factoryName || '';
  row.warehouseId = material.warehouseId != null ? String(material.warehouseId) : null;
  row.warehouseName = material.warehouseName || '';
  if (row.qty == null || row.qty === '') {
    row.qty = String(getDefaultPurchaseQtyFromMaterial(material));
  }
  if (row.qty && row.unitPrice) {
    const q = Number(row.qty) || 0;
    const p = Number(row.unitPrice) || 0;
    row.amt = (q * p).toFixed(2);
  }
  return row;
}

function getDefaultPurchaseQtyFromMaterial(material) {
  if (!material || typeof material !== 'object') return 1;
  const toPositiveInt = (v) => {
    if (v == null || String(v).trim() === '') return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.max(1, Math.floor(n));
  };
  for (const key of ['minPackageQty', 'minPackQty', 'minimumPackageQty', 'min_package_qty']) {
    const n = toPositiveInt(material[key]);
    if (n != null) return n;
  }
  return 1;
}
