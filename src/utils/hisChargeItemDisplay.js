/** 明细行：从 material 取 HIS 收费项目展示字段 */
export function hisChargeCodeFromMaterial(m) {
  if (!m) return '--';
  return m.hisChargeItemCode || m.hisChargeItemId || '--';
}

export function hisChargeNameFromMaterial(m) {
  return (m && m.hisChargeItemName) || '--';
}

export function hisChargeSpeciFromMaterial(m) {
  return (m && m.hisChargeItemSpeci) || '--';
}

export function hisChargeUnitFromMaterial(m) {
  return (m && m.hisChargeItemUnit) || '--';
}

/** 汇总行：字段在 row 上（HashMap / InventorySummaryVo） */
export function hisChargeCodeFromRow(row) {
  if (!row) return '--';
  return row.hisChargeItemCode || row.his_charge_item_code || row.hisChargeItemId || '--';
}

export function hisChargeNameFromRow(row) {
  return (row && (row.hisChargeItemName || row.his_charge_item_name)) || '--';
}

export function hisChargeSpeciFromRow(row) {
  return (row && (row.hisChargeItemSpeci || row.his_charge_item_speci)) || '--';
}

export function hisChargeUnitFromRow(row) {
  return (row && (row.hisChargeItemUnit || row.his_charge_item_unit)) || '--';
}

export function hisChargePriceFromRow(row) {
  const p = row && (row.hisChargeItemPrice != null ? row.hisChargeItemPrice : row.his_charge_item_price);
  return p != null && p !== '' ? p : null;
}

/** 导出 Excel：5 列单元格（编码、名称、规格、单位、单价） */
export function hisChargeItemExportCellsFromMaterial(m) {
  const mat = m || {};
  const code = mat.hisChargeItemCode || mat.hisChargeItemId || '';
  const price = mat.hisChargeItemPrice;
  return [
    code,
    mat.hisChargeItemName || '',
    mat.hisChargeItemSpeci || '',
    mat.hisChargeItemUnit || '',
    price != null && price !== '' ? Number(price) : null,
  ];
}

export function hisChargeItemExportCellsFromRow(row) {
  const r = row || {};
  const code = r.hisChargeItemCode || r.hisChargeItemId || '';
  const price = r.hisChargeItemPrice;
  return [
    code,
    r.hisChargeItemName || '',
    r.hisChargeItemSpeci || '',
    r.hisChargeItemUnit || '',
    price != null && price !== '' ? Number(price) : null,
  ];
}
