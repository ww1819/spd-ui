<template>
  <div class="app-container medical-charge">
    <!-- 患者信息区 -->
    <el-card class="patient-info-card">
      <div class="patient-header">
        <span class="title">患者信息</span>
        <el-tag :type="patientStatus.type">{{ patientStatus.text }}</el-tag>
      </div>
      <el-form label-width="100px">
        <el-row :gutter="20">
          <el-col :span="4">
            <el-form-item label="住院号：">
              <el-input 
                v-model="patientInfo.hospitalNumber"
                placeholder="扫码/输入住院号"
                ref="hospitalInput"
                @change="handlePatientScan"
              >
                <i slot="prefix" class="el-icon-scan"></i>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="姓名：">
              <el-input v-model="patientInfo.name" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="性别：">
              <el-input v-model="patientInfo.sex" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="病区：">
              <el-input v-model="patientInfo.ward" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="病房号：">
              <el-input v-model="patientInfo.ward" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="4">
          <el-form-item label="申请科室：">
            <SelectDepartment v-model="patientInfo.sqks" />
          </el-form-item>
        </el-col>
          <el-col :span="4">
            <el-form-item label="住院日期：">
              <el-input v-model="patientInfo.zyrq" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="联系电话：">
              <el-input v-model="patientInfo.lxdh" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="联系地址：">
              <el-input v-model="patientInfo.lxdz" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="病床号：">
              <el-input v-model="patientInfo.bch" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="4">
          <el-form-item label="执行科室：" prop="zxks">
            <SelectDepartment v-model="patientInfo.zxks" />
          </el-form-item>
        </el-col>
          <el-col :span="4">
            <el-form-item label="主刀医生：">
              <el-input v-model="patientInfo.zdys" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="手术日期：">
              <el-input v-model="patientInfo.ssrq" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="手术名称：">
              <el-input v-model="patientInfo.lxdz" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="4">
          <el-form-item label="入院诊断：">
            <el-input v-model="patientInfo.ryzd" disabled />
          </el-form-item>
        </el-col>
          <el-col :span="4">
            <el-form-item label="手术ID：">
              <el-input v-model="patientInfo.ssid" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="手术包码：">
              <el-input v-model="patientInfo.ssbm" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单号：">
              <el-input v-model="patientInfo.dh" disabled />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 耗材扫码区 -->
    <el-card class="scan-area">
      <div class="scan-header">
        <span class="title">耗材扫码</span>
      </div>
      <el-input
        v-model="currentBarcode"
        placeholder="请扫描耗材唯一码"
        ref="barcodeInput"
        @change="handleBarcodeScan"
      >
        <template slot="prepend">
          <el-tag type="info">当前条码</el-tag>
        </template>
      </el-input>
    </el-card>

    <!-- 耗材清单 -->
    <el-card class="material-list">
      <div class="list-header">
        <h3>已扫码耗材清单</h3>
        <div class="total-info">
          <span class="label">合计数量：</span>
          <el-tag type="warning">{{ totalQuantity }}</el-tag>
          <span class="label ml-20">总金额：</span>
          <el-tag type="danger">¥ {{ totalAmount.toFixed(2) }}</el-tag>
        </div>
      </div>
      
      <el-table 
        :data="scannedMaterials" 
        border
        highlight-current-row
      >
        <el-table-column label="操作" width="80">
          <template slot-scope="{ $index }">
            <el-button
              type="danger"
              icon="el-icon-delete"
              circle
              size="mini"
              @click="removeMaterial($index)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="uniqueCode" label="唯一码" width="200" />
        <el-table-column prop="name" label="耗材名称" />
        <el-table-column prop="spec" label="规格型号" width="150" />
        <el-table-column prop="batchNumber" label="生产批号" width="150" />
        <el-table-column prop="expireDate" label="有效期" width="120" />
        <el-table-column prop="price" label="单价" width="120">
          <template slot-scope="{ row }">
            ¥ {{ row.price.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template slot-scope="{ row }">
            <el-tag :type="getMaterialStatus(row).type">
              {{ getMaterialStatus(row).text }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button 
        type="primary" 
        icon="el-icon-document-checked"
        :disabled="!canSubmit"
        @click="submitCharge"
      >
        暂存（{{ scannedMaterials.length }}项）
      </el-button>
      <el-button 
        type="primary" 
        icon="el-icon-document-checked"
        :disabled="!canSubmit"
        @click="submitCharge"
      >
        提交计费（{{ scannedMaterials.length }}项）
      </el-button>
      <el-button 
        icon="el-icon-refresh"
        @click="resetAll"
      >
        重置
      </el-button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      patientInfo: {
        hospitalNumber: '',
        name: '',
        ward: '',
        surgeryDate: ''
      },
      currentBarcode: '',
      scannedMaterials: [],
      materialMap: new Map(), // 用于防止重复扫描
      materialStatus: {
        normal: { type: 'success', text: '未使用' },
        used: { type: 'info', text: '已计费' },
        expired: { type: 'danger', text: '已过期' },
        lowStock: { type: 'warning', text: '库存不足' }
      }
    }
  },

  computed: {
    totalQuantity() {
      return this.scannedMaterials.length
    },
    totalAmount() {
      return this.scannedMaterials.reduce((sum, item) => sum + item.price, 0)
    },
    canSubmit() {
      return (
        this.patientInfo.hospitalNumber &&
        this.scannedMaterials.length > 0
      )
    },
    patientStatus() {
      return this.patientInfo.hospitalNumber ? 
        { type: 'success', text: '已关联' } :
        { type: 'danger', text: '未关联' }
    }
  },

  mounted() {
    this.initScanner()
  },

  methods: {
    // 初始化扫码监听
    initScanner() {
      this.$nextTick(() => {
        this.$refs.hospitalInput.focus()
      })
    },

    // 处理患者信息扫码
    async handlePatientScan(value) {
      try {
        // 调用接口获取患者信息
        const res = await this.$api.patient.getByHospitalNumber(value)
        this.patientInfo = {
          ...this.patientInfo,
          ...res.data
        }
      } catch (error) {
        this.$message.error('患者信息获取失败')
        this.patientInfo.hospitalNumber = ''
      }
    },

    // 开始耗材扫码
    startBarcodeScan() {
      if (!this.patientInfo.hospitalNumber) {
        this.$message.warning('请先关联患者信息')
        return
      }
      this.$refs.barcodeInput.focus()
    },

    // 处理耗材扫码
    async handleBarcodeScan(code) {
      if (!code) return

      // 检查是否已扫描
      if (this.materialMap.has(code)) {
        this.$message.warning('该耗材已扫描')
        this.currentBarcode = ''
        return
      }

      try {
        // 调用接口获取耗材信息
        const res = await this.$api.material.getByBarcode(code)
        const material = res.data

        // 检查库存状态
        if (material.stock <= 0) {
          this.$message.error('该耗材库存不足')
          return
        }

        // 检查有效期
        if (new Date(material.expireDate) < new Date()) {
          this.$message.error('该耗材已过期')
          return
        }

        // 添加到列表
        this.scannedMaterials.push({
          ...material,
          uniqueCode: code,
          status: 'normal'
        })
        this.materialMap.set(code, true)

        this.$message.success(`已添加：${material.name}`)
        this.currentBarcode = ''
      } catch (error) {
        this.$message.error('无效的耗材条码')
        this.currentBarcode = ''
      }
    },

    // 获取耗材状态
    getMaterialStatus(row) {
      if (row.status === 'used') return this.materialStatus.used
      if (new Date(row.expireDate) < new Date()) 
        return this.materialStatus.expired
      if (row.stock <= 0) return this.materialStatus.lowStock
      return this.materialStatus.normal
    },

    // 移除耗材
    removeMaterial(index) {
      const code = this.scannedMaterials[index].uniqueCode
      this.materialMap.delete(code)
      this.scannedMaterials.splice(index, 1)
    },

    // 提交计费
    async submitCharge() {
      try {
        await this.$api.charge.submit({
          patient: this.patientInfo,
          materials: this.scannedMaterials
        })
        this.$message.success('计费提交成功')
        this.resetAll()
      } catch (error) {
        this.$message.error('计费提交失败')
      }
    },

    // 打印标签
    printLabels() {
      // 调用打印接口
      const codes = this.scannedMaterials.map(m => m.uniqueCode)
      this.$api.print.batchPrint(codes)
    },

    // 重置所有
    resetAll() {
      this.patientInfo = {
        hospitalNumber: '',
        name: '',
        ward: '',
        surgeryDate: ''
      }
      this.scannedMaterials = []
      this.materialMap.clear()
      this.initScanner()
    }
  }
}
</script>

<style lang="scss" scoped>
.medical-charge {
  .patient-info-card {
    margin-bottom: 20px;
    
    .patient-header {
      display: flex;
      // align-items: center;
      // justify-content: center;
      margin-bottom: 15px;
      
      .title {
        font-size: 16px;
        margin-right: 15px;
      }
    }
  }

  .scan-area {
    margin-bottom: 20px;
    
    .scan-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
  }

  .material-list {
    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      
      .total-info {
        display: flex;
        align-items: center;
        
        .label {
          color: #666;
        }
        
        .ml-20 {
          margin-left: 20px;
        }
      }
    }
  }

  .action-buttons {
    margin-top: 20px;
    text-align: center;
  }
}
</style>