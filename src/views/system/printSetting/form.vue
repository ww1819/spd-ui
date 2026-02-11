<template>
  <div class="print-setting-form">
    <!-- 顶部操作按钮行：在左右两个框外面，单独一行 -->
    <div class="form-toolbar">
      <el-button type="primary" size="medium" @click="submitForm">保 存</el-button>
      <el-button size="medium" @click="refresh">刷 新</el-button>
    </div>
    <div class="dialog-layout">
      <!-- 左侧空白框，可后续扩展预览等信息 -->
      <div class="left-panel ruler-panel">
        <!-- 模板大小预览（标题隐藏） -->
        <div class="template-preview">
          <!-- 顶部水平尺子 -->
          <div class="ruler-horizontal-main">
            <div 
              v-for="i in horizontalRuler" 
              :key="'h-' + i" 
              :class="['ruler-mark-horizontal', i % 10 === 0 ? 'major' : 'minor']"
              :style="{ left: getHorizontalPosition(i) + 'px' }"
            >
              <span v-if="i % 10 === 0" class="ruler-number ruler-number-top">{{ i }}</span>
              <div class="ruler-tick" :class="i % 10 === 0 ? 'major' : 'minor'"></div>
            </div>
          </div>
          <!-- 左侧垂直尺子 -->
          <div class="ruler-vertical-main">
            <div 
              v-for="i in verticalRuler" 
              :key="'v-' + i" 
              :class="['ruler-mark-vertical', i % 10 === 0 ? 'major' : 'minor']"
              :style="{ top: getVerticalPosition(i) + 'px' }"
            >
              <span v-if="i % 10 === 0" class="ruler-number ruler-number-left">{{ i }}</span>
              <div class="ruler-tick" :class="i % 10 === 0 ? 'major' : 'minor'"></div>
            </div>
          </div>
          <!-- 预览内容区域 -->
          <div class="preview-container">
          <div 
            ref="previewPaper"
            class="preview-paper" 
            :style="previewStyle"
            @mousedown.stop="onPreviewMouseDown"
          >
            <div class="paper-content">
              <div class="template-preview-content">
                <div v-if="form.headerTitle" class="template-header">{{ form.headerTitle }}</div>
                <div v-if="form.title1" class="template-title">{{ form.title1 }}</div>
                <div v-if="form.title2" class="template-title">{{ form.title2 }}</div>
                <div v-if="form.title3" class="template-title">{{ form.title3 }}</div>
                <div v-if="form.title4" class="template-title">{{ form.title4 }}</div>
                <div v-if="form.title5" class="template-title">{{ form.title5 }}</div>
                <div v-if="form.title6" class="template-title">{{ form.title6 }}</div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
      <!-- 右侧内容框：放置所有表单字段 -->
      <div class="right-panel">
        <el-form ref="form" :model="form" :rules="rules" label-width="120px">
          <!-- 基本信息 -->
          <div class="section">
            <div class="section-title">基本信息</div>
          <el-form-item label="模板名称" prop="templateName">
            <el-input v-model="form.templateName" placeholder="请输入模板名称" />
          </el-form-item>
          <el-form-item label="单据类型" prop="billType">
            <el-select v-model="form.billType" placeholder="请选择单据类型" clearable style="width: 100%">
              <el-option label="入库单" :value="101" />
              <el-option label="退货单" :value="102" />
              <el-option label="出库单" :value="201" />
              <el-option label="退库单" :value="202" />
              <el-option label="盘点单" :value="301" />
              <el-option label="入库单(高值)" :value="111" />
              <el-option label="退货单(高值)" :value="112" />
              <el-option label="出库单(高值)" :value="211" />
              <el-option label="退库单(高值)" :value="212" />
              <el-option label="跟台条码" :value="401" />
              <el-option label="备货条码" :value="402" />
            </el-select>
          </el-form-item>
          <el-form-item label="是否默认">
            <el-radio-group v-model="form.isDefault">
              <el-radio :label="1">是</el-radio>
              <el-radio :label="0">否</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="form.status">
              <el-radio label="0">正常</el-radio>
              <el-radio label="1">停用</el-radio>
            </el-radio-group>
          </el-form-item>
          </div>

          <!-- 页面设置 -->
          <div class="section">
            <div class="section-title">页面设置</div>
          <el-form-item label="页面方向" prop="orientation">
            <el-radio-group v-model="form.orientation">
              <el-radio label="portrait">纵向</el-radio>
              <el-radio label="landscape">横向</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="页面宽度(mm)" prop="pageWidth">
                <el-input-number v-model="form.pageWidth" :min="50" :max="1000" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="页面高度(mm)" prop="pageHeight">
                <el-input-number v-model="form.pageHeight" :min="50" :max="1000" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="上边距(mm)" prop="marginTop">
                <el-input-number v-model="form.marginTop" :min="0" :max="100" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="下边距(mm)" prop="marginBottom">
                <el-input-number v-model="form.marginBottom" :min="0" :max="100" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="左边距(mm)" prop="marginLeft">
                <el-input-number v-model="form.marginLeft" :min="0" :max="100" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="右边距(mm)" prop="marginRight">
                <el-input-number v-model="form.marginRight" :min="0" :max="100" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          </div>

          <!-- 字体设置 -->
          <div class="section">
            <div class="section-title">字体设置</div>
          <el-row :gutter="20" class="font-inline-row">
            <el-col :span="8">
              <el-form-item label="字体大小" prop="fontSize">
                <el-input
                  v-model.number="form.fontSize"
                  placeholder="标题字号"
                  class="font-inline-input"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="字体加粗" prop="fontBold">
                <el-switch
                  v-model="form.fontBold"
                  active-text=""
                  inactive-text=""
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="列间距(mm)" prop="columnSpacing">
                <el-input
                  v-model.number="form.columnSpacing"
                  placeholder="列间距"
                  class="font-inline-input"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="字体格式">
            <el-select v-model="form.fontFamily" placeholder="请选择字体">
              <el-option label="系统默认" value="" />
              <el-option label="微软雅黑" value="Microsoft YaHei" />
              <el-option label="宋体" value="SimSun" />
              <el-option label="黑体" value="SimHei" />
              <el-option label="Arial" value="Arial" />
              <el-option label="Times New Roman" value="Times New Roman" />
            </el-select>
          </el-form-item>
          <el-form-item label="字体颜色">
            <el-color-picker v-model="form.fontColor" show-alpha />
          </el-form-item>
          <el-form-item label="">
            <div class="text-align-toolbar">
              <el-tooltip content="左对齐" placement="top">
                <span
                  class="align-icon align-left"
                  :class="{ active: form.textAlign === 'left' }"
                  @click="form.textAlign = 'left'"
                ></span>
              </el-tooltip>
              <el-tooltip content="居中对齐" placement="top">
                <span
                  class="align-icon align-center"
                  :class="{ active: form.textAlign === 'center' }"
                  @click="form.textAlign = 'center'"
                ></span>
              </el-tooltip>
              <el-tooltip content="右对齐" placement="top">
                <span
                  class="align-icon align-right"
                  :class="{ active: form.textAlign === 'right' }"
                  @click="form.textAlign = 'right'"
                ></span>
              </el-tooltip>
              <el-tooltip content="两端对齐" placement="top">
                <span
                  class="align-icon align-justify"
                  :class="{ active: form.textAlign === 'justify' }"
                  @click="form.textAlign = 'justify'"
                ></span>
              </el-tooltip>
              <el-tooltip content="分散对齐" placement="top">
                <span
                  class="align-icon align-distribute"
                  :class="{ active: form.textAlign === 'distribute' }"
                  @click="form.textAlign = 'distribute'"
                ></span>
              </el-tooltip>
            </div>
          </el-form-item>
          <el-form-item label="">
            <div class="spacing-inline-row">
              <span class="spacing-label">字间距</span>
              <el-input
                v-model.number="form.wordSpacing"
                class="spacing-input"
                placeholder=""
              />
              <span class="spacing-label">字符间距</span>
              <el-input
                v-model.number="form.letterSpacing"
                class="spacing-input"
                placeholder=""
              />
              <span class="spacing-label">行距</span>
              <el-input
                v-model.number="form.lineHeight"
                class="spacing-input"
                placeholder=""
              />
            </div>
          </el-form-item>
          </div>

          <!-- 标题配置 -->
          <div class="section">
            <div class="section-title">标题配置</div>
            <el-form-item label="表头">
              <el-input v-model="form.headerTitle" placeholder="请输入表头" />
            </el-form-item>
            <el-form-item label-width="0" label="" class="title1-form-item">
              <div class="title-config-row">
                <el-select v-model="form.title1Type" placeholder="请选择" style="width: 100px;" size="small">
                  <el-option label="仓库" value="warehouse" />
                  <el-option label="科室" value="department" />
                  <el-option label="供应商" value="supplier" />
                  <el-option label="单号" value="billNo" />
                  <el-option label="金额" value="amount" />
                  <el-option label="发票号" value="invoiceNo" />
                  <el-option label="制单人" value="creator" />
                  <el-option label="制单日期" value="createDate" />
                  <el-option label="审核人" value="auditor" />
                  <el-option label="审核日期" value="auditDate" />
                  <el-option label="打印人" value="printer" />
                  <el-option label="打印日期" value="printDate" />
                  <el-option label="领用人" value="receiver" />
                  <el-option label="退库人" value="returner" />
                  <el-option label="采购员" value="purchaser" />
                  <el-option label="备注" value="remark" />
                </el-select>
                <span class="row-label">名称</span>
                <el-input v-model="form.title1Name" placeholder="名称" style="width: 100px;" size="small" />
                <span class="row-label">宽度</span>
                <el-input v-model="form.title1Width" placeholder="宽度" style="width: 70px;" size="small" />
                <el-checkbox v-model="form.title1Visible">显示</el-checkbox>
                <el-checkbox v-model="form.title1FixedValue">固定值</el-checkbox>
                <el-input v-if="form.title1FixedValue" v-model="form.title1FixedValueText" placeholder="固定值" style="width: 100px;" size="small" />
              </div>
            </el-form-item>
            <el-form-item label-width="0" label="" class="title1-form-item">
              <div class="title-config-row">
                <el-select v-model="form.title2Type" placeholder="请选择" style="width: 100px;" size="small">
                  <el-option label="仓库" value="warehouse" />
                  <el-option label="科室" value="department" />
                  <el-option label="供应商" value="supplier" />
                  <el-option label="单号" value="billNo" />
                  <el-option label="金额" value="amount" />
                  <el-option label="发票号" value="invoiceNo" />
                  <el-option label="制单人" value="creator" />
                  <el-option label="制单日期" value="createDate" />
                  <el-option label="审核人" value="auditor" />
                  <el-option label="审核日期" value="auditDate" />
                  <el-option label="打印人" value="printer" />
                  <el-option label="打印日期" value="printDate" />
                  <el-option label="领用人" value="receiver" />
                  <el-option label="退库人" value="returner" />
                  <el-option label="采购员" value="purchaser" />
                  <el-option label="备注" value="remark" />
                </el-select>
                <span class="row-label">名称</span>
                <el-input v-model="form.title2Name" placeholder="名称" style="width: 100px;" size="small" />
                <span class="row-label">宽度</span>
                <el-input v-model="form.title2Width" placeholder="宽度" style="width: 70px;" size="small" />
                <el-checkbox v-model="form.title2Visible">显示</el-checkbox>
                <el-checkbox v-model="form.title2FixedValue">固定值</el-checkbox>
                <el-input v-if="form.title2FixedValue" v-model="form.title2FixedValueText" placeholder="固定值" style="width: 100px;" size="small" />
              </div>
            </el-form-item>
            <el-form-item label-width="0" label="" class="title1-form-item">
              <div class="title-config-row">
                <el-select v-model="form.title3Type" placeholder="请选择" style="width: 100px;" size="small">
                  <el-option label="仓库" value="warehouse" />
                  <el-option label="科室" value="department" />
                  <el-option label="供应商" value="supplier" />
                  <el-option label="单号" value="billNo" />
                  <el-option label="金额" value="amount" />
                  <el-option label="发票号" value="invoiceNo" />
                  <el-option label="制单人" value="creator" />
                  <el-option label="制单日期" value="createDate" />
                  <el-option label="审核人" value="auditor" />
                  <el-option label="审核日期" value="auditDate" />
                  <el-option label="打印人" value="printer" />
                  <el-option label="打印日期" value="printDate" />
                  <el-option label="领用人" value="receiver" />
                  <el-option label="退库人" value="returner" />
                  <el-option label="采购员" value="purchaser" />
                  <el-option label="备注" value="remark" />
                </el-select>
                <span class="row-label">名称</span>
                <el-input v-model="form.title3Name" placeholder="名称" style="width: 100px;" size="small" />
                <span class="row-label">宽度</span>
                <el-input v-model="form.title3Width" placeholder="宽度" style="width: 70px;" size="small" />
                <el-checkbox v-model="form.title3Visible">显示</el-checkbox>
                <el-checkbox v-model="form.title3FixedValue">固定值</el-checkbox>
                <el-input v-if="form.title3FixedValue" v-model="form.title3FixedValueText" placeholder="固定值" style="width: 100px;" size="small" />
              </div>
            </el-form-item>
            <el-form-item label-width="0" label="" class="title1-form-item">
              <div class="title-config-row">
                <el-select v-model="form.title4Type" placeholder="请选择" style="width: 100px;" size="small">
                  <el-option label="仓库" value="warehouse" />
                  <el-option label="科室" value="department" />
                  <el-option label="供应商" value="supplier" />
                  <el-option label="单号" value="billNo" />
                  <el-option label="金额" value="amount" />
                  <el-option label="发票号" value="invoiceNo" />
                  <el-option label="制单人" value="creator" />
                  <el-option label="制单日期" value="createDate" />
                  <el-option label="审核人" value="auditor" />
                  <el-option label="审核日期" value="auditDate" />
                  <el-option label="打印人" value="printer" />
                  <el-option label="打印日期" value="printDate" />
                  <el-option label="领用人" value="receiver" />
                  <el-option label="退库人" value="returner" />
                  <el-option label="采购员" value="purchaser" />
                  <el-option label="备注" value="remark" />
                </el-select>
                <span class="row-label">名称</span>
                <el-input v-model="form.title4Name" placeholder="名称" style="width: 100px;" size="small" />
                <span class="row-label">宽度</span>
                <el-input v-model="form.title4Width" placeholder="宽度" style="width: 70px;" size="small" />
                <el-checkbox v-model="form.title4Visible">显示</el-checkbox>
                <el-checkbox v-model="form.title4FixedValue">固定值</el-checkbox>
                <el-input v-if="form.title4FixedValue" v-model="form.title4FixedValueText" placeholder="固定值" style="width: 100px;" size="small" />
              </div>
            </el-form-item>
            <el-form-item label-width="0" label="" class="title1-form-item">
              <div class="title-config-row">
                <el-select v-model="form.title5Type" placeholder="请选择" style="width: 100px;" size="small">
                  <el-option label="仓库" value="warehouse" />
                  <el-option label="科室" value="department" />
                  <el-option label="供应商" value="supplier" />
                  <el-option label="单号" value="billNo" />
                  <el-option label="金额" value="amount" />
                  <el-option label="发票号" value="invoiceNo" />
                  <el-option label="制单人" value="creator" />
                  <el-option label="制单日期" value="createDate" />
                  <el-option label="审核人" value="auditor" />
                  <el-option label="审核日期" value="auditDate" />
                  <el-option label="打印人" value="printer" />
                  <el-option label="打印日期" value="printDate" />
                  <el-option label="领用人" value="receiver" />
                  <el-option label="退库人" value="returner" />
                  <el-option label="采购员" value="purchaser" />
                  <el-option label="备注" value="remark" />
                </el-select>
                <span class="row-label">名称</span>
                <el-input v-model="form.title5Name" placeholder="名称" style="width: 100px;" size="small" />
                <span class="row-label">宽度</span>
                <el-input v-model="form.title5Width" placeholder="宽度" style="width: 70px;" size="small" />
                <el-checkbox v-model="form.title5Visible">显示</el-checkbox>
                <el-checkbox v-model="form.title5FixedValue">固定值</el-checkbox>
                <el-input v-if="form.title5FixedValue" v-model="form.title5FixedValueText" placeholder="固定值" style="width: 100px;" size="small" />
              </div>
            </el-form-item>
            <el-form-item label-width="0" label="" class="title1-form-item">
              <div class="title-config-row">
                <el-select v-model="form.title6Type" placeholder="请选择" style="width: 100px;" size="small">
                  <el-option label="仓库" value="warehouse" />
                  <el-option label="科室" value="department" />
                  <el-option label="供应商" value="supplier" />
                  <el-option label="单号" value="billNo" />
                  <el-option label="金额" value="amount" />
                  <el-option label="发票号" value="invoiceNo" />
                  <el-option label="制单人" value="creator" />
                  <el-option label="制单日期" value="createDate" />
                  <el-option label="审核人" value="auditor" />
                  <el-option label="审核日期" value="auditDate" />
                  <el-option label="打印人" value="printer" />
                  <el-option label="打印日期" value="printDate" />
                  <el-option label="领用人" value="receiver" />
                  <el-option label="退库人" value="returner" />
                  <el-option label="采购员" value="purchaser" />
                  <el-option label="备注" value="remark" />
                </el-select>
                <span class="row-label">名称</span>
                <el-input v-model="form.title6Name" placeholder="名称" style="width: 100px;" size="small" />
                <span class="row-label">宽度</span>
                <el-input v-model="form.title6Width" placeholder="宽度" style="width: 70px;" size="small" />
                <el-checkbox v-model="form.title6Visible">显示</el-checkbox>
                <el-checkbox v-model="form.title6FixedValue">固定值</el-checkbox>
                <el-input v-if="form.title6FixedValue" v-model="form.title6FixedValueText" placeholder="固定值" style="width: 100px;" size="small" />
              </div>
            </el-form-item>
          </div>

          <!-- 列配置 -->
          <div class="section">
            <div class="section-title">列配置</div>
          <el-table :data="columnList" border style="width: 100%">
            <el-table-column label="列名" prop="label" width="150" />
            <el-table-column label="字段" prop="field" width="150" />
            <el-table-column label="宽度(px)" width="120">
              <template slot-scope="scope">
                <el-input-number v-model="scope.row.width" :min="20" :max="500" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="是否显示" width="100">
              <template slot-scope="scope">
                <el-switch v-model="scope.row.visible" />
              </template>
            </el-table-column>
            <el-table-column label="排序" width="80">
              <template slot-scope="scope">
                <el-button-group>
                  <el-button size="mini" icon="el-icon-arrow-up" @click="moveColumn(scope.$index, -1)" :disabled="scope.$index === 0" />
                  <el-button size="mini" icon="el-icon-arrow-down" @click="moveColumn(scope.$index, 1)" :disabled="scope.$index === columnList.length - 1" />
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>
          </div>

          <!-- 显示字段 -->
          <div class="section">
            <div class="section-title">显示字段</div>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="显示采购人">
                <el-switch v-model="form.showPurchaser" />
              </el-form-item>
              <el-form-item label="采购人标签" v-if="form.showPurchaser">
                <el-input v-model="form.purchaserLabel" placeholder="请输入采购人标签" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="显示制单人">
                <el-switch v-model="form.showCreator" />
              </el-form-item>
              <el-form-item label="制单人标签" v-if="form.showCreator">
                <el-input v-model="form.creatorLabel" placeholder="请输入制单人标签" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="显示复核人">
                <el-switch v-model="form.showAuditor" />
              </el-form-item>
              <el-form-item label="复核人标签" v-if="form.showAuditor">
                <el-input v-model="form.auditorLabel" placeholder="请输入复核人标签" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="显示验收人">
                <el-switch v-model="form.showReceiver" />
              </el-form-item>
              <el-form-item label="验收人标签" v-if="form.showReceiver">
                <el-input v-model="form.receiverLabel" placeholder="请输入验收人标签" />
              </el-form-item>
            </el-col>
          </el-row>
          </div>

      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
      </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script>
import { addPrintSetting, updatePrintSetting } from "@/api/system/printSetting";

export default {
  name: "PrintSettingForm",
  props: {
    formData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      activeTab: "basic",
      dragState: null,
      form: {
        templateName: '',
        billType: null,
        pageWidth: 241,
        pageHeight: 140,
        orientation: 'portrait',
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
        fontSize: 14,
        tableFontSize: 12,
        columnSpacing: 0,
        fontFamily: '',
        fontColor: '#000000',
        fontBold: false,
        textAlign: 'left',
        showPurchaser: false,
        showCreator: true,
        showAuditor: true,
        showReceiver: false,
        purchaserLabel: '采购人',
        creatorLabel: '制单人',
        auditorLabel: '复核人',
        receiverLabel: '验收人',
        headerTitle: '',
        title1: '',
        title1Type: '',
        title1Name: '',
        title1Width: 15,
        title1Visible: true,
        title1FixedValue: false,
        title1FixedValueText: '',
        title2: '',
        title2Type: '',
        title2Name: '',
        title2Width: 15,
        title2Visible: true,
        title2FixedValue: false,
        title2FixedValueText: '',
        title3: '',
        title3Type: '',
        title3Name: '',
        title3Width: 15,
        title3Visible: true,
        title3FixedValue: false,
        title3FixedValueText: '',
        title4: '',
        title4Type: '',
        title4Name: '',
        title4Width: 15,
        title4Visible: true,
        title4FixedValue: false,
        title4FixedValueText: '',
        title5: '',
        title5Type: '',
        title5Name: '',
        title5Width: 15,
        title5Visible: true,
        title5FixedValue: false,
        title5FixedValueText: '',
        title6: '',
        title6Type: '',
        title6Name: '',
        title6Width: 15,
        title6Visible: true,
        title6FixedValue: false,
        title6FixedValueText: '',
        isDefault: 0,
        status: '0',
        remark: ''
      },
      columnList: [],
      defaultColumns: [
        { field: "materialCode", label: "耗材编码", width: 80, visible: true },
        { field: "materialName", label: "耗材名称", width: 120, visible: true },
        { field: "materialSpeci", label: "规格", width: 100, visible: true },
        { field: "price", label: "单价", width: 80, visible: true },
        { field: "qty", label: "数量", width: 60, visible: true },
        { field: "amt", label: "金额", width: 80, visible: true },
        { field: "batchNumber", label: "批号", width: 100, visible: true },
        { field: "periodDate", label: "有效期", width: 100, visible: true },
        { field: "factoryName", label: "厂家", width: 120, visible: true },
        { field: "warehouseCategoryName", label: "耗材分类", width: 100, visible: true }
      ],
      rules: {
        templateName: [
          { required: true, message: "模板名称不能为空", trigger: "blur" }
        ]
      }
    };
  },
  computed: {
    previewStyle() {
      const width = this.form.pageWidth || 241;
      const height = this.form.pageHeight || 140;
      // 使用与尺子标记相同的比例：1mm = 3.78px (96 DPI)
      // 这样预览模板的尺寸就会与尺子标记完全对应
      const mmToPx = 3.78;
      let previewWidth = width * mmToPx;
      let previewHeight = height * mmToPx;
      
      // 横向时交换宽度和高度
      if (this.form.orientation === 'landscape') {
        [previewWidth, previewHeight] = [previewHeight, previewWidth];
      }

      const marginTop = this.form.marginTop || 0;
      const marginLeft = this.form.marginLeft || 0;
      const topPx = 50 + marginTop * mmToPx;
      const leftPx = 50 + marginLeft * mmToPx;
      
      return {
        width: `${previewWidth}px`,
        height: `${previewHeight}px`,
        top: `${topPx}px`,
        left: `${leftPx}px`,
        transform: 'none'
      };
    },
    horizontalRuler() {
      // 生成整个面板宽度的尺子标记：1mm 一个小刻度，10mm 一个大刻度
      const marks = [];
      for (let i = 0; i <= 400; i += 1) {
        marks.push(i);
      }
      return marks;
    },
    verticalRuler() {
      // 生成整个面板高度的尺子标记：1mm 一个小刻度，10mm 一个大刻度
      const marks = [];
      for (let i = 0; i <= 600; i += 1) {
        marks.push(i);
      }
      return marks;
    }
  },
  watch: {
    formData: {
      handler(newVal) {
        if (newVal) {
          this.form = { ...this.form, ...newVal };
          // 转换显示字段为布尔值
          if (this.form.showPurchaser !== undefined) {
            this.form.showPurchaser = this.form.showPurchaser === 1;
          }
          if (this.form.showCreator !== undefined) {
            this.form.showCreator = this.form.showCreator === 1;
          }
          if (this.form.showAuditor !== undefined) {
            this.form.showAuditor = this.form.showAuditor === 1;
          }
          if (this.form.showReceiver !== undefined) {
            this.form.showReceiver = this.form.showReceiver === 1;
          }
          
          if (newVal.columnConfig) {
            try {
              const config = JSON.parse(newVal.columnConfig);
              this.columnList = config.columns || [...this.defaultColumns];
            } catch (e) {
              this.columnList = [...this.defaultColumns];
            }
          } else {
            this.columnList = [...this.defaultColumns];
          }
        }
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    onPreviewMouseDown(event) {
      if (!this.$refs.previewPaper) return;

      const rect = this.$refs.previewPaper.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      const edge = 8; // 判定为边缘拖拽的距离

      const onLeft = offsetX <= edge;
      const onRight = rect.width - offsetX <= edge;
      const onTop = offsetY <= edge;
      const onBottom = rect.height - offsetY <= edge;

      const mmToPx = 3.78;

      this.dragState = {
        mode: (onLeft || onRight || onTop || onBottom) ? 'resize' : 'move',
        onLeft,
        onRight,
        onTop,
        onBottom,
        startX: event.clientX,
        startY: event.clientY,
        startWidth: this.form.pageWidth || 241,
        startHeight: this.form.pageHeight || 140,
        startMarginTop: this.form.marginTop || 0,
        startMarginLeft: this.form.marginLeft || 0,
        mmToPx
      };

      this._onPreviewMouseMove = (e) => {
        if (!this.dragState) return;
        const dxPx = e.clientX - this.dragState.startX;
        const dyPx = e.clientY - this.dragState.startY;
        const dxMm = dxPx / this.dragState.mmToPx;
        const dyMm = dyPx / this.dragState.mmToPx;

        const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

        if (this.dragState.mode === 'move') {
          let newMarginLeft = this.dragState.startMarginLeft + dxMm;
          let newMarginTop = this.dragState.startMarginTop + dyMm;
          // 简单限制不允许移出可视区域
          newMarginLeft = Math.max(0, newMarginLeft);
          newMarginTop = Math.max(0, newMarginTop);
          this.form.marginLeft = Number(newMarginLeft.toFixed(2));
          this.form.marginTop = Number(newMarginTop.toFixed(2));
        } else {
          // resize 模式
          let newWidth = this.dragState.startWidth;
          let newHeight = this.dragState.startHeight;
          let newMarginLeft = this.dragState.startMarginLeft;
          let newMarginTop = this.dragState.startMarginTop;

          if (this.dragState.onRight) {
            newWidth = this.dragState.startWidth + dxMm;
          }
          if (this.dragState.onBottom) {
            newHeight = this.dragState.startHeight + dyMm;
          }
          if (this.dragState.onLeft) {
            newWidth = this.dragState.startWidth - dxMm;
            newMarginLeft = this.dragState.startMarginLeft + dxMm;
          }
          if (this.dragState.onTop) {
            newHeight = this.dragState.startHeight - dyMm;
            newMarginTop = this.dragState.startMarginTop + dyMm;
          }

          this.form.pageWidth = clamp(Number(newWidth.toFixed(2)), 50, 1000);
          this.form.pageHeight = clamp(Number(newHeight.toFixed(2)), 50, 1000);
          this.form.marginLeft = Number(newMarginLeft.toFixed(2));
          this.form.marginTop = Number(newMarginTop.toFixed(2));
        }
      };

      this._onPreviewMouseUp = () => {
        this.dragState = null;
        window.removeEventListener('mousemove', this._onPreviewMouseMove);
        window.removeEventListener('mouseup', this._onPreviewMouseUp);
      };

      window.addEventListener('mousemove', this._onPreviewMouseMove);
      window.addEventListener('mouseup', this._onPreviewMouseUp);
    },
    setFormData(data) {
      if (data) {
        this.form = { ...this.form, ...data };
        // 转换显示字段为布尔值
        if (this.form.showPurchaser !== undefined) {
          this.form.showPurchaser = this.form.showPurchaser === 1;
        }
        if (this.form.showCreator !== undefined) {
          this.form.showCreator = this.form.showCreator === 1;
        }
        if (this.form.showAuditor !== undefined) {
          this.form.showAuditor = this.form.showAuditor === 1;
        }
        if (this.form.showReceiver !== undefined) {
          this.form.showReceiver = this.form.showReceiver === 1;
        }
        
        if (data.columnConfig) {
          try {
            const config = JSON.parse(data.columnConfig);
            this.columnList = config.columns || [...this.defaultColumns];
          } catch (e) {
            this.columnList = [...this.defaultColumns];
          }
        } else {
          this.columnList = [...this.defaultColumns];
        }
      }
    },
    resetForm() {
      this.$refs.form.resetFields();
      this.form = {
        templateName: '',
        billType: null,
        pageWidth: 241,
        pageHeight: 140,
        orientation: 'portrait',
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
        fontSize: 14,
        tableFontSize: 12,
        columnSpacing: 0,
        showPurchaser: false,
        showCreator: true,
        showAuditor: true,
        showReceiver: false,
        purchaserLabel: '采购人',
        creatorLabel: '制单人',
        auditorLabel: '复核人',
        receiverLabel: '验收人',
        headerTitle: '',
        title1: '',
        title1Type: '',
        title1Name: '',
        title1Width: 15,
        title1Visible: true,
        title1FixedValue: false,
        title1FixedValueText: '',
        title2: '',
        title2Type: '',
        title2Name: '',
        title2Width: 15,
        title2Visible: true,
        title2FixedValue: false,
        title2FixedValueText: '',
        title3: '',
        title3Type: '',
        title3Name: '',
        title3Width: 15,
        title3Visible: true,
        title3FixedValue: false,
        title3FixedValueText: '',
        title4: '',
        title4Type: '',
        title4Name: '',
        title4Width: 15,
        title4Visible: true,
        title4FixedValue: false,
        title4FixedValueText: '',
        title5: '',
        title5Type: '',
        title5Name: '',
        title5Width: 15,
        title5Visible: true,
        title5FixedValue: false,
        title5FixedValueText: '',
        title6: '',
        title6Type: '',
        title6Name: '',
        title6Width: 15,
        title6Visible: true,
        title6FixedValue: false,
        title6FixedValueText: '',
        isDefault: 0,
        status: '0',
        remark: ''
      };
      this.columnList = [...this.defaultColumns];
      this.activeTab = "basic";
    },
    moveColumn(index, direction) {
      const newIndex = index + direction;
      if (newIndex >= 0 && newIndex < this.columnList.length) {
        const item = this.columnList.splice(index, 1)[0];
        this.columnList.splice(newIndex, 0, item);
      }
    },
    submitForm() {
      this.$refs.form.validate(valid => {
        if (valid) {
          const formData = { ...this.form };
          // 保存列配置
          formData.columnConfig = JSON.stringify({
            columns: this.columnList
          });
          // 转换显示字段为整数
          formData.showPurchaser = formData.showPurchaser ? 1 : 0;
          formData.showCreator = formData.showCreator ? 1 : 0;
          formData.showAuditor = formData.showAuditor ? 1 : 0;
          formData.showReceiver = formData.showReceiver ? 1 : 0;
          
          if (formData.isDefault === undefined) {
            formData.isDefault = 0;
          }
          if (formData.status === undefined) {
            formData.status = '0';
          }
          if (formData.orientation === undefined) {
            formData.orientation = 'portrait';
          }

          if (formData.id != undefined) {
            updatePrintSetting(formData).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.$emit('success');
            });
          } else {
            addPrintSetting(formData).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.$emit('success');
            });
          }
        }
      });
    },
    cancel() {
      this.$emit('cancel');
    },
    refresh() {
      // 刷新/重置表单
      this.resetForm();
    },
    getHorizontalPosition(value) {
      // 将mm值转换为px位置，1mm = 3.78px (96 DPI)
      return value * 3.78;
    },
    getVerticalPosition(value) {
      // 将mm值转换为px位置，1mm = 3.78px (96 DPI)
      return value * 3.78;
    }
  }
};
</script>

<style scoped>
.print-setting-form {
  padding: 0 0 20px 0;
  height: 100%;
  box-sizing: border-box;
}

.dialog-layout {
  display: flex;
  height: 100%;
  box-sizing: border-box;
  padding-left: 0;
  margin-left: -12px;
  margin-right: -14px;
}

.left-panel {
  flex: 4;
  margin-right: 8px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #EBEEF5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
}

.ruler-panel {
  background-image: 
    linear-gradient(to right, #e0e0e0 1px, transparent 1px),
    linear-gradient(to bottom, #e0e0e0 1px, transparent 1px);
  background-size: 37.8px 37.8px; /* 10mm = 37.8px */
  background-position: 50px 50px;
}

.template-preview {
  width: 100%;
  height: 100%;
  position: relative;
  padding: 50px 50px 20px 50px;
  box-sizing: border-box;
}

.preview-title {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  z-index: 10;
  background: #fff;
  padding: 4px 12px;
  border-radius: 4px;
}

.preview-container {
  position: relative;
  width: 100%;
  height: calc(100% - 50px);
  padding-left: 50px;
  padding-top: 50px;
  box-sizing: border-box;
}

.preview-paper {
  position: absolute;
  background: #ffffff;
  border: 3px solid #409eff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
  transform-origin: top left;
}

/* 顶部水平尺子 */
.ruler-horizontal-main {
  position: absolute;
  top: 0;
  left: 50px;
  right: 0;
  height: 50px;
  background: #f5f7fa;
  border-bottom: 2px solid #409eff;
  z-index: 5;
}

.ruler-mark-horizontal {
  position: absolute;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateX(-50%);
}

.ruler-tick {
  width: 2px;
  background: #409eff;
}

.ruler-tick.major {
  height: 24px;
  margin-bottom: 0;
}

.ruler-tick.minor {
  height: 10px;
  margin-bottom: 0;
}

.ruler-number {
  font-size: 14px;
  font-weight: 700;
  color: #303133;
  white-space: nowrap;
  background: #fff;
  padding: 2px 4px;
  border-radius: 2px;
}

/* 水平尺子读数显示在刻度上方（外侧） */
.ruler-number-top {
  margin-bottom: 4px;
}

/* 左侧垂直尺子 */
.ruler-vertical-main {
  position: absolute;
  left: 0;
  top: 50px;
  bottom: 0;
  width: 50px;
  background: #f5f7fa;
  border-right: 2px solid #409eff;
  z-index: 5;
}

.ruler-mark-vertical {
  position: absolute;
  right: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  transform: translateY(-50%);
}

.ruler-mark-vertical .ruler-tick {
  background: #409eff;
}

.ruler-mark-vertical .ruler-tick.major {
  width: 25px;
  height: 3px;
  margin-right: 0;
}

.ruler-mark-vertical .ruler-tick.minor {
  width: 12px;
  height: 2px;
  margin-right: 0;
}

/* 垂直尺子读数显示在刻度左侧（外侧） */
.ruler-number-left {
  margin-right: 4px;
}

.ruler-mark-vertical .ruler-number {
  font-size: 14px;
  font-weight: 700;
  color: #303133;
  writing-mode: vertical-lr;
  text-orientation: mixed;
  background: #fff;
  padding: 4px 2px;
  border-radius: 2px;
}

.paper-content {
  width: 100%;
  height: 100%;
  padding: 15px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
}

.template-preview-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.template-header {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  text-align: center;
  width: 100%;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
}

.template-title {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.right-panel {
  flex: 2;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #EBEEF5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  padding: 16px 20px 10px 20px;
  box-sizing: border-box;
  overflow-y: auto;
}

.form-toolbar {
  position: sticky;
  top: 0;
  z-index: 20;
  text-align: left;
  padding: 6px 0 6px 4px !important;
  margin-left: 0 !important;
  margin-top: 0 !important;
  background: #ffffff;
  border-bottom: 1px solid #EBEEF5;
}

.form-toolbar .el-button {
  margin-right: 8px;
}

.form-toolbar .el-button:last-child {
  margin-right: 0;
}

.section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}

.font-inline-row .el-form-item {
  margin-bottom: 8px;
}

.font-inline-input {
  max-width: 140px;
}

.text-align-toolbar {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.align-icon {
  width: 28px;
  height: 20px;
  border-radius: 2px;
  border: 1px solid #dcdfe6;
  background-color: #f5f7fa;
  cursor: pointer;
  position: relative;
}

.align-icon::before,
.align-icon::after {
  content: '';
  position: absolute;
  left: 6px;
  right: 6px;
  height: 2px;
  background-color: #606266;
  border-radius: 1px;
}

.align-icon::before {
  top: 6px;
}

.align-icon::after {
  bottom: 6px;
}

.align-center::before,
.align-center::after {
  left: 8px;
  right: 8px;
}

.align-right::before,
.align-right::after {
  left: 12px;
  right: 4px;
}

.align-icon.active {
  border-color: #409eff;
  background-color: #e6f0ff;
}

.title-config-row {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.title-config-row .row-number {
  color: #909399;
  font-size: 14px;
  margin-right: 2px;
  flex-shrink: 0;
}

.title-config-row .row-label {
  color: #606266;
  font-size: 14px;
  margin: 0 2px;
  flex-shrink: 0;
}

.title-config-row .el-select,
.title-config-row .el-input,
.title-config-row .el-input-number {
  margin-right: 0;
}

.title-config-row .el-checkbox {
  margin-right: 0;
  margin-left: 4px;
}

.title1-form-item {
  margin-bottom: 18px;
}

.title1-form-item .el-form-item__content {
  margin-left: 0 !important;
}
</style>
