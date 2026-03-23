<template>
  <div class="app-container d-apply-page">
    <div class="form-fields-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form">

        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item prop="applyBillNo" class="query-item-inline">
              <el-input
                v-model="queryParams.applyBillNo"
                placeholder="单号"
                clearable
                style="width: 180px"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item prop="warehouseId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectWarehouse v-model="queryParams.warehouseId"/>
              </div>
            </el-form-item>
            <el-form-item prop="departmentId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectDepartment v-model="queryParams.departmentId" />
              </div>
            </el-form-item>
            <el-form-item prop="applyBillStatus" class="query-item-inline">
              <el-select v-model="queryParams.applyBillStatus" placeholder="单据状态"
                         :disabled="false"
                         clearable
                         style="width: 180px">
                <el-option v-for="dict in dict.type.biz_status.filter(item => item.value == '1' || item.value == '2' || item.value == 1 || item.value == 2)"
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
            <el-form-item style="display: flex; align-items: center;">
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
          size="medium"
          @click="handleAdd"
          v-hasPermi="['department:dApply:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="handleExport"
          v-hasPermi="['department:dApply:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="handleQuery"
        >搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="resetQuery"
        >重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="applyList" :row-class-name="rowApplyIndex" @selection-change="handleSelectionChange" height="64vh" border stripe>
      <el-table-column type="selection" width="60" align="center" fixed="left" />
      <el-table-column label="序号" align="center" prop="index" width="80" show-overflow-tooltip resizable />
      <el-table-column label="单号" align="center" prop="applyBillNo" width="180" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.applyBillNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="createTime" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable />
      <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable />
      <el-table-column label="金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount && parseFloat(scope.row.totalAmount) > 0">¥{{ parseFloat(scope.row.totalAmount).toFixed(2) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="createrNmae" width="100" show-overflow-tooltip resizable />
      <el-table-column label="申请状态" align="center" prop="applyBillStatus" width="100" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.applyBillStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditPersonName" width="100" show-overflow-tooltip resizable />
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="驳回原因" align="center" prop="rejectReason" width="150" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.rejectReason || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180" fixed="right">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              @click="handleView(scope.row)"
              v-if="scope.row.applyBillStatus == 2"
              style="padding: 0 5px; margin: 0;"
            >查看</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['department:dApply:edit']"
              v-if="scope.row.applyBillStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleDelete(scope.row)"
              v-hasPermi="['department:dApply:remove']"
              v-if="scope.row.applyBillStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >删除</el-button>
          </span>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-bottom-wrap">
      <pagination
        v-show="total>0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>

    <!-- 添加或修改科室申领对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="80px" class="modal-form-wrapper">
              <div class="form-fields-container d-apply-form-fields">
              <el-row>
                <el-col :span="4">
                  <el-form-item label="单号" prop="applyBillNo" label-width="100px">
                    <el-input v-model="form.applyBillNo" :disabled="true" class="d-apply-form-input" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="申领状态" prop="billStatus" label-width="100px">
                    <el-select v-model="form.applyBillStatus" placeholder="请选择申领状态"
                               :disabled="true"
                               clearable class="d-apply-form-input">
                      <el-option v-for="dict in dict.type.biz_status"
                                 :key="dict.value"
                                 :label="dict.label"
                                 :value="dict.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>

                <el-col :span="4">
                  <el-form-item label="仓库" prop="warehouseId" label-width="100px">
                    <div class="d-apply-form-input">
                      <SelectWarehouse v-model="form.warehouseId"/>
                    </div>
                  </el-form-item>
                </el-col>

                <el-col :span="4">
                  <el-form-item label="科室" prop="departmentId" label-width="100px">
                    <div class="d-apply-form-input">
                      <SelectDepartment v-model="form.departmentId"/>
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="4">
                  <el-form-item label="申请日期" prop="applyBillDate" label-width="100px">
                    <el-date-picker clearable
                                    v-model="form.applyBillDate"
                                    type="date"
                                    class="d-apply-form-input"
                                    value-format="yyyy-MM-dd"
                                    :disabled="true"
                                    placeholder="请选择申请日期">
                    </el-date-picker>
                  </el-form-item>
                </el-col>

                <el-col :span="4">
                  <el-form-item label="操作人" prop="userId" label-width="100px">
                    <div class="d-apply-form-input">
                      <SelectUser v-model="form.userId"/>
                    </div>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="备注" prop="remark" label-width="100px">
                    <el-input v-model="form.remark" placeholder="备注" class="d-apply-form-input" />
                  </el-form-item>
                </el-col>
              </el-row>
              </div>

<!--        <el-divider content-position="center">科室申领明细信息</el-divider>-->
              <el-row :gutter="10" class="mb8">
                <el-col :span="1.5">
                  <span>科室申领明细信息</span>
                </el-col>

                <div v-show="action">
                  <el-col :span="1.5">
<!--              <el-button type="primary" icon="el-icon-plus" size="small" @click="handleAddBasApplyEntry">添加</el-button>-->
                    <el-button type="primary" icon="el-icon-plus" size="medium" @click="nameBtn">添加</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button type="danger" icon="el-icon-delete" size="medium" @click="handleDeleteBasApplyEntry">删除</el-button>
                  </el-col>
                  <el-col :span="1.5" v-show="action">
                    <el-button size="medium" @click="cancel">取 消</el-button>
                  </el-col>
                  <el-col :span="1.5" v-show="action">
                    <el-button type="primary" size="medium" @click="submitForm">保 存</el-button>
                  </el-col>
                  <el-col :span="1.5" v-show="action">
                    <el-button type="success" size="medium" @click="handleRefTemplate">引用模板</el-button>
                  </el-col>
                </div>
              </el-row>
              <div class="table-wrapper">
              <el-table :data="basApplyEntryList" :row-class-name="rowBasApplyEntryIndex" @selection-change="handleBasApplyEntrySelectionChange" ref="basApplyEntry" height="100%" border :summary-method="getSummaries" show-summary>
                <el-table-column type="selection" width="50" align="center" resizable />
                <el-table-column label="序号" align="center" prop="index" width="60" show-overflow-tooltip resizable/>
                <el-table-column label="名称" align="center" prop="material.name" width="140" show-overflow-tooltip resizable/>
                <el-table-column label="规格" align="center" prop="material.speci" width="120" show-overflow-tooltip resizable/>
                <el-table-column label="型号" align="center" prop="material.name" width="140" show-overflow-tooltip resizable/>
                <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="80" show-overflow-tooltip resizable/>
                <el-table-column label="单价" prop="unitPrice" width="90" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.unitPrice || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="数量" prop="qty" width="90" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <el-input clearable v-model="scope.row.qty" placeholder="数量"
                              onkeyup="value=value.replace(/\D/g,'')"
                              onafterpaste="value=value.replace(/\D/g,'')"
                              @blur="form.result=$event.target.value"
                              @input="qtyChange(scope.row)"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.amt || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="140" show-overflow-tooltip resizable/>
                <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="120" show-overflow-tooltip resizable/>
                <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="120" show-overflow-tooltip resizable/>
                <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="120" show-overflow-tooltip resizable/>
                <el-table-column label="注册证号" align="center" prop="material.registerNo" width="120" show-overflow-tooltip resizable/>
                <el-table-column label="储存方式" align="center" prop="material.isWay" width="100" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <dict-tag :options="dict.type.way_status" :value="scope.row.material.isWay"/>
                  </template>
                </el-table-column>

                <el-table-column label="备注" prop="remark" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <el-input v-model="scope.row.remark" placeholder="备注" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" align="center" width="100" fixed="right">
                  <template slot-scope="scope">
                    <el-button
                      size="small"
                      type="text"
                      icon="el-icon-delete"
                      @click="handleDeleteDetailRow(scope.$index)"
                      style="padding: 0 5px; margin: 0;"
                    >删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              </div>
            </el-form>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 引用模板弹窗：制单模板（非打印设置），上搜索+左模板名列表+右明细 -->
    <transition name="modal-fade">
      <div v-if="templateDialogVisible" class="local-modal-mask template-dialog-mask" @click.self="closeTemplateDialog">
        <transition name="modal-zoom">
          <div v-if="templateDialogVisible" class="local-modal-content template-dialog-content">
            <div class="modal-header">
              <div class="modal-title">引用模板</div>
              <el-button size="small" @click="closeTemplateDialog" class="close-btn">关闭</el-button>
            </div>
            <div class="template-dialog-body">
              <p class="template-dialog-tip">请选择要引用的制单模板，将把该模板的明细耗材应用到当前申领单。（制单模板需在系统中单独创建，与打印设置无关。）</p>
              <!-- 上部分：按模板名称搜索 -->
              <div class="template-search-row">
                <el-input
                  v-model="templateNameSearch"
                  placeholder="按模板名称搜索"
                  clearable
                  class="template-search-input"
                  @keyup.enter.native="loadTemplateList"
                />
                <el-button type="primary" size="small" icon="el-icon-search" @click="loadTemplateList">搜索</el-button>
              </div>
              <!-- 下部分：左模板名称列表 + 右明细 -->
              <div class="template-split-layout">
                <div class="template-list-box">
                  <div class="template-list-title">模板名称</div>
                  <div class="template-list-inner">
                    <div
                      v-for="item in printTemplateList"
                      :key="item.id"
                      :class="['template-list-item', { active: selectedTemplate && selectedTemplate.id === item.id }]"
                      @click="onSelectTemplate(item)"
                    >
                      {{ item.templateName }}
                    </div>
                    <div v-if="!printTemplateList || printTemplateList.length === 0" class="template-list-empty">暂无制单模板</div>
                  </div>
                </div>
                <div class="template-detail-box">
                  <div class="template-list-title">模板明细</div>
                  <div class="template-detail-inner">
                    <el-table :data="templateDetailList" border stripe max-height="100%" size="small">
                      <el-table-column type="index" label="序号" width="50" align="center" />
                      <el-table-column prop="materialCode" label="耗材编码" min-width="100" show-overflow-tooltip>
                        <template slot-scope="scope">
                          {{ scope.row.material && scope.row.material.code ? scope.row.material.code : '—' }}
                        </template>
                      </el-table-column>
                      <el-table-column prop="materialName" label="名称" min-width="120" show-overflow-tooltip>
                        <template slot-scope="scope">
                          {{ scope.row.material && scope.row.material.name ? scope.row.material.name : '—' }}
                        </template>
                      </el-table-column>
                      <el-table-column prop="materialSpeci" label="规格" width="100" show-overflow-tooltip>
                        <template slot-scope="scope">
                          {{ scope.row.material && scope.row.material.speci ? scope.row.material.speci : '—' }}
                        </template>
                      </el-table-column>
                      <el-table-column prop="qty" label="数量" width="80" align="center" />
                    </el-table>
                    <div v-if="!selectedTemplate" class="template-detail-empty">请从左侧选择模板</div>
                    <div v-else-if="!templateDetailList || templateDetailList.length === 0" class="template-detail-empty">该模板暂无明细</div>
                  </div>
                  <div class="template-dialog-footer">
                    <el-button @click="closeTemplateDialog">取 消</el-button>
                    <el-button type="primary" :disabled="!selectedTemplate" @click="confirmRefTemplate">引 用</el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 3、使用组件 -->
    <SelectInventory
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :warehouseValue="warehouseValue"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectInventory>

  </div>
</template>

<script>
import { listApply, getApply, delApply, addApply, updateApply } from "@/api/department/apply";
import { listApplyTemplate, getApplyTemplate } from "@/api/department/applyTemplate";
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';

export default {
  name: "dApply",
  dicts: ['biz_status','way_status'],
  components: {SelectWarehouse,SelectDepartment,SelectUser},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      warehouseValue: "",
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedBasApplyEntry: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 科室申领表格数据
      applyList: [],
      selectRow: [],
      // 科室申领明细表格数据
      basApplyEntryList: [],
      // 合计数量
      totalQty: 0,
      // 合计金额
      totalAmount: 0,
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 引用模板弹窗（制单模板，非打印设置）
      templateDialogVisible: false,
      templateNameSearch: '',
      printTemplateList: [],
      selectedTemplate: null,
      templateDetailList: [],
      /** 引用模板后的列配置（供打印等使用） */
      columnList: [],
      //是否显示
      action: true,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        applyBillNo: null,
        beginDate: null,
        endDate: null,
        warehouseId: null,
        departmentId: null,
        userId: null,
        applyBillStatus: null,
        billType: 1, // 只查询申领单类型，排除转科申请（billType=3）
        orderByColumn: 'create_time',
        isAsc: 'desc',
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "blur" }
        ],
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询科室申领列表 */
    getList() {
      this.loading = true;
      // 确保只查询申领单类型（billType=1），排除转科申请（billType=3）
      const params = { ...this.queryParams };
      params.billType = 1;
      listApply(params).then(response => {
        // 前端二次过滤：确保只显示SL开头的单号，排除ZK开头的转科申请
        if (response.rows && response.rows.length > 0) {
          this.applyList = response.rows.filter(item => {
            const billNo = item.applyBillNo || '';
            // 只保留SL开头的申领单，排除ZK开头的转科申请
            return billNo.toUpperCase().startsWith('SL') && (item.billType === 1 || item.billType == null);
          });
          this.total = this.applyList.length;
        } else {
          this.applyList = [];
          this.total = 0;
        }
        this.loading = false;
      }).catch(() => {
        this.loading = false;
      });
    },
    nameBtn() {
      if(!this.form.warehouseId) {
        this.$message({ message: '请先选择仓库', type: 'warning' })
        return
      }
      //打开“弹窗组件”
      this.DialogComponentShow = true
      this.warehouseValue = this.form.warehouseId;
    },
    closeDialog() {
      //关闭“弹窗组件”
      this.DialogComponentShow = false
    },
    /** 打开引用模板弹窗（制单模板） */
    handleRefTemplate() {
      this.templateDialogVisible = true;
      this.templateNameSearch = '';
      this.printTemplateList = [];
      this.selectedTemplate = null;
      this.templateDetailList = [];
      this.loadTemplateList();
    },
    /** 按模板名称加载制单模板列表 */
    loadTemplateList() {
      listApplyTemplate({ templateName: this.templateNameSearch }).then(res => {
        this.printTemplateList = res.data || [];
        if (this.printTemplateList.length > 0 && !this.selectedTemplate) {
          this.onSelectTemplate(this.printTemplateList[0]);
        } else if (this.printTemplateList.length === 0) {
          this.selectedTemplate = null;
          this.templateDetailList = [];
        }
      }).catch(() => {
        this.printTemplateList = [];
      });
    },
    /** 选择左侧模板，加载明细 */
    onSelectTemplate(item) {
      this.selectedTemplate = item;
      getApplyTemplate(item.id).then(res => {
        const data = res.data || {};
        this.templateDetailList = data.entryList || [];
      }).catch(() => {
        this.templateDetailList = [];
      });
    },
    /** 关闭引用模板弹窗 */
    closeTemplateDialog() {
      this.templateDialogVisible = false;
      this.templateNameSearch = '';
      this.printTemplateList = [];
      this.selectedTemplate = null;
      this.templateDetailList = [];
    },
    /** 确认引用模板：将选中制单模板的明细应用到当前申领单 */
    confirmRefTemplate() {
      if (!this.selectedTemplate || !this.templateDetailList || this.templateDetailList.length === 0) {
        this.$message.warning('请选择有明细的制单模板');
        return;
      }
      this.templateDetailList.forEach(entry => {
        this.basApplyEntryList.push({
          materialId: entry.materialId,
          material: entry.material || {},
          qty: entry.qty || 1,
          unitPrice: null,
          price: null,
          amt: null,
          remark: null
        });
      });
      this.calculateTotals();
      this.$message.success('已应用制单模板明细');
      this.closeTemplateDialog();
    },
    selectData(val) {
      //监听“弹窗组件”返回的数据
      this.selectRow = val;

      this.selectRow.forEach((item, index) => {
        this.basApplyEntryList.splice(this.basApplyEntryList.length, 0, JSON.parse(JSON.stringify(item)));
      });
      this.calculateTotals();
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
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        applyBillDate: null,
        warehouseId: null,
        userId: null,
        applyBillStatus: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.basApplyEntryList = [];
      this.calculateTotals();
      this.resetForm("form");
    },
    //计算合计数量和金额
    calculateTotals() {
      let totalQty = 0;
      let totalAmount = 0;
      
      this.basApplyEntryList.forEach(item => {
        if (item.qty && !isNaN(item.qty)) {
          totalQty += parseFloat(item.qty);
        }
        if (item.amt && !isNaN(item.amt)) {
          totalAmount += parseFloat(item.amt);
        }
      });
      
      this.totalQty = totalQty;
      this.totalAmount = totalAmount;
    },
    // 表格合计方法
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 1) {
          sums[index] = '合计';
          return;
        }
        if (column.property === 'qty') {
          let totalQty = 0;
          data.forEach(item => {
            if (item.qty && !isNaN(item.qty)) {
              totalQty += parseFloat(item.qty);
            }
          });
          sums[index] = totalQty;
        } else if (column.property === 'amt') {
          let totalAmount = 0;
          data.forEach(item => {
            if (item.amt && !isNaN(item.amt)) {
              totalAmount += parseFloat(item.amt);
            }
          });
          sums[index] = '￥' + totalAmount.toFixed(2);
        } else {
          sums[index] = '';
        }
      });
      return sums;
    },
    
    //数量改变事件
    qtyChange(row){
      let totalAmt = 0;
      if(row.qty && row.unitPrice){
        totalAmt = row.qty * row.unitPrice;
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);
      this.calculateTotals();
    },
    //价格改变事件
    priceChange(row){
      let totalAmt = 0;
      if(row.qty && row.unitPrice){
        totalAmt = row.qty * row.unitPrice;
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);
      this.calculateTotals();
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.billType = 1; // 重置后仍只查询申领单类型
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
      getApply(id).then(response => {
        this.form = response.data;
        this.basApplyEntryList = response.data.basApplyEntryList;
        this.open = true;
        this.calculateTotals();
        this.action = false;

        if(response.data.applyBillStatus == 1){
          this.form.applyBillStatus = '1';
        }else{
          this.form.applyBillStatus = '2';
        }

        this.title = "查看科室申领";
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.form.applyBillStatus = '1';
      this.form.applyBillDate = this.getBillDate();
      this.title = "添加科室申领";
      this.action = true;
      var userName = this.$store.state.user.name;
      var userId = this.$store.state.user.userId;
      this.form.createBy = userId;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getApply(id).then(response => {
        this.form = response.data;
        this.basApplyEntryList = response.data.basApplyEntryList;
        this.open = true;
        this.calculateTotals();
        this.action = true;
        this.form.applyBillStatus = '1';
        this.title = "修改科室申领";
      });
    },
    /** 提交按钮 */
    submitForm() {
      // 验证仓库是否选择
      if (!this.form.warehouseId) {
        this.$modal.msgError("请先选择仓库");
        return;
      }
      
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.form.basApplyEntryList = this.basApplyEntryList;
          var totalAmt = 0;
          this.basApplyEntryList.forEach(item => {
            if(item.amt){
              totalAmt += parseFloat(item.amt);
            }
          });
          this.form.totalAmount = totalAmt.toFixed(2);
          if (this.form.id != null) {
            updateApply(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              // 保存成功后不关闭弹窗，允许继续修改
              // this.open = false;
              this.getList();
            });
          } else {
            addApply(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              // 保存成功后更新表单ID，后续保存将变为修改操作
              // 后端返回的response.data就是basApply对象，包含id和applyBillNo
              if (response && response.data) {
                if (response.data.id) {
                  this.form.id = response.data.id;
                }
                if (response.data.applyBillNo) {
                  this.form.applyBillNo = response.data.applyBillNo;
                }
                // 更新标题为修改模式
                this.title = "修改科室申领";
              }
              // 保存成功后不关闭弹窗，允许继续修改
              // this.open = false;
              this.getList();
            }).catch(error => {
              console.error("新增失败:", error);
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      const billNo = row.applyBillNo || '';
      this.$modal.confirm('你好！是否确认删除申领单，单号"' + billNo + '"的数据项？').then(function() {
        return delApply(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
	/** 科室申领明细序号 */
    rowBasApplyEntryIndex({ row, rowIndex }) {
    row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    rowApplyIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 科室申领明细添加按钮操作 */
    handleAddBasApplyEntry() {
      let obj = {};
      obj.materialId = "";
      obj.unitPrice = "";
      obj.qty = "";
      obj.amt = "";
      obj.batchNo = "";
      obj.batchNumer = "";
      obj.remark = "";
      this.basApplyEntryList.push(obj);
      this.calculateTotals();
    },
    /** 科室申领明细删除按钮操作 */
    handleDeleteBasApplyEntry() {
      if (this.checkedBasApplyEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的科室申领明细数据");
      } else {
        const basApplyEntryList = this.basApplyEntryList;
        const checkedBasApplyEntry = this.checkedBasApplyEntry;
        this.basApplyEntryList = basApplyEntryList.filter(function(item) {
          return checkedBasApplyEntry.indexOf(item.index) == -1
        });
        this.calculateTotals();
      }
    },
    /** 删除明细行 */
    handleDeleteDetailRow(index) {
      this.basApplyEntryList.splice(index, 1);
      this.calculateTotals();
    },
    /** 复选框选中数据 */
    handleBasApplyEntrySelectionChange(selection) {
      this.checkedBasApplyEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('department/apply/export', {
        ...this.queryParams
      }, `apply_${new Date().getTime()}.xlsx`)
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
  background: rgba(0,0,0,0.4);
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  min-height: 95vh !important;
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
  border: none;
  background: transparent;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
  text-align: right;
  flex-shrink: 0;
}

.modal-footer .el-button {
  margin-left: 10px;
}

.local-modal-content .el-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 24px;
}

/* 添加/修改科室申领弹窗：输入框容器距顶与左右各 6px，容器更宽 */
.local-modal-content .el-form.modal-form-wrapper {
  padding: 10px 6px 24px 6px;
}

.modal-form-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* 弹窗内表单字段容器：与顶部、上下间距 10px */
.local-modal-content .form-fields-container.d-apply-form-fields {
  padding-top: 8px;
  margin-bottom: 10px;
}

.local-modal-content .form-fields-container {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  border: 1px solid #EBEEF5;
  flex-shrink: 0;
}

/* 科室申领弹窗内输入框/选择框统一加宽 */
.local-modal-content .d-apply-form-input {
  width: 180px;
}

.local-modal-content .d-apply-form-input .el-input__inner {
  width: 100%;
}

/* 引用模板弹窗：贴顶、左右无留白、高度加倍 */
.template-dialog-mask {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 0;
}

.local-modal-content.template-dialog-content {
  min-height: 100vh !important;
  height: 100vh !important;
  max-width: none;
  width: 100%;
  max-height: 100vh !important;
  margin: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.template-dialog-body {
  padding: 16px 20px 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.template-dialog-tip {
  color: #606266;
  font-size: 13px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

/* 上部分：搜索框 */
.template-search-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.template-search-input {
  width: 260px;
}

/* 下部分：左列表 + 右明细，高度与弹窗加倍匹配 */
.template-split-layout {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
  max-height: 520px;
  overflow: hidden;
}

.template-list-box {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  overflow: hidden;
}

.template-list-title {
  padding: 4px 12px;
  background: #F5F7FA;
  font-weight: 600;
  font-size: 13px;
  color: #303133;
}

.template-list-inner {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  max-height: none;
}

.template-list-item {
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #EBEEF5;
  font-size: 13px;
}

.template-list-item:hover {
  background: #ECF5FF;
}

.template-list-item.active {
  background: #409EFF;
  color: #fff;
}

.template-list-empty {
  padding: 24px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}

.template-detail-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  overflow: hidden;
}

.template-detail-inner {
  flex: 1;
  overflow: auto;
  min-height: 0;
  max-height: none;
  padding: 4px 8px;
}

.template-detail-empty {
  padding: 24px;
  text-align: center;
  color: #909399;
  font-size: 13px;
}

.template-dialog-footer {
  padding: 10px 12px;
  border-top: 1px solid #EBEEF5;
  text-align: right;
  flex-shrink: 0;
}

.local-modal-content .mb8 {
  flex-shrink: 0;
  margin-bottom: 10px;
}

.local-modal-content .table-wrapper {
  flex: 1;
  overflow: hidden;
  min-height: 0;
  height: 0;
}

.local-modal-content .table-wrapper .el-table {
  height: 100% !important;
}

::v-deep .local-modal-content .table-wrapper .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
  max-height: calc(100vh - 450px) !important;
}

/* 防止表格列自动换行 */
::v-deep .local-modal-content .table-wrapper .el-table .el-table__cell {
  white-space: nowrap !important;
  overflow: hidden !important;
}

::v-deep .local-modal-content .table-wrapper .el-table .cell {
  white-space: nowrap !important;
  overflow: hidden !important;
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

/* 表格样式优化 */
.el-table {
  border-radius: 4px;
  overflow: hidden;
}

.el-table th {
  background-color: #EBEEF5 !important;
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
  padding: 16px 24px 2px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-top: -2px;
  margin-bottom: 6px;
  border: 1px solid #EBEEF5;
}

.query-row-left {
  margin-bottom: 0px;
  margin-top: 0px;
}

.query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 8px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-select-wrapper {
  width: 180px;
}

.query-row-second {
  margin-bottom: 0px;
  margin-top: 0px;
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

/* 按钮行样式：上移一点，与明细框距离保持 8px */
.mb8 {
  margin-top: 0 !important;
  margin-bottom: 8px !important;
}

/* 翻页底部不留空白 */
.d-apply-page .pagination-bottom-wrap {
  margin-bottom: 0;
  padding-bottom: 0;
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

/* 确保操作列固定 */
::v-deep .el-table__fixed-right {
  right: 0 !important;
  z-index: 12 !important;
}

::v-deep .el-table__fixed-header-wrapper {
  z-index: 11;
}

::v-deep .el-table__fixed-right-patch {
  right: 0 !important;
  z-index: 12 !important;
}

/* 确保固定列头部和主体都有正确的z-index */
::v-deep .el-table__fixed-right .el-table__header-wrapper {
  z-index: 12 !important;
}

::v-deep .el-table__fixed-right .el-table__body-wrapper {
  z-index: 12 !important;
}

/* 确保固定列在滚动时保持固定 */
::v-deep .el-table__fixed {
  position: absolute !important;
}

::v-deep .el-table__fixed-right {
  position: absolute !important;
  right: 0 !important;
}

/* 确保表格可以水平滚动 */
::v-deep .el-table {
  overflow-x: auto;
}

/* 确保明细表格可以水平滚动 */
::v-deep .local-modal-content .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
}
</style>

<style>
/* 与到货验收页面布局样式保持一致（非 scoped 确保生效） */
.app-container.d-apply-page {
  padding-top: 10px !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
  padding-bottom: 0px !important;
}

.app-container.d-apply-page > .el-table th {
  background-color: #EBEEF5 !important;
  color: #606266;
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.d-apply-page > .el-table th .cell {
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
}
</style>
