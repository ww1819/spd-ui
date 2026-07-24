/**
 * 库房数字孪生：拟真立体货架场景（Three.js CDN）
 * 工业货架：橙/蓝立柱 + 横梁 + 层板 + 纸箱/周转箱，五区地坪分色
 */

const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js'
const CONTROLS_CDN = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js'

const ZONE_FLOOR = {
  PENDING_CHECK: 0x2a4a7a,
  QUALIFIED: 0x1a5a48,
  UNQUALIFIED: 0x6a2a1a,
  RETURN: 0x6a4a10,
  PENDING_SHIP: 0x4a2a6a
}

const ZONE_LABEL = {
  PENDING_CHECK: '待验区',
  QUALIFIED: '合格区',
  UNQUALIFIED: '不合格区',
  RETURN: '退货区',
  PENDING_SHIP: '待发区'
}

const STATUS_COLOR = {
  green: 0x2ec4a5,
  yellow: 0xf0c14a,
  red: 0xe4572e,
  empty: 0x6a7a8a
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('load fail: ' + src))
    document.head.appendChild(s)
  })
}

export async function ensureThree() {
  if (!window.THREE) {
    await loadScript(THREE_CDN)
  }
  if (!window.THREE.OrbitControls) {
    await loadScript(CONTROLS_CDN)
  }
  return window.THREE
}

function num(v, d = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : d
}

/**
 * @param {HTMLElement} container
 * @param {Function} onSelectSlot (slot) => void
 */
export function createWarehouse3D(container, onSelectSlot) {
  const THREE = window.THREE
  if (!THREE || !container) {
    throw new Error('THREE 未就绪')
  }

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a1524)
  scene.fog = new THREE.Fog(0x0a1524, 55, 160)

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500)
  camera.position.set(32, 26, 42)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  container.innerHTML = ''
  container.appendChild(renderer.domElement)

  const controls = new THREE.OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.maxPolarAngle = Math.PI * 0.48
  controls.minDistance = 8
  controls.maxDistance = 140
  controls.target.set(24, 2, 8)

  // 灯光
  scene.add(new THREE.AmbientLight(0xb8d0e8, 0.45))
  const hemi = new THREE.HemisphereLight(0xddeeff, 0x334455, 0.35)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight(0xfff2e0, 0.95)
  sun.position.set(30, 40, 20)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.left = -50
  sun.shadow.camera.right = 50
  sun.shadow.camera.top = 50
  sun.shadow.camera.bottom = -50
  sun.shadow.camera.near = 1
  sun.shadow.camera.far = 120
  scene.add(sun)
  const fill = new THREE.DirectionalLight(0x88aacc, 0.35)
  fill.position.set(-20, 20, -15)
  scene.add(fill)

  // 材质缓存
  const matCache = {}
  function mat(key, color, opts) {
    const k = key + '_' + color
    if (!matCache[k]) {
      matCache[k] = new THREE.MeshStandardMaterial(Object.assign({
        color,
        metalness: 0.35,
        roughness: 0.55
      }, opts || {}))
    }
    return matCache[k]
  }

  const rackRoot = new THREE.Group()
  rackRoot.name = 'racks'
  scene.add(rackRoot)

  const highlightRoot = new THREE.Group()
  highlightRoot.name = 'highlightRoot'
  scene.add(highlightRoot)

  const clickables = []
  let highlightId = null
  let animId = 0
  let disposed = false

  function clearHighlights() {
    highlightId = null
    while (highlightRoot.children.length) {
      const m = highlightRoot.children[0]
      highlightRoot.remove(m)
      if (m.geometry) m.geometry.dispose()
      if (m.material) {
        if (m.material.map) m.material.map.dispose()
        m.material.dispose()
      }
    }
  }

  function clearRacks() {
    clearHighlights()
    while (rackRoot.children.length) {
      const o = rackRoot.children[0]
      rackRoot.remove(o)
      o.traverse((ch) => {
        if (ch.geometry) ch.geometry.dispose()
      })
    }
    clickables.length = 0
  }

  function buildFloor() {
    // 去掉旧地坪（保留灯光相机）
    const old = scene.getObjectByName('floorRoot')
    if (old) {
      scene.remove(old)
      old.traverse((ch) => {
        if (ch.geometry) ch.geometry.dispose()
      })
    }
    const floorRoot = new THREE.Group()
    floorRoot.name = 'floorRoot'

    const concrete = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 60),
      mat('concrete', 0x2a3544, { metalness: 0.05, roughness: 0.92 })
    )
    concrete.rotation.x = -Math.PI / 2
    concrete.position.set(14, 0, 8)
    concrete.receiveShadow = true
    floorRoot.add(concrete)

    // 地坪网格线
    const grid = new THREE.GridHelper(80, 40, 0x3a5a7a, 0x243548)
    grid.position.set(14, 0.01, 8)
    floorRoot.add(grid)

    scene.add(floorRoot)
  }

  function addZonePad(zoneType, centerX, centerZ, w, d) {
    const color = ZONE_FLOOR[zoneType] || 0x334455
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.05, d),
      mat('pad_' + zoneType, color, { metalness: 0.08, roughness: 0.7, transparent: true, opacity: 0.72 })
    )
    pad.position.set(centerX, 0.025, centerZ)
    pad.receiveShadow = true
    rackRoot.add(pad)

    // 分区围栏（矮栏），把区和区隔开
    const railMat = mat('rail_' + zoneType, color, { metalness: 0.4, roughness: 0.45 })
    const hw = w / 2
    const hd = d / 2
    const railH = 0.35
    const segments = [
      [w, 0.08, 0.08, 0, railH / 2, -hd],
      [w, 0.08, 0.08, 0, railH / 2, hd],
      [0.08, 0.08, d, -hw, railH / 2, 0],
      [0.08, 0.08, d, hw, railH / 2, 0]
    ]
    segments.forEach((s) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(s[0], s[1], s[2]), railMat)
      rail.position.set(centerX + s[3], s[4], centerZ + s[5])
      rackRoot.add(rail)
    })

    // 区牌立柱
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 2.4, 8),
      mat('pole', 0xc0c8d0, { metalness: 0.7, roughness: 0.3 })
    )
    pole.position.set(centerX - hw + 0.5, 1.2, centerZ - hd + 0.5)
    pole.castShadow = true
    rackRoot.add(pole)

    const board = makeTextSprite(ZONE_LABEL[zoneType] || zoneType, '#e8f4ff', '#0b1c30')
    board.position.set(centerX - hw + 0.5, 2.6, centerZ - hd + 0.5)
    board.scale.set(3.6, 1.2, 1)
    rackRoot.add(board)
  }

  /** 各区独立占地，拉开合格区与不合格区 */
  function zoneLayout(zoneType) {
    switch (zoneType) {
      case 'PENDING_CHECK':
        return { ox: 0, oz: 0, cols: 4, gapX: 2.5, gapZ: 2.2, upright: 0x3b82f6 }
      case 'QUALIFIED':
        return { ox: 14, oz: 0, cols: 8, gapX: 2.5, gapZ: 2.2, upright: 0xd97706 }
      case 'UNQUALIFIED':
        // 与合格区横向拉开，中间留通道
        return { ox: 48, oz: 0, cols: 3, gapX: 2.5, gapZ: 2.2, upright: 0xdc2626 }
      case 'RETURN':
        return { ox: 48, oz: 16, cols: 3, gapX: 2.5, gapZ: 2.2, upright: 0xca8a04 }
      case 'PENDING_SHIP':
        return { ox: 0, oz: 16, cols: 4, gapX: 2.5, gapZ: 2.2, upright: 0x7c3aed }
      default:
        return { ox: 14, oz: 0, cols: 6, gapX: 2.5, gapZ: 2.2, upright: 0xd97706 }
    }
  }

  function makeTextSprite(text, fg, bg) {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, 256, 64)
    ctx.strokeStyle = '#1a8cff'
    ctx.lineWidth = 4
    ctx.strokeRect(2, 2, 252, 60)
    ctx.fillStyle = fg
    ctx.font = 'bold 28px Microsoft YaHei, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 128, 34)
    const tex = new THREE.CanvasTexture(canvas)
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }))
    return spr
  }

  /**
   * 建一座真实工业货架（正面朝 +Z）
   * layers: [{ layerNo, bays: [{ slot, statusColor, qty, data }] }]
   */
  function buildRack(x, z, shelfCode, layers, uprightColor) {
    const bayW = 1.15
    const depth = 0.85
    const layerH = 0.72
    const baseH = 0.18
    const maxLayer = Math.max(1, ...layers.map((l) => l.layerNo || 1))
    const bayCount = Math.max(1, ...layers.map((l) => (l.bays && l.bays.length) || 1))
    const width = bayCount * bayW + 0.16
    const height = baseH + maxLayer * layerH + 0.2

    const group = new THREE.Group()
    group.position.set(x, 0, z)

    const uprightMat = mat('upright', uprightColor || 0xd97706, { metalness: 0.55, roughness: 0.35 })
    const beamMat = mat('beam', 0x1e3a5f, { metalness: 0.5, roughness: 0.4 })
    const deckMat = mat('deck', 0x8b6914, { metalness: 0.15, roughness: 0.85 })
    const footMat = mat('foot', 0x4a5560, { metalness: 0.6, roughness: 0.4 })

    // 四根立柱
    const postGeo = new THREE.BoxGeometry(0.08, height, 0.08)
    const posts = [
      [-width / 2, height / 2, -depth / 2],
      [width / 2, height / 2, -depth / 2],
      [-width / 2, height / 2, depth / 2],
      [width / 2, height / 2, depth / 2]
    ]
    posts.forEach((p) => {
      const m = new THREE.Mesh(postGeo, uprightMat)
      m.position.set(p[0], p[1], p[2])
      m.castShadow = true
      m.receiveShadow = true
      group.add(m)
      // 地脚
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.14), footMat)
      foot.position.set(p[0], 0.03, p[2])
      group.add(foot)
    })

    // 背拉斜撑
    const brace = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, height * 0.85, 0.03),
      mat('brace', 0xb45309, { metalness: 0.5, roughness: 0.4 })
    )
    brace.position.set(0, height * 0.45, -depth / 2)
    brace.rotation.z = 0.35
    group.add(brace)

    // 各层横梁 + 层板
    for (let li = 1; li <= maxLayer; li++) {
      const y = baseH + (li - 1) * layerH
      // 前梁后梁
      ;[-depth / 2 + 0.04, depth / 2 - 0.04].forEach((bz) => {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(width - 0.06, 0.07, 0.05), beamMat)
        beam.position.set(0, y, bz)
        beam.castShadow = true
        group.add(beam)
      })
      // 层板（木纹感）
      const deck = new THREE.Mesh(new THREE.BoxGeometry(width - 0.12, 0.035, depth - 0.12), deckMat)
      deck.position.set(0, y + 0.04, 0)
      deck.receiveShadow = true
      deck.castShadow = true
      group.add(deck)
      // 层板缝线
      for (let k = 1; k < bayCount; k++) {
        const seam = new THREE.Mesh(
          new THREE.BoxGeometry(0.02, 0.04, depth - 0.15),
          mat('seam', 0x5c4a1a, { metalness: 0.1, roughness: 0.9 })
        )
        seam.position.set(-width / 2 + 0.08 + k * bayW, y + 0.05, 0)
        group.add(seam)
      }
    }

    // 顶梁
    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(width, 0.06, depth), beamMat)
    topBeam.position.set(0, height - 0.05, 0)
    group.add(topBeam)

    // 货架端头标牌
    const tag = makeTextSprite(shelfCode || '货架', '#fff7e6', '#9a3412')
    tag.position.set(-width / 2 - 0.15, height * 0.55, 0)
    tag.scale.set(1.6, 0.55, 1)
    group.add(tag)

    // 货物箱
    layers.forEach((layer) => {
      const layerNo = layer.layerNo || 1
      const y = baseH + (layerNo - 1) * layerH + 0.12
      ;(layer.bays || []).forEach((bay, bi) => {
        const bx = -width / 2 + 0.08 + bayW * (bi + 0.5)
        const colorKey = bay.statusColor || 'empty'
        const boxColor = STATUS_COLOR[colorKey] || STATUS_COLOR.empty
        const qty = num(bay.qty, 0)
        const boxN = qty <= 0 ? 0 : qty < 20 ? 1 : qty < 80 ? 2 : 3

        // 空位也放浅灰虚箱示意货位
        if (boxN === 0) {
          const emptyBox = new THREE.Mesh(
            new THREE.BoxGeometry(0.55, 0.28, 0.45),
            mat('emptybox', 0x3a4a5a, { metalness: 0.1, roughness: 0.9, transparent: true, opacity: 0.25 })
          )
          emptyBox.position.set(bx, y + 0.14, 0)
          emptyBox.userData = { slot: bay.data, isSlot: true }
          group.add(emptyBox)
          clickables.push(emptyBox)
          return
        }

        for (let i = 0; i < boxN; i++) {
          const bw = 0.42 + (i % 2) * 0.08
          const bh = 0.28 + (i === 0 ? 0.06 : 0)
          const bd = 0.38
          const box = new THREE.Mesh(
            new THREE.BoxGeometry(bw, bh, bd),
            mat('box_' + colorKey + i, boxColor, { metalness: 0.08, roughness: 0.78 })
          )
          box.position.set(bx + (i - 1) * 0.12, y + bh / 2 + i * 0.02, (i - 1) * 0.08)
          box.castShadow = true
          box.receiveShadow = true
          box.userData = { slot: bay.data, isSlot: true }
          group.add(box)
          clickables.push(box)

          // 纸箱封条
          const tape = new THREE.Mesh(
            new THREE.BoxGeometry(bw * 0.15, bh + 0.01, bd + 0.01),
            mat('tape', 0xe8d48b, { metalness: 0.05, roughness: 0.6 })
          )
          tape.position.copy(box.position)
          group.add(tape)
        }

        // 高亮描边用不可见代理盒（整格）
        const hit = new THREE.Mesh(
          new THREE.BoxGeometry(bayW * 0.9, 0.55, depth * 0.85),
          new THREE.MeshBasicMaterial({ visible: false })
        )
        hit.position.set(bx, y + 0.28, 0)
        hit.userData = { slot: bay.data, isSlot: true }
        group.add(hit)
        clickables.push(hit)
      })
    })

    rackRoot.add(group)
    return group
  }

  function setZones(zones) {
    const keepHighlight = highlightId
    clearRacks()
    buildFloor()
    if (!zones || !zones.length) {
      resize()
      return
    }

    zones.forEach((zone) => {
      const shelves = zone.shelves || []
      const layout = zoneLayout(zone.zoneType)
      if (!shelves.length) {
        addZonePad(zone.zoneType, layout.ox + 4, layout.oz + 3, 10, 8)
        return
      }

      let minX = Infinity
      let maxX = -Infinity
      let minZ = Infinity
      let maxZ = -Infinity

      shelves.forEach((shelf, si) => {
        const slots = shelf.slots || []
        const layerMap = {}
        slots.forEach((slot) => {
          const ln = num(slot.layerNo, 1)
          if (!layerMap[ln]) layerMap[ln] = []
          layerMap[ln].push({
            statusColor: slot.statusColor,
            qty: slot.qty,
            data: slot
          })
        })
        const layers = Object.keys(layerMap)
          .map((k) => ({ layerNo: Number(k), bays: layerMap[k] }))
          .sort((a, b) => a.layerNo - b.layerNo)
        if (!layers.length) {
          layers.push({ layerNo: 1, bays: [{ statusColor: 'empty', qty: 0, data: { locationId: null } }] })
        }

        // 强制按五区独立网格排布，避免合格/不合格坐标重叠
        const col = si % layout.cols
        const row = Math.floor(si / layout.cols)
        const x = layout.ox + col * layout.gapX
        const z = layout.oz + row * layout.gapZ

        buildRack(x, z, shelf.shelfCode || 'RF', layers, layout.upright)
        minX = Math.min(minX, x - 1.2)
        maxX = Math.max(maxX, x + 1.2)
        minZ = Math.min(minZ, z - 1.0)
        maxZ = Math.max(maxZ, z + 1.0)
      })

      if (minX !== Infinity) {
        const cx = (minX + maxX) / 2
        const cz = (minZ + maxZ) / 2
        const w = Math.max(8, maxX - minX + 4)
        const d = Math.max(6, maxZ - minZ + 3.5)
        addZonePad(zone.zoneType, cx, cz, w, d)
      }
    })

    // 通道指示：合格区与不合格区之间
    const aisle = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.03, 14),
      mat('aisle', 0x1e293b, { metalness: 0.05, roughness: 0.95 })
    )
    aisle.position.set(38, 0.02, 4)
    rackRoot.add(aisle)
    const aisleLabel = makeTextSprite('通道', '#94a3b8', '#0f172a')
    aisleLabel.position.set(38, 1.2, 4)
    aisleLabel.scale.set(2.2, 0.7, 1)
    rackRoot.add(aisleLabel)

    let cx = 0
    let cz = 0
    let n = 0
    rackRoot.children.forEach((ch) => {
      if (ch.type === 'Group' && ch.children.length > 3) {
        cx += ch.position.x
        cz += ch.position.z
        n++
      }
    })
    if (n > 0) {
      cx /= n
      cz /= n
      controls.target.set(cx, 2.2, cz)
      camera.position.set(cx + 18, 16, cz + 24)
      controls.update()
    }
    resize()
    if (keepHighlight) {
      setHighlight(keepHighlight)
    }
  }

  function setHighlight(locationId) {
    // 先彻底清掉旧光圈，避免残留/叠加卡死
    while (highlightRoot.children.length) {
      const m = highlightRoot.children[0]
      highlightRoot.remove(m)
      if (m.geometry) m.geometry.dispose()
      if (m.material) m.material.dispose()
    }
    highlightId = locationId != null && locationId !== '' ? String(locationId) : null
    if (!highlightId) return

    // 每个货位只打一个光圈（取第一个命中的 clickable）
    const hit = clickables.find((obj) => {
      const slot = obj.userData && obj.userData.slot
      return slot && slot.locationId != null && String(slot.locationId) === highlightId
    })
    if (!hit) return

    const wp = new THREE.Vector3()
    hit.getWorldPosition(wp)
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.045, 10, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffe066,
        transparent: true,
        opacity: 0.95,
        depthTest: true
      })
    )
    ring.rotation.x = Math.PI / 2
    ring.position.set(wp.x, wp.y + 0.55, wp.z)
    ring.userData.isHighlight = true
    highlightRoot.add(ring)

    // 竖向光柱，更容易看见
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.18, 2.4, 12),
      new THREE.MeshBasicMaterial({
        color: 0xffe066,
        transparent: true,
        opacity: 0.35,
        depthWrite: false
      })
    )
    beam.position.set(wp.x, wp.y + 1.4, wp.z)
    beam.userData.isHighlight = true
    highlightRoot.add(beam)
  }

  function focusLocation(locationId) {
    setHighlight(locationId)
    const hit = clickables.find((obj) => {
      const slot = obj.userData && obj.userData.slot
      return slot && String(slot.locationId) === String(locationId)
    })
    if (hit) {
      const wp = new THREE.Vector3()
      hit.getWorldPosition(wp)
      controls.target.set(wp.x, wp.y, wp.z)
      camera.position.set(wp.x + 8, wp.y + 6, wp.z + 10)
      controls.update()
    }
  }

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  function onClick(ev) {
    const rect = renderer.domElement.getBoundingClientRect()
    pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(clickables, false)
    if (hits.length && hits[0].object.userData && hits[0].object.userData.slot) {
      const slot = hits[0].object.userData.slot
      if (slot.locationId != null && typeof onSelectSlot === 'function') {
        setHighlight(slot.locationId)
        onSelectSlot(slot)
      }
    } else {
      // 点空白处清除光圈
      setHighlight(null)
    }
  }
  renderer.domElement.addEventListener('pointerdown', onClick)

  function resize() {
    if (disposed || !container) return
    const w = container.clientWidth || 800
    const h = container.clientHeight || 480
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
  }

  let t0 = performance.now()
  function animate() {
    if (disposed) return
    animId = requestAnimationFrame(animate)
    const t = performance.now()
    highlightRoot.children.forEach((m, i) => {
      if (!m.userData || !m.userData.isHighlight) return
      const pulse = 0.75 + 0.25 * Math.sin((t - t0) / 220 + i)
      if (m.material) {
        m.material.transparent = true
        m.material.opacity = pulse
      }
      if (m.geometry && m.geometry.type === 'TorusGeometry') {
        const s = 1 + 0.08 * Math.sin((t - t0) / 200)
        m.scale.set(s, s, s)
      }
    })
    controls.update()
    renderer.render(scene, camera)
  }

  const ro = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(() => resize())
    : null
  if (ro) ro.observe(container)

  buildFloor()
  resize()
  animate()

  return {
    setZones,
    setHighlight,
    clearHighlights,
    focusLocation,
    resize,
    dispose() {
      disposed = true
      cancelAnimationFrame(animId)
      renderer.domElement.removeEventListener('pointerdown', onClick)
      if (ro) ro.disconnect()
      controls.dispose()
      clearRacks()
      clearHighlights()
      renderer.dispose()
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
    }
  }
}
