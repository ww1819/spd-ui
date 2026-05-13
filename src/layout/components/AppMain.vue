<template>
  <section class="app-main">
    <!-- 消息提醒：主内容区内 local-modal（与到货验收页策略一致） -->
    <transition name="wh-modal-fade">
      <div
        v-if="warehouseReminderVisible"
        class="wh-reminder-local-mask"
        @click.self="closeWarehouseReminder"
      >
        <transition name="wh-modal-zoom">
          <div v-if="warehouseReminderVisible" class="wh-reminder-local-content">
            <div class="wh-reminder-modal-header">
              <div class="wh-reminder-modal-title">消息提醒</div>
              <el-button size="small" class="wh-reminder-close-btn" @click="closeWarehouseReminder">关闭</el-button>
            </div>
            <div class="wh-reminder-modal-body">
              <div class="wh-reminder-body-layout">
                <aside class="wh-reminder-aside">
                  <nav class="wh-reminder-side-menu" aria-label="消息提醒分类">
                    <div
                      v-for="m in reminderSideMenus"
                      :key="m.key"
                      :class="['wh-reminder-side-item', { active: messageReminderCategory === m.key }]"
                      role="button"
                      tabindex="0"
                      @click="selectReminderCategory(m.key)"
                      @keyup.enter="selectReminderCategory(m.key)"
                    >
                      {{ m.label }}
                    </div>
                  </nav>
                </aside>
                <div class="wh-reminder-panel">
                  <template v-if="messageReminderCategory === 'warehouse'">
                    <nav class="wh-reminder-sub-tabs" aria-label="仓库预警分类">
                      <div
                        v-for="t in warehouseSubTabs"
                        :key="t.key"
                        :class="['wh-reminder-sub-tab', { active: warehouseReminderSubTab === t.key }]"
                        role="button"
                        tabindex="0"
                        @click="selectWarehouseSubTab(t.key)"
                        @keyup.enter="selectWarehouseSubTab(t.key)"
                      >
                        <span>{{ t.label }}</span>
                        <span
                          v-if="warehouseSubTabBadge(t.key)"
                          class="wh-reminder-sub-tab-badge"
                        >{{ warehouseSubTabBadge(t.key) }}</span>
                      </div>
                    </nav>
                    <div
                      v-show="showWarehouseBillBlock"
                      v-loading="warehouseReminderLoading"
                      class="wh-reminder-bill-layout"
                    >
                      <div class="wh-reminder-bill-right">
                        <p v-if="warehouseReminderError" class="wh-reminder-error wh-reminder-error--above-table">{{ warehouseReminderError }}</p>
                        <div v-show="showWarehouseApplyBlock" class="wh-reminder-table-section">
                          <div class="wh-reminder-apply-toolbar">
                            <div class="wh-reminder-detail-section-title">待出库申领单</div>
                            <el-select
                              v-model="applyOutboundStatusFilter"
                              size="small"
                              class="wh-reminder-status-filter"
                              placeholder="状态"
                            >
                              <el-option label="全部" value="all" />
                              <el-option label="未出库" value="pending" />
                              <el-option label="已出库" value="out" />
                            </el-select>
                          </div>
                          <el-table
                            :data="filteredWarehouseApplyRows"
                            border
                            stripe
                            size="small"
                            class="wh-reminder-detail-table"
                            max-height="320"
                            empty-text="暂无数据"
                          >
                            <el-table-column type="index" label="序号" width="58" align="center" />
                            <el-table-column label="申领单号" prop="applyBillNo" min-width="140" show-overflow-tooltip>
                              <template slot-scope="scope">
                                <span
                                  class="wh-reminder-bill-no-link"
                                  :title="'双击打开出库申请'"
                                  @dblclick.prevent="handleDeptApplyBillNoDblClick(scope.row.applyBillNo)"
                                >{{ scope.row.applyBillNo }}</span>
                              </template>
                            </el-table-column>
                            <el-table-column label="状态" width="92" align="center">
                              <template slot-scope="scope">
                                <el-tag v-if="applyRowOutboundDone(scope.row)" type="success" size="small">已出库</el-tag>
                                <el-tag v-else type="info" size="small">未出库</el-tag>
                              </template>
                            </el-table-column>
                            <el-table-column label="制单时间" min-width="150" show-overflow-tooltip>
                              <template slot-scope="scope">
                                <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
                              </template>
                            </el-table-column>
                            <el-table-column label="科室" min-width="100" show-overflow-tooltip>
                              <template slot-scope="scope">
                                <span>{{ scope.row.departmentName || '—' }}</span>
                              </template>
                            </el-table-column>
                            <el-table-column label="金额" width="100" align="right" show-overflow-tooltip>
                              <template slot-scope="scope">
                                <span v-if="scope.row.totalAmount && parseFloat(scope.row.totalAmount) > 0">¥{{ formatReminderMoney(scope.row.totalAmount) }}</span>
                                <span v-else>—</span>
                              </template>
                            </el-table-column>
                            <el-table-column label="制单人" width="100" show-overflow-tooltip>
                              <template slot-scope="scope">
                                <span>{{ scope.row.creatorName || '—' }}</span>
                              </template>
                            </el-table-column>
                          </el-table>
                        </div>
                        <div v-show="showWarehousePurchaseBlock" class="wh-reminder-table-section wh-reminder-table-section--purchase">
                          <div class="wh-reminder-apply-toolbar">
                            <div class="wh-reminder-detail-section-title">待审核申购单</div>
                            <el-select
                              v-model="purchaseAuditStatusFilter"
                              size="small"
                              class="wh-reminder-status-filter"
                              placeholder="状态"
                            >
                              <el-option label="全部" value="all" />
                              <el-option label="待审核" value="pending" />
                              <el-option label="已审核" value="audited" />
                            </el-select>
                          </div>
                          <el-table
                            :data="filteredWarehousePurchaseRows"
                            border
                            stripe
                            size="small"
                            class="wh-reminder-detail-table"
                            max-height="320"
                            empty-text="暂无数据"
                          >
                            <el-table-column type="index" label="序号" width="58" align="center" />
                            <el-table-column label="申购单号" prop="purchaseBillNo" min-width="140" show-overflow-tooltip>
                              <template slot-scope="scope">
                                <span
                                  class="wh-reminder-bill-no-link"
                                  :title="'双击打开科室请购审核'"
                                  @dblclick.prevent="handlePurchaseBillNoDblClick(scope.row.purchaseBillNo)"
                                >{{ scope.row.purchaseBillNo }}</span>
                              </template>
                            </el-table-column>
                            <el-table-column label="状态" width="92" align="center">
                              <template slot-scope="scope">
                                <el-tag v-if="purchaseRowAuditedDone(scope.row)" type="success" size="small">已审核</el-tag>
                                <el-tag v-else type="info" size="small">待审核</el-tag>
                              </template>
                            </el-table-column>
                            <el-table-column label="制单时间" min-width="150" show-overflow-tooltip>
                              <template slot-scope="scope">
                                <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
                              </template>
                            </el-table-column>
                            <el-table-column label="科室" min-width="100" show-overflow-tooltip>
                              <template slot-scope="scope">
                                <span>{{ scope.row.departmentName || '—' }}</span>
                              </template>
                            </el-table-column>
                            <el-table-column label="金额" width="100" align="right" show-overflow-tooltip>
                              <template slot-scope="scope">
                                <span v-if="scope.row.totalAmount && parseFloat(scope.row.totalAmount) > 0">¥{{ formatReminderMoney(scope.row.totalAmount) }}</span>
                                <span v-else>—</span>
                              </template>
                            </el-table-column>
                            <el-table-column label="制单人" width="100" show-overflow-tooltip>
                              <template slot-scope="scope">
                                <span>{{ scope.row.creatorName || '—' }}</span>
                              </template>
                            </el-table-column>
                          </el-table>
                        </div>
                      </div>
                    </div>
                    <div
                      v-show="showWarehouseInventoryBlock"
                      v-loading="warehouseReminderLoading"
                      class="wh-reminder-near-expiry-wrap"
                    >
                      <p v-if="warehouseReminderError" class="wh-reminder-error wh-reminder-error--above-table">{{ warehouseReminderError }}</p>
                      <div class="wh-reminder-apply-toolbar">
                        <div class="wh-reminder-detail-section-title">库存预警（定数监测：库存低于下限或高于上限）</div>
                      </div>
                      <el-table
                        :data="inventoryAlertRows"
                        border
                        stripe
                        size="small"
                        class="wh-reminder-detail-table wh-reminder-near-expiry-table"
                        max-height="420"
                        empty-text="暂无库存预警"
                        @cell-dblclick="handleInventoryAlertCellDblClick"
                      >
                        <el-table-column type="index" label="序号" width="58" align="center" />
                        <el-table-column label="仓库" prop="warehouseName" min-width="100" show-overflow-tooltip />
                        <el-table-column label="耗材编码" prop="materialCode" min-width="110">
                          <template slot-scope="scope">
                            <span
                              class="wh-reminder-material-code-link"
                              :title="(scope.row.materialCode || scope.row.material_code || '') + '（双击打开库存预警）'"
                              @dblclick.stop="handleInventoryAlertMaterialCodeDblClick(scope.row)"
                            >{{ scope.row.materialCode || scope.row.material_code || '—' }}</span>
                          </template>
                        </el-table-column>
                        <el-table-column label="耗材名称" prop="materialName" min-width="140" show-overflow-tooltip />
                        <el-table-column label="规格" prop="materialSpeci" min-width="100" show-overflow-tooltip />
                        <el-table-column label="型号" prop="materialModel" min-width="100" show-overflow-tooltip />
                        <el-table-column label="当前库存" prop="currentQty" width="90" align="right" show-overflow-tooltip>
                          <template slot-scope="scope">
                            <span class="wh-reminder-inventory-qty-warn">{{ formatReminderInt(scope.row.currentQty) }}</span>
                          </template>
                        </el-table-column>
                        <el-table-column label="安全库存" prop="safetyStock" width="90" align="right" show-overflow-tooltip>
                          <template slot-scope="scope">
                            <span class="wh-reminder-inventory-qty-warn">{{ formatReminderInt(scope.row.safetyStock) }}</span>
                          </template>
                        </el-table-column>
                        <el-table-column label="单价" width="100" align="right" show-overflow-tooltip>
                          <template slot-scope="scope">
                            <span v-if="scope.row.unitPrice != null && scope.row.unitPrice !== ''">¥{{ formatReminderMoney(scope.row.unitPrice) }}</span>
                            <span v-else>—</span>
                          </template>
                        </el-table-column>
                        <el-table-column label="金额" width="100" align="right" show-overflow-tooltip>
                          <template slot-scope="scope">
                            <span v-if="scope.row.totalAmt != null && scope.row.totalAmt !== ''">¥{{ formatReminderMoney(scope.row.totalAmt) }}</span>
                            <span v-else>—</span>
                          </template>
                        </el-table-column>
                        <el-table-column label="生产日期" width="110" align="center" show-overflow-tooltip>
                          <template slot-scope="scope">
                            <span v-if="scope.row.produceDate">{{ parseTime(scope.row.produceDate, '{y}-{m}-{d}') }}</span>
                            <span v-else>—</span>
                          </template>
                        </el-table-column>
                        <el-table-column label="有效期" width="110" align="center" show-overflow-tooltip>
                          <template slot-scope="scope">
                            <span v-if="scope.row.expiryDate">{{ parseTime(scope.row.expiryDate, '{y}-{m}-{d}') }}</span>
                            <span v-else>—</span>
                          </template>
                        </el-table-column>
                        <el-table-column label="生产厂家" prop="factoryName" min-width="120" show-overflow-tooltip />
                      </el-table>
                    </div>
                    <div
                      v-show="showWarehouseNearExpiryBlock"
                      v-loading="warehouseReminderLoading"
                      class="wh-reminder-near-expiry-wrap"
                    >
                      <p v-if="warehouseReminderError" class="wh-reminder-error wh-reminder-error--above-table">{{ warehouseReminderError }}</p>
                      <div class="wh-reminder-apply-toolbar">
                        <div class="wh-reminder-detail-section-title">近效期库存（有效期距今天在 30 天及以内）</div>
                      </div>
                      <el-table
                        :data="nearExpiryInventoryRows"
                        border
                        stripe
                        size="small"
                        class="wh-reminder-detail-table wh-reminder-near-expiry-table"
                        max-height="420"
                        empty-text="暂无近效期库存"
                        @cell-dblclick="handleNearExpiryInventoryCellDblClick"
                      >
                        <el-table-column type="index" label="序号" width="58" align="center" />
                        <!-- 不用 show-overflow-tooltip：tooltip 包裹层会吞掉双击 -->
                        <el-table-column label="耗材编码" prop="materialCode" min-width="110">
                          <template slot-scope="scope">
                            <span
                              class="wh-reminder-material-code-link"
                              :title="(scope.row.materialCode || scope.row.material_code || '') + '（双击打开有效期预警表）'"
                              @dblclick.stop="handleNearExpiryMaterialCodeDblClick(scope.row)"
                            >{{ scope.row.materialCode || scope.row.material_code || '—' }}</span>
                          </template>
                        </el-table-column>
                        <el-table-column label="耗材名称" prop="materialName" min-width="140" show-overflow-tooltip />
                        <el-table-column label="规格" prop="materialSpeci" min-width="100" show-overflow-tooltip />
                        <el-table-column label="型号" prop="materialModel" min-width="100" show-overflow-tooltip />
                        <el-table-column label="数量" prop="qty" width="90" align="right" show-overflow-tooltip>
                          <template slot-scope="scope">
                            <span>{{ scope.row.qty != null ? Number(scope.row.qty).toFixed(2) : '—' }}</span>
                          </template>
                        </el-table-column>
                        <el-table-column label="单价" width="100" align="right" show-overflow-tooltip>
                          <template slot-scope="scope">
                            <span v-if="scope.row.unitPrice != null && scope.row.unitPrice !== ''">¥{{ formatReminderMoney(scope.row.unitPrice) }}</span>
                            <span v-else>—</span>
                          </template>
                        </el-table-column>
                        <el-table-column label="金额" width="100" align="right" show-overflow-tooltip>
                          <template slot-scope="scope">
                            <span v-if="scope.row.amt != null && scope.row.amt !== ''">¥{{ formatReminderMoney(scope.row.amt) }}</span>
                            <span v-else>—</span>
                          </template>
                        </el-table-column>
                        <el-table-column label="批号" prop="batchNumber" min-width="120" show-overflow-tooltip />
                        <el-table-column label="有效期" width="110" align="center" show-overflow-tooltip>
                          <template slot-scope="scope">
                            <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
                            <span v-else>—</span>
                          </template>
                        </el-table-column>
                        <el-table-column label="生产日期" width="110" align="center" show-overflow-tooltip>
                          <template slot-scope="scope">
                            <span v-if="scope.row.beginTime">{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
                            <span v-else>—</span>
                          </template>
                        </el-table-column>
                        <el-table-column label="生产厂家" prop="factoryName" min-width="120" show-overflow-tooltip />
                      </el-table>
                    </div>
                  </template>
                  <template v-if="messageReminderCategory === 'department'">
                    <nav class="wh-reminder-sub-tabs" aria-label="科室预警分类">
                      <div
                        v-for="t in departmentSubTabs"
                        :key="t.key"
                        :class="['wh-reminder-sub-tab', { active: departmentReminderSubTab === t.key }]"
                        role="button"
                        tabindex="0"
                        @click="selectDepartmentSubTab(t.key)"
                        @keyup.enter="selectDepartmentSubTab(t.key)"
                      >
                        <span>{{ t.label }}</span>
                        <span
                          v-if="departmentSubTabBadge(t.key)"
                          class="wh-reminder-sub-tab-badge"
                        >{{ departmentSubTabBadge(t.key) }}</span>
                      </div>
                    </nav>
                    <div
                      v-show="showDepartmentUnreceivedBlock"
                      v-loading="departmentUnreceivedLoading"
                      class="wh-reminder-panel-inner wh-reminder-bill-layout"
                    >
                      <div class="wh-reminder-bill-right">
                        <p v-if="departmentUnreceivedError" class="wh-reminder-error wh-reminder-error--above-table">{{ departmentUnreceivedError }}</p>
                        <div class="wh-reminder-table-section">
                          <div class="wh-reminder-apply-toolbar">
                            <div class="wh-reminder-detail-section-title">待确认收货出库单</div>
                          </div>
                          <el-table
                            :data="departmentUnreceivedRows"
                            border
                            stripe
                            size="small"
                            class="wh-reminder-detail-table"
                            max-height="320"
                            empty-text="暂无待确认收货出库单"
                          >
                            <el-table-column type="index" label="序号" width="58" align="center" />
                            <el-table-column label="出库单号" prop="billNo" min-width="140" show-overflow-tooltip>
                              <template slot-scope="scope">
                                <span
                                  class="wh-reminder-bill-no-link"
                                  :title="'双击打开科室收货确认'"
                                  @dblclick.prevent="handleDepartmentUnreceivedBillNoDblClick(scope.row.billNo)"
                                >{{ scope.row.billNo }}</span>
                              </template>
                            </el-table-column>
                            <el-table-column label="状态" width="92" align="center">
                              <template slot-scope="scope">
                                <el-tag v-if="scope.row.receiptConfirmStatus == 1" type="success" size="small">已确认</el-tag>
                                <el-tag v-else type="info" size="small">未确认</el-tag>
                              </template>
                            </el-table-column>
                            <el-table-column label="制单时间" min-width="150" show-overflow-tooltip>
                              <template slot-scope="scope">
                                <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
                                <span v-else>—</span>
                              </template>
                            </el-table-column>
                            <el-table-column label="科室" min-width="100" show-overflow-tooltip>
                              <template slot-scope="scope">
                                <span>{{ (scope.row.department && scope.row.department.name) || '—' }}</span>
                              </template>
                            </el-table-column>
                            <el-table-column label="金额" width="100" align="right" show-overflow-tooltip>
                              <template slot-scope="scope">
                                <span v-if="scope.row.totalAmount && parseFloat(scope.row.totalAmount) > 0">¥{{ formatReminderMoney(scope.row.totalAmount) }}</span>
                                <span v-else>—</span>
                              </template>
                            </el-table-column>
                            <el-table-column label="制单人" width="100" show-overflow-tooltip>
                              <template slot-scope="scope">
                                <span>{{ scope.row.createrName || (scope.row.creater && scope.row.creater.nickName) || (scope.row.creater && scope.row.creater.userName) || '—' }}</span>
                              </template>
                            </el-table-column>
                          </el-table>
                        </div>
                      </div>
                    </div>
                    <div
                      v-show="showDepartmentInventoryBlock"
                      class="wh-reminder-panel-inner wh-reminder-placeholder"
                    >
                      <p class="wh-reminder-line">科室库存预警请在科室库存、科室库存预警等相关业务菜单中查看与处理。</p>
                    </div>
                    <div
                      v-show="showDepartmentExpiryBlock"
                      v-loading="departmentExpiryLoading"
                      class="wh-reminder-near-expiry-wrap wh-reminder-near-expiry-wrap--full"
                    >
                      <p v-if="departmentExpiryError" class="wh-reminder-error wh-reminder-error--above-table">{{ departmentExpiryError }}</p>
                      <div class="wh-reminder-apply-toolbar">
                        <div class="wh-reminder-detail-section-title">科室批次近效期（有效期距今天在 30 天及以内）</div>
                      </div>
                      <el-table
                        :data="departmentExpiryRows"
                        border
                        stripe
                        size="small"
                        class="wh-reminder-detail-table wh-reminder-near-expiry-table"
                        max-height="420"
                        empty-text="暂无近效期科室库存"
                      >
                        <el-table-column type="index" label="序号" width="58" align="center" />
                        <el-table-column label="耗材编码" prop="materialCode" min-width="110">
                          <template slot-scope="scope">
                            <span
                              class="wh-reminder-material-code-link"
                              :title="(scope.row.materialCode || '') + '（双击打开科室库存近效期预警）'"
                              @dblclick.stop="handleDepartmentNearExpiryMaterialCodeDblClick(scope.row)"
                            >{{ scope.row.materialCode || '—' }}</span>
                          </template>
                        </el-table-column>
                        <el-table-column label="耗材名称" prop="materialName" min-width="140" show-overflow-tooltip />
                        <el-table-column label="规格" prop="materialSpeci" min-width="100" show-overflow-tooltip />
                        <el-table-column label="型号" prop="materialModel" min-width="100" show-overflow-tooltip />
                        <el-table-column label="单位" prop="unitName" width="72" align="center" show-overflow-tooltip />
                        <el-table-column label="数量" width="90" align="right" show-overflow-tooltip>
                          <template slot-scope="scope">
                            <span>{{ formatReminderInt(scope.row.qty) }}</span>
                          </template>
                        </el-table-column>
                        <el-table-column label="近效期天数" width="128" align="center" show-overflow-tooltip>
                          <template slot-scope="scope">
                            <span
                              v-if="departmentExpiryDaysIsNumeric(scope.row)"
                              class="wh-reminder-inventory-qty-warn"
                            >{{ scope.row.daysToExpiry }}</span>
                            <span v-else>—</span>
                          </template>
                        </el-table-column>
                        <el-table-column label="金额" width="100" align="right" show-overflow-tooltip>
                          <template slot-scope="scope">
                            <span v-if="scope.row.amt != null && scope.row.amt !== ''">¥{{ formatReminderMoney(scope.row.amt) }}</span>
                            <span v-else>—</span>
                          </template>
                        </el-table-column>
                        <el-table-column label="生产日期" width="110" align="center" show-overflow-tooltip>
                          <template slot-scope="scope">
                            <span v-if="scope.row.produceDate">{{ parseTime(scope.row.produceDate, '{y}-{m}-{d}') }}</span>
                            <span v-else>—</span>
                          </template>
                        </el-table-column>
                        <el-table-column label="有效期" width="110" align="center" show-overflow-tooltip>
                          <template slot-scope="scope">
                            <span v-if="scope.row.expiryDate">{{ parseTime(scope.row.expiryDate, '{y}-{m}-{d}') }}</span>
                            <span v-else>—</span>
                          </template>
                        </el-table-column>
                      </el-table>
                    </div>
                  </template>
                  <div
                    v-show="messageReminderCategory === 'data'"
                    class="wh-reminder-panel-inner wh-reminder-placeholder"
                  >
                    <p class="wh-reminder-line">数据异常预警内容请在相关业务菜单中查看与处理。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
    <transition name="fade-transform" mode="out-in">
      <keep-alive :include="cachedViews">
        <router-view v-if="!$route.meta.link" :key="key" />
      </keep-alive>
    </transition>
    <iframe-toggle />
  </section>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import iframeToggle from './IframeToggle/index'
import { fetchHomeWarehouseReminderCounts, fetchHomeWarehouseReminderApplyList, fetchHomeWarehouseReminderPurchaseList, fetchHomeWarehouseReminderNearExpiryList, fetchHomeWarehouseReminderInventoryAlertList, fetchHomeDepartmentReminderUnreceivedReceipt, fetchHomeDepartmentReminderNearExpiryList } from '@/api/dashboard/home'

export default {
  name: 'AppMain',
  components: { iframeToggle },
  data() {
    return {
      warehouseReminderLoading: false,
      warehouseReminder: { apply: 0, purchase: 0, nearExpiry: 0, inventoryAlert: 0 },
      warehouseReminderError: '',
      pendingApplyRows: [],
      pendingPurchaseRows: [],
      nearExpiryInventoryRows: [],
      inventoryAlertRows: [],
      /** 待出库申领单：all | pending | out，默认全部 */
      applyOutboundStatusFilter: 'all',
      /** 科室申购监控：all | pending | audited（与申领单筛选布局一致） */
      purchaseAuditStatusFilter: 'all',
      departmentUnreceivedLoading: false,
      departmentUnreceivedError: '',
      departmentUnreceivedRows: [],
      departmentUnreceivedBillCount: 0,
      departmentExpiryLoading: false,
      departmentExpiryError: '',
      departmentExpiryRows: [],
      departmentExpiryLineCount: 0
    }
  },
  computed: {
    reminderSideMenus() {
      return [
        { key: 'warehouse', label: '仓库预警' },
        { key: 'department', label: '科室预警' },
        { key: 'data', label: '数据异常预警' }
      ]
    },
    warehouseSubTabs() {
      return [
        { key: 'all', label: '全部' },
        { key: 'apply', label: '申领单预警' },
        { key: 'purchase', label: '申购单预警' },
        { key: 'inventory', label: '库存预警' },
        { key: 'nearExpiry', label: '库存近效期仓库预警' }
      ]
    },
    departmentSubTabs() {
      return [
        { key: 'all', label: '全部' },
        { key: 'unreceivedConfirm', label: '科室未收货确认预警' },
        { key: 'inventory', label: '科室库存预警' },
        { key: 'expiry', label: '科室有效期预警' }
      ]
    },
    showWarehouseApplyBlock() {
      return this.warehouseReminderSubTab === 'all' || this.warehouseReminderSubTab === 'apply'
    },
    showWarehousePurchaseBlock() {
      return this.warehouseReminderSubTab === 'all' || this.warehouseReminderSubTab === 'purchase'
    },
    showWarehouseInventoryBlock() {
      return this.warehouseReminderSubTab === 'inventory'
    },
    showWarehouseNearExpiryBlock() {
      return this.warehouseReminderSubTab === 'nearExpiry'
    },
    showWarehouseBillBlock() {
      return this.showWarehouseApplyBlock || this.showWarehousePurchaseBlock
    },
    filteredWarehouseApplyRows() {
      const rows = this.pendingApplyRows || []
      return rows.filter(row => {
        if (this.shouldHideStaleOutboundRow(row)) return false
        const done = this.applyRowOutboundDone(row)
        if (this.applyOutboundStatusFilter === 'pending') return !done
        if (this.applyOutboundStatusFilter === 'out') return done
        return true
      })
    },
    filteredWarehousePurchaseRows() {
      const rows = this.pendingPurchaseRows || []
      return rows.filter(row => {
        if (this.shouldHideStalePurchaseAuditRow(row)) return false
        const done = this.purchaseRowAuditedDone(row)
        if (this.purchaseAuditStatusFilter === 'pending') return !done
        if (this.purchaseAuditStatusFilter === 'audited') return done
        return true
      })
    },
    showDepartmentUnreceivedBlock() {
      return this.departmentReminderSubTab === 'all' || this.departmentReminderSubTab === 'unreceivedConfirm'
    },
    showDepartmentInventoryBlock() {
      return this.departmentReminderSubTab === 'all' || this.departmentReminderSubTab === 'inventory'
    },
    showDepartmentExpiryBlock() {
      return this.departmentReminderSubTab === 'all' || this.departmentReminderSubTab === 'expiry'
    },
    ...mapState({
      warehouseReminderVisible: state => state.app.warehouseReminderVisible,
      messageReminderCategory: state => state.app.messageReminderCategory,
      warehouseReminderSubTab: state => state.app.warehouseReminderSubTab,
      departmentReminderSubTab: state => state.app.departmentReminderSubTab
    }),
    ...mapGetters(['sidebarRouters']),
    cachedViews() {
      return this.$store.state.tagsView.cachedViews
    },
    key() {
      return this.$route.path
    }
  },
  watch: {
    $route(to, from) {
      if (!this.warehouseReminderVisible || !from || from.matched.length === 0) return
      if (to.path !== from.path) {
        this.closeWarehouseReminder()
      }
    },
    warehouseReminderVisible(val) {
      if (val && this.messageReminderCategory === 'warehouse' && (this.showWarehouseBillBlock || this.showWarehouseNearExpiryBlock || this.showWarehouseInventoryBlock)) {
        this.loadWarehouseReminderCounts()
      }
      if (val && this.messageReminderCategory === 'department') {
        if (this.showDepartmentUnreceivedBlock) this.loadDepartmentReminderUnreceived()
        if (this.showDepartmentExpiryBlock) this.loadDepartmentReminderNearExpiry()
      }
    },
    messageReminderCategory(val) {
      if (this.warehouseReminderVisible && val === 'warehouse' && (this.showWarehouseBillBlock || this.showWarehouseNearExpiryBlock || this.showWarehouseInventoryBlock)) {
        this.loadWarehouseReminderCounts()
      }
      if (this.warehouseReminderVisible && val === 'department') {
        if (this.showDepartmentUnreceivedBlock) this.loadDepartmentReminderUnreceived()
        if (this.showDepartmentExpiryBlock) this.loadDepartmentReminderNearExpiry()
      }
    },
    warehouseReminderSubTab() {
      if (this.warehouseReminderVisible && this.messageReminderCategory === 'warehouse' && (this.showWarehouseBillBlock || this.showWarehouseNearExpiryBlock || this.showWarehouseInventoryBlock)) {
        this.loadWarehouseReminderCounts()
      }
    },
    departmentReminderSubTab() {
      if (this.warehouseReminderVisible && this.messageReminderCategory === 'department') {
        if (this.showDepartmentUnreceivedBlock) this.loadDepartmentReminderUnreceived()
        if (this.showDepartmentExpiryBlock) this.loadDepartmentReminderNearExpiry()
      }
    }
  },
  methods: {
    departmentSubTabBadge(key) {
      const u = Number(this.departmentUnreceivedBillCount) || 0
      const e = Number(this.departmentExpiryLineCount) || 0
      if (key === 'unreceivedConfirm' && u > 0) {
        return u
      }
      if (key === 'expiry' && e > 0) {
        return e
      }
      if (key === 'all' && u + e > 0) {
        return u + e
      }
      return 0
    },
    warehouseSubTabBadge(key) {
      if (key === 'apply' && this.warehouseReminder.apply > 0) {
        return this.warehouseReminder.apply
      }
      if (key === 'purchase' && this.warehouseReminder.purchase > 0) {
        return this.warehouseReminder.purchase
      }
      const ne = Number(this.warehouseReminder.nearExpiry) || 0
      if (key === 'nearExpiry' && ne > 0) {
        return ne
      }
      const ia = Number(this.warehouseReminder.inventoryAlert) || 0
      if (key === 'inventory' && ia > 0) {
        return ia
      }
      const sumAll = (this.warehouseReminder.apply || 0) + (this.warehouseReminder.purchase || 0) + ne + ia
      if (key === 'all' && sumAll > 0) {
        return sumAll
      }
      return 0
    },
    selectReminderCategory(key) {
      this.$store.commit('app/SET_MESSAGE_REMINDER_CATEGORY', key)
      if (key === 'warehouse') {
        this.$store.commit('app/SET_WAREHOUSE_REMINDER_SUB_TAB', 'all')
        this.loadWarehouseReminderCounts()
      } else if (key === 'department') {
        this.$store.commit('app/SET_DEPARTMENT_REMINDER_SUB_TAB', 'all')
      }
    },
    selectDepartmentSubTab(key) {
      this.$store.commit('app/SET_DEPARTMENT_REMINDER_SUB_TAB', key)
    },
    selectWarehouseSubTab(key) {
      this.$store.commit('app/SET_WAREHOUSE_REMINDER_SUB_TAB', key)
      if (key === 'all' || key === 'apply' || key === 'purchase' || key === 'nearExpiry' || key === 'inventory') {
        this.loadWarehouseReminderCounts()
      }
    },
    closeWarehouseReminder() {
      this.$store.dispatch('app/closeWarehouseReminder')
    },
    joinSidebarRoutePath(base, segment) {
      const s = segment != null ? String(segment).trim() : ''
      if (!s || s === '/') return base || '/'
      if (s.startsWith('/')) return s.replace(/\/+/g, '/')
      const b = (base || '').replace(/\/$/, '')
      if (!b || b === '/') return `/${s}`.replace(/\/+/g, '/')
      return `${b}/${s}`.replace(/\/+/g, '/')
    },
    findSidebarPathByMetaTitle(routes, title, parentPath) {
      for (const route of routes || []) {
        if (route.hidden) continue
        const nextPath = this.joinSidebarRoutePath(parentPath, route.path)
        if (route.meta && route.meta.title === title) {
          return nextPath.startsWith('/') ? nextPath : `/${nextPath}`
        }
        if (route.children && route.children.length) {
          const baseForChildren = nextPath === '/' ? '' : nextPath
          const hit = this.findSidebarPathByMetaTitle(route.children, title, baseForChildren)
          if (hit) return hit
        }
      }
      return ''
    },
    /** 同标题多菜单时收集全部路径（如「科室库存查询」可能对应库房侧与科室侧不同路由） */
    findSidebarPathsByMetaTitle(routes, title, parentPath) {
      const out = []
      for (const route of routes || []) {
        if (route.hidden) continue
        const nextPath = this.joinSidebarRoutePath(parentPath, route.path)
        if (route.meta && route.meta.title === title) {
          const p = nextPath.startsWith('/') ? nextPath : `/${nextPath}`
          out.push(String(p).replace(/\/+/g, '/'))
        }
        if (route.children && route.children.length) {
          const baseForChildren = nextPath === '/' ? '' : nextPath
          out.push(...this.findSidebarPathsByMetaTitle(route.children, title, baseForChildren))
        }
      }
      return out
    },
    resolveOutWarehouseApplyMenuPath() {
      const fromMenu = this.findSidebarPathByMetaTitle(this.sidebarRouters, '出库申请', '')
      return fromMenu || '/warehouse/outWarehouse/apply'
    },
    /** 科室收货确认（与侧栏菜单标题一致） */
    resolveReceiptConfirmMenuPath() {
      const fromMenu = this.findSidebarPathByMetaTitle(this.sidebarRouters, '收货确认', '')
      return fromMenu || '/department/receiptConfirm/index'
    },
    handleDepartmentUnreceivedBillNoDblClick(billNo) {
      if (!billNo) return
      const path = this.resolveReceiptConfirmMenuPath()
      this.closeWarehouseReminder()
      if (this.$tab && typeof this.$tab.openPage === 'function') {
        this.$tab.openPage('收货确认', path, { billNo: String(billNo) })
      } else {
        this.$router.push({ path, query: { billNo: String(billNo) } })
      }
    },
    /** 科室请购审核 / 科室申购审核 菜单路径（与后台菜单名称一致） */
    resolvePurchaseAuditMenuPath() {
      const titles = ['科室请购审核', '科室申购审核']
      for (let i = 0; i < titles.length; i++) {
        const p = this.findSidebarPathByMetaTitle(this.sidebarRouters, titles[i], '')
        if (p) return p
      }
      return '/department/dPurchaseAudit/index'
    },
    /** 库存查询（内含各库存 Tab），与侧栏菜单标题一致 */
    resolveExpiryAlertInventoryPath() {
      const fromMenu = this.findSidebarPathByMetaTitle(this.sidebarRouters, '库存查询', '')
      return fromMenu || '/warehouse/inventory/index'
    },
    /** 科室管理下「科室库存查询」（多 Tab 含近效期），与侧栏菜单标题一致；优先匹配路径含 depInventory 的菜单项 */
    resolveDepartmentDepInventoryQueryPath() {
      const paths = this.findSidebarPathsByMetaTitle(this.sidebarRouters, '科室库存查询', '') || []
      const depInv = paths.find((p) => String(p).includes('depInventory'))
      if (depInv) return depInv
      if (paths.length === 1) return paths[0]
      return '/department/depInventory/index'
    },
    handleInventoryAlertCellDblClick(row, column) {
      if (!column || column.property !== 'materialCode') return
      this.handleInventoryAlertMaterialCodeDblClick(row)
    },
    handleInventoryAlertMaterialCodeDblClick(row) {
      if (!row) return
      const raw = row.materialCode != null && row.materialCode !== '' ? row.materialCode : row.material_code
      if (raw == null || String(raw).trim() === '') return
      const materialName = String(raw).trim()
      if (!materialName) return
      const path = this.resolveExpiryAlertInventoryPath()
      this.closeWarehouseReminder()
      const query = { tab: 'alert', materialName, alertStatus: '1' }
      if (this.$tab && typeof this.$tab.openPage === 'function') {
        this.$tab.openPage('库存查询', path, query)
      } else {
        this.$router.push({ path, query })
      }
    },
    handleNearExpiryInventoryCellDblClick(row, column) {
      if (!column || column.property !== 'materialCode') return
      this.handleNearExpiryMaterialCodeDblClick(row)
    },
    handleNearExpiryMaterialCodeDblClick(row) {
      if (!row) return
      const raw = row.materialCode != null && row.materialCode !== '' ? row.materialCode : row.material_code
      if (raw == null || String(raw).trim() === '') return
      const materialName = String(raw).trim()
      if (!materialName) return
      const path = this.resolveExpiryAlertInventoryPath()
      this.closeWarehouseReminder()
      const query = { tab: 'expiry', materialName, daysToExpiry: '30' }
      if (this.$tab && typeof this.$tab.openPage === 'function') {
        this.$tab.openPage('库存查询', path, query)
      } else {
        this.$router.push({ path, query })
      }
    },
    /** 科室预警-科室有效期预警：跳转科室库存查询「科室库存近效期预警」Tab，勿复用库房有效期预警表 */
    handleDepartmentNearExpiryMaterialCodeDblClick(row) {
      if (!row) return
      const raw = row.materialCode != null && row.materialCode !== '' ? row.materialCode : row.material_code
      if (raw == null || String(raw).trim() === '') return
      const materialKeyword = String(raw).trim()
      if (!materialKeyword) return
      const path = this.resolveDepartmentDepInventoryQueryPath()
      this.closeWarehouseReminder()
      const query = { tab: 'nearExpiry', materialKeyword }
      if (this.$tab && typeof this.$tab.openPage === 'function') {
        this.$tab.openPage('科室库存查询', path, query)
      } else {
        this.$router.push({ path, query })
      }
    },
    handlePurchaseBillNoDblClick(purchaseBillNo) {
      if (!purchaseBillNo) return
      const path = this.resolvePurchaseAuditMenuPath()
      this.closeWarehouseReminder()
      if (this.$tab && typeof this.$tab.openPage === 'function') {
        this.$tab.openPage('科室请购审核', path, { purchaseBillNo: String(purchaseBillNo) })
      } else {
        this.$router.push({ path, query: { purchaseBillNo: String(purchaseBillNo) } })
      }
    },
    handleDeptApplyBillNoDblClick(applyBillNo) {
      if (!applyBillNo) return
      const path = this.resolveOutWarehouseApplyMenuPath()
      this.closeWarehouseReminder()
      if (this.$tab && typeof this.$tab.openPage === 'function') {
        this.$tab.openPage('出库申请', path, { refBillNo: String(applyBillNo) })
      } else {
        this.$router.push({ path, query: { refBillNo: String(applyBillNo) } })
      }
    },
    formatReminderMoney(v) {
      const n = parseFloat(v)
      if (!Number.isFinite(n)) return '0.00'
      return n.toFixed(2)
    },
    formatReminderInt(v) {
      if (v === null || v === undefined || v === '') return '—'
      const n = Math.round(Number(v))
      return Number.isFinite(n) ? String(n) : '—'
    },
    /** 存在关联且已审核完成的出库单（以出库审核时间为准） */
    applyRowOutboundDone(row) {
      return !!(row && row.lastOutboundAuditDate)
    },
    /** 已出库满 24 小时不再展示（任意筛选下均隐藏） */
    shouldHideStaleOutboundRow(row) {
      if (!this.applyRowOutboundDone(row)) return false
      const t = new Date(row.lastOutboundAuditDate).getTime()
      if (!Number.isFinite(t)) return false
      return Date.now() - t >= 86400000
    },
    /** 已审核（存在 lastPurchaseAuditDate） */
    purchaseRowAuditedDone(row) {
      return !!(row && row.lastPurchaseAuditDate)
    },
    /** 已审核满 24 小时不再展示（与申领单已出库规则一致） */
    shouldHideStalePurchaseAuditRow(row) {
      if (!this.purchaseRowAuditedDone(row)) return false
      const t = new Date(row.lastPurchaseAuditDate).getTime()
      if (!Number.isFinite(t)) return false
      return Date.now() - t >= 86400000
    },
    async loadWarehouseReminderDetails() {
      if (this.showWarehouseBillBlock) {
        if (this.showWarehouseApplyBlock) {
          this.applyOutboundStatusFilter = 'all'
          try {
            const res = await fetchHomeWarehouseReminderApplyList()
            const raw = res && res.data
            this.pendingApplyRows = Array.isArray(raw) ? raw : []
          } catch (e) {
            this.pendingApplyRows = []
          }
        } else {
          this.pendingApplyRows = []
        }
        if (this.showWarehousePurchaseBlock) {
          this.purchaseAuditStatusFilter = 'all'
          try {
            const res = await fetchHomeWarehouseReminderPurchaseList()
            const raw = res && res.data
            this.pendingPurchaseRows = Array.isArray(raw) ? raw : []
          } catch (e) {
            this.pendingPurchaseRows = []
          }
        } else {
          this.pendingPurchaseRows = []
        }
      } else {
        this.pendingApplyRows = []
        this.pendingPurchaseRows = []
      }
      if (this.showWarehouseNearExpiryBlock) {
        try {
          const res = await fetchHomeWarehouseReminderNearExpiryList()
          const raw = res && res.data
          this.nearExpiryInventoryRows = Array.isArray(raw) ? raw : []
        } catch (e) {
          this.nearExpiryInventoryRows = []
        }
      } else {
        this.nearExpiryInventoryRows = []
      }
      if (this.showWarehouseInventoryBlock) {
        try {
          const res = await fetchHomeWarehouseReminderInventoryAlertList()
          const raw = res && res.data
          this.inventoryAlertRows = Array.isArray(raw) ? raw : []
        } catch (e) {
          this.inventoryAlertRows = []
        }
      } else {
        this.inventoryAlertRows = []
      }
    },
    async loadDepartmentReminderUnreceived() {
      if (!this.warehouseReminderVisible || this.messageReminderCategory !== 'department' || !this.showDepartmentUnreceivedBlock) {
        return
      }
      this.departmentUnreceivedLoading = true
      this.departmentUnreceivedError = ''
      try {
        const res = await fetchHomeDepartmentReminderUnreceivedReceipt()
        const d = (res && res.data) || {}
        this.departmentUnreceivedBillCount = Number(d.billCount) || 0
        const raw = d.bills
        this.departmentUnreceivedRows = Array.isArray(raw) ? raw : []
      } catch (e) {
        this.departmentUnreceivedBillCount = 0
        this.departmentUnreceivedRows = []
        this.departmentUnreceivedError = (e && e.message) ? String(e.message) : '加载失败，请稍后重试'
      } finally {
        this.departmentUnreceivedLoading = false
      }
    },
    departmentExpiryDaysIsNumeric(row) {
      const v = row && row.daysToExpiry
      return v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v))
    },
    async loadDepartmentReminderNearExpiry() {
      if (!this.warehouseReminderVisible || this.messageReminderCategory !== 'department' || !this.showDepartmentExpiryBlock) {
        return
      }
      this.departmentExpiryLoading = true
      this.departmentExpiryError = ''
      try {
        const res = await fetchHomeDepartmentReminderNearExpiryList()
        const d = (res && res.data) || {}
        this.departmentExpiryLineCount = Number(d.lineCount) || 0
        const raw = d.lines
        this.departmentExpiryRows = Array.isArray(raw) ? raw : []
      } catch (e) {
        this.departmentExpiryLineCount = 0
        this.departmentExpiryRows = []
        this.departmentExpiryError = (e && e.message) ? String(e.message) : '加载失败，请稍后重试'
      } finally {
        this.departmentExpiryLoading = false
      }
    },
    async loadWarehouseReminderCounts() {
      this.warehouseReminderLoading = true
      this.warehouseReminderError = ''
      try {
        const res = await fetchHomeWarehouseReminderCounts()
        const d = (res && res.data) || {}
        this.warehouseReminder = {
          apply: Number(d.pendingApplyBillCount) || 0,
          purchase: Number(d.pendingPurchaseBillCount) || 0,
          nearExpiry: Number(d.nearExpiryInventoryLineCount) || 0,
          inventoryAlert: Number(d.inventoryAlertLineCount) || 0
        }
        await this.loadWarehouseReminderDetails()
      } catch (e) {
        this.warehouseReminder = { apply: 0, purchase: 0, nearExpiry: 0, inventoryAlert: 0 }
        this.pendingApplyRows = []
        this.pendingPurchaseRows = []
        this.nearExpiryInventoryRows = []
        this.inventoryAlertRows = []
        this.warehouseReminderError = (e && e.message) ? String(e.message) : '加载失败，请稍后重试'
      } finally {
        this.warehouseReminderLoading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.app-main {
  min-height: calc(100vh - 50px);
  width: 100%;
  position: relative;
  overflow: hidden;
}

.fixed-header + .app-main {
  padding-top: 50px;
}

.hasTagsView {
  .app-main {
    min-height: calc(100vh - 84px);
  }

  .fixed-header + .app-main {
    padding-top: 84px;
  }
}

.wh-reminder-local-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.wh-reminder-local-content {
  background: #fff;
  width: 100%;
  height: 100%;
  min-height: 95vh;
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding-bottom: 16px;
  box-sizing: border-box;
}

.wh-reminder-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 20px;
  border-bottom: 1px solid #ebeef5;
  background: #ebeef5;
  min-height: 40px;
  flex-shrink: 0;
}

.wh-reminder-modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.wh-reminder-close-btn {
  border: none;
  background: transparent;
}

.wh-reminder-close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.wh-reminder-modal-body {
  flex: 1;
  padding: 0;
  background: #fff;
  box-sizing: border-box;
  overflow: hidden;
}

.wh-reminder-body-layout {
  display: flex;
  align-items: stretch;
  min-height: 0;
  height: 100%;
}

.wh-reminder-aside {
  flex: 0 0 200px;
  width: 200px;
  background: #fff;
  border-right: 1px solid #ebeef5;
  box-sizing: border-box;
}

.wh-reminder-side-menu {
  padding: 8px 0 16px;
  user-select: none;
}

.wh-reminder-side-item {
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.5;
  color: #303133;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.wh-reminder-side-item:hover {
  color: #409eff;
  background: #f5f7fa;
}

.wh-reminder-side-item.active {
  color: #409eff;
  font-weight: 500;
  background: #ecf5ff;
}

.wh-reminder-panel {
  flex: 1;
  min-width: 0;
  min-height: 120px;
  padding: 16px 20px;
  box-sizing: border-box;
}

.wh-reminder-sub-tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 0;
  margin: 0 0 20px;
  padding: 0;
  border-bottom: 1px solid #ebeef5;
  user-select: none;
}

.wh-reminder-sub-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  font-size: 14px;
  line-height: 1.5;
  color: #606266;
  cursor: pointer;
  transition: color 0.2s;
}

.wh-reminder-sub-tab:hover {
  color: #409eff;
}

.wh-reminder-sub-tab.active {
  color: #409eff;
  font-weight: 500;
}

.wh-reminder-sub-tab.active::after {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: -1px;
  height: 2px;
  background: #409eff;
}

.wh-reminder-sub-tab-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #f56c6c;
  color: #fff;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
  box-sizing: border-box;
}

.wh-reminder-panel-inner {
  max-width: 720px;
}

.wh-reminder-bill-layout {
  width: 100%;
  min-height: 120px;
}

.wh-reminder-bill-right {
  width: 100%;
  min-width: 0;
}

/* 「全部」Tab 下申领与申购两块上下排列时间距 */
.wh-reminder-table-section--purchase {
  margin-top: 20px;
}

.wh-reminder-error--above-table {
  margin-bottom: 12px;
}

.wh-reminder-detail-section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.wh-reminder-apply-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.wh-reminder-status-filter {
  width: 120px;
}

.wh-reminder-bill-no-link {
  cursor: pointer;
  color: #409eff;
  user-select: none;
}

/* 近效期表：覆盖 .el-table .cell 默认色，避免编码不像链接 */
.wh-reminder-near-expiry-wrap ::v-deep .wh-reminder-material-code-link {
  color: #409eff !important;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  user-select: none;
}

.wh-reminder-near-expiry-wrap ::v-deep .wh-reminder-material-code-link:hover {
  color: #66b1ff !important;
}

.wh-reminder-inventory-qty-warn {
  color: #f56c6c !important;
  font-weight: 600;
}

.wh-reminder-detail-table {
  width: 100%;
}

/* 与仓库侧近效期/库存预警一致：不占 720px 窄版，铺满右侧内容区，减少表内横向滚动 */
.wh-reminder-near-expiry-wrap--full {
  width: 100%;
  max-width: none;
  box-sizing: border-box;
}

.wh-reminder-placeholder .wh-reminder-line {
  color: #606266;
}

.wh-reminder-line {
  margin: 0 0 20px;
  font-size: 16px;
  color: #303133;
  line-height: 1.65;
}

.wh-reminder-label {
  color: #606266;
}

.wh-reminder-value {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
}

.wh-reminder-error {
  margin: 8px 0 0;
  font-size: 14px;
  color: #f56c6c;
}

.wh-modal-fade-enter-active,
.wh-modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.wh-modal-fade-enter,
.wh-modal-fade-leave-to {
  opacity: 0;
}

.wh-modal-zoom-enter-active,
.wh-modal-zoom-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-origin: center center;
}

.wh-modal-zoom-enter {
  opacity: 0;
  transform: scale(0.3) translateY(-50px);
}

.wh-modal-zoom-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>

<style lang="scss">
.el-popup-parent--hidden {
  .fixed-header {
    padding-right: 6px;
  }
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background-color: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background-color: #c0c0c0;
  border-radius: 3px;
}
</style>

<style lang="scss">
#app .main-container .app-main .wh-reminder-local-mask {
  left: -8px;
  right: -8px;
  width: auto;
}
</style>
