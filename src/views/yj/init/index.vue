<template>
  <div class="inventory-management">
    <el-form :inline="true" :model="searchForm" class="query-form search-form">
      <el-form-item label="医院">
        <el-input
          v-model="hospitalName"
          disabled
          placeholder="正在加载组织机构医院…"
          class="query-input-hospital"
        />
      </el-form-item>
      <el-form-item label="仓库">
        <div class="query-select-warehouse">
          <SelectWarehouse v-model="searchForm.warehouseId" />
        </div>
      </el-form-item>
      <el-form-item label="期间">
        <el-date-picker
          v-model="searchForm.period"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
      </el-form-item>
    </el-form>

    <div class="function-buttons">
      <el-button type="primary" @click="onInitialize">初始化</el-button>
      <el-button type="primary" @click="onMonthEndProcessing">月结处理</el-button>
      <el-button type="primary" @click="onClearMonthEnd">清除月结</el-button>
    </div>

    <el-table :data="tableData" border stripe style="width: 100%">
      <el-table-column prop="category" label="分类" align="center" />
      <el-table-column prop="initialAmount" label="期初金额" align="center" />
      <el-table-column prop="inAmount" label="进项金额" align="center" />
      <el-table-column prop="outAmount" label="出项金额" align="center" />
      <el-table-column prop="balanceAmount" label="结存金额" align="center" />
      <el-table-column prop="surplusAmount" label="盘盈金额" align="center" />
      <el-table-column prop="shortageAmount" label="盘亏金额" align="center" />
      <el-table-column prop="physicalBalance" label="结存实物金额" align="center" />
    </el-table>
  </div>
</template>

<script>
import { getConfigKey } from "@/api/system/config";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";

export default {
  name: "YjInit",
  components: { SelectWarehouse },
  data() {
    return {
      hospitalName: "",
      searchForm: {
        warehouseId: null,
        period: []
      },
      tableData: [
        {
          category: "低值易耗品",
          initialAmount: "0",
          inAmount: "84129",
          outAmount: "608",
          balanceAmount: "83521",
          surplusAmount: "0",
          shortageAmount: "0",
          physicalBalance: "83521"
        },
        {
          category: "卫生材料",
          initialAmount: "1618191.26",
          inAmount: "358439.2",
          outAmount: "106395.2",
          balanceAmount: "1870235.26",
          surplusAmount: "0",
          shortageAmount: "0",
          physicalBalance: "1870235.26"
        },
        {
          category: "其他耗材",
          initialAmount: "0",
          inAmount: "0",
          outAmount: "0",
          balanceAmount: "0",
          surplusAmount: "0",
          shortageAmount: "0",
          physicalBalance: "0"
        },
        {
          category: "应急物资",
          initialAmount: "0",
          inAmount: "0",
          outAmount: "0",
          balanceAmount: "0",
          surplusAmount: "0",
          shortageAmount: "0",
          physicalBalance: "0"
        }
      ]
    };
  },
  created() {
    this.initPeriod();
    this.loadHospitalName();
  },
  methods: {
    initPeriod() {
      const end = new Date();
      const start = new Date(end.getFullYear(), end.getMonth(), 1);
      const fmt = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      };
      this.searchForm.period = [fmt(start), fmt(end)];
    },
    /** 组织机构内医院名称：与参数设置 sys.hospital.name 一致（用户管理/打印设置等同源） */
    loadHospitalName() {
      getConfigKey("sys.hospital.name")
        .then((res) => {
          if (!res) {
            this.hospitalName = "";
            return;
          }
          const v = res.msg != null ? res.msg : res.data;
          this.hospitalName =
            v != null && String(v).trim() !== "" ? String(v).trim() : "";
        })
        .catch(() => {
          this.hospitalName = "";
        });
    },
    onSearch() {
      console.log("查询功能触发", {
        hospitalName: this.hospitalName,
        warehouseId: this.searchForm.warehouseId,
        period: this.searchForm.period
      });
    },
    onInitialize() {
      console.log("初始化功能触发");
    },
    onMonthEndProcessing() {
      console.log("月结处理功能触发");
    },
    onClearMonthEnd() {
      console.log("清除月结功能触发");
    }
  }
};
</script>

<style scoped>
.inventory-management {
  padding: 20px;
}

.search-form {
  margin-bottom: 20px;
}

.query-input-hospital {
  width: 240px;
}

.query-select-warehouse {
  width: 260px;
  display: inline-block;
  vertical-align: middle;
}

.function-buttons {
  margin-bottom: 20px;
  text-align: left;
}
</style>
