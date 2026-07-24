<template>
  <el-dialog
    :title="title"
    :visible.sync="dialogVisible"
    width="980px"
    append-to-body
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form label-width="90px" size="small" class="gaopayi-form">
      <el-row :gutter="12">
        <el-col :span="8">
          <el-form-item label="厂家">
            <el-select v-model="vendorCode" placeholder="选择厂家" style="width:100%" @change="onVendorChange">
              <el-option
                v-for="v in vendors"
                :key="v.code"
                :label="v.name"
                :value="v.code"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="型号">
            <el-select v-model="modelCode" placeholder="选择型号" style="width:100%" @change="onModelChange">
              <el-option
                v-for="m in modelOptions"
                :key="m.code"
                :label="m.name"
                :value="m.code"
                :disabled="m.disabled || !m.adapter"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="连接">
            <el-tag :type="connected ? 'success' : 'info'" size="small">{{ connected ? '已连接' : '未连接' }}</el-tag>
            <el-tag v-if="cameraOpen" type="warning" size="small" style="margin-left:6px">预览中</el-tag>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="12">
        <el-col :span="8">
          <el-form-item label="摄像头">
            <el-select v-model="deviceIndex" placeholder="摄像头" style="width:100%" :disabled="!deviceCount" @change="onDeviceChange">
              <el-option
                v-for="n in deviceCount"
                :key="n - 1"
                :label="'摄像头' + n"
                :value="n - 1"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="分辨率">
            <el-select v-model="resolutionIndex" placeholder="分辨率" style="width:100%" :disabled="!resolutions.length">
              <el-option
                v-for="(r, idx) in resolutions"
                :key="idx"
                :label="r"
                :value="idx"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="纠偏">
            <el-switch
              v-model="deskew"
              :disabled="!connected"
              active-text="开"
              inactive-text="关"
              @change="onDeskewChange"
            />
            <span class="deskew-hint">{{ deskewAppliedHint }}</span>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <div class="gaopayi-toolbar">
      <el-button type="primary" size="mini" :loading="busy" @click="initDevice">初始化设备</el-button>
      <el-button type="success" size="mini" :loading="busy" :disabled="!deviceCount" @click="startPreview">打开预览</el-button>
      <el-button size="mini" :disabled="!cameraOpen" @click="stopPreview">关闭预览</el-button>
      <el-button type="warning" size="mini" :loading="busy" :disabled="!cameraOpen" @click="doCapture">拍照</el-button>
      <el-button size="mini" :disabled="!captures.length" @click="clearCaptures">清空已拍</el-button>
    </div>

    <div class="gaopayi-preview-wrap">
      <div class="gaopayi-preview-pane">
        <div class="pane-title">实时预览</div>
        <div class="pane-body">
          <img v-if="previewUrl" :src="previewUrl" alt="preview" />
          <div v-else class="pane-empty">请先初始化并打开预览</div>
        </div>
      </div>
      <div class="gaopayi-preview-pane gaopayi-result-pane">
        <div class="pane-title">
          拍摄结果（{{ captures.length }}）
          <span class="pane-title-tip">勾选后可一并上传，点缩略图放大</span>
        </div>
        <div class="pane-body capture-gallery">
          <div v-if="!captures.length" class="pane-empty">连续拍照后显示在此，可删除挑选</div>
          <div
            v-for="item in captures"
            :key="item.id"
            class="capture-item"
            :class="{ active: item.id === activeCaptureId, checked: item.checked }"
          >
            <el-checkbox v-model="item.checked" class="capture-check" @click.native.stop />
            <img :src="item.dataUrl" alt="shot" @click="activeCaptureId = item.id" />
            <i class="el-icon-delete capture-del" title="删除" @click.stop="removeCapture(item.id)" />
          </div>
        </div>
        <div v-if="activeCapture" class="capture-large">
          <img :src="activeCapture.dataUrl" alt="large" />
        </div>
      </div>
    </div>

    <div v-if="statusMsg" class="gaopayi-status" :class="{ error: statusError }">{{ statusMsg }}</div>

    <div slot="footer" class="dialog-footer">
      <span class="footer-tip">已选 {{ selectedCaptures.length }} / {{ captures.length }} 张</span>
      <el-button size="small" @click="handleClose">取 消</el-button>
      <el-button type="primary" size="small" :disabled="!selectedCaptures.length" :loading="busy" @click="confirmUse">
        上传所选照片
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import {
  GAOPAYI_VENDORS,
  loadLastSelection,
  saveLastSelection,
  createGaopayiAdapter,
  base64ToFile
} from '@/utils/gaopayi'

let captureSeq = 0

export default {
  name: 'GaopayiCapture',
  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, default: '高拍仪拍摄' }
  },
  data() {
    const last = loadLastSelection()
    return {
      vendors: GAOPAYI_VENDORS,
      vendorCode: last.vendorCode,
      modelCode: last.modelCode,
      adapter: null,
      connected: false,
      cameraOpen: false,
      busy: false,
      deviceCount: 0,
      deviceIndex: 0,
      resolutions: [],
      resolutionIndex: 0,
      deskew: !!last.deskew,
      /** 设备侧最近一次成功下发的纠偏值；null 表示尚未对当前预览生效 */
      deskewApplied: null,
      previewUrl: '',
      captures: [],
      activeCaptureId: null,
      statusMsg: '',
      statusError: false
    }
  },
  computed: {
    dialogVisible: {
      get() { return this.visible },
      set(v) { this.$emit('update:visible', v) }
    },
    modelOptions() {
      const v = this.vendors.find(x => x.code === this.vendorCode)
      return v ? v.models : []
    },
    selectedCaptures() {
      return this.captures.filter(c => c.checked)
    },
    activeCapture() {
      return this.captures.find(c => c.id === this.activeCaptureId) || null
    },
    deskewAppliedHint() {
      if (!this.cameraOpen) {
        return this.deskew ? '（打开预览后生效）' : ''
      }
      if (this.deskewApplied === null) return '（同步中…）'
      if (this.deskewApplied === this.deskew) {
        return this.deskew ? '（设备已开启）' : '（设备已关闭）'
      }
      return '（与设备不一致，请重开预览）'
    }
  },
  watch: {
    visible(val) {
      if (val) {
        const last = loadLastSelection()
        this.vendorCode = last.vendorCode
        this.modelCode = last.modelCode
        this.deskew = !!last.deskew
        this.resetSessionState()
      } else {
        this.disposeAdapter()
      }
    }
  },
  beforeDestroy() {
    this.disposeAdapter()
  },
  methods: {
    setStatus(msg, isError) {
      this.statusMsg = msg || ''
      this.statusError = !!isError
    },
    resetSessionState() {
      this.connected = false
      this.cameraOpen = false
      this.deviceCount = 0
      this.deviceIndex = 0
      this.resolutions = []
      this.resolutionIndex = 0
      this.deskewApplied = null
      this.previewUrl = ''
      this.captures = []
      this.activeCaptureId = null
      this.setStatus('')
    },
    async disposeAdapter() {
      if (this.adapter) {
        try { await this.adapter.dispose() } catch (e) { /* ignore */ }
        this.adapter = null
      }
      this.connected = false
      this.cameraOpen = false
      this.deskewApplied = null
    },
    onVendorChange() {
      const models = this.modelOptions.filter(m => m.adapter && !m.disabled)
      this.modelCode = models.length ? models[0].code : ''
      this.disposeAdapter().then(() => this.resetSessionState())
    },
    onModelChange() {
      this.disposeAdapter().then(() => this.resetSessionState())
    },
    ensureAdapter() {
      if (this.adapter) return this.adapter
      this.adapter = createGaopayiAdapter(this.vendorCode, this.modelCode)
      this.adapter.onPreview((url) => {
        this.previewUrl = url
      })
      return this.adapter
    },
    /**
     * 纠偏必须在摄像头打开后重新下发；仅开关 UI 不会在重开预览后自动生效。
     */
    async applyDeskewToDevice(force) {
      if (!this.adapter || !this.connected) return
      if (!this.cameraOpen && !force) {
        this.deskewApplied = null
        return
      }
      try {
        await this.adapter.setDeskew(this.deskew)
        this.deskewApplied = this.deskew
        saveLastSelection(this.vendorCode, this.modelCode, this.deskew)
      } catch (e) {
        this.deskewApplied = null
        throw e
      }
    },
    async initDevice() {
      this.busy = true
      try {
        await this.disposeAdapter()
        this.resetSessionState()
        const ad = this.ensureAdapter()
        await ad.connect()
        this.connected = true
        await ad.initDevs()
        const count = await ad.getDeviceCount()
        this.deviceCount = count
        if (!count) {
          this.setStatus('未检测到摄像头，请检查高拍仪连接与驱动', true)
          return
        }
        this.deviceIndex = 0
        this.resolutions = await ad.getResolution(0)
        this.resolutionIndex = 0
        saveLastSelection(this.vendorCode, this.modelCode, this.deskew)
        this.setStatus('初始化成功，检测到 ' + count + ' 个摄像头')
      } catch (e) {
        this.setStatus((e && e.message) || '初始化失败', true)
      } finally {
        this.busy = false
      }
    },
    async onDeviceChange() {
      if (!this.adapter || !this.connected) return
      this.busy = true
      try {
        if (this.cameraOpen) {
          await this.adapter.closeCamera()
          this.cameraOpen = false
          this.deskewApplied = null
        }
        this.resolutions = await this.adapter.getResolution(this.deviceIndex)
        this.resolutionIndex = 0
        this.previewUrl = ''
      } catch (e) {
        this.setStatus((e && e.message) || '切换摄像头失败', true)
      } finally {
        this.busy = false
      }
    },
    async startPreview() {
      this.busy = true
      try {
        const ad = this.ensureAdapter()
        if (!this.connected) {
          await this.initDevice()
          if (!this.deviceCount) return
        }
        if (this.cameraOpen) {
          await ad.closeCamera()
          this.cameraOpen = false
          this.deskewApplied = null
        }
        await ad.openCamera(this.deviceIndex, this.resolutionIndex)
        this.cameraOpen = true
        // 重开摄像头后设备纠偏会失效，必须按当前开关重新下发
        await this.applyDeskewToDevice(true)
        this.setStatus(this.deskew ? '预览已打开，纠偏已重新下发' : '预览已打开')
      } catch (e) {
        this.setStatus((e && e.message) || '打开预览失败', true)
      } finally {
        this.busy = false
      }
    },
    async stopPreview() {
      if (!this.adapter) return
      try {
        await this.adapter.closeCamera()
      } catch (e) { /* ignore */ }
      this.cameraOpen = false
      this.deskewApplied = null
      this.previewUrl = ''
      this.setStatus('预览已关闭')
    },
    async onDeskewChange(val) {
      this.deskew = !!val
      saveLastSelection(this.vendorCode, this.modelCode, this.deskew)
      if (!this.adapter || !this.connected) {
        this.setStatus(this.deskew ? '纠偏已勾选，打开预览后生效' : '纠偏已关闭')
        return
      }
      if (!this.cameraOpen) {
        this.deskewApplied = null
        this.setStatus(this.deskew ? '纠偏已勾选，打开预览后生效' : '纠偏已关闭（打开预览时同步）')
        return
      }
      try {
        await this.applyDeskewToDevice(true)
        this.setStatus(this.deskew ? '纠偏已开启' : '纠偏已关闭')
      } catch (e) {
        this.setStatus((e && e.message) || '设置纠偏失败', true)
      }
    },
    async doCapture() {
      if (!this.adapter || !this.cameraOpen) {
        this.setStatus('请先打开预览再拍照', true)
        return
      }
      this.busy = true
      try {
        // 拍照前再同步一次纠偏，避免 UI 开着但设备侧未生效
        if (this.deskewApplied !== this.deskew) {
          await this.applyDeskewToDevice(true)
        }
        const b64 = await this.adapter.scanImage()
        const id = 'c' + (++captureSeq) + '_' + Date.now()
        const item = {
          id,
          base64: b64,
          dataUrl: 'data:image/jpeg;base64,' + b64,
          checked: true
        }
        this.captures.push(item)
        this.activeCaptureId = id
        this.setStatus('已拍摄 ' + this.captures.length + ' 张，可继续拍或勾选后上传')
      } catch (e) {
        this.setStatus((e && e.message) || '拍照失败', true)
      } finally {
        this.busy = false
      }
    },
    removeCapture(id) {
      this.captures = this.captures.filter(c => c.id !== id)
      if (this.activeCaptureId === id) {
        this.activeCaptureId = this.captures.length ? this.captures[this.captures.length - 1].id : null
      }
    },
    clearCaptures() {
      this.captures = []
      this.activeCaptureId = null
    },
    confirmUse() {
      const selected = this.selectedCaptures
      if (!selected.length) {
        this.setStatus('请至少勾选一张照片', true)
        return
      }
      const files = selected.map((c, i) =>
        base64ToFile(c.base64, 'gaopayi_' + Date.now() + '_' + (i + 1) + '.jpg')
      )
      saveLastSelection(this.vendorCode, this.modelCode, this.deskew)
      this.$emit('confirm', {
        files,
        file: files[0],
        items: selected.map(c => ({
          base64: c.base64,
          dataUrl: c.dataUrl
        })),
        base64: selected[0].base64,
        dataUrl: selected[0].dataUrl,
        vendorCode: this.vendorCode,
        modelCode: this.modelCode
      })
      this.dialogVisible = false
    },
    async handleClose() {
      await this.disposeAdapter()
      this.dialogVisible = false
      this.$emit('cancel')
    }
  }
}
</script>

<style scoped>
.gaopayi-form {
  margin-bottom: 4px;
}
.deskew-hint {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}
.gaopayi-toolbar {
  margin: 0 0 12px;
}
.gaopayi-preview-wrap {
  display: flex;
  gap: 12px;
  align-items: stretch;
}
.gaopayi-preview-pane {
  flex: 1;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  background: #fafafa;
  min-width: 0;
}
.gaopayi-result-pane {
  flex: 1.15;
}
.pane-title {
  background: #f0f4f8;
  padding: 6px 10px;
  font-size: 13px;
  color: #606266;
  border-bottom: 1px solid #e4e7ed;
}
.pane-title-tip {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}
.pane-body {
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
}
.pane-body img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.capture-gallery {
  height: 120px;
  justify-content: flex-start;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 8px;
  gap: 8px;
}
.capture-item {
  position: relative;
  flex: 0 0 auto;
  width: 96px;
  height: 96px;
  border: 2px solid transparent;
  border-radius: 4px;
  overflow: hidden;
  background: #000;
}
.capture-item.checked {
  border-color: #409eff;
}
.capture-item.active {
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.45);
}
.capture-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}
.capture-check {
  position: absolute;
  left: 4px;
  top: 2px;
  z-index: 2;
}
.capture-del {
  position: absolute;
  right: 4px;
  top: 4px;
  z-index: 2;
  color: #fff;
  background: rgba(245, 108, 108, 0.9);
  border-radius: 50%;
  padding: 3px;
  cursor: pointer;
  font-size: 12px;
}
.capture-large {
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111;
  border-top: 1px solid #333;
}
.capture-large img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.pane-empty {
  color: #909399;
  font-size: 13px;
  padding: 16px;
  text-align: center;
  width: 100%;
}
.gaopayi-status {
  margin-top: 10px;
  font-size: 12px;
  color: #67c23a;
}
.gaopayi-status.error {
  color: #f56c6c;
}
.footer-tip {
  float: left;
  line-height: 32px;
  font-size: 12px;
  color: #909399;
}
</style>
