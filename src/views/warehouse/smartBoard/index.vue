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
                <el-button size="mini" icon="el-icon-setting" circle />
                <span class="scene-action-text">循播 50 帧局</span>
                <el-button size="mini" icon="el-icon-refresh" circle />
              </div>
              <button class="scene-left-arrow" type="button" aria-label="prev">◀</button>

              <div class="scene-floor"></div>
              <div class="scene-glow"></div>
              <div class="warehouse-scene">
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
  </div>
</template>

<script>
export default {
  name: 'SmartWarehouseBoard',
  data() {
    return {
      /** 暂无接口数据时固定展示；接入接口后由接口赋值 */
      warehouseUsageRate: '0.00%',
      rackLabels: ['QM3(9/9)', 'WS', 'QM3(9/9)', 'ZX-88001', 'WS', 'ZX-88001'],
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
      return this.rackLabels.slice(0, 4)
    },
    rackFrontLabels() {
      return this.rackLabels.slice(1, 6)
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
    resetQuery() {
      this.warehouseUsageRate = '0.00%'
    }
  },
  beforeDestroy() {
    window.removeEventListener('mousemove', this.onSceneMouseMove)
    window.removeEventListener('mouseup', this.onSceneMouseUp)
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
