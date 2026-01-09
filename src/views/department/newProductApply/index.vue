<template>
  <div class="app-container">
    <div class="form-fields-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">

        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item label="申购单号" prop="applyNo" class="query-item-inline">
              <el-input v-model="queryParams.applyNo"
                        placeholder="请输入申购单号"
                        clearable
                        style="width: 180px"
                        @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="科室" prop="departmentId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectDepartment v-model="queryParams.departmentId" />
              </div>
            </el-form-item>
            <el-form-item label="单据状态" prop="applyStatus" class="query-item-inline">
              <el-select v-model="queryParams.applyStatus" placeholder="全部"
                         clearable style="width: 180px">
                <el-option v-for="dict in filteredBizStatus"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
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
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="medium"
          @click="handleAdd"
          v-hasPermi="['department:newProductApply:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="medium"
          @click="handleExport"
          v-hasPermi="['department:newProductApply:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          icon="el-icon-search"
          size="medium"
          @click="handleQuery"
        >搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          icon="el-icon-refresh"
          size="medium"
          @click="resetQuery"
        >重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="applyList"
              :row-class-name="applyListIndex"
              @selection-change="handleSelectionChange" height="54vh" border>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="申购单号" align="center" prop="applyNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.applyNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="科室" align="center" prop="department.name" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.department && scope.row.department.name) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="总金额" align="center" prop="totalAmount" show-overflow-tooltip resizable v-if="false">
        <template slot-scope="scope">
          <span>{{ (scope.row.totalAmount != null && scope.row.totalAmount !== undefined) ? parseFloat(scope.row.totalAmount).toFixed(2) : formatTotalAmount(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="applyStatus" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.applyStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="申请人" align="center" prop="createBy" show-overflow-tooltip resizable />
      <el-table-column label="制单日期" align="center" prop="applyDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.applyDate">{{ parseTime(scope.row.applyDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            @click="handlePrint(scope.row,true)"
            v-if="scope.row.applyStatus == 2"
          >打印</el-button>
          <template v-if="scope.row.applyStatus != 2">
            <el-button
              size="small"
              type="text"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['department:newProductApply:edit']"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleDelete(scope.row)"
              v-hasPermi="['department:newProductApply:remove']"
            >删除</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改新品申购申请对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="80px">
              <div class="form-fields-container">
                <el-row>
                  <el-col :span="4">
                    <el-form-item label="科室" prop="departmentId" label-width="100px">
                      <SelectDepartment v-model="form.departmentId" :disabled="!action" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="单据状态" prop="applyStatus" label-width="100px">
                      <el-select v-model="form.applyStatus" placeholder="请选择单据状态"
                                 :disabled="true"
                                 clearable style="width: 150px">
                        <el-option v-for="dict in filteredBizStatus"
                                   :key="dict.value"
                                   :label="dict.label"
                                   :value="dict.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="制单日期" prop="applyDate" label-width="100px">
                      <el-date-picker clearable
                                      v-model="form.applyDate"
                                      type="date"
                                      :disabled="true"
                                      value-format="yyyy-MM-dd"
                                      style="width: 150px"
                                      placeholder="请选择制单日期">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="申请人" prop="createBy" label-width="100px">
                      <el-input v-model="form.createBy" :disabled="true" placeholder="申请人" style="width: 150px" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="申请理由及效益分析" prop="reasonAndBenefit" label-width="100px">
                      <el-input v-model="form.reasonAndBenefit" placeholder="请输入申请理由及效益分析" style="width: 150px" />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row>
                  <el-col :span="4">
                    <el-form-item label="分析评估" prop="remark" label-width="100px">
                      <el-input v-model="form.remark" placeholder="请输入分析评估" style="width: 150px" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="医保" prop="medicalInsurance" label-width="100px">
                      <el-select v-model="form.medicalInsurance" placeholder="请选择" clearable :disabled="!action" style="width: 150px">
                        <el-option label="是" value="是" />
                        <el-option label="否" value="否" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="集采" prop="centralizedProcurement" label-width="100px">
                      <el-select v-model="form.centralizedProcurement" placeholder="请选择" clearable :disabled="!action" style="width: 150px">
                        <el-option label="是" value="是" />
                        <el-option label="否" value="否" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="采购形式" prop="procurementForm" label-width="100px">
                      <el-select v-model="form.procurementForm" placeholder="请选择" clearable :disabled="!action" style="width: 150px">
                        <el-option label="长期" value="长期" />
                        <el-option label="临采" value="临采" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="平台价格" prop="platformPrice" label-width="100px">
                      <el-input v-model.number="form.platformPrice" type="number" placeholder="请输入平台价格" :disabled="!action" style="width: 150px" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="10" class="mb8">
                <el-col :span="1.5">
                  <span>新品申购明细信息</span>
                </el-col>
                <div v-show="action">
                  <el-col :span="1.5">
                    <el-button type="primary" @click="submitForm">保存</el-button>
                  </el-col>
                </div>
              </el-row>
        <div class="table-wrapper">
        <el-table :data="applyEntryList" :row-class-name="rowApplyEntryIndex"
                  ref="applyEntry"
                  border
                  :height="tableHeight">
          <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
          <el-table-column label="耗材名称" prop="materialName" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.materialName" placeholder="请输入耗材名称" />
            </template>
          </el-table-column>
          <el-table-column label="规格" prop="speci" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.speci" placeholder="请输入规格" />
            </template>
          </el-table-column>
          <el-table-column label="型号" prop="model" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.model" placeholder="请输入型号" />
            </template>
          </el-table-column>
          <el-table-column label="单位" prop="unitName" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.unitName" placeholder="请输入单位" />
            </template>
          </el-table-column>
          <el-table-column label="单价" prop="price" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.price" placeholder="请输入单价"
                        @input="priceChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="品牌要求" prop="brandRequirement" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.brandRequirement" placeholder="请输入品牌要求" />
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" prop="factoryName" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.factoryName" placeholder="请输入生产厂家" />
            </template>
          </el-table-column>
          <el-table-column label="特殊说明" prop="specialNote" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.specialNote" placeholder="请输入特殊说明" />
            </template>
          </el-table-column>
          <el-table-column label="病案费用类别" prop="caseFeeCategory" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-select v-model="scope.row.caseFeeCategory" placeholder="请选择病案费用类别" clearable style="width: 100%">
                <el-option label="检查用一次性医用材料" value="检查用一次性医用材料" />
                <el-option label="治疗用一次性医用材料" value="治疗用一次性医用材料" />
                <el-option label="手术用一次性医用材料" value="手术用一次性医用材料" />
              </el-select>
            </template>
          </el-table-column>
              </el-table>
              </div>

              <!-- 第二个明细框 -->
              <el-row :gutter="10" class="mb8" style="margin-top: 20px;">
                <el-col :span="1.5">
                  <span>院内同类产品信息</span>
                </el-col>
              </el-row>
              <div class="table-wrapper-second">
                <el-table :data="applyDetailList" :row-class-name="rowApplyDetailIndex"
                          ref="applyDetail"
                          border
                          :height="detailTableHeight">
                  <el-table-column label="序号" align="center" prop="index" width="80" show-overflow-tooltip resizable/>
                  <el-table-column label="我院同类产品" prop="similarProduct" width="200" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-input clearable v-model="scope.row.similarProduct" placeholder="请输入我院同类产品" />
                    </template>
                  </el-table-column>
                  <el-table-column label="规格" prop="speci" width="200" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-input clearable v-model="scope.row.speci" placeholder="请输入规格" />
                    </template>
                  </el-table-column>
                  <el-table-column label="型号" prop="model" width="200" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-input clearable v-model="scope.row.model" placeholder="请输入型号" />
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-form>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 选择耗材对话框 -->
    <SelectMaterial
      v-if="materialDialogVisible"
      :visible.sync="materialDialogVisible"
      @selectMaterial="selectMaterial"
      style="display: none;"
    />
  </div>
</template>

<script>
import { listNewProductApply, getNewProductApply, delNewProductApply, addNewProductApply, updateNewProductApply } from "@/api/department/newProductApply";
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';

export default {
  name: "NewProductApply",
  dicts: ['biz_status'],
  components: {SelectMaterial, SelectDepartment},
  data() {
    return {
      // 遮罩层
      loading: true,
      materialDialogVisible: false,
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedEntry: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 新品申购申请表格数据
      applyList: [],
      // 新品申购申请明细表格数据
      applyEntryList: [],
      // 新品申购详细信息表格数据
      applyDetailList: [],
      // 明细表格高度
      tableHeight: '120px',
      // 详细信息表格高度
      detailTableHeight: '280px',
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
        applyNo: null,
        departmentId: null,
        applyStatus: null,
        beginDate: null,
        endDate: null,
      },
      // 表单参数
      form: {
        medicalInsurance: null,
        centralizedProcurement: null,
        procurementForm: null,
        platformPrice: null,
        reasonAndBenefit: null,
        remark: null
      },
      // 表单校验
      rules: {
        departmentId: [
          { required: true, message: "科室不能为空", trigger: "change" }
        ]
      }
    };
  },
  computed: {
    // 过滤单据状态选项，只保留"未审核"和"已审核"
    filteredBizStatus() {
      if (!this.dict.type.biz_status) {
        return [];
      }
      return this.dict.type.biz_status.filter(dict => {
        // 只保留"未审核"和"已审核"，移除"待审核"
        return dict.label === '未审核' || dict.label === '已审核';
      });
    }
  },
  created() {
    this.getList();
  },
  mounted() {
    // 监听弹窗打开，动态设置表格高度
    this.$nextTick(() => {
      this.setTableHeight();
    });
  },
  watch: {
    open(newVal) {
      if (newVal) {
        this.$nextTick(() => {
          this.setTableHeight();
        });
      }
    }
  },
  methods: {
    /** 查询新品申购申请列表 */
    getList() {
      this.loading = true;
      console.log('[新品申购申请] 开始查询列表，参数:', this.queryParams);
      listNewProductApply(this.queryParams).then(response => {
        console.log('[新品申购申请] API响应:', response);
        if (response && response.code === 200) {
          const rows = response.rows || [];
          // 确保申请人字段正确映射
          this.applyList = rows.map(row => {
            // 如果createBy为空，尝试从其他字段获取
            if (!row.createBy) {
              row.createBy = row.createrName || row.createrNickName || row.createrUserName || '';
            }
            return row;
          });
          this.total = response.total || 0;
          console.log('[新品申购申请] 查询成功，数据条数:', this.applyList.length);
        } else {
          this.applyList = [];
          this.total = 0;
          console.warn('[新品申购申请] 查询返回非200状态，code:', response?.code, 'msg:', response?.msg);
          if (response && response.msg) {
            this.$modal.msgWarning(response.msg);
          }
        }
        this.loading = false;
      }).catch(error => {
        console.error('[新品申购申请] 查询失败，完整错误信息:', error);
        console.error('[新品申购申请] 错误响应:', error.response);
        console.error('[新品申购申请] 错误状态码:', error.response?.status);
        console.error('[新品申购申请] 错误URL:', error.config?.url);
        // 如果是401或403错误，可能是权限问题，不显示错误提示，避免页面一直刷新
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          console.warn('[新品申购申请] 权限不足，无法访问新品申购申请列表');
          this.$modal.msgWarning('权限不足，请联系管理员分配权限');
        } else if (error.response && error.response.status === 404) {
          console.error('[新品申购申请] 接口不存在(404)，请检查后端Controller是否正确配置');
          this.$modal.msgError('接口不存在，请检查后端配置');
        } else if (error.response && error.response.status === 500) {
          console.error('[新品申购申请] 服务器错误(500)，请查看后端日志');
          this.$modal.msgError('服务器错误，请查看后端日志');
        } else {
          const errorMsg = error.msg || error.message || error.response?.data?.msg || '未知错误';
          console.error('[新品申购申请] 其他错误:', errorMsg);
          this.$modal.msgError('查询失败：' + errorMsg);
        }
        this.applyList = [];
        this.total = 0;
        this.loading = false;
      });
    },
    applyListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    formatTotalAmount(row) {
      if (row.applyEntryList && row.applyEntryList.length > 0) {
        const total = row.applyEntryList.reduce((sum, entry) => {
          return sum + (parseFloat(entry.amt) || 0);
        }, 0);
        return total.toFixed(2);
      }
      return '0.00';
    },
    getTotalAmount() {
      if (this.applyEntryList && this.applyEntryList.length > 0) {
        const total = this.applyEntryList.reduce((sum, entry) => {
          return sum + (parseFloat(entry.amt) || 0);
        }, 0);
        return total.toFixed(2);
      }
      return '0.00';
    },
    handlePrint(row, flag) {
      // 打印功能待实现
      this.$message.info('打印功能待实现');
    },
    handleAddEntry() {
      // 添加一个空行，支持手工维护
      let obj = {};
      obj.materialId = null;
      obj.materialName = "";
      obj.speci = "";
      obj.model = "";
      obj.factoryName = "";
      obj.unitName = "";
      obj.brandRequirement = "";
      obj.price = "";
      obj.specialNote = "";
      this.applyEntryList.push(obj);
    },
    selectMaterial(material) {
      // 添加选中的耗材到明细列表
      let obj = {};
      obj.materialId = material.id;
      obj.materialName = material.name || "";
      obj.speci = material.speci || "";
      obj.model = material.model || "";
      obj.factoryName = (material.fdFactory && material.fdFactory.factoryName) || "";
      obj.supplierName = (material.supplier && material.supplier.name) || "";
      obj.unitName = (material.fdUnit && material.fdUnit.unitName) || "";
      obj.qty = "";
      obj.price = "";
      obj.amt = "";
      obj.remark = "";
      obj.material = material; // 保存完整的material对象
      this.applyEntryList.push(obj);
    },
    //当天日期
    getApplyDate(){
      let now = new Date();
      let year = now.getFullYear();
      let month = String(now.getMonth() + 1).padStart(2, '0');
      let day = String(now.getDate()).padStart(2, '0');
      return year + "-" + month + "-" + day;
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        applyNo: null,
        applyDate: null,
        departmentId: null,
        applyStatus: null,
        delFlag: null,
        auditDate: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null,
        reasonAndBenefit: null,
        medicalInsurance: null,
        centralizedProcurement: null,
        procurementForm: null,
        platformPrice: null
      };
      // 固定显示1行新品申购明细信息
      this.applyEntryList = [{}];
      // 固定显示3条院内同类产品信息
      this.applyDetailList = [{}, {}, {}];
      this.resetForm("form");
    },
    //数量改变事件
    qtyChange(row){
      let totalAmt = 0;
      if(row.qty && row.price){
        totalAmt = parseFloat(row.qty) * parseFloat(row.price);
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);
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
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
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
      getNewProductApply(id).then(response => {
        console.log('[查看] 后端返回完整数据:', JSON.stringify(response.data, null, 2));
        // 使用Vue.set确保响应式
        const data = response.data || {};
        this.$set(this, 'form', {
          ...this.form,
          ...data,
          // 处理申请人字段 - 优先使用createByUser对象的nickName
          createBy: (data.createByUser && data.createByUser.nickName) || 
                    (data.createByUser && data.createByUser.userName) || 
                    data.createBy || 
                    data.createrName || 
                    data.createrNickName || 
                    data.createrUserName || '',
          // 支持下划线格式的字段名
          medicalInsurance: data.medicalInsurance || data.medical_insurance || '',
          centralizedProcurement: data.centralizedProcurement || data.centralized_procurement || '',
          procurementForm: data.procurementForm || data.procurement_form || '',
          platformPrice: data.platformPrice || data.platform_price || '',
          reasonAndBenefit: data.reasonAndBenefit || data.reason_and_benefit || '',
          applyDate: data.applyDate || '',
          remark: data.remark || ''
        });
        console.log('[查看] 处理后的form数据:', JSON.stringify(this.form, null, 2));
        // 固定显示1行新品申购明细信息
        const entryList = response.data.applyEntryList || [];
        if (entryList.length > 0) {
          const entry = entryList[0];
          this.applyEntryList = [{
            ...entry,
            brandRequirement: entry.brandRequirement || entry.brand_requirement || '',
            specialNote: entry.specialNote || entry.special_note || '',
            caseFeeCategory: entry.caseFeeCategory || entry.case_fee_category || ''
          }];
        } else {
          this.applyEntryList = [{}];
        }
        // 固定显示3条院内同类产品信息
        // 尝试多种可能的字段名
        const detailList = response.data.applyDetailList || 
                          response.data.apply_detail_list || 
                          response.data.detailList || 
                          response.data.details || 
                          [];
        console.log('[查看] 院内同类产品信息原始数据:', detailList);
        if (detailList && detailList.length > 0) {
          // 确保数据对象有必要的字段
          const processedList = detailList.map(item => ({
            similarProduct: item.similarProduct || item.similar_product || item.productName || '',
            speci: item.speci || item.specification || '',
            model: item.model || '',
            platformPrice: item.platformPrice || item.platform_price || ''
          }));
          while (processedList.length < 3) {
            processedList.push({});
          }
          this.applyDetailList = processedList.slice(0, 3);
        } else {
          this.applyDetailList = [{}, {}, {}];
        }
        console.log('[查看] 处理后的院内同类产品信息:', this.applyDetailList);
        this.open = true;
        this.action = false;
        this.form.applyStatus = this.form.applyStatus || '1';
        this.title = "查看新品申购申请";
        this.$nextTick(() => {
          setTimeout(() => {
            this.setTableHeight();
          }, 100);
        });
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加新品申购申请";
      this.form.applyStatus = '1';
      //申请人 - 优先显示汉字姓名
      const currentUser = this.$store.state.user;
      this.form.createBy = currentUser.nickName || currentUser.name || '';
      this.form.applyDate = this.getApplyDate();
      this.action = true;
      // 初始化详细信息列表
      // 固定显示3条院内同类产品信息
      this.applyDetailList = [{}, {}, {}];
      this.$nextTick(() => {
        setTimeout(() => {
          this.setTableHeight();
        }, 100);
      });
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getNewProductApply(id).then(response => {
        console.log('[修改] 后端返回完整数据:', JSON.stringify(response.data, null, 2));
        // 使用Vue.set确保响应式
        const data = response.data || {};
        this.$set(this, 'form', {
          ...this.form,
          ...data,
          // 处理申请人字段 - 优先使用createByUser对象的nickName
          createBy: (data.createByUser && data.createByUser.nickName) || 
                    (data.createByUser && data.createByUser.userName) || 
                    data.createBy || 
                    data.createrName || 
                    data.createrNickName || 
                    data.createrUserName || '',
          // 支持下划线格式的字段名
          medicalInsurance: data.medicalInsurance || data.medical_insurance || '',
          centralizedProcurement: data.centralizedProcurement || data.centralized_procurement || '',
          procurementForm: data.procurementForm || data.procurement_form || '',
          platformPrice: data.platformPrice || data.platform_price || '',
          reasonAndBenefit: data.reasonAndBenefit || data.reason_and_benefit || '',
          applyDate: data.applyDate || '',
          remark: data.remark || ''
        });
        console.log('[修改] 处理后的form数据:', JSON.stringify(this.form, null, 2));
        // 固定显示1行新品申购明细信息
        const entryList = response.data.applyEntryList || [];
        if (entryList.length > 0) {
          const entry = entryList[0];
          this.applyEntryList = [{
            ...entry,
            brandRequirement: entry.brandRequirement || entry.brand_requirement || '',
            specialNote: entry.specialNote || entry.special_note || '',
            caseFeeCategory: entry.caseFeeCategory || entry.case_fee_category || ''
          }];
        } else {
          this.applyEntryList = [{}];
        }
        // 固定显示3条院内同类产品信息，如果后端有数据则使用，否则显示3条空数据
        // 尝试多种可能的字段名
        const detailList = response.data.applyDetailList || 
                          response.data.apply_detail_list || 
                          response.data.detailList || 
                          response.data.details || 
                          [];
        console.log('[修改] 院内同类产品信息原始数据:', detailList);
        if (detailList && detailList.length > 0) {
          // 确保数据对象有必要的字段
          const processedList = detailList.map(item => ({
            similarProduct: item.similarProduct || item.similar_product || item.productName || '',
            speci: item.speci || item.specification || '',
            model: item.model || '',
            platformPrice: item.platformPrice || item.platform_price || ''
          }));
          while (processedList.length < 3) {
            processedList.push({});
          }
          this.applyDetailList = processedList.slice(0, 3);
        } else {
          this.applyDetailList = [{}, {}, {}];
        }
        console.log('[修改] 处理后的院内同类产品信息:', this.applyDetailList);
        this.open = true;
        this.title = "修改新品申购申请";
        this.form.applyStatus = this.form.applyStatus || '1';
        this.$nextTick(() => {
          setTimeout(() => {
            this.setTableHeight();
          }, 100);
        });
        this.action = true;
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          // 验证明细列表
          if (!this.applyEntryList || this.applyEntryList.length === 0) {
            this.$modal.msgError("请添加明细！");
            return;
          }
          this.form.applyEntryList = this.applyEntryList;
          this.form.applyDetailList = this.applyDetailList;
          if (this.form.id != null) {
            updateNewProductApply(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.form = response.data;
              // 固定显示1行新品申购明细信息
              const entryList = response.data.applyEntryList || [];
              this.applyEntryList = entryList.length > 0 ? [entryList[0]] : [{}];
              // 固定显示3条院内同类产品信息
              const detailList = response.data.applyDetailList || 
                                response.data.apply_detail_list || 
                                response.data.detailList || 
                                response.data.details || 
                                [];
              if (detailList && detailList.length > 0) {
                const processedList = detailList.map(item => ({
                  similarProduct: item.similarProduct || item.similar_product || item.productName || '',
                  speci: item.speci || item.specification || '',
                  model: item.model || '',
                  platformPrice: item.platformPrice || item.platform_price || ''
                }));
                while (processedList.length < 3) {
                  processedList.push({});
                }
                this.applyDetailList = processedList.slice(0, 3);
              } else {
                this.applyDetailList = [{}, {}, {}];
              }
              this.getList();
            });
          } else {
            addNewProductApply(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.form = response.data;
              // 固定显示1行新品申购明细信息
              const entryList = response.data.applyEntryList || [];
              this.applyEntryList = entryList.length > 0 ? [entryList[0]] : [{}];
              // 固定显示3条院内同类产品信息
              const detailList = response.data.applyDetailList || 
                                response.data.apply_detail_list || 
                                response.data.detailList || 
                                response.data.details || 
                                [];
              if (detailList && detailList.length > 0) {
                const processedList = detailList.map(item => ({
                  similarProduct: item.similarProduct || item.similar_product || item.productName || '',
                  speci: item.speci || item.specification || '',
                  model: item.model || '',
                  platformPrice: item.platformPrice || item.platform_price || ''
                }));
                while (processedList.length < 3) {
                  processedList.push({});
                }
                this.applyDetailList = processedList.slice(0, 3);
              } else {
                this.applyDetailList = [{}, {}, {}];
              }
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除新品申购申请编号为"' + ids + '"的数据项？').then(() => {
        return delNewProductApply(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 新品申购申请明细序号 */
    rowApplyEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 新品申购申请明细删除按钮操作 */
    handleDeleteEntry() {
      if (this.checkedEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的新品申购申请明细数据");
      } else {
        const applyEntryList = this.applyEntryList;
        const checkedEntry = this.checkedEntry;
        this.applyEntryList = applyEntryList.filter(function(item) {
          return checkedEntry.indexOf(item.index) == -1
        });
      }
    },
    /** 院内同类产品信息序号 */
    rowApplyDetailIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 复选框选中数据 */
    handleEntrySelectionChange(selection) {
      this.checkedEntry = selection.map(item => item.index)
    },
    /** 设置明细表格高度 */
    setTableHeight() {
      // 多次尝试设置，确保DOM已渲染
      const setHeight = () => {
        const tableWrapper = document.querySelector('.local-modal-content .table-wrapper');
        const table = this.$refs.applyEntry;
        
          if (tableWrapper) {
          // 直接设置容器高度
          tableWrapper.style.setProperty('height', '120px', 'important');
          tableWrapper.style.setProperty('max-height', '120px', 'important');
          tableWrapper.style.setProperty('min-height', '120px', 'important');
        }
        
        if (table && table.$el) {
          // 设置表格高度
          table.$el.style.setProperty('height', '120px', 'important');
          table.$el.style.setProperty('max-height', '120px', 'important');
          table.$el.style.setProperty('min-height', '120px', 'important');
          
          // 设置表格主体高度
          const bodyWrapper = table.$el.querySelector('.el-table__body-wrapper');
          if (bodyWrapper) {
            bodyWrapper.style.setProperty('max-height', '72px', 'important');
            bodyWrapper.style.setProperty('height', '72px', 'important');
          }
          
          // 触发表格重新布局
          if (table.doLayout) {
            table.doLayout();
          }
        }
      };
      
      // 立即执行一次
      this.$nextTick(() => {
        setHeight();
        // 延迟执行，确保DOM已渲染
        setTimeout(setHeight, 50);
        setTimeout(setHeight, 100);
        setTimeout(setHeight, 200);
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('department/newProductApply/export', {
        ...this.queryParams
      }, `newProductApply_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
/* 内部弹窗样式 - 占满整个遮罩层 */
.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.3);
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  min-height: 95vh !important;
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
  flex-shrink: 0;
  min-height: 48px;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.close-btn {
  border: 1px solid #DCDFE6;
  background: #fff;
  padding: 7px 15px;
}

.close-btn:hover {
  background: #F5F7FA;
  border-color: #C0C4CC;
}

.modal-footer {
  padding: 16px 24px;
  text-align: right;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
}

.modal-footer .el-button {
  margin-left: 12px;
}

.local-modal-content .el-form {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 弹窗内表单字段容器 */
.local-modal-content .form-fields-container {
  background: #fff;
  padding: 24px 32px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  border: 1px solid #EBEEF5;
  flex-shrink: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

/* 确保明细表格可以水平滚动 */
::v-deep .local-modal-content .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
}

/* 弹窗内表格样式 */
/* 移除旧的表格高度设置，使用下面的新设置 */

/* 弹窗动画效果 */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter, .modal-fade-leave-to {
  opacity: 0;
}

.modal-zoom-enter-active, .modal-zoom-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-origin: center center;
}

.modal-zoom-enter {
  opacity: 0;
  transform: scale(0.3) translateY(-50px);
}

.modal-zoom-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* 确保页面容器有相对定位，以便内部弹窗正确定位 */
.app-container {
  position: relative;
}

/* 表单样式优化 */
.el-form-item {
  margin-bottom: 18px;
}

.el-form-item__label {
  color: #606266;
  font-weight: 500;
}

/* 搜索条件容器样式 */
.form-fields-container {
  background: #fff;
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-top: -10px;
  margin-bottom: 16px;
  border: 1px solid #EBEEF5;
}

.query-row-left {
  margin-bottom: 10px;
}

.query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 10px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-select-wrapper {
  width: 180px;
}

.query-row-second {
  margin-bottom: 10px;
  position: relative;
}

.query-row-second .el-form-item {
  white-space: nowrap;
}

.query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
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

.local-modal-content .modal-form-compact .el-form-item {
  margin-bottom: 0;
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

/* 弹窗内表格样式 - 高度调到确定按钮上面一点 */
.local-modal-content .table-wrapper {
  flex: 0 0 auto !important;
  overflow: hidden !important;
  margin-top: 8px !important;
  height: 120px !important;
  max-height: 120px !important;
  min-height: 120px !important;
  position: relative !important;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.local-modal-content .table-wrapper .el-table {
  height: 120px !important;
  max-height: 120px !important;
  min-height: 120px !important;
}

.local-modal-content .table-wrapper .el-table__body-wrapper {
  max-height: 72px !important;
  overflow-y: auto !important;
  height: 72px !important;
}

/* 优化列间距 */
.local-modal-content .table-wrapper .el-table td {
  padding: 8px 12px !important;
}

.local-modal-content .table-wrapper .el-table th {
  padding: 12px 12px !important;
}

.local-modal-content .table-wrapper .el-table .el-input__inner {
  padding: 0 10px !important;
}

/* 院内同类产品信息表格列间距 */
.local-modal-content .table-wrapper-second .el-table td {
  padding: 8px 12px !important;
}

.local-modal-content .table-wrapper-second .el-table th {
  padding: 12px 12px !important;
}

.local-modal-content .table-wrapper-second .el-table .el-input__inner {
  padding: 0 10px !important;
}

/* 第二个明细框样式 */
.local-modal-content .table-wrapper-second {
  flex: 0 0 auto !important;
  overflow: hidden !important;
  margin-top: 10px !important;
  height: 280px !important;
  max-height: 280px !important;
  min-height: 280px !important;
  position: relative !important;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.local-modal-content .table-wrapper-second .el-table {
  height: 280px !important;
  max-height: 280px !important;
  min-height: 280px !important;
}

.local-modal-content .table-wrapper-second .el-table__body-wrapper {
  max-height: 232px !important;
  overflow-y: auto !important;
  height: 232px !important;
}

/* 强制设置表格容器高度 */
.local-modal-content .el-form .table-wrapper {
  height: 150px !important;
  max-height: 150px !important;
}

.local-modal-content .el-form .table-wrapper .el-table {
  height: 150px !important;
  max-height: 150px !important;
}

/* 使用深度选择器确保样式生效 */
::v-deep .local-modal-content .table-wrapper {
  height: 150px !important;
  max-height: 150px !important;
}

::v-deep .local-modal-content .table-wrapper .el-table {
  height: 150px !important;
  max-height: 150px !important;
}

/* 更强的选择器优先级 */
.local-modal-content .el-form .el-form-item .table-wrapper {
  height: 150px !important;
  max-height: 150px !important;
  min-height: 150px !important;
}

.local-modal-content .el-form .el-form-item .table-wrapper .el-table {
  height: 150px !important;
  max-height: 150px !important;
  min-height: 150px !important;
}

.local-modal-content .el-form .el-form-item .table-wrapper .el-table .el-table__body-wrapper {
  max-height: 102px !important;
  height: 102px !important;
}

/* 表格样式优化 */
.el-table {
  border-radius: 4px;
  overflow: hidden;
}

.el-table th {
  background-color: #F5F7FA !important;
  color: #606266 !important;
  font-weight: 600 !important;
  border-right: 1px solid #EBEEF5 !important;
  border-bottom: 1px solid #EBEEF5 !important;
}

.el-table td {
  border-right: 1px solid #EBEEF5 !important;
  border-bottom: 1px solid #EBEEF5 !important;
}

.el-table .cell {
  padding: 0 8px;
  line-height: 1.5;
}

/* 确保表格可以水平滚动和垂直滚动 */
::v-deep .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
}

/* 增大底部滚动条 */
::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 12px !important;
}

::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  height: 12px !important;
  border-radius: 6px;
}

/* 隐藏底部查询条件下拉框 */
body > .el-select-dropdown:last-child,
body > .el-popper:last-child,
.el-select-dropdown[style*="position: fixed"][style*="bottom"] {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}
</style>

