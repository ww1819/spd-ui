<template>
  <div class="print-setting-form">
    <div class="dialog-layout" :class="{ 'is-right-collapsed': rightPanelCollapsed }">
      <!-- 左侧：工具条与画布（工具条与右侧面板顶对齐） -->
      <div class="left-column" :class="{ 'is-canvas-locked': !canOperateCanvas }">
    <!-- 顶部操作按钮行：设计工具条 + 保存等 -->
    <div class="form-toolbar">
      <div class="design-toolbar" @click.capture="onDesignToolbarCapture">
        <el-tooltip content="撤销" placement="bottom">
          <button type="button" class="dt-btn" :disabled="!canOperateCanvas || !canUndo" @click="handleDesignUndo">
            <i class="el-icon-refresh-left"></i>
          </button>
        </el-tooltip>
        <el-tooltip content="重做" placement="bottom">
          <button type="button" class="dt-btn" :disabled="!canOperateCanvas || !canRedo" @click="handleDesignRedo">
            <i class="el-icon-refresh-right"></i>
          </button>
        </el-tooltip>
        <span class="dt-sep"></span>
        <el-tooltip content="复制" placement="bottom">
          <button type="button" class="dt-btn" :disabled="!canOperateCanvas" @click="handleDesignCopy">
            <i class="el-icon-document-copy"></i>
          </button>
        </el-tooltip>
        <el-tooltip content="格式刷" placement="bottom">
          <button type="button" class="dt-btn" :disabled="!canOperateCanvas" :class="{ active: formatPainterActive }" @click="toggleFormatPainter">
            <i class="el-icon-brush"></i>
          </button>
        </el-tooltip>
        <el-tooltip content="删除" placement="bottom">
          <button type="button" class="dt-btn" :disabled="!canOperateCanvas" @click="handleDesignDelete">
            <i class="el-icon-delete"></i>
          </button>
        </el-tooltip>
        <span class="dt-sep"></span>
        <el-select
          v-model="toolbarFontSize"
          size="mini"
          class="dt-font-size"
          placeholder="字号"
        >
          <el-option v-for="s in designFontSizes" :key="'fs-' + s" :label="String(s)" :value="s" />
        </el-select>
        <el-tooltip content="加粗" placement="bottom">
          <button type="button" class="dt-btn dt-text" :class="{ active: !!toolbarFontBold }" @click="toggleFontBold">B</button>
        </el-tooltip>
        <el-tooltip content="斜体" placement="bottom">
          <button type="button" class="dt-btn dt-text dt-italic" :class="{ active: !!toolbarFontItalic }" @click="toggleFontItalic">I</button>
        </el-tooltip>
        <el-tooltip content="下划线" placement="bottom">
          <button type="button" class="dt-btn dt-text dt-underline" :class="{ active: !!toolbarFontUnderline }" @click="toggleFontUnderline">U</button>
        </el-tooltip>
        <el-dropdown trigger="click" @command="handleFontColorCommand">
          <button type="button" class="dt-btn dt-color-btn">
            <span class="dt-color-letter">A</span>
            <span class="dt-color-bar" :style="{ background: toolbarFontColor || '#000' }"></span>
            <i class="el-icon-arrow-down dt-caret"></i>
          </button>
          <el-dropdown-menu slot="dropdown" class="dt-color-menu">
            <div class="dt-color-picker-wrap" @click.stop>
              <el-color-picker v-model="toolbarFontColor" size="mini" />
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
            <span class="dt-color-bar" :style="{ background: toolbarFillColor || '#67C23A' }"></span>
            <i class="el-icon-arrow-down dt-caret"></i>
          </button>
          <el-dropdown-menu slot="dropdown" class="dt-color-menu">
            <div class="dt-color-picker-wrap" @click.stop>
              <el-color-picker v-model="toolbarFillColor" size="mini" show-alpha />
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
        <el-dropdown
          trigger="click"
          placement="bottom-start"
          :hide-on-click="false"
          @visible-change="onBorderMenuVisible"
        >
          <button type="button" class="dt-btn" :class="{ active: borderMenuVisible }">
            <span class="dt-border-trigger-icon" v-html="borderMenuIcons.grid"></span>
            <i class="el-icon-arrow-down dt-caret"></i>
          </button>
          <el-dropdown-menu slot="dropdown" class="dt-border-panel" @click.native.stop>
            <div
              v-for="item in borderMenuItems"
              :key="item.cmd"
              class="dt-border-item"
              :class="{ active: form.tableBorder === item.cmd }"
              @click="handleBorderCommand(item.cmd)"
            >
              <span class="dt-border-ico" v-html="item.icon"></span>
              <span class="dt-border-label">{{ item.label }}</span>
            </div>
            <div class="dt-border-divider"></div>
            <div
              class="dt-border-item has-sub"
              :class="{ active: borderSubMenu === 'style' }"
              @click.stop="toggleBorderSubMenu('style')"
            >
              <span class="dt-border-ico" v-html="borderMenuIcons.lineStyle"></span>
              <span class="dt-border-label">线条</span>
              <i class="el-icon-arrow-right dt-border-arrow"></i>
              <div
                v-show="borderSubMenu === 'style'"
                class="dt-border-submenu"
                @click.stop
              >
                <div
                  v-for="ls in borderLineStyles"
                  :key="ls.value"
                  class="dt-border-line-item"
                  :class="{ active: form.tableBorderStyle === ls.value }"
                  @click="handleBorderLineStyle(ls.value)"
                >
                  <span class="dt-border-line-preview" :style="ls.preview"></span>
                </div>
              </div>
            </div>
            <div
              class="dt-border-item has-sub"
              :class="{ active: borderSubMenu === 'color' }"
              @click.stop="toggleBorderSubMenu('color')"
            >
              <span class="dt-border-ico" v-html="borderMenuIcons.lineColor"></span>
              <span class="dt-border-label">线条颜色</span>
              <i class="el-icon-arrow-right dt-border-arrow"></i>
              <div
                v-show="borderSubMenu === 'color'"
                class="dt-border-submenu dt-border-color-submenu"
                @click.stop
              >
                <el-color-picker
                  v-model="form.tableBorderColor"
                  size="mini"
                  show-alpha
                  @change="handleBorderColorChange"
                />
                <div class="dt-border-color-presets">
                  <button
                    v-for="c in borderColorPresets"
                    :key="c"
                    type="button"
                    class="dt-border-color-swatch"
                    :style="{ background: c }"
                    :class="{ active: form.tableBorderColor === c }"
                    @click="handleBorderColorChange(c)"
                  />
                </div>
              </div>
            </div>
            <div class="dt-border-divider"></div>
            <div class="dt-border-item" @click="handleBorderCommand('merge')">
              <span class="dt-border-ico" v-html="borderMenuIcons.merge"></span>
              <span class="dt-border-label">合并单元格</span>
            </div>
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
      <el-button size="medium" :disabled="!canOperateCanvas" @click="handlePreview">预 览</el-button>
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
          <div class="ruler-corner">
            <el-dropdown
              trigger="click"
              class="canvas-zoom-dropdown"
              @command="onCanvasZoomCommand"
            >
              <span class="canvas-zoom-text">
                {{ canvasZoom }}%<i class="el-icon-arrow-down el-icon--right"></i>
              </span>
              <el-dropdown-menu slot="dropdown" class="canvas-zoom-menu">
                <el-dropdown-item
                  v-for="z in canvasZoomOptions"
                  :key="'zoom-' + z"
                  :command="z"
                  :class="{ 'is-active-zoom': z === canvasZoom }"
                >{{ z }}%</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
          <div class="ruler-h-viewport">
            <div
              class="ruler-horizontal-main"
              :style="{ width: rulerHorizontalWidthPx + 'px', transform: 'translateX(' + (-canvasScrollLeft) + 'px)' }"
            >
              <div
                v-if="rulerGuideRange"
                class="ruler-guide-h"
                :class="{ dragging: !!textDragState || !!codeDragState || !!labelDragState || !!tableDragState }"
                :style="{ left: rulerGuideRange.left + 'px', width: rulerGuideRange.width + 'px' }"
              />
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
                v-if="rulerGuideRange"
                class="ruler-guide-v"
                :class="{ dragging: !!textDragState || !!codeDragState || !!labelDragState || !!tableDragState }"
                :style="{ top: rulerGuideRange.top + 'px', height: rulerGuideRange.height + 'px' }"
              />
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
          <div
            class="left-panel-body ruler-panel"
            :style="rulerPanelGridStyle"
            @scroll="onCanvasScroll"
            @mousedown.capture="onCanvasAreaCapture"
          >
            <div
              v-if="!canOperateCanvas"
              class="canvas-billtype-mask"
              @mousedown.stop.prevent="ensureBillTypeReady"
              @click.stop.prevent="ensureBillTypeReady"
            >
              <div class="canvas-billtype-mask-tip">请先选择单据类型后再进行画布操作</div>
            </div>
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
              <!-- 自由文本组件：绝对定位于画布 -->
              <div
                v-for="item in canvasTexts"
                :key="item.id"
                class="canvas-text-widget canvas-widget"
                :class="[canvasWidgetClass('text:' + item.id), { 'is-editing': editingCanvasTextId === item.id }]"
                :style="getCanvasTextStyle(item)"
                @mouseenter="setCanvasHover('text:' + item.id)"
                @mouseleave="clearCanvasHover('text:' + item.id)"
                @mousedown.stop="onCanvasTextMouseDown($event, item)"
                @click.stop="selectCanvasText(item)"
                @dblclick.stop="onCanvasTextDblClick($event, item)"
              >
                <input
                  class="canvas-text-input"
                  :ref="'canvasTextInput-' + item.id"
                  :value="getCanvasTextDisplay(item)"
                  :placeholder="item.type ? fieldTypeLabel(item.type) : '文本'"
                  :readonly="editingCanvasTextId !== item.id"
                  @input="onCanvasTextInput(item, $event)"
                  @mousedown.stop="onCanvasTextInputMouseDown($event, item)"
                  @focus="selectCanvasText(item)"
                  @blur="onCanvasTextBlur(item)"
                />
                <div v-if="canvasSelectedKey === ('text:' + item.id)" class="canvas-select-handles">
                  <i v-for="h in canvasHandleDirs" :key="'txh-' + item.id + '-' + h" :class="['canvas-handle', h]" />
                </div>
              </div>
              <div class="template-preview-content" @mousedown.self="clearCanvasWidgetSelection">
                <div
                  v-if="canvasHeaderVisible && headerDisplayText"
                  class="template-header canvas-widget"
                  :class="canvasWidgetClass('header')"
                  @mouseenter="setCanvasHover('header')"
                  @mouseleave="clearCanvasHover('header')"
                  @dblclick.stop="selectCanvasWidget('header')"
                >
                  {{ headerDisplayText }}
                  <div v-if="canvasSelectedKey === 'header'" class="canvas-select-handles">
                    <i v-for="h in canvasHandleDirs" :key="'hh-' + h" :class="['canvas-handle', h]" />
                  </div>
                </div>
                <!-- 单号码：可拖拽移动、右下角拉拽缩放 -->
                <div
                  v-if="form.codeDisplay"
                  ref="codeWrapRef"
                  class="template-code-wrap template-code-wrap-draggable canvas-widget"
                  :class="canvasWidgetClass('code')"
                  :style="codeWrapStyle"
                  @mouseenter="setCanvasHover('code')"
                  @mouseleave="clearCanvasHover('code')"
                  @dblclick.stop="selectCanvasWidget('code')"
                  @mousedown.stop="onCodeWrapMouseDown"
                >
                  <img v-if="form.codeDisplay === 'qr'" :src="qrCodeImageUrl" alt="二维码(单号)" class="template-qrcode-img" :style="currentCodeImgStyle" />
                  <div v-if="form.codeDisplay === 'barcode'" class="template-barcode-clip" :style="currentCodeImgStyle">
                    <img :src="barcodeImageUrl" alt="一维码(单号)" class="template-barcode-img" />
                  </div>
                  <div class="code-resize-handle" @mousedown.stop.prevent="onCodeResizeStart" title="拖拽拉宽拉高"></div>
                  <div v-if="canvasSelectedKey === 'code'" class="canvas-select-handles">
                    <i v-for="h in canvasHandleDirs" :key="'ch-' + h" :class="['canvas-handle', h]" />
                  </div>
                </div>
                <!-- 标题配置：表头与表格之间显示各标题行（名称 + 固定值），两行三列布局 -->
                <template v-if="hasAnyTitleVisible">
                  <div class="template-title-container">
                    <div
                      v-for="(row, rowIndex) in titlePreviewRows"
                      :key="'title-row-' + rowIndex"
                      class="template-title-row"
                      :style="getTitleRowStyle(rowIndex)"
                    >
                      <span
                        v-for="item in row"
                        :key="item.key"
                        class="template-title-item canvas-widget"
                        :class="canvasWidgetClass('title:' + item.key)"
                        :style="getTitleItemStyle(item)"
                        @mouseenter="setCanvasHover('title:' + item.key)"
                        @mouseleave="clearCanvasHover('title:' + item.key)"
                        @mousedown.stop="onTitleItemMouseDown($event, item)"
                        @click.stop="selectCanvasWidget('title:' + item.key)"
                        @dblclick.stop="onTitleItemDblClick(item)"
                      >
                        {{ item.label }}<span v-if="item.value !== ''">: {{ item.value }}</span>
                        <div v-if="canvasSelectedKey === ('title:' + item.key)" class="canvas-select-handles">
                          <i v-for="h in canvasHandleDirs" :key="'th-' + item.key + '-' + h" :class="['canvas-handle', h]" />
                        </div>
                      </span>
                    </div>
                  </div>
                </template>
                <!-- 表格设置预览：第一行为列名，可下拉选择列配置；列与列之间可拖动调整宽度并同步到列配置 -->
                <div
                  v-if="canvasTableVisible"
                  class="preview-table-wrap canvas-widget"
                  :class="[canvasWidgetClass('table'), { 'is-table-dragging': !!tableDragState }]"
                  :style="previewTableWrapStyle"
                  @mouseenter="setCanvasHover('table')"
                  @mouseleave="clearCanvasHover('table')"
                  @mousedown.stop="onTableMouseDown"
                  @click.stop="onTableFrameClick"
                >
                  <div
                    v-if="canvasSelectedKey === 'table'"
                    class="canvas-select-handles is-interactive"
                  >
                    <i
                      v-for="h in canvasHandleDirs"
                      :key="'tbh-' + h"
                      :class="['canvas-handle', h]"
                      :title="'拖拽调整表格' + (h.indexOf('e') >= 0 || h.indexOf('w') >= 0 ? '宽度' : '') + (h.indexOf('n') >= 0 || h.indexOf('s') >= 0 ? '高度' : '')"
                      @mousedown.stop.prevent="startTableFrameResize(h, $event)"
                    />
                  </div>
                  <table
                    class="preview-table"
                    :class="previewTableBorderClass"
                    :style="previewTableInlineStyle"
                  >
                    <colgroup>
                      <col v-for="c in tablePreviewCols" :key="'col-' + c" :style="{ width: (canvasColumnWidths[c - 1] || 80) + 'px' }" />
                    </colgroup>
                    <thead>
                      <tr :style="getTableRowStyle(0)">
                        <th
                          v-for="c in tablePreviewCols"
                          v-if="isHeaderCellVisible(c - 1)"
                          :key="'h-' + (c - 1)"
                          class="preview-table-header-cell canvas-widget"
                          :class="[
                            { 'is-selected': isHeaderCellSelected(c - 1) },
                            canvasWidgetClass('header-cell:' + (c - 1))
                          ]"
                          :style="getTableCellStyle(0, c - 1)"
                          :colspan="getHeaderCellColspan(c - 1)"
                          @mouseenter="setCanvasHover('header-cell:' + (c - 1))"
                          @mouseleave="clearCanvasHover('header-cell:' + (c - 1))"
                          @click.stop="onHeaderCellSingleClick(c - 1, $event)"
                          @dblclick.stop="onHeaderCellDblClick(c - 1, $event)"
                        >
                          <span class="canvas-header-text" :style="getTableCellTextStyle(0, c - 1)">
                            <i v-if="tableHeaderFields[c - 1] === 'checkbox'" class="print-checkbox-square" title="选择框" />
                            <template v-else>{{ getHeaderCellLabel(c - 1) }}</template>
                          </span>
                          <span
                            v-if="shouldShowResizeHandle(c - 1)"
                            class="col-resize-handle"
                            @mousedown.prevent.stop="startColResize($event, c - 1)"
                          ></span>
                          <span
                            class="row-resize-handle"
                            title="拖拽调整本行高度"
                            @mousedown.prevent.stop="startRowResize($event, 0)"
                          ></span>
                          <div
                            v-if="canvasSelectedKey === ('header-cell:' + (c - 1)) || isHeaderCellSelected(c - 1)"
                            class="canvas-select-handles"
                          >
                            <i v-for="h in canvasHandleDirs" :key="'hch-' + (c - 1) + '-' + h" :class="['canvas-handle', h]" />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="rIndex in tablePreviewDataRows"
                        :key="'r-' + rIndex"
                        :style="getTableRowStyle(rIndex)"
                      >
                        <td
                          v-for="cIndex in tablePreviewCols"
                          v-if="isBodyCellVisible(rIndex - 1, cIndex - 1)"
                          :key="'c-' + (cIndex - 1)"
                          class="preview-table-body-cell canvas-widget"
                          :class="[
                            { 'is-selected': isBodyCellSelected(rIndex - 1, cIndex - 1) },
                            canvasWidgetClass('body-cell:' + (rIndex - 1) + ':' + (cIndex - 1))
                          ]"
                          :style="getTableCellStyle(rIndex, cIndex - 1)"
                          :colspan="getBodyCellColspan(rIndex - 1, cIndex - 1)"
                          @mouseenter="setCanvasHover('body-cell:' + (rIndex - 1) + ':' + (cIndex - 1))"
                          @mouseleave="clearCanvasHover('body-cell:' + (rIndex - 1) + ':' + (cIndex - 1))"
                          @click.stop="onBodyCellSingleClick(rIndex - 1, cIndex - 1, $event)"
                          @dblclick.stop="onBodyCellDblClick(rIndex - 1, cIndex - 1, $event)"
                        >
                          <div class="preview-table-cell-inner" :style="getTableCellTextStyle(rIndex, cIndex - 1)">
                            <el-input
                              v-if="isEditingBodyCell(rIndex - 1, cIndex - 1)"
                              v-model="editingBodyCell.value"
                              size="mini"
                              class="preview-table-cell-input"
                              @blur="saveBodyCellEdit"
                              @keyup.enter.native="saveBodyCellEdit"
                            />
                            <i
                              v-else-if="isCheckboxColumn(cIndex - 1)"
                              class="print-checkbox-square"
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
                          <span
                            class="row-resize-handle"
                            title="拖拽调整本行高度"
                            @mousedown.prevent.stop="startRowResize($event, rIndex)"
                          ></span>
                          <div
                            v-if="canvasSelectedKey === ('body-cell:' + (rIndex - 1) + ':' + (cIndex - 1)) || isBodyCellSelected(rIndex - 1, cIndex - 1)"
                            class="canvas-select-handles"
                          >
                            <i
                              v-for="h in canvasHandleDirs"
                              :key="'bch-' + (rIndex - 1) + '-' + (cIndex - 1) + '-' + h"
                              :class="['canvas-handle', h]"
                            />
                          </div>
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
                  <div class="template-bottom-container">
                    <div
                      v-for="(row, rowIndex) in bottomPreviewRows"
                      :key="'bottom-row-' + rowIndex"
                      class="template-bottom-row"
                      :style="getBottomRowStyle(rowIndex)"
                    >
                      <span
                        v-for="item in row"
                        :key="item.key"
                        class="template-bottom-item canvas-widget"
                        :class="canvasWidgetClass('bottom:' + item.key)"
                        :style="getBottomItemStyle(item)"
                        @mouseenter="setCanvasHover('bottom:' + item.key)"
                        @mouseleave="clearCanvasHover('bottom:' + item.key)"
                        @mousedown.stop="onBottomItemMouseDown($event, item)"
                        @click.stop="selectCanvasWidget('bottom:' + item.key)"
                        @dblclick.stop="onBottomItemDblClick(item)"
                      >
                        {{ item.label }}<span v-if="item.value !== ''">: {{ item.value }}</span>
                        <div v-if="canvasSelectedKey === ('bottom:' + item.key)" class="canvas-select-handles">
                          <i v-for="h in canvasHandleDirs" :key="'bh-' + item.key + '-' + h" :class="['canvas-handle', h]" />
                        </div>
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
      <!-- 右侧内容框：抽屉把手挂在面板左缘（靠近画布一侧顶部） -->
      <div
        class="right-panel-wrap"
        :class="{ 'is-collapsed': rightPanelCollapsed, 'is-animating': rightPanelAnimating }"
      >
        <div class="right-panel">
        <el-form ref="form" :model="form" :rules="rules" label-width="120px" class="right-panel-form">
          <div class="right-panel-top">
          <el-tabs v-model="activeTab" class="right-config-tabs">
          <!-- 基本信息 -->
          <el-tab-pane label="模板信息" name="basic">
          <el-row :gutter="8" class="template-basic-row">
            <el-col :span="12">
              <el-form-item label="模板名称" prop="templateName" label-width="80px">
                <el-input v-model="form.templateName" placeholder="模板名称" size="small" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="单据类型" prop="billType" label-width="80px">
                <el-select v-model="form.billType" placeholder="请选择单据类型" clearable size="small" style="width: 100%">
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
            </el-col>
          </el-row>
          <el-row :gutter="8" class="template-basic-row">
            <el-col :span="12">
              <el-form-item label="默认模板" prop="isDefault" required label-width="80px">
                <el-switch
                  v-model="form.isDefault"
                  :active-value="1"
                  :inactive-value="0"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="状态" prop="status" label-width="80px">
                <el-radio-group v-model="form.status">
                  <el-radio label="0">正常</el-radio>
                  <el-radio label="1">停用</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="备注" prop="remark" label-width="80px" class="template-remark-item">
            <el-input v-model="form.remark" placeholder="备注" size="small" />
          </el-form-item>
          </el-tab-pane>

          <!-- 组件设置：可插入组件卡片 -->
          <el-tab-pane label="组件设置" name="font">
            <div class="component-palette" :class="{ 'is-locked': !canOperateCanvas }">
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
          <!-- 标题配置 -->
          <el-tab-pane label="字段属性" name="title">
            <el-collapse v-model="fieldCollapseActive" class="print-collapse">
              <el-collapse-item title="数据源" name="dataSource">
                <el-form-item label-width="0" label="" class="title1-form-item">
                  <div class="title-config-row">
                    <el-select v-model="activeFieldType" placeholder="请选择" style="width: 140px;" size="small" clearable>
                      <el-option
                        v-for="opt in dataSourceFieldOptions"
                        :key="'ds-' + opt.value"
                        :label="opt.label"
                        :value="opt.value"
                      >
                        <span v-if="opt.value === 'checkbox'" class="ds-opt-checkbox">
                          <i class="print-checkbox-square" />
                          <span>选择框</span>
                        </span>
                        <span v-else>{{ opt.label }}</span>
                      </el-option>
                    </el-select>
                    <el-checkbox v-model="activeFieldVisible">显示</el-checkbox>
                    <el-checkbox v-model="activeFieldFixedValue">固定值</el-checkbox>
                    <el-input
                      v-if="activeFieldFixedValue"
                      v-model="activeFieldFixedValueText"
                      placeholder="固定值"
                      style="width: 100px;"
                      size="small"
                    />
                  </div>
                </el-form-item>
              </el-collapse-item>
              <el-collapse-item title="通用" name="common">
                <el-row :gutter="12" class="field-common-row">
                  <el-col :span="12">
                    <el-form-item label="宽" label-width="36px">
                      <el-input v-model.number="commonGeoWidth" placeholder="宽" size="small" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="高" label-width="36px">
                      <el-input v-model.number="commonGeoHeight" placeholder="高" size="small" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="12" class="field-common-row">
                  <el-col :span="12">
                    <el-form-item label="X" label-width="36px">
                      <el-input v-model.number="commonGeoX" placeholder="X" size="small" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="Y" label-width="36px">
                      <el-input v-model.number="commonGeoY" placeholder="Y" size="small" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-collapse-item>
            </el-collapse>
          </el-tab-pane>
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
                <el-form-item prop="printHeaderMode">
                  <span slot="label">
                    打印表头
                    <el-tooltip placement="top" popper-class="print-setting-tip">
                      <div slot="content">默认只打印首页。若设置每页都打印则表头字段会打印在每一张纸的表头。</div>
                      <i class="el-icon-question print-setting-help-icon" />
                    </el-tooltip>
                  </span>
                  <el-radio-group v-model="form.printHeaderMode" class="print-mode-buttons">
                    <el-radio-button label="first">只打印首页</el-radio-button>
                    <el-radio-button label="every">每页都打印</el-radio-button>
                  </el-radio-group>
                </el-form-item>
                <el-form-item prop="printFooterMode">
                  <span slot="label">
                    打印表尾
                    <el-tooltip placement="top" popper-class="print-setting-tip">
                      <div slot="content">默认只打印尾页。若设置每页都打印则表尾字段会打印在每一张纸的表尾。</div>
                      <i class="el-icon-question print-setting-help-icon" />
                    </el-tooltip>
                  </span>
                  <el-radio-group v-model="form.printFooterMode" class="print-mode-buttons">
                    <el-radio-button label="last">只打印末页</el-radio-button>
                    <el-radio-button label="every">每页都打印</el-radio-button>
                  </el-radio-group>
                </el-form-item>
                <div class="other-print-options">
                  <div class="other-print-option-item">
                    <el-checkbox v-model="form.hideTrailingZero">隐藏小数末位0</el-checkbox>
                    <el-tooltip placement="top" popper-class="print-setting-tip">
                      <div slot="content">参数开启，表示不打印小数点后面的尾0，如100.20，打印显示100.2，参数关闭则打印显示100.20。</div>
                      <i class="el-icon-question print-setting-help-icon" />
                    </el-tooltip>
                  </div>
                  <div class="other-print-option-item">
                    <el-checkbox v-model="form.printZeroAsEmpty">数额为0时打印为空</el-checkbox>
                    <el-tooltip placement="top" popper-class="print-setting-tip">
                      <div slot="content">参数开启，如金额为0时，打印显示为空，参数关闭，则打印显示为0。</div>
                      <i class="el-icon-question print-setting-help-icon" />
                    </el-tooltip>
                  </div>
                  <div class="other-print-option-item">
                    <el-checkbox v-model="form.fixedRowCount">固定行数</el-checkbox>
                    <el-tooltip placement="top" popper-class="print-setting-tip">
                      <div slot="content">开启固定行数后，展示单张行数的选项，默认是5，允许用户修改，需要控制大于等于1的正整数。</div>
                      <i class="el-icon-question print-setting-help-icon" />
                    </el-tooltip>
                  </div>
                  <div class="other-print-option-item">
                    <el-checkbox v-model="form.pageJoinPrint">分页拼接打印</el-checkbox>
                    <el-tooltip placement="top" popper-class="print-setting-tip">
                      <div slot="content">当存在多页内容时，每页内容动态输出，第一页内容输出完后需紧跟第二页的内容。</div>
                      <i class="el-icon-question print-setting-help-icon" />
                    </el-tooltip>
                  </div>
                </div>
                <el-row v-if="form.fixedRowCount" :gutter="20" class="fixed-rows-row">
                  <el-col :span="12">
                    <el-form-item label="单张行数" prop="fixedRowsPerPage">
                      <el-input
                        v-model.number="form.fixedRowsPerPage"
                        placeholder="请输入单张行数"
                        @change="normalizeFixedRowsPerPage"
                        @blur="normalizeFixedRowsPerPage"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-collapse-item>
            </el-collapse>
          </el-tab-pane>
            </el-tabs>
          </div>
        </el-form>
      </div>
        <el-tooltip :content="rightPanelCollapsed ? '展开右侧配置' : '收拢右侧配置'" placement="left">
          <button
            type="button"
            class="right-panel-drawer-handle"
            @click="toggleRightPanel"
          >
            <i :class="rightPanelCollapsed ? 'el-icon-d-arrow-left' : 'el-icon-d-arrow-right'"></i>
          </button>
        </el-tooltip>
      </div>
    </div>

    <PrintSettingRefBillDialog v-if="refBillDialogVisible" />

    <!-- 分录表格：网格设置 -->
    <el-dialog
      title="网格设置"
      :visible.sync="gridDialogVisible"
      width="420px"
      append-to-body
      custom-class="grid-setting-dialog"
      @closed="onGridDialogClosed"
    >
      <div class="grid-setting-body">
        <div class="grid-setting-inputs">
          <div class="grid-setting-field">
            <span class="grid-setting-label">行数</span>
            <el-input
              v-model.number="gridDraftRows"
              size="small"
              @change="normalizeGridDraft"
            />
          </div>
          <div class="grid-setting-field">
            <span class="grid-setting-label">列数</span>
            <el-input
              v-model.number="gridDraftCols"
              size="small"
              @change="normalizeGridDraft"
            />
          </div>
        </div>
        <div
          class="grid-setting-picker"
          @mouseleave="gridHoverRows = 0; gridHoverCols = 0"
        >
          <div
            v-for="r in gridMaxRows"
            :key="'grid-r-' + r"
            class="grid-setting-picker-row"
          >
            <div
              v-for="c in gridMaxCols"
              :key="'grid-c-' + r + '-' + c"
              class="grid-setting-cell"
              :class="{ active: isGridCellActive(r, c) }"
              @mouseenter="onGridCellHover(r, c)"
              @click="onGridCellClick(r, c)"
            />
          </div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button size="small" @click="gridDialogVisible = false">取消</el-button>
        <el-button type="primary" size="small" @click="confirmGridSetting">确定</el-button>
      </div>
    </el-dialog>
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
      /** 右侧下方：字段属性 / 打印设置 */
      activeBottomTab: "title",
      /** 打印设置折叠面板：默认全部展开 */
      printCollapseActive: ['paper', 'margin', 'other'],
      /** 字段属性：数据源 / 通用 */
      fieldCollapseActive: ['dataSource', 'common'],
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
        { value: 'Triple241x140', label: '三联纸241X140', width: 241, height: 140 },
        { value: 'custom', label: '自定义 [固定名称]', width: null, height: null }
      ],
      /** 组件设置选中项 */
      selectedComponent: '',
      /** 画布自由文本组件列表 */
      canvasTexts: [],
      canvasTextSeq: 1,
      textDragState: null,
      /** 双击进入编辑的画布文本 id；仅编辑态可改字，单击拖动 */
      editingCanvasTextId: null,
      /** 标题/底部标签拖拽状态 */
      labelDragState: null,
      /** 分录表格网格设置弹窗 */
      gridDialogVisible: false,
      gridDraftRows: 5,
      gridDraftCols: 7,
      gridHoverRows: 0,
      gridHoverCols: 0,
      gridMaxRows: 8,
      gridMaxCols: 10,
      /** 画布是否显示分录/数据表格（新增默认不显示） */
      canvasTableVisible: false,
      /** 画布是否显示页眉标题（新增默认不显示） */
      canvasHeaderVisible: false,
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
      /** 画布缩放比（%），默认 100 */
      canvasZoom: 100,
      canvasZoomOptions: [80, 100, 150, 200, 300],
      /** 右侧配置面板是否收拢 */
      rightPanelCollapsed: false,
      /** 右侧面板收放动画中（期间冻结刻度尺重算，避免抖动） */
      rightPanelAnimating: false,
      /** 画布组件悬停 / 双击选中 */
      canvasHoverKey: '',
      canvasSelectedKey: '',
      /** 各标签/文本独立样式：key 同 canvasSelectedKey（如 title:t-1、text:text-1） */
      elementStyles: {},
      /** 回填/加载模板时禁止自动插入单据类型标题文本 */
      suppressBillTypeTitleSync: false,
      canvasHandleDirs: ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'],
      /** 边框下拉菜单 */
      borderMenuVisible: false,
      borderSubMenu: '',
      borderColorPresets: ['#000000', '#FFFFFF', '#F56C6C', '#E6A23C', '#67C23A', '#409EFF', '#909399', '#303133'],
      borderLineStyles: [
        { value: 'thin', preview: { borderTop: '1px solid #303133' } },
        { value: 'medium', preview: { borderTop: '2px solid #303133' } },
        { value: 'thick', preview: { borderTop: '3px solid #303133' } },
        { value: 'dotted', preview: { borderTop: '2px dotted #303133' } },
        { value: 'dashed', preview: { borderTop: '2px dashed #303133' } }
      ],
      borderMenuIcons: {
        grid: '<svg viewBox="0 0 16 16" width="14" height="14"><path fill="currentColor" d="M2 2h5v5H2zm7 0h5v5H9zM2 9h5v5H2zm7 0h5v5H9z"/></svg>',
        left: '<svg viewBox="0 0 16 16" width="16" height="16"><rect x="2.5" y="2.5" width="11" height="11" fill="none" stroke="#c0c4cc"/><path d="M3 2.5v11" stroke="#303133" stroke-width="1.6"/></svg>',
        right: '<svg viewBox="0 0 16 16" width="16" height="16"><rect x="2.5" y="2.5" width="11" height="11" fill="none" stroke="#c0c4cc"/><path d="M13 2.5v11" stroke="#303133" stroke-width="1.6"/></svg>',
        top: '<svg viewBox="0 0 16 16" width="16" height="16"><rect x="2.5" y="2.5" width="11" height="11" fill="none" stroke="#c0c4cc"/><path d="M2.5 3h11" stroke="#303133" stroke-width="1.6"/></svg>',
        bottom: '<svg viewBox="0 0 16 16" width="16" height="16"><rect x="2.5" y="2.5" width="11" height="11" fill="none" stroke="#c0c4cc"/><path d="M2.5 13h11" stroke="#303133" stroke-width="1.6"/></svg>',
        outer: '<svg viewBox="0 0 16 16" width="16" height="16"><rect x="2.5" y="2.5" width="11" height="11" fill="none" stroke="#303133" stroke-width="1.6"/></svg>',
        inner: '<svg viewBox="0 0 16 16" width="16" height="16"><rect x="2.5" y="2.5" width="11" height="11" fill="none" stroke="#c0c4cc" stroke-dasharray="2 1"/><path d="M8 3v10M3 8h10" stroke="#303133" stroke-width="1.4"/></svg>',
        all: '<svg viewBox="0 0 16 16" width="16" height="16"><rect x="2.5" y="2.5" width="11" height="11" fill="none" stroke="#409eff" stroke-width="1.4"/><path d="M8 3v10M3 8h10" stroke="#409eff" stroke-width="1.4"/></svg>',
        none: '<svg viewBox="0 0 16 16" width="16" height="16"><rect x="2.5" y="2.5" width="11" height="11" fill="none" stroke="#c0c4cc" stroke-dasharray="2 1"/><path d="M8 3v10M3 8h10" stroke="#c0c4cc" stroke-dasharray="2 1"/></svg>',
        lineStyle: '<svg viewBox="0 0 16 16" width="16" height="16"><rect x="3" y="2" width="10" height="12" rx="1" fill="none" stroke="#303133"/><path d="M5 5h6M5 8h6M5 11h4" stroke="#303133" stroke-width="1.2"/></svg>',
        lineColor: '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M3 13l7.2-7.2 1.8 1.8L4.8 14.8H3z" fill="#303133"/><path d="M10.5 4.3l1.2-1.2a1 1 0 011.4 0l1 1a1 1 0 010 1.4l-1.2 1.2z" fill="#409eff"/></svg>',
        merge: '<svg viewBox="0 0 16 16" width="16" height="16"><rect x="2" y="3" width="12" height="10" fill="none" stroke="#303133"/><path d="M8 3v10M2 8h12" stroke="#c0c4cc"/><path d="M4 8h8" stroke="#409eff" stroke-width="1.6"/></svg>'
      },
      /** 画布可视区域尺寸（用于刻度尺铺满） */
      canvasViewportWidthPx: 0,
      canvasViewportHeightPx: 0,
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
        printHeaderMode: 'first',
        printFooterMode: 'last',
        hideTrailingZero: false,
        printZeroAsEmpty: false,
        fixedRowCount: false,
        /** 固定行数开启后的单张行数，默认 5，须为 >=1 的正整数 */
        fixedRowsPerPage: 5,
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
        tableBorderStyle: 'thin',
        tableBorderColor: '#000000',
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
        bottom1X: null,
        bottom1Y: null,
        bottom1Visible: false,
        bottom1FixedValue: false,
        bottom1FixedValueText: '',
        bottom2Type: '',
        bottom2Width: 300,
        bottom2Height: 22,
        bottom2X: null,
        bottom2Y: null,
        bottom2Visible: false,
        bottom2FixedValue: false,
        bottom2FixedValueText: '',
        bottom3Type: '',
        bottom3Width: 300,
        bottom3Height: 22,
        bottom3X: null,
        bottom3Y: null,
        bottom3Visible: false,
        bottom3FixedValue: false,
        bottom3FixedValueText: '',
        bottom4Type: '',
        bottom4Width: 300,
        bottom4Height: 22,
        bottom4X: null,
        bottom4Y: null,
        bottom4Visible: false,
        bottom4FixedValue: false,
        bottom4FixedValueText: '',
        bottom5Type: '',
        bottom5Width: 300,
        bottom5Height: 22,
        bottom5X: null,
        bottom5Y: null,
        bottom5Visible: false,
        bottom5FixedValue: false,
        bottom5FixedValueText: '',
        headerTitle: '',
        title1: '',
        title1Type: '',
        title1Name: '',
        title1Width: 300,
        title1Height: 22,
        title1X: null,
        title1Y: null,
        title1Visible: false,
        title1FixedValue: false,
        title1FixedValueText: '',
        title2: '',
        title2Type: '',
        title2Name: '',
        title2Width: 300,
        title2Height: 22,
        title2X: null,
        title2Y: null,
        title2Visible: false,
        title2FixedValue: false,
        title2FixedValueText: '',
        title3: '',
        title3Type: '',
        title3Name: '',
        title3Width: 300,
        title3Height: 22,
        title3X: null,
        title3Y: null,
        title3Visible: false,
        title3FixedValue: false,
        title3FixedValueText: '',
        title4: '',
        title4Type: '',
        title4Name: '',
        title4Width: 300,
        title4Height: 22,
        title4X: null,
        title4Y: null,
        title4Visible: false,
        title4FixedValue: false,
        title4FixedValueText: '',
        title5: '',
        title5Type: '',
        title5Name: '',
        title5Width: 300,
        title5Height: 22,
        title5X: null,
        title5Y: null,
        title5Visible: false,
        title5FixedValue: false,
        title5FixedValueText: '',
        title6: '',
        title6Type: '',
        title6Name: '',
        title6Width: 300,
        title6Height: 22,
        title6X: null,
        title6Y: null,
        title6Visible: false,
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
      /** 画布上行高(px)：下标 0=表头，其后为数据行 */
      canvasRowHeights: [],
      /** 列宽拖拽状态 */
      colResizeState: null,
      /** 行高拖拽状态 */
      rowResizeState: null,
      /** 整表外框宽高拖拽状态 */
      tableFrameResizeState: null,
      /** 整表在画布上的位置（相对 paper-content，px）；null 表示未拖过、跟随文档流 */
      canvasTableX: null,
      canvasTableY: null,
      /** 整表拖动位置状态 */
      tableDragState: null,
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
        ],
        billType: [
          { required: true, message: "单据类型不能为空", trigger: "change" }
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
    this._onDesignKeyDown = (e) => this.onDesignKeyDown(e);
    document.addEventListener('keydown', this._onDesignKeyDown);
    this.$nextTick(() => {
      this.pushDesignHistory();
      this.bindCanvasViewportObserver();
      this.updateCanvasViewportSize();
    });
  },
  beforeDestroy() {
    if (this._onDesignKeyDown) {
      document.removeEventListener('keydown', this._onDesignKeyDown);
      this._onDesignKeyDown = null;
    }
    this.unbindCanvasViewportObserver();
  },
  computed: {
    /** 1mm 对应像素（含画布缩放） */
    mmToPx() {
      const zoom = Number(this.canvasZoom) || 100;
      return 3.78 * (zoom / 100);
    },
    /** 画布网格背景随缩放变化（10mm 一格） */
    rulerPanelGridStyle() {
      const size = this.mmToPx * 10;
      return {
        backgroundSize: `${size}px ${size}px`
      };
    },
    previewStyle() {
      const width = this.form.pageWidth || 241;
      const height = this.form.pageHeight || 140;
      // 与尺子标记相同比例，并跟随画布缩放
      const mmToPx = this.mmToPx;
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
    /** 上尺：至少覆盖纸张/默认 310mm，并按画布可视宽度铺满 */
    rulerHorizontalMaxMm() {
      const paperW = Number(this.paperSizeMm.width) || 0;
      const base = 310;
      const paperMax = paperW > 0 ? Math.ceil(paperW / 10) * 10 : base;
      let viewportMax = 0;
      if (this.canvasViewportWidthPx > 0 && this.mmToPx > 0) {
        viewportMax = Math.ceil(this.canvasViewportWidthPx / this.mmToPx / 10) * 10;
      }
      return Math.max(base, paperMax, viewportMax);
    },
    /** 左尺：至少覆盖纸张/默认 160mm，并按画布可视高度铺满 */
    rulerVerticalMaxMm() {
      const paperH = Number(this.paperSizeMm.height) || 0;
      const base = 160;
      const paperMax = paperH > 0 ? Math.ceil(paperH / 10) * 10 : base;
      let viewportMax = 0;
      if (this.canvasViewportHeightPx > 0 && this.mmToPx > 0) {
        viewportMax = Math.ceil(this.canvasViewportHeightPx / this.mmToPx / 10) * 10;
      }
      return Math.max(base, paperMax, viewportMax);
    },
    rulerHorizontalWidthPx() {
      return Math.ceil(this.rulerHorizontalMaxMm * this.mmToPx);
    },
    rulerVerticalHeightPx() {
      return Math.ceil(this.rulerVerticalMaxMm * this.mmToPx);
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
    /**
     * 字段属性-数据源下拉：按单据类型返回可选字段。
     * 入库单(101)、出库单(201)使用指定字段集；其它类型暂用同一套（后续可再按类型扩展）。
     */
    dataSourceFieldOptions() {
      const specialFields = [
        { label: '序号', value: 'rowNo' },
        { label: '选择框', value: 'checkbox' }
      ];
      const key = this.canvasSelectedKey || '';
      // 选中表头/表体格：列字段 + 序号/选择框（用于分录列绑定）
      if (key.indexOf('header-cell:') === 0 || key.indexOf('body-cell:') === 0 || key === 'table') {
        const cols = (this.columnList || []).map(c => ({ label: c.label, value: c.field }));
        return specialFields.concat(cols);
      }
      const inOutFields = [
        { label: '仓库', value: 'warehouse' },
        { label: '科室', value: 'department' },
        { label: '供应商', value: 'supplier' },
        { label: '单号', value: 'billNo' },
        { label: '金额', value: 'amount' },
        { label: '发票号', value: 'invoiceNo' },
        { label: '制单人', value: 'creator' },
        { label: '审核人', value: 'auditor' },
        { label: '审核日期', value: 'auditDate' },
        { label: '制单日期', value: 'createDate' },
        { label: '打印日期', value: 'printDate' },
        { label: '领用人', value: 'receiver' },
        { label: '退库人', value: 'returner' },
        { label: '采购员', value: 'purchaser' },
        { label: '备注', value: 'remark' }
      ];
      return specialFields.concat(inOutFields);
    },
    /** 已选单据类型后才允许画布/组件操作 */
    canOperateCanvas() {
      return this.form.billType != null && this.form.billType !== '';
    },
    /** 当前选中/拖动组件在刻度尺上的高亮区间（相对预览容器像素） */
    rulerGuideRange() {
      const box = this.resolveActiveWidgetBox();
      if (!box) return null;
      const mmToPx = this.mmToPx || 1;
      const originX = (Number(this.form.marginLeft) || 0) * mmToPx + 1 + 15;
      const originY = (Number(this.form.marginTop) || 0) * mmToPx + 1 + 15;
      const left = originX + (Number(box.x) || 0);
      const top = originY + (Number(box.y) || 0);
      const width = Math.max(2, Number(box.w) || 0);
      const height = Math.max(2, Number(box.h) || 0);
      return { left, top, width, height };
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
    /** 当前是否选中了可独立调字体的标签/文本/底部项/表格单元格 */
    selectedTextWidgetKey() {
      const key = this.canvasSelectedKey || '';
      if (
        key.indexOf('title:') === 0 ||
        key.indexOf('bottom:') === 0 ||
        key.indexOf('text:') === 0 ||
        key.indexOf('header-cell:') === 0 ||
        key.indexOf('body-cell:') === 0
      ) {
        return key;
      }
      return '';
    },
    toolbarFontSize: {
      get() {
        return this.getToolbarStyleValue('fontSize', this.form.fontSize || 14);
      },
      set(v) {
        this.setToolbarStyleValue('fontSize', v);
      }
    },
    toolbarFontBold: {
      get() {
        return !!this.getToolbarStyleValue('fontBold', !!this.form.fontBold);
      },
      set(v) {
        this.setToolbarStyleValue('fontBold', !!v);
      }
    },
    toolbarFontItalic: {
      get() {
        return !!this.getToolbarStyleValue('fontItalic', !!this.form.fontItalic);
      },
      set(v) {
        this.setToolbarStyleValue('fontItalic', !!v);
      }
    },
    toolbarFontUnderline: {
      get() {
        return !!this.getToolbarStyleValue('fontUnderline', !!this.form.fontUnderline);
      },
      set(v) {
        this.setToolbarStyleValue('fontUnderline', !!v);
      }
    },
    toolbarFontColor: {
      get() {
        return this.getToolbarStyleValue('fontColor', this.form.fontColor || '#000000');
      },
      set(v) {
        this.setToolbarStyleValue('fontColor', v || '#000000');
      }
    },
    toolbarFillColor: {
      get() {
        return this.getToolbarStyleValue('fillColor', this.form.fillColor || 'transparent');
      },
      set(v) {
        this.setToolbarStyleValue('fillColor', v == null ? 'transparent' : v);
      }
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
        const xRaw = this.form[`title${i}X`];
        const yRaw = this.form[`title${i}Y`];
        items.push({
          key: `t-${i}`,
          index: i,
          label,
          value,
          width: Number.isFinite(width) && width > 0 ? width : null,
          height: Number.isFinite(height) && height > 0 && height <= 120 ? height : null,
          x: xRaw == null || xRaw === '' ? null : Number(xRaw),
          y: yRaw == null || yRaw === '' ? null : Number(yRaw)
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
        const xRaw = this.form[`bottom${i}X`];
        const yRaw = this.form[`bottom${i}Y`];
        items.push({
          key: `b-${i}`,
          index: i,
          label,
          value,
          width: Number.isFinite(width) && width > 0 ? width : null,
          height: Number.isFinite(height) && height > 0 ? height : null,
          x: xRaw == null || xRaw === '' ? null : Number(xRaw),
          y: yRaw == null || yRaw === '' ? null : Number(yRaw)
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
        labels.push(this.getHeaderCellLabel(i));
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
    /** 画布表格预估高度(px)：按各行实际行高累加 */
    tableTotalHeight() {
      const dataRows = Math.max(1, Number(this.tablePreviewDataRows) || 1);
      const def = Math.max(16, Math.min(120, Number(this.form.lineHeight) || 30));
      let sum = 0;
      for (let i = 0; i <= dataRows; i++) {
        const h = this.canvasRowHeights[i];
        sum += Math.max(16, Math.min(200, Number(h) || def));
      }
      if (this.form.showPageSubtotal) sum += def;
      if (this.form.showGrandTotal) sum += def;
      return sum + 8;
    },
    /** 边框菜单项（带图标） */
    borderMenuItems() {
      const ico = this.borderMenuIcons || {};
      return [
        { cmd: 'left', label: '左边框', icon: ico.left },
        { cmd: 'right', label: '右边框', icon: ico.right },
        { cmd: 'top', label: '上边框', icon: ico.top },
        { cmd: 'bottom', label: '下边框', icon: ico.bottom },
        { cmd: 'outer', label: '外边框', icon: ico.outer },
        { cmd: 'inner', label: '内边框', icon: ico.inner },
        { cmd: 'all', label: '所有边框', icon: ico.all },
        { cmd: 'none', label: '无边框', icon: ico.none }
      ];
    },
    /** 边框 CSS 线段 */
    tableBorderLineCss() {
      const color = this.form.tableBorderColor || '#000000';
      const styleMap = {
        thin: '1px solid',
        medium: '2px solid',
        thick: '3px solid',
        dotted: '2px dotted',
        dashed: '2px dashed'
      };
      const prefix = styleMap[this.form.tableBorderStyle] || '1px solid';
      return `${prefix} ${color}`;
    },
    /** 表格外框样式：宽高随列宽/行高；有坐标时绝对定位可拖动 */
    previewTableWrapStyle() {
      const base = this.previewTableStyle || {};
      const abs = this.canvasTableX != null && this.canvasTableY != null;
      const selected = this.canvasSelectedKey === 'table';
      return {
        ...base,
        width: this.tableTotalWidth + 'px',
        position: abs ? 'absolute' : 'relative',
        left: abs ? (Number(this.canvasTableX) || 0) + 'px' : undefined,
        top: abs ? (Number(this.canvasTableY) || 0) + 'px' : undefined,
        maxWidth: abs ? 'none' : '100%',
        boxSizing: 'content-box',
        zIndex: selected ? 11 : 4,
        cursor: selected || this.tableDragState ? 'move' : 'pointer'
      };
    },
    /** 画布表格内联样式：宽度 + 行高 + 边框模式 */
    previewTableInlineStyle() {
      const rowHeight = Math.max(16, Math.min(120, Number(this.form.lineHeight) || 30));
      const border = this.form.tableBorder || 'all';
      const line = this.tableBorderLineCss;
      const style = {
        tableLayout: 'fixed',
        width: '100%',
        '--table-row-height': rowHeight + 'px',
        '--table-border-line': line,
        borderCollapse: 'collapse'
      };
      if (border === 'none') {
        style.border = 'none';
      } else if (border === 'outer' || border === 'left' || border === 'right' || border === 'top' || border === 'bottom') {
        style.border = 'none';
        if (border === 'outer') style.border = line;
        if (border === 'left') style.borderLeft = line;
        if (border === 'right') style.borderRight = line;
        if (border === 'top') style.borderTop = line;
        if (border === 'bottom') style.borderBottom = line;
      }
      return style;
    },
    previewTableBorderClass() {
      return 'preview-table--' + (this.form.tableBorder || 'all');
    },
    /** 当前字段属性绑定目标：选中的文本/表头列优先，否则 title1 */
    activeFieldTarget() {
      const key = this.canvasSelectedKey || '';
      const headerMatch = /^header-cell:(\d+)$/.exec(key);
      if (headerMatch) {
        return { kind: 'headerCell', col: Number(headerMatch[1]) };
      }
      const bodyMatch = /^body-cell:(\d+):(\d+)$/.exec(key);
      if (bodyMatch) {
        return { kind: 'headerCell', col: Number(bodyMatch[2]) };
      }
      if (key.indexOf('text:') === 0) {
        const id = key.slice(5);
        const item = (this.canvasTexts || []).find(t => t.id === id);
        if (item) return { kind: 'text', item };
      }
      const titleMatch = /^title:t-(\d+)$/.exec(key);
      if (titleMatch) return { kind: 'title', index: Number(titleMatch[1]) };
      if (this.canvasTexts && this.canvasTexts.length) {
        return { kind: 'text', item: this.canvasTexts[this.canvasTexts.length - 1] };
      }
      return { kind: 'title', index: 1 };
    },
    activeFieldType: {
      get() {
        const t = this.activeFieldTarget;
        if (t.kind === 'headerCell') return this.tableHeaderFields[t.col] || '';
        if (t.kind === 'text') return t.item.type || '';
        return this.form['title' + t.index + 'Type'] || '';
      },
      set(v) {
        const t = this.activeFieldTarget;
        if (t.kind === 'headerCell') {
          this.setHeaderField(t.col, v || '');
          this.pushDesignHistory();
          return;
        }
        if (t.kind === 'text') {
          this.$set(t.item, 'type', v || '');
          return;
        }
        this.form['title' + t.index + 'Type'] = v || '';
      }
    },
    activeFieldVisible: {
      get() {
        const t = this.activeFieldTarget;
        if (t.kind === 'text') return t.item.visible !== false;
        return !!this.form['title' + t.index + 'Visible'];
      },
      set(v) {
        const t = this.activeFieldTarget;
        if (t.kind === 'text') {
          this.$set(t.item, 'visible', !!v);
          return;
        }
        this.form['title' + t.index + 'Visible'] = !!v;
      }
    },
    activeFieldFixedValue: {
      get() {
        const t = this.activeFieldTarget;
        if (t.kind === 'text') return !!t.item.fixedValue;
        return !!this.form['title' + t.index + 'FixedValue'];
      },
      set(v) {
        const t = this.activeFieldTarget;
        if (t.kind === 'text') {
          this.$set(t.item, 'fixedValue', !!v);
          return;
        }
        this.form['title' + t.index + 'FixedValue'] = !!v;
      }
    },
    activeFieldFixedValueText: {
      get() {
        const t = this.activeFieldTarget;
        if (t.kind === 'text') return t.item.fixedValueText || '';
        return this.form['title' + t.index + 'FixedValueText'] || '';
      },
      set(v) {
        const t = this.activeFieldTarget;
        if (t.kind === 'text') {
          this.$set(t.item, 'fixedValueText', v || '');
          return;
        }
        this.form['title' + t.index + 'FixedValueText'] = v || '';
      }
    },
    /** 通用面板：当前编辑目标（选中组件或默认 title1） */
    commonGeoTarget() {
      const key = this.canvasSelectedKey || '';
      if (key === 'table' && this.canvasTableVisible) {
        return { type: 'table' };
      }
      if (key.indexOf('text:') === 0) {
        const id = key.slice(5);
        const item = (this.canvasTexts || []).find(t => t.id === id);
        if (item) return { type: 'text', item };
      }
      if (key === 'code' && this.form.codeDisplay) {
        return { type: 'code' };
      }
      const titleMatch = /^title:t-(\d+)$/.exec(key);
      if (titleMatch) {
        return { type: 'title', index: Number(titleMatch[1]) };
      }
      const bottomMatch = /^bottom:b-(\d+)$/.exec(key) || /^bottom:(\d+)$/.exec(key);
      if (bottomMatch) {
        return { type: 'bottom', index: Number(bottomMatch[1]) };
      }
      if (this.canvasTexts && this.canvasTexts.length) {
        return { type: 'text', item: this.canvasTexts[this.canvasTexts.length - 1] };
      }
      return { type: 'title', index: 1 };
    },
    commonGeoWidth: {
      get() {
        const t = this.commonGeoTarget;
        if (t.type === 'table') return Number(this.tableTotalWidth) || 0;
        if (t.type === 'text') return Number(t.item.width) || 0;
        if (t.type === 'code') return Number(this.currentCodeSize.width) || 0;
        if (t.type === 'bottom') return Number(this.form['bottom' + t.index + 'Width']) || 0;
        return Number(this.form['title' + t.index + 'Width']) || 0;
      },
      set(v) {
        const n = Number(v);
        const t = this.commonGeoTarget;
        if (t.type === 'table') {
          if (!Number.isFinite(n) || n < 200) return;
          const startWidths = (this.canvasColumnWidths || []).map(w => Number(w) || 80);
          const startTotal = Math.max(200, startWidths.reduce((s, w) => s + w, 0));
          const scale = n / startTotal;
          for (let i = 0; i < startWidths.length; i++) {
            const nw = Math.min(400, Math.max(40, Math.round(startWidths[i] * scale)));
            this.$set(this.canvasColumnWidths, i, nw);
            this.syncColumnConfigWidthFromCanvas(i, nw);
          }
          this.pushDesignHistory();
          return;
        }
        if (t.type === 'text') {
          this.$set(t.item, 'width', Number.isFinite(n) ? Math.max(20, n) : 120);
          return;
        }
        if (t.type === 'code') {
          const size = this.form.codeDisplay === 'qr' ? this.form.qrSize : this.form.barcodeSize;
          if (size) this.$set(size, 'width', Number.isFinite(n) ? Math.max(1, n) : 64);
          return;
        }
        if (t.type === 'bottom') {
          this.form['bottom' + t.index + 'Width'] = Number.isFinite(n) ? n : 300;
          return;
        }
        this.form['title' + t.index + 'Width'] = Number.isFinite(n) ? n : 300;
      }
    },
    commonGeoHeight: {
      get() {
        const t = this.commonGeoTarget;
        if (t.type === 'table') return Number(this.tableTotalHeight) || 0;
        if (t.type === 'text') return Number(t.item.height) || 0;
        if (t.type === 'code') return Number(this.currentCodeSize.height) || 0;
        if (t.type === 'bottom') return Number(this.form['bottom' + t.index + 'Height']) || 0;
        return Number(this.form['title' + t.index + 'Height']) || 0;
      },
      set(v) {
        const n = Number(v);
        const t = this.commonGeoTarget;
        if (t.type === 'table') {
          if (!Number.isFinite(n) || n < 16) return;
          this.ensureCanvasRowHeights();
          const dataRows = Math.max(1, Number(this.tablePreviewDataRows) || 1);
          const count = dataRows + 1;
          const target = Math.max(16 * count, n - 8);
          const scale = target / Math.max(1, this.tableTotalHeight - 8);
          for (let i = 0; i < count; i++) {
            const cur = this.getTableRowHeight(i);
            this.$set(this.canvasRowHeights, i, Math.max(16, Math.min(200, Math.round(cur * scale))));
          }
          this.form.lineHeight = this.getTableRowHeight(0);
          this.pushDesignHistory();
          return;
        }
        if (t.type === 'text') {
          this.$set(t.item, 'height', Number.isFinite(n) ? Math.max(16, n) : 28);
          return;
        }
        if (t.type === 'code') {
          const size = this.form.codeDisplay === 'qr' ? this.form.qrSize : this.form.barcodeSize;
          if (size) this.$set(size, 'height', Number.isFinite(n) ? Math.max(1, n) : 64);
          return;
        }
        if (t.type === 'bottom') {
          this.form['bottom' + t.index + 'Height'] = Number.isFinite(n) ? n : 22;
          return;
        }
        this.form['title' + t.index + 'Height'] = Number.isFinite(n) ? n : 22;
      }
    },
    commonGeoX: {
      get() {
        const t = this.commonGeoTarget;
        if (t.type === 'table') {
          return this.canvasTableX == null ? null : Number(this.canvasTableX);
        }
        if (t.type === 'text') return Number(t.item.x) || 0;
        if (t.type === 'code') return Number(this.currentCodePosition.x) || 0;
        if (t.type === 'bottom') {
          const v = this.form['bottom' + t.index + 'X'];
          return v == null || v === '' ? null : Number(v);
        }
        const v = this.form['title' + t.index + 'X'];
        return v == null || v === '' ? null : Number(v);
      },
      set(v) {
        const t = this.commonGeoTarget;
        const raw = v === '' || v == null ? null : Number(v);
        if (t.type === 'table') {
          this.canvasTableX = Number.isFinite(raw) ? raw : 0;
          if (this.canvasTableY == null) this.canvasTableY = 0;
          this.pushDesignHistory();
          return;
        }
        if (t.type === 'text') {
          this.$set(t.item, 'x', Number.isFinite(raw) ? raw : 0);
          return;
        }
        if (t.type === 'code') {
          const pos = this.form.codeDisplay === 'qr' ? this.form.qrPosition : this.form.barcodePosition;
          if (pos) this.$set(pos, 'x', Number.isFinite(raw) ? raw : 0);
          return;
        }
        if (t.type === 'bottom') {
          this.$set(this.form, 'bottom' + t.index + 'X', Number.isFinite(raw) ? raw : null);
          return;
        }
        this.$set(this.form, 'title' + t.index + 'X', Number.isFinite(raw) ? raw : null);
      }
    },
    commonGeoY: {
      get() {
        const t = this.commonGeoTarget;
        if (t.type === 'table') {
          return this.canvasTableY == null ? null : Number(this.canvasTableY);
        }
        if (t.type === 'text') return Number(t.item.y) || 0;
        if (t.type === 'code') return Number(this.currentCodePosition.y) || 0;
        if (t.type === 'bottom') {
          const v = this.form['bottom' + t.index + 'Y'];
          return v == null || v === '' ? null : Number(v);
        }
        const v = this.form['title' + t.index + 'Y'];
        return v == null || v === '' ? null : Number(v);
      },
      set(v) {
        const t = this.commonGeoTarget;
        const raw = v === '' || v == null ? null : Number(v);
        if (t.type === 'table') {
          this.canvasTableY = Number.isFinite(raw) ? raw : 0;
          if (this.canvasTableX == null) this.canvasTableX = 0;
          this.pushDesignHistory();
          return;
        }
        if (t.type === 'text') {
          this.$set(t.item, 'y', Number.isFinite(raw) ? raw : 0);
          return;
        }
        if (t.type === 'code') {
          const pos = this.form.codeDisplay === 'qr' ? this.form.qrPosition : this.form.barcodePosition;
          if (pos) this.$set(pos, 'y', Number.isFinite(raw) ? raw : 0);
          return;
        }
        if (t.type === 'bottom') {
          this.$set(this.form, 'bottom' + t.index + 'Y', Number.isFinite(raw) ? raw : null);
          return;
        }
        this.$set(this.form, 'title' + t.index + 'Y', Number.isFinite(raw) ? raw : null);
      }
    }
  },
  watch: {
    canvasZoom() {
      this.$nextTick(() => this.updateCanvasViewportSize());
    },
    'form.billType'(n, o) {
      this.ensureActiveFieldTypeValid();
      // 加载已有模板时不重复插入；用户选择/切换单据类型时在画布正中放标题文本
      if (this.suppressBillTypeTitleSync) return;
      if (n == null || n === '') {
        this.removeBillTypeTitleText();
        return;
      }
      // 首次赋值且与旧值相同（如回填）不处理；仅用户变更或从空选中时同步
      if (o === undefined && this.form && this.form.id) return;
      this.$nextTick(() => this.syncBillTypeTitleText());
    },
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
          this.suppressBillTypeTitleSync = true;
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
              this.loadCanvasTextsFromConfig(config);
              this.elementStyles = (config.elementStyles && typeof config.elementStyles === 'object') ? { ...config.elementStyles } : {};
              this.applyCanvasVisibilityFromConfig(config, newVal);
              this.loadCanvasTablePosFromConfig(config);
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
              if (config.tableBorderStyle !== undefined) this.form.tableBorderStyle = config.tableBorderStyle;
              if (config.tableBorderColor !== undefined) this.form.tableBorderColor = config.tableBorderColor;
              if (config.paperSize !== undefined) this.form.paperSize = config.paperSize;
              if (config.printHeaderMode !== undefined) this.form.printHeaderMode = config.printHeaderMode;
              if (config.printFooterMode !== undefined) this.form.printFooterMode = config.printFooterMode;
              if (config.hideTrailingZero !== undefined) this.form.hideTrailingZero = !!config.hideTrailingZero;
              if (config.printZeroAsEmpty !== undefined) this.form.printZeroAsEmpty = !!config.printZeroAsEmpty;
              if (config.fixedRowCount !== undefined) this.form.fixedRowCount = !!config.fixedRowCount;
              if (config.fixedRowsPerPage !== undefined) this.form.fixedRowsPerPage = config.fixedRowsPerPage;
              this.normalizeFixedRowsPerPage();
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
                if (config['bottom' + idx + 'X'] !== undefined) this.form['bottom' + idx + 'X'] = config['bottom' + idx + 'X'];
                if (config['bottom' + idx + 'Y'] !== undefined) this.form['bottom' + idx + 'Y'] = config['bottom' + idx + 'Y'];
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
                if (config[p + 'X'] !== undefined) this.form[p + 'X'] = config[p + 'X'];
                if (config[p + 'Y'] !== undefined) this.form[p + 'Y'] = config[p + 'Y'];
              }
              this.ensureTableHeaderFieldsLength();
            } catch (e) {
              this.columnList = [...this.defaultColumns];
              this.headerMerges = [];
              this.bodyMerges = [];
              this.bodyCellTexts = {};
              this.canvasTexts = [];
              this.canvasTextSeq = 1;
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
                this.form['bottom' + idx + 'X'] = null;
                this.form['bottom' + idx + 'Y'] = null;
                this.form['bottom' + idx + 'Visible'] = false;
                this.form['bottom' + idx + 'FixedValue'] = false;
                this.form['bottom' + idx + 'FixedValueText'] = '';
              }
              this.headerSelectedCols = [];
              this.bodySelectedCells = [];
              this.editingBodyCell = null;
              this.applyEmptyCanvasDefaults(newVal);
            }
          } else {
            this.columnList = [...this.defaultColumns];
            this.headerMerges = [];
            this.bodyMerges = [];
            this.bodyCellTexts = {};
            this.canvasTexts = [];
            this.canvasTextSeq = 1;
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
              this.form['bottom' + idx + 'Visible'] = false;
              this.form['bottom' + idx + 'FixedValue'] = false;
              this.form['bottom' + idx + 'FixedValueText'] = '';
            }
            for (let i = 1; i <= 6; i++) {
              this.form['title' + i + 'Visible'] = false;
            }
            this.headerSelectedCols = [];
            this.bodySelectedCells = [];
            this.editingBodyCell = null;
            this.applyEmptyCanvasDefaults(newVal);
          }
          this.ensureTableHeaderFieldsLength();
          this.syncPaperSizeFromDimensions();
          this.$nextTick(() => { this.suppressBillTypeTitleSync = false; });
        } else {
          this.suppressBillTypeTitleSync = false;
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
    canvasWidgetClass(key) {
      return {
        'is-hovered': this.canvasHoverKey === key && this.canvasSelectedKey !== key,
        'is-canvas-selected': this.canvasSelectedKey === key
      };
    },
    setCanvasHover(key) {
      this.canvasHoverKey = key || '';
    },
    clearCanvasHover(key) {
      if (!key || this.canvasHoverKey === key) this.canvasHoverKey = '';
    },
    selectCanvasWidget(key) {
      this.canvasSelectedKey = key || '';
      this.canvasHoverKey = key || '';
      if (this.formatPainterActive && this.designClipboard && key) {
        const isStyleWidget =
          key.indexOf('title:') === 0 ||
          key.indexOf('bottom:') === 0 ||
          key.indexOf('text:') === 0 ||
          key.indexOf('header-cell:') === 0 ||
          key.indexOf('body-cell:') === 0;
        if (isStyleWidget) {
          this.applyCapturedTextStyle(this.designClipboard);
          this.formatPainterActive = false;
        }
      }
    },
    clearCanvasWidgetSelection() {
      this.canvasSelectedKey = '';
      this.canvasHoverKey = '';
      this.editingCanvasTextId = null;
      this.bodySelectedCells = [];
      this.headerSelectedCols = [];
    },
    /** 单击表格：选中整表（非单元格） */
    onTableFrameClick() {
      this.bodySelectedCells = [];
      this.headerSelectedCols = [];
      this.editingBodyCell = null;
      this.selectCanvasWidget('table');
      this.activeBottomTab = 'title';
      this.fieldCollapseActive = ['dataSource', 'common'];
    },
    /** 表格 mousedown：选中整表并开始拖动位置（忽略手柄/列宽/行高/已选中的格子） */
    onTableMouseDown(event) {
      // Ctrl/Cmd 多选时不启动整表拖动
      if (event && (event.ctrlKey || event.metaKey)) return;
      const t = event && event.target;
      if (t && t.closest) {
        if (t.closest('.canvas-handle')) return;
        if (t.closest('.col-resize-handle') || t.closest('.row-resize-handle')) return;
        if (t.closest('.preview-table-cell-input') || t.closest('.el-input')) return;
        const key = this.canvasSelectedKey || '';
        if (key.indexOf('header-cell:') === 0 || key.indexOf('body-cell:') === 0) {
          const cell = t.closest('th.preview-table-header-cell, td.preview-table-body-cell');
          if (cell && (cell.classList.contains('is-selected') || cell.classList.contains('is-canvas-selected'))) {
            return;
          }
        }
      }
      this.onTableFrameClick();
      this.startTableDrag(event);
    },
    /** 单击表头格：未单独选中时选整表；Ctrl 时留给双击多选 */
    onHeaderCellSingleClick(baseColIndex, event) {
      if (event && (event.ctrlKey || event.metaKey)) return;
      if (this.canvasSelectedKey === ('header-cell:' + baseColIndex) || this.isHeaderCellSelected(baseColIndex)) {
        return;
      }
      this.onTableFrameClick();
    },
    /** 单击表体格：未单独选中时选整表；Ctrl 时留给双击多选 */
    onBodyCellSingleClick(rowIndex, colIndex, event) {
      if (event && (event.ctrlKey || event.metaKey)) return;
      const key = 'body-cell:' + rowIndex + ':' + colIndex;
      if (this.canvasSelectedKey === key || this.isBodyCellSelected(rowIndex, colIndex)) {
        return;
      }
      this.onTableFrameClick();
    },
    /** 拖动整表在画布上的位置 */
    startTableDrag(event) {
      if (!event || this.tableFrameResizeState || this.colResizeState) return;
      const contentRect = this.getPaperContentRect();
      if (!contentRect) return;
      const wrap = event.currentTarget;
      const wrapRect = wrap && wrap.getBoundingClientRect ? wrap.getBoundingClientRect() : null;
      let startX = this.canvasTableX;
      let startY = this.canvasTableY;
      if (startX == null || startY == null || !Number.isFinite(Number(startX)) || !Number.isFinite(Number(startY))) {
        startX = wrapRect ? Math.round(wrapRect.left - contentRect.left) : 0;
        startY = wrapRect ? Math.round(wrapRect.top - contentRect.top) : 0;
        this.canvasTableX = startX;
        this.canvasTableY = startY;
      } else {
        startX = Number(startX);
        startY = Number(startY);
      }
      const width = Math.max(40, Number(this.tableTotalWidth) || 200);
      const height = Math.max(16, Number(this.tableTotalHeight) || 40);
      this.tableDragState = {
        startClientX: event.clientX,
        startClientY: event.clientY,
        startX,
        startY,
        contentWidth: contentRect.width,
        contentHeight: contentRect.height,
        width,
        height,
        moved: false
      };
      document.body.style.cursor = 'move';
      document.body.style.userSelect = 'none';
      const onMove = (ev) => {
        if (!this.tableDragState) return;
        const st = this.tableDragState;
        const dx = ev.clientX - st.startClientX;
        const dy = ev.clientY - st.startClientY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) st.moved = true;
        let newX = st.startX + dx;
        let newY = st.startY + dy;
        newX = Math.max(0, Math.min(st.contentWidth - st.width, newX));
        newY = Math.max(0, Math.min(st.contentHeight - st.height, newY));
        this.canvasTableX = Math.round(newX);
        this.canvasTableY = Math.round(newY);
      };
      const onUp = () => {
        const moved = !!(this.tableDragState && this.tableDragState.moved);
        this.tableDragState = null;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        if (moved) this.pushDesignHistory();
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    /** 双击表头单元格：选中该格；Ctrl/Cmd+双击追加/取消多选，便于合并 */
    onHeaderCellDblClick(baseColIndex, event) {
      if (baseColIndex < 0) return;
      const multi = !!(event && (event.ctrlKey || event.metaKey));
      this.editingBodyCell = null;
      if (multi) {
        // 从整表选中切到多选时，保留已有表头选中并追加
        if (this.canvasSelectedKey === 'table') {
          // keep headerSelectedCols
        } else if (!(this.headerSelectedCols && this.headerSelectedCols.length)) {
          // 若当前是单选其它格，以其为起点
          const cur = /^header-cell:(\d+)$/.exec(this.canvasSelectedKey || '');
          if (cur) this.headerSelectedCols = [Number(cur[1])];
        }
        this.bodySelectedCells = [];
        const idx = this.headerSelectedCols.indexOf(baseColIndex);
        if (idx !== -1) {
          this.headerSelectedCols.splice(idx, 1);
          if (!this.headerSelectedCols.length) {
            this.canvasSelectedKey = '';
          } else {
            this.selectCanvasWidget('header-cell:' + this.headerSelectedCols[this.headerSelectedCols.length - 1]);
          }
        } else {
          this.headerSelectedCols.push(baseColIndex);
          this.headerSelectedCols.sort((a, b) => a - b);
          this.selectCanvasWidget('header-cell:' + baseColIndex);
        }
      } else {
        this.bodySelectedCells = [];
        this.headerSelectedCols = [baseColIndex];
        this.selectCanvasWidget('header-cell:' + baseColIndex);
      }
      this.activeBottomTab = 'title';
      this.fieldCollapseActive = ['dataSource', 'common'];
    },
    /** 拖拽表格外框手柄：按方向拉宽/拉高（列宽等比；高度按各行等比） */
    startTableFrameResize(dir, event) {
      if (!dir || this.colResizeState || this.rowResizeState) return;
      this.onTableFrameClick();
      this.ensureCanvasRowHeights();
      const startX = event.clientX;
      const startY = event.clientY;
      const startWidths = (this.canvasColumnWidths || []).map(w => Number(w) || 80);
      const startTotal = Math.max(200, startWidths.reduce((s, w) => s + w, 0));
      const rowCount = Math.max(1, (Number(this.tablePreviewDataRows) || 1) + 1);
      const startHeights = [];
      for (let i = 0; i < rowCount; i++) startHeights.push(this.getTableRowHeight(i));
      const startHeightTotal = Math.max(16 * rowCount, startHeights.reduce((s, h) => s + h, 0));
      this.tableFrameResizeState = { dir };
      const cursorMap = {
        n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
        ne: 'nesw-resize', sw: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize'
      };
      document.body.style.cursor = cursorMap[dir] || 'nwse-resize';
      document.body.style.userSelect = 'none';
      let moved = false;
      const onMove = (ev) => {
        if (!this.tableFrameResizeState) return;
        let dx = 0;
        let dy = 0;
        if (dir.indexOf('e') >= 0) dx = ev.clientX - startX;
        if (dir.indexOf('w') >= 0) dx = startX - ev.clientX;
        if (dir.indexOf('s') >= 0) dy = ev.clientY - startY;
        if (dir.indexOf('n') >= 0) dy = startY - ev.clientY;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) moved = true;
        if (dx) {
          const newTotal = Math.max(200, Math.min(1200, startTotal + dx));
          const scale = newTotal / startTotal;
          for (let i = 0; i < startWidths.length; i++) {
            const nw = Math.min(400, Math.max(40, Math.round(startWidths[i] * scale)));
            this.$set(this.canvasColumnWidths, i, nw);
            this.syncColumnConfigWidthFromCanvas(i, nw);
          }
        }
        if (dy) {
          const newTotal = Math.max(16 * rowCount, Math.min(800, startHeightTotal + dy));
          const scale = newTotal / startHeightTotal;
          for (let i = 0; i < startHeights.length; i++) {
            const nh = Math.min(200, Math.max(16, Math.round(startHeights[i] * scale)));
            this.$set(this.canvasRowHeights, i, nh);
          }
          this.form.lineHeight = this.getTableRowHeight(0);
        }
      };
      const onUp = () => {
        this.tableFrameResizeState = null;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        if (moved) this.pushDesignHistory();
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    getDefaultRowHeight() {
      return Math.max(16, Math.min(120, Number(this.form.lineHeight) || 30));
    },
    getTableRowHeight(rowIndex) {
      const def = this.getDefaultRowHeight();
      const h = this.canvasRowHeights[rowIndex];
      return Math.max(16, Math.min(200, Number(h) || def));
    },
    getTableRowStyle(rowIndex) {
      return { height: this.getTableRowHeight(rowIndex) + 'px' };
    },
    getTableCellStyleKey(rowIndex, colIndex) {
      if (colIndex == null || colIndex < 0) return '';
      if (rowIndex === 0) return 'header-cell:' + colIndex;
      return 'body-cell:' + (rowIndex - 1) + ':' + colIndex;
    },
    getTableCellStyle(rowIndex, colIndex) {
      const h = this.getTableRowHeight(rowIndex);
      const style = { height: h + 'px', minHeight: h + 'px', maxHeight: 'none' };
      const key = this.getTableCellStyleKey(rowIndex, colIndex);
      const custom = key && this.elementStyles && this.elementStyles[key];
      if (custom) {
        const textStyle = this.resolveElementTextStyle(key);
        if (textStyle.backgroundColor) style.backgroundColor = textStyle.backgroundColor;
        if (textStyle.verticalAlign) style.verticalAlign = textStyle.verticalAlign;
        if (textStyle.textAlign) style.textAlign = textStyle.textAlign;
        if (textStyle.color) style.color = textStyle.color;
        if (textStyle.fontSize) style.fontSize = textStyle.fontSize;
        if (textStyle.fontWeight) style.fontWeight = textStyle.fontWeight;
        if (textStyle.fontStyle) style.fontStyle = textStyle.fontStyle;
        if (textStyle.textDecoration) style.textDecoration = textStyle.textDecoration;
      }
      return style;
    },
    /** 单元格文字样式（有独立设置时覆盖表级默认） */
    getTableCellTextStyle(rowIndex, colIndex) {
      const key = this.getTableCellStyleKey(rowIndex, colIndex);
      const custom = key && this.elementStyles && this.elementStyles[key];
      if (!custom) return {};
      const textStyle = this.resolveElementTextStyle(key);
      return {
        fontSize: textStyle.fontSize,
        fontFamily: textStyle.fontFamily,
        color: textStyle.color,
        fontWeight: textStyle.fontWeight,
        fontStyle: textStyle.fontStyle,
        textDecoration: textStyle.textDecoration,
        textAlign: textStyle.textAlign,
        backgroundColor: textStyle.backgroundColor
      };
    },
    ensureCanvasRowHeights() {
      const need = Math.max(1, Number(this.tablePreviewDataRows) || 1) + 1;
      const def = this.getDefaultRowHeight();
      while (this.canvasRowHeights.length < need) {
        this.canvasRowHeights.push(def);
      }
      while (this.canvasRowHeights.length > need) {
        this.canvasRowHeights.pop();
      }
    },
    /** 拖拽某一行底边：只改该行高度 */
    startRowResize(event, rowIndex) {
      if (this.rowResizeState || this.colResizeState || this.tableFrameResizeState) return;
      this.ensureCanvasRowHeights();
      const startY = event.clientY;
      const startH = this.getTableRowHeight(rowIndex);
      this.rowResizeState = { rowIndex };
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
      let moved = false;
      const onMove = (ev) => {
        if (!this.rowResizeState) return;
        const dy = ev.clientY - startY;
        if (Math.abs(dy) > 1) moved = true;
        const nh = Math.min(200, Math.max(16, Math.round(startH + dy)));
        this.$set(this.canvasRowHeights, rowIndex, nh);
        if (rowIndex === 0) this.form.lineHeight = nh;
      };
      const onUp = () => {
        this.rowResizeState = null;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        if (moved) this.pushDesignHistory();
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    getHeaderCellLabel(colIndex) {
      const field = this.tableHeaderFields[colIndex];
      if (!field) return '';
      if (field === 'rowNo') return '序号';
      if (field === 'checkbox') return '选择框';
      const col = (this.columnList || []).find(c => c.field === field);
      if (col) return col.label || '';
      return this.fieldTypeLabel(field);
    },
    isCheckboxColumn(colIndex) {
      return this.tableHeaderFields[colIndex] === 'checkbox';
    },
    isRowNoColumn(colIndex) {
      return this.tableHeaderFields[colIndex] === 'rowNo';
    },
    /** 双击表体单元格：选中该格；Ctrl/Cmd+双击追加/取消多选；无 Ctrl 再次双击进入编辑 */
    onBodyCellDblClick(rowIndex, colIndex, event) {
      const key = 'body-cell:' + rowIndex + ':' + colIndex;
      const multi = !!(event && (event.ctrlKey || event.metaKey));
      this.editingBodyCell = null;
      if (multi) {
        this.headerSelectedCols = [];
        const idx = this.bodySelectedCells.findIndex(c => c.row === rowIndex && c.col === colIndex);
        if (idx !== -1) {
          this.bodySelectedCells.splice(idx, 1);
          if (!this.bodySelectedCells.length) {
            this.canvasSelectedKey = '';
          } else {
            const last = this.bodySelectedCells[this.bodySelectedCells.length - 1];
            this.selectCanvasWidget('body-cell:' + last.row + ':' + last.col);
          }
        } else {
          // 若当前仅 canvasSelectedKey 有单格、数组为空，先纳入
          const cur = /^body-cell:(\d+):(\d+)$/.exec(this.canvasSelectedKey || '');
          if (cur && !this.bodySelectedCells.length) {
            const r = Number(cur[1]);
            const c = Number(cur[2]);
            if (!(r === rowIndex && c === colIndex)) {
              this.bodySelectedCells.push({ row: r, col: c });
            }
          }
          this.bodySelectedCells.push({ row: rowIndex, col: colIndex });
          this.selectCanvasWidget(key);
        }
        this.activeBottomTab = 'title';
        this.fieldCollapseActive = ['dataSource', 'common'];
        return;
      }
      if (this.canvasSelectedKey === key && this.bodySelectedCells.length <= 1) {
        if (!this.isCheckboxColumn(colIndex) && !this.isRowNoColumn(colIndex)) {
          this.startEditBodyCell(rowIndex, colIndex);
        }
        return;
      }
      this.headerSelectedCols = [];
      this.bodySelectedCells = [{ row: rowIndex, col: colIndex }];
      this.selectCanvasWidget(key);
      this.activeBottomTab = 'title';
      this.fieldCollapseActive = ['dataSource', 'common'];
    },
    /** 点击表头单元格：默认单选；按住 Ctrl/Cmd 可多选 */
    onHeaderCellClick(baseColIndex, event) {
      if (baseColIndex < 0) return;
      const multi = !!(event && (event.ctrlKey || event.metaKey));
      if (!multi) this.bodySelectedCells = [];
      const idx = this.headerSelectedCols.indexOf(baseColIndex);
      if (multi) {
        if (idx !== -1) {
          this.headerSelectedCols.splice(idx, 1);
          if (!this.headerSelectedCols.length) this.canvasSelectedKey = '';
          else this.selectCanvasWidget('header-cell:' + this.headerSelectedCols[this.headerSelectedCols.length - 1]);
        } else {
          this.headerSelectedCols.push(baseColIndex);
          this.headerSelectedCols.sort((a, b) => a - b);
          this.selectCanvasWidget('header-cell:' + baseColIndex);
        }
        return;
      }
      if (this.headerSelectedCols.length === 1 && this.headerSelectedCols[0] === baseColIndex) {
        this.headerSelectedCols = [];
        this.canvasSelectedKey = '';
        return;
      }
      this.headerSelectedCols = [baseColIndex];
      this.selectCanvasWidget('header-cell:' + baseColIndex);
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
        this.clearCanvasWidgetSelection();
        this.pushDesignHistory();
        this.$message && this.$message.success('已合并单元格');
        return;
      }

      // 若没有表体选择，再看是否有表头列选择，进行表头合并
      if (!this.headerSelectedCols || this.headerSelectedCols.length < 2) {
        this.$message && this.$message.warning('请先按住 Ctrl 双击选中同一行内连续的单元格再合并');
        return;
      }
      const selected = [...this.headerSelectedCols].sort((a, b) => a - b);
      const start = selected[0];
      const last = selected[selected.length - 1];
      // 表头也要求连续选中
      for (let i = start; i <= last; i++) {
        if (selected.indexOf(i) === -1) {
          this.$message && this.$message.warning('只能合并连续的表头单元格');
          return;
        }
      }
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
      this.clearCanvasWidgetSelection();
      this.pushDesignHistory();
      this.$message && this.$message.success('已合并表头单元格');
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
    /** 点击数据行单元格：默认单选；按住 Ctrl/Cmd 可多选 */
    onBodyCellClick(rowIndex, colIndex, event) {
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
      const key = 'body-cell:' + rowIndex + ':' + colIndex;
      const multi = !!(event && (event.ctrlKey || event.metaKey));
      if (!multi) this.headerSelectedCols = [];
      const idx = this.bodySelectedCells.findIndex(c => c.row === rowIndex && c.col === colIndex);
      if (multi) {
        if (idx !== -1) {
          this.bodySelectedCells.splice(idx, 1);
          if (!this.bodySelectedCells.length) {
            if (this.canvasSelectedKey === key) this.canvasSelectedKey = '';
          } else {
            const last = this.bodySelectedCells[this.bodySelectedCells.length - 1];
            this.selectCanvasWidget('body-cell:' + last.row + ':' + last.col);
          }
        } else {
          this.bodySelectedCells.push({ row: rowIndex, col: colIndex });
          this.selectCanvasWidget(key);
        }
        return;
      }
      if (this.bodySelectedCells.length === 1 &&
          this.bodySelectedCells[0].row === rowIndex &&
          this.bodySelectedCells[0].col === colIndex) {
        this.bodySelectedCells = [];
        if (this.canvasSelectedKey === key) this.canvasSelectedKey = '';
        return;
      }
      this.bodySelectedCells = [{ row: rowIndex, col: colIndex }];
      this.selectCanvasWidget(key);
    },
    /** 获取某个单元格当前文本 */
    getBodyCellText(rowIndex, colIndex) {
      const field = this.tableHeaderFields[colIndex];
      if (field === 'checkbox') return '';
      if (field === 'rowNo') {
        if (this.refBillData && this.refBillData.entries && this.refBillData.entries.length > 0) {
          const pageSize = this.refBillPageSize;
          return String((this.refBillPage - 1) * pageSize + rowIndex + 1);
        }
        return String(rowIndex + 1);
      }
      if (this.refBillData && this.refBillData.entries && this.refBillData.entries.length > 0) {
        const pageSize = this.refBillPageSize;
        const entryIndex = (this.refBillPage - 1) * pageSize + rowIndex;
        const entry = this.refBillData.entries[entryIndex];
        if (entry && field) {
          const val = entry[field] != null ? entry[field] : entry[field === 'price' ? 'unitPrice' : field];
          return val != null ? String(val) : '';
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
    /** 当前应写入字体样式的画布键（支持多选表头/表体格） */
    getSelectedStyleKeys() {
      const key = this.canvasSelectedKey || '';
      if (key.indexOf('title:') === 0 || key.indexOf('bottom:') === 0 || key.indexOf('text:') === 0) {
        return [key];
      }
      if (this.headerSelectedCols && this.headerSelectedCols.length) {
        return this.headerSelectedCols.map(c => 'header-cell:' + c);
      }
      if (key.indexOf('header-cell:') === 0) return [key];
      if (this.bodySelectedCells && this.bodySelectedCells.length) {
        return this.bodySelectedCells.map(c => 'body-cell:' + c.row + ':' + c.col);
      }
      if (key.indexOf('body-cell:') === 0) return [key];
      return [];
    },
    /** 工具栏读写：有选中标签/单元格时只改其样式，否则改全局 form */
    getToolbarStyleValue(prop, fallback) {
      const key = this.selectedTextWidgetKey || (this.getSelectedStyleKeys()[0] || '');
      if (key) {
        const s = this.elementStyles && this.elementStyles[key];
        if (s && s[prop] != null) return s[prop];
      }
      return fallback;
    },
    setToolbarStyleValue(prop, value) {
      const keys = this.getSelectedStyleKeys();
      if (keys.length) {
        keys.forEach(k => {
          const prev = (this.elementStyles && this.elementStyles[k]) || {};
          this.$set(this.elementStyles, k, { ...prev, [prop]: value });
        });
        this.pushDesignHistory();
        return;
      }
      this.form[prop] = value;
      this.pushDesignHistory();
    },
    /** 解析某画布标签的文字样式（未单独设置时回退全局） */
    resolveElementTextStyle(key) {
      const s = (this.elementStyles && key && this.elementStyles[key]) || {};
      const fontSize = s.fontSize != null ? s.fontSize : (this.form.fontSize || 14);
      const fontBold = s.fontBold != null ? !!s.fontBold : !!this.form.fontBold;
      const fontItalic = s.fontItalic != null ? !!s.fontItalic : !!this.form.fontItalic;
      const fontUnderline = s.fontUnderline != null ? !!s.fontUnderline : !!this.form.fontUnderline;
      const fontColor = s.fontColor != null ? s.fontColor : (this.form.fontColor || '#000000');
      const fillColor = s.fillColor != null ? s.fillColor : (this.form.fillColor || 'transparent');
      const textAlign = s.textAlign != null ? s.textAlign : (this.form.textAlign || 'left');
      const verticalAlign = s.verticalAlign != null ? s.verticalAlign : (this.form.verticalAlign || 'middle');
      return {
        fontSize: fontSize + 'px',
        fontFamily: this.form.fontFamily || 'inherit',
        color: fontColor,
        fontWeight: fontBold ? 'bold' : 'normal',
        fontStyle: fontItalic ? 'italic' : 'normal',
        textDecoration: fontUnderline ? 'underline' : 'none',
        textAlign,
        verticalAlign,
        backgroundColor: (!fillColor || fillColor === 'transparent') ? 'transparent' : fillColor
      };
    },
    /** 标题预览项样式：宽高 + 可选绝对坐标（X/Y）+ 独立字体 */
    getTitleItemStyle(item) {
      const w = Number(item && item.width);
      const h = Number(item && item.height);
      const x = item && item.x;
      const y = item && item.y;
      const style = {
        display: 'inline-block',
        cursor: 'move',
        ...this.resolveElementTextStyle(item && item.key ? ('title:' + item.key) : '')
      };
      if (Number.isFinite(w) && w > 0) style.width = w + 'px';
      if (Number.isFinite(h) && h > 0 && h <= 120) {
        style.minHeight = h + 'px';
        style.height = h + 'px';
      }
      const hasX = x != null && x !== '' && Number.isFinite(Number(x));
      const hasY = y != null && y !== '' && Number.isFinite(Number(y));
      if (hasX || hasY) {
        style.position = 'absolute';
        style.left = (hasX ? Number(x) : 0) + 'px';
        style.top = (hasY ? Number(y) : 0) + 'px';
        style.zIndex = 2;
      }
      return style;
    },
    /** 底部信息项样式：根据配置宽度与高度 + 独立字体 + 可选绝对坐标 */
    getBottomItemStyle(item) {
      const w = Number(item && item.width);
      const h = Number(item && item.height);
      const x = item && item.x;
      const y = item && item.y;
      const style = {
        display: 'inline-block',
        cursor: 'move',
        ...this.resolveElementTextStyle(item && item.key ? ('bottom:' + item.key) : '')
      };
      if (Number.isFinite(w) && w > 0) style.width = w + 'px';
      if (Number.isFinite(h) && h > 0) {
        style.minHeight = h + 'px';
        style.height = h + 'px';
      }
      const hasX = x != null && x !== '' && Number.isFinite(Number(x));
      const hasY = y != null && y !== '' && Number.isFinite(Number(y));
      if (hasX || hasY) {
        style.position = 'absolute';
        style.left = (hasX ? Number(x) : 0) + 'px';
        style.top = (hasY ? Number(y) : 0) + 'px';
        style.zIndex = 2;
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
      if (!this.ensureBillTypeReady()) return;
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

      // 点在纸张空白处：取消组件选中
      if (!onLeft && !onRight && !onTop && !onBottom) {
        const t = event.target;
        if (t === this.$refs.previewPaper || (t && t.classList && t.classList.contains('paper-content'))) {
          this.clearCanvasWidgetSelection();
        }
      }

      const mmToPx = this.mmToPx;

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
        this.suppressBillTypeTitleSync = true;
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
            this.loadCanvasTextsFromConfig(config);
            this.elementStyles = (config.elementStyles && typeof config.elementStyles === 'object') ? { ...config.elementStyles } : {};
            this.applyCanvasVisibilityFromConfig(config, data);
            this.loadCanvasTablePosFromConfig(config);
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
            if (config.tableBorderStyle !== undefined) this.form.tableBorderStyle = config.tableBorderStyle;
            if (config.tableBorderColor !== undefined) this.form.tableBorderColor = config.tableBorderColor;
            if (config.paperSize !== undefined) this.form.paperSize = config.paperSize;
            if (config.printHeaderMode !== undefined) this.form.printHeaderMode = config.printHeaderMode;
            if (config.printFooterMode !== undefined) this.form.printFooterMode = config.printFooterMode;
            if (config.hideTrailingZero !== undefined) this.form.hideTrailingZero = !!config.hideTrailingZero;
            if (config.printZeroAsEmpty !== undefined) this.form.printZeroAsEmpty = !!config.printZeroAsEmpty;
            if (config.fixedRowCount !== undefined) this.form.fixedRowCount = !!config.fixedRowCount;
            if (config.fixedRowsPerPage !== undefined) this.form.fixedRowsPerPage = config.fixedRowsPerPage;
            this.normalizeFixedRowsPerPage();
            if (config.pageJoinPrint !== undefined) this.form.pageJoinPrint = !!config.pageJoinPrint;
            this.syncPaperSizeFromDimensions();
            this.headerSelectedCols = [];
            this.bodySelectedCells = [];
            this.editingBodyCell = null;
            for (let i = 1; i <= 5; i++) {
              const p = 'bottom' + i;
              if (config[p + 'Type'] !== undefined) this.form[p + 'Type'] = config[p + 'Type'];
              if (config[p + 'Width'] !== undefined) this.form[p + 'Width'] = config[p + 'Width'];
              if (config[p + 'Height'] !== undefined) this.form[p + 'Height'] = config[p + 'Height'];
              if (config[p + 'X'] !== undefined) this.form[p + 'X'] = config[p + 'X'];
              if (config[p + 'Y'] !== undefined) this.form[p + 'Y'] = config[p + 'Y'];
              if (config[p + 'Visible'] !== undefined) this.form[p + 'Visible'] = !!config[p + 'Visible'];
              if (config[p + 'FixedValue'] !== undefined) this.form[p + 'FixedValue'] = !!config[p + 'FixedValue'];
              if (config[p + 'FixedValueText'] !== undefined) this.form[p + 'FixedValueText'] = config[p + 'FixedValueText'];
            }
            for (let i = 1; i <= 6; i++) {
              const p = 'title' + i;
              if (config[p + 'Type'] !== undefined) this.form[p + 'Type'] = config[p + 'Type'];
              if (config[p + 'Name'] !== undefined) this.form[p + 'Name'] = config[p + 'Name'];
              if (config[p + 'Visible'] !== undefined) this.form[p + 'Visible'] = !!config[p + 'Visible'];
              if (config[p + 'FixedValue'] !== undefined) this.form[p + 'FixedValue'] = !!config[p + 'FixedValue'];
              if (config[p + 'FixedValueText'] !== undefined) this.form[p + 'FixedValueText'] = config[p + 'FixedValueText'];
              if (config[p + 'Width'] != null) this.form[p + 'Width'] = config[p + 'Width'];
              if (config[p + 'Height'] != null) this.form[p + 'Height'] = config[p + 'Height'];
              if (config[p + 'X'] !== undefined) this.form[p + 'X'] = config[p + 'X'];
              if (config[p + 'Y'] !== undefined) this.form[p + 'Y'] = config[p + 'Y'];
            }
            this.ensureTableHeaderFieldsLength();
          } catch (e) {
            this.columnList = [...this.defaultColumns];
            this.headerMerges = [];
            this.bodyMerges = [];
            this.bodyCellTexts = {};
            this.canvasTexts = [];
            this.canvasTextSeq = 1;
            this.applyEmptyCanvasDefaults(data);
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
          this.canvasTexts = [];
          this.canvasTextSeq = 1;
          this.applyEmptyCanvasDefaults(data);
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
        this.$nextTick(() => { this.suppressBillTypeTitleSync = false; });
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
        printHeaderMode: 'first',
        printFooterMode: 'last',
        hideTrailingZero: false,
        printZeroAsEmpty: false,
        fixedRowCount: false,
        fixedRowsPerPage: 5,
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
        tableBorderStyle: 'thin',
        tableBorderColor: '#000000',
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
        bottom1X: null,
        bottom1Y: null,
        bottom1Visible: false,
        bottom1FixedValue: false,
        bottom1FixedValueText: '',
        bottom2Type: '',
        bottom2Width: 300,
        bottom2Height: 22,
        bottom2X: null,
        bottom2Y: null,
        bottom2Visible: false,
        bottom2FixedValue: false,
        bottom2FixedValueText: '',
        bottom3Type: '',
        bottom3Width: 300,
        bottom3Height: 22,
        bottom3X: null,
        bottom3Y: null,
        bottom3Visible: false,
        bottom3FixedValue: false,
        bottom3FixedValueText: '',
        bottom4Type: '',
        bottom4Width: 300,
        bottom4Height: 22,
        bottom4X: null,
        bottom4Y: null,
        bottom4Visible: false,
        bottom4FixedValue: false,
        bottom4FixedValueText: '',
        bottom5Type: '',
        bottom5Width: 300,
        bottom5Height: 22,
        bottom5X: null,
        bottom5Y: null,
        bottom5Visible: false,
        bottom5FixedValue: false,
        bottom5FixedValueText: '',
        headerTitle: '',
        title1: '',
        title1Type: '',
        title1Name: '',
        title1Width: 300,
        title1Height: 22,
        title1X: null,
        title1Y: null,
        title1Visible: false,
        title1FixedValue: false,
        title1FixedValueText: '',
        title2: '',
        title2Type: '',
        title2Name: '',
        title2Width: 300,
        title2Height: 22,
        title2X: null,
        title2Y: null,
        title2Visible: false,
        title2FixedValue: false,
        title2FixedValueText: '',
        title3: '',
        title3Type: '',
        title3Name: '',
        title3Width: 300,
        title3Height: 22,
        title3X: null,
        title3Y: null,
        title3Visible: false,
        title3FixedValue: false,
        title3FixedValueText: '',
        title4: '',
        title4Type: '',
        title4Name: '',
        title4Width: 300,
        title4Height: 22,
        title4X: null,
        title4Y: null,
        title4Visible: false,
        title4FixedValue: false,
        title4FixedValueText: '',
        title5: '',
        title5Type: '',
        title5Name: '',
        title5Width: 300,
        title5Height: 22,
        title5X: null,
        title5Y: null,
        title5Visible: false,
        title5FixedValue: false,
        title5FixedValueText: '',
        title6: '',
        title6Type: '',
        title6Name: '',
        title6Width: 300,
        title6Height: 22,
        title6X: null,
        title6Y: null,
        title6Visible: false,
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
      this.canvasTexts = [];
      this.canvasTextSeq = 1;
      this.canvasTableVisible = false;
      this.canvasHeaderVisible = false;
      this.canvasTableX = null;
      this.canvasTableY = null;
      this.canvasRowHeights = [];
      this.tableDragState = null;
      this.rowResizeState = null;
      this.clearCanvasWidgetSelection();
      this.refBillData = null;
      this.refBillPage = 1;
      this.activeTab = "basic";
      this.activeBottomTab = "page";
      this.printCollapseActive = ['paper', 'margin'];
      this.fieldCollapseActive = ['dataSource', 'common'];
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
    /** 单张行数：强制为 >=1 的正整数，非法时回退默认 5 */
    normalizeFixedRowsPerPage() {
      const n = parseInt(this.form.fixedRowsPerPage, 10);
      this.form.fixedRowsPerPage = Number.isFinite(n) && n >= 1 ? n : 5;
    },
    fieldTypeLabel(type) {
      const map = {
        rowNo: '序号',
        checkbox: '选择框',
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
      return map[type] || type || '文本';
    },
    /** 当前选中字段类型若不在数据源选项中则清空，避免切换单据类型后残留无效值 */
    ensureActiveFieldTypeValid() {
      const cur = this.activeFieldType;
      if (cur == null || cur === '') return;
      const ok = (this.dataSourceFieldOptions || []).some(o => o.value === cur);
      if (!ok) this.activeFieldType = '';
    },
    /** 编辑态恢复画布显隐；新增或无配置时保持空白 */
    applyCanvasVisibilityFromConfig(config, record) {
      const isEdit = record && record.id != null;
      if (!config) {
        this.applyEmptyCanvasDefaults(record);
        return;
      }
      if (config.canvasTableVisible !== undefined) {
        this.canvasTableVisible = !!config.canvasTableVisible;
      } else {
        this.canvasTableVisible = !!isEdit;
      }
      if (config.canvasHeaderVisible !== undefined) {
        this.canvasHeaderVisible = !!config.canvasHeaderVisible;
      } else {
        this.canvasHeaderVisible = !!isEdit;
      }
    },
    applyEmptyCanvasDefaults(record) {
      const isEdit = record && record.id != null;
      if (isEdit) return;
      this.canvasTableVisible = false;
      this.canvasHeaderVisible = false;
      this.canvasTableX = null;
      this.canvasTableY = null;
      this.canvasRowHeights = [];
      this.form.codeDisplay = '';
      this.canvasTexts = [];
      this.canvasTextSeq = 1;
      this.elementStyles = {};
      for (let i = 1; i <= 6; i++) this.form['title' + i + 'Visible'] = false;
      for (let i = 1; i <= 5; i++) this.form['bottom' + i + 'Visible'] = false;
    },
    loadCanvasTablePosFromConfig(config) {
      if (!config) {
        this.canvasTableX = null;
        this.canvasTableY = null;
        this.canvasRowHeights = [];
        return;
      }
      const x = config.canvasTableX;
      const y = config.canvasTableY;
      this.canvasTableX = (x == null || x === '' || !Number.isFinite(Number(x))) ? null : Number(x);
      this.canvasTableY = (y == null || y === '' || !Number.isFinite(Number(y))) ? null : Number(y);
      if (Array.isArray(config.canvasRowHeights)) {
        this.canvasRowHeights = config.canvasRowHeights.map(h => {
          const n = Number(h);
          return Number.isFinite(n) ? Math.max(16, Math.min(200, n)) : this.getDefaultRowHeight();
        });
      } else {
        this.canvasRowHeights = [];
      }
      this.ensureCanvasRowHeights();
    },
    loadCanvasTextsFromConfig(config) {
      const list = config && Array.isArray(config.canvasTexts) ? config.canvasTexts : [];
      this.canvasTexts = list.map((t, i) => ({
        id: t.id || ('text-' + (i + 1)),
        type: t.type || '',
        text: t.text || '',
        fixedValue: !!t.fixedValue,
        fixedValueText: t.fixedValueText || '',
        visible: t.visible !== false,
        width: Math.max(40, Number(t.width) || 160),
        height: Math.max(18, Number(t.height) || 28),
        x: Number(t.x) || 0,
        y: Number(t.y) || 0,
        role: t.role || ''
      }));
      const seq = Number(config && config.canvasTextSeq);
      const maxId = this.canvasTexts.reduce((m, t) => {
        const n = Number(String(t.id || '').replace(/\D/g, ''));
        return Number.isFinite(n) ? Math.max(m, n) : m;
      }, 0);
      this.canvasTextSeq = Math.max(1, Number.isFinite(seq) ? seq : 1, maxId + 1);
    },
    /** 单据类型中文名 */
    getBillTypeLabel(billType) {
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
      const key = Number(billType);
      return map[key] || '';
    },
    /** 画布内容区尺寸（去掉 paper-content padding），用于居中 */
    getPaperContentInnerSize() {
      const mm = this.mmToPx || 3.78;
      let pw = (Number(this.form.pageWidth) || 210) * mm;
      let ph = (Number(this.form.pageHeight) || 297) * mm;
      if (this.form.orientation === 'landscape') {
        const t = pw;
        pw = ph;
        ph = t;
      }
      const pad = 15;
      return {
        width: Math.max(40, pw - pad * 2),
        height: Math.max(40, ph - pad * 2)
      };
    },
    findBillTypeTitleText() {
      return (this.canvasTexts || []).find(t => t && t.role === 'billTypeTitle') || null;
    },
    removeBillTypeTitleText() {
      const idx = (this.canvasTexts || []).findIndex(t => t && t.role === 'billTypeTitle');
      if (idx < 0) return;
      const removed = this.canvasTexts[idx];
      this.canvasTexts.splice(idx, 1);
      if (removed && removed.id) {
        const key = 'text:' + removed.id;
        if (this.elementStyles && this.elementStyles[key]) {
          this.$delete(this.elementStyles, key);
        }
        if (this.canvasSelectedKey === key) this.clearCanvasWidgetSelection();
      }
      this.pushDesignHistory();
    },
    /** 选择单据类型后：在画布靠上居中位置放/更新标题文本（默认 X:315 Y:35，与设计稿一致） */
    syncBillTypeTitleText() {
      const label = this.getBillTypeLabel(this.form && this.form.billType);
      if (!label) {
        this.removeBillTypeTitleText();
        return;
      }
      const tw = 160;
      const th = 40;
      const defaultX = 315;
      const defaultY = 35;
      let item = this.findBillTypeTitleText();
      if (!item) {
        const id = 'text-' + (this.canvasTextSeq++);
        item = {
          id,
          role: 'billTypeTitle',
          type: '',
          text: label,
          fixedValue: true,
          fixedValueText: label,
          visible: true,
          width: tw,
          height: th,
          x: defaultX,
          y: defaultY
        };
        this.canvasTexts.push(item);
        this.$set(this.elementStyles, 'text:' + id, {
          fontSize: 22,
          fontBold: true,
          textAlign: 'center'
        });
        this.selectCanvasText(item);
        this.activeBottomTab = 'title';
        this.fieldCollapseActive = ['dataSource', 'common'];
      } else {
        this.$set(item, 'fixedValue', true);
        this.$set(item, 'fixedValueText', label);
        this.$set(item, 'text', label);
        // 仍在默认标题位附近时跟随默认坐标；用户拖走过则保留
        const nearDefault =
          Math.abs((Number(item.x) || 0) - defaultX) < 40 &&
          Math.abs((Number(item.y) || 0) - defaultY) < 40;
        if (nearDefault) {
          this.$set(item, 'x', defaultX);
          this.$set(item, 'y', defaultY);
        }
        const styleKey = 'text:' + item.id;
        if (!this.elementStyles || !this.elementStyles[styleKey]) {
          this.$set(this.elementStyles, styleKey, {
            fontSize: 22,
            fontBold: true,
            textAlign: 'center'
          });
        }
      }
      this.pushDesignHistory();
    },
    /** 点击「文本」组件：在画布新增一个可编辑文本框并选中 */
    addCanvasText() {
      const offset = (this.canvasTexts.length % 6) * 24;
      const id = 'text-' + (this.canvasTextSeq++);
      const item = {
        id,
        role: '',
        type: '',
        text: '',
        fixedValue: false,
        fixedValueText: '',
        visible: true,
        width: 160,
        height: 28,
        x: 40 + offset,
        y: 60 + offset
      };
      this.canvasTexts.push(item);
      this.selectCanvasText(item);
      this.activeBottomTab = 'title';
      this.fieldCollapseActive = ['dataSource', 'common'];
      this.pushDesignHistory();
    },
    selectCanvasText(item) {
      if (!item || !item.id) return;
      this.bodySelectedCells = [];
      this.headerSelectedCols = [];
      this.selectCanvasWidget('text:' + item.id);
      this.activeBottomTab = 'title';
    },
    getCanvasTextStyle(item) {
      if (!item || item.visible === false) return { display: 'none' };
      const textStyle = this.resolveElementTextStyle(item.id ? ('text:' + item.id) : '');
      const editing = this.editingCanvasTextId === item.id;
      return {
        position: 'absolute',
        left: (Number(item.x) || 0) + 'px',
        top: (Number(item.y) || 0) + 'px',
        width: Math.max(40, Number(item.width) || 160) + 'px',
        height: Math.max(18, Number(item.height) || 28) + 'px',
        zIndex: this.canvasSelectedKey === ('text:' + item.id) ? 12 : 8,
        cursor: editing ? 'text' : 'move',
        ...textStyle
      };
    },
    getCanvasTextDisplay(item) {
      if (!item) return '';
      if (item.fixedValue) return item.fixedValueText || '';
      if (item.type) {
        const label = this.fieldTypeLabel(item.type);
        if (this.refBillData && this.refBillData.bill) {
          const val = this.getBillTitleValue(this.refBillData.bill, item.type);
          return val !== '' && val != null ? String(val) : label;
        }
        return label;
      }
      return item.text || '';
    },
    onCanvasTextInput(item, event) {
      if (!item) return;
      if (this.editingCanvasTextId !== item.id) return;
      const val = event && event.target ? event.target.value : '';
      this.$set(item, 'fixedValue', true);
      this.$set(item, 'fixedValueText', val);
      this.$set(item, 'text', val);
    },
    onCanvasTextInputMouseDown(event, item) {
      // 编辑态：输入框内点选改字；非编辑态：交给父级拖拽
      if (this.editingCanvasTextId === item.id) return;
      event.preventDefault();
      this.onCanvasTextMouseDown(event, item);
    },
    onCanvasTextDblClick(event, item) {
      if (!item) return;
      this.selectCanvasText(item);
      this.editingCanvasTextId = item.id;
      this.$nextTick(() => {
        const ref = this.$refs['canvasTextInput-' + item.id];
        const el = Array.isArray(ref) ? ref[0] : ref;
        if (el && el.focus) {
          el.focus();
          if (el.select) el.select();
        }
      });
    },
    onCanvasTextBlur(item) {
      if (item && this.editingCanvasTextId === item.id) {
        this.editingCanvasTextId = null;
        this.pushDesignHistory();
      }
    },
    getPaperContentRect() {
      if (!this.$refs.previewPaper) return null;
      const contentEl = this.$refs.previewPaper.querySelector('.paper-content');
      return contentEl ? contentEl.getBoundingClientRect() : this.$refs.previewPaper.getBoundingClientRect();
    },
    onCanvasTextMouseDown(event, item) {
      if (!item) return;
      this.selectCanvasText(item);
      if (this.editingCanvasTextId === item.id) return;
      const contentRect = this.getPaperContentRect();
      if (!contentRect) return;
      const startX = Number(item.x) || 0;
      const startY = Number(item.y) || 0;
      const width = Number(item.width) || 160;
      const height = Number(item.height) || 28;
      this.textDragState = {
        id: item.id,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startX,
        startY,
        contentWidth: contentRect.width,
        contentHeight: contentRect.height,
        width,
        height,
        moved: false
      };
      this._onTextMouseMove = (e) => {
        if (!this.textDragState) return;
        const target = (this.canvasTexts || []).find(t => t.id === this.textDragState.id);
        if (!target) return;
        const dx = e.clientX - this.textDragState.startClientX;
        const dy = e.clientY - this.textDragState.startClientY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) this.textDragState.moved = true;
        let newX = this.textDragState.startX + dx;
        let newY = this.textDragState.startY + dy;
        newX = Math.max(0, Math.min(this.textDragState.contentWidth - this.textDragState.width, newX));
        newY = Math.max(0, Math.min(this.textDragState.contentHeight - this.textDragState.height, newY));
        this.$set(target, 'x', Math.round(newX));
        this.$set(target, 'y', Math.round(newY));
      };
      this._onTextMouseUp = () => {
        const moved = !!(this.textDragState && this.textDragState.moved);
        this.textDragState = null;
        window.removeEventListener('mousemove', this._onTextMouseMove);
        window.removeEventListener('mouseup', this._onTextMouseUp);
        if (moved) this.pushDesignHistory();
      };
      window.addEventListener('mousemove', this._onTextMouseMove);
      window.addEventListener('mouseup', this._onTextMouseUp);
    },
    /** 标题标签：单击选中并可拖动；双击切到字段属性便于编辑 */
    onTitleItemMouseDown(event, item) {
      if (!item) return;
      this.selectCanvasWidget('title:' + item.key);
      this.startLabelDrag(event, {
        kind: 'title',
        index: item.index,
        key: item.key,
        width: Number(item.width) || 300,
        height: Number(item.height) || 22,
        el: event.currentTarget
      });
    },
    onTitleItemDblClick(item) {
      if (!item) return;
      this.selectCanvasWidget('title:' + item.key);
      this.activeBottomTab = 'title';
      this.fieldCollapseActive = ['dataSource', 'common'];
    },
    onBottomItemMouseDown(event, item) {
      if (!item) return;
      this.selectCanvasWidget('bottom:' + item.key);
      this.startLabelDrag(event, {
        kind: 'bottom',
        index: item.index,
        key: item.key,
        width: Number(item.width) || 300,
        height: Number(item.height) || 22,
        el: event.currentTarget
      });
    },
    onBottomItemDblClick(item) {
      if (!item) return;
      this.selectCanvasWidget('bottom:' + item.key);
      this.activeBottomTab = 'bottom';
    },
    startLabelDrag(event, meta) {
      const contentRect = this.getPaperContentRect();
      if (!contentRect || !meta) return;
      const el = meta.el;
      const elRect = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
      const prefix = meta.kind === 'bottom' ? 'bottom' : 'title';
      let startX = this.form[prefix + meta.index + 'X'];
      let startY = this.form[prefix + meta.index + 'Y'];
      if (startX == null || startX === '' || !Number.isFinite(Number(startX)) ||
          startY == null || startY === '' || !Number.isFinite(Number(startY))) {
        // 首次拖动：按当前相对纸面位置转为绝对坐标
        startX = elRect ? Math.round(elRect.left - contentRect.left) : 0;
        startY = elRect ? Math.round(elRect.top - contentRect.top) : 0;
        this.$set(this.form, prefix + meta.index + 'X', startX);
        this.$set(this.form, prefix + meta.index + 'Y', startY);
      } else {
        startX = Number(startX);
        startY = Number(startY);
      }
      const width = Math.max(20, Number(meta.width) || 100);
      const height = Math.max(16, Number(meta.height) || 22);
      this.labelDragState = {
        kind: meta.kind,
        index: meta.index,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startX,
        startY,
        contentWidth: contentRect.width,
        contentHeight: contentRect.height,
        width,
        height,
        moved: false
      };
      this._onLabelMouseMove = (e) => {
        if (!this.labelDragState) return;
        const st = this.labelDragState;
        const dx = e.clientX - st.startClientX;
        const dy = e.clientY - st.startClientY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) st.moved = true;
        let newX = st.startX + dx;
        let newY = st.startY + dy;
        newX = Math.max(0, Math.min(st.contentWidth - st.width, newX));
        newY = Math.max(0, Math.min(st.contentHeight - st.height, newY));
        const p = st.kind === 'bottom' ? 'bottom' : 'title';
        this.$set(this.form, p + st.index + 'X', Math.round(newX));
        this.$set(this.form, p + st.index + 'Y', Math.round(newY));
      };
      this._onLabelMouseUp = () => {
        const moved = !!(this.labelDragState && this.labelDragState.moved);
        this.labelDragState = null;
        window.removeEventListener('mousemove', this._onLabelMouseMove);
        window.removeEventListener('mouseup', this._onLabelMouseUp);
        if (moved) this.pushDesignHistory();
      };
      window.addEventListener('mousemove', this._onLabelMouseMove);
      window.addEventListener('mouseup', this._onLabelMouseUp);
    },
    openGridSettingDialog() {
      const rows = Math.max(1, Math.min(this.gridMaxRows, Number(this.form.tableRows) || 5));
      const cols = Math.max(1, Math.min(this.gridMaxCols, Number(this.form.tableColumns) || 7));
      this.gridDraftRows = rows;
      this.gridDraftCols = cols;
      this.gridHoverRows = 0;
      this.gridHoverCols = 0;
      this.gridDialogVisible = true;
    },
    normalizeGridDraft() {
      let rows = parseInt(this.gridDraftRows, 10);
      let cols = parseInt(this.gridDraftCols, 10);
      if (!Number.isFinite(rows) || rows < 1) rows = 1;
      if (!Number.isFinite(cols) || cols < 1) cols = 1;
      this.gridDraftRows = Math.min(this.gridMaxRows, rows);
      this.gridDraftCols = Math.min(this.gridMaxCols, cols);
    },
    isGridCellActive(r, c) {
      const rows = this.gridHoverRows > 0 ? this.gridHoverRows : this.gridDraftRows;
      const cols = this.gridHoverCols > 0 ? this.gridHoverCols : this.gridDraftCols;
      return r <= rows && c <= cols;
    },
    onGridCellHover(r, c) {
      this.gridHoverRows = r;
      this.gridHoverCols = c;
    },
    onGridCellClick(r, c) {
      this.gridDraftRows = r;
      this.gridDraftCols = c;
      this.gridHoverRows = 0;
      this.gridHoverCols = 0;
    },
    onGridDialogClosed() {
      this.gridHoverRows = 0;
      this.gridHoverCols = 0;
    },
    confirmGridSetting() {
      this.normalizeGridDraft();
      this.form.tableRows = this.gridDraftRows;
      this.form.tableColumns = this.gridDraftCols;
      this.canvasTableVisible = true;
      this.ensureTableHeaderFieldsLength();
      this.ensureCanvasRowHeights();
      this.gridDialogVisible = false;
      this.selectCanvasWidget('table');
      this.bodySelectedCells = [];
      this.headerSelectedCols = [];
      this.pushDesignHistory();
      this.$nextTick(() => {
        const wrap = this.$el && this.$el.querySelector('.preview-table-wrap');
        if (wrap && wrap.scrollIntoView) {
          wrap.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      });
    },
    /** 解析当前应在刻度尺上高亮的组件包围盒（画布坐标系） */
    resolveActiveWidgetBox() {
      if (this.textDragState && this.textDragState.id) {
        const t = (this.canvasTexts || []).find(item => item.id === this.textDragState.id);
        if (t) {
          return {
            x: Number(t.x) || 0,
            y: Number(t.y) || 0,
            w: Number(t.width) || 160,
            h: Number(t.height) || 28
          };
        }
      }
      if (this.labelDragState && this.labelDragState.index) {
        const p = this.labelDragState.kind === 'bottom' ? 'bottom' : 'title';
        const idx = this.labelDragState.index;
        return {
          x: Number(this.form[p + idx + 'X']) || 0,
          y: Number(this.form[p + idx + 'Y']) || 0,
          w: Number(this.labelDragState.width) || 100,
          h: Number(this.labelDragState.height) || 22
        };
      }
      if (this.codeDragState || this.canvasSelectedKey === 'code') {
        const pos = this.currentCodePosition || { x: 0, y: 0 };
        const size = this.currentCodeSize || { width: 64, height: 64 };
        return {
          x: Number(pos.x) || 0,
          y: Number(pos.y) || 0,
          w: Number(size.width) || 64,
          h: Number(size.height) || 64
        };
      }
      if (this.tableDragState || this.canvasSelectedKey === 'table') {
        if (this.canvasTableX != null && this.canvasTableY != null) {
          return {
            x: Number(this.canvasTableX) || 0,
            y: Number(this.canvasTableY) || 0,
            w: Number(this.tableTotalWidth) || 200,
            h: Number(this.tableTotalHeight) || 40
          };
        }
      }
      const key = this.canvasSelectedKey || '';
      if (key.indexOf('text:') === 0) {
        const id = key.slice(5);
        const t = (this.canvasTexts || []).find(item => item.id === id);
        if (t) {
          return {
            x: Number(t.x) || 0,
            y: Number(t.y) || 0,
            w: Number(t.width) || 160,
            h: Number(t.height) || 28
          };
        }
      }
      const titleMatch = /^title:t-(\d+)$/.exec(key);
      if (titleMatch) {
        const idx = Number(titleMatch[1]);
        const x = this.form['title' + idx + 'X'];
        const y = this.form['title' + idx + 'Y'];
        if (x != null && x !== '' && y != null && y !== '') {
          return {
            x: Number(x) || 0,
            y: Number(y) || 0,
            w: Number(this.form['title' + idx + 'Width']) || 300,
            h: Number(this.form['title' + idx + 'Height']) || 22
          };
        }
      }
      const bottomMatch = /^bottom:b-(\d+)$/.exec(key);
      if (bottomMatch) {
        const idx = Number(bottomMatch[1]);
        const x = this.form['bottom' + idx + 'X'];
        const y = this.form['bottom' + idx + 'Y'];
        if (x != null && x !== '' && y != null && y !== '') {
          return {
            x: Number(x) || 0,
            y: Number(y) || 0,
            w: Number(this.form['bottom' + idx + 'Width']) || 300,
            h: Number(this.form['bottom' + idx + 'Height']) || 22
          };
        }
      }
      return null;
    },
    ensureBillTypeReady() {
      if (this.canOperateCanvas) return true;
      this.activeTab = 'basic';
      this.$message && this.$message.warning('请先选择单据类型');
      return false;
    },
    onDesignToolbarCapture(event) {
      if (this.canOperateCanvas) return;
      const tag = event.target && event.target.closest ? event.target.closest('button, .el-input, .el-select, .el-dropdown') : null;
      if (!tag) return;
      event.stopPropagation();
      event.preventDefault();
      this.ensureBillTypeReady();
    },
    onCanvasAreaCapture(event) {
      if (this.canOperateCanvas) return;
      event.stopPropagation();
      event.preventDefault();
      this.ensureBillTypeReady();
    },
    handleSelectComponent(item) {
      if (!item || !item.key) return;
      if (!this.ensureBillTypeReady()) return;
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
          this.addCanvasText();
          break;
        case 'dataTable':
        case 'entryTable':
          this.openGridSettingDialog();
          break;
        case 'header':
          this.canvasHeaderVisible = true;
          this.activeBottomTab = 'title';
          this.selectCanvasWidget('header');
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
        canvasColumnWidths: this.canvasColumnWidths,
        canvasRowHeights: this.canvasRowHeights,
        canvasTexts: this.canvasTexts,
        elementStyles: this.elementStyles,
        canvasTableX: this.canvasTableX,
        canvasTableY: this.canvasTableY,
        canvasTableVisible: this.canvasTableVisible
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
        if (Array.isArray(snap.canvasRowHeights)) this.canvasRowHeights = snap.canvasRowHeights;
        if (Array.isArray(snap.canvasTexts)) this.canvasTexts = snap.canvasTexts;
        if (snap.elementStyles && typeof snap.elementStyles === 'object') {
          this.elementStyles = { ...snap.elementStyles };
        }
        if (snap.canvasTableX !== undefined) this.canvasTableX = snap.canvasTableX;
        if (snap.canvasTableY !== undefined) this.canvasTableY = snap.canvasTableY;
        if (snap.canvasTableVisible !== undefined) this.canvasTableVisible = !!snap.canvasTableVisible;
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
      this.toolbarFontBold = !this.toolbarFontBold;
    },
    toggleFontItalic() {
      this.toolbarFontItalic = !this.toolbarFontItalic;
    },
    toggleFontUnderline() {
      this.toolbarFontUnderline = !this.toolbarFontUnderline;
    },
    handleFontColorCommand(color) {
      this.toolbarFontColor = color;
    },
    handleFillColorCommand(color) {
      this.toolbarFillColor = color;
    },
    handleTextAlignCommand(align) {
      this.setToolbarStyleValue('textAlign', align || 'left');
    },
    handleVerticalAlignCommand(align) {
      this.setToolbarStyleValue('verticalAlign', align || 'middle');
    },
    onBorderMenuVisible(visible) {
      this.borderMenuVisible = !!visible;
      this.borderSubMenu = '';
    },
    toggleBorderSubMenu(key) {
      this.borderSubMenu = this.borderSubMenu === key ? '' : key;
    },
    handleBorderCommand(cmd) {
      this.borderSubMenu = '';
      if (cmd === 'merge') {
        this.handleMergeCells();
        this.pushDesignHistory();
        return;
      }
      this.form.tableBorder = cmd;
      this.pushDesignHistory();
    },
    handleBorderLineStyle(style) {
      this.form.tableBorderStyle = style || 'thin';
      this.borderSubMenu = '';
      this.pushDesignHistory();
    },
    handleBorderColorChange(color) {
      const next = color || this.form.tableBorderColor || '#000000';
      this.form.tableBorderColor = next;
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
    captureCurrentTextStyle() {
      return {
        fontSize: this.toolbarFontSize,
        fontBold: this.toolbarFontBold,
        fontItalic: this.toolbarFontItalic,
        fontUnderline: this.toolbarFontUnderline,
        fontColor: this.toolbarFontColor,
        fillColor: this.toolbarFillColor,
        textAlign: this.getToolbarStyleValue('textAlign', this.form.textAlign || 'left'),
        verticalAlign: this.getToolbarStyleValue('verticalAlign', this.form.verticalAlign || 'middle')
      };
    },
    applyCapturedTextStyle(s) {
      if (!s) return;
      const keys = this.getSelectedStyleKeys();
      if (keys.length) {
        keys.forEach((key) => {
          const prev = (this.elementStyles && this.elementStyles[key]) || {};
          const next = { ...prev };
          ['fontSize', 'fontBold', 'fontItalic', 'fontUnderline', 'fontColor', 'fillColor', 'textAlign', 'verticalAlign'].forEach((p) => {
            if (s[p] != null) next[p] = s[p];
          });
          this.$set(this.elementStyles, key, next);
        });
        this.pushDesignHistory();
        return;
      }
      if (s.fontSize != null) this.form.fontSize = s.fontSize;
      if (s.fontBold != null) this.form.fontBold = s.fontBold;
      if (s.fontItalic != null) this.form.fontItalic = s.fontItalic;
      if (s.fontUnderline != null) this.form.fontUnderline = s.fontUnderline;
      if (s.fontColor != null) this.form.fontColor = s.fontColor;
      if (s.fillColor != null) this.form.fillColor = s.fillColor;
      if (s.textAlign != null) this.form.textAlign = s.textAlign;
      if (s.verticalAlign != null) this.form.verticalAlign = s.verticalAlign;
      this.pushDesignHistory();
    },
    toggleFormatPainter() {
      this.formatPainterActive = !this.formatPainterActive;
      if (this.formatPainterActive) {
        this.designClipboard = this.captureCurrentTextStyle();
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
      this.designClipboard = { type: 'style', ...this.captureCurrentTextStyle() };
      this.$message && this.$message.success('已复制当前样式');
    },
    /** 是否处于可输入状态（此时键盘 Delete 不删画布组件） */
    isTypingTarget(el) {
      if (!el) return false;
      // 画布文本：仅双击编辑态拦截；只读选中态允许 Delete 删组件
      if (el.classList && el.classList.contains('canvas-text-input')) {
        return !el.readOnly;
      }
      if (el.closest && el.closest('.canvas-text-input')) {
        const input = el.closest('.canvas-text-input');
        return input ? !input.readOnly : false;
      }
      const tag = (el.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
      if (el.isContentEditable) return true;
      if (el.closest && el.closest('.el-input, .el-textarea, .el-select, .preview-table-cell-input')) {
        return true;
      }
      return false;
    },
    onDesignKeyDown(e) {
      if (!e || !this.canOperateCanvas) return;
      const key = e.key || '';
      if (key !== 'Delete' && key !== 'Backspace' && e.keyCode !== 46 && e.keyCode !== 8) return;
      if (this.isTypingTarget(e.target)) return;
      // Backspace 在部分浏览器会后退页面，统一拦截
      e.preventDefault();
      this.handleDesignDelete();
    },
    /** 删除当前选中的画布组件 / 表格 / 单元格内容 */
    handleDesignDelete() {
      if (!this.canOperateCanvas) {
        this.$message && this.$message.warning('请先选择单据类型');
        return;
      }
      const key = this.canvasSelectedKey || '';

      // 1) 画布自由文本（含单据类型标题「入库单」等）
      if (key.indexOf('text:') === 0) {
        const id = key.slice(5);
        const idx = (this.canvasTexts || []).findIndex(t => t && t.id === id);
        if (idx >= 0) {
          this.canvasTexts.splice(idx, 1);
          if (this.elementStyles && this.elementStyles[key]) this.$delete(this.elementStyles, key);
          if (this.editingCanvasTextId === id) this.editingCanvasTextId = null;
          this.clearCanvasWidgetSelection();
          this.pushDesignHistory();
          return;
        }
      }

      // 2) 整表
      if (key === 'table') {
        this.canvasTableVisible = false;
        this.bodySelectedCells = [];
        this.headerSelectedCols = [];
        this.editingBodyCell = null;
        this.clearCanvasWidgetSelection();
        this.pushDesignHistory();
        return;
      }

      // 3) 二维码 / 条形码
      if (key === 'code') {
        this.form.codeDisplay = '';
        this.clearCanvasWidgetSelection();
        this.pushDesignHistory();
        return;
      }

      // 4) 页眉
      if (key === 'header') {
        this.canvasHeaderVisible = false;
        this.clearCanvasWidgetSelection();
        this.pushDesignHistory();
        return;
      }

      // 5) 标题标签 title:t-N
      const titleMatch = /^title:t-(\d+)$/.exec(key) || /^title:(\d+)$/.exec(key);
      if (titleMatch) {
        const idx = Number(titleMatch[1]);
        this.form['title' + idx + 'Visible'] = false;
        if (this.elementStyles && this.elementStyles[key]) this.$delete(this.elementStyles, key);
        this.clearCanvasWidgetSelection();
        this.pushDesignHistory();
        return;
      }

      // 6) 底部标签 bottom:b-N
      const bottomMatch = /^bottom:b-(\d+)$/.exec(key) || /^bottom:(\d+)$/.exec(key);
      if (bottomMatch) {
        const idx = Number(bottomMatch[1]);
        this.form['bottom' + idx + 'Visible'] = false;
        if (this.elementStyles && this.elementStyles[key]) this.$delete(this.elementStyles, key);
        this.clearCanvasWidgetSelection();
        this.pushDesignHistory();
        return;
      }

      // 7) 表体单元格：清空内容；选择框/序号列清空字段绑定
      if (key.indexOf('body-cell:') === 0 || (this.bodySelectedCells && this.bodySelectedCells.length)) {
        const cells = (this.bodySelectedCells && this.bodySelectedCells.length)
          ? this.bodySelectedCells
          : (() => {
              const m = /^body-cell:(\d+):(\d+)$/.exec(key);
              return m ? [{ row: Number(m[1]), col: Number(m[2]) }] : [];
            })();
        cells.forEach(cell => {
          const ck = cell.row + '_' + cell.col;
          if (this.bodyCellTexts && Object.prototype.hasOwnProperty.call(this.bodyCellTexts, ck)) {
            this.$delete(this.bodyCellTexts, ck);
          } else {
            this.$set(this.bodyCellTexts, ck, '');
          }
        });
        this.bodySelectedCells = [];
        this.editingBodyCell = null;
        this.clearCanvasWidgetSelection();
        this.pushDesignHistory();
        return;
      }

      // 8) 表头单元格：清空列字段绑定
      if (key.indexOf('header-cell:') === 0 || (this.headerSelectedCols && this.headerSelectedCols.length)) {
        const cols = (this.headerSelectedCols && this.headerSelectedCols.length)
          ? this.headerSelectedCols
          : (() => {
              const m = /^header-cell:(\d+)$/.exec(key);
              return m ? [Number(m[1])] : [];
            })();
        cols.forEach(col => {
          this.$set(this.tableHeaderFields, col, '');
        });
        this.headerSelectedCols = [];
        this.clearCanvasWidgetSelection();
        this.pushDesignHistory();
        return;
      }

      this.$message && this.$message.info('请先选中要删除的组件');
    },
    /** 保证 tableHeaderFields 长度不少于当前表格列数 */
    ensureTableHeaderFieldsLength() {
      const cols = Math.max(1, Math.min(20, Number(this.form.tableColumns) || 1));
      while (this.tableHeaderFields.length < cols) {
        this.tableHeaderFields.push('');
      }
      this.syncCanvasColumnWidthsFromConfig();
      this.ensureCanvasRowHeights();
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
            canvasTexts: (this.canvasTexts || []).map(t => ({ ...t })),
            canvasTextSeq: this.canvasTextSeq || 1,
            elementStyles: this.elementStyles && typeof this.elementStyles === 'object' ? { ...this.elementStyles } : {},
            canvasTableVisible: this.canvasTableVisible !== false,
            canvasTableX: this.canvasTableX,
            canvasTableY: this.canvasTableY,
            canvasRowHeights: Array.isArray(this.canvasRowHeights) ? [...this.canvasRowHeights] : [],
            canvasHeaderVisible: this.canvasHeaderVisible !== false,
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
            tableBorderStyle: this.form.tableBorderStyle || 'thin',
            tableBorderColor: this.form.tableBorderColor || '#000000',
            paperSize: this.form.paperSize || 'custom',
            printHeaderMode: this.form.printHeaderMode || 'first',
            printFooterMode: this.form.printFooterMode || 'last',
            hideTrailingZero: !!this.form.hideTrailingZero,
            printZeroAsEmpty: !!this.form.printZeroAsEmpty,
            fixedRowCount: !!this.form.fixedRowCount,
            fixedRowsPerPage: Math.max(1, parseInt(this.form.fixedRowsPerPage, 10) || 5),
            pageJoinPrint: !!this.form.pageJoinPrint,
            bottom1Type: this.form.bottom1Type,
            bottom1Width: this.form.bottom1Width,
            bottom1Height: this.form.bottom1Height,
            bottom1X: this.form.bottom1X,
            bottom1Y: this.form.bottom1Y,
            bottom1Visible: this.form.bottom1Visible,
            bottom1FixedValue: this.form.bottom1FixedValue,
            bottom1FixedValueText: this.form.bottom1FixedValueText,
            bottom2Type: this.form.bottom2Type,
            bottom2Width: this.form.bottom2Width,
            bottom2Height: this.form.bottom2Height,
            bottom2X: this.form.bottom2X,
            bottom2Y: this.form.bottom2Y,
            bottom2Visible: this.form.bottom2Visible,
            bottom2FixedValue: this.form.bottom2FixedValue,
            bottom2FixedValueText: this.form.bottom2FixedValueText,
            bottom3Type: this.form.bottom3Type,
            bottom3Width: this.form.bottom3Width,
            bottom3Height: this.form.bottom3Height,
            bottom3X: this.form.bottom3X,
            bottom3Y: this.form.bottom3Y,
            bottom3Visible: this.form.bottom3Visible,
            bottom3FixedValue: this.form.bottom3FixedValue,
            bottom3FixedValueText: this.form.bottom3FixedValueText,
            bottom4Type: this.form.bottom4Type,
            bottom4Width: this.form.bottom4Width,
            bottom4Height: this.form.bottom4Height,
            bottom4X: this.form.bottom4X,
            bottom4Y: this.form.bottom4Y,
            bottom4Visible: this.form.bottom4Visible,
            bottom4FixedValue: this.form.bottom4FixedValue,
            bottom4FixedValueText: this.form.bottom4FixedValueText,
            bottom5Type: this.form.bottom5Type,
            bottom5Width: this.form.bottom5Width,
            bottom5Height: this.form.bottom5Height,
            bottom5X: this.form.bottom5X,
            bottom5Y: this.form.bottom5Y,
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
            title1X: this.form.title1X,
            title1Y: this.form.title1Y,
            title2Type: this.form.title2Type,
            title2Name: this.form.title2Name,
            title2Visible: this.form.title2Visible,
            title2FixedValue: this.form.title2FixedValue,
            title2FixedValueText: this.form.title2FixedValueText,
            title2Width: this.form.title2Width,
            title2Height: this.form.title2Height,
            title2X: this.form.title2X,
            title2Y: this.form.title2Y,
            title3Type: this.form.title3Type,
            title3Name: this.form.title3Name,
            title3Visible: this.form.title3Visible,
            title3FixedValue: this.form.title3FixedValue,
            title3FixedValueText: this.form.title3FixedValueText,
            title3Width: this.form.title3Width,
            title3Height: this.form.title3Height,
            title3X: this.form.title3X,
            title3Y: this.form.title3Y,
            title4Type: this.form.title4Type,
            title4Name: this.form.title4Name,
            title4Visible: this.form.title4Visible,
            title4FixedValue: this.form.title4FixedValue,
            title4FixedValueText: this.form.title4FixedValueText,
            title4Width: this.form.title4Width,
            title4Height: this.form.title4Height,
            title4X: this.form.title4X,
            title4Y: this.form.title4Y,
            title5Type: this.form.title5Type,
            title5Name: this.form.title5Name,
            title5Visible: this.form.title5Visible,
            title5FixedValue: this.form.title5FixedValue,
            title5FixedValueText: this.form.title5FixedValueText,
            title5Width: this.form.title5Width,
            title5Height: this.form.title5Height,
            title5X: this.form.title5X,
            title5Y: this.form.title5Y,
            title6Type: this.form.title6Type,
            title6Name: this.form.title6Name,
            title6Visible: this.form.title6Visible,
            title6FixedValue: this.form.title6FixedValue,
            title6FixedValueText: this.form.title6FixedValueText,
            title6Width: this.form.title6Width,
            title6Height: this.form.title6Height,
            title6X: this.form.title6X,
            title6Y: this.form.title6Y
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
      return value * this.mmToPx;
    },
    getVerticalPosition(value) {
      return value * this.mmToPx;
    },
    /** 展开/收拢右侧配置面板：宽度动画 + 结束后再刷新刻度尺 */
    toggleRightPanel() {
      if (this.rightPanelAnimating) return;
      this.rightPanelAnimating = true;
      this.rightPanelCollapsed = !this.rightPanelCollapsed;
      const wrap = this.$el && this.$el.querySelector('.right-panel-wrap');
      const finish = () => {
        if (!this.rightPanelAnimating) return;
        this.rightPanelAnimating = false;
        if (wrap && this._onRightPanelTransitionEnd) {
          wrap.removeEventListener('transitionend', this._onRightPanelTransitionEnd);
          this._onRightPanelTransitionEnd = null;
        }
        if (this._rightPanelAnimTimer) {
          clearTimeout(this._rightPanelAnimTimer);
          this._rightPanelAnimTimer = null;
        }
        this.$nextTick(() => this.updateCanvasViewportSize());
      };
      this._onRightPanelTransitionEnd = (e) => {
        if (!e || e.target !== wrap) return;
        if (e.propertyName !== 'width' && e.propertyName !== 'max-width' && e.propertyName !== 'flex-basis') return;
        finish();
      };
      if (wrap) wrap.addEventListener('transitionend', this._onRightPanelTransitionEnd);
      if (this._rightPanelAnimTimer) clearTimeout(this._rightPanelAnimTimer);
      this._rightPanelAnimTimer = setTimeout(finish, 360);
    },
    onCanvasZoomCommand(z) {
      const n = Number(z);
      if (!Number.isFinite(n)) return;
      this.canvasZoom = n;
    },
    bindCanvasViewportObserver() {
      const el = this.$el && this.$el.querySelector('.left-panel-body');
      if (!el || typeof ResizeObserver === 'undefined') {
        this._onWindowResizeForRuler = () => this.updateCanvasViewportSize();
        window.addEventListener('resize', this._onWindowResizeForRuler);
        return;
      }
      this._canvasViewportObserver = new ResizeObserver(() => {
        this.updateCanvasViewportSize();
      });
      this._canvasViewportObserver.observe(el);
    },
    unbindCanvasViewportObserver() {
      if (this._canvasViewportObserver) {
        this._canvasViewportObserver.disconnect();
        this._canvasViewportObserver = null;
      }
      if (this._onWindowResizeForRuler) {
        window.removeEventListener('resize', this._onWindowResizeForRuler);
        this._onWindowResizeForRuler = null;
      }
      if (this._rightPanelAnimTimer) {
        clearTimeout(this._rightPanelAnimTimer);
        this._rightPanelAnimTimer = null;
      }
    },
    /** 根据画布可视区域更新刻度尺覆盖范围（动画中跳过，避免整页抖动） */
    updateCanvasViewportSize() {
      if (this.rightPanelAnimating) return;
      const el = this.$el && this.$el.querySelector('.left-panel-body');
      if (!el) return;
      const w = el.clientWidth || 0;
      const h = el.clientHeight || 0;
      if (w !== this.canvasViewportWidthPx) this.canvasViewportWidthPx = w;
      if (h !== this.canvasViewportHeightPx) this.canvasViewportHeightPx = h;
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
  overflow: visible;
}

.dialog-layout.is-right-collapsed .left-column {
  margin-right: 0;
}

/* 左侧始终吃剩余空间；右侧用可插值的 width/flex-basis 做丝滑收放 */
.left-column {
  flex: 1 1 0%;
  min-width: 0;
  min-height: 0;
  margin-right: 2px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.right-panel-wrap {
  position: relative;
  flex: 0 0 28.5%;
  width: 28.5%;
  max-width: 28.5%;
  min-width: 0;
  display: flex;
  align-self: stretch;
  overflow: hidden;
  transition:
    flex-basis 0.28s cubic-bezier(0.4, 0, 0.2, 1),
    width 0.28s cubic-bezier(0.4, 0, 0.2, 1),
    max-width 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: width, flex-basis, max-width;
}

.right-panel-wrap.is-collapsed {
  flex-basis: 0;
  width: 0;
  max-width: 0;
}

/* 动画结束后才露出把手，避免收放中被裁切/闪动 */
.right-panel-wrap.is-collapsed:not(.is-animating) {
  overflow: visible;
}

.right-panel-wrap.is-collapsed .right-panel {
  opacity: 0;
  pointer-events: none;
  border-color: transparent;
}

.right-panel-drawer-handle {
  position: absolute;
  left: 0;
  top: 2px;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 38px;
  padding: 0;
  margin: 0;
  transform: translateX(-50%);
  border: 1px solid #dcdfe6;
  border-radius: 3px 0 0 3px;
  background: #fff;
  box-shadow: -1px 0 4px rgba(0, 0, 0, 0.06);
  color: #606266;
  cursor: pointer;
  box-sizing: border-box;
}

.right-panel-drawer-handle:hover {
  color: #409eff;
  border-color: #409eff;
  background: #ecf5ff;
}

.right-panel-drawer-handle i {
  font-size: 10px;
}

.right-panel-wrap.is-collapsed .right-panel-drawer-handle {
  left: 0;
  transform: translateX(-100%);
  width: 12px;
  border-radius: 3px 0 0 3px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.canvas-zoom-dropdown {
  line-height: 1;
}

.canvas-zoom-text {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  color: #606266;
  cursor: pointer;
  user-select: none;
  outline: none;
}

.canvas-zoom-text:hover {
  color: #409eff;
}

.canvas-zoom-text .el-icon-arrow-down {
  margin-left: 2px;
  font-size: 10px;
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

.canvas-billtype-mask {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(1px);
  cursor: not-allowed;
  box-sizing: border-box;
}

.canvas-billtype-mask-tip {
  padding: 10px 16px;
  border-radius: 4px;
  background: rgba(48, 49, 51, 0.85);
  color: #fff;
  font-size: 13px;
  line-height: 1.4;
  pointer-events: none;
}

.left-column.is-canvas-locked .design-toolbar {
  opacity: 0.7;
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
  overflow: hidden;
}

.ruler-guide-h {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 100%;
  background: rgba(64, 158, 255, 0.22);
  border-left: 1px solid #409eff;
  border-right: 1px solid #409eff;
  box-sizing: border-box;
  pointer-events: none;
  z-index: 1;
  transition: background 0.12s ease;
}

.ruler-guide-h.dragging {
  background: rgba(64, 158, 255, 0.38);
}

.ruler-mark-horizontal {
  position: absolute;
  bottom: 0;
  z-index: 2;
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

.ruler-guide-v {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  background: rgba(64, 158, 255, 0.22);
  border-top: 1px solid #409eff;
  border-bottom: 1px solid #409eff;
  box-sizing: border-box;
  pointer-events: none;
  z-index: 1;
  transition: background 0.12s ease;
}

.ruler-guide-v.dragging {
  background: rgba(64, 158, 255, 0.38);
}

.ruler-mark-vertical {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 2;
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

.canvas-text-widget {
  box-sizing: border-box;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 2px;
  cursor: move;
  overflow: visible;
}

.canvas-text-widget.is-hovered {
  border-color: rgba(64, 158, 255, 0.55);
  background: transparent;
}

.canvas-text-widget.is-canvas-selected {
  border-color: #409eff;
  background: transparent;
}

.canvas-text-input {
  display: block;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 2px 6px;
  border: none;
  outline: none;
  background: transparent !important;
  box-sizing: border-box;
  font: inherit;
  color: inherit;
  text-align: inherit;
  cursor: move;
  user-select: none;
}

.canvas-text-widget.is-editing .canvas-text-input {
  cursor: text;
  user-select: text;
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

.print-mode-buttons {
  display: inline-flex;
}

.print-mode-buttons >>> .el-radio-button__inner {
  padding: 8px 12px;
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

/* 标题配置行：表头与表格之间；不设 relative，便于标签绝对定位拖到整张纸任意位置 */
.template-title-container {
  margin-top: 2px;
  margin-bottom: 2px;
}

.field-common-row {
  margin-bottom: 0;
}

.field-common-row .el-form-item {
  margin-bottom: 8px;
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
  cursor: move;
  user-select: none;
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
  cursor: move;
  user-select: none;
}

.template-bottom-item {
  white-space: nowrap;
}

/* 画布内表格预览：外框宽度=列宽合计，选中后可拖动手柄/整表位移 */
.preview-table-wrap {
  margin-top: 2px;
  padding: 4px;
  overflow: visible;
  max-width: 100%;
  display: inline-block;
  vertical-align: top;
  box-sizing: content-box;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  empty-cells: show;
  --table-border-line: 1px solid #000000;
}

.preview-table td,
.preview-table thead th {
  border: var(--table-border-line);
  min-height: var(--table-row-height, 22px);
  height: var(--table-row-height, 22px);
  padding: 2px 6px;
  box-sizing: border-box;
  overflow: visible;
}

.preview-table thead th {
  padding: 2px 4px;
  background: #f5f7fa;
  vertical-align: middle;
}

.preview-table tbody tr:hover td {
  background-color: rgba(64, 158, 255, 0.06);
}

/* 边框模式 */
.preview-table--none td,
.preview-table--none thead th {
  border: none !important;
}

.preview-table--outer td,
.preview-table--outer thead th {
  border: none !important;
}

.preview-table--inner {
  border: none !important;
}

.preview-table--inner tr:first-child > th,
.preview-table--inner tr:first-child > td {
  border-top-color: transparent !important;
}

.preview-table--inner tr:last-child > td,
.preview-table--inner tr:last-child > th {
  border-bottom-color: transparent !important;
}

.preview-table--inner tr > th:first-child,
.preview-table--inner tr > td:first-child {
  border-left-color: transparent !important;
}

.preview-table--inner tr > th:last-child,
.preview-table--inner tr > td:last-child {
  border-right-color: transparent !important;
}

.preview-table--left td,
.preview-table--left thead th,
.preview-table--right td,
.preview-table--right thead th,
.preview-table--top td,
.preview-table--top thead th,
.preview-table--bottom td,
.preview-table--bottom thead th {
  border: none !important;
}

.preview-table-header-cell.is-selected,
.preview-table-body-cell.is-selected {
  outline: 1px solid #409eff;
  outline-offset: -1px;
  z-index: 2;
}

/* 画布组件：悬停变色 + 双击选中（蓝框与八向手柄） */
.canvas-widget {
  position: relative;
  cursor: pointer;
  box-sizing: border-box;
}

.canvas-widget.is-hovered:not(.is-canvas-selected) {
  outline: 1px solid #409eff;
  outline-offset: 0;
  box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.25);
}

.canvas-widget.is-canvas-selected {
  outline: 1px solid #409eff;
  outline-offset: 0;
  z-index: 3;
}

.template-header.canvas-widget {
  position: relative;
}

.template-title-item.canvas-widget,
.template-bottom-item.canvas-widget {
  display: inline-block;
  vertical-align: top;
}

.preview-table-wrap.canvas-widget {
  cursor: move;
}

.preview-table-wrap.is-table-dragging {
  opacity: 0.92;
  user-select: none;
}

.print-checkbox-square {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 1px solid #303133;
  background: #fff;
  box-sizing: border-box;
  vertical-align: middle;
  flex-shrink: 0;
}

.ds-opt-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.canvas-header-text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 18px;
  line-height: 1.2;
  color: inherit;
  font-size: inherit;
  font-weight: inherit;
  font-style: inherit;
  text-decoration: inherit;
  pointer-events: none;
}

.row-resize-handle {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 5px;
  cursor: row-resize;
  z-index: 3;
}

.row-resize-handle:hover {
  background: rgba(64, 158, 255, 0.35);
}

.canvas-select-handles {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 5;
}

.canvas-select-handles.is-interactive .canvas-handle {
  pointer-events: auto;
  z-index: 6;
}

.canvas-handle {
  position: absolute;
  width: 7px;
  height: 7px;
  margin: 0;
  background: #409eff;
  border: 1px solid #fff;
  box-sizing: border-box;
  pointer-events: none;
}

.canvas-handle.nw { left: -3px; top: -3px; cursor: nwse-resize; }
.canvas-handle.n { left: 50%; top: -3px; margin-left: -3px; cursor: ns-resize; }
.canvas-handle.ne { right: -3px; top: -3px; cursor: nesw-resize; }
.canvas-handle.e { right: -3px; top: 50%; margin-top: -3px; cursor: ew-resize; }
.canvas-handle.se { right: -3px; bottom: -3px; cursor: nwse-resize; }
.canvas-handle.s { left: 50%; bottom: -3px; margin-left: -3px; cursor: ns-resize; }
.canvas-handle.sw { left: -3px; bottom: -3px; cursor: nesw-resize; }
.canvas-handle.w { left: -3px; top: 50%; margin-top: -3px; cursor: ew-resize; }

.preview-table-footer-cell {
  border: 1px solid #909399;
  padding: 2px 6px;
  box-sizing: border-box;
  text-align: left;
}

.preview-table-cell-inner {
  width: 100%;
  height: 100%;
  min-height: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
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
  font-size: inherit;
  font-weight: inherit;
  font-style: inherit;
  color: inherit;
  text-decoration: inherit;
  text-align: inherit;
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
  flex: 1;
  width: 100%;
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
  opacity: 1;
  transition: opacity 0.18s ease;
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

.other-print-option-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.other-print-options .el-checkbox {
  margin-right: 0;
}

.print-setting-help-icon {
  margin-left: 2px;
  font-size: 14px;
  color: #f56c6c;
  cursor: help;
  vertical-align: middle;
}

.fixed-rows-row {
  margin-top: 8px;
}

.template-basic-row {
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.template-basic-row .el-form-item {
  margin-bottom: 14px;
}

/* 模板名称/单据类型/备注：与字段属性「宽」同为 small 高度 */
.template-basic-row .el-input--small .el-input__inner,
.template-basic-row .el-select--small .el-input__inner,
.template-remark-item .el-input--small .el-input__inner {
  height: 32px;
  line-height: 32px;
}

.template-remark-item {
  margin-bottom: 14px;
}

.template-remark-item .el-form-item__content {
  line-height: 32px;
}

.component-palette {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 4px 2px 8px;
}

.component-palette.is-locked {
  opacity: 0.55;
  pointer-events: auto;
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

.dt-border-trigger-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  line-height: 0;
}

.dt-border-panel {
  min-width: 148px;
  padding: 6px 0 !important;
  margin-top: 6px !important;
  border: 1px solid #e4e7ed !important;
  border-radius: 4px !important;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12) !important;
  background: #fff !important;
}

.dt-border-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 12px 0 10px;
  color: #303133;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
}

.dt-border-item:hover,
.dt-border-item.active {
  background: #e6f1ff;
  color: #409eff;
}

.dt-border-item.active .dt-border-ico {
  color: #409eff;
}

.dt-border-ico {
  display: inline-flex;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  color: #303133;
  line-height: 0;
}

.dt-border-ico >>> svg {
  display: block;
}

.dt-border-label {
  flex: 1;
  line-height: 1;
}

.dt-border-arrow {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

.dt-border-divider {
  height: 1px;
  margin: 4px 0;
  background: #ebeef5;
}

.dt-border-item.has-sub {
  padding-right: 10px;
}

.dt-border-submenu {
  position: absolute;
  left: calc(100% - 2px);
  top: -6px;
  min-width: 120px;
  padding: 6px 0;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 30;
}

.dt-border-submenu::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 0;
  bottom: 0;
  width: 8px;
}

.dt-border-line-item {
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 14px;
  cursor: pointer;
}

.dt-border-line-item:hover,
.dt-border-line-item.active {
  background: #e6f1ff;
}

.dt-border-line-preview {
  display: block;
  width: 88px;
  height: 0;
  box-sizing: border-box;
}

.dt-border-color-submenu {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 148px;
  padding: 10px;
}

.dt-border-color-presets {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.dt-border-color-swatch {
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid #dcdfe6;
  border-radius: 2px;
  cursor: pointer;
  box-sizing: border-box;
}

.dt-border-color-swatch.active {
  outline: 2px solid #409eff;
  outline-offset: 1px;
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

<style>
.print-setting-tip {
  max-width: 320px;
  line-height: 1.5;
}

.canvas-zoom-menu .el-dropdown-menu__item.is-active-zoom {
  color: #409eff;
  background-color: #ecf5ff;
}

.grid-setting-dialog .el-dialog__body {
  padding: 16px 20px 8px;
}

.grid-setting-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.grid-setting-inputs {
  display: flex;
  align-items: center;
  gap: 24px;
}

.grid-setting-field {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.grid-setting-label {
  color: #606266;
  font-size: 13px;
  white-space: nowrap;
}

.grid-setting-field .el-input {
  width: 72px;
}

.grid-setting-picker {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px 0;
  user-select: none;
}

.grid-setting-picker-row {
  display: flex;
  gap: 4px;
}

.grid-setting-cell {
  width: 28px;
  height: 28px;
  box-sizing: border-box;
  border: 1px solid #dcdfe6;
  border-radius: 2px;
  background: #fff;
  cursor: pointer;
}

.grid-setting-cell.active {
  background: #ecf5ff;
  border-color: #409eff;
}
</style>
