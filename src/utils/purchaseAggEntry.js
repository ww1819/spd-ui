/**
 * 汇总申购明细：从仓库定数选品结果填充行数据（含 warehouseId、isGz）
 */
export function formatIsGzLabel(isGz) {
  if (isGz === '1' || isGz === 1) return '高值';
  if (isGz === '2' || isGz === 2) return '低值';
  return '--';
}

export function buildAggEntryPickKey(row) {
  if (!row) return '';
  if (row.materialId != null && row.warehouseId != null && row.isGz != null) {
    return `${row.materialId}_${row.warehouseId}_${row.isGz}`;
  }
  if (row.materialId != null && row.warehouseId != null) {
    return `${row.materialId}_${row.warehouseId}`;
  }
  return row.materialId != null ? String(row.materialId) : '';
}

export function fillAggEntryFromFixedNumber(row, material) {
  const mid = resolveMaterialId(material);
  row.materialId = mid;
  // 勿将选品行的 id/pickKey 当作明细主键
  if (row.id != null) {
    delete row.id;
  }
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
  row.isGz = material.isGz != null ? String(material.isGz) : null;
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

function resolveMaterialId(material) {
  if (!material) return null;
  if (material.materialId != null && material.materialId !== '') {
    return material.materialId;
  }
  const raw = material.id;
  if (raw == null || raw === '') return null;
  const s = String(raw);
  if (s.includes('_')) {
    const part = s.split('_')[0];
    const n = Number(part);
    return Number.isFinite(n) ? n : part;
  }
  return raw;
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
