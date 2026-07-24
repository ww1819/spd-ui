<template>
  <div id="digital-twin" ref="appRef" class="twin-page">
    <div class="twin-bg">
      <dv-loading v-show="loading">Loading...</dv-loading>
      <div class="twin-body" v-show="!loading">
        <!-- 顶栏 -->
        <div class="twin-header">
          <div class="hdr-left">
            <dv-decoration-8 class="deco" :color="['#1a8cff', '#00c6d8']" />
            <el-select
              v-model="warehouseId"
              clearable
              filterable
              placeholder="全部仓库"
              size="small"
              class="wh-select"
              @change="reloadAll"
            >
              <el-option
                v-for="w in warehouseOptions"
                :key="w.id"
                :label="w.name"
                :value="w.id"
              />
            </el-select>
          </div>
          <div class="hdr-center">
            <div class="title">数字孪生监控大屏</div>
            <dv-decoration-5 class="deco-c" :color="['#1a8cff', '#00c6d8']" />
          </div>
          <div class="hdr-right">
            <span class="clock">{{ clockText }}</span>
            <el-button size="mini" icon="el-icon-refresh" class="hdr-btn" @click="reloadAll">刷新</el-button>
            <el-button size="mini" icon="el-icon-full-screen" class="hdr-btn" @click="toggleFullscreen">
              {{ isFullscreen ? '退出全屏' : '全屏' }}
            </el-button>
            <dv-decoration-8 class="deco" :reverse="true" :color="['#1a8cff', '#00c6d8']" />
          </div>
        </div>

        <!-- KPI -->
        <div class="kpi-row">
          <div class="kpi-card" v-for="k in kpiCards" :key="k.key">
            <div class="kpi-label">{{ k.label }}</div>
            <div class="kpi-value" :class="k.tone">{{ k.value }}</div>
            <div class="kpi-unit">{{ k.unit }}</div>
          </div>
        </div>

        <!-- 主体三栏 -->
        <div class="main-row">
          <!-- 左：出入库 -->
          <div class="side-col">
            <dv-border-box-12>
              <div class="panel">
                <div class="panel-title">今日出入库</div>
                <div class="io-stat">
                  <div class="io-item in">
                    <span>入库单</span>
                    <b>{{ overview.todayInboundBillCount || 0 }}</b>
                  </div>
                  <div class="io-item out">
                    <span>出库单</span>
                    <b>{{ overview.todayOutboundBillCount || 0 }}</b>
                  </div>
                </div>
                <div class="panel-sub">实时流水</div>
                <div class="scroll-list">
                  <div
                    v-for="(row, i) in ioList"
                    :key="'io' + i"
                    class="scroll-item"
                    :class="ioTone(row.billType)"
                  >
                    <div class="si-top">
                      <span class="tag">{{ row.billTypeName }}</span>
                      <span class="time">{{ row.billDate }}</span>
                    </div>
                    <div class="si-mid">{{ row.billNo }} · {{ row.warehouseName }}</div>
                    <div class="si-bot">数量 {{ fmtNum(row.totalQty) }} / 金额 ¥{{ fmtNum(row.totalAmt) }}</div>
                  </div>
                  <div v-if="!ioList.length" class="empty-tip">今日暂无已审核出入库单据</div>
                </div>
              </div>
            </dv-border-box-12>
          </div>

          <!-- 中：五区拟真立体货架 -->
          <div class="center-col">
            <dv-border-box-8 :reverse="true" :dur="8">
              <div class="panel center-panel">
                <div class="panel-title">
                  五区三色 · 库房数字孪生（立体货架）
                  <span class="scene-hint">拖拽旋转 · 滚轮缩放 · 点击货箱查看</span>
                </div>
                <div class="zone-legend">
                  <span v-for="z in zoneMeta" :key="z.type" class="zl" :style="{ borderColor: z.tint }">
                    <i :style="{ background: z.tint }" />{{ z.name }}
                  </span>
                  <span class="zl"><i class="c-green" />正常</span>
                  <span class="zl"><i class="c-yellow" />预警</span>
                  <span class="zl"><i class="c-red" />紧急</span>
                  <span class="zl"><i class="c-empty" />空位</span>
                </div>
                <div class="twin-scene twin-scene-3d">
                  <div ref="sceneRef" class="scene-canvas-host"></div>
                  <div v-if="sceneError" class="scene-error">{{ sceneError }}</div>
                  <div v-if="sceneLoading" class="scene-loading">正在加载立体货架引擎…</div>
                </div>
              </div>
            </dv-border-box-8>
          </div>

          <!-- 右：预警 -->
          <div class="side-col">
            <dv-border-box-12>
              <div class="panel">
                <div class="panel-title">库存预警 <em>{{ (alerts.inventoryAlerts || []).length }}</em></div>
                <div class="scroll-list half">
                  <div
                    v-for="(row, i) in alerts.inventoryAlerts"
                    :key="'ia' + i"
                    class="scroll-item alert"
                    @click="locateAlert(row)"
                  >
                    <div class="si-top">
                      <span class="tag red">库存</span>
                      <span class="time">{{ row.warehouseName }}</span>
                    </div>
                    <div class="si-mid">{{ row.materialName }}</div>
                    <div class="si-bot">现存量 {{ row.currentQty }} / 下限 {{ row.safetyStock }}</div>
                  </div>
                  <div v-if="!(alerts.inventoryAlerts || []).length" class="empty-tip">暂无库存预警</div>
                </div>
                <div class="panel-title mt">效期预警 <em>{{ (alerts.expiryAlerts || []).length }}</em></div>
                <div class="scroll-list half">
                  <div
                    v-for="(row, i) in alerts.expiryAlerts"
                    :key="'ea' + i"
                    class="scroll-item alert"
                    @click="locateAlert(row)"
                  >
                    <div class="si-top">
                      <span class="tag" :class="row.statusColor === 'red' ? 'red' : 'yellow'">效期</span>
                      <span class="time">剩余 {{ row.daysRemaining }} 天</span>
                    </div>
                    <div class="si-mid">{{ row.materialName }}</div>
                    <div class="si-bot">批次 {{ row.batchNo || '-' }} · 数量 {{ row.qty }}</div>
                  </div>
                  <div v-if="!(alerts.expiryAlerts || []).length" class="empty-tip">暂无效期预警</div>
                </div>
              </div>
            </dv-border-box-12>
          </div>
        </div>

        <!-- 五区占用率 -->
        <div class="foot-row">
          <div
            v-for="z in overview.zoneOccupancy || []"
            :key="'occ' + z.zoneType"
            class="occ-card"
          >
            <div class="occ-name">{{ z.zoneName }}</div>
            <div class="occ-bar">
              <div class="occ-fill" :style="{ width: (z.occupancyRate || 0) + '%' }" />
            </div>
            <div class="occ-val">{{ z.occupancyRate || 0 }}% · {{ z.occupiedCount }}/{{ z.slotCount }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 格口明细：全屏时不能挂到 body，否则弹层在全屏层外看不见 -->
    <el-dialog
      :title="detailTitle"
      :visible.sync="detailOpen"
      width="880px"
      :append-to-body="!isFullscreen"
      :modal-append-to-body="!isFullscreen"
      custom-class="twin-dialog"
      @close="onDetailClose"
    >
      <el-table :data="detailRows" size="mini" max-height="420" v-loading="detailLoading">
        <el-table-column label="编码" prop="materialCode" width="110" show-overflow-tooltip />
        <el-table-column label="名称" prop="materialName" min-width="140" show-overflow-tooltip />
        <el-table-column label="规格" prop="materialSpeci" width="100" show-overflow-tooltip />
        <el-table-column label="批次" prop="batchNo" width="100" show-overflow-tooltip />
        <el-table-column label="数量" prop="qty" width="80" align="right" />
        <el-table-column label="效期" width="110">
          <template slot-scope="scope">
            <span :class="{ danger: scope.row.daysRemaining != null && scope.row.daysRemaining < 0 }">
              {{ scope.row.expiryDate || '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="剩余天" prop="daysRemaining" width="80" align="center" />
        <el-table-column label="厂家" prop="factoryName" width="120" show-overflow-tooltip />
      </el-table>
      <div v-if="!detailRows.length && !detailLoading" class="empty-tip" style="padding: 24px">该货位暂无库存</div>
    </el-dialog>
  </div>
</template>

<script>
import { twinOverview, twinShelves, twinAlerts, twinIoRealtime, twinLocationDetail } from '@/api/datacenter/digitalTwin'
import { getOptionselect } from '@/api/foundation/warehouse'
import { ensureThree, createWarehouse3D } from './Warehouse3DScene'

const ZONE_META = [
  { type: 'PENDING_CHECK', name: '待验区', tint: '#5b8def' },
  { type: 'QUALIFIED', name: '合格区', tint: '#2ec4a5' },
  { type: 'UNQUALIFIED', name: '不合格区', tint: '#e4572e' },
  { type: 'RETURN', name: '退货区', tint: '#f0a202' },
  { type: 'PENDING_SHIP', name: '待发区', tint: '#9b5de5' }
]

export default {
  name: 'DigitalTwin',
  data() {
    return {
      loading: true,
      warehouseId: null,
      warehouseOptions: [],
      overview: {},
      zones: [],
      alerts: { inventoryAlerts: [], expiryAlerts: [] },
      ioList: [],
      zoneMeta: ZONE_META,
      clockText: '',
      clockTimer: null,
      idleTimer: null,
      idleMs: 15000,
      refreshing: false,
      isFullscreen: false,
      highlightId: null,
      highlightTimer: null,
      detailOpen: false,
      detailTitle: '',
      detailRows: [],
      detailLoading: false,
      sceneLoading: false,
      sceneError: '',
      warehouse3d: null
    }
  },
  computed: {
    kpiCards() {
      const o = this.overview || {}
      return [
        { key: 'qty', label: '库存总量', value: this.fmtNum(o.totalQty), unit: '件', tone: '' },
        { key: 'amt', label: '库存金额', value: this.fmtNum(o.totalAmt), unit: '元', tone: '' },
        { key: 'sku', label: '在库品规', value: o.materialSkuCount || 0, unit: '种', tone: '' },
        { key: 'in', label: '今日入库', value: o.todayInboundBillCount || 0, unit: '单', tone: 'tone-in' },
        { key: 'out', label: '今日出库', value: o.todayOutboundBillCount || 0, unit: '单', tone: 'tone-out' },
        { key: 'ia', label: '库存预警', value: o.inventoryAlertCount || 0, unit: '条', tone: 'tone-warn' },
        { key: 'ea', label: '效期预警', value: o.expiryAlertCount || 0, unit: '条', tone: 'tone-danger' }
      ]
    }
  },
  created() {
    this.tickClock()
    this.clockTimer = setInterval(this.tickClock, 1000)
    this.loadWarehouses().then(() => this.reloadAll())
  },
  mounted() {
    document.addEventListener('fullscreenchange', this.onFsChange)
    this.$nextTick(() => this.bindIdleListeners(true))
    this.initScene()
  },
  beforeDestroy() {
    clearInterval(this.clockTimer)
    clearTimeout(this.idleTimer)
    clearTimeout(this.highlightTimer)
    this.bindIdleListeners(false)
    document.removeEventListener('fullscreenchange', this.onFsChange)
    if (this.warehouse3d) {
      this.warehouse3d.dispose()
      this.warehouse3d = null
    }
  },
  methods: {
    bindIdleListeners(on) {
      const el = this.$refs.appRef || document
      const fn = on ? 'addEventListener' : 'removeEventListener'
      // 有操作就推迟自动刷新
      ;['pointerdown', 'wheel', 'keydown', 'touchstart'].forEach(evt => {
        el[fn](evt, this.markUserActivity, { passive: true, capture: true })
      })
      // 拖拽旋转会持续触发 mousemove
      el[fn]('mousemove', this.markUserActivityPassive, { passive: true, capture: true })
    },
    markUserActivity() {
      this.scheduleIdleRefresh()
    },
    markUserActivityPassive() {
      // 节流：拖拽时不必每次都清 timeout，但要重置空闲计时
      if (this._idleMoveStamp && Date.now() - this._idleMoveStamp < 400) return
      this._idleMoveStamp = Date.now()
      this.scheduleIdleRefresh()
    },
    scheduleIdleRefresh() {
      clearTimeout(this.idleTimer)
      // 弹窗打开或正在加载时不刷
      this.idleTimer = setTimeout(() => {
        if (this.detailOpen || this.loading || this.refreshing) {
          this.scheduleIdleRefresh()
          return
        }
        this.silentRefresh()
      }, this.idleMs)
    },
    silentRefresh() {
      if (this.refreshing || this.detailOpen) {
        this.scheduleIdleRefresh()
        return
      }
      this.refreshing = true
      const q = this.query()
      Promise.all([
        twinOverview(q),
        twinShelves(q),
        twinAlerts(q),
        twinIoRealtime({ ...q, limit: 40 })
      ]).then(([ov, sh, al, io]) => {
        // 刷新完成前若用户又开始操作，仍更新数据但不抢焦点
        this.overview = (ov && ov.data) || {}
        this.zones = ((sh && sh.data && sh.data.zones) || [])
        this.alerts = (al && al.data) || { inventoryAlerts: [], expiryAlerts: [] }
        this.ioList = (io && io.data) || []
        this.$nextTick(() => this.applyZonesToScene())
      }).catch(() => {}).finally(() => {
        this.refreshing = false
        this.scheduleIdleRefresh()
      })
    },
    fmtNum(v) {
      if (v == null || v === '') return '0'
      const n = Number(v)
      if (Number.isNaN(n)) return v
      return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
    },
    tickClock() {
      const d = new Date()
      const pad = n => (n < 10 ? '0' + n : '' + n)
      const weeks = ['日', '一', '二', '三', '四', '五', '六']
      this.clockText = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 星期${weeks[d.getDay()]} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    },
    query() {
      const q = {}
      if (this.warehouseId) q.warehouseId = this.warehouseId
      return q
    },
    loadWarehouses() {
      return getOptionselect().then(res => {
        this.warehouseOptions = res.data || res || []
        // 默认选中 SPD库，立体货架效果更直观
        if (!this.warehouseId && this.warehouseOptions.length) {
          const spd = this.warehouseOptions.find(w => w.name && String(w.name).indexOf('SPD') >= 0)
          this.warehouseId = spd ? spd.id : this.warehouseOptions[0].id
        }
      }).catch(() => {
        this.warehouseOptions = []
      })
    },
    async initScene() {
      this.sceneLoading = true
      this.sceneError = ''
      try {
        await ensureThree()
        await this.$nextTick()
        const el = this.$refs.sceneRef
        if (!el) return
        if (this.warehouse3d) {
          this.warehouse3d.dispose()
          this.warehouse3d = null
        }
        this.warehouse3d = createWarehouse3D(el, (slot) => this.openSlot(slot))
        if (this.zones && this.zones.length) {
          this.warehouse3d.setZones(this.zones)
        }
      } catch (e) {
        this.sceneError = '立体货架加载失败：' + (e && e.message ? e.message : '请检查网络或 CDN')
      } finally {
        this.sceneLoading = false
      }
    },
    applyZonesToScene() {
      if (!this.warehouse3d) {
        this.initScene().then(() => {
          if (this.warehouse3d) this.warehouse3d.setZones(this.zones)
        })
        return
      }
      // setZones 内部会保留当前高亮，避免轮询叠加光圈
      this.warehouse3d.setZones(this.zones || [])
    },
    clearHighlight() {
      this.highlightId = null
      clearTimeout(this.highlightTimer)
      if (this.warehouse3d) {
        if (typeof this.warehouse3d.clearHighlights === 'function') {
          this.warehouse3d.clearHighlights()
        } else {
          this.warehouse3d.setHighlight(null)
        }
      }
    },
    onDetailClose() {
      this.clearHighlight()
      this.scheduleIdleRefresh()
    },
    reloadAll() {
      this.loading = true
      clearTimeout(this.idleTimer)
      const q = this.query()
      Promise.all([
        twinOverview(q),
        twinShelves(q),
        twinAlerts(q),
        twinIoRealtime({ ...q, limit: 40 })
      ]).then(([ov, sh, al, io]) => {
        this.overview = (ov && ov.data) || {}
        this.zones = ((sh && sh.data && sh.data.zones) || [])
        this.alerts = (al && al.data) || { inventoryAlerts: [], expiryAlerts: [] }
        this.ioList = (io && io.data) || []
        this.$nextTick(() => this.applyZonesToScene())
      }).finally(() => {
        this.loading = false
        this.scheduleIdleRefresh()
      })
    },
    ioTone(billType) {
      if (billType === 101 || billType === 301) return 'in'
      if (billType === 201 || billType === 401) return 'out'
      return ''
    },
    openSlot(slot) {
      if (!slot || !slot.locationId) return
      this.scheduleIdleRefresh()
      this.highlightId = slot.locationId
      if (this.warehouse3d) this.warehouse3d.setHighlight(slot.locationId)
      this.detailTitle = `${slot.locationName || slot.locationCode || '货位'}（${slot.zoneName || ''} · ${slot.statusColor || ''}）`
      this.detailOpen = true
      this.detailLoading = true
      this.detailRows = []
      twinLocationDetail({ locationId: slot.locationId, warehouseId: this.warehouseId || undefined })
        .then(res => {
          this.detailRows = (res && res.data) || []
        })
        .finally(() => { this.detailLoading = false })
    },
    locateAlert(row) {
      if (!row || !row.locationId) {
        this.$message.info('该预警未关联货位，请在耗材/定数中维护货位')
        return
      }
      this.scheduleIdleRefresh()
      this.highlightId = row.locationId
      clearTimeout(this.highlightTimer)
      this.highlightTimer = setTimeout(() => {
        this.clearHighlight()
      }, 8000)
      if (this.warehouse3d) this.warehouse3d.focusLocation(row.locationId)
      const slot = this.findSlot(row.locationId)
      if (slot) this.openSlot(slot)
    },
    findSlot(locationId) {
      for (const z of this.zones) {
        for (const s of (z.shelves || [])) {
          for (const slot of (s.slots || [])) {
            if (String(slot.locationId) === String(locationId)) return slot
          }
        }
      }
      return null
    },
    toggleFullscreen() {
      const el = this.$refs.appRef
      if (!document.fullscreenElement) {
        el && el.requestFullscreen && el.requestFullscreen()
      } else {
        document.exitFullscreen && document.exitFullscreen()
      }
    },
    onFsChange() {
      this.isFullscreen = !!document.fullscreenElement
      // 全屏切换时重建弹窗挂载点，避免仍挂在 body 上看不见
      if (this.detailOpen) {
        this.detailOpen = false
        this.$nextTick(() => {
          this.detailOpen = true
          if (this.warehouse3d) this.warehouse3d.resize()
        })
      } else {
        this.$nextTick(() => {
          if (this.warehouse3d) this.warehouse3d.resize()
        })
      }
      this.scheduleIdleRefresh()
    }
  }
}
</script>

<style lang="scss" scoped>
.twin-page {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  color: #d7e6ff;
  background: #04101f;
  position: relative;
}
.twin-bg {
  width: 100%;
  height: 100%;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(26, 140, 255, 0.18), transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(0, 198, 216, 0.12), transparent 45%),
    linear-gradient(180deg, #061528 0%, #04101f 55%, #030b16 100%);
}
.twin-body {
  height: 100%;
  padding: 8px 14px 12px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
.twin-header {
  display: flex;
  align-items: center;
  height: 64px;
  flex-shrink: 0;
}
.hdr-left, .hdr-right {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}
.hdr-right { justify-content: flex-end; }
.hdr-center {
  width: 42%;
  text-align: center;
}
.title {
  font-size: 28px;
  letter-spacing: 8px;
  font-weight: 700;
  color: #e8f4ff;
  text-shadow: 0 0 18px rgba(26, 140, 255, 0.45);
}
.deco { width: 120px; height: 28px; }
.deco-c { width: 70%; height: 28px; margin: 0 auto; }
.wh-select {
  width: 180px;
  ::v-deep .el-input__inner {
    background: rgba(8, 30, 55, 0.85);
    border-color: #1a5a8a;
    color: #d7e6ff;
  }
}
.clock { font-size: 13px; color: #8eb6d8; margin-right: 6px; }
.hdr-btn {
  background: rgba(26, 140, 255, 0.15) !important;
  border-color: #1a8cff !important;
  color: #cfe8ff !important;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin: 6px 0 10px;
  flex-shrink: 0;
}
.kpi-card {
  background: linear-gradient(180deg, rgba(18, 52, 88, 0.75), rgba(8, 24, 44, 0.9));
  border: 1px solid rgba(26, 140, 255, 0.28);
  border-radius: 4px;
  padding: 8px 10px;
  text-align: center;
}
.kpi-label { font-size: 12px; color: #8eb6d8; }
.kpi-value {
  font-size: 22px;
  font-weight: 700;
  color: #e8f4ff;
  line-height: 1.3;
  &.tone-in { color: #3ddea8; }
  &.tone-out { color: #5bb8ff; }
  &.tone-warn { color: #f0c14a; }
  &.tone-danger { color: #ff6b6b; }
}
.kpi-unit { font-size: 11px; color: #6f93b3; }

.main-row {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 22% 1fr 22%;
  gap: 10px;
}
.side-col, .center-col {
  min-height: 0;
  height: 100%;
}
.panel {
  height: 100%;
  padding: 12px 14px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.center-panel { padding-bottom: 8px; }
.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #cfe8ff;
  margin-bottom: 8px;
  letter-spacing: 1px;
  display: flex;
  align-items: baseline;
  gap: 12px;
  em {
    font-style: normal;
    color: #f0c14a;
    margin-left: 6px;
  }
  &.mt { margin-top: 10px; }
}
.scene-hint {
  font-size: 12px;
  font-weight: 400;
  color: #6f93b3;
  letter-spacing: 0;
}
.panel-sub {
  font-size: 12px;
  color: #7fa6c8;
  margin: 8px 0 6px;
}
.io-stat {
  display: flex;
  gap: 8px;
}
.io-item {
  flex: 1;
  background: rgba(10, 35, 60, 0.7);
  border: 1px solid rgba(26, 140, 255, 0.2);
  border-radius: 4px;
  padding: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  span { color: #8eb6d8; font-size: 12px; }
  b { font-size: 20px; }
  &.in b { color: #3ddea8; }
  &.out b { color: #5bb8ff; }
}
.scroll-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  &.half { flex: 1; max-height: 42%; }
}
.scroll-item {
  background: rgba(8, 28, 50, 0.65);
  border-left: 3px solid #1a8cff;
  padding: 7px 8px;
  margin-bottom: 6px;
  border-radius: 2px;
  &.in { border-left-color: #3ddea8; }
  &.out { border-left-color: #5bb8ff; }
  &.alert { cursor: pointer; border-left-color: #f0c14a; }
  &.alert:hover { background: rgba(26, 140, 255, 0.12); }
}
.si-top { display: flex; justify-content: space-between; font-size: 12px; }
.si-mid { font-size: 13px; color: #e8f4ff; margin: 3px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.si-bot { font-size: 11px; color: #7fa6c8; }
.tag {
  background: rgba(26, 140, 255, 0.25);
  color: #9fd0ff;
  padding: 0 6px;
  border-radius: 2px;
  &.red { background: rgba(255, 80, 80, 0.25); color: #ff9a9a; }
  &.yellow { background: rgba(240, 193, 74, 0.25); color: #f0c14a; }
}
.time { color: #6f93b3; }
.empty-tip { color: #6f93b3; font-size: 12px; text-align: center; padding: 16px 0; }

.zone-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 6px;
  font-size: 12px;
  color: #9fc0de;
  .zl { display: inline-flex; align-items: center; gap: 4px; border: 1px solid transparent; padding: 0 4px; border-radius: 2px; }
  i {
    width: 10px; height: 10px; border-radius: 2px; display: inline-block;
    &.c-green { background: #2ec4a5; }
    &.c-yellow { background: #f0c14a; }
    &.c-red { background: #e4572e; }
    &.c-empty { background: #3a4f66; }
  }
}

.twin-scene {
  flex: 1;
  min-height: 360px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(26, 140, 255, 0.2);
  border-radius: 4px;
  background: #071422;
}
.twin-scene-3d {
  cursor: grab;
  .scene-canvas-host {
    position: absolute;
    inset: 0;
  }
  canvas {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }
  &:active { cursor: grabbing; }
}
.scene-error, .scene-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9fc0de;
  font-size: 13px;
  z-index: 2;
  pointer-events: none;
  background: rgba(4, 18, 34, 0.35);
}
.scene-error { color: #ff8a8a; }

.foot-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 8px;
  flex-shrink: 0;
}
.occ-card {
  background: rgba(10, 30, 52, 0.7);
  border: 1px solid rgba(26, 140, 255, 0.2);
  border-radius: 4px;
  padding: 6px 10px;
}
.occ-name { font-size: 12px; color: #9fc0de; }
.occ-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  margin: 4px 0;
  overflow: hidden;
}
.occ-fill {
  height: 100%;
  background: linear-gradient(90deg, #1a8cff, #2ec4a5);
  border-radius: 3px;
}
.occ-val { font-size: 11px; color: #6f93b3; }

.danger { color: #ff6b6b; }

@media (max-width: 1400px) {
  .kpi-row { grid-template-columns: repeat(4, 1fr); }
  .main-row { grid-template-columns: 24% 1fr 24%; }
  .title { font-size: 22px; letter-spacing: 4px; }
}
</style>

<style>
.twin-dialog {
  z-index: 4000 !important;
}
.twin-dialog .el-dialog {
  background: #0b1c30;
  border: 1px solid rgba(26, 140, 255, 0.35);
}
.twin-dialog .el-dialog__title { color: #d7e6ff; }
.twin-dialog .el-dialog__body { color: #cfe8ff; }
.twin-dialog .el-table {
  background: transparent;
  color: #d7e6ff;
}
.twin-dialog .el-table th,
.twin-dialog .el-table tr {
  background: rgba(8, 28, 50, 0.9) !important;
  color: #d7e6ff;
}
.twin-dialog .el-table td {
  border-bottom-color: rgba(26, 140, 255, 0.15) !important;
}
/* 全屏根节点内的弹窗必须盖住 3D canvas */
#digital-twin .el-dialog__wrapper {
  position: absolute !important;
  z-index: 5000 !important;
}
#digital-twin .v-modal {
  z-index: 4990 !important;
}
</style>
