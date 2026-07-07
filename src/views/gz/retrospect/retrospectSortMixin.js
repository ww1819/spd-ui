/** 高值追溯各表：耗材编码/名称/规格/型号/单位/数量/单价/金额 前端排序 */
export default {
  methods: {
    traceSortByStr(a, b, getVal) {
      const va = (getVal(a) || '').toString().trim();
      const vb = (getVal(b) || '').toString().trim();
      return va.localeCompare(vb, 'zh-CN');
    },
    traceSortByNum(a, b, getVal) {
      const va = Number(getVal(a));
      const vb = Number(getVal(b));
      if (isNaN(va) && isNaN(vb)) return 0;
      if (isNaN(va)) return 1;
      if (isNaN(vb)) return -1;
      return va - vb;
    },
    traceGetMaterialCode(r) {
      return (r.material && r.material.code) || r.materialCode || '';
    },
    traceGetMaterialName(r) {
      return (r.material && r.material.name) || r.materialName || '';
    },
    traceGetSpeci(r) {
      return (r.material && r.material.speci) || r.specification || '';
    },
    traceGetModel(r) {
      return (r.material && r.material.model) || r.model || '';
    },
    traceGetUnitName(r) {
      return (r.material && r.material.fdUnit && r.material.fdUnit.unitName) || r.unit || '';
    },
    traceGetQuantity(r) {
      return r.quantity;
    },
    traceGetChargePrice(r) {
      return r.chargePrice;
    },
    traceGetAmount(r) {
      const q = Number(r.quantity);
      const p = Number(r.chargePrice);
      if (isNaN(q) || isNaN(p)) return NaN;
      return q * p;
    },
    sortTraceMaterialCode(a, b) {
      return this.traceSortByStr(a, b, this.traceGetMaterialCode);
    },
    sortTraceMaterialName(a, b) {
      return this.traceSortByStr(a, b, this.traceGetMaterialName);
    },
    sortTraceSpeci(a, b) {
      return this.traceSortByStr(a, b, this.traceGetSpeci);
    },
    sortTraceModel(a, b) {
      return this.traceSortByStr(a, b, this.traceGetModel);
    },
    sortTraceUnitName(a, b) {
      return this.traceSortByStr(a, b, this.traceGetUnitName);
    },
    sortTraceQuantity(a, b) {
      return this.traceSortByNum(a, b, this.traceGetQuantity);
    },
    sortTraceChargePrice(a, b) {
      return this.traceSortByNum(a, b, this.traceGetChargePrice);
    },
    sortTraceAmount(a, b) {
      return this.traceSortByNum(a, b, this.traceGetAmount);
    },
    sortSummaryQuantity(a, b) {
      return this.traceSortByNum(a, b, r => r.quantity);
    },
    sortSummaryAmount(a, b) {
      return this.traceSortByNum(a, b, r => r.amount);
    },
    sortUsageMaterialName(a, b) {
      return this.traceSortByStr(a, b, r => r.materialName || '');
    },
    sortUsageSpeci(a, b) {
      return this.traceSortByStr(a, b, r => r.specification || '');
    },
    sortUsageModel(a, b) {
      return this.traceSortByStr(a, b, r => r.model || '');
    },
    sortUsageUnitName(a, b) {
      return this.traceSortByStr(a, b, r => r.unitName || '');
    },
    sortUsageConsumeQty(a, b) {
      return this.traceSortByNum(a, b, r => r.consumeQty);
    },
    sortUsageRemainQty(a, b) {
      return this.traceSortByNum(a, b, r => r.remainQty);
    }
  }
};
