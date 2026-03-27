<template>
  <div class="app-container smart-warehouse-board">
    <!-- 顶部：单行 — 左：仓库使用率 + 静态百分比；右：搜索 / 重置 -->
    <div class="form-fields-container">
      <div class="query-one-line">
        <div class="board-query-form-left">
          <div class="usage-stack">
            <div class="usage-label">仓库使用率</div>
            <div class="usage-rate-text">{{ warehouseUsageRate }}</div>
          </div>
        </div>
        <div class="query-actions-right">
          <el-button type="primary" icon="el-icon-search" size="medium" @click="handleQuery">搜索</el-button>
          <el-button icon="el-icon-refresh" size="medium" @click="resetQuery">重置</el-button>
        </div>
      </div>
    </div>

    <!-- 下区：左 | 中看板 | 右 -->
    <div class="board-lower-wrap">
      <el-row :gutter="12" type="flex" class="board-three-row">
        <el-col :xs="24" :sm="24" :md="4" :lg="4" class="board-col-side">
          <div class="side-box">
            <div class="box-title">货位列表</div>
            <div class="box-body placeholder-text">
              可放置货位、货位库存等列表（后续对接接口）
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="24" :md="16" :lg="16" class="board-col-center">
          <div class="center-board-box">
            <div class="box-title">看板</div>
            <div
              class="board-main-inner board-scene-wrap"
              ref="sceneViewport"
              @mousedown="onSceneMouseDown"
              @wheel.prevent="onSceneWheel"
            >
              <div class="scene-top-actions">
                <el-button size="mini" icon="el-icon-setting" circle @click="openLayoutDialog" />
                <el-button type="text" class="scene-edit-btn" @click="openLayoutDialog">编辑3D布局</el-button>
                <el-button size="mini" icon="el-icon-refresh" circle @click="refreshHtScene" />
              </div>
              <button v-show="showLegacy" class="scene-left-arrow" type="button" aria-label="prev">◀</button>

              <!-- 原有 CSS 3D 等元素已隐藏，以 HT 看板为主 -->
              <div v-show="false" class="scene-floor"></div>
              <div v-show="false" class="scene-glow"></div>
              <div class="warehouse-scene ht-scene">
                <div ref="htDrawingContainer" class="ht-drawing-canvas"></div>
                <div v-if="showTwinMetricsPanel" class="twin-stats-panel">
                  <div class="twin-title">数字孪生指标</div>
                  <div class="twin-grid">
                    <div class="twin-card">
                      <div class="twin-key">在线设备</div>
                      <div class="twin-val">{{ twinMetrics.onlineDevices }}</div>
                    </div>
                    <div class="twin-card">
                      <div class="twin-key">库位使用率</div>
                      <div class="twin-val">{{ twinMetrics.slotUsageRate }}%</div>
                    </div>
                    <div class="twin-card">
                      <div class="twin-key">每小时吞吐</div>
                      <div class="twin-val">{{ twinMetrics.hourlyThroughput }}</div>
                    </div>
                    <div class="twin-card">
                      <div class="twin-key">异常告警</div>
                      <div class="twin-val">{{ twinMetrics.alertCount }}</div>
                    </div>
                  </div>
                  <div class="twin-foot">{{ twinMetrics.lastSyncTime }}</div>
                </div>
              </div>
              <!-- 原有 CSS 3D 货架场景已隐藏 -->
              <div v-show="showLegacy" class="warehouse-scene legacy-rack-scene">
                <div class="scene-stage" :style="sceneTransformStyle" :class="{ dragging: isDragging }">
                  <div class="rack-row rack-row-back">
                    <div class="rack-block rack-block-back" v-for="(rack, i) in rackBackLabels" :key="'b'+i" :style="rack3dStyle(i, true)">
                      <div class="rack-sign"><span class="sign-dot"></span>{{ rack }}</div>
                      <div class="rack-3d">
                        <div class="rack-face rack-front">
                          <span class="rack-post post-l"></span>
                          <span class="rack-post post-r"></span>
                          <div class="rack-shelf" v-for="s in 4" :key="'bs'+s">
                            <span class="box box-blue"><i></i></span>
                            <span class="box box-red"><i></i></span>
                            <span class="box box-yellow"><i></i></span>
                            <span class="box box-blue"><i></i></span>
                          </div>
                        </div>
                        <div class="rack-face rack-right-face">
                          <div class="rack-shelf side" v-for="s in 4" :key="'br' + s">
                            <span class="box box-blue"><i></i></span>
                            <span class="box box-yellow"><i></i></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="rack-row rack-row-front">
                    <div class="rack-block rack-block-front" v-for="(rack, i) in rackFrontLabels" :key="'f'+i" :style="rack3dStyle(i, false)">
                      <div class="rack-sign"><span class="sign-dot"></span>{{ rack }}</div>
                      <div class="rack-3d">
                        <div class="rack-face rack-front">
                          <span class="rack-post post-l"></span>
                          <span class="rack-post post-r"></span>
                          <div class="rack-shelf" :class="{ warm: i === 2 }" v-for="s in 4" :key="'fs'+s">
                            <span class="box box-blue"><i></i></span>
                            <span class="box box-red"><i></i></span>
                            <span class="box box-yellow"><i></i></span>
                            <span class="box box-blue"><i></i></span>
                          </div>
                        </div>
                        <div class="rack-face rack-right-face">
                          <div class="rack-shelf side" v-for="s in 4" :key="'fr' + s">
                            <span class="box box-blue"><i></i></span>
                            <span class="box box-yellow"><i></i></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="!htReady" class="ht-tip">
                {{ htErrorMsg || 'HT for Web 未加载，接入后将自动启用 HT Drawing 交互。' }}
              </div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="24" :md="4" :lg="4" class="board-col-side">
          <div class="side-box">
            <div class="box-title">右侧框</div>
            <div class="box-body placeholder-text">
              可放置公告、动态、排行榜等
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-dialog
      title="编辑3D布局"
      :visible.sync="layoutDialogVisible"
      width="520px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form ref="layoutFormRef" :model="layoutForm" :rules="layoutFormRules" label-width="110px" size="small">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="仓库名称" prop="warehouseName">
              <el-input v-model.trim="layoutForm.warehouseName" placeholder="请输入仓库名称" maxlength="30" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="仓库区域" prop="areaName">
              <el-input v-model.trim="layoutForm.areaName" placeholder="请输入区域名称" maxlength="30" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="仓库长度(m)" prop="warehouseLength">
              <el-input-number v-model="layoutForm.warehouseLength" :min="1" :max="10000" :precision="2" :step="0.5" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="仓库宽度(m)" prop="warehouseWidth">
              <el-input-number v-model="layoutForm.warehouseWidth" :min="1" :max="10000" :precision="2" :step="0.5" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="区域长度(m)" prop="areaLength">
              <el-input-number v-model="layoutForm.areaLength" :min="1" :max="10000" :precision="2" :step="0.5" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="区域宽度(m)" prop="areaWidth">
              <el-input-number v-model="layoutForm.areaWidth" :min="1" :max="10000" :precision="2" :step="0.5" controls-position="right" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="layoutDialogVisible = false">取 消</el-button>
        <el-button type="primary" size="small" @click="submitLayoutForm">保 存</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'SmartWarehouseBoard',
  data() {
    return {
      /** 暂无接口数据时固定展示；接入接口后由接口赋值 */
      warehouseUsageRate: '0.00%',
      rackLabels: ['QM3(9/9)', 'WS'],
      layoutDialogVisible: false,
      showLegacy: false,
      htReady: false,
      htAssetsLoaded: false,
      htLoading: false,
      htErrorMsg: '',
      showTwinMetricsPanel: false,
      twinTimer: null,
      htGraphView: null,
      _htResizeHandler: null,
      layoutForm: {
        warehouseName: '默认仓库',
        areaName: '默认区域',
        warehouseLength: 120,
        warehouseWidth: 80,
        areaLength: 60,
        areaWidth: 40
      },
      layoutFormRules: {
        warehouseName: [
          { required: true, message: '请输入仓库名称', trigger: 'blur' }
        ],
        areaName: [
          { required: true, message: '请输入仓库区域', trigger: 'blur' }
        ],
        warehouseLength: [
          { required: true, message: '请输入仓库长度', trigger: 'change' }
        ],
        warehouseWidth: [
          { required: true, message: '请输入仓库宽度', trigger: 'change' }
        ],
        areaLength: [
          { required: true, message: '请输入区域长度', trigger: 'change' }
        ],
        areaWidth: [
          { required: true, message: '请输入区域宽度', trigger: 'change' }
        ]
      },
      twinMetrics: {
        onlineDevices: 18,
        slotUsageRate: 64.8,
        hourlyThroughput: 136,
        alertCount: 2,
        lastSyncTime: '-'
      },
      // 场景交互状态
      rotateX: 2,
      rotateY: -8,
      sceneScale: 1,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0,
      dragStartRotateX: 2,
      dragStartRotateY: -8
    }
  },
  computed: {
    rackBackLabels() {
      return []  // 看板暂只显示2个仓库，后排不展示
    },
    rackFrontLabels() {
      return this.rackLabels.slice(0, 2)
    },
    sceneTransformStyle() {
      return {
        transform: `rotateX(${this.rotateX}deg) rotateY(${this.rotateY}deg) scale(${this.sceneScale})`
      }
    }
  },
  methods: {
    clamp(v, min, max) {
      return Math.max(min, Math.min(max, v))
    },
    onSceneMouseDown(e) {
      this.isDragging = true
      this.dragStartX = e.clientX
      this.dragStartY = e.clientY
      this.dragStartRotateX = this.rotateX
      this.dragStartRotateY = this.rotateY
      window.addEventListener('mousemove', this.onSceneMouseMove)
      window.addEventListener('mouseup', this.onSceneMouseUp)
    },
    onSceneMouseMove(e) {
      if (!this.isDragging) return
      const dx = e.clientX - this.dragStartX
      const dy = e.clientY - this.dragStartY
      this.rotateY = this.clamp(this.dragStartRotateY + dx * 0.12, -45, 25)
      this.rotateX = this.clamp(this.dragStartRotateX - dy * 0.08, -8, 24)
    },
    onSceneMouseUp() {
      this.isDragging = false
      window.removeEventListener('mousemove', this.onSceneMouseMove)
      window.removeEventListener('mouseup', this.onSceneMouseUp)
    },
    onSceneWheel(e) {
      const delta = e.deltaY > 0 ? -0.06 : 0.06
      this.sceneScale = this.clamp(this.sceneScale + delta, 0.65, 1.8)
    },
    rack3dStyle(i, isBack) {
      const front = [
        'translateX(0px) translateY(0px) translateZ(22px) rotateY(-22deg) scale(1.16)',
        'translateX(0px) translateY(-6px) translateZ(12px) rotateY(-18deg) scale(1.13)',
        'translateX(0px) translateY(-3px) translateZ(6px) rotateY(-15deg) scale(1.10)',
        'translateX(0px) translateY(2px) translateZ(2px) rotateY(-13deg) scale(1.08)',
        'translateX(0px) translateY(6px) translateZ(-8px) rotateY(-12deg) scale(1.06)'
      ]
      const back = [
        'translateX(10px) translateY(-24px) translateZ(-132px) rotateY(-21deg) scale(0.96)',
        'translateX(8px) translateY(-28px) translateZ(-148px) rotateY(-18deg) scale(0.92)',
        'translateX(6px) translateY(-32px) translateZ(-164px) rotateY(-16deg) scale(0.89)',
        'translateX(4px) translateY(-36px) translateZ(-176px) rotateY(-14deg) scale(0.86)'
      ]
      return { transform: (isBack ? back : front)[i % (isBack ? back.length : front.length)] }
    },
    handleQuery() {
      // 后续在此请求看板聚合接口并刷新中间看板 / 左右侧数据
    },
    refreshHtScene() {
      this.initHtDrawing()
    },
    openLayoutDialog() {
      this.layoutDialogVisible = true
    },
    submitLayoutForm() {
      this.$refs.layoutFormRef.validate(valid => {
        if (!valid) return
        this.layoutDialogVisible = false
        this.$message.success('3D布局参数已保存')
      })
    },
    resetQuery() {
      this.warehouseUsageRate = '0.00%'
    },
    startTwinMetricsTimer() {
      const refresh = () => {
        this.twinMetrics = {
          onlineDevices: this.randBetween(16, 22),
          slotUsageRate: this.randDecimal(58, 79, 1),
          hourlyThroughput: this.randBetween(118, 168),
          alertCount: this.randBetween(0, 4),
          lastSyncTime: `${this.formatDate(new Date())} 实时同步`
        }
      }
      refresh()
      this.twinTimer = setInterval(refresh, 3000)
    },
    randBetween(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min
    },
    randDecimal(min, max, precision) {
      const value = Math.random() * (max - min) + min
      return Number(value.toFixed(precision))
    },
    formatDate(date) {
      const pad = v => (v < 10 ? `0${v}` : `${v}`)
      const y = date.getFullYear()
      const m = pad(date.getMonth() + 1)
      const d = pad(date.getDate())
      const hh = pad(date.getHours())
      const mm = pad(date.getMinutes())
      const ss = pad(date.getSeconds())
      return `${y}-${m}-${d} ${hh}:${mm}:${ss}`
    },
    disposeHtGraph() {
      if (this._htResizeHandler) {
        window.removeEventListener('resize', this._htResizeHandler)
        this._htResizeHandler = null
      }
      if (this.htGraphView) {
        try {
          const v = this.htGraphView.getView && this.htGraphView.getView()
          if (v && v.parentNode) {
            v.parentNode.removeChild(v)
          }
          if (typeof this.htGraphView.dispose === 'function') {
            this.htGraphView.dispose()
          }
        } catch (e) {
          /* ignore */
        }
        this.htGraphView = null
      }
    },
    resizeHtView() {
      const container = this.$refs.htDrawingContainer
      const gv = this.htGraphView
      if (!container || !gv) return
      const w = container.clientWidth || container.offsetWidth
      const h = container.clientHeight || container.offsetHeight
      if (w > 0 && h > 0 && typeof gv.resize === 'function') {
        gv.resize(w, h)
      }
      if (typeof gv.invalidate === 'function') {
        gv.invalidate()
      }
    },
    initHtDrawing() {
      const container = this.$refs.htDrawingContainer
      if (!container || !window.ht) {
        this.htReady = false
        this.htErrorMsg = 'HT 核心未挂载，请检查 ht.js 是否加载成功'
        return
      }
      this.disposeHtGraph()
      try {
        const dm = new window.ht.DataModel()
        const ht = window.ht
        const G3d = ht.graph3d && ht.graph3d.Graph3dView
        let gv
        let use3d = false

        if (G3d) {
          gv = new G3d(dm)
          use3d = true
          gv.setFar(1e6)
          gv.setMovableFunc(() => false)
          if (ht.graph3d.MapInteractor) {
            gv.setInteractors([new ht.graph3d.MapInteractor(gv)])
          }

          const floor = new ht.Node()
          floor.setName('地面')
          floor.s('shape3d', 'box')
          floor.s3([1000, 30, 700])
          floor.p3([0, -15, 0])
          floor.s('shape3d.color', '#2a4a7a')
          floor.s('3d.selectable', false)
          dm.add(floor)

          const labels = this.rackLabels.length >= 2 ? this.rackLabels : ['货架-1', '货架-2']
          for (let i = 0; i < 2; i++) {
            const rack = new ht.Node()
            rack.setName(labels[i])
            rack.s('shape3d', 'box')
            rack.s3([180, 280, 120])
            rack.p3([-220 + i * 440, 140, 0])
            rack.s('shape3d.color', i === 0 ? '#e8a23c' : '#67c23a')
            rack.s('label.color', '#ffffff')
            rack.s('label.font', 'bold 14px sans-serif')
            dm.add(rack)
          }

          gv.setEye([900, 600, 900])
          gv.setCenter([0, 120, 0])
        } else {
          gv = new ht.graph.GraphView(dm)
          gv.setPannable(true)
          gv.setZoom(1)

          const floor = new ht.Node()
          floor.setName('地面区域')
          floor.setPosition(460, 220)
          floor.setSize(760, 280)
          floor.s('shape', 'roundRect')
          floor.s('shape.background', '#2f66ff')
          floor.s('shape.border.color', '#80aaff')
          floor.s('shape.border.width', 2)
          floor.s('shape.corner.radius', 8)
          floor.s('shape.opacity', 0.22)
          floor.s('label.color', '#9fc2ff')
          floor.s('label.position', 17)
          dm.add(floor)

          const labels = this.rackLabels.length >= 2 ? this.rackLabels : ['货架-1', '货架-2']
          for (let i = 0; i < 2; i++) {
            const rack = new ht.Node()
            rack.setName(labels[i])
            rack.setPosition(260 + i * 260, 220)
            rack.setSize(180, 160)
            rack.s('shape', 'rect')
            rack.s('shape.background', '#f5b84b')
            rack.s('shape.border.color', '#ffde9a')
            rack.s('label.color', '#ffffff')
            rack.s('label.font', '14px arial')
            rack.s('label.position', 17)
            dm.add(rack)
          }
        }

        container.innerHTML = ''
        const view = gv.getView()
        view.style.width = '100%'
        view.style.height = '100%'
        container.appendChild(view)

        this.$nextTick(() => {
          this.resizeHtView()
          if (typeof gv.fitContent === 'function') {
            gv.fitContent(true)
          }
          this.resizeHtView()
        })

        this._htResizeHandler = () => this.resizeHtView()
        window.addEventListener('resize', this._htResizeHandler)

        this.htGraphView = gv
        this.htReady = true
        this.htErrorMsg = use3d ? '' : '当前为 2D 图纸模式（未加载 ht.graph3d），货架以平面示意'
      } catch (e) {
        this.htReady = false
        this.htErrorMsg = `HT 初始化失败：${e && e.message ? e.message : '未知错误'}`
      }
    },
    loadScriptOnce(src) {
      return new Promise((resolve, reject) => {
        const exists = document.querySelector(`script[data-src="${src}"]`)
        if (exists) {
          if (exists.getAttribute('data-loaded') === '1') return resolve()
          // 历史失败脚本允许重建，避免后续重试一直卡住
          if (exists.getAttribute('data-failed') === '1') {
            exists.remove()
          } else {
            exists.addEventListener('load', () => resolve(), { once: true })
            exists.addEventListener('error', () => reject(new Error(`load fail: ${src}`)), { once: true })
            return
          }
        }
        const script = document.createElement('script')
        script.src = src
        script.async = false
        script.setAttribute('data-src', src)
        script.onload = () => {
          script.setAttribute('data-loaded', '1')
          resolve()
        }
        script.onerror = () => {
          script.setAttribute('data-failed', '1')
          reject(new Error(`load fail: ${src}`))
        }
        document.body.appendChild(script)
      })
    },
    getAssetBasePath() {
      const envBase = process.env.BASE_URL || '/'
      const normalized = envBase.endsWith('/') ? envBase : `${envBase}/`
      return normalized
    },
    async ensureHtAssets() {
      if (window.ht) return true
      if (this.htLoading) return false
      this.htLoading = true
      this.htErrorMsg = ''
      // 对齐你提供的 html 清单，统一从 public/libs 加载
      window.htconfig = {
        Style: {
          'select.width': 0
        }
      }
      const base = this.getAssetBasePath()
      const defaultBases = [
        base,
        '/',
        `${window.location.pathname.replace(/\/[^/]*$/, '/')}`
      ]
      const uniqBases = Array.from(new Set(defaultBases.map(v => (v.endsWith('/') ? v : `${v}/`))))
      const scriptNames = [
        'numeral.min.js',
        'ht.js',
        'ht-modeling.js',
        'ht-obj.js',
        'ht-vector.js',
        'ht-ui.js',
        'ht-ui-framework.js'
      ]
      try {
        for (let b = 0; b < uniqBases.length; b++) {
          const candidateBase = uniqBases[b]
          const scripts = scriptNames.map(name => `${candidateBase}libs/${name}`)
          try {
            for (let i = 0; i < scripts.length; i++) {
              await this.loadScriptOnce(scripts[i])
            }
          } catch (e) {
            continue
          }
          if (window.ht) break
        }
        this.htAssetsLoaded = !!window.ht
        if (!this.htAssetsLoaded) {
          this.htErrorMsg = `脚本未加载成功，请确认 libs 可访问。已尝试前缀：${uniqBases.join(' , ')}`
        }
        return this.htAssetsLoaded
      } catch (e) {
        this.htAssetsLoaded = false
        this.htErrorMsg = `HT 资源加载失败：${e && e.message ? e.message : '未知错误'}`
        return false
      } finally {
        this.htLoading = false
      }
    }
  },
  async mounted() {
    if (this.showTwinMetricsPanel) {
      this.startTwinMetricsTimer()
    }
    const loaded = await this.ensureHtAssets()
    if (!loaded) {
      this.$message.warning('未检测到 HT 资源，请将库文件放到 public/libs 后刷新页面')
    }
    this.$nextTick(() => this.initHtDrawing())
  },
  beforeDestroy() {
    this.disposeHtGraph()
    window.removeEventListener('mousemove', this.onSceneMouseMove)
    window.removeEventListener('mouseup', this.onSceneMouseUp)
    if (this.twinTimer) {
      clearInterval(this.twinTimer)
      this.twinTimer = null
    }
  }
}
</script>

<style scoped>
.smart-warehouse-board {
  padding-top: 8px;
  position: relative;
  overflow: visible;
}

.form-fields-container {
  background: #fff;
  padding: 10px 12px 12px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 8px;
  margin-top: -3px;
  margin-left: -12px;
  margin-right: -12px;
  border: 1px solid #ebeef5;
  overflow: visible;
}

/* 单行不换行：左侧表单项 + 右侧按钮 */
.query-one-line {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 0;
}

.board-query-form-left {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.usage-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  line-height: 1.35;
}

.usage-label {
  font-size: 14px;
  color: #303133;
}

.usage-rate-text {
  font-size: 18px;
  font-weight: 600;
  color: #e6a23c;
  margin-top: 4px;
}

.query-actions-right {
  flex-shrink: 0;
  margin-left: 16px;
  white-space: nowrap;
}
.query-actions-right .el-button + .el-button {
  margin-left: 10px;
}

.board-lower-wrap {
  margin-top: 8px;
  margin-left: -12px;
  margin-right: -12px;
}
.board-three-row {
  min-height: calc(100vh - 210px);
  align-items: stretch;
}
.board-col-side,
.board-col-center {
  display: flex;
  flex-direction: column;
}

.side-box,
.center-board-box {
  flex: 1;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.04);
  min-height: 520px;
  display: flex;
  flex-direction: column;
}
.center-board-box {
  min-height: 560px;
}

.box-title {
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}
.box-body {
  flex: 1;
  overflow: auto;
}
.board-main-inner {
  flex: 1;
  min-height: 360px;
}
.board-scene-wrap {
  position: relative;
  border-radius: 10px;
  border: 1px solid #e9eef5;
  background:
    radial-gradient(circle at 70% 62%, rgba(255, 204, 84, 0.34), transparent 35%),
    linear-gradient(180deg, #eff4ff 0%, #f7f9fc 56%, #eef2f8 100%);
  overflow: hidden;
  cursor: grab;
  user-select: none;
}
.board-scene-wrap:active {
  cursor: grabbing;
}
.scene-top-tabs {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 3;
  background: rgba(22, 30, 48, 0.9);
  border-radius: 999px;
  padding: 6px 10px;
}
.scene-tab {
  font-size: 12px;
  color: #d4deee;
  white-space: nowrap;
}
.scene-tab.active {
  color: #f9d24f;
}
.scene-top-actions {
  position: absolute;
  right: 12px;
  top: 12px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e6ecf3;
  border-radius: 10px;
  padding: 4px 6px;
}
.scene-action-text {
  font-size: 12px;
  color: #2c3e50;
}
.scene-edit-btn {
  color: #409eff;
  font-size: 12px;
  padding: 0 4px;
}
.scene-left-arrow {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  border: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(145deg, #ffc54d, #e19a00);
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  cursor: pointer;
}
.warehouse-scene {
  position: absolute;
  left: 44px;
  right: 12px;
  bottom: 8px;
  top: 46px;
  display: block;
  z-index: 2;
}
.ht-scene {
  background: radial-gradient(circle at 70% 18%, rgba(63, 118, 255, 0.25), rgba(10, 20, 50, 0.84));
  border-radius: 8px;
}
.ht-drawing-canvas {
  position: absolute;
  inset: 0;
}
.ht-tip {
  position: absolute;
  left: 56px;
  top: 58px;
  z-index: 4;
  color: #c7d9ff;
  font-size: 12px;
  background: rgba(14, 28, 58, 0.7);
  border: 1px solid rgba(112, 164, 255, 0.35);
  border-radius: 6px;
  padding: 6px 10px;
}
.twin-stats-panel {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 10px;
  z-index: 4;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba(101, 149, 255, 0.35);
  background: rgba(10, 20, 48, 0.72);
  backdrop-filter: blur(2px);
}
.twin-title {
  color: #dce9ff;
  font-weight: 600;
  margin-bottom: 8px;
}
.twin-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
.twin-card {
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid rgba(132, 176, 255, 0.26);
  background: rgba(40, 76, 152, 0.2);
}
.twin-key {
  color: #99b7f2;
  font-size: 12px;
}
.twin-val {
  color: #f4fbff;
  font-size: 20px;
  font-weight: 600;
  margin-top: 4px;
  line-height: 1;
}
.twin-foot {
  margin-top: 8px;
  color: #7fa7e6;
  font-size: 12px;
}
.scene-stage {
  position: absolute;
  inset: 0;
  display: block;
  perspective: 2300px;
  transform-style: preserve-3d;
  transition: transform 0.12s ease-out;
  transform-origin: center 78%;
  transform: rotateX(10deg) rotateZ(-1deg);
}
.scene-stage.dragging {
  transition: none;
}
.rack-row {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  transform-style: preserve-3d;
}
.rack-row-back {
  bottom: 236px;
  left: 28px;
  right: 118px;
  opacity: 0.78;
}
.rack-row-front {
  bottom: 30px;
  left: 0;
  right: 0;
}
.scene-floor {
  position: absolute;
  left: 42px;
  right: 18px;
  bottom: 8px;
  height: 130px;
  background:
    linear-gradient(to right, rgba(148, 175, 230, 0.3) 1px, transparent 1px) 0 0 / 44px 100%,
    linear-gradient(to top, rgba(148, 175, 230, 0.25) 1px, transparent 1px) 0 0 / 100% 20px,
    linear-gradient(180deg, rgba(203, 219, 246, 0.22), rgba(164, 186, 231, 0.1));
  transform: perspective(680px) rotateX(65deg);
  transform-origin: bottom;
  border-radius: 12px;
  z-index: 1;
}
.scene-glow {
  position: absolute;
  width: 340px;
  height: 160px;
  right: 110px;
  bottom: 58px;
  background: radial-gradient(ellipse at center, rgba(255, 202, 82, 0.5), rgba(255, 202, 82, 0.08) 60%, transparent 72%);
  filter: blur(2px);
  z-index: 1;
}
.rack-block {
  flex: 1;
  min-width: 122px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
}
.rack-block-front {
  filter: drop-shadow(0 16px 12px rgba(34, 56, 105, 0.22));
}
.rack-block-back {
  filter: drop-shadow(0 8px 8px rgba(34, 56, 105, 0.12));
}
.rack-sign {
  background: #fff;
  border: 1px solid #ececf2;
  border-radius: 12px;
  text-align: left;
  font-weight: 600;
  font-size: 13px;
  padding: 10px 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  gap: 8px;
}
.sign-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #9f63ff;
  box-shadow: 0 0 0 3px rgba(159, 99, 255, 0.18);
}
.rack-3d {
  position: relative;
  margin-top: 6px;
  height: 306px;
  transform-style: preserve-3d;
}
.rack-3d::before,
.rack-3d::after {
  content: '';
  position: absolute;
  top: 0;
  width: 8px;
  height: 100%;
  background: linear-gradient(180deg, #dbe4f4, #bac9e3);
  border-radius: 4px;
  box-shadow: inset -1px 0 0 rgba(85, 104, 140, 0.35), 0 2px 6px rgba(56, 82, 136, 0.18);
  z-index: 3;
}
.rack-3d::before { left: -4px; }
.rack-3d::after { right: 30px; }
.rack-face {
  position: absolute;
  top: 0;
  height: 100%;
  border: 2px solid #c5d0e6;
  border-radius: 4px;
  box-shadow: 0 10px 20px rgba(39, 66, 126, 0.16);
}
.rack-front {
  left: 0;
  width: calc(100% - 52px);
  background:
    linear-gradient(90deg, rgba(173, 190, 223, 0.28), rgba(255, 255, 255, 0.36) 15%, rgba(255, 255, 255, 0.12) 100%),
    rgba(255, 255, 255, 0.7);
  padding: 6px 5px 4px;
  z-index: 2;
}
.rack-right-face {
  right: 0;
  width: 54px;
  transform: skewY(-8deg);
  transform-origin: left center;
  background: linear-gradient(180deg, #b8c7e0, #aebed8);
  padding: 6px 2px 4px;
  z-index: 1;
}
.rack-post {
  position: absolute;
  top: -2px;
  width: 8px;
  height: calc(100% + 4px);
  background: linear-gradient(180deg, #edf2fb, #c5d1e7);
  box-shadow: inset -1px 0 0 rgba(116, 133, 167, 0.45), 0 1px 4px rgba(56, 82, 136, 0.14);
  border-radius: 4px;
  z-index: 3;
}
.rack-post.post-l { left: -4px; }
.rack-post.post-r { right: 46px; }
.rack-shelf {
  height: 72px;
  border-bottom: 1px dashed #d8e0ed;
  display: flex;
  align-items: center;
  gap: 7px;
  position: relative;
}
.rack-shelf.side {
  gap: 2px;
  justify-content: center;
}
.rack-shelf::before {
  content: '';
  position: absolute;
  left: -2px;
  right: -2px;
  top: 1px;
  height: 7px;
  background: linear-gradient(90deg, rgba(255, 201, 95, 0.35), rgba(255, 201, 95, 0.82), rgba(255, 201, 95, 0.28));
  filter: blur(0.3px);
}
.rack-shelf.warm::before {
  background: linear-gradient(90deg, rgba(255, 190, 82, 0.45), rgba(255, 190, 82, 1), rgba(255, 190, 82, 0.35));
  box-shadow: 0 0 10px rgba(255, 191, 84, 0.55);
}
.rack-shelf:last-child {
  border-bottom: none;
}
.box {
  width: 24px;
  height: 34px;
  border-radius: 2px;
  position: relative;
  box-shadow: 0 3px 7px rgba(0, 0, 0, 0.22);
}
.box i {
  position: absolute;
  right: -6px;
  top: 2px;
  width: 6px;
  height: 28px;
  background: rgba(0, 0, 0, 0.18);
  transform: skewY(-28deg);
  border-radius: 1px;
}
.box::after {
  content: '';
  position: absolute;
  left: 1px;
  top: -4px;
  width: calc(100% - 2px);
  height: 5px;
  background: rgba(255, 255, 255, 0.35);
  transform: skewX(-45deg);
}
.box-blue { background: linear-gradient(135deg, #5686e8, #3f72db 68%); }
.box-red { background: linear-gradient(135deg, #f06f6f, #e74a4a 68%); }
.box-yellow { background: linear-gradient(135deg, #ffd36d, #f4c248 68%); }
.placeholder-text {
  color: #909399;
  font-size: 13px;
  line-height: 1.6;
}
</style>
