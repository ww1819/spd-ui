/** 高值备货库存：明细/汇总表前端排序 */
export default {
  methods: {
    depotSortByStr(a, b, getVal) {
      const va = (getVal(a) || '').toString().trim();
      const vb = (getVal(b) || '').toString().trim();
      return va.localeCompare(vb, 'zh-CN');
    },
    depotSortByNum(a, b, getVal) {
      const va = Number(getVal(a));
      const vb = Number(getVal(b));
      if (isNaN(va) && isNaN(vb)) return 0;
      if (isNaN(va)) return 1;
      if (isNaN(vb)) return -1;
      return va - vb;
    },
    sortDepotMaterialCode(a, b) {
      return this.depotSortByStr(a, b, r => (r.material && r.material.code) || '');
    },
    sortDepotMaterialName(a, b) {
      return this.depotSortByStr(a, b, r => (r.material && r.material.name) || '');
    },
    sortDepotSpeci(a, b) {
      return this.depotSortByStr(a, b, r => (r.material && r.material.speci) || r.specification || '');
    },
    sortDepotModel(a, b) {
      return this.depotSortByStr(a, b, r => (r.material && r.material.model) || r.model || '');
    },
    sortDepotUnitName(a, b) {
      return this.depotSortByStr(a, b, r => (r.material && r.material.fdUnit && r.material.fdUnit.unitName) || '');
    },
    sortDepotQty(a, b) {
      return this.depotSortByNum(a, b, r => r.qty);
    },
    sortDepotUnitPrice(a, b) {
      return this.depotSortByNum(a, b, r => r.unitPrice);
    },
    sortDepotAmt(a, b) {
      return this.depotSortByNum(a, b, r => r.amt);
    },
    sortSummaryMaterialCode(a, b) {
      return this.depotSortByStr(a, b, r => r.materialCode || '');
    },
    sortSummaryMaterialName(a, b) {
      return this.depotSortByStr(a, b, r => r.materialName || '');
    },
    sortSummarySpeci(a, b) {
      return this.depotSortByStr(a, b, r => r.materialSpeci || '');
    },
    sortSummaryModel(a, b) {
      return this.depotSortByStr(a, b, r => r.materialModel || '');
    },
    sortSummaryUnitName(a, b) {
      return this.depotSortByStr(a, b, r => r.unitName || '');
    },
    sortSummaryUnitPrice(a, b) {
      return this.depotSortByNum(a, b, r => r.unitPrice);
    },
    sortSummaryTotalQty(a, b) {
      return this.depotSortByNum(a, b, r => r.totalQty);
    },
    sortSummaryTotalAmt(a, b) {
      return this.depotSortByNum(a, b, r => r.totalAmt);
    },
  },
};
