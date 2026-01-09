<template>
  <div class="print-container">
    <!-- 打印按钮栏 -->
    <div class="print-toolbar">
      <el-button type="primary" icon="el-icon-printer" @click="handlePrint">打印</el-button>
      <el-button icon="el-icon-back" @click="handleBack">返回</el-button>
    </div>

    <!-- 打印内容 -->
    <div class="print-content" id="printContent">
      <!-- 标题 -->
      <div class="print-header">
        <h1 class="print-title">衡水市第三人民医院入库单</h1>
      </div>

      <!-- 基本信息 -->
      <div class="print-info">
        <table class="info-table">
          <tr>
            <td class="info-label">单号：</td>
            <td class="info-value">{{ formData.storageNo || '--' }}</td>
            <td class="info-label">申请时间：</td>
            <td class="info-value">{{ formatDate(formData.billDate) || '--' }}</td>
          </tr>
          <tr>
            <td class="info-label">仓库：</td>
            <td class="info-value">{{ formData.warehouseName || '--' }}</td>
            <td class="info-label">审核时间：</td>
            <td class="info-value">{{ formatDateTime(formData.auditDate) || '--' }}</td>
          </tr>
          <tr>
            <td class="info-label">供应商：</td>
            <td class="info-value" colspan="3">{{ formData.supplier || '--' }}</td>
          </tr>
        </table>
      </div>

      <!-- 明细表格 -->
      <div class="print-table">
        <table class="detail-table" border="1" cellspacing="0" cellpadding="0">
          <thead>
            <tr>
              <th>序号</th>
              <th>档案编码</th>
              <th>档案名称</th>
              <th>规格</th>
              <th>型号</th>
              <th>数量</th>
              <th>单价</th>
              <th>金额</th>
              <th>注册证号</th>
              <th>序列号</th>
              <th>生产厂家</th>
              <th>所属分类</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in detailList" :key="index">
              <td>{{ index + 1 }}</td>
              <td>{{ item.equipmentCode || '--' }}</td>
              <td>{{ item.equipmentName || '--' }}</td>
              <td>{{ item.specification || item.spec || '--' }}</td>
              <td>{{ item.model || item.modelNo || '--' }}</td>
              <td>{{ item.quantity || 0 }}</td>
              <td>{{ formatCurrency(item.unitPrice) }}</td>
              <td>{{ formatCurrency(item.amount || item.totalPrice) }}</td>
              <td>{{ item.registrationNo || '--' }}</td>
              <td>{{ item.serialNo || '--' }}</td>
              <td>{{ item.manufacturer || '--' }}</td>
              <td>{{ item.categoryCode || '--' }}</td>
            </tr>
            <!-- 空行填充 -->
            <tr v-for="n in emptyRows" :key="'empty-' + n">
              <td colspan="12">&nbsp;</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 合计信息 -->
      <div class="print-summary">
        <table class="summary-table">
          <tr>
            <td class="summary-label">本页小计：</td>
            <td class="summary-value">数量：{{ totalQuantity }}</td>
            <td class="summary-value">金额：{{ formatCurrency(totalAmount) }}</td>
          </tr>
          <tr>
            <td class="summary-label">合计金额：</td>
            <td class="summary-value-chinese" colspan="2">（大写）{{ amountInChinese }}</td>
          </tr>
          <tr>
            <td></td>
            <td class="summary-value-numeric" colspan="2">（小写）{{ formatCurrency(totalAmount) }}</td>
          </tr>
        </table>
      </div>

      <!-- 签名区域 -->
      <div class="print-signature">
        <div class="signature-item">
          <span class="signature-label">制单人：</span>
          <span class="signature-value">{{ formData.createrName || '--' }}</span>
        </div>
        <div class="signature-item">
          <span class="signature-label">复核人：</span>
          <span class="signature-value">{{ formData.auditorName || '--' }}</span>
        </div>
        <div class="signature-item">
          <span class="signature-label">验收人：</span>
          <span class="signature-value">--</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getEquipmentStorage } from "@/api/equipment/equipmentStorage";

export default {
  name: "EquipmentStoragePrint",
  data() {
    return {
      storageId: null,
      formData: {},
      detailList: []
    };
  },
  computed: {
    // 计算总数量
    totalQuantity() {
      return this.detailList.reduce((sum, item) => {
        return sum + (parseInt(item.quantity) || 0);
      }, 0);
    },
    // 计算总金额
    totalAmount() {
      return this.detailList.reduce((sum, item) => {
        return sum + (parseFloat(item.amount || item.totalPrice || 0));
      }, 0);
    },
    // 金额大写
    amountInChinese() {
      return this.numberToChinese(this.totalAmount);
    },
    // 空行数量（用于填充表格，确保每页都有足够的行数）
    emptyRows() {
      const rowCount = this.detailList.length;
      const minRows = 15; // 最少显示15行
      return Math.max(0, minRows - rowCount);
    }
  },
  created() {
    // 从路由参数获取入库单ID
    this.storageId = this.$route.params.storageId;
    if (this.storageId) {
      this.loadData();
    } else {
      this.$modal.msgError('入库单ID不能为空');
      this.handleBack();
    }
  },
  methods: {
    // 加载数据
    loadData() {
      getEquipmentStorage(this.storageId).then(response => {
        if (response.code === 200 && response.data) {
          this.formData = response.data;
          this.detailList = response.data.detailList || [];
        } else {
          this.$modal.msgError('获取入库单数据失败');
          this.handleBack();
        }
      }).catch(error => {
        console.error('加载入库单数据失败:', error);
        this.$modal.msgError('加载入库单数据失败');
        this.handleBack();
      });
    },
    // 格式化日期（只显示日期部分）
    formatDate(dateStr) {
      if (!dateStr) return '--';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    // 格式化日期时间
    formatDateTime(dateStr) {
      if (!dateStr) return '--';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    // 格式化金额
    formatCurrency(amount) {
      if (amount === null || amount === undefined || amount === '') {
        return '0.00';
      }
      const num = parseFloat(amount);
      if (isNaN(num)) {
        return '0.00';
      }
      return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    // 数字转中文大写
    numberToChinese(num) {
      if (num === null || num === undefined || num === '') {
        return '零元整';
      }
      
      const n = parseFloat(num);
      if (isNaN(n) || n === 0) {
        return '零元整';
      }

      const cnNums = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
      const cnIntRadice = ['', '拾', '佰', '仟'];
      const cnIntUnits = ['', '万', '亿', '兆'];
      const cnDecUnits = ['角', '分'];
      const cnInteger = '整';
      const cnIntLast = '元';
      const maxNum = 999999999999999.99;
      let IntegerNum;
      let DecimalNum;
      let ChineseStr = '';
      let parts;

      if (n === 0) {
        return cnNums[0] + cnIntLast + cnInteger;
      }
      if (n.toString().indexOf('.') === -1) {
        IntegerNum = n.toString();
        DecimalNum = '';
      } else {
        parts = n.toString().split('.');
        IntegerNum = parts[0];
        DecimalNum = parts[1].substring(0, 2);
      }
      if (parseInt(IntegerNum, 10) > 0) {
        let zeroCount = 0;
        let IntLen = IntegerNum.length;
        for (let i = 0; i < IntLen; i++) {
          let n = IntegerNum.substring(i, 1);
          let p = IntLen - i - 1;
          let q = p / 4;
          let m = p % 4;
          if (n === '0') {
            zeroCount++;
          } else {
            if (zeroCount > 0) {
              ChineseStr += cnNums[0];
            }
            zeroCount = 0;
            ChineseStr += cnNums[parseInt(n)] + cnIntRadice[m];
          }
          if (m === 0 && zeroCount < 4) {
            ChineseStr += cnIntUnits[q];
          }
        }
        ChineseStr += cnIntLast;
      }
      if (DecimalNum !== '') {
        let decLen = DecimalNum.length;
        for (let i = 0; i < decLen; i++) {
          let n = DecimalNum.substring(i, 1);
          if (n !== '0') {
            ChineseStr += cnNums[Number(n)] + cnDecUnits[i];
          }
        }
      }
      if (ChineseStr === '') {
        ChineseStr += cnNums[0] + cnIntLast + cnInteger;
      } else if (DecimalNum === '') {
        ChineseStr += cnInteger;
      }
      return ChineseStr;
    },
    // 打印
    handlePrint() {
      // 隐藏打印按钮栏
      const toolbar = document.querySelector('.print-toolbar');
      if (toolbar) {
        toolbar.style.display = 'none';
      }
      
      // 执行打印
      window.print();
      
      // 恢复打印按钮栏
      setTimeout(() => {
        if (toolbar) {
          toolbar.style.display = 'block';
        }
      }, 500);
    },
    // 返回
    handleBack() {
      this.$router.go(-1);
    }
  }
};
</script>

<style scoped>
.print-container {
  padding: 20px;
  background: #fff;
}

.print-toolbar {
  margin-bottom: 20px;
  text-align: right;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}

.print-content {
  width: 100%;
  max-width: 210mm;
  margin: 0 auto;
  padding: 20mm;
  background: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.print-header {
  text-align: center;
  margin-bottom: 30px;
}

.print-title {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  color: #333;
}

.print-info {
  margin-bottom: 20px;
}

.info-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.info-table td {
  padding: 8px;
  border: none;
  text-align: left;
}

.info-table .info-label {
  font-weight: bold;
  width: 100px;
  white-space: nowrap;
}

.info-table .info-value {
  padding-left: 10px;
  color: #333;
}

.print-table {
  margin-bottom: 20px;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.detail-table th {
  background-color: #f5f5f5;
  padding: 8px;
  text-align: center;
  font-weight: bold;
  border: 1px solid #ddd;
}

.detail-table td {
  padding: 6px;
  text-align: center;
  border: 1px solid #ddd;
}

.detail-table tbody tr:nth-child(even) {
  background-color: #fafafa;
}

.print-summary {
  margin-top: 20px;
  margin-bottom: 30px;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.summary-table td {
  padding: 8px;
  border: none;
  text-align: left;
}

.summary-table .summary-label {
  font-weight: bold;
  width: 100px;
}

.summary-table .summary-value {
  padding-left: 10px;
}

.summary-table .summary-value-chinese {
  padding-left: 10px;
  font-weight: bold;
  color: #333;
}

.summary-table .summary-value-numeric {
  padding-left: 10px;
  font-weight: bold;
  color: #333;
}

.print-signature {
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #ddd;
}

.signature-item {
  flex: 1;
  text-align: left;
}

.signature-label {
  font-weight: bold;
  margin-right: 10px;
}

.signature-value {
  min-width: 100px;
  display: inline-block;
  border-bottom: 1px solid #333;
  padding-bottom: 2px;
}

/* 打印样式 */
@media print {
  .print-toolbar {
    display: none !important;
  }

  .print-container {
    padding: 0;
  }

  .print-content {
    box-shadow: none;
    padding: 15mm;
  }

  .print-title {
    font-size: 22px;
  }

  .detail-table {
    font-size: 11px;
  }

  .detail-table th,
  .detail-table td {
    padding: 4px;
  }

  @page {
    size: A4;
    margin: 15mm;
  }
}
</style>
