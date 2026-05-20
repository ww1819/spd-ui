import {
  hisChargeCodeFromMaterial,
  hisChargeNameFromMaterial,
  hisChargeSpeciFromMaterial,
  hisChargeUnitFromMaterial,
  hisChargeCodeFromRow,
  hisChargeNameFromRow,
  hisChargeSpeciFromRow,
  hisChargeUnitFromRow,
  hisChargePriceFromRow,
} from '@/utils/hisChargeItemDisplay';
import currencyFmt from '@/utils/format-currency';

/**
 * 在 el-table 内用 v-for 渲染收费项目列（Element UI 2 不支持子组件 render 多列）
 * 使用：mixins: [hisChargeItemTableColumnsMixin]，props 或 data 设置 hisChargeFlatRow
 * 模板：<template v-for="col in hisChargeItemColumnDefs">...</template>
 */
export default {
  data() {
    return {
      /** 汇总行 true：字段在 row 上；明细行 false：在 row.material 上 */
      hisChargeFlatRow: false,
    };
  },
  computed: {
    hisChargeItemColumnDefs() {
      const flat = this.hisChargeFlatRow === true;
      return [
        {
          key: 'code',
          label: '收费项目编码',
          width: 120,
          text: (row) => (flat ? hisChargeCodeFromRow(row) : hisChargeCodeFromMaterial(row.material)),
        },
        {
          key: 'name',
          label: '收费项目名称',
          width: 160,
          text: (row) => (flat ? hisChargeNameFromRow(row) : hisChargeNameFromMaterial(row.material)),
        },
        {
          key: 'speci',
          label: '收费项目规格',
          width: 120,
          text: (row) => (flat ? hisChargeSpeciFromRow(row) : hisChargeSpeciFromMaterial(row.material)),
        },
        {
          key: 'unit',
          label: '收费项目单位',
          width: 90,
          text: (row) => (flat ? hisChargeUnitFromRow(row) : hisChargeUnitFromMaterial(row.material)),
        },
        {
          key: 'price',
          label: '收费项目单价',
          width: 110,
          text: (row) => {
            const p = flat ? hisChargePriceFromRow(row) : (row.material && row.material.hisChargeItemPrice);
            if (p == null || p === '') {
              return '--';
            }
            return currencyFmt.formatCurrency(p, '--');
          },
        },
      ];
    },
  },
};
