<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item label="计划单号" prop="planNo" class="query-item-inline">
            <el-input v-model="queryParams.planNo"
                      placeholder="请输入计划单号"
                      clearable
                      style="width: 180px"
                      @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item label="供应商" prop="supplierId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectSupplier v-model="queryParams.supplierId"/>
            </div>
          </el-form-item>
          <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectWarehouse v-model="queryParams.warehouseId"/>
            </div>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16" class="query-row-second">
        <el-col :span="12">
          <el-form-item label="制单日期" style="display: flex; align-items: center;">
            <el-date-picker
              v-model="queryParams.beginDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="起始日期"
              clearable
              style="width: 180px; margin-right: 8px;"
            />
            <span style="margin: 0 4px;">至</span>
            <el-date-picker
              v-model="queryParams.endDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="截止日期"
              clearable
              style="width: 180px; margin-left: 8px;"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12" class="query-status-col">
          <el-form-item label="单据状态" prop="planStatus" class="query-item-status-aligned">
            <el-select v-model="queryParams.planStatus" placeholder="全部"
                       clearable style="width: 150px">
              <el-option v-for="dict in dict.type.biz_status"
                         :key="dict.value"
                         :label="dict.label"
                         :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-row :gutter="10" class="mb8" style="padding-top: 10px">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="small"
          @click="handleAdd"
          v-hasPermi="['inWarehouse:apply:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['inWarehouse:apply:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-check"
          size="small"
          :disabled="multiple"
          @click="handleBatchSubmit"
          v-hasPermi="['caigou:jihua:edit']"
        >提交</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="warehouseList"
              :row-class-name="warehouseListIndex"
              show-summary :summary-method="getTotalSummaries"
              @selection-change="handleSelectionChange" height="58vh" border>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="计划单号" align="center" prop="planNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.planNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" show-overflow-tooltip resizable />
      <el-table-column label="金额" align="center" prop="totalAmount" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount">{{ scope.row.totalAmount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="planStatus" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.planStatus"/>
        </template>
      </el-table-column>

      <el-table-column label="制单人" align="center" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ getCreatorName(scope.row) }}
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="planDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.planDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" resizable>
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['inWarehouse:apply:edit']"
            v-if="scope.row.planStatus != 2"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['inWarehouse:apply:remove']"
            v-if="scope.row.planStatus != 2"
          >删除</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-view"
            @click="handleView(scope.row)"
            v-hasPermi="['inWarehouse:apply:view']"
          >查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
      class="table-pagination"
    />

    <!-- 添加或修改计划对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button icon="el-icon-close" size="small" circle @click="cancel" class="close-btn"></el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact">
              <el-row :gutter="8">
                <el-col :span="4">
                  <el-form-item label="单号" prop="planNo">
                    <el-input v-model="form.planNo" :disabled="true" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="仓库" prop="warehouseId">
                    <SelectWarehouse v-model="form.warehouseId"/>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item prop="planDate">
                    <template slot="label">
                      <span style="white-space: nowrap;">制单日期</span>
                    </template>
                    <el-date-picker clearable
                                    v-model="form.planDate"
                                    type="date"
                                    :disabled="true"
                                    value-format="yyyy-MM-dd"
                                    placeholder="请选择制单日期"
                                    style="width: 100%">
                    </el-date-picker>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="操作人" prop="createBy">
                    <el-input :value="operatorName" :disabled="true" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="联系电话" prop="telephone">
                    <el-input v-model="form.telephone" placeholder="请输入联系电话" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="8">
                <el-col :span="4">
                  <el-form-item label="采购员" prop="proPerson">
                    <SelectUser v-model="form.proPerson" v-if="action"/>
                    <el-input :value="purchaserName" :disabled="true" v-else/>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="总金额" prop="totalAmount">
                    <el-input v-model="form.totalAmount" :disabled="true" placeholder="请输入总金额" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="10" class="mb8">
                <el-col :span="1.5">
                  <span>计划明细信息</span>
                </el-col>

                <div v-show="action">
                  <el-col :span="1.5">
    <!--            <el-button type="primary" icon="el-icon-plus" size="small" @click="handleAddStkIoBillEntry">添加</el-button>-->
                    <el-button type="primary" icon="el-icon-plus" size="small" @click="checkMaterialBtn">添加</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteStkIoBillEntry">删除</el-button>
                  </el-col>
                </div>
              </el-row>
              <div class="table-wrapper">
                <el-table :data="stkIoBillEntryList" :row-class-name="rowStkIoBillEntryIndex"
                          show-summary :summary-method="getSummaries"
                          @selection-change="handleStkIoBillEntrySelectionChange"
                          ref="stkIoBillEntry"
                          border
                          height="48vh"
                >
          <el-table-column type="selection" width="60" align="center" />
          <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
          <!-- 耗材列隐藏 -->
          <!--<el-table-column label="耗材" prop="materialId" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <SelectMaterial v-model="scope.row.materialId" :value2="isShow"/>
            </template>
          </el-table-column>-->
          <el-table-column label="名称" align="center" prop="material.name" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="规格" align="center" prop="material.speci" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="型号" align="center" prop="material.name" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.material && scope.row.material.fdUnit ? scope.row.material.fdUnit.unitName : '' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" prop="qty" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
<!--              <el-input v-model="scope.row.qty" type='number' :min="1"-->
<!--                        @input="qtyChange(scope.row)"-->
<!--                        placeholder="请输入数量" />-->
              <el-input
                clearable
                v-model="scope.row.qty"
                placeholder="请输入数量"
                @input="debounceQtyChange(scope.row)"
                @blur="qtyChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="价格" prop="price" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.price" type='number'
                        :disabled="true"
                        @input="priceChange(scope.row)" placeholder="请输入价格" />
            </template>
          </el-table-column>
          <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.amt" :disabled="true" placeholder="请输入金额" />
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="储存方式" align="center" prop="material.isWay" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <dict-tag :options="dict.type.way_status" :value="scope.row.material.isWay"/>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" placeholder="请输入备注" />
            </template>
          </el-table-column>
                </el-table>
              </div>
            </el-form>
            <div v-show="action" class="modal-footer">
              <el-button @click="cancel">取 消</el-button>
              <el-button type="primary" @click="submitForm">确 定</el-button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 3、使用组件 -->
    <SelectMMaterialFilter
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :supplierValue="supplierValue"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectMMaterialFilter>

  </div>
</template>

<script>
import { listPurchasePlan, getPurchasePlan, delPurchasePlan, addPurchasePlan, updatePurchasePlan, auditPurchasePlan } from "@/api/caigou/purchasePlan";
import { listUserAll } from "@/api/system/user";
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';

import SelectMMaterialFilter from '@/components/SelectModel/SelectMMaterialFilter';

export default {
  name: "InWarehouse",
  dicts: ['biz_status','bill_type','way_status'],
  components: {SelectSupplier,SelectMaterial,SelectWarehouse,SelectDepartment,SelectUser,SelectMMaterialFilter},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      supplierValue: "",
      isShow: true,
      // 防抖定时器
      qtyChangeTimer: null,
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedStkIoBillEntry: [],
      // 非单个禁用
      single: true,
      pickerBeginTimeOptions: {
        disabledDate(time) {
            return time.getTime() > Date.now();
        },
      },
      pickerEndTimeOptions: {
        disabledDate(time) {
          return time.getTime() < Date.now();
        },
      },
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 计划表格数据
      warehouseList: [],
      stkMaterialList: [],
      // 计划明细表格数据
      stkIoBillEntryList: [],
      // 用户选项列表
      userOptions: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      //是否显示
      action: true,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        planNo: null,
        supplierId: null,
        planDate: null,
        warehouseId: null,
        departmentId: null,
        planStatus: null,
        proPerson: null,
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        supplierId: [
          { required: true, message: "供应商不能为空", trigger: "blur" }
        ],
        planDate: [
          { required: true, message: "制单日期不能为空", trigger: "blur" }
        ],
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "blur" }
        ],
      }
    };
  },
  created() {
    console.time('[Plan] created->getList');
    this.getList(true);
    this.getUserList();
    console.timeEnd('[Plan] created->getList');
  },
  mounted() {
    // 预绑定防抖搜索，避免频繁请求
    this.debouncedQuery = this.$_.debounce(() => {
      this.handleQuery();
    }, 300);
  },
  beforeDestroy() {
    // 清理定时器
    if (this.qtyChangeTimer) {
      clearTimeout(this.qtyChangeTimer);
    }
  },
  computed: {
    // 操作人姓名
    operatorName() {
      if (this.form.creater && this.form.creater.nickName) {
        return this.form.creater.nickName;
      }
      if (this.form.createBy) {
        const user = this.userOptions.find(u => u.userName === this.form.createBy || u.userId === this.form.createBy);
        return user ? user.nickName || user.userName : this.form.createBy;
      }
      return '';
    },
    // 采购员姓名
    purchaserName() {
      if (this.form.proPerson) {
        const user = this.userOptions.find(u => u.userId === this.form.proPerson || u.userId === String(this.form.proPerson));
        return user ? user.nickName || user.userName : '';
      }
      return '';
    }
  },
  methods: {
    // 为主表提供稳定的 row-key，减少 DOM 复用导致的抖动
    planRowKey(row) {
      return row.id || row.planNo;
    },
    warehouseListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }

        // 只对数量、金额列进行汇总，使用列属性名判断（价格列不汇总）
        if (column.property === 'qty' || column.property === 'amt') {
          const values = data.map(item => {
            const value = item[column.property];
            return isNaN(Number(value)) ? 0 : Number(value);
          });

          if (values.length > 0) {
            sums[index] = values.reduce((prev, curr) => prev + curr, 0).toFixed(2);
          } else {
            sums[index] = '0.00';
          }

          // 更新总金额
          if (column.property === 'amt') {
            this.form.totalAmount = sums[index];
          }
        } else {
          sums[index] = '';
        }
      });
      return sums;
    },
    getTotalSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        const values = data.map(item => Number(item[column.property]));
        if(index === 4){
          if (!values.every(value => isNaN(value))) {
            sums[index] = values.reduce((prev, curr) => {
              const value = Number(curr);
              if (!isNaN(value)) {
                return prev + curr;
              } else {
                return prev;
              }
            }, 0);
            sums[index] = sums[index].toFixed(2);
          }
        }
      });
      return sums;
    },
    /** 查询计划列表 */
    getList(allowWhenDialog) {
      console.time('[Plan] getList total');
      if (this.DialogComponentShow && !allowWhenDialog) {
        console.log('[Plan] getList skipped because dialog is open');
        console.timeEnd('[Plan] getList total');
        return;
      }
      this.loading = true;
      const t0 = performance.now();
      listPurchasePlan(this.queryParams).then(response => {
        const t1 = performance.now();
        // 预计算展示字段，减少模板计算
        const rows = response.rows || [];
        this.warehouseList = rows.map(item => ({
          ...item,
          planDateText: item.planDate ? this.parseTime(item.planDate, '{y}-{m}-{d}') : ''
        }));
        this.total = response.total;
        this.loading = false;
        const t2 = performance.now();
        console.log('[Plan] list size=', rows.length, 'network(ms)=', (t1 - t0).toFixed(1), 'assign(ms)=', (t2 - t1).toFixed(1));
        console.timeEnd('[Plan] getList total');
      });
    },
    // 查询按钮（支持外部调用防抖）
    handleQueryDebounced() {
      if (this.debouncedQuery) {
        this.debouncedQuery();
      } else {
        this.handleQuery();
      }
    },
    checkMaterialBtn() {
      // 验证是否已选择仓库
      if (!this.form.warehouseId) {
        this.$modal.msgWarning("请先选择仓库");
        return;
      }
      //打开"弹窗组件"
      this.DialogComponentShow = true
    },
    closeDialog() {
      //关闭“弹窗组件”
      console.time('[Plan] closeDialog total');
      const t0 = performance.now();
      this.DialogComponentShow = false
      const t1 = performance.now();
      console.log('[Plan] closeDialog set DialogComponentShow=false ms=', (t1 - t0).toFixed(1));
      console.timeEnd('[Plan] closeDialog total');
    },
    selectData(lightRows) {
      console.time('[Plan] selectData total');
      const t0 = performance.now();
      const toAppend = []
      const list = lightRows || [];
      list.forEach((item) => {
        toAppend.push({
          materialId: item.id,
          qty: "",
          price: item.price,
          amt: "",
          speci: item.speci,
          model: item.model,
          beginTime: "",
          endTime: "",
          remark: "",
          material: Object.freeze(item),
        })
      })
      const t1 = performance.now();
      console.log('[Plan] select rows=', list.length, 'build objects(ms)=', (t1 - t0).toFixed(1));
      if (!toAppend.length) {
        console.timeEnd('[Plan] selectData total');
        return;
      }

      // 小批量（<=30）直接同步合并，避免 rAF 等待造成 1s+ 延迟
      if (toAppend.length <= 30) {
        const t2 = performance.now();
        this.stkIoBillEntryList = this.stkIoBillEntryList.concat(toAppend)
        const t3 = performance.now();
        console.log('[Plan] concat small size=', toAppend.length, 'concat(ms)=', (t3 - t2).toFixed(1));
        console.timeEnd('[Plan] selectData total');
        return;
      }

      // 大批量使用 rAF 合并，避免主线程长阻塞
      this.$nextTick(() => {
        const t2 = performance.now();
        requestAnimationFrame(() => {
          const t3 = performance.now();
          this.stkIoBillEntryList = this.stkIoBillEntryList.concat(toAppend)
          const t4 = performance.now();
          console.log('[Plan] concat large size=', toAppend.length, 'raf wait(ms)=', (t3 - t2).toFixed(1), 'concat(ms)=', (t4 - t3).toFixed(1));
          console.timeEnd('[Plan] selectData total');
        })
      })
    },
    getStatDate(){
      let myDate = new Date();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let statDate = myDate.getFullYear().toString() + "-"  + month + "-" + "01"; //月初
      return statDate;
    },
    getEndDate(){
      let myDate = new Date();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let dayEnd = new Date(myDate.getFullYear(), month, 0).getDate(); //获取当月一共有多少天
      let endDate = myDate.getFullYear().toString() + "-" + month  + "-" + dayEnd; //月末
      return endDate;
    },
    //当天日期
    getBillDate(){
      let now = new Date();
      let year = now.getFullYear();
      let month = now.getMonth() + 1;
      let day = now.getDate();
      return year + "-" + month + "-" + day;
    },
    // 取消按钮
    cancel() {
      console.time('[Plan] cancel total');
      const t0 = performance.now();
      this.open = false;
      const t1 = performance.now();
      this.reset();
      const t2 = performance.now();
      console.log('[Plan] cancel set open=false ms=', (t1 - t0).toFixed(1), 'reset(ms)=', (t2 - t1).toFixed(1));
      console.timeEnd('[Plan] cancel total');
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        planNo: null,
        supplierId: null,
        planDate: null,
        warehouseId: null,
        departmentId: null,
        planStatus: null,
        proPerson: null,
        delFlag: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        telephone: null,
        totalAmount: null,
        auditBy: null,
        auditDate: null,
        remark: null
      };
      this.stkIoBillEntryList = [];
      this.resetForm("form");
    },
    //数量改变事件
    qtyChange(row){
      // 只允许输入数字
      if (row.qty && !/^\d+(\.\d+)?$/.test(row.qty)) {
        row.qty = row.qty.replace(/[^\d.]/g, '');
      }

      let totalAmt = 0;
      if(row.qty && row.price){
        totalAmt = parseFloat(row.qty) * parseFloat(row.price);
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);

      // 重新计算总金额
      this.calculateTotalAmount();
    },
    //价格改变事件
    priceChange(row){
      let totalAmt = 0;
      if(row.qty && row.price){
        totalAmt = parseFloat(row.qty) * parseFloat(row.price);
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);

      // 重新计算总金额
      this.calculateTotalAmount();
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList(true);
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 查看按钮操作 */
    handleView(row){
      const id = row.id
      getPurchasePlan(id).then(response => {
        this.form = response.data;
        this.stkIoBillEntryList = response.data.purchasePlanEntryList;
        this.open = true;
        this.action = false;
        // 查看时保持原有状态
        this.title = "查看计划";
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.form.planStatus = '0'; // 未提交状态
      //操作人
      //操作人
      var userName = this.$store.state.user.name;
      this.form.createBy = userName;
      this.form.planDate = this.getBillDate();
      this.title = "添加计划";
      this.action = true;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getPurchasePlan(id).then(response => {
        this.form = response.data;
        // 修改时保持原有状态，不强制设置为'1'
        this.stkIoBillEntryList = response.data.purchasePlanEntryList;
        this.open = true;
        this.title = "修改计划";
        this.action = true;
      });
    },
    /** 提交按钮（保存表单） */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.form.purchasePlanEntryList = this.stkIoBillEntryList;
          // 保存时保持原有状态，不自动改变状态
          // 新增时如果没有设置状态，则默认为"未提交"（0）
          if (this.form.id == null && (this.form.planStatus == null || this.form.planStatus === '')) {
            this.form.planStatus = '0'; // 未提交状态
          }
          if (this.form.id != null) {
            updatePurchasePlan(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addPurchasePlan(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 批量提交按钮操作 */
    handleBatchSubmit() {
      if (this.ids.length === 0) {
        this.$modal.msgError("请先选择要提交的计划！");
        return;
      }

      // 检查选中的计划是否都是"未提交"状态
      const selectedPlans = this.warehouseList.filter(item => this.ids.includes(item.id));
      const nonUnsubmittedPlans = selectedPlans.filter(item => item.planStatus !== '0' && item.planStatus !== 0);

      if (nonUnsubmittedPlans.length > 0) {
        const statusInfo = nonUnsubmittedPlans.map(plan => `${plan.planNo}(状态:${plan.planStatus})`).join(', ');
        this.$modal.msgError(`只能提交未提交状态的计划！以下计划状态不正确：${statusInfo}`);
        return;
      }

      const planNos = selectedPlans.map(item => item.planNo).join('、');

      this.$modal.confirm('确定要提交选中的 ' + this.ids.length + ' 个计划吗？\n计划编号：' + planNos).then(() => {
        // 批量提交：将状态从"未提交"（0）改为"未提交"（1，已提交但未审核）
        // 先获取每个计划的完整数据，然后更新状态
        const submitPromises = this.ids.map(id => {
          return getPurchasePlan(id).then(response => {
            const plan = response.data;
            plan.planStatus = '1'; // 未提交状态（已提交但未审核）
            return updatePurchasePlan(plan);
          });
        });
        
        Promise.all(submitPromises).then(() => {
          this.getList();
          this.$modal.msgSuccess("批量提交成功！共提交 " + this.ids.length + " 个计划");
        }).catch(() => {
          this.$modal.msgError("批量提交失败！");
        });
      }).catch(() => {});
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除计划编号为"' + ids + '"的数据项？').then(function() {
        return delPurchasePlan(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 计划明细序号 */
    rowStkIoBillEntryIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 计划明细添加按钮操作 */
    handleAddStkIoBillEntry() {
      let obj = {};
      obj.materialId = "";
      obj.qty = "";
      obj.price = "";
      obj.amt = "";
      obj.batchNo = "";
      obj.remark = "";

      this.stkIoBillEntryList.push(obj);
    },
    /** 计划明细删除按钮操作 */
    handleDeleteStkIoBillEntry() {
      if (this.checkedStkIoBillEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的计划明细数据");
      } else {
        const stkIoBillEntryList = this.stkIoBillEntryList;
        const checkedStkIoBillEntry = this.checkedStkIoBillEntry;
        this.stkIoBillEntryList = stkIoBillEntryList.filter(function(item) {
          return checkedStkIoBillEntry.indexOf(item.index) == -1
        });
      }
    },
    /** 复选框选中数据 */
    handleStkIoBillEntrySelectionChange(selection) {
      this.checkedStkIoBillEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('caigou/jihua/export', {
        ...this.queryParams
      }, `purchase_plan_${new Date().getTime()}.xlsx`)
    },
    /** 防抖数量变化 */
    debounceQtyChange(row) {
      if (this.qtyChangeTimer) {
        clearTimeout(this.qtyChangeTimer);
      }
      this.qtyChangeTimer = setTimeout(() => {
        this.qtyChange(row);
      }, 300);
    },
    /** 获取行键 */
    getRowKey(row, index) {
      return row.id || index;
    },
    /** 计算总金额 */
    calculateTotalAmount() {
      let total = 0;
      this.stkIoBillEntryList.forEach(item => {
        if (item.amt) {
          total += parseFloat(item.amt);
        }
      });
      this.form.totalAmount = total.toFixed(2);
    },
    /** 获取用户列表 */
    getUserList() {
      listUserAll().then(response => {
        this.userOptions = response || [];
      });
    },
    /** 获取制单人姓名 */
    getCreatorName(row) {
      // 优先使用 creater.nickName
      if (row.creater && row.creater.nickName) {
        return row.creater.nickName;
      }
      // 如果没有 creater 对象，根据 createBy 查找用户姓名
      if (row.createBy) {
        const user = this.userOptions.find(u => u.userName === row.createBy || u.userId === row.createBy);
        return user ? (user.nickName || user.userName) : row.createBy;
      }
      return '';
    }
  }
};
</script>

<style scoped>
/* 内部弹窗样式 */
.local-modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  min-height: 95vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #F5F7FA;
  min-height: 48px;
}

.modal-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin: 0;
}

.close-btn {
  border: none;
  background: transparent;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.modal-footer {
  padding: 16px 24px;
  text-align: right;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
  margin-top: 10px;
}

.modal-footer .el-button {
  margin-left: 12px;
}

.local-modal-content .el-form {
  flex: 1;
  overflow: visible;
  padding: 24px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

/* 弹窗内表单紧凑布局 */
.local-modal-content .modal-form-compact .el-row {
  margin-bottom: 10px;
}

.local-modal-content .modal-form-compact .el-form-item {
  margin-bottom: 0;
}

.local-modal-content .modal-form-compact .el-input,
.local-modal-content .modal-form-compact .el-select,
.local-modal-content .modal-form-compact .el-date-picker {
  width: 140px;
  max-width: 140px;
}

/* 弹窗内表格样式 - 高度调到确定按钮上面一点 */
.local-modal-content .table-wrapper {
  flex: 1;
  overflow: hidden;
  margin-top: 10px;
}

.local-modal-content .el-table {
  height: 48vh;
  max-height: 48vh;
}

.local-modal-content .el-table__body-wrapper {
  max-height: calc(48vh - 48px);
  overflow-y: auto;
}

.modal-footer .el-button {
  margin-left: 8px;
}

/* 弹窗动画 */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter, .modal-fade-leave-to {
  opacity: 0;
}

.modal-zoom-enter-active, .modal-zoom-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-zoom-enter, .modal-zoom-leave-to {
  opacity: 0;
  transform: scale(0.7) translateY(-50px);
}

/* 确保页面容器有相对定位，以便内部弹窗正确定位 */
.app-container {
  position: relative;
}

  /* 查询条件紧凑布局 */
  .app-container > .el-form .el-row {
    margin-bottom: 8px;
  }

  .app-container > .el-form .el-row:last-child {
    margin-bottom: 0;
  }

  .app-container > .el-form .el-form-item {
    margin-bottom: 0;
  }

  /* 第一行查询条件左对齐紧凑布局 */
  .app-container > .el-form .query-row-left .el-col {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .app-container > .el-form .query-row-left .query-item-inline {
    display: inline-block;
    margin-right: 16px;
    margin-bottom: 0;
    vertical-align: top;
  }

  .app-container > .el-form .query-row-left .query-item-inline:last-child {
    margin-right: 0;
  }

  /* 统一控制查询条件输入框宽度 */
  .app-container > .el-form .query-row-left .query-item-inline .el-input {
    width: 180px;
  }

  .app-container > .el-form .query-row-left .query-item-inline .query-select-wrapper {
    width: 180px;
    display: inline-block;
  }

  .app-container > .el-form .query-row-left .query-item-inline .query-select-wrapper > * {
    width: 100%;
  }

  .app-container > .el-form .query-row-left .query-item-inline .el-select {
    width: 150px;
  }

  /* 第二行单据状态对齐到仓库位置 */
  .app-container > .el-form .query-row-second {
    position: relative;
  }

  /* 确保制单日期的两个日期选择器在同一行 */
  .app-container > .el-form .query-row-second .el-form-item {
    white-space: nowrap;
  }

  .app-container > .el-form .query-row-second .el-form-item .el-form-item__content {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
  }

  .app-container > .el-form .query-row-second .query-status-col {
    position: absolute;
    left: 552px;
    width: auto;
    padding-left: 0;
    padding-right: 0;
  }

  .query-item-status-aligned .el-form-item__label {
    width: 80px !important;
  }

  /* 搜索区域样式 */
  .app-container > .el-form {
    background: #fff;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    margin-bottom: 16px;
  }

  /* 表格样式优化 */
  .el-table {
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    margin-bottom: 20px;
  }

  .el-table th {
    background-color: #F5F7FA !important;
    color: #606266;
    font-weight: 500;
    height: 50px;
    padding: 8px 0;
    border-bottom: 1px solid #EBEEF5;
  }

  .el-table td {
    padding: 12px 0;
    color: #606266;
    border-bottom: 1px solid #EBEEF5;
  }

  .el-table tr:hover > td {
    background-color: #F5F7FA !important;
    transition: all 0.3s;
  }

  /* 按钮样式 */
  .el-button--text {
    padding: 0 4px;
  }

  .el-button--text:hover {
    color: #409EFF;
  }

  /* 弹窗内表单紧凑布局 */
  .local-modal-content .modal-form-compact .el-row {
    margin-bottom: 10px;
    display: flex;
    flex-wrap: nowrap;
  }

  .local-modal-content .modal-form-compact .el-row .el-col {
    flex-shrink: 0;
  }

  .local-modal-content .modal-form-compact .el-form-item {
    margin-bottom: 0;
    white-space: nowrap;
  }

  .local-modal-content .modal-form-compact .el-form-item__label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .local-modal-content .modal-form-compact .el-input,
  .local-modal-content .modal-form-compact .el-select,
  .local-modal-content .modal-form-compact .el-date-picker {
    width: 140px;
    max-width: 140px;
  }

  .local-modal-content .modal-form-compact .el-input__inner {
    height: 28px !important;
    line-height: 28px !important;
    font-size: 13px !important;
  }

  .local-modal-content .modal-form-compact .el-input__icon {
    line-height: 28px !important;
  }

  .local-modal-content .modal-form-compact .el-select .el-input__inner {
    height: 28px !important;
    line-height: 28px !important;
  }

  .local-modal-content .modal-form-compact .el-date-editor.el-input {
    height: 28px !important;
  }

  .local-modal-content .modal-form-compact .el-date-editor .el-input__inner {
    height: 28px !important;
    line-height: 28px !important;
  }

  .local-modal-content .modal-form-compact .el-form-item__content {
    margin-left: 0 !important;
    line-height: 28px;
  }

  .local-modal-content .modal-form-compact .el-form-item__label {
    text-align: left;
    padding-right: 6px;
    line-height: 28px;
    height: 28px;
    font-size: 13px;
  }

  /* 分页组件样式 */
  .table-pagination {
    margin-top: 16px;
  }

  /* 缩小所有输入框高度 */
  .local-modal-content .modal-form-compact .el-input__inner {
    height: 28px !important;
    line-height: 28px !important;
    font-size: 13px !important;
  }

  .local-modal-content .modal-form-compact .el-input__icon {
    line-height: 28px !important;
  }

  .local-modal-content .modal-form-compact .el-select .el-input__inner {
    height: 28px !important;
    line-height: 28px !important;
  }

  .local-modal-content .modal-form-compact .el-date-editor.el-input {
    height: 28px !important;
  }

  .local-modal-content .modal-form-compact .el-date-editor .el-input__inner {
    height: 28px !important;
    line-height: 28px !important;
  }

  .local-modal-content .modal-form-compact .el-form-item__content {
    margin-left: 0 !important;
    line-height: 28px;
  }

  .local-modal-content .modal-form-compact .el-form-item__label {
    text-align: left;
    padding-right: 6px;
    line-height: 28px;
    height: 28px;
    font-size: 13px;
  }

  /* 加粗滚动条 - 覆盖所有表格滚动条 */
  .local-modal-content .el-table__body-wrapper::-webkit-scrollbar,
  .local-modal-content .el-table::-webkit-scrollbar,
  .local-modal-content .table-wrapper::-webkit-scrollbar {
    width: 10px !important;
  }

  .local-modal-content .el-table__body-wrapper::-webkit-scrollbar-track,
  .local-modal-content .el-table::-webkit-scrollbar-track,
  .local-modal-content .table-wrapper::-webkit-scrollbar-track {
    background: #f1f1f1 !important;
    border-radius: 5px !important;
  }

  .local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb,
  .local-modal-content .el-table::-webkit-scrollbar-thumb,
  .local-modal-content .table-wrapper::-webkit-scrollbar-thumb {
    background: #c1c1c1 !important;
    border-radius: 5px !important;
  }

  .local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
  .local-modal-content .el-table::-webkit-scrollbar-thumb:hover,
  .local-modal-content .table-wrapper::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8 !important;
  }
</style>
