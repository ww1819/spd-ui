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
          type="success"
          plain
          icon="el-icon-check"
          size="medium"
          :disabled="single"
          @click="handleAudit"
          v-hasPermi="['department:newProductAudit:audit']"
        >审核</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="medium"
          @click="handleExport"
          v-hasPermi="['department:newProductAudit:export']"
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
      <!-- 隐藏的ID列，用于调试 -->
      <el-table-column prop="id" v-if="false" />
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
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180">
        <template slot-scope="scope">
          <!-- 已审核的单据只显示打印按钮 -->
          <el-button
            v-if="scope.row.applyStatus == 2"
            size="small"
            type="text"
            @click="handlePrint(scope.row)"
          >打印</el-button>
          <!-- 未审核的单据显示查看和审核按钮 -->
          <template v-if="scope.row.applyStatus != 2">
            <el-button
              size="small"
              type="text"
              @click="handleView(scope.row)"
            >查看</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleAudit(scope.row)"
              v-hasPermi="['department:newProductAudit:audit']"
              v-if="scope.row.applyStatus == 0"
            >审核</el-button>
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

    <!-- 查看新品申购申请对话框 -->
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
                      <SelectDepartment v-model="form.departmentId" :disabled="true" />
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
                      <el-input v-model="form.reasonAndBenefit" :disabled="true" placeholder="请输入申请理由及效益分析" style="width: 150px" />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row>
                  <el-col :span="4">
                    <el-form-item label="分析评估" prop="remark" label-width="100px">
                      <el-input v-model="form.remark" :disabled="true" placeholder="请输入分析评估" style="width: 150px" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="医保" prop="medicalInsurance" label-width="100px">
                      <el-select v-model="form.medicalInsurance" placeholder="请选择" clearable :disabled="true" style="width: 150px">
                        <el-option label="是" value="是" />
                        <el-option label="否" value="否" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="集采" prop="centralizedProcurement" label-width="100px">
                      <el-select v-model="form.centralizedProcurement" placeholder="请选择" clearable :disabled="true" style="width: 150px">
                        <el-option label="是" value="是" />
                        <el-option label="否" value="否" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="采购形式" prop="procurementForm" label-width="100px">
                      <el-select v-model="form.procurementForm" placeholder="请选择" clearable :disabled="true" style="width: 150px">
                        <el-option label="长期" value="长期" />
                        <el-option label="临采" value="临采" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="平台价格" prop="platformPrice" label-width="100px">
                      <el-input v-model.number="form.platformPrice" type="number" placeholder="请输入平台价格" :disabled="true" style="width: 150px" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="10" class="mb8">
                <el-col :span="1.5">
                  <span>新品申购明细信息</span>
                </el-col>
              </el-row>
        <div class="table-wrapper">
        <el-table :data="applyEntryList" :row-class-name="rowApplyEntryIndex"
                  ref="applyEntry"
                  border
                  :height="tableHeight">
          <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
          <el-table-column label="耗材名称" prop="materialName" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.materialName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="规格" prop="speci" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.speci || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="型号" prop="model" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.model || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" prop="unitName" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.unitName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单价" prop="price" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.price ? parseFloat(scope.row.price).toFixed(2) : '0.00' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="品牌要求" prop="brandRequirement" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.brandRequirement || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" prop="factoryName" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.factoryName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="特殊说明" prop="specialNote" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.specialNote || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="病案费用类别" prop="caseFeeCategory" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.caseFeeCategory || '--' }}</span>
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
                      <span>{{ scope.row.similarProduct || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="规格" prop="speci" width="200" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <span>{{ scope.row.speci || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="型号" prop="model" width="200" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <span>{{ scope.row.model || '--' }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>

              <!-- 审批操作按钮 -->
              <div v-if="form.applyStatus == 0" style="margin-top: 20px; text-align: right; padding: 16px 24px; border-top: 1px solid #EBEEF5;">
                <el-button type="success" @click="handleAuditConfirm" v-hasPermi="['department:newProductAudit:audit']">审核通过</el-button>
                <el-button type="danger" @click="handleReject" v-hasPermi="['department:newProductAudit:reject']">驳回</el-button>
              </div>
            </el-form>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 打印组件（隐藏） -->
    <new-product-audit-print v-if="printRowData" :row="printRowData" ref="newProductAuditPrintRefAuto"></new-product-audit-print>
  </div>
</template>

<script>
import { listNewProductAudit, getNewProductAudit, auditNewProductApply, rejectNewProductApply, exportNewProductAudit } from "@/api/department/newProductAudit";
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import newProductAuditPrint from "@/views/department/newProductAudit/newProductAuditPrint";

export default {
  name: "NewProductAudit",
  dicts: ['biz_status'],
  components: {SelectDepartment, newProductAuditPrint},
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
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
      action: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        applyNo: null,
        departmentId: null,
        applyStatus: null, // 默认显示全部
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
      // 打印数据
      printRowData: null,
      // 表单校验
      rules: {}
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
      listNewProductAudit(this.queryParams).then(response => {
        if (response && response.code === 200) {
          const rows = response.rows || [];
          this.applyList = rows.map((row, index) => {
            // 确保id字段存在，尝试多种可能的字段名
            const originalId = row.id;
            if (!row.id || row.id === undefined || row.id === null) {
              row.id = row.applyId || row.newProductApplyId || row.id;
            }
            // 强制确保id字段存在
            if (!row.id && originalId !== undefined && originalId !== null) {
              row.id = originalId;
            }
            if (!row.createBy) {
              row.createBy = row.createrName || row.createrNickName || row.createrUserName || '';
            }
            // 调试日志：检查第一条数据的id
            if (index === 0) {
              console.log('[新品申购审批] 第一条数据完整对象:', JSON.stringify(row, null, 2));
              console.log('[新品申购审批] 原始ID字段:', originalId);
              console.log('[新品申购审批] 处理后ID字段:', row.id);
              console.log('[新品申购审批] 所有字段名:', Object.keys(row));
              console.log('[新品申购审批] 数据类型检查 - id类型:', typeof row.id, '值:', row.id);
            }
            // 如果还是没有id，记录警告并尝试从其他字段获取
            if (!row.id || row.id === undefined || row.id === null) {
              console.warn('[新品申购审批] 警告：数据缺少ID字段，row:', JSON.stringify(row, null, 2));
              // 尝试从其他可能的字段获取id
              const possibleId = row.id || row.applyId || row.newProductApplyId || 
                                (row.data && row.data.id) || 
                                (row.response && row.response.id);
              if (possibleId) {
                row.id = possibleId;
                console.log('[新品申购审批] 从其他字段获取到ID:', possibleId);
              }
            }
            return row;
          });
          this.total = response.total || 0;
        } else {
          this.applyList = [];
          this.total = 0;
        }
        this.loading = false;
      }).catch(error => {
        console.error('查询失败:', error);
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
      this.queryParams.applyStatus = null; // 重置为全部
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
      // 尝试多种可能的id字段名
      const id = row.id || row.applyId || row.newProductApplyId || (row.data && row.data.id);
      console.log('[新品申购审批] 查看操作，row对象:', JSON.stringify(row, null, 2));
      console.log('[新品申购审批] row.id:', row.id);
      console.log('[新品申购审批] row的所有属性:', Object.keys(row));
      console.log('[新品申购审批] 提取的ID:', id);
      if (!id || id === 'undefined' || id === undefined) {
        console.error('[新品申购审批] ID不存在，row对象完整内容:', JSON.stringify(row, null, 2));
        this.$modal.msgError("数据ID不存在，无法查看。请检查数据是否正确加载。");
        return;
      }
      getNewProductAudit(id).then(response => {
        const data = response.data || {};
        this.$set(this, 'form', {
          ...this.form,
          ...data,
          id: data.id || id, // 确保id被正确设置
          createBy: (data.createByUser && data.createByUser.nickName) || 
                    (data.createByUser && data.createByUser.userName) || 
                    data.createBy || 
                    data.createrName || 
                    data.createrNickName || 
                    data.createrUserName || '',
          medicalInsurance: data.medicalInsurance || data.medical_insurance || '',
          centralizedProcurement: data.centralizedProcurement || data.centralized_procurement || '',
          procurementForm: data.procurementForm || data.procurement_form || '',
          platformPrice: data.platformPrice || data.platform_price || '',
          reasonAndBenefit: data.reasonAndBenefit || data.reason_and_benefit || '',
          applyDate: data.applyDate || '',
          remark: data.remark || ''
        });
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
        const detailList = response.data.applyDetailList || 
                          response.data.apply_detail_list || 
                          response.data.detailList || 
                          response.data.details || 
                          [];
        if (detailList && detailList.length > 0) {
          const processedList = detailList.map(item => ({
            similarProduct: item.similarProduct || item.similar_product || item.productName || '',
            speci: item.speci || item.specification || '',
            model: item.model || ''
          }));
          while (processedList.length < 3) {
            processedList.push({});
          }
          this.applyDetailList = processedList.slice(0, 3);
        } else {
          this.applyDetailList = [{}, {}, {}];
        }
        this.open = true;
        this.title = "查看新品申购申请";
        this.form.applyStatus = this.form.applyStatus != null ? this.form.applyStatus : 0;
        this.action = false;
        this.$nextTick(() => {
          setTimeout(() => {
            this.setTableHeight();
          }, 100);
        });
      });
    },
    /** 审核按钮操作 */
    handleAudit(row) {
      let auditId = null;
      
      // 如果传入的是事件对象（比如从顶部按钮点击），则从选中的数据中获取
      if (!row || (row.isTrusted !== undefined && Object.keys(row).length === 1)) {
        if (this.ids.length === 0) {
          this.$modal.msgWarning("请先选择要审核的数据项");
          return;
        }
        if (this.ids.length > 1) {
          this.$modal.msgWarning("请选择单条数据进行审核");
          return;
        }
        auditId = this.ids[0];
      } else if (row && row.id) {
        // 如果传入的是行数据，使用行数据的id
        auditId = row.id;
      } else {
        console.error('[新品申购审批] handleAudit接收到无效的row参数:', row);
        this.$modal.msgError("数据无效，无法审核");
        return;
      }
      
      // 确认审核操作
      this.$modal.confirm('确定要审核通过该申请吗？').then(() => {
        return auditNewProductApply(auditId);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("审核成功");
      }).catch(() => {
        // 用户取消操作，不显示错误
      });
    },
    /** 审核通过 */
    handleAuditConfirm() {
      if (!this.form.id) {
        this.$modal.msgError("数据ID不存在，无法审核");
        return;
      }
      this.$modal.confirm('确定要审核通过该申请吗？').then(() => {
        return auditNewProductApply(this.form.id);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("审核成功");
        this.cancel();
      }).catch(() => {});
    },
    /** 驳回 */
    handleReject() {
      this.$prompt('请输入驳回原因', '驳回申请', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '请输入驳回原因',
        inputValidator: (value) => {
          if (!value || value.trim() === '') {
            return '驳回原因不能为空';
          }
          return true;
        }
      }).then(({ value }) => {
        // 将驳回原因设置到remark字段
        if (!this.form.id) {
          this.$modal.msgError("数据ID不存在，无法驳回");
          return Promise.reject();
        }
        return rejectNewProductApply({ id: this.form.id, remark: value });
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("驳回成功");
        this.cancel();
      }).catch(() => {});
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
      this.applyEntryList = [{}];
      this.applyDetailList = [{}, {}, {}];
      this.resetForm("form");
    },
    rowApplyEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    rowApplyDetailIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    setTableHeight() {
      const setHeight = () => {
        const tableWrapper = this.$refs.applyEntry;
        if (tableWrapper && tableWrapper.$el) {
          const table = tableWrapper;
          table.$el.style.setProperty('height', '120px', 'important');
          table.$el.style.setProperty('max-height', '120px', 'important');
          table.$el.style.setProperty('min-height', '120px', 'important');
          
          const bodyWrapper = table.$el.querySelector('.el-table__body-wrapper');
          if (bodyWrapper) {
            bodyWrapper.style.setProperty('max-height', '72px', 'important');
            bodyWrapper.style.setProperty('height', '72px', 'important');
          }
          
          if (table.doLayout) {
            table.doLayout();
          }
        }
      };
      
      this.$nextTick(() => {
        setHeight();
        setTimeout(setHeight, 50);
        setTimeout(setHeight, 100);
        setTimeout(setHeight, 200);
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('department/newProductAudit/export', {
        ...this.queryParams
      }, `newProductAudit_${new Date().getTime()}.xlsx`)
    },
    /** 打印按钮操作 */
    handlePrint(row) {
      // 获取详情数据并触发打印
      this.getNewProductAuditDetail(row).then(res => {
        // 设置打印数据
        this.printRowData = res;
        // 等待组件渲染后调用 start()
        this.$nextTick(() => {
          if (this.$refs['newProductAuditPrintRefAuto']) {
            // start() 方法会直接触发浏览器打印对话框
            this.$refs['newProductAuditPrintRefAuto'].start();
          }
        });
      }).catch(error => {
        console.error('[新品申购审批] 获取打印数据失败:', error);
        this.$modal.msgError('获取打印数据失败，请重试');
      });
    },
    /** 获取新品申购审批详情数据（用于打印） */
    getNewProductAuditDetail(row) {
      return new Promise((resolve, reject) => {
        const id = row.id || row.applyId || row.newProductApplyId;
        if (!id) {
          reject(new Error('数据ID不存在'));
          return;
        }
        getNewProductAudit(id).then(response => {
          const data = response.data || {};
          // 格式化数据用于打印
          const printData = {
            applyNo: data.applyNo || '',
            departmentName: (data.department && data.department.name) || '',
            createBy: (data.createByUser && data.createByUser.nickName) || 
                      (data.createByUser && data.createByUser.userName) || 
                      data.createBy || '',
            applyDate: data.applyDate ? this.parseTime(data.applyDate, '{y}-{m}-{d}') : '',
            auditDate: data.auditDate ? this.parseTime(data.auditDate, '{y}-{m}-{d}') : '',
            applyStatusText: data.applyStatus === 2 ? '已审核' : (data.applyStatus === 0 ? '未审核' : '--'),
            reasonAndBenefit: data.reasonAndBenefit || data.reason_and_benefit || '',
            remark: data.remark || '',
            medicalInsurance: data.medicalInsurance || data.medical_insurance || '',
            centralizedProcurement: data.centralizedProcurement || data.centralized_procurement || '',
            procurementForm: data.procurementForm || data.procurement_form || '',
            platformPrice: data.platformPrice || data.platform_price || '',
            updateBy: data.updateBy || '',
            applyEntryList: (data.applyEntryList || []).map(entry => ({
              materialName: entry.materialName || (entry.material && entry.material.name) || '',
              speci: entry.speci || (entry.material && entry.material.speci) || '',
              model: entry.model || (entry.material && entry.material.model) || '',
              unitName: entry.unitName || (entry.material && entry.material.fdUnit && entry.material.fdUnit.unitName) || '',
              price: entry.price || '',
              brandRequirement: entry.brandRequirement || entry.brand_requirement || '',
              factoryName: entry.factoryName || (entry.material && entry.material.fdFactory && entry.material.fdFactory.factoryName) || '',
              specialNote: entry.specialNote || entry.special_note || '',
              caseFeeCategory: entry.caseFeeCategory || entry.case_fee_category || ''
            })),
            applyDetailList: (data.applyDetailList || data.apply_detail_list || []).map(detail => ({
              similarProduct: detail.similarProduct || detail.similar_product || '',
              speci: detail.speci || '',
              model: detail.model || ''
            }))
          };
          resolve(printData);
        }).catch(error => {
          reject(error);
        });
      });
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

/* 院内同类产品信息表格列间距 */
.local-modal-content .table-wrapper-second .el-table td {
  padding: 8px 12px !important;
}

.local-modal-content .table-wrapper-second .el-table th {
  padding: 12px 12px !important;
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
  padding: 10px 20px 10px 20px !important;
}

/* 表单样式优化 */
.el-form-item {
  margin-bottom: 18px;
}

.el-form-item__label {
  color: #606266;
  font-weight: 500;
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
</style>
