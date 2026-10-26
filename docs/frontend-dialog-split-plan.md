# 弹窗拆分计划

依据：`docs/frontend-page-standard.md`  
范围：**主页（或业务面板）模板里仍写着弹窗 / 全屏编辑层 / 侧栏抽屉的，全部要拆。**  
做法：每个弹窗单独 SFC，页面 `() => import(...)` 引入，根节点 `v-if`（打开才创建，关闭销毁）。  
底线：不改业务、权限、打印、审核流程。

标记：改完一项把 `[ ]` 改成 `[x]`，并把文首进度分母保持 107、分子 +1。完成标准：该文件模板内不再内联 `el-dialog` / `local-modal-mask` / `*-drawer-mask`（样式类名残留除外）。  
「体积过大」和后面分模块会重复出现同一文件，**两处都勾**，进度只按文末去重名单计一次。

进度：**107 / 107**

---

## 怎么标

| 动作 | 含义 |
|------|------|
| **拆** | 弹窗还在主页里，要抽成 `components/XxxDialog.vue`（或 XxxModal）再引入 |
| **补 v-if** | 已经是独立文件，但主页没加 `v-if`，进页就会挂上，只补挂载 |

优先做「体积过大」里带 ★ 的（进菜单最卡）。其余按模块从上到下即可，不要跳着漏。

---

## 体积过大（优先）

主页又长、弹窗又和列表写在一起的。★ = 建议最先拆。

- [x] ★ `src/views/foundation/material/index.vue` — 耗材产品档案 — **拆** 主编辑层 + 图片/导入/批量修改/收费项目/放大编辑
- [x] ★ `src/views/gzOrder/apply/index.vue` — 高值入库申请 — **拆** 主编辑层 + 打印 + 选仓库 + UDI + 变更记录
- [x] ★ `src/views/inWarehouse/audit/index.vue` — 到货验收审核 — **拆** 主编辑层 + 变更记录 + 配送单 + JSON + 添加明细
- [x] ★ `src/views/inWarehouse/apply/index.vue` — 到货验收申请 — **拆** 主编辑层 + 打印 + 变更记录 + JSON + 配送单
- [x] ★ `src/views/outWarehouse/apply/index.vue` — 出库申请 — **拆** 主编辑层 + 选出库科室 + 变更记录 + JSON + 引用申请单
- [x] ★ `src/views/gzOrder/audit/index.vue` — 高值入库审核 — **拆** 主编辑层 + 打印 + 引用验收单 + 选科室 + 变更记录/JSON
- [x] ★ `src/views/caigou/jihua/index.vue` — 采购计划 — **补 v-if**（PlanEditDialog 已拆且有 v-if；ApplyBillHeaderDialog / ApplyDetailDialog / PlanProgressDialog 缺 v-if）
- [x] ★ `src/views/department/dApply/index.vue` — 科室申购 — **拆** 主编辑层 + 模板层 + 关联出库 + 模板名称
- [x] ★ `src/views/outWarehouse/audit/index.vue` — 出库审核 — **拆** 主编辑层 + 变更记录 + JSON + 添加明细
- [x] ★ `src/views/stocktaking/profit/index.vue` — 盘盈处理 — **拆** 主编辑层 + 盘盈明细 + 导入 + 审核确认
- [x] ★ `src/views/department/stocktaking/index.vue` — 科室盘点 — **拆** 主编辑层 + 盘盈明细 + 保存前确认
- [x] ★ `src/views/inWarehouse/refundGoodsAudit/index.vue` — 退货审核 — **拆** 主编辑层 + 变更记录 + JSON + 添加明细
- [x] ★ `src/views/inWarehouse/refundGoodsApply/index.vue` — 退货申请 — **拆** 主编辑层 + 变更记录 + JSON + 引用单据
- [x] ★ `src/views/system/printSetting/form.vue` — 打印模板设计 — **拆** 引用单据弹窗
- [x] ★ `src/views/warehouseTransfer/apply/index.vue` — 调拨申请 — **拆** 主编辑层
- [x] ★ `src/views/system/user/index.vue` — 用户管理 — **拆** 侧栏编辑 + 导入 + 解析结果 + 授权 + 批量密码 + 批量工作组
- [x] ★ `src/views/caigou/jihua/audit/index.vue` — 采购计划审核 — **拆** 审核意见 + 引用申购单号 + 申购明细（PlanEditDialog 已引入，这三项仍内联）
- [x] ★ `src/views/gzOrder/refund/index.vue` — 备货退货 — **拆** 主编辑层 + 打印 + 引用备货出库单
- [x] ★ `src/views/department/stocktakingAudit/index.vue` — 科室盘点审核 — **拆** 主编辑层
- [x] ★ `src/views/stocktaking/in/index.vue` — 盘盈入库 — **拆** 主编辑层 + 盘盈明细 + 保存/审核确认 + 导入
- [x] ★ `src/views/outWarehouse/refundDepotApply/index.vue` — 退库申请 — **拆** 主编辑层 + 变更记录 + JSON
- [x] ★ `src/views/monitoring/fixedNumber/index.vue` — 定数监测 — **拆** 主编辑层
- [x] ★ `src/views/caigou/publish/index.vue` — 订单发布 — **拆** 主编辑层 + 查看申购单 + 申购明细 + 查看采购计划
- [x] ★ `src/views/outWarehouse/refundDepotAudit/index.vue` — 退库审核 — **拆** 主编辑层 + 变更记录 + JSON
- [x] ★ `src/views/gzOrder/goodsApply/index.vue` — 高值退货申请 — **拆** 主编辑层 + 引用备货验收单
- [x] ★ `src/views/department/dPurchaseAgg/index.vue` — 科室汇总采购 — **拆** 主编辑层
- [x] ★ `src/views/index.vue` — 首页 — **拆** 设置常用菜单
- [x] ★ `src/views/caigou/priceAdjust/index.vue` — 调价管理 — **拆** 主编辑层
- [x] ★ `src/views/warehouseTransfer/audit/index.vue` — 调拨审核 — **拆** 主编辑层
- [x] ★ `src/views/department/batchConsume/index.vue` — 科室批量消耗 — **拆** 主编辑层 + 退消耗
- [x] ★ `src/views/warehouse/inventory/firstInventory.vue` — 一级库存查询 — **拆** 列设置

---

## 采购

- [x] `src/views/caigou/dingdan/index.vue` — 采购订单 — **拆** 主编辑层 + 采购计划 + 科室申购单明细
- [x] `src/views/caigou/jihua/index.vue` — 采购计划 — **补 v-if**（见上，勿漏）
- [x] `src/views/caigou/jihua/audit/index.vue` — 采购计划审核 — **拆**（见上，勿漏）
- [x] `src/views/caigou/priceAdjust/index.vue` — 调价管理 — **拆**（见上，勿漏）
- [x] `src/views/caigou/priceAdjust/audit/index.vue` — 调价审核 — **拆** 主编辑层
- [x] `src/views/caigou/publish/index.vue` — 订单发布 — **拆**（见上，勿漏）
- [x] `src/views/caigou/scmBind/index.vue` — 平台绑定 — **拆** 修改平台医院编码 + 修改平台编码绑定
- [x] `src/views/caigou/shenhe/index.vue` — 订单审查 — **拆** 主编辑层 + 查看申购单 + 申购明细 + 查看采购计划

---

## 入库 / 出库 / 退货退库 / 调拨

- [x] `src/views/inWarehouse/apply/index.vue` — 到货验收申请 — **拆**（见上，勿漏）
- [x] `src/views/inWarehouse/audit/index.vue` — 到货验收审核 — **拆**（见上，勿漏）
- [x] `src/views/inWarehouse/refundGoodsApply/index.vue` — 退货申请 — **拆**（见上，勿漏）
- [x] `src/views/inWarehouse/refundGoodsAudit/index.vue` — 退货审核 — **拆**（见上，勿漏）
- [x] `src/views/outWarehouse/apply/index.vue` — 出库申请 — **拆**（见上，勿漏）
- [x] `src/views/outWarehouse/audit/index.vue` — 出库审核 — **拆**（见上，勿漏）
- [x] `src/views/outWarehouse/refundDepotApply/index.vue` — 退库申请 — **拆**（见上，勿漏）
- [x] `src/views/outWarehouse/refundDepotAudit/index.vue` — 退库审核 — **拆**（见上，勿漏）
- [x] `src/views/warehouseTransfer/apply/index.vue` — 调拨申请 — **拆**（见上，勿漏）
- [x] `src/views/warehouseTransfer/audit/index.vue` — 调拨审核 — **拆**（见上，勿漏）

---

## 高值

- [x] `src/views/gzOrder/apply/index.vue` — 高值入库申请 — **拆**（见上，勿漏）
- [x] `src/views/gzOrder/audit/index.vue` — 高值入库审核 — **拆**（见上，勿漏）
- [x] `src/views/gzOrder/follow/index.vue` — 跟台管理 — **拆** 主编辑层 + 变更记录 + JSON
- [x] `src/views/gzOrder/goodsApply/index.vue` — 高值退货申请 — **拆**（见上，勿漏）
- [x] `src/views/gzOrder/goodsAudit/index.vue` — 高值退货审核 — **拆** 主编辑层 + 变更记录 + JSON
- [x] `src/views/gzOrder/refund/index.vue` — 备货退货 — **拆**（见上，勿漏）
- [x] `src/views/gzDepartment/apply/index.vue` — 高值科室申请 — **拆** 主编辑层
- [x] `src/views/gzDepartment/audit/index.vue` — 高值科室审核 — **拆** 主编辑层
- [x] `src/views/gz/highChargeScan/index.vue` — 高值计费扫码 — **拆** 扫码消耗 + 追溯 + 消耗记录 + 拉取
- [x] `src/views/gz/highChargeConfirm/index.vue` — 高值消耗确认 — **拆** 消耗确认 + 确认结果
- [x] `src/views/gz/instantIo/index.vue` — 即入即出 — **拆** 审核 + 单据结果

---

## 科室

- [x] `src/views/department/dApply/index.vue` — 科室申购 — **拆**（见上，勿漏）
- [x] `src/views/department/dApplyAudit/index.vue` — 科室申购审核 — **拆** 主编辑层 + 驳回原因
- [x] `src/views/department/dAudit/index.vue` — 科室业务审核 — **拆** 主编辑层
- [x] `src/views/department/dPurchase/index.vue` — 科室采购 — **拆** 主编辑层
- [x] `src/views/department/dPurchaseAudit/index.vue` — 科室采购审核 — **拆** 主编辑层
- [x] `src/views/department/dPurchaseAgg/index.vue` — 科室汇总采购 — **拆**（见上，勿漏）
- [x] `src/views/department/dPurchaseAggAudit/index.vue` — 科室汇总采购审核 — **拆** 主编辑层
- [x] `src/views/department/newProductApply/index.vue` — 新品申请 — **拆** 主编辑层
- [x] `src/views/department/newProductAudit/index.vue` — 新品审核 — **拆** 主编辑层
- [x] `src/views/department/departmentTransfer/apply/index.vue` — 科室调拨申请 — **拆** 主编辑层
- [x] `src/views/department/receiptConfirm/index.vue` — 到货确认 — **拆** 主编辑层
- [x] `src/views/department/stocktaking/index.vue` — 科室盘点 — **拆**（见上，勿漏）
- [x] `src/views/department/stocktakingAudit/index.vue` — 科室盘点审核 — **拆**（见上，勿漏）
- [x] `src/views/department/batchConsume/index.vue` — 科室批量消耗 — **拆**（见上，勿漏）
- [x] `src/views/department/inventoryWarning/index.vue` — 科室库存预警 — **拆** 主编辑层 + 预警设置
- [x] `src/views/department/patientCharge/index.vue` — 患者计费核销 — **拆** 消耗记录 + 追溯 + 补全执行科室 + 自选/批量核销 + 结果
- [x] `src/views/department/whWarehouseApply/index.vue` — 库房申请 — **拆** 申请单明细
- [x] `src/views/department/depInventory/components/DepartmentInOutDetail.vue` — 科室出入库明细（面板） — **拆** 内联详情弹窗

---

## 仓库 / 盘点 / 结算 / 发票

- [x] `src/views/warehouse/stocktaking/index.vue` — 仓库盘点 — **拆** 主编辑层
- [x] `src/views/warehouse/profitLoss/index.vue` — 盈亏单 — **拆** 主编辑层 + 引入盘点单
- [x] `src/views/warehouse/initialStockImport/index.vue` — 期初库存导入 — **拆** 导入 + 期初单详情
- [x] `src/views/warehouse/hcBarcodeOwnership/index.vue` — 条码归属 — **拆** 条码归属详情
- [x] `src/views/warehouse/inventory/firstInventory.vue` — 一级库存查询 — **拆**（见上，勿漏）
- [x] `src/views/warehouse/smartBoard/index.vue` — 智能看板 — **拆** 编辑 3D 布局
- [x] `src/views/stocktaking/in/index.vue` — 盘盈入库 — **拆**（见上，勿漏）
- [x] `src/views/stocktaking/profit/index.vue` — 盘盈处理 — **拆**（见上，勿漏）
- [x] `src/views/settlement/apply/index.vue` — 结算申请 — **拆** 主编辑层 + 查看结算
- [x] `src/views/settlement/audit/index.vue` — 结算审核 — **拆** 主编辑层 + 打印 + 发票补录
- [x] `src/views/finance/invoice/index.vue` — 发票管理 — **拆** 编辑弹窗
- [x] `src/views/finance/suppSettlement/index.vue` — 供应商结算 — **拆** 结算单详情 + 关联发票
- [x] `src/views/finance/whSettlement/index.vue` — 库房结算 — **拆** 编辑弹窗
- [x] `src/views/fp/init/index.vue` — 发票初始化 — **拆** 主编辑层 + 发票补录
- [x] `src/views/monitoring/fixedNumber/index.vue` — 定数监测 — **拆**（见上，勿漏）

---

## 基础档案

- [x] `src/views/foundation/material/index.vue` — 耗材产品档案 — **拆**（见上，勿漏）
- [x] `src/views/foundation/materialCategory/index.vue` — 耗材分类 — **拆** 侧栏编辑层
- [x] `src/views/foundation/materialCompare/index.vue` — 耗材对照 — **拆** HIS 对照 + HRP 对照
- [x] `src/views/foundation/supplier/index.vue` — 供应商 — **拆** 主编辑层 + 导入预览 + 变更日志
- [x] `src/views/foundation/factory/index.vue` — 生产厂家 — **拆** 侧栏编辑 + 导入预览 + 变更日志
- [x] `src/views/foundation/depart/index.vue` — 科室档案 — **拆** 主编辑层 + 导入预览
- [x] `src/views/foundation/warehouse/index.vue` — 仓库 — **拆** 侧栏编辑层
- [x] `src/views/foundation/warehouseCategory/index.vue` — 仓库分类 — **拆** 主编辑层 + 导入预览
- [x] `src/views/foundation/location/index.vue` — 货位 — **拆** 主编辑层
- [x] `src/views/foundation/unit/index.vue` — 计量单位 — **拆** 侧栏编辑层
- [x] `src/views/foundation/financeCategory/index.vue` — 财务分类 — **拆** 主编辑层 + 导入预览
- [x] `src/views/foundation/equipmentDict/index.vue` — 设备字典 — **拆** 主编辑层 + 图片预览 + 导入
- [x] `src/views/foundation/category68/index.vue` — 68 分类 — **拆** 主编辑层
- [x] `src/views/foundation/focus18/index.vue` — 重点 18 类 — **拆** 侧栏编辑层
- [x] `src/views/foundation/jcPeriod/index.vue` — 监测周期 — **拆** 主编辑层
- [x] `src/views/foundation/jcType/index.vue` — 监测类型 — **拆** 主编辑层
- [x] `src/views/foundation/jcReport/index.vue` — 监测报表 — **拆** 主编辑层
- [x] `src/views/foundation/testplat/index.vue` — 测试平台 — **拆** 主编辑层
- [x] `src/views/foundation/testinfo/index.vue` — 测试信息 — **拆** 编辑 + 上传
- [x] `src/views/foundation/scmMaterialArchive/index.vue` — SCM 物资档案 — **拆** 推送/应用字段配置
- [x] `src/views/foundation/masterSnapshot/index.vue` — 主数据快照 — **拆** 变更前后 JSON
- [x] `src/views/foundation/msunProbe/index.vue` — 众阳 HIS 联调 — **拆** 调用结果（MsunHisParamDialog 已是独立组件，本页仍有内联结果窗）

---

## 系统 / 租户 / 监控 / 工具 / 其它

- [x] `src/views/system/user/index.vue` — 用户管理 — **拆**（见上，勿漏）
- [x] `src/views/system/role/index.vue` — 角色管理 — **拆** 角色编辑 + 数据权限
- [x] `src/views/system/menu/index.vue` — 菜单管理 — **拆** 菜单编辑 + 批量对客户开放 + 批量赋权
- [x] `src/views/system/dept/index.vue` — 部门管理 — **拆** 编辑弹窗
- [x] `src/views/system/post/index.vue` — 岗位管理 — **拆** 岗位编辑 + 授权
- [x] `src/views/system/dict/index.vue` — 字典类型 — **拆** 编辑弹窗
- [x] `src/views/system/dict/data.vue` — 字典数据 — **拆** 编辑弹窗
- [x] `src/views/system/config/index.vue` — 参数配置 — **拆** 编辑弹窗
- [x] `src/views/system/notice/index.vue` — 通知公告 — **拆** 编辑弹窗
- [x] `src/views/system/departmeRole/index.vue` — 科室角色 — **拆** 角色 + 数据权限
- [x] `src/views/system/warehouseRole/index.vue` — 库房角色 — **拆** 角色 + 数据权限
- [x] `src/views/system/printSetting/index.vue` — 打印设置 — **拆** 编辑弹窗
- [x] `src/views/system/printSetting/form.vue` — 打印模板设计 — **拆**（见上，勿漏）
- [x] `src/views/material/system/customer/index.vue` — 耗材客户 — **拆** CRUD + 启停用 + 全库初始化 + 权限 + 小数位
- [x] `src/views/material/system/customerMenuManage/index.vue` — 客户菜单管理 — **拆** 启停用 + 记录 + 时间段
- [x] `src/views/material/system/hisExternalDb/index.vue` — HIS 外部库 — **拆** 编辑弹窗
- [x] `src/views/monitor/job/index.vue` — 定时任务 — **拆** 任务编辑 + Cron + 任务详细
- [x] `src/views/monitor/job/log.vue` — 调度日志 — **拆** 调度日志详细
- [x] `src/views/monitor/operlog/index.vue` — 操作日志 — **拆** 操作日志详细
- [x] `src/views/tool/gen/index.vue` — 代码生成 — **拆** 预览弹窗
- [x] `src/views/datacenter/digitalTwin/index.vue` — 数字孪生 — **拆** 详情弹窗
- [x] `src/views/index.vue` — 首页 — **拆**（见上，勿漏）
- [x] `src/views/shared/PurchaseSummaryReport.vue` — 采购汇总报表 — **拆** 报表弹窗

---

## 不进本清单（避免漏标时误以为漏扫）

这些**不是**「弹窗写在主页里」，已是独立弹窗或公共选择器，不在 107 里打勾。

| 文件 | 原因 |
|------|------|
| `src/views/caigou/jihua/components/PlanEditDialog.vue` | 已是独立弹窗 |
| `src/views/caigou/jihua/components/ReferencePurchaseDialog.vue` | 已是独立弹窗（内部还有「驳回原因」子弹窗，主页不内联，本轮可不拆） |
| `src/views/caigou/jihua/components/PlanProgressDialog.vue` | 已是独立弹窗，主页缺 v-if，记在 `jihua/index.vue` |
| `src/views/caigou/jihua/components/ApplyDetailDialog.vue` | 同上 |
| `src/views/caigou/jihua/components/ApplyBillHeaderDialog.vue` | 同上 |
| `src/views/tool/build/CodeTypeDialog.vue` | 表单设计器独立弹窗 |
| `src/views/tool/build/IconsDialog.vue` | 同上 |
| `src/views/tool/build/TreeNodeDialog.vue` | 同上 |
| `src/views/system/role/selectUser.vue` | 整页就是选用户弹层 |
| `src/views/tool/gen/importTable.vue` | 整页就是导入表弹层 |
| `src/views/system/user/profile/userAvatar.vue` | 整页就是头像裁剪弹层 |
| `src/views/login.vue` | 登录页授权弹窗，不是业务菜单 |
| `src/layout/components/Navbar.vue` | 顶栏，不是业务菜单 |
| `src/components/PrintDialog/index.vue` | 公共打印弹窗 |
| `src/components/TableColumnSettingDialog/index.vue` | 公共列设置 |
| `src/components/MsunHisParamDialog/index.vue` | 公共 HIS 参数 |
| `src/components/SelectModel/*.vue` | 公共选择器，本身就是弹层 |

`src/views` 其余页面模板里没有 `el-dialog` / `local-modal-mask` / `*-drawer-mask`，不需要拆弹窗。以后新写的页如果又把弹窗写进主页，补一行到对应模块即可。

---

## 文件名速查（去重后 107 个，改完勾上面分组即可）

```
src/views/caigou/dingdan/index.vue
src/views/caigou/jihua/audit/index.vue
src/views/caigou/jihua/index.vue
src/views/caigou/priceAdjust/audit/index.vue
src/views/caigou/priceAdjust/index.vue
src/views/caigou/publish/index.vue
src/views/caigou/scmBind/index.vue
src/views/caigou/shenhe/index.vue
src/views/datacenter/digitalTwin/index.vue
src/views/department/batchConsume/index.vue
src/views/department/dApply/index.vue
src/views/department/dApplyAudit/index.vue
src/views/department/dAudit/index.vue
src/views/department/departmentTransfer/apply/index.vue
src/views/department/depInventory/components/DepartmentInOutDetail.vue
src/views/department/dPurchase/index.vue
src/views/department/dPurchaseAgg/index.vue
src/views/department/dPurchaseAggAudit/index.vue
src/views/department/dPurchaseAudit/index.vue
src/views/department/inventoryWarning/index.vue
src/views/department/newProductApply/index.vue
src/views/department/newProductAudit/index.vue
src/views/department/patientCharge/index.vue
src/views/department/receiptConfirm/index.vue
src/views/department/stocktaking/index.vue
src/views/department/stocktakingAudit/index.vue
src/views/department/whWarehouseApply/index.vue
src/views/finance/invoice/index.vue
src/views/finance/suppSettlement/index.vue
src/views/finance/whSettlement/index.vue
src/views/foundation/category68/index.vue
src/views/foundation/depart/index.vue
src/views/foundation/equipmentDict/index.vue
src/views/foundation/factory/index.vue
src/views/foundation/financeCategory/index.vue
src/views/foundation/focus18/index.vue
src/views/foundation/jcPeriod/index.vue
src/views/foundation/jcReport/index.vue
src/views/foundation/jcType/index.vue
src/views/foundation/location/index.vue
src/views/foundation/masterSnapshot/index.vue
src/views/foundation/material/index.vue
src/views/foundation/materialCategory/index.vue
src/views/foundation/materialCompare/index.vue
src/views/foundation/msunProbe/index.vue
src/views/foundation/scmMaterialArchive/index.vue
src/views/foundation/supplier/index.vue
src/views/foundation/testinfo/index.vue
src/views/foundation/testplat/index.vue
src/views/foundation/unit/index.vue
src/views/foundation/warehouse/index.vue
src/views/foundation/warehouseCategory/index.vue
src/views/fp/init/index.vue
src/views/gz/highChargeConfirm/index.vue
src/views/gz/highChargeScan/index.vue
src/views/gz/instantIo/index.vue
src/views/gzDepartment/apply/index.vue
src/views/gzDepartment/audit/index.vue
src/views/gzOrder/apply/index.vue
src/views/gzOrder/audit/index.vue
src/views/gzOrder/follow/index.vue
src/views/gzOrder/goodsApply/index.vue
src/views/gzOrder/goodsAudit/index.vue
src/views/gzOrder/refund/index.vue
src/views/index.vue
src/views/inWarehouse/apply/index.vue
src/views/inWarehouse/audit/index.vue
src/views/inWarehouse/refundGoodsApply/index.vue
src/views/inWarehouse/refundGoodsAudit/index.vue
src/views/material/system/customer/index.vue
src/views/material/system/customerMenuManage/index.vue
src/views/material/system/hisExternalDb/index.vue
src/views/monitor/job/index.vue
src/views/monitor/job/log.vue
src/views/monitor/operlog/index.vue
src/views/monitoring/fixedNumber/index.vue
src/views/outWarehouse/apply/index.vue
src/views/outWarehouse/audit/index.vue
src/views/outWarehouse/refundDepotApply/index.vue
src/views/outWarehouse/refundDepotAudit/index.vue
src/views/settlement/apply/index.vue
src/views/settlement/audit/index.vue
src/views/shared/PurchaseSummaryReport.vue
src/views/stocktaking/in/index.vue
src/views/stocktaking/profit/index.vue
src/views/system/config/index.vue
src/views/system/departmeRole/index.vue
src/views/system/dept/index.vue
src/views/system/dict/data.vue
src/views/system/dict/index.vue
src/views/system/menu/index.vue
src/views/system/notice/index.vue
src/views/system/post/index.vue
src/views/system/printSetting/form.vue
src/views/system/printSetting/index.vue
src/views/system/role/index.vue
src/views/system/user/index.vue
src/views/system/warehouseRole/index.vue
src/views/tool/gen/index.vue
src/views/warehouse/hcBarcodeOwnership/index.vue
src/views/warehouse/initialStockImport/index.vue
src/views/warehouse/inventory/firstInventory.vue
src/views/warehouse/profitLoss/index.vue
src/views/warehouse/smartBoard/index.vue
src/views/warehouse/stocktaking/index.vue
src/views/warehouseTransfer/apply/index.vue
src/views/warehouseTransfer/audit/index.vue
```
