<template>
  <div class="app-container">
    <div class="query-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">

        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item label="设备名称" prop="equipmentName" class="query-item-inline">
              <el-input
                v-model="queryParams.equipmentName"
                placeholder="请输入设备名称"
                clearable
                style="width: 180px"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="入库单号" prop="storageNo" class="query-item-inline">
              <el-input
                v-model="queryParams.storageNo"
                placeholder="请输入入库单号"
                clearable
                style="width: 180px"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="12">
            <el-form-item label="入库日期" style="display: flex; align-items: center;">
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
            <el-form-item label="入库状态" prop="storageStatus" class="query-item-status-aligned">
              <el-select v-model="queryParams.storageStatus" placeholder="全部"
                         clearable style="width: 150px">
                <el-option
                  v-for="dict in dict.type.storage_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

      </el-form>
    </div>

    <el-row :gutter="10" class="mb8" style="padding-top: 10px">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="medium"
          @click="handleAdd"
          v-hasPermi="['equipment:storage:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="medium"
          :disabled="single || hasAuditedSelected"
          @click="handleUpdate"
          v-hasPermi="['equipment:storage:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="medium"
          :disabled="single || hasAuditedSelected"
          @click="handleDelete"
          v-hasPermi="['equipment:storage:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="el-icon-check"
          size="medium"
          :disabled="single"
          @click="handleAudit"
          v-hasPermi="['equipment:storage:audit']"
        >审核</el-button>
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

    <el-table v-loading="loading" :data="storageList" @selection-change="handleSelectionChange" height="calc(100vh - 380px)" border>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="入库单号" align="center" prop="storageNo" width="180" show-overflow-tooltip resizable />
      <el-table-column label="仓库" align="center" prop="warehouseName" width="150" show-overflow-tooltip resizable />
      <el-table-column label="制单日期" align="center" prop="billDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.billDate">{{ formatBillDate(scope.row.billDate) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="createrName" width="120" show-overflow-tooltip resizable />
      <el-table-column label="审核人" align="center" prop="auditorName" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditorName">{{ scope.row.auditorName }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="storageStatus" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.storageStatus === '2'">已审核</span>
          <span v-else-if="scope.row.storageStatus === '0'">未审核</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="总金额" align="center" prop="storageAmount" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.storageAmount">{{ scope.row.storageAmount | formatCurrency }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="supplier" width="200" show-overflow-tooltip resizable />
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="220" fixed="right">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              v-if="scope.row.storageStatus !== '2'"
              size="small"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['equipment:storage:edit']"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              v-if="scope.row.storageStatus !== '2'"
              size="small"
              type="text"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['equipment:storage:remove']"
              style="padding: 0 5px; margin: 0;"
            >删除</el-button>
            <el-button
              v-if="scope.row.storageStatus === '2'"
              size="small"
              type="text"
              icon="el-icon-printer"
              @click="handlePrint(scope.row)"
              style="padding: 0 5px; margin: 0;"
            >打印</el-button>
          </span>
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

    <!-- 添加或修改设备入库对话框 - 全屏模式 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <!-- 弹窗头部 -->
            <div class="modal-header">
              <span class="modal-title">{{ title }}</span>
              <el-button class="close-btn" @click="cancel">关闭</el-button>
            </div>

            <!-- 弹窗主体 -->
            <div class="modal-body">
              <!-- 顶部输入框区域 -->
              <div class="form-fields-container">
                <el-form ref="form" :model="form" :rules="rules" label-width="100px">
                  <el-row :gutter="20">
                    <el-col :span="4">
                      <el-form-item label="单号" prop="storageNo">
                        <el-input v-model="form.storageNo" placeholder="自动生成ZC-开头" :disabled="true" style="width: 100%" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="仓库" prop="warehouseId">
                        <el-select v-model="form.warehouseId" placeholder="请选择仓库" style="width: 100%" filterable clearable>
                          <el-option
                            v-for="item in warehouseOptions"
                            :key="item.id"
                            :label="item.name"
                            :value="String(item.id)"
                          ></el-option>
                        </el-select>
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="状态" prop="storageStatus">
                        <el-select v-model="form.storageStatus" placeholder="请选择状态" style="width: 100%" disabled>
                          <el-option label="未审核" value="0"></el-option>
                          <el-option label="已审核" value="2"></el-option>
                        </el-select>
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="制单日期" prop="billDate">
                        <el-date-picker
                          v-model="form.billDate"
                          type="datetime"
                          placeholder="选择制单日期"
                          value-format="yyyy-MM-dd HH:mm:ss"
                          format="yyyy-MM-dd HH:mm:ss"
                          style="width: 100%"
                          :disabled="true"
                        />
                      </el-form-item>
                    </el-col>
                  </el-row>

                  <el-row :gutter="20">
                    <el-col :span="4">
                      <el-form-item label="制单人" prop="createrId">
                        <el-input
                          v-model="form.createrName"
                          placeholder="自动填充当前用户"
                          :disabled="true"
                          style="width: 100%"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="金额">
                        <el-input :value="formattedAmount" disabled style="width: 100%" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="供应商" prop="supplierId">
                        <el-select
                          v-model="form.supplierId"
                          placeholder="请选择供应商"
                          style="width: 100%"
                          filterable
                          clearable
                          :filter-method="filterSupplier"
                          @change="handleSupplierChange"
                        >
                          <el-option
                            v-for="item in filteredSupplierOptions"
                            :key="item.id"
                            :label="getSupplierDisplayLabel(item)"
                            :value="item.id"
                          >
                            <span>{{ item.name }}</span>
                          </el-option>
                        </el-select>
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="备注" prop="remark">
                        <el-input v-model="form.remark" placeholder="请输入备注" style="width: 100%" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                </el-form>
              </div>

              <!-- 保存取消按钮 - 放在两个框中间靠左边 -->
              <div class="modal-button-bar">
                <el-button type="primary" @click="handleAddDetail" :disabled="!form.supplierId">添加</el-button>
                <el-button type="primary" @click="submitForm">保存</el-button>
                <el-button @click="cancel">取消</el-button>
              </div>

              <!-- 明细框区域 -->
              <div class="detail-table-container">
                <el-table
                  :data="detailList"
                  border
                  style="width: 100%"
                  height="100%"
                >
                  <el-table-column type="selection" width="55" align="center" />
                  <el-table-column label="序号" type="index" width="60" align="center" />
                  <el-table-column label="档案编码" prop="equipmentCode" width="150" align="center" show-overflow-tooltip />
                  <el-table-column label="档案名称" prop="equipmentName" width="200" align="center" show-overflow-tooltip />
                  <el-table-column label="分类编码" prop="categoryCode" width="150" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.categoryCode || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="所属分类" prop="specification" width="180" align="center" show-overflow-tooltip />
                  <el-table-column label="财务分类" prop="model" width="150" align="center" show-overflow-tooltip />
                  <el-table-column label="资产分类" prop="assetCategory" width="150" align="center" show-overflow-tooltip />
                  <el-table-column label="折旧年限" prop="depreciationPeriod" width="120" align="center" show-overflow-tooltip />
                  <el-table-column label="使用年限" prop="serviceLife" width="120" align="center" show-overflow-tooltip />
                  <el-table-column label="规格" prop="spec" width="150" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <el-input
                        v-model="scope.row.spec"
                        size="mini"
                        placeholder="请输入规格"
                        @change="handleDetailChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="型号" prop="modelNo" width="150" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <el-input
                        v-model="scope.row.modelNo"
                        size="mini"
                        placeholder="请输入型号"
                        @change="handleDetailChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="商检编号" prop="inspectionNo" width="150" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <el-input
                        v-model="scope.row.inspectionNo"
                        size="mini"
                        placeholder="请输入商检编号"
                        @change="handleDetailChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="注册证号" prop="registrationNo" width="150" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <el-input
                        v-model="scope.row.registrationNo"
                        size="mini"
                        placeholder="请输入注册证号"
                        @change="handleDetailChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="序列号" prop="serialNo" width="150" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <el-input
                        v-model="scope.row.serialNo"
                        size="mini"
                        placeholder="请输入序列号"
                        @change="handleDetailChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="生产日期" prop="productionDate" width="120" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <el-date-picker
                        v-model="scope.row.productionDate"
                        type="date"
                        value-format="yyyy-MM-dd"
                        placeholder="选择日期"
                        size="mini"
                        style="width: 100%"
                        @change="handleDetailChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="数量" prop="quantity" width="100" align="center">
                    <template slot-scope="scope">
                      <el-input-number
                        v-model="scope.row.quantity"
                        :min="1"
                        size="mini"
                        style="width: 100%"
                        @change="handleDetailChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="共计箱数" prop="totalBoxes" width="120" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <el-input-number
                        v-model="scope.row.totalBoxes"
                        :min="0"
                        size="mini"
                        style="width: 100%"
                        @change="handleDetailChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="金额" prop="amount" width="120" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <el-input-number
                        v-model="scope.row.amount"
                        :min="0"
                        :precision="2"
                        size="mini"
                        style="width: 100%"
                        @change="handleDetailChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="大写金额" prop="amountInWords" width="150" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.amountInWords || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="使用期限" prop="usagePeriod" width="120" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <el-input
                        v-model="scope.row.usagePeriod"
                        size="mini"
                        placeholder="请输入使用期限"
                        @change="handleDetailChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="生产商" prop="manufacturer" width="150" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <el-select
                        v-model="scope.row.manufacturer"
                        size="mini"
                        placeholder="请选择生产商"
                        filterable
                        clearable
                        style="width: 100%"
                        @change="handleDetailChange(scope.row)"
                      >
                        <el-option
                          v-for="item in factoryOptions"
                          :key="item.factoryId"
                          :label="item.factoryName"
                          :value="item.factoryName">
                        </el-option>
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column label="生产商联系方式" prop="manufacturerContact" width="180" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <el-input
                        v-model="scope.row.manufacturerContact"
                        size="mini"
                        placeholder="请输入联系方式"
                        @change="handleDetailChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="经销商" prop="dealer" width="150" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <el-input
                        v-model="scope.row.dealer"
                        size="mini"
                        placeholder="请输入经销商"
                        @change="handleDetailChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="经销商联系方式" prop="dealerContact" width="180" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <el-input
                        v-model="scope.row.dealerContact"
                        size="mini"
                        placeholder="请输入联系方式"
                        @change="handleDetailChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="外包装类型" prop="packagingType" width="150" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <el-input
                        v-model="scope.row.packagingType"
                        size="mini"
                        placeholder="请输入外包装类型"
                        @change="handleDetailChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="外包装状态" prop="packagingStatus" width="150" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <el-input
                        v-model="scope.row.packagingStatus"
                        size="mini"
                        placeholder="请输入外包装状态"
                        @change="handleDetailChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="外包装破损情况" prop="packagingDamage" width="180" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <el-input
                        v-model="scope.row.packagingDamage"
                        size="mini"
                        placeholder="请输入破损情况"
                        @change="handleDetailChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="外形" prop="appearance" width="120" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <el-input
                        v-model="scope.row.appearance"
                        size="mini"
                        placeholder="请输入外形"
                        @change="handleDetailChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="附件" prop="accessories" width="150" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <el-input
                        v-model="scope.row.accessories"
                        size="mini"
                        placeholder="请输入附件"
                        @change="handleDetailChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="技术参数相符情况" prop="techParamMatch" width="180" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <el-input
                        v-model="scope.row.techParamMatch"
                        size="mini"
                        placeholder="请输入技术参数相符情况"
                        @change="handleDetailChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="说明书份数" prop="manualCount" width="120" align="center">
                    <template slot-scope="scope">
                      <el-input-number
                        v-model="scope.row.manualCount"
                        :min="0"
                        size="mini"
                        style="width: 100%"
                        @change="handleDetailChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="合格证份数" prop="certificateCount" width="120" align="center">
                    <template slot-scope="scope">
                      <el-input-number
                        v-model="scope.row.certificateCount"
                        :min="0"
                        size="mini"
                        style="width: 100%"
                        @change="handleDetailChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="装箱单份数" prop="packingListCount" width="120" align="center">
                    <template slot-scope="scope">
                      <el-input-number
                        v-model="scope.row.packingListCount"
                        :min="0"
                        size="mini"
                        style="width: 100%"
                        @change="handleDetailChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="安装验收单份数" prop="acceptanceFormCount" width="150" align="center">
                    <template slot-scope="scope">
                      <el-input-number
                        v-model="scope.row.acceptanceFormCount"
                        :min="0"
                        size="mini"
                        style="width: 100%"
                        @change="handleDetailChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="验收结果" prop="acceptanceResult" width="120" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <el-input
                        v-model="scope.row.acceptanceResult"
                        size="mini"
                        placeholder="请输入验收结果"
                        @change="handleDetailChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="验收日期" prop="acceptanceDate" width="120" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <el-date-picker
                        v-model="scope.row.acceptanceDate"
                        type="date"
                        value-format="yyyy-MM-dd"
                        placeholder="选择日期"
                        size="mini"
                        style="width: 100%"
                        @change="handleDetailChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="备注" prop="remark" align="center" show-overflow-tooltip />
                </el-table>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 添加明细弹窗 - 在容器内显示 -->
    <transition name="modal-fade">
      <div v-if="detailDialogVisible" class="detail-modal-mask">
        <transition name="modal-zoom">
          <div v-if="detailDialogVisible" class="detail-modal-content">
            <!-- 弹窗头部 -->
            <div class="detail-modal-header">
              <span class="detail-modal-title">添加设备明细</span>
              <el-button class="detail-close-btn" @click="detailDialogVisible = false">关闭</el-button>
            </div>

            <!-- 弹窗主体 -->
            <div class="detail-modal-body">
              <!-- 搜索框区域 -->
              <div class="detail-search-container">
                <el-form :inline="true" :model="detailSearchForm" size="small">
                  <el-form-item label="档案名称">
                    <el-input
                      v-model="detailSearchForm.name"
                      placeholder="请输入档案名称"
                      clearable
                      style="width: 200px"
                      @keyup.enter.native="handleDetailSearch"
                    />
                  </el-form-item>
                  <el-form-item label="所属分类">
                    <el-input
                      v-model="detailSearchForm.speci"
                      placeholder="请输入所属分类"
                      clearable
                      style="width: 200px"
                      @keyup.enter.native="handleDetailSearch"
                    />
                  </el-form-item>
                </el-form>
              </div>

              <!-- 按钮栏 - 确认按钮靠左，搜索重置按钮在后面 -->
              <div class="detail-button-bar">
                <el-button type="primary" @click="handleConfirmDetail">确认</el-button>
                <el-button type="primary" icon="el-icon-search" @click="handleDetailSearch">搜索</el-button>
                <el-button icon="el-icon-refresh" @click="resetDetailSearch">重置</el-button>
              </div>

              <!-- 明细表格 -->
              <div class="detail-dialog-table-container">
                <el-table
                  :data="detailSearchList"
                  border
                  @selection-change="handleDetailSelectionChange"
                  height="400px"
                >
                  <el-table-column type="selection" width="55" align="center" />
                  <el-table-column label="序号" type="index" width="60" align="center" />
                  <el-table-column label="分类编码" prop="categoryCode" width="150" align="center" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.categoryCode || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="档案名称" prop="equipmentName" width="200" align="center" show-overflow-tooltip />
                  <el-table-column label="所属分类" prop="specification" width="150" align="center" show-overflow-tooltip />
                  <el-table-column label="财务分类" prop="model" width="150" align="center" show-overflow-tooltip />
                  <el-table-column label="单价" prop="unitPrice" width="120" align="center">
                    <template slot-scope="scope">
                      <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatCurrency }}</span>
                      <span v-else>--</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 打印弹窗 -->
    <print-dialog
      :visible.sync="printDialogVisible"
      title="打印入库单"
      @close="handlePrintClose"
    >
      <template slot="content">
        <!-- 标题 -->
        <div class="print-header">
          <h1 class="print-title">衡水市第三人民医院入库单</h1>
        </div>

        <!-- 基本信息 -->
        <div class="print-info">
          <table class="info-table">
            <tr>
              <td class="info-label">单号：</td>
              <td class="info-value">{{ printData.storageNo || '--' }}</td>
              <td class="info-label">申请时间：</td>
              <td class="info-value">{{ formatPrintDate(printData.billDate) || '--' }}</td>
            </tr>
            <tr>
              <td class="info-label">仓库：</td>
              <td class="info-value">{{ printData.warehouseName || '--' }}</td>
              <td class="info-label">审核时间：</td>
              <td class="info-value">{{ formatPrintDateTime(printData.auditDate) || '--' }}</td>
            </tr>
            <tr>
              <td class="info-label">供应商：</td>
              <td class="info-value" colspan="3">{{ printData.supplier || '--' }}</td>
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
              <tr v-for="(item, index) in printDetailList" :key="index">
                <td>{{ index + 1 }}</td>
                <td>{{ item.equipmentCode || '--' }}</td>
                <td>{{ item.equipmentName || '--' }}</td>
                <td>{{ item.specification || item.spec || '--' }}</td>
                <td>{{ item.model || item.modelNo || '--' }}</td>
                <td>{{ item.quantity || 0 }}</td>
                <td>{{ formatPrintCurrency(item.unitPrice) }}</td>
                <td>{{ formatPrintCurrency(item.amount || item.totalPrice) }}</td>
                <td>{{ item.registrationNo || '--' }}</td>
                <td>{{ item.serialNo || '--' }}</td>
                <td>{{ item.manufacturer || '--' }}</td>
                <td>{{ item.categoryCode || '--' }}</td>
              </tr>
              <!-- 空行填充 -->
              <tr v-for="n in printEmptyRows" :key="'empty-' + n">
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
              <td class="summary-value">数量：{{ printTotalQuantity }}</td>
              <td class="summary-value">金额：{{ formatPrintCurrency(printTotalAmount) }}</td>
            </tr>
            <tr>
              <td class="summary-label">合计金额：</td>
              <td class="summary-value-chinese" colspan="2">（大写）{{ printAmountInChinese }}</td>
            </tr>
            <tr>
              <td></td>
              <td class="summary-value-numeric" colspan="2">（小写）{{ formatPrintCurrency(printTotalAmount) }}</td>
            </tr>
          </table>
        </div>

        <!-- 签名区域 -->
        <div class="print-signature">
          <div class="signature-item">
            <span class="signature-label">制单人：</span>
            <span class="signature-value">{{ printData.createrName || '--' }}</span>
          </div>
          <div class="signature-item">
            <span class="signature-label">复核人：</span>
            <span class="signature-value">{{ printData.auditorName || '--' }}</span>
          </div>
          <div class="signature-item">
            <span class="signature-label">验收人：</span>
            <span class="signature-value">--</span>
          </div>
        </div>
      </template>
    </print-dialog>
  </div>
</template>

<script>
import { listEquipmentStorage, getEquipmentStorage, delEquipmentStorage, addEquipmentStorage, updateEquipmentStorage, auditEquipmentStorage } from "@/api/equipment/equipmentStorage";
import { listWarehouseAll } from "@/api/foundation/warehouse";
import { listUserAll } from "@/api/system/user";
import { listSupplierAll } from "@/api/foundation/supplier";
import { listFactoryAll } from "@/api/foundation/factory";
import { listEquipmentDict } from "@/api/foundation/equipmentDict";
import { pinyin } from 'pinyin-pro';
import PrintDialog from "@/components/PrintDialog";

export default {
  name: "EquipmentStorage",
  dicts: ['storage_status'],
  components: {
    PrintDialog
  },
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
      // 是否选中了已审核的单据
      hasAuditedSelected: false,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 设备入库表格数据
      storageList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        equipmentName: null,
        storageNo: null,
        storageStatus: null,
        beginDate: null,
        endDate: null
      },
      // 表单参数
      form: {
        supplierId: null,
        supplier: null
      },
      // 明细列表
      detailList: [],
      // 仓库选项列表（仅设备类型）
      warehouseOptions: [],
      // 用户选项列表
      userOptions: [],
      // 供应商选项列表
      supplierOptions: [],
      // 供应商搜索关键词
      supplierSearchKeyword: '',
      // 生产厂家选项列表
      factoryOptions: [],
      // 添加明细弹窗显示状态
      detailDialogVisible: false,
      // 明细搜索表单
      detailSearchForm: {
        name: null,
        speci: null
      },
      // 明细搜索结果列表
      detailSearchList: [],
      // 选中的明细项
      selectedDetailItems: [],
      // 分类编码序号跟踪（用于生成档案编码）
      categoryCodeSequence: {},
      // 打印弹窗显示状态
      printDialogVisible: false,
      // 打印数据
      printData: {},
      // 打印明细列表
      printDetailList: [],
      // 表单校验
      rules: {
        storageNo: [
          { required: true, message: "单号不能为空", trigger: "blur" }
        ],
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "change" }
        ],
        storageStatus: [
          { required: true, message: "状态不能为空", trigger: "change" }
        ],
        createrId: [
          { required: true, message: "制单人不能为空", trigger: "change" }
        ],
        billDate: [
          { required: true, message: "制单日期不能为空", trigger: "change" }
        ],
        supplierId: [
          { required: true, message: "供应商不能为空", trigger: "change" }
        ]
      }
    };
  },
  created() {
    this.getList();
    this.loadWarehouseOptions();
    this.loadUserOptions();
    this.loadSupplierOptions();
    this.loadFactoryOptions();
  },
  computed: {
    // 过滤后的供应商选项
    filteredSupplierOptions() {
      if (!this.supplierSearchKeyword || this.supplierSearchKeyword.trim() === '') {
        return this.supplierOptions;
      }
      const keyword = this.supplierSearchKeyword.toLowerCase().trim();
      return this.supplierOptions.filter(item => {
        // 名称模糊匹配
        if (item.name && item.name.toLowerCase().includes(keyword)) {
          return true;
        }
        // 首字母匹配
        if (item.pinyinCode && item.pinyinCode.toLowerCase().includes(keyword)) {
          return true;
        }
        return false;
      });
    },
    /** 格式化金额显示 */
    formattedAmount() {
      // 如果没有设置总金额，尝试从明细列表计算
      if ((!this.form.storageAmount && this.form.storageAmount !== 0) || this.form.storageAmount === null || this.form.storageAmount === undefined) {
        // 如果明细列表存在，计算总金额
        if (this.detailList && this.detailList.length > 0) {
          const total = this.detailList.reduce((sum, item) => {
            return sum + (parseFloat(item.amount) || parseFloat(item.totalPrice) || 0);
          }, 0);
          return this.$options.filters.formatCurrency(total);
        }
        return '0.00';
      }
      return this.$options.filters.formatCurrency(this.form.storageAmount);
    },
    // 打印总数量
    printTotalQuantity() {
      return this.printDetailList.reduce((sum, item) => {
        return sum + (parseInt(item.quantity) || 0);
      }, 0);
    },
    // 打印总金额
    printTotalAmount() {
      return this.printDetailList.reduce((sum, item) => {
        return sum + (parseFloat(item.amount || item.totalPrice || 0));
      }, 0);
    },
    // 打印金额大写
    printAmountInChinese() {
      return this.numberToChineseForPrint(this.printTotalAmount);
    },
    // 打印空行数量
    printEmptyRows() {
      const rowCount = this.printDetailList.length;
      const minRows = 15;
      return Math.max(0, minRows - rowCount);
    }
  },
  methods: {
    /** 查询设备入库列表 */
    getList() {
      this.loading = true;
      listEquipmentStorage(this.queryParams).then(response => {
        this.storageList = (response.rows || []).map((item, index) => {
          return {
            ...item,
            index: (this.queryParams.pageNum - 1) * this.queryParams.pageSize + index + 1
          };
        });
        this.total = response.total || 0;
        this.loading = false;
      }).catch(error => {
        console.error('查询设备入库列表失败:', error);
        this.loading = false;
      });
    },
    /** 表格行索引 */
    storageListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      // 生成单号（ZCRK-开头 + 日期 + 序号）
      const now = new Date();
      const dateStr = now.getFullYear().toString() +
                     String(now.getMonth() + 1).padStart(2, '0') +
                     String(now.getDate()).padStart(2, '0');
      const seq = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      const autoNo = `ZCRK-${dateStr}${seq}`;

      // 获取当前日期时间（格式：YYYY-MM-DD HH:mm:ss）
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const billDateStr = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      // 获取当前登录用户信息
      const currentUser = this.$store?.state?.user || {};
      const createrId = currentUser.userId || null;
      const createrName = currentUser.userName || currentUser.nickName || '';

      this.form = {
        storageId: null,
        storageNo: autoNo,
        warehouseId: null,
        storageStatus: "0",
        createrId: createrId,
        createrName: createrName,
        billDate: billDateStr,
        storageAmount: 0,
        supplierId: null,
        supplier: null,
        remark: null
      };
      this.detailList = [];
      // 重置分类编码序号跟踪
      this.categoryCodeSequence = {};
      this.resetForm("form");
    },
    /** 加载仓库选项列表（仅设备类型） */
    loadWarehouseOptions() {
      const currentUserId = this.$store?.state?.user?.userId || 1;
      listWarehouseAll(currentUserId).then(response => {
        const warehouses = response || [];
        this.warehouseOptions = warehouses
          .filter(item => item.warehouseType === '设备')
          .map(item => ({
            id: item.id ? String(item.id) : item.id,
            name: item.name || item.warehouseName || ''
          }));
      }).catch(error => {
        console.error('获取仓库列表失败:', error);
        this.warehouseOptions = [];
      });
    },
    /** 加载用户选项列表 */
    loadUserOptions() {
      listUserAll().then(response => {
        this.userOptions = response || [];
      }).catch(error => {
        console.error('获取用户列表失败:', error);
        this.userOptions = [];
      });
    },
    /** 加载供应商选项列表 */
    loadSupplierOptions() {
      return listSupplierAll().then(response => {
        const suppliers = response || [];
        // 为每个供应商生成首字母拼音码
        this.supplierOptions = suppliers.map(item => {
          let pinyinCode = '';
          if (item.name) {
            try {
              pinyinCode = pinyin(item.name, {
                pattern: 'first',
                toneType: 'none',
                type: 'array',
              }).join('').toUpperCase();
            } catch (e) {
              console.error('生成拼音码失败:', e);
            }
          }
          return {
            ...item,
            pinyinCode: pinyinCode
          };
        });
        return this.supplierOptions;
      }).catch(error => {
        console.error('获取供应商列表失败:', error);
        this.supplierOptions = [];
        return [];
      });
    },
    /** 加载生产厂家选项列表 */
    loadFactoryOptions() {
      listFactoryAll().then(response => {
        const factories = response || [];
        this.factoryOptions = factories.map(item => ({
          factoryId: item.factoryId,
          factoryName: item.factoryName || ''
        })).filter(item => item.factoryName); // 过滤掉没有名称的厂家
      }).catch(error => {
        console.error('获取生产厂家列表失败:', error);
        this.factoryOptions = [];
      });
    },
    /** 供应商搜索过滤方法 */
    filterSupplier(val) {
      this.supplierSearchKeyword = val;
    },
    /** 获取供应商的显示标签（包含拼音码用于搜索，但显示时隐藏） */
    getSupplierDisplayLabel(item) {
      // 在 label 中包含拼音码，用特殊字符分隔
      // Element UI 的默认过滤会搜索整个 label，包括拼音码
      // 但显示时我们只显示供应商名称（通过 el-option 的 slot）
      if (item.pinyinCode) {
        return `${item.name}|${item.pinyinCode}`;
      }
      return item.name;
    },
    /** 供应商选择变化事件 */
    handleSupplierChange(value) {
      if (value) {
        const selectedSupplier = this.supplierOptions.find(item => item.id === value);
        if (selectedSupplier) {
          this.form.supplier = selectedSupplier.name;
        }
      } else {
        this.form.supplier = null;
      }
    },
    /** 添加明细按钮 */
    handleAddDetail() {
      this.detailDialogVisible = true;
      this.handleDetailSearch();
    },
    /** 明细搜索 */
    handleDetailSearch() {
      // 调用设备字典API搜索
      const queryParams = {
        pageNum: 1,
        pageSize: 100,
        name: this.detailSearchForm.name || null,
        speci: this.detailSearchForm.speci || null
      };
      listEquipmentDict(queryParams).then(response => {
        this.detailSearchList = (response.rows || []).map(item => ({
          categoryCode: item.code, // 分类编码（原档案编码）
          equipmentName: item.name, // 档案名称
          specification: item.speci, // 所属分类（原规格）
          model: item.model, // 财务分类（原型号）
          unitPrice: item.price || 0 // 单价
        }));
      }).catch(error => {
        console.error('搜索设备字典失败:', error);
        this.$modal.msgError('搜索设备字典失败');
        this.detailSearchList = [];
      });
    },
    /** 重置明细搜索 */
    resetDetailSearch() {
      this.detailSearchForm = {
        name: null,
        speci: null
      };
      this.handleDetailSearch();
    },
    /** 明细选择变化 */
    handleDetailSelectionChange(selection) {
      this.selectedDetailItems = selection;
    },
    /** 初始化分类编码序号跟踪 */
    initCategoryCodeSequence() {
      this.categoryCodeSequence = {};
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;

      // 遍历明细列表，提取每个分类编码的最大序号
      this.detailList.forEach(detail => {
        if (detail.equipmentCode) {
          // 从档案编码中提取分类编码（格式：分类编码-日期+序号）
          const parts = detail.equipmentCode.split('-');
          if (parts.length >= 2) {
            const categoryCode = parts[0];
            const dateAndSeq = parts.slice(1).join('-');

            // 检查是否是今天的日期
            if (dateAndSeq.startsWith(dateStr)) {
              const seqStr = dateAndSeq.substring(dateStr.length);
              const seq = parseInt(seqStr) || 0;

              if (!this.categoryCodeSequence[categoryCode] || seq > this.categoryCodeSequence[categoryCode]) {
                this.categoryCodeSequence[categoryCode] = seq;
              }
            }
          }
        } else if (detail.categoryCode) {
          // 如果已有分类编码但没有档案编码，初始化为0
          if (!this.categoryCodeSequence[detail.categoryCode]) {
            this.categoryCodeSequence[detail.categoryCode] = 0;
          }
        }
      });
    },
    /** 生成档案编码 */
    generateEquipmentCode(categoryCode) {
      // 获取当前日期（YYYYMMDD格式）
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;

      // 获取或初始化该分类编码的序号
      if (!this.categoryCodeSequence[categoryCode]) {
        // 查找已存在的明细中该分类编码的最大序号
        let maxSeq = 0;
        const datePrefix = `${categoryCode}-${dateStr}`;
        this.detailList.forEach(detail => {
          if (detail.equipmentCode && detail.equipmentCode.startsWith(datePrefix)) {
            const seqStr = detail.equipmentCode.substring(datePrefix.length);
            const seq = parseInt(seqStr) || 0;
            if (seq > maxSeq) {
              maxSeq = seq;
            }
          }
        });
        this.categoryCodeSequence[categoryCode] = maxSeq;
      }

      // 序号自增
      this.categoryCodeSequence[categoryCode]++;

      // 生成档案编码：分类编码-日期+序号（序号2位，不足补0）
      const seqStr = String(this.categoryCodeSequence[categoryCode]).padStart(2, '0');
      return `${categoryCode}-${dateStr}${seqStr}`;
    },
    /** 确认添加明细 */
    handleConfirmDetail() {
      if (this.selectedDetailItems.length === 0) {
        this.$modal.msgWarning("请至少选择一条设备明细");
        return;
      }
      // 将选中的明细添加到明细列表
      this.selectedDetailItems.forEach(item => {
        // 根据分类编码自动生成档案编码
        const equipmentCode = this.generateEquipmentCode(item.categoryCode);

        const detailItem = {
          equipmentCode: equipmentCode, // 自动生成的档案编码
          categoryCode: item.categoryCode, // 分类编码
          equipmentName: item.equipmentName,
          specification: item.specification, // 所属分类
          model: item.model, // 财务分类
          spec: '', // 规格（可编辑）
          modelNo: '', // 型号（可编辑）
          quantity: 1,
          unitPrice: item.unitPrice || 0,
          totalPrice: (item.unitPrice || 0) * 1,
          inspectionNo: '', // 商检编号
          registrationNo: '', // 注册证号
          serialNo: '', // 序列号
          productionDate: null, // 生产日期
          totalBoxes: null, // 共计箱数
          amount: item.unitPrice || 0, // 金额
          amountInWords: '', // 大写金额
          usagePeriod: '', // 使用期限
          manufacturer: '', // 生产商
          manufacturerContact: '', // 生产商联系方式
          dealer: '', // 经销商
          dealerContact: '', // 经销商联系方式
          packagingType: '', // 外包装类型
          packagingStatus: '', // 外包装状态
          packagingDamage: '', // 外包装破损情况
          appearance: '', // 外形
          accessories: '', // 附件
          techParamMatch: '', // 技术参数相符情况
          manualCount: null, // 说明书份数
          certificateCount: null, // 合格证份数
          packingListCount: null, // 装箱单份数
          acceptanceFormCount: null, // 安装验收单份数
          acceptanceResult: '', // 验收结果
          acceptanceDate: null, // 验收日期
          remark: ''
        };
        this.detailList.push(detailItem);
      });
      // 计算总金额
      this.calculateTotalAmount();
      // 关闭弹窗
      this.detailDialogVisible = false;
      // 清空选择
      this.selectedDetailItems = [];
    },
    /** 计算总金额 */
    calculateTotalAmount() {
      const total = this.detailList.reduce((sum, item) => {
        // 优先使用amount字段，如果没有则使用totalPrice
        const amount = parseFloat(item.amount) || parseFloat(item.totalPrice) || 0;
        return sum + amount;
      }, 0);
      this.form.storageAmount = total;
    },
    /** 明细编辑 */
    handleDetailEdit(row, index) {
      // TODO: 实现明细编辑功能
      console.log('编辑明细', row, index);
    },
    /** 数字转大写金额 */
    numberToChinese(num) {
      if (!num || num === 0) return '零元整';

      const cnNums = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
      const cnIntRadice = ['', '拾', '佰', '仟'];
      const cnIntUnits = ['', '万', '亿', '兆'];
      const cnDecUnits = ['角', '分'];
      const cnInteger = '整';
      const cnIntLast = '元';

      // 转换为字符串并处理小数
      const numStr = num.toFixed(2).toString();
      const parts = numStr.split('.');
      let integerPart = parts[0];
      let decimalPart = parts[1] || '';

      // 处理整数部分
      let integerStr = '';
      if (integerPart && parseInt(integerPart) > 0) {
        let zeroCount = 0;
        const intLen = integerPart.length;

        for (let i = 0; i < intLen; i++) {
          const n = parseInt(integerPart[i]);
          const p = intLen - i - 1;
          const q = Math.floor(p / 4);
          const m = p % 4;

          if (n === 0) {
            zeroCount++;
          } else {
            if (zeroCount > 0) {
              integerStr += cnNums[0];
            }
            zeroCount = 0;
            integerStr += cnNums[n] + cnIntRadice[m];
          }

          if (m === 0 && zeroCount < 4) {
            integerStr += cnIntUnits[q];
          }
        }
        integerStr += cnIntLast;
      } else {
        integerStr = cnNums[0] + cnIntLast;
      }

      // 处理小数部分（只处理角和分）
      let decimalStr = '';
      if (decimalPart) {
        for (let i = 0; i < Math.min(decimalPart.length, 2); i++) {
          const n = parseInt(decimalPart[i]);
          if (n !== 0) {
            decimalStr += cnNums[n] + cnDecUnits[i];
          }
        }
      }

      if (decimalStr === '') {
        return integerStr + cnInteger;
      } else {
        return integerStr + decimalStr;
      }
    },
    /** 格式化制单日期，如果时分秒是00:00:00则显示当前时分秒 */
    formatBillDate(dateStr) {
      if (!dateStr) return '--';

      // 解析日期字符串
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      // 检查时分秒是否为00:00:00
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();

      // 如果时分秒都是0，使用当前时间的时分秒
      if (hours === 0 && minutes === 0 && seconds === 0) {
        const now = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${h}:${m}:${s}`;
      } else {
        // 否则正常格式化
        return this.parseTime(dateStr, '{y}-{m}-{d} {h}:{i}:{s}');
      }
    },
    /** 明细数据变化处理 */
    handleDetailChange(row) {
      // 当明细数据发生变化时，可以在这里进行一些处理
      // 例如：重新计算总金额、验证数据等
      if (row.quantity && row.unitPrice) {
        row.totalPrice = row.quantity * row.unitPrice;
        row.amount = row.totalPrice; // 同步金额字段
      }

      // 当金额变化时，自动生成大写金额
      if (row.amount !== null && row.amount !== undefined && row.amount !== '') {
        row.amountInWords = this.numberToChinese(row.amount);
      } else {
        row.amountInWords = '';
      }

      // 重新计算总金额
      this.calculateTotalAmount();
    },
    /** 明细删除 */
    handleDetailDelete(index) {
      this.detailList.splice(index, 1);
      this.calculateTotalAmount();
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.storageId)
      this.single = selection.length!==1
      this.multiple = !selection.length
      // 检查是否有已审核的单据
      const hasAudited = selection.some(item => item.storageStatus === '2')
      this.hasAuditedSelected = hasAudited
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加设备入库";
    },
    /** 打印按钮操作 */
    handlePrint(row) {
      // 打开打印弹窗
      const storageId = row.storageId;
      getEquipmentStorage(storageId).then(response => {
        if (response.code === 200 && response.data) {
          this.printData = response.data;
          this.printDetailList = response.data.detailList || [];
          this.printDialogVisible = true;
        } else {
          this.$modal.msgError('获取入库单数据失败');
        }
      }).catch(error => {
        console.error('加载入库单数据失败:', error);
        this.$modal.msgError('加载入库单数据失败');
      });
    },
    /** 打印弹窗关闭事件 */
    handlePrintClose() {
      this.printDialogVisible = false;
    },
    /** 格式化打印日期（只显示日期部分） */
    formatPrintDate(dateStr) {
      if (!dateStr) return '--';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    /** 格式化打印日期时间 */
    formatPrintDateTime(dateStr) {
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
    /** 格式化打印金额 */
    formatPrintCurrency(amount) {
      if (amount === null || amount === undefined || amount === '') {
        return '0.00';
      }
      const num = parseFloat(amount);
      if (isNaN(num)) {
        return '0.00';
      }
      return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },
    /** 数字转中文大写（用于打印） */
    numberToChineseForPrint(num) {
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
    /** 修改按钮操作 */
    handleUpdate(row) {
      // 如果传入的是行对象，检查是否已审核
      if (row && row.storageStatus === '2') {
        this.$modal.msgWarning('已审核的单据不能修改');
        return;
      }

      // 如果通过工具栏修改，检查选中的单据
      if (!row && this.ids && this.ids.length > 0) {
        const selectedRows = this.storageList.filter(item => this.ids.includes(item.storageId));
        const hasAudited = selectedRows.some(item => item.storageStatus === '2');
        if (hasAudited) {
          this.$modal.msgWarning('选中的单据中包含已审核的单据，不能修改');
          return;
        }
      }

      this.reset();
      const storageId = row ? row.storageId : this.ids[0]
      // 确保供应商选项已加载
      const loadSupplierPromise = this.supplierOptions.length > 0
        ? Promise.resolve()
        : this.loadSupplierOptions();

      Promise.all([
        getEquipmentStorage(storageId),
        loadSupplierPromise
      ]).then(([response]) => {
        this.form = response.data;
        // 确保仓库ID转换为字符串格式，以便下拉框正确显示
        if (this.form.warehouseId) {
          this.form.warehouseId = String(this.form.warehouseId);
        }
        // 根据供应商名称查找供应商ID
        if (response.data.supplier && this.supplierOptions.length > 0) {
          const matchedSupplier = this.supplierOptions.find(item => item.name === response.data.supplier);
          if (matchedSupplier) {
            this.form.supplierId = matchedSupplier.id;
          }
        }
        // 加载明细列表
        if (response.data.detailList && response.data.detailList.length > 0) {
          // 确保明细数据包含所有字段
          this.detailList = response.data.detailList.map(detail => ({
            ...detail,
            spec: detail.spec || '', // 规格字段，不自动填充所属分类
            modelNo: detail.modelNo || '', // 型号字段，不自动填充财务分类
            inspectionNo: detail.inspectionNo || '',
            registrationNo: detail.registrationNo || '',
            serialNo: detail.serialNo || '',
            productionDate: detail.productionDate || null,
            totalBoxes: detail.totalBoxes || null,
            amount: detail.amount || detail.totalPrice || 0,
            amountInWords: detail.amountInWords || '',
            usagePeriod: detail.usagePeriod || '',
            manufacturer: detail.manufacturer || '',
            manufacturerContact: detail.manufacturerContact || '',
            dealer: detail.dealer || '',
            dealerContact: detail.dealerContact || '',
            packagingType: detail.packagingType || '',
            packagingStatus: detail.packagingStatus || '',
            packagingDamage: detail.packagingDamage || '',
            appearance: detail.appearance || '',
            accessories: detail.accessories || '',
            techParamMatch: detail.techParamMatch || '',
            manualCount: detail.manualCount || null,
            certificateCount: detail.certificateCount || null,
            packingListCount: detail.packingListCount || null,
            acceptanceFormCount: detail.acceptanceFormCount || null,
            acceptanceResult: detail.acceptanceResult || '',
            acceptanceDate: detail.acceptanceDate || null,
            // 分类编码：优先使用categoryCode，如果没有则从档案编码中提取（格式：分类编码-日期+序号）
            categoryCode: detail.categoryCode || (detail.equipmentCode ? detail.equipmentCode.split('-')[0] : '')
          }));
          // 初始化分类编码序号跟踪（从已有明细中提取）
          this.initCategoryCodeSequence();
          // 重新计算总金额
          this.calculateTotalAmount();
        } else {
          this.detailList = [];
          this.categoryCodeSequence = {};
          // 如果没有明细，总金额设为0
          this.form.storageAmount = 0;
        }
        this.open = true;
        this.title = "修改设备入库";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          // 确保仓库ID转换为数字格式（如果后端需要）
          const formData = {
            ...this.form,
            warehouseId: this.form.warehouseId ? (typeof this.form.warehouseId === 'string' ? parseInt(this.form.warehouseId) : this.form.warehouseId) : null
          };

          // 处理明细列表，确保所有字段都包含
          const detailList = this.detailList.map(detail => ({
            ...detail,
            // 确保所有字段都包含在提交数据中
            spec: detail.spec || '',
            modelNo: detail.modelNo || '',
            inspectionNo: detail.inspectionNo || '',
            registrationNo: detail.registrationNo || '',
            serialNo: detail.serialNo || '',
            productionDate: detail.productionDate || null,
            totalBoxes: detail.totalBoxes || null,
            amount: detail.amount || detail.totalPrice || 0,
            amountInWords: detail.amountInWords || '',
            usagePeriod: detail.usagePeriod || '',
            manufacturer: detail.manufacturer || '',
            manufacturerContact: detail.manufacturerContact || '',
            dealer: detail.dealer || '',
            dealerContact: detail.dealerContact || '',
            packagingType: detail.packagingType || '',
            packagingStatus: detail.packagingStatus || '',
            packagingDamage: detail.packagingDamage || '',
            appearance: detail.appearance || '',
            accessories: detail.accessories || '',
            techParamMatch: detail.techParamMatch || '',
            manualCount: detail.manualCount || null,
            certificateCount: detail.certificateCount || null,
            packingListCount: detail.packingListCount || null,
            acceptanceFormCount: detail.acceptanceFormCount || null,
            acceptanceResult: detail.acceptanceResult || '',
            acceptanceDate: detail.acceptanceDate || null,
            categoryCode: detail.categoryCode || ''
          }));

          // 将明细列表添加到表单数据中
          const submitData = {
            ...formData,
            detailList: detailList
          };

          if (this.form.storageId != null) {
            updateEquipmentStorage(submitData).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addEquipmentStorage(submitData).then(response => {
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
      // 如果传入的是行对象，检查是否已审核
      if (row && row.storageStatus === '2') {
        this.$modal.msgWarning('已审核的单据不能删除');
        return;
      }

      // 如果通过工具栏删除，检查选中的单据
      if (!row && this.ids && this.ids.length > 0) {
        const selectedRows = this.storageList.filter(item => this.ids.includes(item.storageId));
        const hasAudited = selectedRows.some(item => item.storageStatus === '2');
        if (hasAudited) {
          this.$modal.msgWarning('选中的单据中包含已审核的单据，不能删除');
          return;
        }
      }

      const storageIds = row ? row.storageId : this.ids;
      this.$modal.confirm('是否确认删除设备入库编号为"' + storageIds + '"的数据项？').then(function() {
        return delEquipmentStorage(storageIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 审核按钮操作 */
    handleAudit(row) {
      const storageId = row.storageId || this.ids[0];
      const storageNo = row.storageNo || '';
      this.$modal.confirm('是否确认审核设备入库单号为"' + storageNo + '"的数据项？').then(() => {
        return auditEquipmentStorage(storageId);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("审核成功");
      }).catch(() => {});
    }
  }
};
</script>

<style scoped lang="scss">
/* 查询条件容器样式 */
.query-container {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  border: 1px solid #EBEEF5;
}

/* 查询表单样式 - 参考入库审核页面 */
.query-container .el-form .query-row-left .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.query-container .el-form .query-row-left .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.query-container .el-form .query-row-left .query-item-inline:last-child {
  margin-right: 0;
}

/* 统一控制查询条件输入框宽度 */
.query-container .el-form .query-row-left .query-item-inline .el-input {
  width: 180px;
}

.query-container .el-form .query-row-left .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.query-container .el-form .query-row-left .query-item-inline .query-select-wrapper > * {
  width: 100%;
}

.query-container .el-form .query-row-left .query-item-inline .el-select {
  width: 150px;
}

/* 第二行单据状态对齐 */
.query-container .el-form .query-row-second {
  position: relative;
}

/* 确保制单日期的两个日期选择器在同一行 */
.query-container .el-form .query-row-second .el-form-item {
  white-space: nowrap;
}

.query-container .el-form .query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.query-container .el-form .query-row-second .query-status-col {
  position: absolute;
  left: 552px;
  width: auto;
  padding-left: 0;
  padding-right: 0;
}

/* 主表格滚动条样式 */
::v-deep .el-table .el-table__body-wrapper::-webkit-scrollbar,
::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 16px !important;
  height: 8px !important;
}

::v-deep .el-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1 !important;
  border-radius: 8px !important;
}

::v-deep .el-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8 !important;
}

::v-deep .el-table .el-table__body-wrapper::-webkit-scrollbar-track,
::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 8px !important;
}

/* 全屏弹窗样式 - 在容器内显示 */
.app-container {
  position: relative;
}

.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 2000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 80px);
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
  padding: 0;
  font-size: 18px;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

/* 表单字段容器 */
.form-fields-container {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  border: 1px solid #EBEEF5;
  flex-shrink: 0;
}

/* 按钮栏 - 放在两个框中间靠左边 */
.modal-button-bar {
  padding: 12px 0;
  padding-left: 0;
  text-align: left;
  flex-shrink: 0;
  margin-top: -10px;
}

.modal-button-bar .el-button {
  margin-right: 12px;
}

/* 明细表格容器 */
.detail-table-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  background: #fff;
  margin-top: -10px;
}

.detail-table-container .el-table {
  flex: 1;
  overflow: hidden;
}

.detail-table-container .el-table__body-wrapper {
  flex: 1;
  overflow-y: auto;
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

/* 添加明细弹窗样式 - 在容器内显示 */
.detail-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 3000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 0;
}

.detail-modal-content {
  background: #fff;
  width: 99.7%;
  height: calc(98.5% - 5px);
  min-height: 880px;
  max-height: calc(98.5vh - 5px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.detail-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #F5F7FA;
  flex-shrink: 0;
  min-height: 48px;
}

.detail-modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.detail-close-btn {
  padding: 8px 16px;
  font-size: 14px;
  border: 1px solid #DCDFE6;
  background: #fff;
}

.detail-close-btn:hover {
  background: #F5F7FA;
  border-color: #C0C4CC;
}

.detail-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.detail-search-container {
  margin-bottom: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
  flex-shrink: 0;
}

.detail-button-bar {
  padding: 12px 0;
  text-align: left;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.detail-button-bar .el-button {
  margin-right: 12px;
}

.detail-dialog-table-container {
  flex: 1;
  overflow: hidden;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
}

.detail-dialog-table-container .el-table {
  flex: 1;
  overflow: hidden;
}

.detail-dialog-table-container .el-table__body-wrapper {
  flex: 1;
  overflow-y: auto;
}

/* 增加输入框宽度 */
.form-fields-container .el-input,
.form-fields-container .el-select,
.form-fields-container .el-date-editor {
  width: 100% !important;
}

.close-btn {
  padding: 8px 16px;
  font-size: 14px;
}

/* 打印内容样式 */
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
}
</style>
