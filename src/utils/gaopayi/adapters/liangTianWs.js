/**
 * 良田(Eloam) 高拍仪 WebSocket 适配器
 * 协议参考 vue-demo：本地服务 ws://127.0.0.1:9000
 */
export default class LiangTianWsAdapter {
  constructor(options = {}) {
    this.wsUrl = options.wsUrl || 'ws://127.0.0.1:9000'
    this.ws = null
    this.connected = false
    this.cameraOpen = false
    this.deviceIndex = 0
    this.resolutionIndex = 0
    this._previewHandler = null
    this._waiters = []
  }

  onPreview(handler) {
    this._previewHandler = handler
  }

  connect() {
    if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve()
    }
    return new Promise((resolve, reject) => {
      let ws
      try {
        if ('WebSocket' in window) {
          ws = new WebSocket(this.wsUrl)
        } else {
          reject(new Error('当前浏览器不支持 WebSocket，无法连接高拍仪本地服务'))
          return
        }
      } catch (e) {
        reject(e)
        return
      }
      const timer = setTimeout(() => {
        try { ws.close() } catch (e) { /* ignore */ }
        reject(new Error('连接高拍仪服务超时，请确认已安装并启动良田本地服务(' + this.wsUrl + ')'))
      }, 8000)
      ws.onopen = () => {
        clearTimeout(timer)
        this.ws = ws
        this.connected = true
        resolve()
      }
      ws.onmessage = (evt) => {
        if (typeof evt.data !== 'string' || !evt.data) return
        let data
        try {
          data = JSON.parse(evt.data)
        } catch (e) {
          return
        }
        this._handleMessage(data)
      }
      ws.onclose = () => {
        this.connected = false
        this.cameraOpen = false
        this.ws = null
      }
      ws.onerror = () => {
        clearTimeout(timer)
        if (!this.connected) {
          reject(new Error('无法连接高拍仪服务 ' + this.wsUrl))
        }
      }
    })
  }

  _handleMessage(data) {
    const name = data.function
    if (name === 'ImageCallback') {
      if (this.cameraOpen && this._previewHandler && data.value) {
        this._previewHandler('data:image/jpeg;base64,' + data.value)
      }
      return
    }
    const pending = this._waiters.filter(w => w.fn === name)
    if (!pending.length) return
    // 同名命令按 FIFO 消费
    const waiter = pending[0]
    this._waiters = this._waiters.filter(w => w !== waiter)
    if (typeof data.ret === 'number' && data.ret < 0) {
      waiter.reject(new Error((name || '高拍仪') + ' 调用失败(ret=' + data.ret + ')'))
    } else {
      waiter.resolve(data)
    }
  }

  send(body, waitFn) {
    const payload = typeof body === 'string' ? body : JSON.stringify(body)
    const fn = waitFn || (body && body.function)
    const doSend = () => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return Promise.reject(new Error('高拍仪未连接'))
      }
      if (!fn) {
        this.ws.send(payload)
        return Promise.resolve(null)
      }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          this._waiters = this._waiters.filter(w => w !== waiter)
          reject(new Error(fn + ' 等待响应超时'))
        }, 15000)
        const waiter = {
          fn,
          resolve: (data) => { clearTimeout(timer); resolve(data) },
          reject: (err) => { clearTimeout(timer); reject(err) }
        }
        this._waiters.push(waiter)
        try {
          this.ws.send(payload)
        } catch (e) {
          clearTimeout(timer)
          this._waiters = this._waiters.filter(w => w !== waiter)
          reject(e)
        }
      })
    }
    if (this.connected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      return doSend()
    }
    return this.connect().then(doSend)
  }

  initDevs() {
    return this.send({ function: 'InitDevs' })
  }

  deinitDevs() {
    this.cameraOpen = false
    return this.send({ function: 'DeinitDevs' }).catch(() => null)
  }

  getDeviceCount() {
    return this.send({ function: 'GetDeviceCount' }).then(data => {
      const n = Number(data && data.value)
      return Number.isFinite(n) ? n : 0
    })
  }

  getResolution(deviceIndex) {
    return this.send({
      function: 'GetResolution',
      device: deviceIndex == null ? this.deviceIndex : deviceIndex
    }).then(data => {
      const raw = (data && data.value) ? String(data.value) : ''
      return raw ? raw.split('|').filter(Boolean) : []
    })
  }

  getDeviceName(deviceIndex) {
    return this.send({
      function: 'GetDeviceName',
      device: deviceIndex == null ? this.deviceIndex : deviceIndex
    }).then(data => (data && data.value) || '')
  }

  openCamera(deviceIndex, resolutionIndex) {
    if (deviceIndex != null) this.deviceIndex = deviceIndex
    if (resolutionIndex != null) this.resolutionIndex = resolutionIndex
    return this.send({
      function: 'OpenCamera',
      device: this.deviceIndex,
      resolution: this.resolutionIndex,
      datacallback: true
    }).then(data => {
      this.cameraOpen = true
      return data
    })
  }

  closeCamera() {
    const idx = this.deviceIndex
    this.cameraOpen = false
    return this.send({
      function: 'CloseCamera',
      device: idx
    }).catch(() => null)
  }

  /** @returns {Promise<string>} jpeg base64（不含 data: 前缀） */
  scanImage() {
    return this.send({
      function: 'ScanImage',
      imagepath: '',
      colorize: 0,
      type: true
    }).then(data => {
      if (!data || !data.value) {
        throw new Error('拍照未返回图像数据')
      }
      return data.value
    })
  }

  setDeskew(enabled) {
    return this.send({
      function: 'SetDeskew',
      isdeskew: enabled ? 1 : 0
    })
  }

  async dispose() {
    try {
      if (this.cameraOpen) await this.closeCamera()
    } catch (e) { /* ignore */ }
    try {
      await this.deinitDevs()
    } catch (e) { /* ignore */ }
    if (this.ws) {
      try { this.ws.close() } catch (e) { /* ignore */ }
    }
    this.ws = null
    this.connected = false
    this.cameraOpen = false
    this._waiters = []
    this._previewHandler = null
  }
}
