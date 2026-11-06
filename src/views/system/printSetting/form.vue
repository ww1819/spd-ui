<template>
  <div class="print-setting-form">
    <div class="dialog-layout">
      <!-- 左侧：工具条与画布（工具条与右侧面板顶对齐） -->
      <div class="left-column">
    <!-- 顶部操作按钮行：设计工具条 + 保存等 -->
    <div class="form-toolbar">
      <div class="design-toolbar">
        <el-tooltip content="撤销" placement="bottom">
          <button type="button" class="dt-btn" :disabled="!canUndo" @click="handleDesignUndo">
            <i class="el-icon-refresh-left"></i>
          </button>
        </el-tooltip>
        <el-tooltip content="重做" placement="bottom">
          <button type="button" class="dt-btn" :disabled="!canRedo" @click="handleDesignRedo">
            <i class="el-icon-refresh-right"></i>
          </button>
        </el-tooltip>
        <span class="dt-sep"></span>
        <el-tooltip content="复制" placement="bottom">
          <button type="button" class="dt-btn" @click="handleDesignCopy">
            <i class="el-icon-document-copy"></i>
          </button>
        </el-tooltip>
        <el-tooltip content="格式刷" placement="bottom">
          <button type="button" class="dt-btn" :class="{ active: formatPainterActive }" @click="toggleFormatPainter">
            <i class="el-icon-brush"></i>
          </button>
        </el-tooltip>
        <el-tooltip content="删除" placement="bottom">
          <button type="button" class="dt-btn" @click="handleDesignDelete">
            <i class="el-icon-delete"></i>
          </button>
        </el-tooltip>
        <span class="dt-sep"></span>
        <el-select
          v-model="form.fontSize"
          size="mini"
          class="dt-font-size"
          placeholder="字号"
          @change="pushDesignHistory"
        >
          <el-option v-for="s in designFontSizes" :key="'fs-' + s" :label="String(s)" :value="s" />
        </el-select>
        <el-tooltip content="加粗" placement="bottom">
          <button type="button" class="dt-btn dt-text" :class="{ active: !!form.fontBold }" @click="toggleFontBold">B</button>
        </el-tooltip>
        <el-tooltip content="斜体" placement="bottom">
          <button type="button" class="dt-btn dt-text dt-italic" :class="{ active: !!form.fontItalic }" @click="toggleFontItalic">I</button>
        </el-tooltip>
        <el-tooltip content="下划线" placement="bottom">
          <button type="button" class="dt-btn dt-text dt-underline" :class="{ active: !!form.fontUnderline }" @click="toggleFontUnderline">U</button>
        </el-tooltip>
        <el-dropdown trigger="click" @command="handleFontColorCommand">
          <button type="button" class="dt-btn dt-color-btn">
            <span class="dt-color-letter">A</span>
            <span class="dt-color-bar" :style="{ background: form.fontColor || '#000' }"></span>
            <i class="el-icon-arrow-down dt-caret"></i>
          </button>
          <el-dropdown-menu slot="dropdown" class="dt-color-menu">
            <div class="dt-color-picker-wrap" @click.stop>
              <el-color-picker v-model="form.fontColor" size="mini" @change="pushDesignHistory" />
            </div>
            <el-dropdown-item command="#000000">黑色</el-dropdown-item>
            <el-dropdown-item command="#F56C6C">红色</el-dropdown-item>
            <el-dropdown-item command="#409EFF">蓝色</el-dropdown-item>
            <el-dropdown-item command="#67C23A">绿色</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <el-dropdown trigger="click" @command="handleFillColorCommand">
          <button type="button" class="dt-btn dt-color-btn">
            <i class="el-icon-s-open"></i>
            <span class="dt-color-bar" :style="{ background: form.fillColor || '#67C23A' }"></span>
            <i class="el-icon-arrow-down dt-caret"></i>
          </button>
          <el-dropdown-menu slot="dropdown" class="dt-color-menu">
            <div class="dt-color-picker-wrap" @click.stop>
              <el-color-picker v-model="form.fillColor" size="mini" show-alpha @change="pushDesignHistory" />
            </div>
            <el-dropdown-item command="transparent">无填充</el-dropdown-item>
            <el-dropdown-item command="#FFFF00">黄色</el-dropdown-item>
            <el-dropdown-item command="#67C23A">绿色</el-dropdown-item>
            <el-dropdown-item command="#E6A23C">橙色</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <el-dropdown trigger="click" @command="handleTextAlignCommand">
          <button type="button" class="dt-btn">
            <i class="el-icon-s-operation"></i>
            <i class="el-icon-arrow-down dt-caret"></i>
          </button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="left">左对齐</el-dropdown-item>
            <el-dropdown-item command="center">居中</el-dropdown-item>
            <el-dropdown-item command="right">右对齐</el-dropdown-item>
            <el-dropdown-item command="justify">两端对齐</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <el-dropdown trigger="click" @command="handleVerticalAlignCommand">
          <button type="button" class="dt-btn">
            <i class="el-icon-d-caret"></i>
            <i class="el-icon-arrow-down dt-caret"></i>
          </button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="top">顶端对齐</el-dropdown-item>
            <el-dropdown-item command="middle">垂直居中</el-dropdown-item>
            <el-dropdown-item command="bottom">底端对齐</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <el-dropdown trigger="click" @command="handleBorderCommand">
          <button type="button" class="dt-btn">
            <i class="el-icon-menu"></i>
            <i class="el-icon-arrow-down dt-caret"></i>
          </button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="all">全边框</el-dropdown-item>
            <el-dropdown-item command="outer">外边框</el-dropdown-item>
            <el-dropdown-item command="none">无边框</el-dropdown-item>
            <el-dropdown-item command="merge">合并单元格</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <el-dropdown trigger="click" @command="handlePlaceholderCommand">
          <button type="button" class="dt-btn dt-placeholder-btn">
            <span>请</span>
            <i class="el-icon-arrow-down dt-caret"></i>
          </button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="warehouse">仓库</el-dropdown-item>
            <el-dropdown-item command="department">科室</el-dropdown-item>
            <el-dropdown-item command="supplier">供应商</el-dropdown-item>
            <el-dropdown-item command="billNo">单号</el-dropdown-item>
            <el-dropdown-item command="remark">备注</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
      <el-button type="primary" size="medium" @click="submitForm">保 存</el-button>
      <el-button size="medium" @click="refresh">刷 新</el-button>
      <el-button size="medium" @click="handlePreview">预 览</el-button>
      <el-button size="medium" :disabled="!form.billType" @click="openRefBillDialog">引用单据</el-button>
      <span v-if="refBillData && refBillTotalPages > 1" class="ref-bill-pager">
        <el-button size="mini" :disabled="refBillPage <= 1" @click="refBillPage = Math.max(1, refBillPage - 1)">上一页</el-button>
        <span class="pager-text">第 {{ refBillPage }}/{{ refBillTotalPages }} 页</span>
        <el-button size="mini" :disabled="refBillPage >= refBillTotalPages" @click="refBillPage = Math.min(refBillTotalPages, refBillPage + 1)">下一页</el-button>
      </span>
    </div>
      <!-- 左侧画布 -->
      <div class="left-panel">
        <!-- 顶行：角块 + 水平尺（固定不随上下滚） -->
        <div class="ruler-top-row">
          <div class="ruler-corner"></div>
          <div class="ruler-h-viewport">
            <div
              class="ruler-horizontal-main"
              :style="{ width: rulerHorizontalWidthPx + 'px', transform: 'translateX(' + (-canvasScrollLeft) + 'px)' }"
            >
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
          </div>
        </div>
        <div class="ruler-main-row">
          <!-- 左侧垂直尺（固定不随左右滚） -->
          <div class="ruler-v-viewport">
            <div
              class="ruler-vertical-main"
              :style="{ height: rulerVerticalHeightPx + 'px', transform: 'translateY(' + (-canvasScrollTop) + 'px)' }"
            >
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
          </div>
          <!-- 仅画布区域滚动 -->
          <div class="left-panel-body ruler-panel" @scroll="onCanvasScroll">
            <div
              class="template-preview"
              :style="{ minHeight: previewAreaMinHeight + 'px', minWidth: previewAreaMinWidth + 'px' }"
            >
              <div
                class="preview-container"
                :style="{ minHeight: rulerVerticalHeightPx + 'px', minWidth: rulerHorizontalWidthPx + 'px' }"
              >
          <div
            ref="previewPaper"
            class="preview-paper"
            :style="previewStyle"
            @mousedown.stop="onPreviewMouseDown"
          >
            <div class="paper-content">
              <div class="template-preview-content">
                <div v-if="headerDisplayText" class="template-header">{{ headerDisplayText }}</div>
                <!-- 单号码：可拖拽移动、右下角拉拽缩放 -->
                <div
                  v-if="form.codeDisplay"
                  ref="codeWrapRef"
                  class="template-code-wrap template-code-wrap-draggable"
                  :style="codeWrapStyle"
                  @mousedown.stop="onCodeWrapMouseDown"
                >
                  <img v-if="form.codeDisplay === 'qr'" :src="qrCodeImageUrl" alt="二维码(单号)" class="template-qrcode-img" :style="currentCodeImgStyle" />
                  <div v-if="form.codeDisplay === 'barcode'" class="template-barcode-clip" :style="currentCodeImgStyle">
                    <img :src="barcodeImageUrl" alt="一维码(单号)" class="template-barcode-img" />
                  </div>
                  <div class="code-resize-handle" @mousedown.stop.prevent="onCodeResizeStart" title="拖拽拉宽拉高"></div>
                </div>
                <!-- 标题配置：表头与表格之间显示各标题行（名称 + 固定值），两行三列布局 -->
                <template v-if="hasAnyTitleVisible">
                  <div class="template-title-container" :style="previewTableStyle">
                    <div
                      v-for="(row, rowIndex) in titlePreviewRows"
                      :key="'title-row-' + rowIndex"
                      class="template-title-row"
                      :style="getTitleRowStyle(rowIndex)"
                    >
                      <span
                        v-for="item in row"
                        :key="item.key"
                        class="template-title-item"
                        :style="getTitleItemStyle(item)"
                      >
                        {{ item.label }}<span v-if="item.value !== ''">: {{ item.value }}</span>
                      </span>
                    </div>
                  </div>
                </template>
                <!-- 表格设置预览：第一行为列名，可下拉选择列配置；列与列之间可拖动调整宽度并同步到列配置 -->
                <div class="preview-table-wrap" :style="previewTableStyle">
                  <table class="preview-table" :style="previewTableInlineStyle">
                    <colgroup>
                      <col v-for="c in tablePreviewCols" :key="'col-' + c" :style="{ width: (canvasColumnWidths[c - 1] || 80) + 'px' }" />
                    </colgroup>
                    <thead>
                      <tr>
                        <th
                          v-for="c in tablePreviewCols"
                          v-if="isHeaderCellVisible(c - 1)"
                          :key="'h-' + (c - 1)"
                          class="preview-table-header-cell"
                          :class="{ 'is-selected': isHeaderCellSelected(c - 1) }"
                          :colspan="getHeaderCellColspan(c - 1)"
                          @click.stop="onHeaderCellClick(c - 1)"
                        >
                          <el-select
                            :value="tableHeaderFields[c - 1]"
                            placeholder="请选择列"
                            size="mini"
                            class="canvas-header-select"
                            @input="setHeaderField(c - 1, $event)"
                          >
                            <el-option
                              v-for="col in columnList"
                              :key="col.field"
                              :label="col.label"
                              :value="col.field"
                            />
                          </el-select>
                          <span
                            v-if="shouldShowResizeHandle(c - 1)"
                            class="col-resize-handle"
                            @mousedown.prevent.stop="startColResize($event, c - 1)"
                          ></span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="rIndex in tablePreviewDataRows" :key="'r-' + rIndex">
                        <td
                          v-for="cIndex in tablePreviewCols"
                          v-if="isBodyCellVisible(rIndex - 1, cIndex - 1)"
                          :key="'c-' + (cIndex - 1)"
                          class="preview-table-body-cell"
                          :class="{ 'is-selected': isBodyCellSelected(rIndex - 1, cIndex - 1) }"
                          :colspan="getBodyCellColspan(rIndex - 1, cIndex - 1)"
                          @click.stop="onBodyCellClick(rIndex - 1, cIndex - 1)"
                        >
                          <div
                            class="preview-table-cell-inner"
                            @dblclick.stop="startEditBodyCell(rIndex - 1, cIndex - 1)"
                          >
                            <el-input
                              v-if="isEditingBodyCell(rIndex - 1, cIndex - 1)"
                              v-model="editingBodyCell.value"
                              size="mini"
                              class="preview-table-cell-input"
                              @blur="saveBodyCellEdit"
                              @keyup.enter.native="saveBodyCellEdit"
                            />
                            <span
                              v-else
                              class="preview-table-cell-text"
                            >
                              {{ getBodyCellText(rIndex - 1, cIndex - 1) }}
                            </span>
                          </div>
                          <span
                            v-if="shouldShowResizeHandle(cIndex - 1)"
                            class="col-resize-handle"
                            @mousedown.prevent.stop="startColResize($event, cIndex - 1)"
                          ></span>
                        </td>
                      </tr>
                    </tbody>
                    <tfoot v-if="form.showPageSubtotal || form.showGrandTotal">
                      <!-- 本页小计：单行单列，占满整行；引用单据时显示当前页明细金额合计 -->
                      <tr v-if="form.showPageSubtotal">
                        <td :colspan="tablePreviewCols" class="preview-table-footer-cell">
                          本页小计：{{ pageSubtotalDisplay }}
                        </td>
                      </tr>
                      <!-- 合计金额（大写）：单行单列，占满整行；引用单据时显示全部明细金额合计及大写 -->
                      <tr v-if="form.showGrandTotal">
                        <td :colspan="tablePreviewCols" class="preview-table-footer-cell">
                          合计金额（大写）：{{ grandTotalDisplay }}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <!-- 底部信息：表格下方，一行最多显示四个参数 -->
                <template v-if="hasAnyBottomVisible">
                  <div class="template-bottom-container" :style="previewTableStyle">
                    <div
                      v-for="(row, rowIndex) in bottomPreviewRows"
                      :key="'bottom-row-' + rowIndex"
                      class="template-bottom-row"
                      :style="getBottomRowStyle(rowIndex)"
                    >
                      <span
                        v-for="item in row"
                        :key="item.key"
                        class="template-bottom-item"
                        :style="getBottomItemStyle(item)"
                      >
                        {{ item.label }}<span v-if="item.value !== ''">: {{ item.value }}</span>
                      </span>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
              </div>
            </div>
          </div>
        </div>
        <!-- 底部分页页签：分页1 / 分页2 / + -->
        <div class="design-page-tabs">
          <div
            v-for="p in designPages"
            :key="'design-page-' + p.key"
            :class="['design-page-tab', { active: activeDesignPageKey === p.key }]"
            @click="switchDesignPage(p.key)"
          >{{ p.label }}</div>
          <div class="design-page-add" title="新增分页" @click="addDesignPage">+</div>
        </div>
      </div>
      </div>
      <!-- 右侧内容框：与工具条顶对齐，增高占满 -->
      <div class="right-panel">
        <el-form ref="form" :model="form" :rules="rules" label-width="120px" class="right-panel-form">
          <div class="right-panel-top">
          <el-tabs v-model="activeTab" class="right-config-tabs">
          <!-- 基本信息 -->
          <el-tab-pane label="模板信息" name="basic">
          <el-form-item label="模板名称" prop="templateName">
            <el-input v-model="form.templateName" placeholder="模板名称" />
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
          <el-form-item label="默认模板" prop="isDefault" required>
            <el-switch
              v-model="form.isDefault"
              :active-value="1"
              :inactive-value="0"
            />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="form.status">
              <el-radio label="0">正常</el-radio>
              <el-radio label="1">停用</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="form.remark" type="textarea" placeholder="备注" />
          </el-form-item>
          </el-tab-pane>

          <!-- 组件设置：可插入组件卡片 -->
          <el-tab-pane label="组件设置" name="font">
            <div class="component-palette">
              <div
                v-for="item in componentPalette"
                :key="item.key"
                class="component-card"
                :class="{ active: selectedComponent === item.key }"
                @click="handleSelectComponent(item)"
              >
                <div class="component-card-icon" v-html="item.icon"></div>
                <div class="component-card-label">{{ item.label }}</div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 列配置 -->
          <el-tab-pane label="其他配置" name="column">
          <el-table :data="columnList" border class="column-config-table" style="width: 100%">
            <el-table-column label="列名" prop="label" width="120" />
            <el-table-column label="字段" prop="field" width="120" />
            <el-table-column label="宽度(px)" width="100">
              <template slot-scope="scope">
                <el-input v-model="scope.row.width" placeholder="宽度" size="small" class="column-config-input" />
              </template>
            </el-table-column>
            <el-table-column label="是否显示" width="90">
              <template slot-scope="scope">
                <el-switch v-model="scope.row.visible" />
              </template>
            </el-table-column>
            <el-table-column label="排序" width="80">
              <template slot-scope="scope">
                <el-input
                  :key="scope.row.field + '-' + scope.$index"
                  :value="scope.$index + 1"
                  size="small"
                  class="column-config-input"
                  @blur="updateColumnOrder(scope.$index, $event.target.value)"
                />
              </template>
            </el-table-column>
          </el-table>
          </el-tab-pane>

          <!-- 底部信息（与标题配置风格一致） -->
          <el-tab-pane label="底部信息" name="bottom">
            <!-- 底部行1 -->
            <el-form-item label-width="0" class="bottom-info-item">
              <div class="title-config-row">
                <el-select v-model="form.bottom1Type" placeholder="请选择" style="width: 100px;" size="small">
                  <el-option label="采购人" value="purchaser" />
                  <el-option label="制单人" value="creator" />
                  <el-option label="配送人" value="dispatcher" />
                  <el-option label="验收人" value="receiver" />
                  <el-option label="复核人" value="auditor" />
                </el-select>
                <span class="row-label">宽度</span>
                <el-input v-model="form.bottom1Width" placeholder="宽度" style="width: 70px;" size="small" />
                <span class="row-label">高度</span>
                <el-input v-model="form.bottom1Height" placeholder="高度" style="width: 70px;" size="small" />
                <el-checkbox v-model="form.bottom1Visible">显示</el-checkbox>
                <el-checkbox v-model="form.bottom1FixedValue">固定值</el-checkbox>
                <el-input v-if="form.bottom1FixedValue" v-model="form.bottom1FixedValueText" placeholder="固定值" style="width: 100px;" size="small" />
              </div>
            </el-form-item>
            <!-- 底部行2 -->
            <el-form-item label-width="0" class="bottom-info-item">
              <div class="title-config-row">
                <el-select v-model="form.bottom2Type" placeholder="请选择" style="width: 100px;" size="small">
                  <el-option label="采购人" value="purchaser" />
                  <el-option label="制单人" value="creator" />
                  <el-option label="配送人" value="dispatcher" />
                  <el-option label="验收人" value="receiver" />
                  <el-option label="复核人" value="auditor" />
                </el-select>
                <span class="row-label">宽度</span>
                <el-input v-model="form.bottom2Width" placeholder="宽度" style="width: 70px;" size="small" />
                <span class="row-label">高度</span>
                <el-input v-model="form.bottom2Height" placeholder="高度" style="width: 70px;" size="small" />
                <el-checkbox v-model="form.bottom2Visible">显示</el-checkbox>
                <el-checkbox v-model="form.bottom2FixedValue">固定值</el-checkbox>
                <el-input v-if="form.bottom2FixedValue" v-model="form.bottom2FixedValueText" placeholder="固定值" style="width: 100px;" size="small" />
              </div>
            </el-form-item>
            <!-- 底部行3 -->
            <el-form-item label-width="0" class="bottom-info-item">
              <div class="title-config-row">
                <el-select v-model="form.bottom3Type" placeholder="请选择" style="width: 100px;" size="small">
                  <el-option label="采购人" value="purchaser" />
                  <el-option label="制单人" value="creator" />
                  <el-option label="配送人" value="dispatcher" />
                  <el-option label="验收人" value="receiver" />
                  <el-option label="复核人" value="auditor" />
                </el-select>
                <span class="row-label">宽度</span>
                <el-input v-model="form.bottom3Width" placeholder="宽度" style="width: 70px;" size="small" />
                <span class="row-label">高度</span>
                <el-input v-model="form.bottom3Height" placeholder="高度" style="width: 70px;" size="small" />
                <el-checkbox v-model="form.bottom3Visible">显示</el-checkbox>
                <el-checkbox v-model="form.bottom3FixedValue">固定值</el-checkbox>
                <el-input v-if="form.bottom3FixedValue" v-model="form.bottom3FixedValueText" placeholder="固定值" style="width: 100px;" size="small" />
              </div>
            </el-form-item>
            <!-- 底部行4 -->
            <el-form-item label-width="0" class="bottom-info-item">
              <div class="title-config-row">
                <el-select v-model="form.bottom4Type" placeholder="请选择" style="width: 100px;" size="small">
                  <el-option label="采购人" value="purchaser" />
                  <el-option label="制单人" value="creator" />
                  <el-option label="配送人" value="dispatcher" />
                  <el-option label="验收人" value="receiver" />
                  <el-option label="复核人" value="auditor" />
                </el-select>
                <span class="row-label">宽度</span>
                <el-input v-model="form.bottom4Width" placeholder="宽度" style="width: 70px;" size="small" />
                <span class="row-label">高度</span>
                <el-input v-model="form.bottom4Height" placeholder="高度" style="width: 70px;" size="small" />
                <el-checkbox v-model="form.bottom4Visible">显示</el-checkbox>
                <el-checkbox v-model="form.bottom4FixedValue">固定值</el-checkbox>
                <el-input v-if="form.bottom4FixedValue" v-model="form.bottom4FixedValueText" placeholder="固定值" style="width: 100px;" size="small" />
              </div>
            </el-form-item>
            <!-- 底部行5 -->
            <el-form-item label-width="0" class="bottom-info-item">
              <div class="title-config-row">
                <el-select v-model="form.bottom5Type" placeholder="请选择" style="width: 100px;" size="small">
                  <el-option label="采购人" value="purchaser" />
                  <el-option label="制单人" value="creator" />
                  <el-option label="配送人" value="dispatcher" />
                  <el-option label="验收人" value="receiver" />
                  <el-option label="复核人" value="auditor" />
                </el-select>
                <span class="row-label">宽度</span>
                <el-input v-model="form.bottom5Width" placeholder="宽度" style="width: 70px;" size="small" />
                <span class="row-label">高度</span>
                <el-input v-model="form.bottom5Height" placeholder="高度" style="width: 70px;" size="small" />
                <el-checkbox v-model="form.bottom5Visible">显示</el-checkbox>
                <el-checkbox v-model="form.bottom5FixedValue">固定值</el-checkbox>
                <el-input v-if="form.bottom5FixedValue" v-model="form.bottom5FixedValueText" placeholder="固定值" style="width: 100px;" size="small" />
              </div>
            </el-form-item>
          </el-tab-pane>
          </el-tabs>
          </div>
          <div class="right-panel-bottom">
            <el-tabs v-model="activeBottomTab" class="right-bottom-tabs">
          <!-- 页面设置：折叠面板 纸张设置 / 页边距（默认展开，点击收起） -->
          <el-tab-pane label="打印设置" name="page">
            <el-collapse v-model="printCollapseActive" class="print-collapse">
              <el-collapse-item title="纸张设置" name="paper">
                <el-row :gutter="12" class="paper-size-row">
                  <el-col :span="14">
                    <el-form-item label="纸张方向" prop="orientation">
                      <el-radio-group v-model="form.orientation" class="paper-orientation-buttons">
                        <el-radio-button label="portrait">纵向</el-radio-button>
                        <el-radio-button label="landscape">横向</el-radio-button>
                      </el-radio-group>
                    </el-form-item>
                  </el-col>
                  <el-col :span="10">
                    <el-form-item label="纸张大小" prop="paperSize" label-width="80px">
                      <el-select
                        v-model="form.paperSize"
                        placeholder="请选择纸张大小"
                        style="width: 100%"
                        @change="applyPaperSize"
                      >
                        <el-option
                          v-for="item in paperSizeOptions"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="页面宽度(mm)" prop="pageWidth">
                      <el-input
                        v-model.number="form.pageWidth"
                        placeholder="宽度"
                        @change="onPageSizeManualChange"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="页面高度(mm)" prop="pageHeight">
                      <el-input
                        v-model.number="form.pageHeight"
                        placeholder="高度"
                        @change="onPageSizeManualChange"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-collapse-item>
              <el-collapse-item title="页边距" name="margin">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="上边距(mm)" prop="marginTop">
                      <el-input v-model.number="form.marginTop" placeholder="上边距" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="下边距(mm)" prop="marginBottom">
                      <el-input v-model.number="form.marginBottom" placeholder="下边距" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="左边距(mm)" prop="marginLeft">
                      <el-input v-model.number="form.marginLeft" placeholder="左边距" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="右边距(mm)" prop="marginRight">
                      <el-input v-model.number="form.marginRight" placeholder="右边距" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-collapse-item>
              <el-collapse-item title="其他设置" name="other">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="打印表头" prop="printHeaderMode">
                      <el-select v-model="form.printHeaderMode" placeholder="请选择" style="width: 100%">
                        <el-option label="只打印首页" value="first" />
                        <el-option label="每页都打印" value="every" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="打印表尾" prop="printFooterMode">
                      <el-select v-model="form.printFooterMode" placeholder="请选择" style="width: 100%">
                        <el-option label="只打印末页" value="last" />
                        <el-option label="每页都打印" value="every" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                <div class="other-print-options">
                  <el-checkbox v-model="form.hideTrailingZero">隐藏小数末位0</el-checkbox>
                  <el-checkbox v-model="form.printZeroAsEmpty">数额为0时打印为空</el-checkbox>
                  <el-checkbox v-model="form.fixedRowCount">固定行数</el-checkbox>
                  <el-checkbox v-model="form.pageJoinPrint">分页拼接打印</el-checkbox>
                </div>
              </el-collapse-item>
            </el-collapse>
          </el-tab-pane>
          <!-- 标题配置 -->
          <el-tab-pane label="字段属性" name="title">
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
                <span class="row-label">宽度</span>
                <el-input v-model="form.title1Width" placeholder="宽度" style="width: 70px;" size="small" />
                <span class="row-label">高度</span>
                <el-input v-model="form.title1Height" placeholder="高度" style="width: 70px;" size="small" />
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
                <span class="row-label">宽度</span>
                <el-input v-model="form.title2Width" placeholder="宽度" style="width: 70px;" size="small" />
                <span class="row-label">高度</span>
                <el-input v-model="form.title2Height" placeholder="高度" style="width: 70px;" size="small" />
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
                <span class="row-label">宽度</span>
                <el-input v-model="form.title3Width" placeholder="宽度" style="width: 70px;" size="small" />
                <span class="row-label">高度</span>
                <el-input v-model="form.title3Height" placeholder="高度" style="width: 70px;" size="small" />
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
                <span class="row-label">宽度</span>
                <el-input v-model="form.title4Width" placeholder="宽度" style="width: 70px;" size="small" />
                <span class="row-label">高度</span>
                <el-input v-model="form.title4Height" placeholder="高度" style="width: 70px;" size="small" />
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
                <span class="row-label">宽度</span>
                <el-input v-model="form.title5Width" placeholder="宽度" style="width: 70px;" size="small" />
                <span class="row-label">高度</span>
                <el-input v-model="form.title5Height" placeholder="高度" style="width: 70px;" size="small" />
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
                <span class="row-label">宽度</span>
                <el-input v-model="form.title6Width" placeholder="宽度" style="width: 70px;" size="small" />
                <span class="row-label">高度</span>
                <el-input v-model="form.title6Height" placeholder="高度" style="width: 70px;" size="small" />
                <el-checkbox v-model="form.title6Visible">显示</el-checkbox>
                <el-checkbox v-model="form.title6FixedValue">固定值</el-checkbox>
                <el-input v-if="form.title6FixedValue" v-model="form.title6FixedValueText" placeholder="固定值" style="width: 100px;" size="small" />
              </div>
            </el-form-item>
          </el-tab-pane>
            </el-tabs>
          </div>
        </el-form>
      </div>
    </div>

    <PrintSettingRefBillDialog v-if="refBillDialogVisible" />
  </div>
</template>

<script>
import { addPrintSetting, updatePrintSetting } from "@/api/system/printSetting";
import { listOutWarehouse, getOutWarehouse } from "@/api/warehouse/outWarehouse";
import { listWarehouse, getInWarehouse } from "@/api/warehouse/warehouse";
import RMBConverter from "@/utils/tools";

export default {
  name: "PrintSettingForm",
  components: {
    PrintSettingRefBillDialog: () => import('./components/PrintSettingRefBillDialog')
  },
  props: {
    formData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      activeTab: "basic",
      /** 右侧下方：打印设置 / 字段属性 */
      activeBottomTab: "page",
      /** 打印设置折叠面板：默认全部展开 */
      printCollapseActive: ['paper', 'margin', 'other'],
      /** 纸张大小选项（宽高为纵向 mm） */
      paperSizeOptions: [
        { value: 'Letter', label: 'Letter', width: 215.9, height: 279.4 },
        { value: '11x17', label: '11x17', width: 279.4, height: 431.8 },
        { value: 'Legal', label: 'Legal', width: 215.9, height: 355.6 },
        { value: 'Statement', label: 'Statement', width: 139.7, height: 215.9 },
        { value: 'Executive', label: 'Executive', width: 184.2, height: 266.7 },
        { value: 'A5', label: 'A5', width: 148, height: 210 },
        { value: 'B5', label: 'B5', width: 176, height: 250 },
        { value: 'A4', label: 'A4', width: 210, height: 297 },
        { value: 'B4', label: 'B4', width: 250, height: 353 },
        { value: 'A3', label: 'A3', width: 297, height: 420 },
        { value: 'Monarch', label: '信封 Monarch', width: 98.4, height: 190.5 },
        { value: 'COM10', label: '信封 No.10 (COM10)', width: 104.8, height: 241.3 },
        { value: 'DL', label: '信封 DL', width: 110, height: 220 },
        { value: 'C5', label: '信封 C5', width: 162, height: 229 },
        { value: 'EnvB5', label: '信封 B5', width: 176, height: 250 },
        { value: 'Foolscap', label: 'Foolscap', width: 215.9, height: 330.2 },
        { value: 'IndexCard', label: '索引卡片', width: 76.2, height: 127 },
        { value: '16K', label: '16K', width: 184, height: 260 },
        { value: 'custom', label: '自定义 [固定名称]', width: null, height: null }
      ],
      /** 组件设置选中项 */
      selectedComponent: '',
      componentPalette: [
        {
          key: 'text',
          label: '文本',
          icon: '<svg viewBox="0 0 48 48" width="36" height="36" fill="none" stroke="#303133" stroke-width="2"><rect x="10" y="12" width="28" height="24" rx="2"/><path d="M18 20h12M24 20v14"/><circle cx="10" cy="12" r="1.5" fill="#303133"/><circle cx="38" cy="12" r="1.5" fill="#303133"/><circle cx="10" cy="36" r="1.5" fill="#303133"/><circle cx="38" cy="36" r="1.5" fill="#303133"/></svg>'
        },
        {
          key: 'image',
          label: '图片',
          icon: '<svg viewBox="0 0 48 48" width="36" height="36" fill="none" stroke="#303133" stroke-width="2"><rect x="8" y="12" width="32" height="24" rx="2"/><circle cx="17" cy="20" r="3"/><path d="M8 32l9-8 7 6 5-4 11 10"/></svg>'
        },
        {
          key: 'qr',
          label: '二维码',
          icon: '<svg viewBox="0 0 48 48" width="36" height="36" fill="#303133"><path d="M10 10h12v12H10zm3 3h6v6h-6zm13-3h12v12H26zm3 3h6v6h-6zM10 26h12v12H10zm3 3h6v6h-6zm16 0h3v3h-3zm7-3h2v2h-2zm-4 4h3v3h-3zm4 4h5v5h-5zm-7 3h3v3h-3z"/></svg>'
        },
        {
          key: 'barcode',
          label: '条形码',
          icon: '<svg viewBox="0 0 48 48" width="36" height="36" fill="none" stroke="#303133" stroke-width="2"><path d="M12 10v28M16 12v24M20 10v28M24 14v20M28 10v28M32 12v24M36 10v28"/><path d="M8 8h4v4H8zm28 0h4v4h-4zM8 36h4v4H8zm28 0h4v4h-4z"/></svg>'
        },
        {
          key: 'dataTable',
          label: '数据表格',
          icon: '<svg viewBox="0 0 48 48" width="36" height="36" fill="none" stroke="#303133" stroke-width="2"><rect x="8" y="12" width="32" height="24" rx="1"/><path d="M8 20h32M8 28h32M19 12v24M29 12v24"/><rect x="8" y="12" width="32" height="8" fill="#dcdfe6" stroke="none"/></svg>'
        },
        {
          key: 'entryTable',
          label: '分录表格',
          icon: '<svg viewBox="0 0 48 48" width="36" height="36" fill="none" stroke="#303133" stroke-width="2"><rect x="8" y="12" width="32" height="24" rx="1"/><path d="M8 20h32M8 28h32M19 12v24M29 12v24"/></svg>'
        },
        {
          key: 'layoutGrid',
          label: '布局网格',
          icon: '<svg viewBox="0 0 48 48" width="36" height="36" fill="none" stroke="#303133" stroke-width="2"><rect x="8" y="10" width="14" height="12" rx="1"/><rect x="26" y="10" width="14" height="12" rx="1"/><rect x="8" y="26" width="14" height="12" rx="1"/><rect x="26" y="26" width="14" height="12" rx="1"/></svg>'
        },
        {
          key: 'header',
          label: '页眉',
          icon: '<svg viewBox="0 0 48 48" width="36" height="36" fill="none" stroke="#303133" stroke-width="2"><rect x="12" y="8" width="24" height="32" rx="2"/><path stroke-dasharray="3 2" d="M16 14h16"/><path d="M16 22h16M16 28h12"/></svg>'
        },
        {
          key: 'footer',
          label: '页脚',
          icon: '<svg viewBox="0 0 48 48" width="36" height="36" fill="none" stroke="#303133" stroke-width="2"><rect x="12" y="8" width="24" height="32" rx="2"/><path d="M16 16h16M16 22h12"/><path stroke-dasharray="3 2" d="M16 34h16"/></svg>'
        }
      ],
      /** 左侧预览底部分页页签 */
      designPages: [{ key: 1, label: '分页1' }],
      activeDesignPageKey: 1,
      /** 画布滚动，用于固定刻度尺同步位移 */
      canvasScrollLeft: 0,
      canvasScrollTop: 0,
      /** 设计工具条：撤销/重做/格式刷 */
      designHistory: [],
      designHistoryIndex: -1,
      designHistoryLock: false,
      formatPainterActive: false,
      designClipboard: null,
      designFontSizes: [9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 28, 32],
      dragState: null,
      orgName: '',
      form: {
        templateName: '',
        tenantId: '',
        billType: null,
        pageWidth: 210,
        pageHeight: 297,
        orientation: 'portrait',
        /** 纸张大小预设，默认自定义 */
        paperSize: 'custom',
        /** 单号码显示：'' 不显示 | 'barcode' 一维码 | 'qr' 二维码（组件设置仍可切换） */
        codeDisplay: '',
        /** 二维码在画布上的位置(px)、尺寸(px) */
        qrPosition: { x: 0, y: 0 },
        qrSize: { width: 64, height: 64 },
        /** 一维码在画布上的位置(px)、尺寸(px) */
        barcodePosition: { x: 0, y: 0 },
        barcodeSize: { width: 120, height: 28 },
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
        /** 其他设置：表头/表尾打印方式及数值显示 */
        printHeaderMode: 'every',
        printFooterMode: 'last',
        hideTrailingZero: false,
        printZeroAsEmpty: false,
        fixedRowCount: false,
        pageJoinPrint: false,
        fontSize: 14,
        tableFontSize: 12,
        columnSpacing: 0,
        fontFamily: '',
        fontColor: '#000000',
        fontBold: false,
        fontItalic: false,
        fontUnderline: false,
        fillColor: 'transparent',
        verticalAlign: 'middle',
        tableBorder: 'all',
        tableRows: 7,
        tableColumns: 10,
        showPageSubtotal: false,
        showGrandTotal: false,
        textAlign: 'left',
        showPurchaser: false,
        showCreator: true,
        showAuditor: true,
        showReceiver: false,
        purchaserLabel: '采购人',
        creatorLabel: '制单人',
        auditorLabel: '复核人',
        receiverLabel: '验收人',
        bottom1Type: '',
        bottom1Width: 300,
        bottom1Height: 22,
        bottom1Visible: true,
        bottom1FixedValue: false,
        bottom1FixedValueText: '',
        bottom2Type: '',
        bottom2Width: 300,
        bottom2Height: 22,
        bottom2Visible: true,
        bottom2FixedValue: false,
        bottom2FixedValueText: '',
        bottom3Type: '',
        bottom3Width: 300,
        bottom3Height: 22,
        bottom3Visible: true,
        bottom3FixedValue: false,
        bottom3FixedValueText: '',
        bottom4Type: '',
        bottom4Width: 300,
        bottom4Height: 22,
        bottom4Visible: true,
        bottom4FixedValue: false,
        bottom4FixedValueText: '',
        bottom5Type: '',
        bottom5Width: 300,
        bottom5Height: 22,
        bottom5Visible: true,
        bottom5FixedValue: false,
        bottom5FixedValueText: '',
        headerTitle: '',
        title1: '',
        title1Type: '',
        title1Name: '',
        title1Width: 300,
        title1Height: 22,
        title1Visible: true,
        title1FixedValue: false,
        title1FixedValueText: '',
        title2: '',
        title2Type: '',
        title2Name: '',
        title2Width: 300,
        title2Height: 22,
        title2Visible: true,
        title2FixedValue: false,
        title2FixedValueText: '',
        title3: '',
        title3Type: '',
        title3Name: '',
        title3Width: 300,
        title3Height: 22,
        title3Visible: true,
        title3FixedValue: false,
        title3FixedValueText: '',
        title4: '',
        title4Type: '',
        title4Name: '',
        title4Width: 300,
        title4Height: 22,
        title4Visible: true,
        title4FixedValue: false,
        title4FixedValueText: '',
        title5: '',
        title5Type: '',
        title5Name: '',
        title5Width: 300,
        title5Height: 22,
        title5Visible: true,
        title5FixedValue: false,
        title5FixedValueText: '',
        title6: '',
        title6Type: '',
        title6Name: '',
        title6Width: 300,
        title6Height: 22,
        title6Visible: true,
        title6FixedValue: false,
        title6FixedValueText: '',
        isDefault: 0,
        status: '0',
        remark: ''
      },
      /** 引用单据弹窗 */
      refBillDialogVisible: false,
      refBillList: [],
      refBillSearchNo: '',
      refBillLoading: false,
      /** 引用单据后的业务数据，用于画布预览实际单据效果 */
      refBillData: null,
      /** 引用单据预览当前页（1-based），大于 pageSize 时切换页 */
      refBillPage: 1,
      /** 画布表格第一行（表头）每列选择的列配置字段，与列配置 columnList 对应 */
      tableHeaderFields: [],
      /** 表头列合并配置：[{ start: 起始列索引(0-based), span: 合并列数 }] */
      headerMerges: [],
      /** 表体合并配置：[{ row: 行索引(0-based), start: 起始列索引, span: 合并列数 }] */
      bodyMerges: [],
      /** 当前选中的列索引集合（仅用于表头合并） */
      headerSelectedCols: [],
      /** 画布中已选中的具体单元格（行、列），仅用于高亮展示与合并逻辑，不参与持久化 */
      bodySelectedCells: [],
      /** 画布中单元格文本内容（仅用于预览与配置），键为 `${row}_${col}` */
      bodyCellTexts: {},
      /** 当前正在编辑的单元格 { row, col, value }，用于双击编辑 */
      editingBodyCell: null,
      /** 画布上每列的宽度(px)，拖拽调整后同步回 columnList 对应列的 width */
      canvasColumnWidths: [],
      /** 列宽拖拽状态 */
      colResizeState: null,
      /** 画布上单号码（一维码/二维码）拖拽状态 */
      codeDragState: null,
      /** 画布上单号码缩放状态 */
      codeResizeState: null,
      columnList: [],
      defaultColumns: [
        { field: "materialCode", label: "产品编码", width: 80, visible: true },
        { field: "materialName", label: "产品名称", width: 120, visible: true },
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
  mounted() {
    // 初始化表头数组长度
    this.ensureTableHeaderFieldsLength();
    // 组织机构：从系统参数 sys.hospital.name 读取使用医院名称，readonly 展示
    if (typeof this.getConfigKey === 'function') {
      this.getConfigKey('sys.hospital.name').then(res => {
        if (res && res.code === 200 && res.msg) {
          this.orgName = res.msg;
        }
      }).catch(() => {});
    }
    this.$nextTick(() => this.pushDesignHistory());
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
      // preview-container 已相对刻度尺区域定位，纸张只需加边距
      const topPx = marginTop * mmToPx;
      const leftPx = marginLeft * mmToPx;

      return {
        width: `${previewWidth}px`,
        height: `${previewHeight}px`,
        top: `${topPx}px`,
        left: `${leftPx}px`,
        transform: 'none'
      };
    },
    /** 当前纸张宽/高（mm，已按方向交换） */
    paperSizeMm() {
      let w = Number(this.form.pageWidth) || 210;
      let h = Number(this.form.pageHeight) || 297;
      if (this.form.orientation === 'landscape') {
        return { width: h, height: w };
      }
      return { width: w, height: h };
    },
    /** 上尺默认 310mm，纸张更宽时按 10mm 向上取整自动加长 */
    rulerHorizontalMaxMm() {
      const paperW = Number(this.paperSizeMm.width) || 0;
      const base = 310;
      if (paperW <= base) return base;
      return Math.ceil(paperW / 10) * 10;
    },
    /** 左尺默认 160mm，仅模板更高时才自动加长 */
    rulerVerticalMaxMm() {
      const paperH = Number(this.paperSizeMm.height) || 0;
      const base = 160;
      if (paperH <= base) return base;
      return Math.ceil(paperH / 10) * 10;
    },
    rulerHorizontalWidthPx() {
      return Math.ceil(this.rulerHorizontalMaxMm * 3.78);
    },
    rulerVerticalHeightPx() {
      return Math.ceil(this.rulerVerticalMaxMm * 3.78);
    },
    previewAreaMinWidth() {
      return this.rulerHorizontalWidthPx + 24;
    },
    previewAreaMinHeight() {
      return this.rulerVerticalHeightPx + 24;
    },
    horizontalRuler() {
      const maxMm = this.rulerHorizontalMaxMm;
      const marks = [];
      for (let i = 0; i <= maxMm; i += 1) {
        marks.push(i);
      }
      return marks;
    },
    verticalRuler() {
      const maxMm = this.rulerVerticalMaxMm;
      const marks = [];
      for (let i = 0; i <= maxMm; i += 1) {
        marks.push(i);
      }
      return marks;
    },
    tablePreviewRows() {
      const n = Math.max(1, Math.min(50, Number(this.form.tableRows) || 1));
      return n;
    },
    tablePreviewCols() {
      const n = Math.max(1, Math.min(20, Number(this.form.tableColumns) || 1));
      return n;
    },
    /** 数据行数：固定为表格设置的行数（如8行），不受引用单据条数影响 */
    tablePreviewDataRows() {
      return Math.max(0, this.tablePreviewRows - 1);
    },
    /** 本页小计显示值：引用单据时为当前页明细金额合计，否则为占位 */
    pageSubtotalDisplay() {
      if (!this.refBillData || !this.refBillData.entries || this.refBillData.entries.length === 0) return '—';
      const pageSize = this.refBillPageSize;
      const start = (this.refBillPage - 1) * pageSize;
      const end = Math.min(start + pageSize, this.refBillData.entries.length);
      let sum = 0;
      for (let i = start; i < end; i++) {
        sum += this.getEntryAmt(this.refBillData.entries[i]);
      }
      return Number(sum).toFixed(2);
    },
    /** 合计金额（大写）显示值：引用单据时为全部明细金额合计的大写，否则为占位 */
    grandTotalDisplay() {
      if (!this.refBillData || !this.refBillData.entries || this.refBillData.entries.length === 0) return '—';
      let total = 0;
      this.refBillData.entries.forEach(entry => {
        total += this.getEntryAmt(entry);
      });
      const str = RMBConverter.numberToChinese(total);
      return str !== '' ? str : '零元整';
    },
    /** 每页行数，与表格行数一致 */
    refBillPageSize() {
      return Math.max(1, this.tablePreviewRows - 1);
    },
    /** 引用单据总页数（大于 pageSize 时多页） */
    refBillTotalPages() {
      if (!this.refBillData || !this.refBillData.entries || this.refBillData.entries.length === 0) return 1;
      return Math.ceil(this.refBillData.entries.length / this.refBillPageSize) || 1;
    },
    previewTableStyle() {
      return {
        fontSize: (this.form.fontSize || 14) + 'px',
        fontFamily: this.form.fontFamily || 'inherit',
        color: this.form.fontColor || '#000000',
        fontWeight: this.form.fontBold ? 'bold' : 'normal',
        fontStyle: this.form.fontItalic ? 'italic' : 'normal',
        textDecoration: this.form.fontUnderline ? 'underline' : 'none',
        textAlign: this.form.textAlign || 'left',
        verticalAlign: this.form.verticalAlign || 'middle',
        backgroundColor: (!this.form.fillColor || this.form.fillColor === 'transparent') ? 'transparent' : this.form.fillColor
      };
    },
    canUndo() {
      return this.designHistoryIndex > 0;
    },
    canRedo() {
      return this.designHistoryIndex >= 0 && this.designHistoryIndex < this.designHistory.length - 1;
    },
    titlePreviewItems() {
      const typeLabelMap = {
        warehouse: '仓库',
        department: '科室',
        supplier: '供应商',
        billNo: '单号',
        amount: '金额',
        invoiceNo: '发票号',
        creator: '制单人',
        createDate: '制单日期',
        auditor: '审核人',
        auditDate: '审核日期',
        printer: '打印人',
        printDate: '打印日期',
        receiver: '领用人',
        returner: '退库人',
        purchaser: '采购员',
        remark: '备注'
      };
      const items = [];
      for (let i = 1; i <= 6; i++) {
        const visible = !!this.form[`title${i}Visible`];
        if (!visible) continue;
        const type = this.form[`title${i}Type`];
        const customName = (this.form[`title${i}Name`] || '').trim();
        const label = customName || (type ? (typeLabelMap[type] || type) : `标题${i}`);
        const fixed = !!this.form[`title${i}FixedValue`];
        const fixedText = (this.form[`title${i}FixedValueText`] || '').trim();
        // 引用单据后：用单据数据填充；否则非固定值为空，实际打印时由后端填充
        const value = fixed ? fixedText : (this.refBillData && this.refBillData.bill && type ? this.getBillTitleValue(this.refBillData.bill, type) : '');
        const width = Number(this.form[`title${i}Width`]);
        const height = Number(this.form[`title${i}Height`]);
        items.push({
          key: `t-${i}`,
          label,
          value,
          width: Number.isFinite(width) && width > 0 ? width : null,
          height: Number.isFinite(height) && height > 0 && height <= 120 ? height : null
        });
      }
      return items;
    },
    /** 将标题预览分成两行，一行最多三列 */
    titlePreviewRows() {
      const rows = [];
      const items = this.titlePreviewItems;
      for (let i = 0; i < items.length; i += 3) {
        rows.push(items.slice(i, i + 3));
      }
      return rows.slice(0, 2);
    },
    /** 画布表头显示：组织机构 + 表头（模板名称/单据类型），例如：衡水市第三人民医院-出库单 */
    headerDisplayText() {
      const org = (this.orgName || '').trim();
      // 只根据单据类型生成标题，不再从“表头”输入框取值
      let header = '';
      if (this.form.billType != null) {
        const billTypeNameMap = {
          101: '入库单',
          102: '退货单',
          201: '出库单',
          202: '退库单',
          301: '盘点单',
          111: '入库单(高值)',
          112: '退货单(高值)',
          211: '出库单(高值)',
          212: '退库单(高值)',
          401: '跟台条码',
          402: '备货条码'
        };
        const key = Number(this.form.billType);
        header = billTypeNameMap[key] || '';
      }
      if (org && header) return `${org}-${header}`;
      if (header) return header;
      return org || '';
    },
    /** 画布上二维码图片地址，扫码结果为单号（引用单据时取实际单号，否则占位「单号」） */
    qrCodeImageUrl() {
      const billNo = (this.refBillData && this.refBillData.bill && this.refBillData.bill.billNo != null)
        ? String(this.refBillData.bill.billNo)
        : '单号';
      return `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(billNo)}`;
    },
    /** 画布上一维码图片地址，扫码结果为单号（与二维码数据源一致） */
    /** 当前选中的码（二维码或一维码）在画布上的位置 */
    currentCodePosition() {
      return this.form.codeDisplay === 'qr' ? this.form.qrPosition : this.form.codeDisplay === 'barcode' ? this.form.barcodePosition : { x: 0, y: 0 };
    },
    /** 当前选中的码的尺寸 */
    currentCodeSize() {
      return this.form.codeDisplay === 'qr' ? this.form.qrSize : this.form.codeDisplay === 'barcode' ? this.form.barcodeSize : { width: 64, height: 64 };
    },
    /** 码块容器样式：绝对定位，可拖拽 */
    codeWrapStyle() {
      const pos = this.currentCodePosition;
      const size = this.currentCodeSize;
      return {
        position: 'absolute',
        left: (pos && pos.x != null ? pos.x : 0) + 'px',
        top: (pos && pos.y != null ? pos.y : 0) + 'px',
        width: (size && size.width != null ? size.width : 64) + 'px',
        height: (size && size.height != null ? size.height : 64) + 'px',
        cursor: this.codeDragState ? 'grabbing' : 'move'
      };
    },
    /** 码图片/一维码裁剪盒尺寸 */
    currentCodeImgStyle() {
      const size = this.currentCodeSize;
      const w = size && size.width != null ? size.width : 64;
      const h = size && size.height != null ? size.height : 64;
      return { width: w + 'px', height: h + 'px' };
    },
    /** 一维码图片地址；translate=0 尝试不显示条码下方文字，若接口不支持则靠 CSS 裁剪只显示条带部分 */
    barcodeImageUrl() {
      const billNo = (this.refBillData && this.refBillData.bill && this.refBillData.bill.billNo != null)
        ? String(this.refBillData.bill.billNo)
        : '单号';
      return `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(billNo)}&code=Code128&dpi=96&dataseparator=&translate=0`;
    },
    /** 是否有任意标题配置行勾选“显示”，用于在画布上表头与表格之间展示标题区 */
    hasAnyTitleVisible() {
      return this.titlePreviewItems.length > 0;
    },
    /** 引用单据列表按单号模糊过滤（不区分大小写） */
    refBillListFiltered() {
      const list = this.refBillList || [];
      const q = (this.refBillSearchNo || '').trim();
      if (!q) return list;
      const lower = q.toLowerCase();
      return list.filter(row => {
        const no = (row.billNo != null ? String(row.billNo) : '');
        return no.toLowerCase().indexOf(lower) !== -1;
      });
    },
    /** 当前单据类型名称（引用单据弹窗用） */
    refBillTypeName() {
      const map = {
        101: '入库单',
        102: '退货单',
        201: '出库单',
        202: '退库单',
        301: '盘点单',
        111: '入库单(高值)',
        112: '退货单(高值)',
        211: '出库单(高值)',
        212: '退库单(高值)',
        401: '跟台条码',
        402: '备货条码'
      };
      return this.form.billType != null ? (map[this.form.billType] || '') : '';
    },
    /** 底部信息预览项：勾选显示且有类型的行 */
    bottomPreviewItems() {
      const typeLabelMap = {
        purchaser: '采购人',
        creator: '制单人',
        dispatcher: '配送人',
        receiver: '验收人',
        auditor: '复核人'
      };
      const items = [];
      for (let i = 1; i <= 5; i++) {
        const visible = !!this.form[`bottom${i}Visible`];
        if (!visible) continue;
        const type = this.form[`bottom${i}Type`];
        if (!type) continue;
        const label = typeLabelMap[type] || type;
        const fixed = !!this.form[`bottom${i}FixedValue`];
        const fixedText = (this.form[`bottom${i}FixedValueText`] || '').trim();
        const value = fixed ? fixedText : (this.refBillData && this.refBillData.bill && type ? this.getBillBottomValue(this.refBillData.bill, type) : '');
        const width = Number(this.form[`bottom${i}Width`]);
        const height = Number(this.form[`bottom${i}Height`]);
        items.push({
          key: `b-${i}`,
          label,
          value,
          width: Number.isFinite(width) && width > 0 ? width : null,
          height: Number.isFinite(height) && height > 0 ? height : null
        });
      }
      return items;
    },
    /** 底部信息每行4个参数 */
    bottomPreviewRows() {
      const rows = [];
      const items = this.bottomPreviewItems;
      for (let i = 0; i < items.length; i += 4) {
        rows.push(items.slice(i, i + 4));
      }
      return rows;
    },
    /** 是否有任意底部信息勾选"显示" */
    hasAnyBottomVisible() {
      return this.bottomPreviewItems.length > 0;
    },
    /** 画布表头每列显示文本（计算属性保证随 tableHeaderFields 更新） */
    canvasHeaderLabels() {
      const cols = this.tablePreviewCols;
      const labels = [];
      for (let i = 0; i < cols; i++) {
        const field = this.tableHeaderFields[i];
        if (!field) {
          labels.push('');
          continue;
        }
        const col = this.columnList.find(c => c.field === field);
        labels.push(col ? col.label : '');
      }
      return labels;
    },
    /** 画布表格总宽度(px)，用于固定表格宽度便于拖拽列宽 */
    tableTotalWidth() {
      const cols = this.tablePreviewCols;
      let sum = 0;
      for (let i = 0; i < cols; i++) {
        sum += this.canvasColumnWidths[i] || 80;
      }
      return Math.max(sum, 200);
    },
    /** 画布表格内联样式：宽度 + 行高（行高影响表格每行高度） */
    previewTableInlineStyle() {
      const rowHeight = Math.max(16, Math.min(120, Number(this.form.lineHeight) || 30));
      const border = this.form.tableBorder || 'all';
      const style = {
        tableLayout: 'fixed',
        width: this.tableTotalWidth + 'px',
        '--table-row-height': rowHeight + 'px'
      };
      if (border === 'none') {
        style.border = 'none';
        style.borderCollapse = 'collapse';
      } else if (border === 'outer') {
        style.border = '1px solid #000';
        style.borderCollapse = 'collapse';
      } else {
        style.borderCollapse = 'collapse';
      }
      return style;
    }
  },
  watch: {
    refBillTotalPages(n) {
      this.ensureDesignPages(Math.max(1, Number(n) || 1));
    },
    refBillPage(p) {
      const page = Math.max(1, Number(p) || 1);
      this.ensureDesignPages(page);
      if (this.activeDesignPageKey !== page) {
        this.activeDesignPageKey = page;
      }
    },
    formData: {
      handler(newVal) {
        if (newVal) {
          this.refBillData = null;
          this.refBillPage = 1;
          this.resetDesignPages();
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
              if (config.tableRows != null) this.form.tableRows = config.tableRows;
              if (config.tableColumns != null) this.form.tableColumns = config.tableColumns;
              // 仅编辑已有记录时从 config 恢复表头列，添加模式下不覆盖，避免父组件重传 formData 清空用户已选
              if (config.tableHeaderFields != null && Array.isArray(config.tableHeaderFields) && newVal.id != null) {
                this.tableHeaderFields = config.tableHeaderFields.slice(0);
              }
              this.headerMerges = Array.isArray(config.headerMerges) ? config.headerMerges : [];
              this.bodyMerges = Array.isArray(config.bodyMerges) ? config.bodyMerges : [];
              this.bodyCellTexts = config.bodyCellTexts || {};
              if (config.codeDisplay !== undefined && config.codeDisplay !== null) {
                this.form.codeDisplay = config.codeDisplay === 'qr' || config.codeDisplay === 'barcode' ? config.codeDisplay : '';
              } else {
                this.form.codeDisplay = config.showQrCode ? 'qr' : (config.showBarcode ? 'barcode' : '');
              }
              if (config.qrPosition && typeof config.qrPosition === 'object') {
                this.form.qrPosition = { x: Number(config.qrPosition.x) || 0, y: Number(config.qrPosition.y) || 0 };
              }
              if (config.qrSize && typeof config.qrSize === 'object') {
                this.form.qrSize = { width: Math.max(20, Number(config.qrSize.width) || 64), height: Math.max(20, Number(config.qrSize.height) || 64) };
              }
              if (config.barcodePosition && typeof config.barcodePosition === 'object') {
                this.form.barcodePosition = { x: Number(config.barcodePosition.x) || 0, y: Number(config.barcodePosition.y) || 0 };
              }
              if (config.barcodeSize && typeof config.barcodeSize === 'object') {
                this.form.barcodeSize = { width: Math.max(20, Number(config.barcodeSize.width) || 120), height: Math.max(20, Number(config.barcodeSize.height) || 28) };
              }
              this.form.showPageSubtotal = !!config.showPageSubtotal;
              this.form.showGrandTotal = !!config.showGrandTotal;
              if (config.fontItalic !== undefined) this.form.fontItalic = !!config.fontItalic;
              if (config.fontUnderline !== undefined) this.form.fontUnderline = !!config.fontUnderline;
              if (config.fillColor !== undefined) this.form.fillColor = config.fillColor;
              if (config.verticalAlign !== undefined) this.form.verticalAlign = config.verticalAlign;
              if (config.tableBorder !== undefined) this.form.tableBorder = config.tableBorder;
              if (config.paperSize !== undefined) this.form.paperSize = config.paperSize;
              if (config.printHeaderMode !== undefined) this.form.printHeaderMode = config.printHeaderMode;
              if (config.printFooterMode !== undefined) this.form.printFooterMode = config.printFooterMode;
              if (config.hideTrailingZero !== undefined) this.form.hideTrailingZero = !!config.hideTrailingZero;
              if (config.printZeroAsEmpty !== undefined) this.form.printZeroAsEmpty = !!config.printZeroAsEmpty;
              if (config.fixedRowCount !== undefined) this.form.fixedRowCount = !!config.fixedRowCount;
              if (config.pageJoinPrint !== undefined) this.form.pageJoinPrint = !!config.pageJoinPrint;
              // 底部信息配置
              for (let i = 1; i <= 5; i++) {
                const idx = String(i);
                const typeKey = 'bottom' + idx + 'Type';
                const widthKey = 'bottom' + idx + 'Width';
                const heightKey = 'bottom' + idx + 'Height';
                const visibleKey = 'bottom' + idx + 'Visible';
                const fixedKey = 'bottom' + idx + 'FixedValue';
                const fixedTextKey = 'bottom' + idx + 'FixedValueText';
                if (config[typeKey] !== undefined) this.form[typeKey] = config[typeKey];
                if (config[widthKey] !== undefined) this.form[widthKey] = config[widthKey];
                if (config[heightKey] !== undefined) this.form[heightKey] = config[heightKey];
                if (config[visibleKey] !== undefined) this.form[visibleKey] = !!config[visibleKey];
                if (config[fixedKey] !== undefined) this.form[fixedKey] = !!config[fixedKey];
                if (config[fixedTextKey] !== undefined) this.form[fixedTextKey] = config[fixedTextKey];
              }
              this.syncPaperSizeFromDimensions();
              this.headerSelectedCols = [];
              this.bodySelectedCells = [];
              this.editingBodyCell = null;
              for (let i = 1; i <= 6; i++) {
                const p = 'title' + i;
                if (config[p + 'Type'] !== undefined) this.form[p + 'Type'] = config[p + 'Type'];
                if (config[p + 'Name'] !== undefined) this.form[p + 'Name'] = config[p + 'Name'];
                if (config[p + 'Visible'] !== undefined) this.form[p + 'Visible'] = !!config[p + 'Visible'];
                if (config[p + 'FixedValue'] !== undefined) this.form[p + 'FixedValue'] = !!config[p + 'FixedValue'];
                if (config[p + 'FixedValueText'] !== undefined) this.form[p + 'FixedValueText'] = config[p + 'FixedValueText'];
                if (config[p + 'Width'] != null) this.form[p + 'Width'] = config[p + 'Width'];
                if (config[p + 'Height'] != null) this.form[p + 'Height'] = config[p + 'Height'];
              }
              this.ensureTableHeaderFieldsLength();
            } catch (e) {
              this.columnList = [...this.defaultColumns];
              this.headerMerges = [];
              this.bodyMerges = [];
              this.bodyCellTexts = {};
              this.form.codeDisplay = '';
              this.form.qrPosition = { x: 0, y: 0 };
              this.form.qrSize = { width: 64, height: 64 };
              this.form.barcodePosition = { x: 0, y: 0 };
              this.form.barcodeSize = { width: 120, height: 28 };
              this.form.showPageSubtotal = false;
              this.form.showGrandTotal = false;
              for (let i = 1; i <= 5; i++) {
                const idx = String(i);
                this.form['bottom' + idx + 'Type'] = '';
                this.form['bottom' + idx + 'Width'] = 300;
                this.form['bottom' + idx + 'Height'] = 22;
                this.form['bottom' + idx + 'Visible'] = true;
                this.form['bottom' + idx + 'FixedValue'] = false;
                this.form['bottom' + idx + 'FixedValueText'] = '';
              }
              this.headerSelectedCols = [];
              this.bodySelectedCells = [];
              this.editingBodyCell = null;
            }
          } else {
            this.columnList = [...this.defaultColumns];
            this.headerMerges = [];
            this.bodyMerges = [];
            this.bodyCellTexts = {};
            this.form.codeDisplay = '';
            this.form.qrPosition = { x: 0, y: 0 };
            this.form.qrSize = { width: 64, height: 64 };
            this.form.barcodePosition = { x: 0, y: 0 };
            this.form.barcodeSize = { width: 120, height: 28 };
            this.form.showPageSubtotal = false;
            this.form.showGrandTotal = false;
            for (let i = 1; i <= 5; i++) {
              const idx = String(i);
              this.form['bottom' + idx + 'Type'] = '';
              this.form['bottom' + idx + 'Width'] = 300;
              this.form['bottom' + idx + 'Height'] = 22;
              this.form['bottom' + idx + 'Visible'] = true;
              this.form['bottom' + idx + 'FixedValue'] = false;
              this.form['bottom' + idx + 'FixedValueText'] = '';
            }
            this.headerSelectedCols = [];
            this.bodySelectedCells = [];
            this.editingBodyCell = null;
          }
          this.ensureTableHeaderFieldsLength();
          this.syncPaperSizeFromDimensions();
        }
      },
      immediate: true,
      deep: true
    },
    'form.tableColumns'() {
      this.ensureTableHeaderFieldsLength();
    },
    columnList: {
      handler() {
        this.syncCanvasColumnWidthsFromConfig();
      },
      deep: true
    }
  },
  methods: {
    /** 判断表头基础列是否可见（合并后，仅合并块起始列可见） */
    isHeaderCellVisible(baseColIndex) {
      if (baseColIndex < 0) return false;
      const merge = this.headerMerges.find(
        m => baseColIndex >= m.start && baseColIndex < m.start + m.span
      );
      if (!merge) return true;
      return baseColIndex === merge.start;
    },
    /** 获取表头基础列的合并列数（colspan） */
    getHeaderCellColspan(baseColIndex) {
      if (baseColIndex < 0) return 1;
      const merge = this.headerMerges.find(m => m.start === baseColIndex);
      return merge ? Math.max(1, merge.span) : 1;
    },
    /** 表头列显示文本：已配置则显示列名，未配置为空（供方法调用） */
    getHeaderCellLabel(baseColIndex) {
      if (baseColIndex < 0) return '';
      const field = this.tableHeaderFields[baseColIndex];
      if (!field) return '';
      const col = this.columnList.find(c => c.field === field);
      return col ? col.label : '';
    },
    /** 表头列选择：直接写回 tableHeaderFields，用 $set 保证响应式，选中后立即显示 */
    setHeaderField(colIndex, value) {
      this.ensureTableHeaderFieldsLength();
      this.$set(this.tableHeaderFields, colIndex, value != null ? value : '');
    },
    /** 表头单元格是否被选中，用于高亮显示 */
    isHeaderCellSelected(baseColIndex) {
      return this.headerSelectedCols.indexOf(baseColIndex) !== -1;
    },
    /** 点击表头单元格，切换该基础列的选中状态 */
    onHeaderCellClick(baseColIndex) {
      if (baseColIndex < 0) return;
      const idx = this.headerSelectedCols.indexOf(baseColIndex);
      if (idx !== -1) {
        this.headerSelectedCols.splice(idx, 1);
      } else {
        this.headerSelectedCols.push(baseColIndex);
        this.headerSelectedCols.sort((a, b) => a - b);
      }
    },
    /** 判断当前基础列右侧是否需要显示列宽拖拽手柄（合并后的内部边界不显示） */
    shouldShowResizeHandle(baseColIndex) {
      const lastCol = this.tablePreviewCols - 1;
      if (baseColIndex < 0 || baseColIndex >= lastCol) {
        return false;
      }
      // 如果当前列与下一列在同一个合并块中，则不显示内部边界的拖拽手柄
      const inSameMerge = this.headerMerges.some(m => {
        const start = m.start;
        const end = m.start + m.span - 1;
        return baseColIndex >= start && baseColIndex < end && baseColIndex + 1 <= end;
      });
      return !inSameMerge;
    },
    /** 点击“合并”按钮：
     * - 若选中了表体格子：只合并该行中选中的相邻单元格
     * - 否则，若选中了表头列：按列范围进行表头合并
     */
    handleMergeCells() {
      // 优先处理表体合并
      if (this.bodySelectedCells && this.bodySelectedCells.length >= 2) {
        const rows = Array.from(new Set(this.bodySelectedCells.map(c => c.row)));
        if (rows.length !== 1) {
          this.$message && this.$message.warning('只能合并同一行内的相邻单元格');
          return;
        }
        const row = rows[0];
        const cols = this.bodySelectedCells.map(c => c.col).sort((a, b) => a - b);
        const start = cols[0];
        const last = cols[cols.length - 1];
        // 要求中间列也被选中，必须是连续
        const colSet = new Set(cols);
        for (let i = start; i <= last; i++) {
          if (!colSet.has(i)) {
            this.$message && this.$message.warning('只能合并同一行内连续的单元格');
            return;
          }
        }
        const span = last - start + 1;
        const end = start + span - 1;
        // 清理与新合并块有交集的旧配置（同一行）
        const mergedBody = [];
        for (const m of this.bodyMerges) {
          if (m.row !== row) {
            mergedBody.push(m);
            continue;
          }
          const mStart = m.start;
          const mEnd = m.start + m.span - 1;
          if (mEnd < start || mStart > end) {
            mergedBody.push(m);
          }
        }
        mergedBody.push({ row, start, span });
        mergedBody.sort((a, b) => (a.row - b.row) || (a.start - b.start));
        this.bodyMerges = mergedBody;
        this.bodySelectedCells = [];
        return;
      }

      // 若没有表体选择，再看是否有表头列选择，进行表头合并
      if (!this.headerSelectedCols || this.headerSelectedCols.length < 2) {
        this.$message && this.$message.warning('请先选择同一行内需要合并的单元格');
        return;
      }
      const selected = [...this.headerSelectedCols].sort((a, b) => a - b);
      const start = selected[0];
      const last = selected[selected.length - 1];
      const span = last - start + 1;
      const end = start + span - 1;
      const merged = [];
      for (const m of this.headerMerges) {
        const mStart = m.start;
        const mEnd = m.start + m.span - 1;
        if (mEnd < start || mStart > end) {
          merged.push(m);
        }
      }
      merged.push({ start, span });
      merged.sort((a, b) => a.start - b.start);
      this.headerMerges = merged;
      this.headerSelectedCols = [];
    },
    /** 某个数据行单元格在当前合并配置下是否可见（若在合并块内部且非起始列则隐藏） */
    isBodyCellVisible(rowIndex, colIndex) {
      if (rowIndex < 0 || colIndex < 0) return false;
      const merge = this.bodyMerges.find(
        m => m.row === rowIndex && colIndex >= m.start && colIndex < m.start + m.span
      );
      if (!merge) return true;
      return colIndex === merge.start;
    },
    /** 获取某个数据行单元格的 colspan（若为合并块起始格，则返回 span） */
    getBodyCellColspan(rowIndex, colIndex) {
      if (rowIndex < 0 || colIndex < 0) return 1;
      const merge = this.bodyMerges.find(
        m => m.row === rowIndex && m.start === colIndex
      );
      return merge ? Math.max(1, merge.span) : 1;
    },
    /** 数据行单元格是否被选中（用于高亮显示） */
    isBodyCellSelected(rowIndex, colIndex) {
      return this.bodySelectedCells.some(c => c.row === rowIndex && c.col === colIndex);
    },
    /** 点击数据行单元格：只高亮当前格子，不再联动列头 */
    onBodyCellClick(rowIndex, colIndex) {
      if (this.formatPainterActive && this.designClipboard) {
        const s = this.designClipboard;
        if (s.fontSize != null) this.form.fontSize = s.fontSize;
        if (s.fontBold != null) this.form.fontBold = s.fontBold;
        if (s.fontItalic != null) this.form.fontItalic = s.fontItalic;
        if (s.fontUnderline != null) this.form.fontUnderline = s.fontUnderline;
        if (s.fontColor != null) this.form.fontColor = s.fontColor;
        if (s.fillColor != null) this.form.fillColor = s.fillColor;
        if (s.textAlign != null) this.form.textAlign = s.textAlign;
        if (s.verticalAlign != null) this.form.verticalAlign = s.verticalAlign;
        this.formatPainterActive = false;
        this.pushDesignHistory();
        return;
      }
      // 切换当前单元格的选中状态
      const idx = this.bodySelectedCells.findIndex(c => c.row === rowIndex && c.col === colIndex);
      if (idx !== -1) {
        this.bodySelectedCells.splice(idx, 1);
      } else {
        this.bodySelectedCells.push({ row: rowIndex, col: colIndex });
      }
    },
    /** 获取某个单元格当前文本 */
    getBodyCellText(rowIndex, colIndex) {
      if (this.refBillData && this.refBillData.entries && this.refBillData.entries.length > 0) {
        const pageSize = this.refBillPageSize;
        const entryIndex = (this.refBillPage - 1) * pageSize + rowIndex;
        const entry = this.refBillData.entries[entryIndex];
        if (entry) {
          const field = this.tableHeaderFields[colIndex];
          if (field) {
            const val = entry[field] != null ? entry[field] : entry[field === 'price' ? 'unitPrice' : field];
            return val != null ? String(val) : '';
          }
        }
      }
      const key = `${rowIndex}_${colIndex}`;
      return this.bodyCellTexts[key] || '';
    },
    /** 判断某个单元格是否处于编辑状态 */
    isEditingBodyCell(rowIndex, colIndex) {
      return (
        this.editingBodyCell &&
        this.editingBodyCell.row === rowIndex &&
        this.editingBodyCell.col === colIndex
      );
    },
    /** 开始编辑指定单元格（双击触发） */
    startEditBodyCell(rowIndex, colIndex) {
      const key = `${rowIndex}_${colIndex}`;
      const current = this.bodyCellTexts[key] || '';
      this.editingBodyCell = {
        row: rowIndex,
        col: colIndex,
        value: current
      };
    },
    /** 取单条明细的金额（amt / amount / unitPrice*qty） */
    getEntryAmt(entry) {
      if (!entry) return 0;
      if (entry.amt != null && entry.amt !== '') return Number(entry.amt) || 0;
      if (entry.amount != null && entry.amount !== '') return Number(entry.amount) || 0;
      const p = entry.unitPrice != null && entry.unitPrice !== '' ? Number(entry.unitPrice) : (entry.price != null && entry.price !== '' ? Number(entry.price) : 0);
      const q = entry.qty != null && entry.qty !== '' ? Number(entry.qty) : 0;
      return p * q || 0;
    },
    /** 保存当前正在编辑的单元格内容 */
    saveBodyCellEdit() {
      if (!this.editingBodyCell) return;
      const { row, col, value } = this.editingBodyCell;
      const key = `${row}_${col}`;
      if (value && value !== '') {
        this.$set(this.bodyCellTexts, key, value);
      } else {
        // 空值则删除，保持配置简洁
        if (this.bodyCellTexts.hasOwnProperty(key)) {
          this.$delete(this.bodyCellTexts, key);
        }
      }
      this.editingBodyCell = null;
    },
    /** 计算页尾“小计/合计”每个单元格的 colspan，使其总和等于当前表格列数 */
    getFooterColspan(cellCount, index) {
      const totalCols = this.tablePreviewCols || 1;
      const base = Math.floor(totalCols / cellCount) || 1;
      const remainder = totalCols % cellCount;
      // 前 remainder 个单元格多分配一列
      if (index <= remainder) {
        return base + 1;
      }
      return base;
    },
    /** 标题预览项样式：根据配置宽度与高度控制在画布上的占位 */
    getTitleItemStyle(item) {
      const w = Number(item && item.width);
      const h = Number(item && item.height);
      const style = { display: 'inline-block' };
      if (Number.isFinite(w) && w > 0) style.width = w + 'px';
      if (Number.isFinite(h) && h > 0 && h <= 120) {
        style.minHeight = h + 'px';
        style.height = h + 'px';
      }
      return style;
    },
    /** 底部信息项样式：根据配置宽度与高度 */
    getBottomItemStyle(item) {
      const w = Number(item && item.width);
      const h = Number(item && item.height);
      const style = { display: 'inline-block' };
      if (Number.isFinite(w) && w > 0) style.width = w + 'px';
      if (Number.isFinite(h) && h > 0) {
        style.minHeight = h + 'px';
        style.height = h + 'px';
      }
      return style;
    },
    /** 底部信息行样式：根据该行最大高度 */
    getBottomRowStyle(rowIndex) {
      const base = rowIndex * 4 + 1;
      let h = 22;
      const items = this.bottomPreviewRows[rowIndex] || [];
      for (const it of items) {
        const v = Number(it && it.height);
        if (Number.isFinite(v) && v > 0 && v > h) h = v;
      }
      return { minHeight: h + 'px', height: h + 'px' };
    },
    /** 标题行样式：根据配置高度设置该行行高 */
    getTitleRowStyle(rowIndex) {
      const base = rowIndex * 3 + 1;
      let h = 22;
      for (let i = 0; i < 3; i++) {
        const v = Number(this.form['title' + (base + i) + 'Height']);
        if (Number.isFinite(v) && v > 0 && v <= 120 && v > h) h = v;
      }
      return { minHeight: h + 'px', height: h + 'px' };
    },
    onPreviewMouseDown(event) {
      if (!this.$refs.previewPaper) return;
      // 正在拖拽列宽时不再响应画布移动/缩放，避免整页跟着动
      if (this.colResizeState) return;

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
    /** 画布上单号码块 mousedown：开始拖拽移动（排除右下角缩放把手） */
    onCodeWrapMouseDown(event) {
      if (event.target && event.target.classList && event.target.classList.contains('code-resize-handle')) return;
      if (!this.$refs.previewPaper) return;
      const contentEl = this.$refs.previewPaper.querySelector('.paper-content');
      const contentRect = contentEl ? contentEl.getBoundingClientRect() : this.$refs.previewPaper.getBoundingClientRect();
      this.codeDragState = {
        startClientX: event.clientX,
        startClientY: event.clientY,
        startX: this.currentCodePosition.x || 0,
        startY: this.currentCodePosition.y || 0,
        contentWidth: contentRect.width,
        contentHeight: contentRect.height
      };
      this._onCodeMouseMove = (e) => {
        if (!this.codeDragState) return;
        const dx = e.clientX - this.codeDragState.startClientX;
        const dy = e.clientY - this.codeDragState.startClientY;
        let newX = this.codeDragState.startX + dx;
        let newY = this.codeDragState.startY + dy;
        const sz = this.currentCodeSize;
        const w = (sz && sz.width) || 64;
        const h = (sz && sz.height) || 64;
        newX = Math.max(0, Math.min(this.codeDragState.contentWidth - w, newX));
        newY = Math.max(0, Math.min(this.codeDragState.contentHeight - h, newY));
        if (this.form.codeDisplay === 'qr') {
          this.$set(this.form.qrPosition, 'x', Math.round(newX));
          this.$set(this.form.qrPosition, 'y', Math.round(newY));
        } else if (this.form.codeDisplay === 'barcode') {
          this.$set(this.form.barcodePosition, 'x', Math.round(newX));
          this.$set(this.form.barcodePosition, 'y', Math.round(newY));
        }
      };
      this._onCodeMouseUp = () => {
        this.codeDragState = null;
        window.removeEventListener('mousemove', this._onCodeMouseMove);
        window.removeEventListener('mouseup', this._onCodeMouseUp);
      };
      window.addEventListener('mousemove', this._onCodeMouseMove);
      window.addEventListener('mouseup', this._onCodeMouseUp);
    },
    /** 画布上单号码块右下角 mousedown：开始拉宽拉高 */
    onCodeResizeStart(event) {
      if (!this.$refs.previewPaper) return;
      this.codeResizeState = {
        startClientX: event.clientX,
        startClientY: event.clientY,
        startWidth: this.currentCodeSize.width || 64,
        startHeight: this.currentCodeSize.height || 64
      };
      this._onCodeResizeMove = (e) => {
        if (!this.codeResizeState) return;
        const dx = e.clientX - this.codeResizeState.startClientX;
        const dy = e.clientY - this.codeResizeState.startClientY;
        let w = Math.max(20, this.codeResizeState.startWidth + dx);
        let h = Math.max(20, this.codeResizeState.startHeight + dy);
        if (this.form.codeDisplay === 'qr') {
          this.$set(this.form.qrSize, 'width', Math.round(w));
          this.$set(this.form.qrSize, 'height', Math.round(h));
        } else if (this.form.codeDisplay === 'barcode') {
          this.$set(this.form.barcodeSize, 'width', Math.round(w));
          this.$set(this.form.barcodeSize, 'height', Math.round(h));
        }
      };
      this._onCodeResizeUp = () => {
        this.codeResizeState = null;
        window.removeEventListener('mousemove', this._onCodeResizeMove);
        window.removeEventListener('mouseup', this._onCodeResizeUp);
      };
      window.addEventListener('mousemove', this._onCodeResizeMove);
      window.addEventListener('mouseup', this._onCodeResizeUp);
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
            if (config.tableRows != null) this.form.tableRows = config.tableRows;
            if (config.tableColumns != null) this.form.tableColumns = config.tableColumns;
            if (config.tableHeaderFields != null) this.tableHeaderFields = Array.isArray(config.tableHeaderFields) ? [...config.tableHeaderFields] : [];
            this.headerMerges = Array.isArray(config.headerMerges) ? config.headerMerges : [];
            this.bodyMerges = Array.isArray(config.bodyMerges) ? config.bodyMerges : [];
            this.bodyCellTexts = config.bodyCellTexts || {};
            if (config.codeDisplay !== undefined && config.codeDisplay !== null) {
              this.form.codeDisplay = config.codeDisplay === 'qr' || config.codeDisplay === 'barcode' ? config.codeDisplay : '';
            } else {
              this.form.codeDisplay = config.showQrCode ? 'qr' : (config.showBarcode ? 'barcode' : '');
            }
            if (config.qrPosition && typeof config.qrPosition === 'object') {
              this.form.qrPosition = { x: Number(config.qrPosition.x) || 0, y: Number(config.qrPosition.y) || 0 };
            }
            if (config.qrSize && typeof config.qrSize === 'object') {
              this.form.qrSize = { width: Math.max(20, Number(config.qrSize.width) || 64), height: Math.max(20, Number(config.qrSize.height) || 64) };
            }
            if (config.barcodePosition && typeof config.barcodePosition === 'object') {
              this.form.barcodePosition = { x: Number(config.barcodePosition.x) || 0, y: Number(config.barcodePosition.y) || 0 };
            }
            if (config.barcodeSize && typeof config.barcodeSize === 'object') {
              this.form.barcodeSize = { width: Math.max(20, Number(config.barcodeSize.width) || 120), height: Math.max(20, Number(config.barcodeSize.height) || 28) };
            }
            this.form.showPageSubtotal = !!config.showPageSubtotal;
            this.form.showGrandTotal = !!config.showGrandTotal;
            if (config.fontItalic !== undefined) this.form.fontItalic = !!config.fontItalic;
            if (config.fontUnderline !== undefined) this.form.fontUnderline = !!config.fontUnderline;
            if (config.fillColor !== undefined) this.form.fillColor = config.fillColor;
            if (config.verticalAlign !== undefined) this.form.verticalAlign = config.verticalAlign;
            if (config.tableBorder !== undefined) this.form.tableBorder = config.tableBorder;
            if (config.paperSize !== undefined) this.form.paperSize = config.paperSize;
            if (config.printHeaderMode !== undefined) this.form.printHeaderMode = config.printHeaderMode;
            if (config.printFooterMode !== undefined) this.form.printFooterMode = config.printFooterMode;
            if (config.hideTrailingZero !== undefined) this.form.hideTrailingZero = !!config.hideTrailingZero;
            if (config.printZeroAsEmpty !== undefined) this.form.printZeroAsEmpty = !!config.printZeroAsEmpty;
            if (config.fixedRowCount !== undefined) this.form.fixedRowCount = !!config.fixedRowCount;
            if (config.pageJoinPrint !== undefined) this.form.pageJoinPrint = !!config.pageJoinPrint;
            this.syncPaperSizeFromDimensions();
            this.headerSelectedCols = [];
            this.bodySelectedCells = [];
            this.editingBodyCell = null;
            for (let i = 1; i <= 6; i++) {
              const p = 'title' + i;
              if (config[p + 'Type'] !== undefined) this.form[p + 'Type'] = config[p + 'Type'];
              if (config[p + 'Name'] !== undefined) this.form[p + 'Name'] = config[p + 'Name'];
              if (config[p + 'Visible'] !== undefined) this.form[p + 'Visible'] = !!config[p + 'Visible'];
              if (config[p + 'FixedValue'] !== undefined) this.form[p + 'FixedValue'] = !!config[p + 'FixedValue'];
              if (config[p + 'FixedValueText'] !== undefined) this.form[p + 'FixedValueText'] = config[p + 'FixedValueText'];
              if (config[p + 'Width'] != null) this.form[p + 'Width'] = config[p + 'Width'];
              if (config[p + 'Height'] != null) this.form[p + 'Height'] = config[p + 'Height'];
            }
            this.ensureTableHeaderFieldsLength();
          } catch (e) {
            this.columnList = [...this.defaultColumns];
            this.headerMerges = [];
            this.bodyMerges = [];
            this.bodyCellTexts = {};
            this.form.codeDisplay = '';
            this.form.qrPosition = { x: 0, y: 0 };
            this.form.qrSize = { width: 64, height: 64 };
            this.form.barcodePosition = { x: 0, y: 0 };
            this.form.barcodeSize = { width: 120, height: 28 };
            this.form.showPageSubtotal = false;
            this.form.showGrandTotal = false;
            this.headerSelectedCols = [];
            this.bodySelectedCells = [];
            this.editingBodyCell = null;
          }
        } else {
          this.columnList = [...this.defaultColumns];
          this.headerMerges = [];
          this.bodyMerges = [];
          this.bodyCellTexts = {};
          this.form.codeDisplay = '';
          this.form.qrPosition = { x: 0, y: 0 };
          this.form.qrSize = { width: 64, height: 64 };
          this.form.barcodePosition = { x: 0, y: 0 };
          this.form.barcodeSize = { width: 120, height: 28 };
          this.form.showPageSubtotal = false;
          this.form.showGrandTotal = false;
          this.headerSelectedCols = [];
          this.bodySelectedCells = [];
          this.editingBodyCell = null;
        }
      }
    },
    resetForm() {
      this.$refs.form.resetFields();
      this.form = {
        templateName: '',
        tenantId: '',
        billType: null,
        pageWidth: 210,
        pageHeight: 297,
        orientation: 'portrait',
        paperSize: 'custom',
        codeDisplay: '',
        qrPosition: { x: 0, y: 0 },
        qrSize: { width: 64, height: 64 },
        barcodePosition: { x: 0, y: 0 },
        barcodeSize: { width: 120, height: 28 },
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
        printHeaderMode: 'every',
        printFooterMode: 'last',
        hideTrailingZero: false,
        printZeroAsEmpty: false,
        fixedRowCount: false,
        pageJoinPrint: false,
        fontSize: 14,
        tableFontSize: 12,
        columnSpacing: 0,
        fontFamily: '',
        fontColor: '#000000',
        fontBold: false,
        fontItalic: false,
        fontUnderline: false,
        fillColor: 'transparent',
        verticalAlign: 'middle',
        tableBorder: 'all',
        textAlign: 'left',
        tableRows: 7,
        tableColumns: 10,
        lineHeight: 30,
        showPageSubtotal: false,
        showGrandTotal: false,
        showPurchaser: false,
        showCreator: true,
        showAuditor: true,
        showReceiver: false,
        purchaserLabel: '采购人',
        creatorLabel: '制单人',
        auditorLabel: '复核人',
        receiverLabel: '验收人',
        bottom1Type: '',
        bottom1Width: 300,
        bottom1Height: 22,
        bottom1Visible: true,
        bottom1FixedValue: false,
        bottom1FixedValueText: '',
        bottom2Type: '',
        bottom2Width: 300,
        bottom2Height: 22,
        bottom2Visible: true,
        bottom2FixedValue: false,
        bottom2FixedValueText: '',
        bottom3Type: '',
        bottom3Width: 300,
        bottom3Height: 22,
        bottom3Visible: true,
        bottom3FixedValue: false,
        bottom3FixedValueText: '',
        bottom4Type: '',
        bottom4Width: 300,
        bottom4Height: 22,
        bottom4Visible: true,
        bottom4FixedValue: false,
        bottom4FixedValueText: '',
        bottom5Type: '',
        bottom5Width: 300,
        bottom5Height: 22,
        bottom5Visible: true,
        bottom5FixedValue: false,
        bottom5FixedValueText: '',
        headerTitle: '',
        title1: '',
        title1Type: '',
        title1Name: '',
        title1Width: 300,
        title1Height: 22,
        title1Visible: true,
        title1FixedValue: false,
        title1FixedValueText: '',
        title2: '',
        title2Type: '',
        title2Name: '',
        title2Width: 300,
        title2Height: 22,
        title2Visible: true,
        title2FixedValue: false,
        title2FixedValueText: '',
        title3: '',
        title3Type: '',
        title3Name: '',
        title3Width: 300,
        title3Height: 22,
        title3Visible: true,
        title3FixedValue: false,
        title3FixedValueText: '',
        title4: '',
        title4Type: '',
        title4Name: '',
        title4Width: 300,
        title4Height: 22,
        title4Visible: true,
        title4FixedValue: false,
        title4FixedValueText: '',
        title5: '',
        title5Type: '',
        title5Name: '',
        title5Width: 300,
        title5Height: 22,
        title5Visible: true,
        title5FixedValue: false,
        title5FixedValueText: '',
        title6: '',
        title6Type: '',
        title6Name: '',
        title6Width: 300,
        title6Height: 22,
        title6Visible: true,
        title6FixedValue: false,
        title6FixedValueText: '',
        isDefault: 0,
        status: '0',
        remark: ''
      };
      const cid = this.$store.getters.customerId;
      if (cid) {
        this.form.tenantId = cid;
      }
      this.columnList = [...this.defaultColumns];
      this.tableHeaderFields = [];
      this.headerMerges = [];
      this.bodyMerges = [];
      this.headerSelectedCols = [];
      this.bodySelectedCells = [];
      this.bodyCellTexts = {};
      this.editingBodyCell = null;
      this.refBillData = null;
      this.refBillPage = 1;
      this.activeTab = "basic";
      this.activeBottomTab = "page";
      this.printCollapseActive = ['paper', 'margin'];
      this.canvasScrollLeft = 0;
      this.canvasScrollTop = 0;
      this.formatPainterActive = false;
      this.designClipboard = null;
      this.designHistory = [];
      this.designHistoryIndex = -1;
      this.resetDesignPages();
      this.$nextTick(() => this.pushDesignHistory());
    },
    resetDesignPages() {
      this.designPages = [{ key: 1, label: '分页1' }];
      this.activeDesignPageKey = 1;
    },
    ensureDesignPages(minCount) {
      const n = Math.max(1, Number(minCount) || 1);
      while (this.designPages.length < n) {
        const key = this.designPages.length + 1;
        this.designPages.push({ key, label: `分页${key}` });
      }
    },
    switchDesignPage(key) {
      const page = Math.max(1, Number(key) || 1);
      this.ensureDesignPages(page);
      this.activeDesignPageKey = page;
      this.refBillPage = page;
    },
    addDesignPage() {
      const key = this.designPages.length + 1;
      this.designPages.push({ key, label: `分页${key}` });
      this.activeDesignPageKey = key;
      this.refBillPage = key;
    },
    onCanvasScroll(e) {
      const el = e && e.target;
      if (!el) return;
      this.canvasScrollLeft = el.scrollLeft || 0;
      this.canvasScrollTop = el.scrollTop || 0;
    },
    applyPaperSize(value) {
      const key = value || this.form.paperSize;
      if (!key || key === 'custom') return;
      const opt = (this.paperSizeOptions || []).find(item => item.value === key);
      if (!opt || opt.width == null || opt.height == null) return;
      this.form.pageWidth = opt.width;
      this.form.pageHeight = opt.height;
      this.pushDesignHistory();
    },
    onPageSizeManualChange() {
      const w = Number(this.form.pageWidth);
      const h = Number(this.form.pageHeight);
      const matched = (this.paperSizeOptions || []).find(item => {
        if (item.value === 'custom' || item.width == null) return false;
        return Math.abs(item.width - w) < 0.05 && Math.abs(item.height - h) < 0.05;
      });
      this.form.paperSize = matched ? matched.value : 'custom';
      this.pushDesignHistory();
    },
    syncPaperSizeFromDimensions() {
      const w = Number(this.form.pageWidth);
      const h = Number(this.form.pageHeight);
      const matched = (this.paperSizeOptions || []).find(item => {
        if (item.value === 'custom' || item.width == null) return false;
        return Math.abs(item.width - w) < 0.05 && Math.abs(item.height - h) < 0.05;
      });
      this.form.paperSize = matched ? matched.value : 'custom';
    },
    handleSelectComponent(item) {
      if (!item || !item.key) return;
      this.selectedComponent = item.key;
      switch (item.key) {
        case 'qr':
          this.form.codeDisplay = 'qr';
          this.activeBottomTab = 'page';
          this.pushDesignHistory();
          break;
        case 'barcode':
          this.form.codeDisplay = 'barcode';
          this.activeBottomTab = 'page';
          this.pushDesignHistory();
          break;
        case 'text':
          this.activeBottomTab = 'title';
          break;
        case 'dataTable':
        case 'entryTable':
          this.activeTab = 'column';
          break;
        case 'header':
          this.activeBottomTab = 'title';
          for (let i = 1; i <= 3; i++) {
            if (this.form['title' + i + 'Visible'] === false) {
              this.form['title' + i + 'Visible'] = true;
            }
          }
          this.pushDesignHistory();
          break;
        case 'footer':
          this.activeTab = 'bottom';
          for (let i = 1; i <= 3; i++) {
            if (this.form['bottom' + i + 'Visible'] === false) {
              this.form['bottom' + i + 'Visible'] = true;
            }
          }
          this.pushDesignHistory();
          break;
        case 'image':
        case 'layoutGrid':
          this.$message && this.$message.info(item.label + '组件已选中，可在画布中继续配置');
          break;
        default:
          break;
      }
    },
    snapshotDesignState() {
      return JSON.stringify({
        form: this.form,
        columnList: this.columnList,
        tableHeaderFields: this.tableHeaderFields,
        headerMerges: this.headerMerges,
        bodyMerges: this.bodyMerges,
        bodyCellTexts: this.bodyCellTexts,
        canvasColumnWidths: this.canvasColumnWidths
      });
    },
    applyDesignSnapshot(raw) {
      if (!raw) return;
      try {
        const snap = JSON.parse(raw);
        this.designHistoryLock = true;
        if (snap.form) this.form = { ...this.form, ...snap.form };
        if (Array.isArray(snap.columnList)) this.columnList = snap.columnList;
        if (Array.isArray(snap.tableHeaderFields)) this.tableHeaderFields = snap.tableHeaderFields;
        if (Array.isArray(snap.headerMerges)) this.headerMerges = snap.headerMerges;
        if (Array.isArray(snap.bodyMerges)) this.bodyMerges = snap.bodyMerges;
        if (snap.bodyCellTexts) this.bodyCellTexts = snap.bodyCellTexts;
        if (Array.isArray(snap.canvasColumnWidths)) this.canvasColumnWidths = snap.canvasColumnWidths;
      } finally {
        this.$nextTick(() => { this.designHistoryLock = false; });
      }
    },
    pushDesignHistory() {
      if (this.designHistoryLock) return;
      const snap = this.snapshotDesignState();
      if (this.designHistoryIndex >= 0 && this.designHistory[this.designHistoryIndex] === snap) return;
      if (this.designHistoryIndex < this.designHistory.length - 1) {
        this.designHistory = this.designHistory.slice(0, this.designHistoryIndex + 1);
      }
      this.designHistory.push(snap);
      if (this.designHistory.length > 40) {
        this.designHistory.shift();
      }
      this.designHistoryIndex = this.designHistory.length - 1;
    },
    handleDesignUndo() {
      if (!this.canUndo) return;
      this.designHistoryIndex -= 1;
      this.applyDesignSnapshot(this.designHistory[this.designHistoryIndex]);
    },
    handleDesignRedo() {
      if (!this.canRedo) return;
      this.designHistoryIndex += 1;
      this.applyDesignSnapshot(this.designHistory[this.designHistoryIndex]);
    },
    toggleFontBold() {
      this.form.fontBold = !this.form.fontBold;
      this.pushDesignHistory();
    },
    toggleFontItalic() {
      this.form.fontItalic = !this.form.fontItalic;
      this.pushDesignHistory();
    },
    toggleFontUnderline() {
      this.form.fontUnderline = !this.form.fontUnderline;
      this.pushDesignHistory();
    },
    handleFontColorCommand(color) {
      this.form.fontColor = color;
      this.pushDesignHistory();
    },
    handleFillColorCommand(color) {
      this.form.fillColor = color;
      this.pushDesignHistory();
    },
    handleTextAlignCommand(align) {
      this.form.textAlign = align;
      this.pushDesignHistory();
    },
    handleVerticalAlignCommand(align) {
      this.form.verticalAlign = align;
      this.pushDesignHistory();
    },
    handleBorderCommand(cmd) {
      if (cmd === 'merge') {
        this.handleMergeCells();
        this.pushDesignHistory();
        return;
      }
      this.form.tableBorder = cmd;
      this.pushDesignHistory();
    },
    handlePlaceholderCommand(type) {
      const labelMap = {
        warehouse: '仓库',
        department: '科室',
        supplier: '供应商',
        billNo: '单号',
        remark: '备注'
      };
      const text = '{{' + (labelMap[type] || type) + '}}';
      if (this.bodySelectedCells && this.bodySelectedCells.length) {
        this.bodySelectedCells.forEach(cell => {
          const key = cell.row + '_' + cell.col;
          this.$set(this.bodyCellTexts, key, text);
        });
        this.pushDesignHistory();
        return;
      }
      this.$message && this.$message.info('请先在画布表格中选中单元格，再插入占位符');
    },
    toggleFormatPainter() {
      this.formatPainterActive = !this.formatPainterActive;
      if (this.formatPainterActive) {
        this.designClipboard = {
          fontSize: this.form.fontSize,
          fontBold: this.form.fontBold,
          fontItalic: this.form.fontItalic,
          fontUnderline: this.form.fontUnderline,
          fontColor: this.form.fontColor,
          fillColor: this.form.fillColor,
          textAlign: this.form.textAlign,
          verticalAlign: this.form.verticalAlign
        };
        this.$message && this.$message.success('格式刷已开启，再次点击关闭');
      }
    },
    handleDesignCopy() {
      if (this.bodySelectedCells && this.bodySelectedCells.length) {
        const texts = this.bodySelectedCells.map(c => this.bodyCellTexts[c.row + '_' + c.col] || '');
        this.designClipboard = { type: 'cells', cells: this.bodySelectedCells.map(c => ({ ...c })), texts };
        this.$message && this.$message.success('已复制选中单元格');
        return;
      }
      this.designClipboard = {
        type: 'style',
        fontSize: this.form.fontSize,
        fontBold: this.form.fontBold,
        fontItalic: this.form.fontItalic,
        fontUnderline: this.form.fontUnderline,
        fontColor: this.form.fontColor,
        fillColor: this.form.fillColor,
        textAlign: this.form.textAlign,
        verticalAlign: this.form.verticalAlign
      };
      this.$message && this.$message.success('已复制当前样式');
    },
    handleDesignDelete() {
      if (this.bodySelectedCells && this.bodySelectedCells.length) {
        this.bodySelectedCells.forEach(cell => {
          const key = cell.row + '_' + cell.col;
          this.$set(this.bodyCellTexts, key, '');
        });
        this.bodySelectedCells = [];
        this.pushDesignHistory();
        return;
      }
      if (this.headerSelectedCols && this.headerSelectedCols.length) {
        this.headerSelectedCols.forEach(col => {
          this.$set(this.tableHeaderFields, col, '');
        });
        this.headerSelectedCols = [];
        this.pushDesignHistory();
        return;
      }
      this.$message && this.$message.info('请先选中要删除的单元格或表头');
    },
    /** 保证 tableHeaderFields 长度不少于当前表格列数 */
    ensureTableHeaderFieldsLength() {
      const cols = Math.max(1, Math.min(20, Number(this.form.tableColumns) || 1));
      while (this.tableHeaderFields.length < cols) {
        this.tableHeaderFields.push('');
      }
      this.syncCanvasColumnWidthsFromConfig();
    },
    /** 根据列配置与表头选中的列，同步画布列宽数组（从 columnList 取对应 width） */
    syncCanvasColumnWidthsFromConfig() {
      const cols = this.tablePreviewCols;
      const minW = 40;
      const maxW = 400;
      for (let i = 0; i < cols; i++) {
        const field = this.tableHeaderFields[i];
        const col = this.columnList.find(c => c.field === field);
        const w = col ? (col.width || 80) : 80;
        const val = Math.min(maxW, Math.max(minW, Number(w) || 80));
        if (this.canvasColumnWidths[i] !== val) {
          this.$set(this.canvasColumnWidths, i, val);
        }
      }
      while (this.canvasColumnWidths.length > cols) {
        this.canvasColumnWidths.pop();
      }
    },
    /** 画布上开始拖拽列宽：列 colIndex 的右边缘 */
    startColResize(e, colIndex) {
      if (this.colResizeState) return;
      const startX = e.clientX;
      const startW = this.canvasColumnWidths[colIndex] || 80;
      const minW = 40;
      const maxW = 400;

      const onMove = (ev) => {
        const delta = ev.clientX - startX;
        let newW = startW + delta;
        newW = Math.min(maxW, Math.max(minW, newW));
        this.$set(this.canvasColumnWidths, colIndex, Math.round(newW));
        this.syncColumnConfigWidthFromCanvas(colIndex, Math.round(newW));
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        this.colResizeState = null;
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      this.colResizeState = { colIndex };
    },
    /** 将画布上第 colIndex 列的宽度同步回列配置中对应列的 width */
    syncColumnConfigWidthFromCanvas(colIndex, widthPx) {
      const field = this.tableHeaderFields[colIndex];
      if (!field) return;
      const col = this.columnList.find(c => c.field === field);
      if (col) {
        col.width = widthPx;
      }
    },
    /** 预览：调用全局打印插件，基于当前画布内容进行打印预览 */
    handlePreview() {
      if (this.$refs.previewPaper && this.$print) {
        // pageSize 使用 A4，可根据需要调整
        this.$print(this.$refs.previewPaper, {}, 'A4');
      } else {
        this.$message && this.$message.warning('当前环境暂不支持预览打印');
      }
    },
    /** 打开引用单据弹窗（需先选单据类型） */
    openRefBillDialog() {
      if (!this.form.billType) {
        this.$message && this.$message.warning('请先选择单据类型');
        return;
      }
      this.refBillDialogVisible = true;
    },
    /** 根据单据类型加载业务单列表；出库单只显示 CK 开头，入库单只保留当前类型（101/111） */
    loadRefBillList() {
      if (!this.form.billType) return;
      this.refBillLoading = true;
      this.refBillList = [];
      const query = { pageNum: 1, pageSize: 100 };
      const promise = this.form.billType === 201 || this.form.billType === 211
        ? listOutWarehouse(query)
        : this.form.billType === 101 || this.form.billType === 111
          ? listWarehouse(query)
          : Promise.resolve({ rows: [] });
      promise.then(res => {
        let rows = (res && res.rows) ? res.rows : [];
        if (Array.isArray(res)) rows = res;
        if (this.form.billType === 201 || this.form.billType === 211) {
          rows = rows.filter(row => (row.billNo || '').toString().toUpperCase().startsWith('CK'));
        }
        if (this.form.billType === 101 || this.form.billType === 111) {
          const wantType = Number(this.form.billType);
          rows = rows.filter(row => Number(row.billType) === wantType);
        }
        this.refBillList = rows;
      }).catch(() => {
        this.refBillList = [];
      }).finally(() => {
        this.refBillLoading = false;
      });
    },
    /** 选择引用单据：拉取单据详情并填充到画布，用于预览实际打印效果 */
    selectRefBill(row) {
      const id = row.id;
      if (id == null) {
        this.$message && this.$message.warning('无法获取单据详情');
        return;
      }
      this.refBillDialogVisible = false;
      this.refBillLoading = true;
      const isOut = this.form.billType === 201 || this.form.billType === 211;
      const promise = isOut ? getOutWarehouse(id) : (this.form.billType === 101 || this.form.billType === 111 ? getInWarehouse(id) : Promise.resolve({ data: null }));
      promise.then(response => {
        const data = response && response.data;
        if (!data) {
          this.refBillData = null;
          this.$message && this.$message.warning('暂不支持该单据类型的引用预览');
          return;
        }
        const entries = this.normalizeBillEntries(data);
        this.refBillData = { bill: data, entries };
        this.refBillPage = 1;
        this.$message && this.$message.success('已引用单据，画布将显示实际数据预览');
      }).catch(() => {
        this.refBillData = null;
        this.$message && this.$message.error('获取单据详情失败');
      }).finally(() => {
        this.refBillLoading = false;
      });
    },
    /** 根据单据主表数据取底部信息展示值（引用单据预览用） */
    getBillBottomValue(bill, type) {
      if (!bill || !type) return '';
      const v = (key) => (bill[key] != null && bill[key] !== '') ? String(bill[key]) : '';
      const objVal = (obj, key) => (obj && typeof obj === 'object' && obj[key] != null) ? String(obj[key]) : '';
      switch (type) {
        case 'purchaser': return v('purchaser') || v('purchaserName') || objVal(bill.user, 'nickName');
        case 'creator': return v('createrName') || objVal(bill.creater, 'nickName') || objVal(bill.creater, 'userName') || v('createBy');
        case 'dispatcher': return v('delPerson') || v('dispatcher') || v('dispatcherName');
        case 'receiver': return v('receiver') || v('receiverName') || objVal(bill.user, 'nickName') || objVal(bill.user, 'userName');
        case 'auditor': return v('auditPersonName') || objVal(bill.auditPerson, 'nickName') || objVal(bill.auditPerson, 'userName') || v('auditBy');
        default: return v(type);
      }
    },
    /** 根据单据主表数据取标题区展示值（引用单据预览用） */
    getBillTitleValue(bill, type) {
      if (!bill || !type) return '';
      const v = (key) => (bill[key] != null && bill[key] !== '') ? String(bill[key]) : '';
      const objName = (obj, key) => (obj && typeof obj === 'object' && obj[key] != null) ? String(obj[key]) : '';
      switch (type) {
        case 'billNo': return v('billNo');
        case 'warehouse': return objName(bill.warehouse, 'name') || v('warehouseName');
        case 'department': return objName(bill.department, 'name') || v('departmentName');
        case 'supplier': return objName(bill.supplier, 'supplierName') || objName(bill.supplier, 'name') || v('supplierName') || v('supplier');
        case 'amount': return (bill.totalAmount != null ? bill.totalAmount : bill.totalAmt != null ? bill.totalAmt : bill.amount) != null ? String(bill.totalAmount != null ? bill.totalAmount : (bill.totalAmt != null ? bill.totalAmt : bill.amount)) : '';
        case 'creator': return v('createrName') || objName(bill.creater, 'nickName') || objName(bill.creater, 'userName') || v('createBy');
        case 'createDate': return v('createTime') || v('billDate') || '';
        case 'auditor': return v('auditPersonName') || objName(bill.auditPerson, 'nickName') || objName(bill.auditPerson, 'userName') || v('auditBy');
        case 'auditDate': return v('auditDate');
        case 'printer': return v('printBy') || v('printer');
        case 'printDate': return v('printDate');
        case 'receiver': return v('receiver') || objName(bill.user, 'nickName') || objName(bill.user, 'userName');
        case 'returner': return v('returner');
        case 'purchaser': return v('purchaser') || v('purchaserName');
        case 'remark': return v('remark') || v('remarks');
        case 'invoiceNo': return v('invoiceNumber') || v('invoiceNo') || v('invoice_no');
        default: return v(type);
      }
    },
    /** 将接口返回的明细与 materialList 合并，得到每行可用于展示的字段（materialCode、materialName 等） */
    normalizeBillEntries(data) {
      const list = data.stkIoBillEntryList || [];
      const materialList = data.materialList || [];
      const map = {};
      materialList.forEach(it => { map[it.id] = it; });
      return list.map(item => {
        const prod = map[item.materialId] || {};
        const fdFactory = prod.fdFactory || {};
        const fdWarehouseCategory = prod.fdWarehouseCategory || {};
        return {
          ...item,
          materialCode: item.materialCode || prod.code,
          materialName: item.materialName || prod.name,
          materialSpeci: item.materialSpeci || prod.speci,
          price: item.unitPrice != null ? item.unitPrice : item.price,
          unitPrice: item.unitPrice != null ? item.unitPrice : item.price,
          factoryName: item.factoryName || (fdFactory && fdFactory.factoryName),
          warehouseCategoryName: item.warehouseCategoryName || (fdWarehouseCategory && fdWarehouseCategory.warehouseCategoryName),
          periodDate: item.periodDate != null ? item.periodDate : prod.periodDate
        };
      });
    },
    moveColumn(index, direction) {
      const newIndex = index + direction;
      if (newIndex >= 0 && newIndex < this.columnList.length) {
        const item = this.columnList.splice(index, 1)[0];
        this.columnList.splice(newIndex, 0, item);
      }
    },
    /** 排序列直接输入序号后重新排序 */
    updateColumnOrder(currentIndex, newOrderStr) {
      const newOrder = parseInt(newOrderStr, 10);
      if (!Number.isFinite(newOrder) || newOrder < 1 || newOrder > this.columnList.length) return;
      const targetIndex = newOrder - 1;
      if (targetIndex === currentIndex) return;
      const item = this.columnList.splice(currentIndex, 1)[0];
      this.columnList.splice(targetIndex, 0, item);
    },
    submitForm() {
      if (!this.$refs.form) {
        this.$message && this.$message.warning('表单未就绪，请稍后再试');
        return;
      }
      this.$refs.form.validate((valid, fields) => {
        if (!valid) {
          const first = fields && Object.keys(fields)[0];
          const msg = first && fields[first] && fields[first][0] && fields[first][0].message
            ? fields[first][0].message
            : '请完善必填项（如模板名称）';
          this.$message && this.$message.warning(msg);
          return;
        }
        const formData = { ...this.form };
        // 保存列配置、表格设置及画布表头列选择
        formData.columnConfig = JSON.stringify({
            columns: this.columnList,
            tableRows: this.form.tableRows,
            tableColumns: this.form.tableColumns,
            tableHeaderFields: this.tableHeaderFields.slice(0, Math.max(0, Number(this.form.tableColumns) || 0)),
            headerMerges: this.headerMerges,
            bodyMerges: this.bodyMerges,
            bodyCellTexts: this.bodyCellTexts,
            codeDisplay: this.form.codeDisplay || '',
            qrPosition: this.form.qrPosition ? { ...this.form.qrPosition } : { x: 0, y: 0 },
            qrSize: this.form.qrSize ? { ...this.form.qrSize } : { width: 64, height: 64 },
            barcodePosition: this.form.barcodePosition ? { ...this.form.barcodePosition } : { x: 0, y: 0 },
            barcodeSize: this.form.barcodeSize ? { ...this.form.barcodeSize } : { width: 120, height: 28 },
            showPageSubtotal: this.form.showPageSubtotal,
            showGrandTotal: this.form.showGrandTotal,
            fontItalic: !!this.form.fontItalic,
            fontUnderline: !!this.form.fontUnderline,
            fillColor: this.form.fillColor || 'transparent',
            verticalAlign: this.form.verticalAlign || 'middle',
            tableBorder: this.form.tableBorder || 'all',
            paperSize: this.form.paperSize || 'custom',
            printHeaderMode: this.form.printHeaderMode || 'every',
            printFooterMode: this.form.printFooterMode || 'last',
            hideTrailingZero: !!this.form.hideTrailingZero,
            printZeroAsEmpty: !!this.form.printZeroAsEmpty,
            fixedRowCount: !!this.form.fixedRowCount,
            pageJoinPrint: !!this.form.pageJoinPrint,
            bottom1Type: this.form.bottom1Type,
            bottom1Width: this.form.bottom1Width,
            bottom1Height: this.form.bottom1Height,
            bottom1Visible: this.form.bottom1Visible,
            bottom1FixedValue: this.form.bottom1FixedValue,
            bottom1FixedValueText: this.form.bottom1FixedValueText,
            bottom2Type: this.form.bottom2Type,
            bottom2Width: this.form.bottom2Width,
            bottom2Height: this.form.bottom2Height,
            bottom2Visible: this.form.bottom2Visible,
            bottom2FixedValue: this.form.bottom2FixedValue,
            bottom2FixedValueText: this.form.bottom2FixedValueText,
            bottom3Type: this.form.bottom3Type,
            bottom3Width: this.form.bottom3Width,
            bottom3Height: this.form.bottom3Height,
            bottom3Visible: this.form.bottom3Visible,
            bottom3FixedValue: this.form.bottom3FixedValue,
            bottom3FixedValueText: this.form.bottom3FixedValueText,
            bottom4Type: this.form.bottom4Type,
            bottom4Width: this.form.bottom4Width,
            bottom4Height: this.form.bottom4Height,
            bottom4Visible: this.form.bottom4Visible,
            bottom4FixedValue: this.form.bottom4FixedValue,
            bottom4FixedValueText: this.form.bottom4FixedValueText,
            bottom5Type: this.form.bottom5Type,
            bottom5Width: this.form.bottom5Width,
            bottom5Height: this.form.bottom5Height,
            bottom5Visible: this.form.bottom5Visible,
            bottom5FixedValue: this.form.bottom5FixedValue,
            bottom5FixedValueText: this.form.bottom5FixedValueText,
            title1Type: this.form.title1Type,
            title1Name: this.form.title1Name,
            title1Visible: this.form.title1Visible,
            title1FixedValue: this.form.title1FixedValue,
            title1FixedValueText: this.form.title1FixedValueText,
            title1Width: this.form.title1Width,
            title1Height: this.form.title1Height,
            title2Type: this.form.title2Type,
            title2Name: this.form.title2Name,
            title2Visible: this.form.title2Visible,
            title2FixedValue: this.form.title2FixedValue,
            title2FixedValueText: this.form.title2FixedValueText,
            title2Width: this.form.title2Width,
            title2Height: this.form.title2Height,
            title3Type: this.form.title3Type,
            title3Name: this.form.title3Name,
            title3Visible: this.form.title3Visible,
            title3FixedValue: this.form.title3FixedValue,
            title3FixedValueText: this.form.title3FixedValueText,
            title3Width: this.form.title3Width,
            title3Height: this.form.title3Height,
            title4Type: this.form.title4Type,
            title4Name: this.form.title4Name,
            title4Visible: this.form.title4Visible,
            title4FixedValue: this.form.title4FixedValue,
            title4FixedValueText: this.form.title4FixedValueText,
            title4Width: this.form.title4Width,
            title4Height: this.form.title4Height,
            title5Type: this.form.title5Type,
            title5Name: this.form.title5Name,
            title5Visible: this.form.title5Visible,
            title5FixedValue: this.form.title5FixedValue,
            title5FixedValueText: this.form.title5FixedValueText,
            title5Width: this.form.title5Width,
            title5Height: this.form.title5Height,
            title6Type: this.form.title6Type,
            title6Name: this.form.title6Name,
            title6Visible: this.form.title6Visible,
            title6FixedValue: this.form.title6FixedValue,
            title6FixedValueText: this.form.title6FixedValueText,
            title6Width: this.form.title6Width,
            title6Height: this.form.title6Height
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
            }).catch(err => {
              this.$message && this.$message.error(err && (err.msg || err.message) || '保存失败');
            });
          } else {
            addPrintSetting(formData).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.$emit('success');
            }).catch(err => {
              this.$message && this.$message.error(err && (err.msg || err.message) || '保存失败');
            });
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
  padding: 0;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  align-items: stretch;
}

.left-column {
  flex: 4;
  min-width: 0;
  min-height: 0;
  margin-right: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.left-panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  margin-right: 0;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #EBEEF5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* 顶行固定：角块 + 水平尺轨道 */
.ruler-top-row {
  flex-shrink: 0;
  display: flex;
  height: 50px;
  background: #f5f7fa;
  border-bottom: 2px solid #409eff;
  z-index: 6;
}

.ruler-corner {
  flex: 0 0 70px;
  width: 70px;
  height: 50px;
  background: #f5f7fa;
  border-right: 2px solid #409eff;
  box-sizing: border-box;
  z-index: 7;
}

.ruler-h-viewport {
  flex: 1;
  min-width: 0;
  height: 50px;
  overflow: hidden;
  position: relative;
}

.ruler-main-row {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}

.ruler-v-viewport {
  flex: 0 0 70px;
  width: 70px;
  overflow: hidden;
  position: relative;
  background: #f5f7fa;
  border-right: 2px solid #409eff;
  z-index: 6;
  box-sizing: border-box;
}

.left-panel-body {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  position: relative;
}

.ruler-panel {
  background-image:
    linear-gradient(to right, #e0e0e0 1px, transparent 1px),
    linear-gradient(to bottom, #e0e0e0 1px, transparent 1px);
  background-size: 37.8px 37.8px; /* 10mm = 37.8px */
  background-position: 0 0;
}

.template-preview {
  width: max-content;
  min-width: 100%;
  min-height: 100%;
  height: auto;
  position: relative;
  padding: 0 12px 8px 0;
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
  width: auto;
  height: auto;
  padding: 0;
  box-sizing: border-box;
}

.preview-paper {
  position: absolute;
  background: #ffffff;
  border: 1px solid #000000;
  transform-origin: top left;
}

/* 顶部水平尺子：轨道固定，刻度随左右滚动同步平移 */
.ruler-horizontal-main {
  position: relative;
  height: 50px;
  background: #f5f7fa;
  box-sizing: border-box;
  will-change: transform;
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

/* 左侧垂直尺子：轨道固定，刻度随上下滚动同步平移 */
.ruler-vertical-main {
  position: relative;
  width: 70px;
  background: #f5f7fa;
  box-sizing: border-box;
  overflow: visible;
  will-change: transform;
}

.ruler-mark-vertical {
  position: absolute;
  left: 0;
  right: 0;
  height: 18px;
  box-sizing: border-box;
  transform: translateY(-50%);
}

.ruler-mark-vertical .ruler-tick {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background: #409eff;
}

/* 与上方 major 24px / minor 10px 对应：贴右边向左伸出 */
.ruler-mark-vertical .ruler-tick.major {
  width: 24px;
  height: 2px;
}

.ruler-mark-vertical .ruler-tick.minor {
  width: 10px;
  height: 2px;
}

.ruler-number-left {
  margin-right: 0;
}

.ruler-mark-vertical .ruler-number {
  position: absolute;
  left: 2px;
  right: 28px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  font-weight: 700;
  color: #303133;
  writing-mode: horizontal-tb;
  text-orientation: mixed;
  white-space: nowrap;
  overflow: visible;
  text-align: right;
  background: #fff;
  padding: 1px 2px;
  border-radius: 2px;
  line-height: 1.1;
  box-sizing: border-box;
}

.paper-content {
  position: relative;
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
  gap: 2px;
}

.template-header {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  text-align: center;
  width: 100%;
  margin-bottom: 2px;
  padding-bottom: 2px;
}
.template-code-wrap {
  margin-bottom: 4px;
  box-sizing: border-box;
}
.template-code-wrap-draggable {
  z-index: 10;
  box-sizing: border-box;
}
.template-code-wrap .template-qrcode-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: fill;
}
/* 一维码容器：只显示条带区域，裁剪掉下方单号文字；尺寸由 codeWrapStyle/currentCodeImgStyle 控制 */
.template-barcode-clip {
  overflow: hidden;
  display: block;
  box-sizing: border-box;
}
.template-barcode-clip .template-barcode-img {
  width: 100%;
  height: 150%;
  min-height: 100%;
  object-fit: contain;
  object-position: top;
  display: block;
}
.code-resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 14px;
  height: 14px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 50%, rgba(64, 158, 255, 0.5) 50%);
  border-radius: 0 0 2px 0;
}
.code-resize-handle:hover {
  background: linear-gradient(135deg, transparent 50%, rgba(64, 158, 255, 0.8) 50%);
}
.form-item-tip {
  margin-left: 0;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}
.code-display-buttons {
  display: flex;
}
.code-display-buttons .el-radio-button__inner {
  padding: 8px 15px;
}

.paper-orientation-buttons {
  display: inline-flex;
}

.paper-orientation-buttons >>> .el-radio-button__inner {
  min-width: 56px;
  padding: 8px 14px;
  text-align: center;
}

.paper-size-row .el-form-item {
  margin-bottom: 12px;
}

.template-title {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

/* 标题配置行：表头与表格之间，两行一行三列布局 */
.template-title-container {
  margin-top: 2px;
  margin-bottom: 2px;
}

.template-title-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  padding: 2px 0;
}

.template-title-row + .template-title-row {
  margin-top: 4px;
}

.template-title-item {
  white-space: nowrap;
}

/* 底部信息：表格下方，一行最多四个参数 */
.template-bottom-container {
  margin-top: 4px;
  padding-top: 4px;
}

.template-bottom-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  padding: 2px 0;
}

.template-bottom-row + .template-bottom-row {
  margin-top: 4px;
}

.template-bottom-item {
  white-space: nowrap;
}

/* 画布内表格预览：随表格设置行/列数实时显示 */
.preview-table-wrap {
  width: 100%;
  margin-top: 2px;
  overflow: auto;
  max-height: 100%;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  empty-cells: show;
}

.preview-table td {
  border: 1px solid #909399;
  min-height: var(--table-row-height, 22px);
  height: var(--table-row-height, 22px);
  padding: 2px 6px;
  box-sizing: border-box;
}

.preview-table tbody tr:hover td {
  background-color: rgba(64, 158, 255, 0.06);
}

.preview-table thead th {
  border: 1px solid #909399;
  padding: 2px 4px;
  background: #f5f7fa;
  vertical-align: middle;
  min-height: var(--table-row-height, 22px);
  height: var(--table-row-height, 22px);
  box-sizing: border-box;
}

.preview-table-header-cell.is-selected {
  outline: 2px solid #409eff;
}

.preview-table-body-cell.is-selected {
  outline: 2px solid #409eff;
}

.preview-table-footer-cell {
  border: 1px solid #909399;
  padding: 2px 6px;
  box-sizing: border-box;
  text-align: left;
}

.preview-table-cell-inner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}

.preview-table-cell-input {
  width: 100%;
}

.preview-table-cell-text {
  display: inline-block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.line-height-merge-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.merge-cell-button {
  padding: 4px 8px;
}

.ref-bill-dialog-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 0;
}
.ref-bill-dialog-close {
  padding: 0;
  font-size: 14px;
}
.ref-bill-content {
  min-height: 200px;
}

.ref-bill-tip {
  margin-bottom: 12px;
  color: #606266;
  font-size: 14px;
}

.ref-bill-pager {
  margin-left: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.ref-bill-pager .pager-text {
  font-size: 13px;
  color: #606266;
}

.preview-table-header-cell,
.preview-table-body-cell {
  position: relative;
}

.preview-table-header-cell {
  min-width: 60px;
}

.canvas-header-select {
  width: 100%;
}

.canvas-header-text {
  display: inline-block;
  min-height: 20px;
  min-width: 20px;
  cursor: pointer;
}

.canvas-header-select .el-input__inner {
  height: 24px;
  line-height: 24px;
  font-size: 12px;
}

/* 列宽拖拽手柄：列与列之间的竖条 */
.col-resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 2;
}

.col-resize-handle:hover {
  background: rgba(64, 158, 255, 0.25);
}

.right-panel {
  flex: 2;
  min-width: 0;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #EBEEF5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  padding: 8px 16px 10px 16px;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.right-panel > .el-form,
.right-panel-form {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* 同一容器内上下两组 Tab，中间横线分隔 */
.right-panel-top {
  flex: 1 1 52%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: 4px;
}

.right-panel-bottom {
  flex: 1 1 48%;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin: 0;
  padding: 8px 0 0;
  border: none;
  border-top: 1px solid #dcdfe6;
  border-radius: 0;
  background: transparent;
  box-sizing: border-box;
}

.right-config-tabs,
.right-bottom-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.right-config-tabs >>> .el-tabs__header,
.right-bottom-tabs >>> .el-tabs__header {
  margin: 0 0 8px;
  flex-shrink: 0;
}

.right-config-tabs >>> .el-tabs__nav-wrap::after,
.right-bottom-tabs >>> .el-tabs__nav-wrap::after {
  height: 1px;
}

.right-config-tabs >>> .el-tabs__item,
.right-bottom-tabs >>> .el-tabs__item {
  padding: 0 12px;
  height: 36px;
  line-height: 36px;
  font-size: 13px;
}

.right-config-tabs >>> .el-tabs__content,
.right-bottom-tabs >>> .el-tabs__content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.right-config-tabs >>> .el-tab-pane,
.right-bottom-tabs >>> .el-tab-pane {
  padding-bottom: 8px;
}

.print-collapse {
  border: none;
}

.print-collapse >>> .el-collapse-item__header {
  height: 36px;
  line-height: 36px;
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 0 12px;
  margin-bottom: 0;
}

.print-collapse >>> .el-collapse-item + .el-collapse-item {
  margin-top: 8px;
}

.print-collapse >>> .el-collapse-item__wrap {
  border: none;
  background: transparent;
}

.print-collapse >>> .el-collapse-item__content {
  padding: 10px 4px 4px;
}

.print-collapse >>> .el-collapse-item__arrow {
  margin-right: 0;
}

.other-print-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  padding: 0 4px 4px;
}

.other-print-options .el-checkbox {
  margin-right: 0;
}

.component-palette {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 4px 2px 8px;
}

.component-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 84px;
  padding: 12px 8px 10px;
  background: #f4f7f9;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}

.component-card:hover {
  background: #eef3f8;
  border-color: #c6e2ff;
}

.component-card.active {
  background: #ecf5ff;
  border-color: #409eff;
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.2);
}

.component-card-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
  color: #303133;
}

.component-card-icon >>> svg {
  display: block;
}

.component-card-label {
  font-size: 13px;
  color: #303133;
  line-height: 1.2;
  text-align: center;
}

.design-page-tabs {
  flex-shrink: 0;
  height: 28px;
  display: flex;
  align-items: stretch;
  background: #f0f2f5;
  border-top: 1px solid #dcdfe6;
  overflow-x: auto;
  overflow-y: hidden;
}

.design-page-tab {
  flex: 0 0 auto;
  min-width: 64px;
  padding: 0 14px;
  font-size: 12px;
  color: #606266;
  background: #fff;
  border-right: 1px solid #dcdfe6;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.design-page-tab.active {
  color: #409eff;
  font-weight: 500;
}

.design-page-tab:hover {
  color: #409eff;
}

.design-page-add {
  flex: 0 0 auto;
  width: 32px;
  font-size: 16px;
  line-height: 1;
  color: #606266;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.design-page-add:hover {
  color: #409eff;
}

.form-toolbar {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 8px;
  text-align: left;
  padding: 4px 0 6px 4px !important;
  margin: 0 !important;
  background: #ffffff;
  border-bottom: none;
  flex-shrink: 0;
  min-height: 40px;
  box-sizing: border-box;
}

.form-toolbar > .el-button {
  margin-right: 0;
}

.design-toolbar {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  padding: 2px 6px;
  margin-right: 4px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  min-height: 32px;
}

.dt-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border: none;
  background: transparent;
  color: #303133;
  cursor: pointer;
  border-radius: 3px;
  line-height: 1;
  font-size: 14px;
}

.dt-btn:hover:not(:disabled) {
  background: #e6ebf5;
  color: #409eff;
}

.dt-btn:disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}

.dt-btn.active {
  background: #d9ecff;
  color: #409eff;
}

.dt-text {
  font-weight: 700;
  font-family: Georgia, 'Times New Roman', serif;
}

.dt-italic {
  font-style: italic;
}

.dt-underline {
  text-decoration: underline;
}

.dt-sep {
  width: 1px;
  height: 18px;
  margin: 0 4px;
  background: #dcdfe6;
  flex-shrink: 0;
}

.dt-font-size {
  width: 58px;
  margin: 0 2px;
}

.dt-font-size >>> .el-input__inner {
  height: 26px;
  line-height: 26px;
  padding: 0 22px 0 8px;
  text-align: center;
}

.dt-color-btn {
  flex-direction: column;
  padding: 2px 4px 1px;
  gap: 1px;
}

.dt-color-letter {
  font-weight: 700;
  font-size: 13px;
  line-height: 1;
}

.dt-color-bar {
  display: block;
  width: 14px;
  height: 3px;
  border-radius: 1px;
  background: #67c23a;
}

.dt-caret {
  margin-left: 2px;
  font-size: 10px;
  color: #909399;
}

.dt-placeholder-btn span {
  font-size: 13px;
  font-weight: 600;
}

.dt-color-menu {
  min-width: 120px;
}

.dt-color-picker-wrap {
  padding: 6px 12px 2px;
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

.table-config-input {
  width: 70px;
}

.table-settings-row {
  margin-left: -8px;
}

.column-config-table .el-table__cell {
  padding: 8px 10px;
}

.column-config-input {
  width: 70px;
}

.align-merge-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.align-merge-row .text-align-toolbar {
  flex-shrink: 0;
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
.title-config-row .el-input {
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
