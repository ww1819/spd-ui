<template>
  <div class="app-container gzOrder-follow-page">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form query-form-compact">

      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item prop="orderNo" class="query-item-inline">
            <el-input v-model="queryParams.orderNo"
                      placeholder="跟台单号"
                      clearable
                      style="width: 180px"
                      @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item prop="supplerId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectSupplier v-model="queryParams.supplerId"/>
            </div>
          </el-form-item>
          <el-form-item prop="warehouseId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectWarehouse v-model="queryParams.warehouseId" includeWarehouseType="高值"/>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="query-row-second">
        <el-col :span="18">
          <el-form-item style="display: flex; align-items: center;">
            <el-select v-model="queryParams.timeField" placeholder="时间字段" clearable style="width: 140px; margin-right: 8px;">
              <el-option label="制单时间" value="createTime" />
              <el-option label="审核时间" value="auditDate" />
            </el-select>
            <el-date-picker
              v-model="queryParams.beginDate"
              type="datetime"
              value-format="yyyy-MM-dd HH:mm:ss"
              placeholder="起始日期"
              clearable
              style="width: 200px; margin-right: 8px;"
            />
            <span style="margin: 0 4px;">至</span>
            <el-date-picker
              v-model="queryParams.endDate"
              type="datetime"
              value-format="yyyy-MM-dd HH:mm:ss"
              placeholder="截止日期"
              clearable
              style="width: 200px; margin-left: 8px;"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6" class="query-status-col">
          <el-form-item prop="orderStatus" class="query-item-status-aligned">
            <el-select v-model="queryParams.orderStatus" placeholder="单据状态"
                       clearable style="width: 150px">
              <el-option label="未审核" value="1" />
              <el-option label="已审核" value="2" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

    </el-form>

    <el-row :gutter="10" class="mb8 button-row-compact">
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="small"
          @click="handleQuery"
        >搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="small"
          @click="resetQuery"
        >重置</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="small"
          @click="handleAdd"
          v-hasPermi="['gzOrder:follow:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="small"
          @click="handleExport"
          v-hasPermi="['gzOrder:follow:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="small"
          :disabled="multiple"
          @click="handleAudit"
          v-hasPermi="['gzOrder:follow:audit']"
        >审核</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="orderList" class="table-compact"
              :row-class-name="orderListIndex"
              @selection-change="handleSelectionChange" height="calc(100vh - 340px)" border stripe>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="跟台单号" align="center" prop="orderNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.orderNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="supplier.name" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="跟台日期" align="center" prop="orderDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.orderDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" show-overflow-tooltip resizable />
      <el-table-column label="单据状态" align="center" prop="orderStatus" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.orderStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="操作人" align="center" prop="createBy" show-overflow-tooltip resizable />
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <template v-if="scope.row.orderStatus == '2' || scope.row.orderStatus == 2">
            <el-button
              size="small"
              type="text"
              @click="handleView(scope.row)"
            >查看</el-button>
            <el-button
              size="small"
              type="text"
              @click="handlePrintBarcode(scope.row)"
            >打印条码</el-button>
          </template>
          <template v-else>
          <el-button
            size="small"
            type="text"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['gzOrder:follow:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            @click="handleDelete(scope.row)"
            v-hasPermi="['gzOrder:follow:remove']"
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

    <!-- 添加或修改跟台管理对话框（顶栏 + 明细区与到货验收新增弹窗一致） -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact">

              <div class="form-fields-container">
              <el-row :gutter="8">
                <el-col :span="4">
                  <el-form-item label="跟台单号" prop="orderNo">
                    <el-input v-model="form.orderNo" :disabled="true" style="width: 140px" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="供应商" prop="supplerId">
                    <SelectSupplier v-model="form.supplerId" :value2="gzOrderEntryList.length > 0"/>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="仓库" prop="warehouseId">
                    <SelectWarehouse v-model="form.warehouseId" :value2="gzOrderEntryList.length > 0" includeWarehouseType="高值"/>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="制单人" prop="createBy">
                    <el-input v-model="form.creatorName" :disabled="true" style="width: 140px" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="制单日期" prop="orderDate">
                    <el-date-picker clearable
                                    v-model="form.orderDate"
                                    type="date"
                                    :disabled="true"
                                    value-format="yyyy-MM-dd"
                                    style="width: 140px"
                                    placeholder="请选择制单日期">
                    </el-date-picker>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="审核人" prop="auditBy">
                    <el-input v-model="form.auditorName" :disabled="true" style="width: 140px" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="8">
                <el-col :span="4">
                  <el-form-item label="UDI码" prop="ztm">
                    <el-input v-model="form.ztm"
                              placeholder="请扫描UDI码"
                              clearable
                              style="width: 140px"
                              @keyup.enter.native="sm"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="辅条码" prop="ftm">
                    <el-input v-model="form.ftm"
                              placeholder="请扫描辅条码"
                              clearable
                              style="width: 140px"
                              @keyup.enter.native="sm2"
                    />
                  </el-form-item>
                </el-col>
              </el-row>
              </div>

              <div class="modal-detail-section">
              <el-row :gutter="10" type="flex" align="middle" class="detail-toolbar-row">
                <el-col :span="1.5">
                  <span>跟台明细信息</span>
                </el-col>
                <template v-if="action">
                  <el-col :span="1.5">
                    <el-button type="primary" icon="el-icon-plus" size="small" @click="checkMaterialBtn" :disabled="!form.warehouseId || !form.supplerId">添加</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteGzOrderEntry">删除</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button size="small" @click="cancel">取 消</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button type="primary" size="small" @click="submitForm">确 定</el-button>
                  </el-col>
                </template>
                <el-col :span="1.5">
                  <el-button size="small" icon="el-icon-document" @click="openEntryChangeLog">变更记录</el-button>
                </el-col>
              </el-row>
              <div class="table-wrapper">
                <el-table :data="pagedGzOrderEntryList" :row-class-name="rowGzOrderEntryIndex"
                          @selection-change="handleGzOrderEntrySelectionChange"
                          ref="gzOrderEntry"
                          border
                          :height="detailTableHeight">
                  <el-table-column type="selection" width="60" align="center" fixed="left" />
                  <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
                  <el-table-column label="耗材" prop="materialName" width="120" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.materialName }}
                    </template>
                  </el-table-column>
                  <el-table-column label="数量" prop="qty" width="120" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-input clearable v-model="scope.row.qty" placeholder="数量"
                                onkeyup="value=value.replace(/\D/g,'')"
                                onafterpaste="value=value.replace(/\D/g,'')"
                                @blur="form.result=$event.target.value"
                                @input="qtyChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="价格" prop="price" width="120" show-overflow-tooltip resizable align="right">
                    <template slot-scope="scope">
                      {{ scope.row.price ? parseFloat(scope.row.price).toFixed(2) : '0.00' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable align="right">
                    <template slot-scope="scope">
                      {{ scope.row.amt || '0.00' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="批号" prop="batchNumber" width="200" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.batchNumber" placeholder="批号" />
                    </template>
                  </el-table-column>
                  <el-table-column label="生产日期" prop="beginTime" width="180" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-date-picker clearable
                                      v-model="scope.row.beginTime"
                                      type="date"
                                      value-format="yyyy-MM-dd"
                                      :picker-options="pickerBeginTimeOptions"
                                      placeholder="请选择生产日期">
                      </el-date-picker>
                    </template>
                  </el-table-column>
                  <el-table-column label="有效期" prop="endTime" width="180" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-date-picker clearable
                                      v-model="scope.row.endTime"
                                      type="date"
                                      value-format="yyyy-MM-dd"
                                      :picker-options="pickerEndTimeOptions"
                                      placeholder="请选择有效期">
                      </el-date-picker>
                    </template>
                  </el-table-column>
                  <el-table-column label="UDI码" prop="masterBarcode" width="240" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.masterBarcode" :disabled="true" placeholder="UDI码" />
                    </template>
                  </el-table-column>
                  <el-table-column label="辅条码" prop="secondaryBarcode" width="240" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.secondaryBarcode" :disabled="true" placeholder="辅条码" />
                    </template>
                  </el-table-column>
                  <el-table-column label="批次号" prop="batchNo" width="200" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.batchNo" :disabled="true" placeholder="批次号" />
                    </template>
                  </el-table-column>
                  <el-table-column label="备注" prop="remark" width="200" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.remark" placeholder="备注" />
                    </template>
                  </el-table-column>
                </el-table>
              </div>
                <pagination
                  class="modal-entry-pagination"
                  :total="gzOrderEntryList.length"
                  :page.sync="entryPageNum"
                  :limit.sync="entryPageSize"
                  :hide-on-single-page="false"
                  @pagination="handleEntryPagination"
                />
              </div>
            </el-form>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 3、使用组件 -->
    <SelectGZMaterialFilter
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :supplierValue="supplierValue"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectGZMaterialFilter>

    <el-dialog
      title="明细变更记录"
      :visible.sync="entryChangeLogDialog.visible"
      width="1000px"
    >
      <el-table v-loading="entryChangeLogDialog.loading" :data="entryChangeLogDialog.rows" border size="small" max-height="460">
        <el-table-column label="变更时间" min-width="160" align="center">
          <template slot-scope="scope">
            {{ parseTime(scope.row.changeTime, '{y}-{m}-{d} {h}:{i}:{s}') || '--' }}
          </template>
        </el-table-column>
        <el-table-column prop="actionType" label="动作" width="90" align="center" />
        <el-table-column prop="entryId" label="明细ID" width="90" align="center" />
        <el-table-column prop="operator" label="操作人" width="120" align="center" show-overflow-tooltip />
        <el-table-column label="变更前" min-width="260">
          <template slot-scope="scope">
            <span>{{ jsonPreview(scope.row.beforeJson) }}</span>
            <el-button v-if="scope.row.beforeJson" type="text" size="mini" @click="showJsonDetail('变更前', scope.row.beforeJson)">查看</el-button>
          </template>
        </el-table-column>
        <el-table-column label="变更后" min-width="260">
          <template slot-scope="scope">
            <span>{{ jsonPreview(scope.row.afterJson) }}</span>
            <el-button v-if="scope.row.afterJson" type="text" size="mini" @click="showJsonDetail('变更后', scope.row.afterJson)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="entryChangeLogDialog.visible = false">关 闭</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="jsonViewer.title" :visible.sync="jsonViewer.visible" width="860px">
      <pre class="json-viewer-pre">{{ jsonViewer.content }}</pre>
      <span slot="footer" class="dialog-footer">
        <el-button @click="jsonViewer.visible = false">关 闭</el-button>
      </span>
    </el-dialog>

  </div>
</template>

<script>
import { listOrder, getOrder, delOrder, addOrder, updateOrder, auditOrder, listEntryChangeLog } from "@/api/gz/order";
import { listDepotInventory } from "@/api/gz/depotInventory";
import { listMaterial,jxFtm,jxTm} from "@/api/foundation/material";
import { listUserAll } from "@/api/system/user";
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import SelectGZMaterialFilter from '@/components/SelectModel/SelectGZMaterialFilter';

export default {
  name: "Follow",
  dicts: ['biz_status','bill_type','is_yes_no'],
  components: {SelectSupplier,SelectMaterial,SelectWarehouse,SelectGZMaterialFilter},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      supplierValue: "",
      isShow: true,
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedGzOrderEntry: [],
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
      // 跟台管理表格数据
      orderList: [],
      // 高值退货明细表格数据
      gzOrderEntryList: [],
      /** 弹窗内明细表分页（与到货验收弹窗底部翻页一致展示） */
      entryPageNum: 1,
      entryPageSize: 10,
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
        orderNo: null,
        supplerId: null,
        warehouseId: null,
        orderStatus: null,
        orderType: null,
        timeField: "createTime",
        auditDate: null,
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
      },
      // 表单参数
      form: {},
      // 用户列表
      userOptions: [],
      // 表单校验
      rules: {
        supplerId: [
          { required: true, message: "供应商不能为空", trigger: "blur" }
        ],
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "blur" }
        ],
      },
      entryChangeLogDialog: {
        visible: false,
        loading: false,
        rows: []
      },
      jsonViewer: {
        visible: false,
        title: '',
        content: ''
      }
    };
  },
  computed: {
    /** 明细表占剩余高度但封顶，避免挤掉底部分页与工具栏按钮 */
    detailTableHeight() {
      return "clamp(220px, calc(100vh - 440px), 560px)";
    },
    pagedGzOrderEntryList() {
      const start = (this.entryPageNum - 1) * this.entryPageSize;
      return this.gzOrderEntryList.slice(start, start + this.entryPageSize);
    }
  },
  watch: {
    gzOrderEntryList: {
      handler(list) {
        const len = list ? list.length : 0;
        const maxPage = Math.max(1, Math.ceil(len / this.entryPageSize) || 1);
        if (this.entryPageNum > maxPage) {
          this.entryPageNum = maxPage;
        }
      },
      deep: true
    }
  },
  created() {
    // 跟台管理：不设置特定 orderType，通过过滤单号前缀来区分
    // 过滤掉入库单（GZRK）和出库单（GZCK），只显示跟台单
    this.getList();
    this.getUserList();
  },
  methods: {
    orderListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 查询跟台管理列表 */
    sm(){
      const obj=jxTm(this.form.ztm);
      const tmh=obj.ztm;
      const ph=obj.ph;
      const yxq=obj.yxq;
      const ftm=obj.ftm;
      const scrq=obj.scrq;
      const udiinfo={
          "udiNo":this.form.ztm
      }
      listMaterial(udiinfo).then(response => {
        response.rows.forEach((item, index) => {
          let obj = {};
          obj.materialId = item.id;
          obj.materialName = item.name || ""; // 保存耗材名称
          obj.qty = "";
          obj.price = item.price;
          obj.amt = "";
          obj.batchNo = "";
          obj.batchNumber = "";
          obj.beginTime = "";
          obj.endTime = "";
          obj.remark = "";
          obj.masterBarcode = item.udiNo;
          obj.secondaryBarcode = "";
          obj.udiNo = item.udiNo || ""; // 保存UDI码
          obj.supplierId = this.form.supplerId || item.supplierId || (item.supplier && item.supplier.id) || null;
          this.gzOrderEntryList.push(obj);
        });
        this.entryPageNum = Math.max(1, Math.ceil(this.gzOrderEntryList.length / this.entryPageSize));
      });
    }
    ,sm2(){
      const length = this.checkedGzOrderEntry.length
      if (length < 1){
        this.$modal.msgError("请先选择明细数据");
      } else {
        const obj=jxFtm(this.form.ftm);
        for (let i = 0; i < length; i++) {
          const idx = this.checkedGzOrderEntry[i] - 1;
          if (idx >= 0 && idx < this.gzOrderEntryList.length) {
            this.gzOrderEntryList[idx].batchNo = obj.batchNo;
            this.gzOrderEntryList[idx].secondaryBarcode = obj.ftm;
            this.gzOrderEntryList[idx].endTime = obj.yxq;
          }
        }
      }
    }
    ,getList() {
      this.loading = true;
      // 跟台管理：不设置特定 orderType，查询所有订单后通过单号前缀过滤
      // 过滤掉所有GZ开头的单号（GZRK入库、GZCK出库、GZTK退库、备货退货等），只显示GT开头的跟台单
      const params = this.normalizeQueryDateTime(this.queryParams);
      listOrder(params).then(response => {
        // 过滤掉所有GZ开头的单号，只保留GT开头的跟台单
        const filteredRows = response.rows.filter(row => {
          const orderNo = row.orderNo || '';
          // 只显示GT开头的跟台单号，过滤掉所有GZ开头的单号
          return orderNo.startsWith('GT');
        });
        this.orderList = filteredRows;
        this.total = filteredRows.length;
        this.loading = false;
      });
    },
    checkMaterialBtn() {
      if(!this.form.supplerId) {
        this.$message({ message: '请先选择供应商', type: 'warning' })
        return
      }

      //打开“弹窗组件”
      this.DialogComponentShow = true
      this.supplierValue = this.form.supplerId;
    },
    closeDialog() {
      //关闭“弹窗组件”
      this.DialogComponentShow = false
    },
    selectData(val) {
      //监听"弹窗组件"返回的数据
      this.selectRow = val;
      this.selectRow.forEach((item, index) => {
        let obj = {};
        obj.materialId = item.id;
        obj.materialName = item.name || ""; // 保存耗材名称
        obj.qty = "1"; // 默认数量为1
        // 设置价格：优先使用item.price
        obj.price = item.price || 0;
        // 自动计算金额：数量 * 价格
        obj.amt = (obj.qty && obj.price) ? (parseFloat(obj.qty) * parseFloat(obj.price)).toFixed(2) : "0.00";
        obj.batchNo = "";
        obj.batchNumber = "";
        obj.beginTime = "";
        obj.endTime = "";
        obj.remark = "";
        obj.masterBarcode = item.udiNo || ""; // UDI码赋值给masterBarcode字段用于显示
        obj.secondaryBarcode = "";
        obj.udiNo = item.udiNo || ""; // 保存UDI码
        this.gzOrderEntryList.push(obj);
      });
      this.entryPageNum = Math.max(1, Math.ceil(this.gzOrderEntryList.length / this.entryPageSize));
    },
    //当天日期
    getOrderDate(){
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
        orderNo: null,
        supplerId: null,
        orderDate: null,
        warehouseId: null,
        orderStatus: null,
        orderType: null,
        delFlag: null,
        auditDate: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null,
        masterBarcode: null,
        secondaryBarcode: null,
        isFollowFlag: null

      };
      this.gzOrderEntryList = [];
      this.entryPageNum = 1;
      this.entryPageSize = 10;
      this.resetForm("form");
    },
    //数量改变事件
    qtyChange(row){
      let totalAmt = 0;
      if(row.qty && row.price){
        totalAmt = row.qty * row.price;
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);
    },
    //价格改变事件
    priceChange(row){
      let totalAmt = 0;
      if(row.qty && row.price){
        totalAmt = row.qty * row.price;
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
      this.queryParams.timeField = "createTime";
      this.queryParams.orderStatus = null;
      // 跟台管理：重置后不设置特定 orderType
      this.queryParams.orderType = null;
      this.handleQuery();
    },
    normalizeQueryDateTime(query) {
      const params = { ...query };
      params.timeField = params.timeField || "createTime";
      params.beginDate = this.normalizeDateTimeValue(params.beginDate, false);
      params.endDate = this.normalizeDateTimeValue(params.endDate, true);
      return params;
    },
    normalizeDateTimeValue(value, isEnd) {
      if (!value) return value;
      if (typeof value !== "string") return value;
      const trimVal = value.trim();
      if (!trimVal) return trimVal;
      if (trimVal.length === 10 && trimVal.indexOf(" ") === -1) {
        return `${trimVal} ${isEnd ? "23:59:59" : "00:00:00"}`;
      }
      return trimVal;
    },
    resolveBillTypeByOrderType() {
      const orderType = String(this.form.orderType || '401');
      if (orderType === '102') return 'GZ_SHIPMENT';
      if (orderType === '103') return 'GZ_REFUND_DEPOT';
      if (orderType === '104') return 'GZ_REFUND_GOODS';
      return 'GZ_ORDER';
    },
    openEntryChangeLog() {
      if (!this.form.id) {
        this.$modal.msgWarning('请先保存单据后再查看变更记录');
        return;
      }
      this.entryChangeLogDialog.visible = true;
      this.entryChangeLogDialog.loading = true;
      this.entryChangeLogDialog.rows = [];
      listEntryChangeLog(this.resolveBillTypeByOrderType(), this.form.id).then((res) => {
        this.entryChangeLogDialog.rows = res.data || [];
      }).finally(() => {
        this.entryChangeLogDialog.loading = false;
      });
    },
    jsonPreview(jsonText) {
      if (!jsonText) return '--';
      const pretty = this.prettyJson(jsonText);
      return pretty.length > 60 ? `${pretty.slice(0, 60)}...` : pretty;
    },
    prettyJson(jsonText) {
      if (!jsonText) return '';
      try {
        return JSON.stringify(JSON.parse(jsonText), null, 2);
      } catch (e) {
        return String(jsonText);
      }
    },
    showJsonDetail(title, jsonText) {
      this.jsonViewer.title = title;
      this.jsonViewer.content = this.prettyJson(jsonText) || '--';
      this.jsonViewer.visible = true;
    },
    getStatDate(){
      let myDate = new Date();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let statDate = myDate.getFullYear().toString() + "-"  + month + "-" + "01 00:00:00"; //月初
      return statDate;
    },
    getEndDate(){
      let myDate = new Date();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let dayEnd = new Date(myDate.getFullYear(), month, 0).getDate(); //获取当月一共有多少天
      let endDate = myDate.getFullYear().toString() + "-" + month  + "-" + dayEnd + " 23:59:59"; //月末
      return endDate;
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
      getOrder(id).then(response => {
        this.form = response.data;
        this.gzOrderEntryList = response.data.gzOrderEntryList || [];
        // 如果有materialList，为每个entry添加materialName
        if (response.data.materialList && response.data.materialList.length > 0) {
          const materialMap = {};
          response.data.materialList.forEach(material => {
            materialMap[material.id] = material.name;
          });
          this.gzOrderEntryList.forEach(entry => {
            if (entry.materialId && materialMap[entry.materialId]) {
              entry.materialName = materialMap[entry.materialId];
            }
            // 确保masterBarcode有值，优先使用masterBarcode，其次使用udiNo
            if (!entry.masterBarcode && entry.udiNo) {
              entry.masterBarcode = entry.udiNo;
            }
          });
        } else {
          // 即使没有materialList，也要确保masterBarcode有值
          this.gzOrderEntryList.forEach(entry => {
            if (!entry.masterBarcode && entry.udiNo) {
              entry.masterBarcode = entry.udiNo;
        }
          });
        }
        // 设置制单人和审核人姓名
        this.form.creatorName = this.getCreatorName(this.form);
        this.form.auditorName = this.getAuditorName(this.form);
        this.entryPageNum = 1;
        this.open = true;
        this.action = false;
        this.form.orderStatus = '1';
        this.form.orderType = '401'; // 跟台类型
        this.title = "查看跟台管理";
      });
    },
    /** 获取用户列表 */
    getUserList() {
      listUserAll().then(response => {
        this.userOptions = response || [];
      });
    },
    /** 获取制单人姓名 */
    getCreatorName(row) {
      if (row.createBy) {
        const user = this.userOptions.find(u => u.userName === row.createBy || u.userId === row.createBy);
        return user ? (user.nickName || user.userName) : row.createBy;
      }
      return '';
    },
    /** 获取审核人姓名 */
    getAuditorName(row) {
      if (row.updateBy) {
        // 审核人通常是updateBy（审核操作时更新）
        const user = this.userOptions.find(u => {
          return u.userName === row.updateBy || 
                 u.userId === row.updateBy ||
                 u.userId == row.updateBy ||
                 String(u.userId) === String(row.updateBy);
        });
        if (user) {
          return user.nickName || user.userName;
        }
        // 如果updateBy不是纯数字，可能是姓名，直接返回
        if (!/^\d+$/.test(String(row.updateBy))) {
          return row.updateBy;
        }
        return row.updateBy;
      }
      return '';
    },
    /** 打印条码按钮操作 */
    handlePrintBarcode(row) {
      const id = row.id;
      getOrder(id).then(response => {
        const orderData = response.data;
        const entryList = orderData.gzOrderEntryList || [];
        const materialList = orderData.materialList || [];
        const warehouseId = orderData.warehouseId;
        
        if (entryList.length === 0) {
          this.$modal.msgWarning("该订单没有明细数据，无法打印条码");
          return;
        }
        
        if (!warehouseId) {
          this.$modal.msgWarning("该订单没有仓库信息，无法打印条码");
          return;
        }
        
        // 构建物料映射
        const materialMap = {};
        materialList.forEach(material => {
          materialMap[material.id] = material;
        });
        
        // 查询库存信息，获取所有院内码
        // 通过订单号过滤，确保只获取该订单生成的库存记录
        const queryParams = {
          warehouseId: warehouseId,
          orderNo: orderData.orderNo, // 添加订单号过滤
          includeZeroQty: true, // 库存为 0 仍可补打条码
          pageNum: 1,
          pageSize: 10000
        };
        
        console.log('查询库存参数:', queryParams);
        
        listDepotInventory(queryParams).then(invResponse => {
          const inventoryList = invResponse.rows || [];
          
          console.log('查询到的库存列表:', inventoryList);
          console.log('订单明细列表:', entryList);
          
          // 构建批次号和物料ID组合键到院内码列表的映射
          // 因为同一个批次号可能对应不同的物料，所以需要同时匹配批次号和物料ID
          const keyToInHospitalCodes = {};
          inventoryList.forEach(inv => {
            if (inv.batchNo && inv.inHospitalCode && inv.materialId) {
              // 使用批次号+物料ID作为键，确保精确匹配
              const key = `${inv.batchNo}_${inv.materialId}`;
              if (!keyToInHospitalCodes[key]) {
                keyToInHospitalCodes[key] = [];
              }
              keyToInHospitalCodes[key].push(inv.inHospitalCode);
            }
          });
          
          console.log('构建的院内码映射:', keyToInHospitalCodes);
          
          // 收集所有需要打印的条码数据
          const allBarcodesToPrint = [];
          entryList.forEach((item, entryIndex) => {
            const material = materialMap[item.materialId] || {};
            const batchNo = item.batchNo;
            const materialId = item.materialId;
            const qty = parseInt(item.qty) || 0;
            
            console.log(`明细项 ${entryIndex + 1}:`, {
              batchNo: batchNo,
              materialId: materialId,
              qty: qty,
              item: item
            });
            
            // 使用批次号+物料ID作为键来获取院内码列表
            const key = `${batchNo}_${materialId}`;
            const inHospitalCodes = keyToInHospitalCodes[key] || [];
            
            console.log(`找到的院内码列表 (${key}):`, inHospitalCodes);
            
            // 根据数量生成条码，如果数量是10则生成10个条码
            const codesToPrint = inHospitalCodes.slice(0, qty);
            
            console.log(`需要打印的院内码数量: ${codesToPrint.length}, 明细数量: ${qty}`);
            
            if (codesToPrint.length === 0) {
              console.warn(`批次号 ${batchNo}, 物料ID ${materialId} 没有找到院内码，跳过打印`);
              this.$modal.msgWarning(`批次号 ${batchNo} 没有找到院内码，无法打印条码`);
              return;
            }
            
            if (codesToPrint.length < qty) {
              console.warn(`批次号 ${batchNo} 只找到 ${codesToPrint.length} 个院内码，但明细数量是 ${qty}`);
              this.$modal.msgWarning(`批次号 ${batchNo} 只找到 ${codesToPrint.length} 个院内码，但需要打印 ${qty} 个条码`);
            }
            
            // 为每个院内码收集打印数据
            codesToPrint.forEach((inHospitalCode, codeIndex) => {
              allBarcodesToPrint.push({
                inHospitalCode: inHospitalCode,
                item: item,
                material: material
              });
            });
          });
          
          console.log(`总共需要打印 ${allBarcodesToPrint.length} 个条码`);
          
          if (allBarcodesToPrint.length === 0) {
            this.$modal.msgWarning("没有找到可打印的条码");
            return;
          }
          
          // 构建单个打印页面，包含所有条码，每个条码占一页
          let printContent = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>打印条码</title>';
          printContent += '<style>';
          printContent += '@page {size: 40mm 60mm;margin: 0;}';
          printContent += '*{margin:0;padding:0;box-sizing:border-box;}';
          printContent += 'body{font-family:"Microsoft YaHei",Arial,SimSun,sans-serif;}';
          printContent += '.barcode-page{width:40mm;height:60mm;max-height:60mm;margin:0;padding:0;box-sizing:border-box;overflow:hidden;page-break-after:always;page-break-inside:avoid;break-inside:avoid;}';
          printContent += '.barcode-page:last-child{page-break-after:auto;}';
          printContent += '.container{width:100%;height:100%;max-height:100%;border:none;display:flex;flex-direction:column;align-items:stretch;box-sizing:border-box;}';
          printContent += '.title-block{width:100%;min-width:100%;max-width:100%;flex-shrink:0;box-sizing:border-box;align-self:stretch;}';
          printContent += '.title{text-align:center;font-weight:bold;font-size:13px;padding:1mm 0 0.6mm;border:none;background-color:#fff;flex-shrink:0;}';
          printContent += '.barcode-page .title-line{display:block;width:40mm;max-width:40mm;height:0;margin:0;padding:0;border:none;border-top:1px solid #000;flex-shrink:0;box-sizing:border-box;}';
          printContent += '.content{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;}';
          printContent += '.main-info{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;padding:0 2.5mm;align-items:center;}';
          printContent += '.info-table{width:100%;max-width:100%;border-collapse:collapse;table-layout:fixed;}';
          printContent += '.info-table tr.row-two-pair .label-cell{width:22%;}';
          printContent += '.info-table tr.row-two-pair .value-cell{width:28%;white-space:nowrap;}';
          printContent += '.info-table tr:not(.row-two-pair) .label-cell{width:34%;}';
          printContent += '.info-table tr:not(.row-two-pair) .value-cell{width:66%;}';
          printContent += '.info-table td{border:none;padding:0.68mm 0.55mm;font-size:8px;line-height:1.48;vertical-align:top;overflow:visible;}';
          printContent += '.info-table tr.row-two-pair td:nth-child(2){padding-right:1.25mm;}';
          printContent += '.info-table tr.row-two-pair td:nth-child(3){padding-left:1.05mm;}';
          printContent += '.label-cell{width:34%;font-weight:bold;background-color:#f9f9f9;text-align:left;vertical-align:top;padding-left:0.6mm;padding-right:1.35mm;white-space:nowrap;}';
          printContent += '.value-cell{width:66%;text-align:left;vertical-align:top;white-space:normal;overflow:visible;word-break:break-all;overflow-wrap:anywhere;padding-left:1mm;padding-right:0.35mm;}';
          printContent += '.barcode-row{flex-shrink:0;width:100%;max-width:100%;margin:0 auto;text-align:center;padding:0.3mm 0 0;box-sizing:border-box;}';
          printContent += '.linear-barcode-img{display:block;margin:0 auto;max-width:35mm;width:auto;height:auto;max-height:9.5mm;object-fit:contain;border:none!important;outline:none!important;box-shadow:none!important;}';
          printContent += '.barcode-placeholder{font-size:8px;color:#666;text-align:center;padding:1mm 0;}';
          printContent += '@media print{body{margin:0;padding:0;}@page{margin:0;size:40mm 60mm;}';
          printContent += '.barcode-page{page-break-after:always;}}';
          printContent += '</style>';
          printContent += '</head><body>';
          
          // 为每个条码生成一页
          allBarcodesToPrint.forEach((barcodeData, index) => {
            const { inHospitalCode, item, material } = barcodeData;
            
            printContent += '<div class="barcode-page">';
            printContent += '<div class="container">';
            
            // 标题 + 全宽实线（避免仅用 border-bottom 打印断缺）
            printContent += '<div class="title-block"><div class="title">高值备货码</div><div class="title-line"></div></div>';
            
            // 内容：整表 + 院内码下一行一维码（Code128）
            printContent += '<div class="content">';
            printContent += '<div class="main-info">';
            printContent += '<table class="info-table">';
            const materialName = item.materialName || material.name || '';
            printContent += '<tr class="row-two-pair"><td class="label-cell">品名</td><td class="value-cell">' + materialName + '</td><td class="label-cell">规格</td><td class="value-cell">' + (material.speci || '') + '</td></tr>';
            printContent += '<tr class="row-two-pair"><td class="label-cell">批号</td><td class="value-cell">' + (item.batchNumber || '') + '</td><td class="label-cell">单价</td><td class="value-cell">' + (item.price ? parseFloat(item.price).toFixed(2) : '') + '</td></tr>';
            printContent += '<tr><td class="label-cell">有效期</td><td class="value-cell" colspan="3">' + (item.endTime || '') + '</td></tr>';
            const factoryName = (material.fdFactory && material.fdFactory.factoryName) ? material.fdFactory.factoryName : '';
            printContent += '<tr><td class="label-cell">厂家</td><td class="value-cell" colspan="3">' + factoryName + '</td></tr>';
            printContent += '</table>';
            printContent += '<div class="barcode-row">';
            if (inHospitalCode) {
              const linearUrl = 'https://barcode.tec-it.com/barcode.ashx?data=' + encodeURIComponent(String(inHospitalCode)) + '&code=Code128&dpi=120&imagewidth=360&imageheight=100';
              printContent += '<img src="' + linearUrl + '" alt="院内码条码" class="linear-barcode-img" />';
            } else {
              printContent += '<div class="barcode-placeholder">无院内码</div>';
            }
            printContent += '</div>';
            printContent += '</div>';
            printContent += '</div>';
            printContent += '</div>'; // container
            printContent += '</div>'; // barcode-page
          });
          
          printContent += '</body></html>';
          
          // 只打开一个打印窗口，包含所有条码
          const printWindow = window.open('', '_blank', 'width=800,height=600');
          if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.onload = function() {
              printWindow.print();
            };
            console.log(`成功打开打印窗口，包含 ${allBarcodesToPrint.length} 个条码`);
            this.$modal.msgSuccess(`成功生成 ${allBarcodesToPrint.length} 个条码，请查看打印预览`);
          } else {
            console.error('打印窗口被浏览器阻止');
            this.$modal.msgError('打印窗口被浏览器阻止，请允许弹窗后重试');
          }
          
          // 统计总共需要打印的条码数量
          let totalBarcodes = 0;
          entryList.forEach((item) => {
            const batchNo = item.batchNo;
            const materialId = item.materialId;
            const qty = parseInt(item.qty) || 0;
            const key = `${batchNo}_${materialId}`;
            const inHospitalCodes = keyToInHospitalCodes[key] || [];
            const codesToPrint = inHospitalCodes.slice(0, qty);
            totalBarcodes += codesToPrint.length;
          });
          
          console.log(`总共需要打印 ${totalBarcodes} 个条码`);
          
          if (totalBarcodes > 0) {
            this.$modal.msgSuccess(`正在生成 ${totalBarcodes} 个条码，请允许浏览器弹窗`);
          } else {
            this.$modal.msgWarning("没有找到可打印的条码");
          }
        }).catch(() => {
          this.$modal.msgError("查询库存信息失败");
        });
      }).catch(() => {
        this.$modal.msgError("获取订单信息失败");
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加跟台管理";
      this.form.orderStatus = '1';
      this.form.orderType = '401'; // 跟台类型，使用401生成GT开头的单号
      //操作人
      var userName = this.$store.state.user.name;
      this.form.createBy = userName;
      this.form.orderDate = this.getOrderDate();
      this.action = true;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getOrder(id).then(response => {
        this.form = response.data;
        this.form.orderStatus = '1';
        this.form.orderType = '401'; // 跟台类型，使用401生成GT开头的单号
        this.gzOrderEntryList = response.data.gzOrderEntryList;
        this.entryPageNum = 1;
        this.open = true;
        this.title = "修改跟台管理";
        this.action = true;
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.form.gzOrderEntryList = this.gzOrderEntryList;
          this.form.gzOrderEntryList = this.form.gzOrderEntryList.map(item => ({
            ...item,
            supplierId: this.form.supplerId || item.supplierId || null,
            warehouseId: this.form.warehouseId || item.warehouseId || null
          }));
          if (this.form.id != null) {
            updateOrder(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addOrder(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除跟台管理编号为"' + ids + '"的数据项？').then(function() {
        return delOrder(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 审核按钮操作 */
    handleAudit() {
      const ids = this.ids;
      if (ids.length === 0) {
        this.$modal.msgError("请先选择要审核的数据项");
        return;
      }
      // 检查选中的订单是否都是未审核状态
      const selectedOrders = this.orderList.filter(item => ids.includes(item.id));
      const nonPendingOrders = selectedOrders.filter(item => item.orderStatus !== '1' && item.orderStatus !== 1);
      
      if (nonPendingOrders.length > 0) {
        const statusInfo = nonPendingOrders.map(order => `${order.orderNo}(状态:${order.orderStatus})`).join(', ');
        this.$modal.msgError(`只能审核未审核状态的订单！以下订单状态不正确：${statusInfo}`);
        return;
      }
      
      const orderNos = selectedOrders.map(item => item.orderNo).join('、');
      this.$modal.confirm('确定要审核选中的 ' + ids.length + ' 个订单吗？\n订单编号：' + orderNos).then(() => {
        // 批量审核
        const auditPromises = ids.map(id => auditOrder({id: id}));
        
        Promise.all(auditPromises).then(() => {
          this.getList();
          this.$modal.msgSuccess("批量审核成功！共审核 " + ids.length + " 个订单");
        }).catch(() => {
          this.$modal.msgError("批量审核失败！");
        });
      }).catch(() => {});
    },
    handleEntryPagination({ page, limit }) {
      if (page != null) this.entryPageNum = page;
      if (limit != null) this.entryPageSize = limit;
    },
	/** 高值退货明细序号（全局序号，便于跨页选择与 sm2 按行更新） */
    rowGzOrderEntryIndex({ row, rowIndex }) {
      const base = (this.entryPageNum - 1) * this.entryPageSize;
      row.index = base + rowIndex + 1;
    },
    /** 高值退货明细添加按钮操作 */
    handleAddGzOrderEntry() {
      let obj = {};
      obj.materialId = "";
      obj.qty = "";
      obj.price = "";
      obj.amt = "";
      obj.batchNo = "";
      obj.batchNumber = "";
      obj.beginTime = "";
      obj.endTime = "";
      obj.remark = "";
      obj.masterBarcode = "";
      obj.secondaryBarcode = "";
      this.gzOrderEntryList.push(obj);
    },
    /** 高值退货明细删除按钮操作 */
    handleDeleteGzOrderEntry() {
      if (this.checkedGzOrderEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的高值退货明细数据");
      } else {
        const gzOrderEntryList = this.gzOrderEntryList;
        const checkedGzOrderEntry = this.checkedGzOrderEntry;
        this.gzOrderEntryList = gzOrderEntryList.filter(function(item) {
          return checkedGzOrderEntry.indexOf(item.index) == -1
        });
        this.checkedGzOrderEntry = [];
        this.$nextTick(() => {
          if (this.$refs.gzOrderEntry) {
            this.$refs.gzOrderEntry.clearSelection();
          }
        });
      }
    },
    /** 复选框选中数据 */
    handleGzOrderEntrySelectionChange(selection) {
      this.checkedGzOrderEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      const params = this.normalizeQueryDateTime(this.queryParams);
      this.download('gz/order/export', {
        ...params
      }, `order_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
/* 确保页面容器有相对定位 */
.app-container {
  position: relative;
}

/* 搜索区域样式 */
.app-container > .el-form {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
}

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

.local-modal-content .el-form {
  flex: 1;
  overflow: visible;
  padding: 6px 20px 4px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

/* 弹窗内顶部字段区：与到货验收一致 */
.local-modal-content .form-fields-container {
  background: #fff;
  padding: 8px 16px 8px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 8px;
  margin-left: -20px;
  margin-right: -20px;
  width: calc(100% + 40px);
  box-sizing: border-box;
  border: 1px solid #ebeef5;
}

.local-modal-content .form-fields-container .el-row:last-child {
  margin-bottom: 0;
}

/* 弹窗内明细区：高度随内容，避免分页下方被 flex 撑出大块留白 */
.local-modal-content .modal-detail-section {
  margin-left: -20px;
  margin-right: -20px;
  width: calc(100% + 40px);
  box-sizing: border-box;
  margin-top: 4px;
  flex: 0 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.local-modal-content .modal-detail-section .detail-toolbar-row {
  margin-top: 0;
  margin-bottom: 0;
  padding-top: 10px;
  padding-bottom: 6px;
  box-sizing: border-box;
}

.local-modal-content .modal-detail-section .table-wrapper {
  margin-top: 4px;
  flex: 0 1 auto;
  overflow: hidden;
}

.local-modal-content .modal-detail-section .modal-entry-pagination {
  flex-shrink: 0;
  margin-top: -2px;
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

/* 弹窗内明细表容器：高度由 el-table :height 控制；分页在外层，勿整块滚动 */
.local-modal-content .table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  margin-top: 10px;
  padding-bottom: 0;
}

.local-modal-content .modal-detail-section .el-table {
  width: 100%;
}
</style>

<style>
/* =========================
 * 跟台管理：顶部搜索容器 + 主明细框
 * 直接对齐「到货验收」页面（非 scoped，确保发版后样式一致）
 * ========================= */

.app-container.gzOrder-follow-page {
  position: relative;
  padding-left: 8px !important;
  padding-right: 8px !important;
}

/* 搜索框容器：与到货验收一致的上移与外观（宽高/明暗/边框/阴影） */
.app-container > .el-form.query-form-compact {
  margin-top: -8px !important;
}

.app-container.gzOrder-follow-page > .el-form.query-form-compact {
  margin-top: -12px !important;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  border: 1px solid #c0c4cc;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
}

/* 按钮行：与到货验收一致的紧凑间距与位置 */
.app-container.gzOrder-follow-page > .el-row.button-row-compact {
  margin-top: -8px !important;
  padding-top: 0 !important;
  margin-bottom: 8px !important;
}

/* 主明细框（列表表格）：与到货验收一致 */
.app-container.gzOrder-follow-page > .el-table.table-compact {
  margin-top: 0;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.app-container.gzOrder-follow-page > .el-table.table-compact th {
  background-color: #EBEEF5 !important;
  color: #606266;
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.gzOrder-follow-page > .el-table.table-compact th .cell {
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
}

.app-container.gzOrder-follow-page > .el-table.table-compact td {
  padding: 12px 0;
  color: #606266;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.gzOrder-follow-page > .el-table.table-compact tr:hover > td {
  background-color: #F5F7FA !important;
  transition: all 0.3s;
}

/* 主列表滚动条：与到货验收一致 */
.app-container.gzOrder-follow-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar {
  width: 20px !important;
  height: 12px !important;
}

.app-container.gzOrder-follow-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909399 !important;
  border-radius: 10px !important;
  border: 2px solid #f1f1f1 !important;
  min-height: 12px !important;
  min-width: 20px !important;
}

.app-container.gzOrder-follow-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 10px !important;
  border: 1px solid #e4e7ed !important;
}

/* 跟台弹窗内分页：覆盖 Pagination 组件默认大 padding，上移并去掉底部留白 */
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .pagination-container.modal-entry-pagination {
  padding: 2px 16px 0 !important;
}

.json-viewer-pre {
  margin: 0;
  max-height: 520px;
  overflow: auto;
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  padding: 12px;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
