# SPD 前端页面结构与性能标准

适用仓库：`spd-ui`（Vue 2.6 + Element UI 2.15 + Vue CLI 4）。  
目标：降低医院电脑上「进菜单慢、点弹窗顿、整体发卡」。  
底线：**业务操作、权限码、打印内容、审核流程必须与改前一致**，只改结构与挂载时机。

对照实现：`src/views/caigou/jihua/`（弹窗已拆文件并异步引用；部分弹窗仍缺 `v-if`，新改页不得照抄这个缺口）。  
拆分进度（改一个勾一个）：`docs/frontend-dialog-split-plan.md`。

---

## 1. 必须 / 禁止

| | 规则 |
|---|---|
| 必须 | 列表页 `index.vue` 只保留查询区、工具栏、主表、分页 |
| 必须 | 每个非平凡弹窗 / 全屏编辑层单独一个 SFC，页面异步引用 |
| 必须 | 弹窗用 `v-if` 控制，**打开才创建、关闭即销毁** |
| 必须 | 打印预览、打印模板独立组件，点打印才加载 |
| 必须 | 列表走现有分页；**已有页的 `page-sizes` 一档都不要改** |
| 必须 | 路由组件继续 `() => import(...)`；页面 `name` 与菜单路由 `name` 一致 |
| 禁止 | 把 2 个以上弹窗的模板写进列表 `index.vue` |
| 禁止 | 只靠 `:visible.sync` / `v-show` 让弹窗常驻 DOM |
| 禁止 | 同步 `import` 重弹窗、打印页、选物资大组件 |
| 禁止 | 为「一次看完」把 `pageSize` 提到 100+ 并整表渲染 |
| 禁止 | 升级 Vue 3、换 UI 库、改接口字段、改 `v-hasPermi` 权限码 |
| 禁止 | 改审核按钮顺序、打印布局、单据状态机（除非另有需求） |

---

## 2. 何时必须拆文件

出现任意一条，就必须从列表页拆出独立 SFC：

1. `index.vue`（含 template + script，不含纯样式）超过 **800 行**
2. 页面里已有 **1 个以上** 非平凡弹窗 / 全屏编辑层
3. 弹窗内有表格、选物资、打印、明细编辑、审核大表
4. 关闭弹窗后，其 DOM 仍留在列表页里

**可暂不拆（仍须 `v-if`）：**

- `$modal.confirm` / `$modal.msgSuccess` 等
- 无表格、无打印、模板不足 40 行的轻量 `el-dialog`（例如 1 个备注框）

轻量窗一旦长出表格或超过 40 行模板，按非平凡弹窗拆文件。

---

## 3. 弹窗与全屏编辑层

本项目里两类都算「弹窗」，同一套规则：

- `el-dialog`
- 全屏 `local-modal-mask` / `local-modal-content`（入库申请、高值申领等）

### 3.1 文件位置与命名

```
src/views/<模块>/<页面>/
  index.vue                 # 列表
  components/
    XxxEditDialog.vue       # 新增/编辑/审核主层
    XxxPrintDialog.vue      # 打印
    XxxSelectDialog.vue     # 选择类
```

- 一窗一文件，文件名用业务名 + `Dialog` 或 `Modal`
- 组件 `name` 用 PascalCase，与文件名一致
- 已有 `components/` 目录时沿用，不要把弹窗丢到别的模块

### 3.2 页面引用（必须同时满足）

```vue
<template>
  <div class="app-container list-page">
    <!-- 查询 + 主表 + 分页 -->

    <XxxEditDialog
      v-if="open"
      :visible.sync="open"
      v-bind="editDialogProps"
      @cancel="cancel"
      @submit="submitForm"
    />
  </div>
</template>

<script>
export default {
  name: 'InWarehouseApply',
  components: {
    XxxEditDialog: () => import('./components/XxxEditDialog')
  }
}
</script>
```

硬性要求：

1. `components` 里用 `() => import(...)`，禁止顶部同步 import 该弹窗
2. 根节点加 `v-if="开关"`，禁止只有 `:visible.sync`
3. 关闭时把开关设为 `false`，组件销毁；不要用 `v-show` 藏弹窗
4. `el-dialog` 加 `append-to-body`，需要时加 `destroy-on-close`（不能替代父级 `v-if`）
5. 弹窗内事件用 `$emit` 交给列表页；权限指令、接口调用可留在弹窗内，但列表查询、主表刷新必须留在 `index.vue`

### 3.3 弹窗组件骨架

```vue
<template>
  <el-dialog
    :title="title"
    :visible.sync="innerVisible"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
    @closed="$emit('closed')"
  >
    <!-- 本窗自己的表单/表格 -->
  </el-dialog>
</template>

<script>
export default {
  name: 'XxxEditDialog',
  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, default: '' }
  },
  computed: {
    innerVisible: {
      get() { return this.visible },
      set(v) { this.$emit('update:visible', v) }
    }
  }
}
</script>
```

全屏 `local-modal` 同样：整块 mask 放到独立 SFC，列表页 `v-if="open"` 再挂。

### 3.4 错误写法

```vue
<!-- 禁止：弹窗内联在 3000 行的 index 里 -->
<el-dialog :visible.sync="open">...</el-dialog>

<!-- 禁止：拆了文件但一进页就挂上 -->
<ApplyDetailDialog :visible.sync="applyDetailDialogVisible" />

<!-- 禁止：同步引入重弹窗 -->
import XxxEditDialog from './components/XxxEditDialog'
```

采购计划里 `ApplyBillHeaderDialog` / `ApplyDetailDialog` / `PlanProgressDialog` 已拆文件、已异步 import，但 **没有 `v-if`**，打开前仍会创建实例。新改页必须补上 `v-if`。

---

## 4. 打印

1. 打印弹窗、打印模板（A4 / 枣强套打等）独立 SFC，放在当前页 `components/` 或已有 `*Print*.vue` 旁
2. 列表页用 `v-if="printVisible"` + `() => import(...)`
3. 禁止把整份打印 HTML 写进列表 `index.vue`
4. 关闭打印后销毁组件，避免隐藏 iframe / 大表仍占内存
5. 打印按钮、权限、套打字段、纸张逻辑不得改样

---

## 5. 列表与表格

1. 主列表必须分页；默认沿用现有 `pageNum` / `pageSize` / `getList`
2. **拆弹窗时不要改 `page-sizes`、默认 `pageSize`、分页上限**，原来多少档还是多少档
3. 禁止为了少请求、把列表一次渲染进 DOM 而把 `pageSize` 临时提到 100+（导出拉数除外）
4. 弹窗内明细表同样控制渲染行数：能分页分页；不能分页时用 `max-height`，禁止无高度把几百行一次性铺开
5. 本标准 **不要求** 上虚拟滚动（会改变滚动手感）。未另开需求前不要引入
6. 不要为了性能改列、改按钮、去掉 `v-hasPermi`、合并操作列

---

## 6. 路由与 keep-alive

1. 业务路由继续懒加载：`component: () => import('@/views/...')`
2. 页面 `export default { name }` 必须等于后端菜单生成的路由 `name`，否则切页不缓存或缓存错页
3. `keep-alive` 按标签走，见 `src/store/modules/tagsView.js`、`src/layout/components/AppMain.vue`
4. **缓存上限（后续改 `tagsView` 时执行）：** `cachedViews` 最多 **8** 个；超出时先丢掉最早进入、且当前未显示的项。超过 8 个标签再点回去，未提交草稿可能丢失，这是医院电脑上的性能取舍，不是交互改版
5. 优先把超大页拆瘦并继续缓存。只有拆完仍明显卡、且该页不必保留未提交草稿时，才给路由加 `meta.noCache: true`
6. 禁止把所有业务页一刀切 `noCache`（用户依赖切回列表保留筛选）

---

## 7. 数据、侦听、首屏

1. `created` / `mounted` 只拉列表首屏必需接口（字典、下拉、`getList`）
2. 弹窗专用选项（用户、供应商全量、打印数据）放到弹窗 `created` 或打开后再请求
3. 禁止对整份单据明细 `deep: true` 侦听；数量变更用行内事件
4. 禁止在列表页 `data()` 里预置打印模板、空的大明细数组「备用」
5. 已有分片写入（如采购计划 `concatListInChunks`）可保留，不要改成一次 `push` 几千行

---

## 8. 改页时允许 / 不允许动的行为

**允许：** 文件拆分、异步组件、`v-if` 挂载、关掉销毁、分页档位按第 5 节收敛、keep-alive 数量上限。

**不允许：** 改接口 URL/字段、改权限标识、改审核通过/驳回逻辑、改打印样式与套打、改按钮文案与主流程、升级框架。

拆完后，同一操作路径点过去，结果必须与拆前一致。

---

## 9. 改页检查清单

改任何一个业务页，合并前逐项打勾：

- [ ] `index.vue` 已不再内联非平凡弹窗 / 打印模板
- [ ] 每个弹窗都是独立 SFC，且 `() => import(...)`
- [ ] 每个弹窗都有 `v-if`，关闭后组件销毁（Vue 开发工具里看不到残留实例）
- [ ] 轻量窗即使未拆文件，也用了 `v-if` 而不是常驻 `:visible`
- [ ] 进列表菜单时，网络面板没有打印接口、没有弹窗专用大查询
- [ ] 主表仍分页；分页档与改前一致
- [ ] 页面 `name` 仍与路由 `name` 一致
- [ ] 列表查询、勾选、新增、编辑、删除、审核、打印、权限按钮与改前一致
- [ ] 未改 `v-hasPermi` 的权限字

---

## 10. 本标准不覆盖

- 后端接口性能、SQL、报表计算
- 登录页视觉
- 虚拟列表、Web Worker、换构建工具
- 把 Element `el-table` 换成其他表格库

这些要另开需求，不塞进「按本标准改页」。
