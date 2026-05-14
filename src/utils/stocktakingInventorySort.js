/**
 * 盘点相关：按名称、规格、编码、产品档案 id 排序，同名称规格相邻便于清点。
 * 适用于仓库库存行、科室库存行（含 material 嵌套或扁平字段）。
 */
export function sortInventoryRowsByNameSpecCodeMaterialId(rows) {
  const str = (v) => (v == null || v === '' ? '' : String(v).trim());
  const keyTuple = (r) => {
    if (!r) {
      return ['', '', '', 0];
    }
    const m = r.material || null;
    const name = str((m && m.name) || r.materialName || r.name);
    const spec = str((m && m.speci) || r.speci || r.materialSpec || r.specification);
    const code = str((m && m.code) || r.materialCode || r.code);
    const midRaw = r.materialId != null ? Number(r.materialId) : (m && m.id != null ? Number(m.id) : 0);
    const mid = Number.isFinite(midRaw) ? midRaw : 0;
    return [name, spec, code, mid];
  };
  const cmp = (a, b) => {
    const ka = keyTuple(a);
    const kb = keyTuple(b);
    for (let i = 0; i < 3; i += 1) {
      const c = ka[i].localeCompare(kb[i], 'zh-CN');
      if (c !== 0) {
        return c;
      }
    }
    return ka[3] - kb[3];
  };
  return (rows || []).slice().sort(cmp);
}
