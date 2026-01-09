<template>
  <div class="new-product-audit-print" ref="newProductAuditPrintRef" hidden="hidden">
    <!-- 标题和制表日期 -->
    <div class="header-section">
      <div class="form-title">
        <span v-if="hospitalName">{{ hospitalName }}</span>医用耗材申请表
      </div>
      <div class="form-date">制表日期: {{ formatDate(row.auditDate || row.applyDate) }}</div>
    </div>

    <!-- 基本信息区域 -->
    <div class="form-section">
      <div class="form-row">
        <div class="form-label required">*申请科室:</div>
        <div class="form-value">{{ row.departmentName || '--' }}</div>
        <div class="form-label required">*申请人:</div>
        <div class="form-value">{{ row.createBy || '--' }}</div>
        <div class="form-label required">*填表日期:</div>
        <div class="form-value">{{ formatDate(row.applyDate) }}</div>
      </div>

      <div class="form-row">
        <div class="form-label required">*医用耗材名称:</div>
        <div class="form-value full-width">{{ getMaterialName() }}</div>
      </div>

      <div class="form-row">
        <div class="form-label required">*规格型号:</div>
        <div class="form-value">{{ getSpecification() }}</div>
        <div class="form-label">生产厂家:</div>
        <div class="form-value">{{ getFactoryName() }}</div>
        <div class="form-label">品牌要求:</div>
        <div class="form-value">{{ getBrandRequirement() }}</div>
      </div>

      <div class="form-row">
        <div class="form-label">特殊说明:</div>
        <div class="form-value full-width">{{ getSpecialNote() }}</div>
      </div>
    </div>

    <!-- 病案费用类别 -->
    <div class="form-section">
      <div class="form-row">
        <div class="form-label required">*病案费用类别:</div>
        <div class="form-checkboxes">
          <span>检查用一次性医用材料 ({{ getCaseFeeCategory('检查用一次性医用材料') }})</span>
          <span>治疗用一次性医用材料 ({{ getCaseFeeCategory('治疗用一次性医用材料') }})</span>
          <span>手术用一次性医用材料 ({{ getCaseFeeCategory('手术用一次性医用材料') }})</span>
        </div>
      </div>
    </div>

    <!-- 院内同类产品对比表格 -->
    <div class="form-section">
      <div class="table-label">申请科室负责填写</div>
      <table class="comparison-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>我院同类产品</th>
            <th>规格/型</th>
            <th>价格</th>
            <th>生产厂家</th>
            <th>所属目录</th>
            <th>可否被取代</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in getDetailListWithPadding()" :key="index">
            <td>{{ index + 1 }}</td>
            <td>{{ item.similarProduct || '' }}</td>
            <td>{{ item.speci || '' }}</td>
            <td>{{ item.price || '' }}</td>
            <td>{{ item.factoryName || '' }}</td>
            <td>{{ item.category || '' }}</td>
            <td>{{ item.replaceable || '' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 申请理由及效益分析 -->
    <div class="form-section">
      <div class="form-row">
        <div class="form-label required">*申请理由及效益分析:</div>
        <div class="form-textarea">{{ row.reasonAndBenefit || '--' }}</div>
      </div>
    </div>

    <!-- 风险度评估 -->
    <div class="form-section">
      <div class="form-row">
        <div class="form-label required">*风险度评估:</div>
        <div class="form-textarea">{{ row.riskAssessment || '--' }}</div>
      </div>
    </div>

    <!-- 审批签字区域 -->
    <div class="approval-section">
      <div class="form-row">
        <div class="form-label required">*科室主任/护士长签字:</div>
        <div class="signature-line"></div>
        <div class="form-label required">*主管院领导签字:</div>
        <div class="signature-line"></div>
      </div>

      <div class="form-row">
        <div class="form-label required">*医保({{ row.medicalInsurance === '是' ? '√' : ' ' }}) 非医保({{ row.medicalInsurance === '否' ? '√' : ' ' }})</div>
        <div class="form-label">平台价格({{ row.platformPrice ? '√' : ' ' }}) 集采({{ row.centralizedProcurement === '是' ? '√' : ' ' }}) 非集采({{ row.centralizedProcurement === '否' ? '√' : ' ' }})</div>
        <div class="form-label">采购形式:长期({{ row.procurementForm === '长期' ? '√' : ' ' }}) 临采({{ row.procurementForm === '临采' ? '√' : ' ' }})</div>
      </div>

      <div class="form-row">
        <div class="form-label required">*药剂科签字:</div>
        <div class="signature-line"></div>
        <div class="form-label required">*主管院长签字:</div>
        <div class="signature-line"></div>
        <div class="form-label required">*院长签字:</div>
        <div class="signature-line"></div>
      </div>
    </div>

    <!-- 备注说明 -->
    <div class="notes-section">
      <div class="note-item">
        <strong>1、</strong>带"*"的是必填项,科室开展的新技术、新项目所需的新耗材填写此表,填表前应由科室质控会通过,科室负责人及主管院领导签字,再由药剂科、主管院长审核后,报院长批示同意后进行采购。
      </div>
      <div class="note-item">
        <strong>2、</strong>申请科室负责耗材的使用及不良事件监测工作,如因特殊原因不再使用应提前30天告知药剂科,并负责剩余库存的使用。
      </div>
    </div>
  </div>
</template>

<script>
import hospitalNameMixin from '@/mixins/hospitalNameMixin'

export default {
  mixins: [hospitalNameMixin],
  props: ['row'],
  methods: {
    start() {
      // 确保医院名称已加载完成后再打印
      this.ensureHospitalNameLoaded().then(() => {
        // 等待Vue更新DOM
        this.$nextTick(() => {
          this.$print(this.$refs.newProductAuditPrintRef, {}, 'A4')
        })
      }).catch(() => {
        // 即使加载失败也继续打印
        this.$nextTick(() => {
          this.$print(this.$refs.newProductAuditPrintRef, {}, 'A4')
        })
      })
    },
    formatDate(dateStr) {
      if (!dateStr) return '____年__月__日'
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return '____年__月__日'
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}年${month}月${day}日`
    },
    getMaterialName() {
      if (this.row.applyEntryList && this.row.applyEntryList.length > 0) {
        return this.row.applyEntryList[0].materialName || '--'
      }
      return '--'
    },
    getSpecification() {
      if (this.row.applyEntryList && this.row.applyEntryList.length > 0) {
        const entry = this.row.applyEntryList[0]
        return entry.speci || '--'
      }
      return '--'
    },
    getFactoryName() {
      if (this.row.applyEntryList && this.row.applyEntryList.length > 0) {
        return this.row.applyEntryList[0].factoryName || '--'
      }
      return '--'
    },
    getBrandRequirement() {
      if (this.row.applyEntryList && this.row.applyEntryList.length > 0) {
        return this.row.applyEntryList[0].brandRequirement || '--'
      }
      return '--'
    },
    getSpecialNote() {
      if (this.row.applyEntryList && this.row.applyEntryList.length > 0) {
        return this.row.applyEntryList[0].specialNote || '--'
      }
      return '--'
    },
    getCaseFeeCategory(value) {
      if (this.row.applyEntryList && this.row.applyEntryList.length > 0) {
        const category = this.row.applyEntryList[0].caseFeeCategory || ''
        return category === value ? '√' : ' '
      }
      return ' '
    },
    getDetailListWithPadding() {
      const list = this.row.applyDetailList || []
      // 确保至少有3行
      while (list.length < 3) {
        list.push({})
      }
      return list.slice(0, 3)
    }
  }
}
</script>

<style lang="stylus" media="print">
@page {
  size: A4;
  margin: 15mm 10mm;
}

@media print {
  * {
    color: #000 !important;
  }

  .new-product-audit-print {
    width: 100% !important;
    font-size: 14px;
    line-height: 1.6;
  }

  table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    border-spacing: 0;
  }

  table, tbody, thead {
    width: 100% !important;
  }

  .comparison-table {
    td, th {
      border: 1px solid #000;
      font-size: 12px;
      padding: 6px 4px;
      text-align: center;
      overflow: hidden;
      word-wrap: break-word;
      word-break: break-all;
    }
    th {
      background-color: #f0f0f0 !important;
      font-weight: bold;
    }
  }
}

.new-product-audit-print {
  padding: 20px;
  line-height: 1.8;
  font-size: 14px;
  color: #000;

  .header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 2px solid #000;
    padding-bottom: 10px;

    .form-title {
      font-size: 20px;
      font-weight: bold;
      text-align: center;
      flex: 1;
    }

    .form-date {
      font-size: 14px;
      white-space: nowrap;
    }
  }

  .form-section {
    margin-bottom: 15px;
    border: 1px solid #000;
    padding: 10px;

    .form-row {
      display: flex;
      align-items: flex-start;
      margin-bottom: 10px;
      min-height: 28px;

      &:last-child {
        margin-bottom: 0;
      }

      .form-label {
        font-weight: bold;
        min-width: 120px;
        white-space: nowrap;
        padding-right: 8px;

        &.required::before {
          content: '*';
          color: #000;
          margin-right: 2px;
        }
      }

      .form-value {
        flex: 1;
        border-bottom: 1px solid #000;
        min-height: 20px;
        padding: 2px 4px;

        &.full-width {
          width: 100%;
        }
      }

      .form-textarea {
        flex: 1;
        border: 1px solid #000;
        min-height: 60px;
        padding: 4px;
        white-space: pre-wrap;
        word-break: break-all;
      }

      .form-checkboxes {
        flex: 1;
        display: flex;
        gap: 20px;
        align-items: center;
      }
    }

    .table-label {
      font-weight: bold;
      margin-bottom: 8px;
      text-align: center;
    }
  }

  .comparison-table {
    width: 100%;
    border: 1px solid #000;
    margin-top: 8px;

    th, td {
      border: 1px solid #000;
      padding: 6px 4px;
      text-align: center;
      font-size: 12px;
    }

    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
  }

  .approval-section {
    margin-top: 20px;
    border: 1px solid #000;
    padding: 10px;

    .form-row {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      gap: 10px;

      &:last-child {
        margin-bottom: 0;
      }

      .form-label {
        font-weight: bold;
        white-space: nowrap;
        min-width: auto;

        &.required::before {
          content: '*';
          color: #000;
          margin-right: 2px;
        }
      }

      .signature-line {
        flex: 1;
        border-bottom: 1px solid #000;
        min-height: 20px;
        margin: 0 10px;
      }
    }
  }

  .notes-section {
    margin-top: 20px;
    padding: 10px;
    border: 1px solid #000;

    .note-item {
      margin-bottom: 10px;
      font-size: 12px;
      line-height: 1.6;
      text-align: left;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>
