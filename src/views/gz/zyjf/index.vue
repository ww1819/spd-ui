<template>
  <div class="app-container hospital-scan-page">
    <div class="page-layout">
      <!-- 左侧搜索和列表区域 -->
      <div class="left-panel">
        <el-card class="search-card">
          <div slot="header" class="card-header">
            <span>搜索条件</span>
      </div>
          <el-form :model="queryParams" ref="queryForm" size="small" label-width="80px">
            <el-form-item label="住院号">
              <div style="display: flex; align-items: center; gap: 8px;">
              <el-input 
                  v-model="queryParams.hospitalNumber"
                  placeholder="请输入住院号"
                  clearable
                  @keyup.enter.native="handleQuery"
                  style="width: 60%"
                />
                <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery" style="width: 35%">
                  搜索
                </el-button>
              </div>
            </el-form-item>
            <el-form-item label="审核状态">
              <el-select v-model="queryParams.auditStatus" placeholder="全部" clearable style="width: 60%">
                <el-option label="全部" value="" />
                <el-option label="未审核" value="1" />
                <el-option label="已审核" value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="执行科室">
              <SelectDepartment v-model="queryParams.execDeptId" style="width: 60%" />
            </el-form-item>
            <el-form-item label="申请科室">
              <SelectDepartment v-model="queryParams.applyDeptId" style="width: 60%" />
            </el-form-item>
            <el-form-item label="日期">
              <div style="display: flex; align-items: center; width: 100%; gap: 4px; justify-content: flex-start;">
                <el-date-picker
                  v-model="queryParams.beginDate"
                  type="date"
                  value-format="yyyy-MM-dd"
                  placeholder="起"
                  clearable
                  style="width: 50%;"
                />
                <span style="flex-shrink: 0; margin: 0 4px;">至</span>
                <el-date-picker
                  v-model="queryParams.endDate"
                  type="date"
                  value-format="yyyy-MM-dd"
                  placeholder="止"
                  clearable
                  style="width: 50%;"
                />
              </div>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="list-card">
          <div slot="header" class="card-header">
            <span>订单列表</span>
          </div>
          <el-table
            :data="orderList"
            v-loading="loading"
            border
            height="calc(100vh - 380px)"
            highlight-current-row
            @current-change="handleRowClick"
            @row-click="handleRowClick"
          >
            <el-table-column label="操作" width="100" align="center">
              <template slot-scope="scope">
                <el-button
                  v-if="scope.row.orderStatus === 1"
                  type="text"
                  size="small"
                  icon="el-icon-delete"
                  style="color: #f56c6c;"
                  @click="handleDeleteOrder(scope.row)"
                >
                  删除
                </el-button>
                <el-button
                  v-if="scope.row.orderStatus === 2"
                  type="text"
                  size="small"
                  icon="el-icon-refresh-left"
                  style="color: #409eff;"
                  @click="handleUnauditOrder(scope.row)"
                >
                  反审核
                </el-button>
              </template>
            </el-table-column>
            <el-table-column label="状态" prop="orderStatus" width="100" align="center">
              <template slot-scope="scope">
                <el-tag v-if="scope.row.orderStatus === 1" type="warning">未审核</el-tag>
                <el-tag v-else-if="scope.row.orderStatus === 2" type="success">已审核</el-tag>
                <span v-else>--</span>
              </template>
            </el-table-column>
            <el-table-column label="单号" prop="traceNo" width="180" show-overflow-tooltip />
            <el-table-column label="住院号" prop="hospitalNumber" width="120" show-overflow-tooltip />
            <el-table-column label="姓名" prop="patientName" width="100" show-overflow-tooltip />
            <el-table-column label="申请科室" width="120" show-overflow-tooltip>
              <template slot-scope="scope">
                <span>{{ (scope.row.applyDept && scope.row.applyDept.name) || scope.row.applyDeptName || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="执行科室" width="120" show-overflow-tooltip>
              <template slot-scope="scope">
                <span>{{ (scope.row.execDept && scope.row.execDept.name) || scope.row.execDeptName || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="申请日期" prop="createTime" width="120" show-overflow-tooltip>
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>

      <!-- 右侧详情和明细区域 -->
      <div class="right-panel">
        <!-- 顶部操作按钮 -->
        <div class="action-bar">
          <el-input
            v-model="form.medicalRecordNo"
            placeholder="扫描/输入病历号"
            clearable
            style="width: 200px; margin-right: 10px;"
            @keyup.enter.native="handleMedicalRecordScan"
            ref="medicalRecordInput"
              >
                <i slot="prefix" class="el-icon-scan"></i>
              </el-input>
          <el-button type="primary" icon="el-icon-check" size="medium" :disabled="form.orderStatus === 2" @click="handleSave">
            保存
          </el-button>
          <el-button type="success" icon="el-icon-check" size="medium" :disabled="form.orderStatus === 2" @click="handleAudit">
            审核
          </el-button>
          <el-button type="warning" icon="el-icon-printer" size="medium" @click="handlePrintMaterialList">
            打印耗材清单
          </el-button>
          <el-button type="info" icon="el-icon-printer" size="medium" @click="handlePrintBarcodeList">
            打印条码清单
          </el-button>
        </div>

        <!-- 患者/订单信息表单 -->
        <el-card class="form-card">
          <div slot="header" class="card-header">
            <span>患者信息</span>
          </div>
          <el-form :model="form" ref="form" label-width="100px" size="small">
            <el-row :gutter="0" class="compact-row">
              <el-col :span="4" class="compact-col">
                <el-form-item label="姓名">
                  <el-input v-model="form.name" disabled style="width: 140px" />
            </el-form-item>
          </el-col>
              <el-col :span="4" class="compact-col">
                <el-form-item label="性别">
                  <el-input v-model="form.sex" disabled style="width: 80px" />
            </el-form-item>
          </el-col>
              <el-col :span="4" class="compact-col">
                <el-form-item label="年龄">
                  <el-input v-model="form.age" disabled style="width: 80px" />
            </el-form-item>
          </el-col>
              <el-col :span="4" class="compact-col">
                <el-form-item label="住院号">
                  <el-input v-model="form.hospitalNumber" disabled style="width: 100px" />
            </el-form-item>
          </el-col>
              <el-col :span="4" class="compact-col">
                <el-form-item label="病区">
                  <el-input v-model="form.ward" disabled style="width: 100px" />
            </el-form-item>
          </el-col>
              <el-col :span="4" class="compact-col">
                <el-form-item label="病房号">
                  <el-input v-model="form.wardNo" disabled style="width: 100px" />
            </el-form-item>
          </el-col>
        </el-row>
            <el-row :gutter="0" class="dept-row">
              <el-col :span="3.4" class="dept-col">
                <el-form-item label="申请科室" class="dept-form-item">
                  <SelectDepartment v-model="form.applyDeptId" style="width: 90px" />
            </el-form-item>
          </el-col>
              <el-col :span="3.4" class="dept-col">
                <el-form-item label="执行科室" class="dept-form-item">
                  <SelectDepartment v-model="form.execDeptId" style="width: 90px" />
            </el-form-item>
          </el-col>
              <el-col :span="3.4" class="dept-col">
                <el-form-item label="病床号" class="dept-form-item">
                  <el-input v-model="form.bedNo" disabled style="width: 90px" />
            </el-form-item>
          </el-col>
              <el-col :span="3.4" class="dept-col">
                <el-form-item label="住院日期" class="dept-form-item">
                  <el-date-picker
                    v-model="form.hospitalDate"
                    type="date"
                    value-format="yyyy-MM-dd"
                    disabled
                    style="width: 90px"
                  />
            </el-form-item>
          </el-col>
              <el-col :span="3.4" class="dept-col">
                <el-form-item label="联系电话" class="dept-form-item">
                  <el-input v-model="form.contactPhone" disabled style="width: 90px" />
            </el-form-item>
          </el-col>
              <el-col :span="3.4" class="dept-col">
                <el-form-item label="主刀医生" class="dept-form-item">
                  <el-input v-model="form.chiefSurgeon" disabled style="width: 90px" />
            </el-form-item>
          </el-col>
              <el-col :span="3.6" class="dept-col">
                <el-form-item label="手术日期" class="dept-form-item">
                  <el-date-picker
                    v-model="form.surgeryDate"
                    type="date"
                    value-format="yyyy-MM-dd"
                    disabled
                    style="width: 90px"
                  />
            </el-form-item>
          </el-col>
            </el-row>
            <el-row :gutter="12">
              <el-col :span="4.8">
                <el-form-item label="手术名称">
                  <el-input v-model="form.surgeryName" disabled style="width: 140px" />
            </el-form-item>
          </el-col>
              <el-col :span="4.8">
                <el-form-item label="入院诊断">
                  <el-input v-model="form.admissionDiagnosis" disabled style="width: 140px" />
            </el-form-item>
          </el-col>
              <el-col :span="4.8">
                <el-form-item label="手术ID">
                  <el-input v-model="form.surgeryId" disabled style="width: 100px" />
            </el-form-item>
          </el-col>
              <el-col :span="4.8">
                <el-form-item label="联系地址">
                  <el-input v-model="form.contactAddress" disabled style="width: 140px" />
            </el-form-item>
          </el-col>
              <el-col :span="4.8">
                <el-form-item label="备注">
                  <el-input v-model="form.remark" style="width: 140px" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

        <!-- 扫描条码号 -->
        <div class="scan-barcode">
      <el-input
            v-model="scanBarcodeNo"
            placeholder="扫描条码号"
            clearable
            :disabled="form.orderStatus === 2"
            style="width: 200px;"
            @keyup.enter.native="handleBarcodeScan"
          >
            <i slot="prefix" class="el-icon-scan"></i>
      </el-input>
        </div>

        <!-- 打印对话框 -->
        <PrintDialog
          :visible.sync="printDialogVisible"
          title="打印高值耗材清单"
        >
          <template slot="content">
            <div class="print-material-list">
              <!-- 标题 -->
              <div class="print-header">
                <el-button type="danger" size="small" @click="handlePrint" style="margin-bottom: 10px;">打印</el-button>
                <h2 class="print-title">汉寿县人民医院-高值耗材使用清单</h2>
                <div class="print-page-info">共1页</div>
              </div>

              <!-- 患者信息 -->
              <div class="print-patient-info">
                <div class="patient-info-left">
                  <div class="info-item">
                    <span class="info-label">住院号：</span>
                    <span class="info-value">{{ form.hospitalNumber || '--' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">年龄：</span>
                    <span class="info-value">{{ form.age || '--' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">入院诊断：</span>
                    <span class="info-value">{{ form.admissionDiagnosis || '--' }}</span>
                  </div>
                </div>
                <div class="patient-info-middle">
                  <div class="info-item">
                    <span class="info-label">姓名：</span>
                    <span class="info-value">{{ form.name || '--' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">科室：</span>
                    <span class="info-value">{{ form.ward || '--' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">手术名称：</span>
                    <span class="info-value">{{ form.surgeryName || '--' }}</span>
                  </div>
                </div>
                <div class="patient-info-right">
                  <div class="info-item">
                    <span class="info-label">性别：</span>
                    <span class="info-value">{{ form.sex || '--' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">病床号：</span>
                    <span class="info-value">{{ form.bedNo || '--' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">制单日期：</span>
                    <span class="info-value">{{ formatDate(new Date()) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">住院日期：</span>
                    <span class="info-value">{{ formatDateTime(form.hospitalDate) || '--' }}</span>
                  </div>
        </div>
      </div>
      
              <!-- 耗材明细表格 -->
              <div class="print-material-table">
                <table class="material-table">
                  <thead>
                    <tr>
                      <th>产品名称</th>
                      <th>规格</th>
                      <th>生产厂家</th>
                      <th>批号</th>
                      <th>供货价</th>
                      <th>数量</th>
                      <th>金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in materialDetailList" :key="index">
                      <td>{{ item.materialName || '--' }}</td>
                      <td>{{ item.specification || '--' }}</td>
                      <td>{{ item.manufacturer || '--' }}</td>
                      <td>{{ item.batchNo || '--' }}</td>
                      <td>{{ item.chargePrice || '0' }}</td>
                      <td>{{ item.quantity || '0' }}</td>
                      <td>{{ ((parseFloat(item.chargePrice) || 0) * (parseFloat(item.quantity) || 0)).toFixed(2) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- 签名和合计 -->
              <div class="print-footer">
                <div class="signature-section">
                  <div class="signature-item">
                    <span class="signature-label">护士/护士长签字：</span>
                    <span class="signature-line"></span>
                  </div>
                  <div class="signature-item">
                    <span class="signature-label">主刀医生签字：</span>
                    <span class="signature-line"></span>
                  </div>
                </div>
                <div class="total-section">
                  <div class="total-item">
                    <span class="total-label">合计数量：</span>
                    <span class="total-value">{{ getTotalQuantity() }}</span>
                  </div>
                  <div class="total-item">
                    <span class="total-label">合计金额：</span>
                    <span class="total-value">{{ getTotalAmount().toFixed(2) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </PrintDialog>

        <!-- 打印条码清单对话框 -->
        <PrintDialog
          :visible.sync="printBarcodeDialogVisible"
          title="打印高值耗材条码清单"
        >
          <template slot="content">
            <div class="print-barcode-list">
              <div v-for="(item, index) in materialDetailList" :key="index" class="barcode-page">
                <!-- 标题 -->
                <div class="barcode-header">
                  <el-button type="danger" size="small" @click="handlePrint" style="margin-bottom: 10px;" v-if="index === 0">打印</el-button>
                  <h2 class="barcode-title">汉寿县人民医院-高值耗材随病历存档清单</h2>
                  <div class="barcode-page-info">共{{ materialDetailList.length }}页</div>
                </div>

                <!-- 患者信息 -->
                <div class="barcode-patient-info">
                  <div class="barcode-info-left">
                    <div class="barcode-info-item">
                      <span class="barcode-info-label">住院号：</span>
                      <span class="barcode-info-value">{{ form.hospitalNumber || '--' }}</span>
                    </div>
                    <div class="barcode-info-item">
                      <span class="barcode-info-label">年 龄：</span>
                      <span class="barcode-info-value">{{ form.age || '--' }}</span>
                    </div>
                    <div class="barcode-info-item">
                      <span class="barcode-info-label">入院诊断：</span>
                      <span class="barcode-info-value">{{ form.admissionDiagnosis || '--' }}</span>
                    </div>
                  </div>
                  <div class="barcode-info-middle">
                    <div class="barcode-info-item">
                      <span class="barcode-info-label">姓 名：</span>
                      <span class="barcode-info-value">{{ form.name || '--' }}</span>
                    </div>
                    <div class="barcode-info-item">
                      <span class="barcode-info-label">科 室：</span>
                      <span class="barcode-info-value">{{ form.ward || '--' }}</span>
                    </div>
                    <div class="barcode-info-item">
                      <span class="barcode-info-label">手术名称：</span>
                      <span class="barcode-info-value">{{ form.surgeryName || '--' }}</span>
                    </div>
                  </div>
                  <div class="barcode-info-right">
                    <div class="barcode-info-item">
                      <span class="barcode-info-label">性 别：</span>
                      <span class="barcode-info-value">{{ form.sex || '--' }}</span>
                    </div>
                    <div class="barcode-info-item">
                      <span class="barcode-info-label">病床号：</span>
                      <span class="barcode-info-value">{{ form.bedNo || '--' }}</span>
                    </div>
                    <div class="barcode-info-item">
                      <span class="barcode-info-label">制单日期：</span>
                      <span class="barcode-info-value">{{ formatDate(new Date()) }}</span>
                    </div>
                    <div class="barcode-info-item">
                      <span class="barcode-info-label">住院日期：</span>
                      <span class="barcode-info-value">{{ formatDateTime(form.hospitalDate) || '--' }}</span>
                    </div>
                  </div>
                </div>

                <!-- 耗材信息框 -->
                <div class="barcode-material-box">
                  <div class="barcode-material-left">
                    <div class="barcode-material-item">
                      <span class="barcode-material-label">名称：</span>
                      <span class="barcode-material-value">{{ item.materialName || '--' }}</span>
                    </div>
                    <div class="barcode-material-item">
                      <span class="barcode-material-label">型号：</span>
                      <span class="barcode-material-value">{{ item.model || '--' }}</span>
                    </div>
                    <div class="barcode-material-item">
                      <span class="barcode-material-label">证号：</span>
                      <span class="barcode-material-value">{{ item.certificateNo || '--' }}</span>
                    </div>
                    <div class="barcode-material-item">
                      <span class="barcode-material-label">批号：</span>
                      <span class="barcode-material-value">{{ item.batchNo || '--' }}</span>
                    </div>
                    <div class="barcode-material-item">
                      <span class="barcode-material-label">效期：</span>
                      <span class="barcode-material-value">{{ formatDate(item.expiryDate) || '--' }}</span>
                    </div>
                    <div class="barcode-material-item">
                      <span class="barcode-material-label">条码号：</span>
                      <span class="barcode-material-value">{{ item.inHospitalCode || item.barcodeNo || '--' }}</span>
                    </div>
                    <div class="barcode-image">
                      <img 
                        v-if="item.inHospitalCode || item.barcodeNo"
                        :src="getBarcodeImageUrl(item.inHospitalCode || item.barcodeNo)"
                        alt="条码"
                        class="barcode-img"
                      />
                    </div>
                  </div>
                  <div class="barcode-material-right">
                    <div class="check-icon">检</div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </PrintDialog>

        <!-- 耗材明细表格 -->
        <el-card class="detail-card">
          <div slot="header" class="card-header">
            <span>耗材明细</span>
          </div>
      <el-table 
            :data="materialDetailList"
        border
            height="calc(100vh - 850px)"
        style="width: 100%"
      >
            <el-table-column label="操作" width="80" align="center" fixed="left">
              <template slot-scope="scope">
            <el-button
                  type="text"
              size="small"
                  icon="el-icon-delete"
                  :disabled="form.orderStatus === 2"
                  @click="handleDeleteMaterial(scope.$index)"
                >
                  删除
                </el-button>
          </template>
        </el-table-column>
            <el-table-column label="跟台" prop="billingFollow" width="80" align="center">
              <template slot-scope="scope">
                <el-checkbox v-model="scope.row.billingFollow" :disabled="form.orderStatus === 2" />
          </template>
        </el-table-column>
            <el-table-column label="序号" width="80" align="center">
              <template slot-scope="scope">
                {{ scope.$index + 1 }}
              </template>
            </el-table-column>
            <el-table-column label="耗材名称" prop="materialName" width="150" show-overflow-tooltip />
            <el-table-column label="规格" prop="specification" width="120" show-overflow-tooltip />
            <el-table-column label="型号" prop="model" width="120" show-overflow-tooltip />
            <el-table-column label="数量" prop="quantity" width="80" align="center" />
            <el-table-column label="收费价" prop="chargePrice" width="100" align="right">
              <template slot-scope="scope">
                <span>{{ scope.row.chargePrice ? parseFloat(scope.row.chargePrice).toFixed(2) : '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="单位" prop="unit" width="80" show-overflow-tooltip>
              <template slot-scope="scope">
                <span>{{ (typeof scope.row.unit === 'string' ? scope.row.unit : (scope.row.unit && scope.row.unit.unitName ? scope.row.unit.unitName : scope.row.unit)) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="批号" prop="batchNo" width="120" show-overflow-tooltip />
            <el-table-column label="有效期" prop="expiryDate" width="120" show-overflow-tooltip>
              <template slot-scope="scope">
                <span>{{ scope.row.expiryDate ? parseTime(scope.row.expiryDate, '{y}-{m}-{d}') : '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="院内码" prop="inHospitalCode" width="200" show-overflow-tooltip />
            <el-table-column label="生产厂家" prop="manufacturer" width="150" show-overflow-tooltip>
              <template slot-scope="scope">
                <span>{{ scope.row.manufacturer || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="供应商" prop="supplier" width="150" show-overflow-tooltip>
              <template slot-scope="scope">
                <span>{{ scope.row.supplier || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="注册证号" prop="certificateNo" width="150" show-overflow-tooltip>
              <template slot-scope="scope">
                <span>{{ scope.row.certificateNo || '--' }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
      </div>
    </div>
  </div>
</template>

<script>
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import { getPatientByMedicalRecordNo } from "@/api/gz/patient";
import { listGzDepInventory } from "@/api/gzDepartment/gzDepInventory";
import { addTraceability, listTraceability, auditTraceability, getTraceability, updateTraceability, delTraceability, unauditTraceability } from "@/api/gz/traceability";

export default {
  name: "HospitalScan",
  components: {
    SelectDepartment,
    PrintDialog: () => import('@/components/PrintDialog')
  },
  data() {
    return {
      loading: false,
      scanBarcodeNo: '',
      queryParams: {
        hospitalNumber: '',
        auditStatus: '',
        execDeptId: null,
        applyDeptId: null,
        beginDate: '',
        endDate: ''
      },
      orderList: [],
      form: {
        id: null,
        orderStatus: null,
        medicalRecordNo: '',
        name: '',
        sex: '',
        age: '',
        hospitalNumber: '',
        ward: '',
        wardNo: '',
        bedNo: '',
        applyDeptId: null,
        hospitalDate: '',
        contactPhone: '',
        contactAddress: '',
        execDeptId: null,
        chiefSurgeon: '',
        surgeryDate: '',
        surgeryName: '',
        admissionDiagnosis: '',
        surgeryId: '',
        remark: ''
      },
      materialDetailList: [],
      printDialogVisible: false,
      printBarcodeDialogVisible: false
    };
  },
  mounted() {
    this.handleQuery();
  },
  methods: {
    /** 搜索按钮操作 */
    handleQuery() {
      this.loading = true;
      const queryParams = {
        hospitalNumber: this.queryParams.hospitalNumber,
        orderStatus: this.queryParams.auditStatus || null,
        execDeptId: this.queryParams.execDeptId || null,
        applyDeptId: this.queryParams.applyDeptId || null,
        beginDate: this.queryParams.beginDate,
        endDate: this.queryParams.endDate
      };
      listTraceability(queryParams).then(response => {
        if (response.code === 200) {
          this.orderList = response.rows || [];
          this.loading = false;
        } else {
          this.orderList = [];
          this.loading = false;
        }
      }).catch(() => {
        this.orderList = [];
        this.loading = false;
      });
    },
    /** 行点击事件 */
    handleRowClick(row) {
      if (row && row.id) {
        getTraceability(row.id).then(response => {
          if (response.code === 200 && response.data) {
            this.loadTraceabilityData(response.data);
          } else {
            this.$message.error(response.msg || '获取追溯单详情失败');
          }
        }).catch(error => {
          console.error('获取追溯单详情失败:', error);
          this.$message.error('获取追溯单详情失败');
        });
      }
    },
    /** 订单选择变化事件 */
    handleOrderSelectionChange(selection) {
      this.selectedOrders = selection;
      // 如果只选择了一个订单，自动加载其明细
      if (selection && selection.length === 1) {
        const selectedOrder = selection[0];
        if (selectedOrder.id) {
          getTraceability(selectedOrder.id).then(response => {
            if (response.code === 200 && response.data) {
              this.loadTraceabilityData(response.data);
            }
          }).catch(error => {
            console.error('获取追溯单详情失败:', error);
          });
        }
      } else if (selection && selection.length > 1) {
        // 如果选择了多个订单，合并显示所有明细
        this.loadMultipleOrdersDetails(selection);
      } else {
        // 如果没有选择订单，清空明细
        this.materialDetailList = [];
      }
    },
    /** 加载多个订单的明细 */
    loadMultipleOrdersDetails(orders) {
      const promises = orders.map(order => {
        if (order.id) {
          return getTraceability(order.id);
        }
        return Promise.resolve(null);
      }).filter(p => p !== null);

      Promise.all(promises).then(responses => {
        const allDetails = [];
        responses.forEach((response, index) => {
          if (response && response.code === 200 && response.data && response.data.traceabilityEntryList) {
            const orderNo = orders[index].traceNo || '';
            response.data.traceabilityEntryList.forEach(entry => {
              allDetails.push({
                ...entry,
                orderNo: orderNo, // 添加单号标识
                billingFollow: entry.billingFollow === '1'
              });
            });
          }
        });
        this.materialDetailList = allDetails;
      }).catch(error => {
        console.error('获取多个订单明细失败:', error);
      });
    },
    /** 查看订单 */
    handleView(row) {
      this.handleRowClick(row);
    },
    /** 删除订单 */
    handleDeleteOrder(row) {
      this.$modal.confirm('是否确认删除追溯单号为"' + row.traceNo + '"的数据项？').then(() => {
        return delTraceability(row.id);
      }).then(() => {
        this.handleQuery();
        this.$modal.msgSuccess('删除成功');
        // 如果删除的是当前选中的订单，清空表单和明细
        if (this.form.id === row.id) {
          this.resetForm();
        }
      }).catch(() => {});
    },
    /** 反审核订单 */
    handleUnauditOrder(row) {
      this.$modal.confirm('是否确认反审核追溯单号为"' + row.traceNo + '"的数据项？').then(() => {
        return unauditTraceability(row.id);
      }).then(() => {
        this.handleQuery();
        this.$modal.msgSuccess('反审核成功');
        // 如果反审核的是当前选中的订单，重新加载数据
        if (this.form.id === row.id) {
          getTraceability(row.id).then(response => {
            if (response.code === 200 && response.data) {
              this.loadTraceabilityData(response.data);
            }
          });
        }
      }).catch(() => {});
    },
    /** 扫描/输入病历号 */
    handleMedicalRecordScan() {
      if (!this.form.medicalRecordNo || this.form.medicalRecordNo.trim() === '') {
        this.$message.warning('请输入病历号');
        return;
      }
      const medicalRecordNo = this.form.medicalRecordNo.trim();
      getPatientByMedicalRecordNo(medicalRecordNo).then(response => {
        if (response.code === 200 && response.data) {
          const patient = response.data;
          // 填充患者信息到表单
          this.form.name = patient.name || '';
          this.form.sex = patient.sex || '';
          this.form.age = patient.age ? String(patient.age) : '';
          this.form.hospitalNumber = patient.hospitalNumber || '';
          this.form.ward = patient.ward || '';
          this.form.wardNo = patient.wardNo || '';
          this.form.bedNo = patient.bedNo || '';
          this.form.applyDeptId = patient.applyDeptId || null;
          this.form.execDeptId = patient.execDeptId || null;
          this.form.hospitalDate = patient.hospitalDate || '';
          this.form.contactPhone = patient.contactPhone || '';
          this.form.contactAddress = patient.contactAddress || '';
          this.form.chiefSurgeon = patient.chiefSurgeon || '';
          this.form.surgeryDate = patient.surgeryDate || '';
          this.form.surgeryName = patient.surgeryName || '';
          this.form.admissionDiagnosis = patient.admissionDiagnosis || '';
          this.form.surgeryId = patient.surgeryId || '';
          this.form.remark = patient.remark || '';
          this.$message.success('患者信息加载成功');
        } else {
          this.$message.error(response.msg || '未找到该病历号对应的患者信息');
        }
      }).catch(error => {
        console.error('获取患者信息失败:', error);
        this.$message.error('获取患者信息失败，请稍后重试');
      });
    },
    /** 删除耗材 */
    handleDeleteMaterial(index) {
      if (this.form.orderStatus === 2) {
        this.$message.warning('已审核的单据不能删除耗材');
        return;
      }
      this.materialDetailList.splice(index, 1);
    },
    /** 保存 */
    handleSave() {
      // 验证必填字段
      if (!this.form.medicalRecordNo || this.form.medicalRecordNo.trim() === '') {
        this.$message.warning('请先扫描/输入病历号');
        return;
      }
      if (!this.form.applyDeptId) {
        this.$message.warning('请选择申请科室');
        return;
      }
      if (!this.form.execDeptId) {
        this.$message.warning('请选择执行科室');
        return;
      }
      if (!this.materialDetailList || this.materialDetailList.length === 0) {
        this.$message.warning('请至少扫描一个耗材');
        return;
      }

      // 构建追溯单数据
      const traceabilityData = {
        id: this.form.id, // 如果有ID，则是修改；如果没有，则是新增
        medicalRecordNo: this.form.medicalRecordNo,
        patientName: this.form.name,
        patientSex: this.form.sex,
        patientAge: this.form.age ? parseInt(this.form.age) : null,
        hospitalNumber: this.form.hospitalNumber,
        ward: this.form.ward,
        wardNo: this.form.wardNo,
        bedNo: this.form.bedNo,
        applyDeptId: this.form.applyDeptId,
        execDeptId: this.form.execDeptId,
        hospitalDate: this.form.hospitalDate,
        contactPhone: this.form.contactPhone,
        contactAddress: this.form.contactAddress,
        chiefSurgeon: this.form.chiefSurgeon,
        surgeryDate: this.form.surgeryDate,
        surgeryName: this.form.surgeryName,
        admissionDiagnosis: this.form.admissionDiagnosis,
        surgeryId: this.form.surgeryId,
        remark: this.form.remark,
        traceabilityEntryList: this.materialDetailList.map(item => ({
          materialId: item.materialId,
          inventoryId: item.inventoryId,
          materialName: item.materialName,
          specification: item.specification,
          model: item.model,
          unit: item.unit,
          quantity: parseFloat(item.quantity) || 0,
          chargePrice: parseFloat(item.chargePrice) || 0,
          batchNo: item.batchNo,
          expiryDate: item.expiryDate,
          inHospitalCode: item.inHospitalCode,
          manufacturer: item.manufacturer,
          supplier: item.supplier,
          certificateNo: item.certificateNo,
          billingFollow: item.billingFollow ? '1' : '0'
        }))
      };

      // 判断是新增还是修改
      if (this.form.id) {
        // 修改
        updateTraceability(traceabilityData).then(response => {
          if (response.code === 200) {
            this.$message.success('修改成功');
            // 刷新订单列表
            this.handleQuery();
          } else {
            this.$message.error(response.msg || '修改失败');
          }
        }).catch(error => {
          console.error('修改失败:', error);
          this.$message.error('修改失败，请稍后重试');
        });
      } else {
        // 新增
        addTraceability(traceabilityData).then(response => {
          if (response.code === 200) {
            this.$message.success('保存成功');
            // 清空表单和明细列表
            this.resetForm();
            // 刷新订单列表
            this.handleQuery();
          } else {
            this.$message.error(response.msg || '保存失败');
          }
        }).catch(error => {
          console.error('保存失败:', error);
          this.$message.error('保存失败，请稍后重试');
        });
      }
    },
    /** 重置表单 */
    resetForm() {
      this.form = {
        id: null,
        orderStatus: null,
        medicalRecordNo: '',
        name: '',
        sex: '',
        age: '',
        hospitalNumber: '',
        ward: '',
        wardNo: '',
        bedNo: '',
        applyDeptId: null,
        hospitalDate: '',
        contactPhone: '',
        contactAddress: '',
        execDeptId: null,
        chiefSurgeon: '',
        surgeryDate: '',
        surgeryName: '',
        admissionDiagnosis: '',
        surgeryId: '',
        remark: ''
      };
      this.materialDetailList = [];
      this.scanBarcodeNo = '';
    },
    /** 审核 */
    handleAudit() {
      if (!this.form.id) {
        this.$message.warning('请先选择要审核的追溯单');
        return;
      }
      this.$modal.confirm('是否确认审核该追溯单？').then(() => {
        auditTraceability(this.form.id).then(response => {
          if (response.code === 200) {
            this.$message.success('审核成功');
            // 刷新订单列表
            this.handleQuery();
            // 重新加载当前追溯单数据
            if (this.form.id) {
              getTraceability(this.form.id).then(res => {
                if (res.code === 200 && res.data) {
                  this.loadTraceabilityData(res.data);
                }
              });
            }
          } else {
            this.$message.error(response.msg || '审核失败');
          }
        }).catch(error => {
          console.error('审核失败:', error);
          this.$message.error('审核失败，请稍后重试');
        });
      }).catch(() => {});
    },
    /** 加载追溯单数据到表单 */
    loadTraceabilityData(data) {
      this.form.id = data.id;
      this.form.orderStatus = data.orderStatus || null;
      this.form.medicalRecordNo = data.medicalRecordNo || '';
      this.form.name = data.patientName || '';
      this.form.sex = data.patientSex || '';
      this.form.age = data.patientAge ? String(data.patientAge) : '';
      this.form.hospitalNumber = data.hospitalNumber || '';
      this.form.ward = data.ward || '';
      this.form.wardNo = data.wardNo || '';
      this.form.bedNo = data.bedNo || '';
      this.form.applyDeptId = data.applyDeptId || null;
      this.form.execDeptId = data.execDeptId || null;
      this.form.hospitalDate = data.hospitalDate || '';
      this.form.contactPhone = data.contactPhone || '';
      this.form.contactAddress = data.contactAddress || '';
      this.form.chiefSurgeon = data.chiefSurgeon || '';
      this.form.surgeryDate = data.surgeryDate || '';
      this.form.surgeryName = data.surgeryName || '';
      this.form.admissionDiagnosis = data.admissionDiagnosis || '';
      this.form.surgeryId = data.surgeryId || '';
      this.form.remark = data.remark || '';
      
      // 加载明细列表
      if (data.traceabilityEntryList && data.traceabilityEntryList.length > 0) {
        this.materialDetailList = data.traceabilityEntryList.map(item => ({
          materialId: item.materialId,
          inventoryId: item.inventoryId,
          materialName: item.materialName,
          specification: item.specification,
          model: item.model,
          unit: item.unit,
          quantity: item.quantity,
          chargePrice: item.chargePrice,
          batchNo: item.batchNo,
          expiryDate: item.expiryDate,
          inHospitalCode: item.inHospitalCode,
          manufacturer: item.manufacturer,
          supplier: item.supplier,
          certificateNo: item.certificateNo,
          billingFollow: item.billingFollow === '1'
        }));
      } else {
        this.materialDetailList = [];
      }
    },
    /** 打印耗材清单 */
    handlePrintMaterialList() {
      if (!this.form.hospitalNumber) {
        this.$message.warning('请先选择患者信息');
        return;
      }
      if (!this.materialDetailList || this.materialDetailList.length === 0) {
        this.$message.warning('没有耗材明细数据');
        return;
      }
      this.printDialogVisible = true;
    },
    /** 计算合计数量 */
    getTotalQuantity() {
      return this.materialDetailList.reduce((sum, item) => {
        return sum + (parseFloat(item.quantity) || 0);
      }, 0);
    },
    /** 计算合计金额 */
    getTotalAmount() {
      return this.materialDetailList.reduce((sum, item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.chargePrice) || 0;
        return sum + (quantity * price);
      }, 0);
    },
    /** 格式化日期 */
    formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    /** 格式化日期时间 */
    formatDateTime(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    /** 打印条码清单 */
    handlePrintBarcodeList() {
      if (!this.form.hospitalNumber) {
        this.$message.warning('请先选择患者信息');
        return;
      }
      if (!this.materialDetailList || this.materialDetailList.length === 0) {
        this.$message.warning('没有耗材明细数据');
        return;
      }
      this.printBarcodeDialogVisible = true;
    },
    /** 扫描条码号 */
    handleBarcodeScan() {
      // 验证订单状态
      if (this.form.orderStatus === 2) {
        this.$message.warning('已审核的单据不能扫描条码');
        return;
      }
      // 验证条码号是否输入
      if (!this.scanBarcodeNo || this.scanBarcodeNo.trim() === '') {
        this.$message.warning('请输入条码号');
        return;
      }

      // 验证申请科室是否已选择
      if (!this.form.applyDeptId) {
        this.$message.warning('请先选择申请科室');
        return;
      }

      // 验证执行科室是否已选择
      if (!this.form.execDeptId) {
        this.$message.warning('请先选择执行科室');
        return;
      }

      const inHospitalCode = this.scanBarcodeNo.trim();
      const execDeptId = this.form.execDeptId;

      // 查询该执行科室的库存
      const queryParams = {
        departmentId: execDeptId,
        inHospitalCode: inHospitalCode,
        pageNum: 1,
        pageSize: 10
      };

      listGzDepInventory(queryParams).then(response => {
        if (response.code === 200) {
          const inventoryList = response.rows || [];
          if (inventoryList.length === 0) {
            this.$message.error('这个科室没有这个库存！请核对。');
            // 清空条码号输入框
            this.scanBarcodeNo = '';
          } else {
            // 找到库存，将第一条库存信息添加到耗材明细列表
            const inventory = inventoryList[0];
            
            // 检查是否已存在相同的院内码
            const existIndex = this.materialDetailList.findIndex(item => 
              item.inHospitalCode === inventory.inHospitalCode
            );
            
            if (existIndex >= 0) {
              // 如果已存在，提示并增加数量
              this.$message.warning('该条码已存在，已增加数量');
              const existItem = this.materialDetailList[existIndex];
              existItem.quantity = (parseFloat(existItem.quantity) || 0) + (parseFloat(inventory.qty) || 1);
            } else {
              // 如果不存在，添加新记录
              const materialDetail = {
                billingFollow: false, // 跟台
                materialName: inventory.material && inventory.material.name ? inventory.material.name : '--', // 耗材名称
                specification: inventory.material && inventory.material.speci ? inventory.material.speci : '--', // 规格
                model: inventory.material && inventory.material.model ? inventory.material.model : '--', // 型号
                quantity: inventory.qty || 1, // 数量
                chargePrice: inventory.unitPrice || 0, // 收费价（使用单价）
                unit: inventory.material && inventory.material.fdUnit && inventory.material.fdUnit.unitName 
                  ? inventory.material.fdUnit.unitName : '--', // 单位
                batchNo: inventory.materialNo || inventory.batchNo || '--', // 批号
                expiryDate: inventory.endTime || '', // 有效期
                inHospitalCode: inventory.inHospitalCode || inHospitalCode, // 院内码
                manufacturer: inventory.material && inventory.material.fdFactory && inventory.material.fdFactory.factoryName 
                  ? inventory.material.fdFactory.factoryName : '--', // 生产厂家
                supplier: inventory.material && inventory.material.supplier && inventory.material.supplier.name 
                  ? inventory.material.supplier.name : '--', // 供应商
                certificateNo: inventory.material && inventory.material.registerNo ? inventory.material.registerNo : '--', // 注册证号
                barcodeNo: inventory.inHospitalCode || inHospitalCode, // 条码号（用于打印）
                materialId: inventory.materialId || inventory.material?.id, // 耗材ID（用于保存）
                inventoryId: inventory.id // 库存ID（用于保存，必须设置）
              };
              
              this.materialDetailList.push(materialDetail);
              this.$message.success('条码扫描成功，已添加到耗材明细');
            }
            
            // 清空条码号输入框
            this.scanBarcodeNo = '';
          }
        } else {
          this.$message.error(response.msg || '查询库存失败');
          this.scanBarcodeNo = '';
        }
      }).catch(error => {
        console.error('查询库存失败:', error);
        this.$message.error('查询库存失败，请稍后重试');
        this.scanBarcodeNo = '';
      });
    },
    /** 执行打印 */
    handlePrint() {
      window.print();
    },
    /** 获取条码图片URL */
    getBarcodeImageUrl(barcode) {
      if (!barcode) return '';
      // 使用在线条码生成服务，这里使用Code128格式
      return `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(barcode)}&code=Code128&dpi=96&dataseparator=`;
    }
  }
};
</script>

<style lang="scss" scoped>
.hospital-scan-page {
  height: calc(100vh - 84px);
  padding: 20px 20px 20px 15px;
  box-sizing: border-box;
  overflow: hidden;
}

.page-layout {
  display: flex;
  height: 100%;
  gap: 16px;
  margin-left: -5px;
}

.left-panel {
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 16px;
    flex-shrink: 0;
}
    
.right-panel {
  flex: 1;
      display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  margin-left: -8px;
  flex-grow: 1;
}

.search-card,
.list-card,
.form-card,
.scan-card,
.detail-card {
  ::v-deep .el-card__body {
    padding: 16px;
  }
}

.card-header {
  font-weight: 500;
  font-size: 14px;
}

.search-card {
    flex-shrink: 0;
  margin-top: -10px;
}
    
.list-card {
  flex: 1;
      display: flex;
  flex-direction: column;
  min-height: 0;
  margin-top: -8px;
  
  ::v-deep .el-card__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 16px;
  }
}
    
.action-bar {
      display: flex;
  gap: 10px;
      flex-shrink: 0;
  padding: 0;
  margin-top: -10px;
}
      
.scan-medical-record,
.scan-barcode {
  flex-shrink: 0;
  padding: 8px 0;
        display: flex;
        align-items: center;
  width: 100%;
  margin-top: -16px !important;
  margin-bottom: 0 !important;
}

.form-card {
  flex-shrink: 0;
  margin-top: -10px;
  
  ::v-deep .el-form-item {
    margin-bottom: 12px;
    display: block;
  }
  
  ::v-deep .el-form-item__label {
    padding-right: 6px;
    font-size: 13px;
    white-space: nowrap;
    float: left;
    width: 100px;
    text-align: right;
    line-height: 32px;
  }
  
  ::v-deep .el-form-item__content {
    margin-left: 100px !important;
    line-height: 32px;
  }
  
  ::v-deep .el-row {
    display: flex;
    flex-wrap: nowrap;
    width: 100%;
  }
  
  ::v-deep .el-col {
    flex-shrink: 0;
  }
  
  ::v-deep .compact-row {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
  
  ::v-deep .compact-row > .compact-col:first-child {
    padding-left: 0 !important;
    padding-right: 4px !important;
  }
  
  ::v-deep .compact-row > .compact-col:nth-child(2) {
    padding-left: 4px !important;
    padding-right: 4px !important;
  }
  
  ::v-deep .compact-row > .compact-col:nth-child(3) {
    padding-left: 4px !important;
    padding-right: 4px !important;
  }
  
  ::v-deep .compact-row > .compact-col:nth-child(4) {
    padding-left: 4px !important;
    padding-right: 4px !important;
  }
  
  ::v-deep .compact-row > .compact-col:nth-child(5) {
    padding-left: 4px !important;
    padding-right: 4px !important;
  }
  
  ::v-deep .compact-row > .compact-col:nth-child(6) {
    padding-left: 4px !important;
    padding-right: 0 !important;
  }
  
  ::v-deep .dept-row {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
  
  ::v-deep .dept-row > .dept-col {
    padding-left: 2px !important;
    padding-right: 2px !important;
  }
  
  ::v-deep .dept-row > .dept-col:first-child {
    padding-left: 0 !important;
    padding-right: 2px !important;
  }
  
  ::v-deep .dept-row > .dept-col:last-child {
    padding-left: 2px !important;
    padding-right: 0 !important;
  }
  
  ::v-deep .dept-form-item .el-form-item__label {
    width: 80px !important;
    font-size: 12px !important;
    padding-right: 4px !important;
  }
  
  ::v-deep .dept-form-item .el-form-item__content {
    margin-left: 80px !important;
  }
  
  ::v-deep .el-input,
  ::v-deep .el-date-picker,
  ::v-deep .el-select {
    width: 100%;
  }
}

.detail-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin-top: -16px !important;
    
    ::v-deep .el-card__body {
    flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    padding: 16px;
  }
    }
    
    ::v-deep .el-table {
      flex: 1;
      overflow: auto;
    }
    
    ::v-deep .el-table__body-wrapper {
      overflow-y: auto;
    }

/* 增粗底部滚动条 */
::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 16px !important;
  height: 16px !important;
}

::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 8px !important;
}

::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1 !important;
  border-radius: 8px !important;
}

::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8 !important;
}

/* 订单列表滚动条 */
.list-card ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 16px !important;
  height: 16px !important;
}

.list-card ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 8px !important;
}

.list-card ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1 !important;
  border-radius: 8px !important;
}

.list-card ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8 !important;
}

/* 打印样式 */
.print-material-list {
  font-family: 'SimSun', '宋体', serif;
  font-size: 14px;
  line-height: 1.6;
  color: #000;
}

.print-header {
  text-align: center;
  margin-bottom: 20px;
  position: relative;
}

.print-title {
  font-size: 20px;
  font-weight: bold;
  margin: 10px 0;
  text-align: center;
}

.print-page-info {
  position: absolute;
  right: 0;
  top: 0;
  font-size: 12px;
}

.print-patient-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  border-bottom: 1px solid #000;
  padding-bottom: 10px;
}

.patient-info-left,
.patient-info-middle,
.patient-info-right {
  flex: 1;
}

.info-item {
  margin-bottom: 8px;
  display: flex;
}

.info-label {
  min-width: 80px;
  font-weight: normal;
}

.info-value {
  flex: 1;
}

.print-material-table {
  margin-bottom: 20px;
}

.material-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #000;
}

.material-table th,
.material-table td {
  border: 1px solid #000;
  padding: 8px;
  text-align: center;
}

.material-table th {
  background-color: #f0f0f0;
  font-weight: bold;
}

.print-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}

.signature-section {
  flex: 1;
}

.signature-item {
  margin-bottom: 30px;
  display: flex;
  align-items: center;
}

.signature-label {
  margin-right: 10px;
}

.signature-line {
  flex: 1;
  border-bottom: 1px solid #000;
  height: 20px;
}

.total-section {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.total-item {
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: bold;
}

.total-label {
  margin-right: 10px;
}

.total-value {
  min-width: 100px;
  text-align: right;
}

@media print {
  .print-material-list {
    font-size: 12px;
  }
  
  .print-title {
    font-size: 18px;
  }
  
  .material-table th,
  .material-table td {
    padding: 6px;
    font-size: 12px;
  }
}

/* 条码清单打印样式 */
.print-barcode-list {
  font-family: 'SimSun', '宋体', serif;
  font-size: 14px;
  line-height: 1.6;
  color: #000;
}

.barcode-page {
  page-break-after: always;
  margin-bottom: 20px;
}

.barcode-page:last-child {
  page-break-after: auto;
}

.barcode-header {
  text-align: center;
  margin-bottom: 20px;
  position: relative;
}

.barcode-title {
  font-size: 20px;
  font-weight: bold;
  margin: 10px 0;
  text-align: center;
}

.barcode-page-info {
  position: absolute;
  right: 0;
  top: 0;
  font-size: 12px;
}

.barcode-patient-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  border-bottom: 1px solid #000;
  padding-bottom: 10px;
}

.barcode-info-left,
.barcode-info-middle,
.barcode-info-right {
  flex: 1;
}

.barcode-info-item {
  margin-bottom: 8px;
  display: flex;
}

.barcode-info-label {
  min-width: 80px;
  font-weight: normal;
}

.barcode-info-value {
  flex: 1;
}

.barcode-material-box {
  border: 2px solid #000;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.barcode-material-left {
  flex: 1;
}

.barcode-material-item {
  margin-bottom: 10px;
  display: flex;
}

.barcode-material-label {
  min-width: 60px;
  font-weight: normal;
}

.barcode-material-value {
  flex: 1;
}

.barcode-image {
    margin-top: 15px;
    text-align: center;
}

.barcode-img {
  max-width: 300px;
  height: auto;
}

.barcode-material-right {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
}

.check-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
}

@media print {
  .print-barcode-list {
    font-size: 12px;
  }
  
  .barcode-title {
    font-size: 18px;
  }
  
  .barcode-page {
    page-break-after: always;
  }
  
  .barcode-page:last-child {
    page-break-after: auto;
  }
}
</style>