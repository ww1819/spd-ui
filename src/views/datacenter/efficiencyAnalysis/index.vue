<template>
  <div class="efficiency-analysis-page">
    <div class="efficiency-analysis-sticky">
      <data-center-top-decoration />
      <div class="form-fields-container">
        <el-form :model="queryParams" inline size="small" class="query-form query-form-compact">
          <el-form-item label="年度">
            <el-date-picker
              v-model="queryParams.year"
              type="year"
              value-format="yyyy"
              placeholder="选择年度"
              clearable
              style="width: 140px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div class="efficiency-analysis-scroll">
      <!-- 运营核心 KPI 看板 -->
      <div class="kpi-section">
        <div class="kpi-section-title">运营核心KPI看板({{ displayYear }})</div>
        <div class="kpi-metrics-table">
          <div class="kpi-metrics-row kpi-metrics-row--head">
            <div class="kpi-metrics-cell kpi-metrics-cell--label">指标名称</div>
            <div v-for="col in metricColumns" :key="col.key" class="kpi-metrics-cell">
              {{ col.label }}
            </div>
          </div>
          <div
            v-for="(item, index) in kpiList"
            :key="item.key"
            :class="['kpi-metrics-row kpi-metrics-row--body', index % 2 === 0 ? 'kpi-metrics-row--alt' : 'kpi-metrics-row--plain']"
          >
            <div class="kpi-metrics-cell kpi-metrics-cell--label">{{ item.label }}</div>
            <div class="kpi-metrics-cell kpi-metrics-cell--value">
              {{ formatMetricValue(item, 'currentValue') }}
            </div>
            <div class="kpi-metrics-cell kpi-metrics-cell--value">
              {{ formatMetricValue(item, 'previousValue') }}
            </div>
            <div class="kpi-metrics-cell kpi-metrics-cell--value">
              <span :class="compareClass(item.compareRate)">{{ item.compareRate }}</span>
            </div>
            <div class="kpi-metrics-cell kpi-metrics-cell--value">
              {{ formatMetricValue(item, 'targetValue') }}
            </div>
            <div class="kpi-metrics-cell kpi-metrics-cell--value">
              <span :class="compareClass(item.diffValue, true)">{{ item.diffValue }}</span>
            </div>
            <div class="kpi-metrics-cell kpi-metrics-cell--status">
              <el-tag :type="item.status === '达标' ? 'success' : 'danger'" size="small" effect="plain">
                {{ item.status }}
              </el-tag>
            </div>
            <div class="kpi-metrics-cell kpi-metrics-cell--remark" :title="item.remark">
              {{ item.remark }}
            </div>
          </div>
        </div>
      </div>

      <!-- 耗材分类消耗占比&趋势分析 -->
      <div class="category-section">
        <div class="kpi-section-title">
          耗材分类消耗占比&amp;趋势分析-统计周期：{{ displayPeriod }}　单位：元
        </div>

        <div class="category-body">
          <div class="category-chart-panel">
            <div class="category-chart-title">本期耗材分类消耗占比</div>
            <div ref="categoryPieRef" class="category-pie" />
          </div>
          <div class="category-table-panel">
            <div class="category-metrics-table">
              <div class="category-metrics-row category-metrics-row--head">
                <div v-for="col in categoryColumns" :key="col.key" class="category-metrics-cell">
                  {{ col.label }}
                </div>
              </div>
              <div
                v-for="(row, index) in categoryRows"
                :key="row.key"
                :class="['category-metrics-row category-metrics-row--body', index % 2 === 0 ? 'category-metrics-row--alt' : 'category-metrics-row--plain']"
              >
                <div class="category-metrics-cell category-metrics-cell--label">{{ row.label }}</div>
                <div class="category-metrics-cell category-metrics-cell--money">¥{{ row.currentAmount }}</div>
                <div class="category-metrics-cell category-metrics-cell--ratio">{{ row.ratio }}</div>
                <div class="category-metrics-cell category-metrics-cell--money">¥{{ row.previousAmount }}</div>
                <div class="category-metrics-cell">
                  <span :class="chainCompareClass(row.chainChange)">{{ row.chainChange }}</span>
                </div>
                <div class="category-metrics-cell category-metrics-cell--remark" :title="row.remark">
                  {{ row.remark }}
                </div>
              </div>
              <div class="category-metrics-row category-metrics-row--total">
                <div class="category-metrics-cell category-metrics-cell--label">合计</div>
                <div class="category-metrics-cell category-metrics-cell--money">¥{{ categoryTotal.currentAmount }}</div>
                <div class="category-metrics-cell category-metrics-cell--ratio">{{ categoryTotal.ratio }}</div>
                <div class="category-metrics-cell category-metrics-cell--money">¥{{ categoryTotal.previousAmount }}</div>
                <div class="category-metrics-cell">—</div>
                <div class="category-metrics-cell">—</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 近12个月消耗趋势 -->
        <div class="category-trend-body">
          <div class="category-trend-table-panel">
            <div class="trend-metrics-table">
              <div class="trend-metrics-row trend-metrics-row--head">
                <div v-for="col in trendColumns" :key="col.key" class="trend-metrics-cell">
                  {{ col.label }}
                </div>
              </div>
              <div
                v-for="(row, index) in trendRows"
                :key="row.month"
                :class="['trend-metrics-row trend-metrics-row--body', index % 2 === 0 ? 'trend-metrics-row--alt' : 'trend-metrics-row--plain']"
              >
                <div class="trend-metrics-cell trend-metrics-cell--label">{{ row.monthLabel }}</div>
                <div class="trend-metrics-cell trend-metrics-cell--money">¥{{ formatMoney(row.low) }}</div>
                <div class="trend-metrics-cell trend-metrics-cell--money">¥{{ formatMoney(row.high) }}</div>
                <div class="trend-metrics-cell trend-metrics-cell--money">¥{{ formatMoney(row.reagent) }}</div>
                <div class="trend-metrics-cell trend-metrics-cell--money">¥{{ formatMoney(row.surgical) }}</div>
                <div class="trend-metrics-cell trend-metrics-cell--money trend-metrics-cell--total">¥{{ formatMoney(row.total) }}</div>
              </div>
            </div>
          </div>
          <div class="category-trend-chart-panel">
            <div class="category-chart-title">近12个月耗材消耗趋势</div>
            <div ref="categoryTrendLineRef" class="category-trend-line" />
          </div>
        </div>
      </div>

      <!-- 各科室耗材成本分析表（月度） -->
      <div class="dept-cost-section">
        <div class="kpi-section-title">
          各科室耗材成本分析表（月度）-统计周期：{{ displayDeptPeriod }}　单位：元
        </div>
        <div class="dept-cost-table">
          <div class="dept-cost-row dept-cost-row--head">
            <div v-for="col in deptCostColumns" :key="col.key" class="dept-cost-cell">
              {{ col.label }}
            </div>
          </div>
          <div
            v-for="(row, index) in deptCostRows"
            :key="row.key"
            :class="['dept-cost-row dept-cost-row--body', index % 2 === 0 ? 'dept-cost-row--alt' : 'dept-cost-row--plain']"
          >
            <div class="dept-cost-cell dept-cost-cell--label">{{ row.deptName }}</div>
            <div class="dept-cost-cell dept-cost-cell--money">¥{{ formatMoney(row.amount) }}</div>
            <div class="dept-cost-cell">{{ row.costRate }}</div>
            <div class="dept-cost-cell">{{ row.lastCostRate }}</div>
            <div class="dept-cost-cell">
              <span :class="deptChangeClass(row.yoyChange)">{{ row.yoyChange }}</span>
            </div>
            <div class="dept-cost-cell dept-cost-cell--warning">
              <span :class="row.warningStatus === 'exceeded' ? 'dept-warning--exceeded' : 'dept-warning--normal'">
                {{ row.warningStatus === 'exceeded' ? '超标' : '正常' }}
              </span>
            </div>
            <div class="dept-cost-cell dept-cost-cell--remark" :title="row.remark">{{ row.remark }}</div>
          </div>
          <div class="dept-cost-row dept-cost-row--total">
            <div class="dept-cost-cell dept-cost-cell--label">合计</div>
            <div class="dept-cost-cell dept-cost-cell--money">¥{{ formatMoney(deptCostTotal) }}</div>
            <div class="dept-cost-cell">—</div>
            <div class="dept-cost-cell">—</div>
            <div class="dept-cost-cell">—</div>
            <div class="dept-cost-cell">—</div>
            <div class="dept-cost-cell">—</div>
          </div>
        </div>
      </div>

      <!-- 服务效率上线前后季度对比报告 -->
      <div class="spd-efficiency-section">
        <div class="kpi-section-title">
          服务效率上线前后季度对比报告-对比周期：SPD上线前1季度 VS 上线后1季度
        </div>
        <div class="spd-efficiency-table">
          <div class="spd-efficiency-row spd-efficiency-row--head">
            <div v-for="col in spdEfficiencyColumns" :key="col.key" class="spd-efficiency-cell">
              {{ col.label }}
            </div>
          </div>
          <div
            v-for="(row, index) in spdEfficiencyRows"
            :key="row.key"
            :class="['spd-efficiency-row spd-efficiency-row--body', index % 2 === 0 ? 'spd-efficiency-row--alt' : 'spd-efficiency-row--plain']"
          >
            <div class="spd-efficiency-cell spd-efficiency-cell--label">{{ row.indicator }}</div>
            <div class="spd-efficiency-cell spd-efficiency-cell--value">{{ row.beforeValue }}</div>
            <div class="spd-efficiency-cell spd-efficiency-cell--value">{{ row.afterValue }}</div>
            <div class="spd-efficiency-cell">
              <span class="spd-improvement-rate">{{ row.improvementRate }}</span>
            </div>
            <div class="spd-efficiency-cell spd-efficiency-cell--remark" :title="row.effectDesc">{{ row.effectDesc }}</div>
          </div>
        </div>
      </div>

      <!-- 十八类重点耗材 -->
      <div class="key-material-section">
        <div class="kpi-section-title">十八类重点耗材</div>
        <div class="key-material-table">
          <div class="key-material-row key-material-row--head">
            <div v-for="col in keyMaterialColumns" :key="col.key" class="key-material-cell">
              {{ col.label }}
            </div>
          </div>
          <div
            v-for="(row, index) in keyMaterialRows"
            :key="row.key"
            :class="['key-material-row key-material-row--body', index % 2 === 0 ? 'key-material-row--alt' : 'key-material-row--plain']"
          >
            <div class="key-material-cell key-material-cell--label">{{ row.categoryName }}</div>
            <div class="key-material-cell key-material-cell--money">¥{{ formatMoney(row.amount) }}</div>
            <div class="key-material-cell">{{ row.yoyRate }}</div>
            <div class="key-material-cell">
              <span :class="deptChangeClass(row.yoyChange)">{{ row.yoyChange }}</span>
            </div>
            <div class="key-material-cell key-material-cell--remark">{{ row.remark }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import DataCenterTopDecoration from '@/components/DataCenterTopDecoration/index.vue'
import { parseTime } from '@/utils/ruoyi'

const METRIC_COLUMNS = [
  { key: 'currentValue', label: '本期值' },
  { key: 'previousValue', label: '上期值' },
  { key: 'compareRate', label: '同比/环比' },
  { key: 'targetValue', label: '目标值' },
  { key: 'diffValue', label: '差异值' },
  { key: 'status', label: '达标状态' },
  { key: 'remark', label: '备注' }
]

const CATEGORY_COLUMNS = [
  { key: 'label', label: '耗材分类' },
  { key: 'currentAmount', label: '本期消耗金额' },
  { key: 'ratio', label: '占总消耗比例' },
  { key: 'previousAmount', label: '上期消耗金额' },
  { key: 'chainChange', label: '环比变动' },
  { key: 'remark', label: '备注' }
]

const PIE_COLORS = ['#4472c4', '#5b9bd5', '#8064a2', '#ffc000']

const TREND_COLUMNS = [
  { key: 'month', label: '月份' },
  { key: 'low', label: '低值耗材' },
  { key: 'high', label: '高值耗材' },
  { key: 'reagent', label: '检验试剂' },
  { key: 'surgical', label: '手术套包' },
  { key: 'total', label: '总消耗' }
]

const TREND_LINE_SERIES = [
  { key: 'low', name: '低值耗材', color: '#4472c4' },
  { key: 'high', name: '高值耗材', color: '#5b9bd5' },
  { key: 'reagent', name: '检验试剂', color: '#8064a2' },
  { key: 'surgical', name: '手术套包', color: '#ffc000' }
]

/** 近12个月消耗趋势（静态展示，后续对接接口） */
const MONTHLY_TREND_ROWS = [
  { month: 1, low: 380000, high: 420000, reagent: 150000, surgical: 90000 },
  { month: 2, low: 390000, high: 430000, reagent: 155000, surgical: 92000 },
  { month: 3, low: 410000, high: 450000, reagent: 160000, surgical: 95000 },
  { month: 4, low: 420000, high: 470000, reagent: 165000, surgical: 98000 },
  { month: 5, low: 430000, high: 490000, reagent: 170000, surgical: 100000 },
  { month: 6, low: 450000, high: 540000, reagent: 180000, surgical: 110000 },
  { month: 7, low: 460000, high: 560000, reagent: 185000, surgical: 112000 },
  { month: 8, low: 470000, high: 580000, reagent: 190000, surgical: 115000 },
  { month: 9, low: 480000, high: 600000, reagent: 195000, surgical: 118000 },
  { month: 10, low: 490000, high: 620000, reagent: 200000, surgical: 120000 },
  { month: 11, low: 500000, high: 640000, reagent: 205000, surgical: 122000 },
  { month: 12, low: 510000, high: 660000, reagent: 210000, surgical: 125000 }
]

const DEPT_COST_COLUMNS = [
  { key: 'deptName', label: '科室名称' },
  { key: 'amount', label: '月度耗材消耗总金额' },
  { key: 'costRate', label: '百元医疗收入耗材成本率' },
  { key: 'lastCostRate', label: '上月成本率' },
  { key: 'yoyChange', label: '同比增减' },
  { key: 'warning', label: '成本超标预警' },
  { key: 'remark', label: '备注' }
]

/** 各科室耗材成本分析（静态展示，后续对接接口） */
const DEPT_COST_ROWS = [
  { key: 'internal', deptName: '内科', amount: 280000, costRate: '8.50%', lastCostRate: '8.20%', yoyChange: '-0.30%', warningStatus: 'normal', remark: '控费执行良好' },
  { key: 'surgery', deptName: '外科', amount: 370000, costRate: '10.50%', lastCostRate: '10.20%', yoyChange: '-0.30%', warningStatus: 'exceeded', remark: '高值耗材使用偏多' },
  { key: 'orthopedics', deptName: '骨科', amount: 210000, costRate: '9.20%', lastCostRate: '9.00%', yoyChange: '-0.20%', warningStatus: 'normal', remark: '—' },
  { key: 'obgyn', deptName: '妇产科', amount: 180000, costRate: '7.80%', lastCostRate: '7.60%', yoyChange: '-0.20%', warningStatus: 'normal', remark: '—' },
  { key: 'pediatrics', deptName: '儿科', amount: 150000, costRate: '7.50%', lastCostRate: '7.80%', yoyChange: '+0.30%', warningStatus: 'normal', remark: '—' },
  { key: 'emergency', deptName: '急诊科', amount: 120000, costRate: '9.80%', lastCostRate: '9.50%', yoyChange: '-0.30%', warningStatus: 'exceeded', remark: '急诊耗材波动较大' },
  { key: 'or', deptName: '手术室', amount: 240000, costRate: '11.20%', lastCostRate: '10.80%', yoyChange: '-0.40%', warningStatus: 'exceeded', remark: '手术量上升' },
  { key: 'lab', deptName: '检验科', amount: 90000, costRate: '6.50%', lastCostRate: '6.30%', yoyChange: '-0.20%', warningStatus: 'normal', remark: '—' },
  { key: 'pharmacy', deptName: '药学部', amount: 80000, costRate: '5.20%', lastCostRate: '5.00%', yoyChange: '-0.20%', warningStatus: 'normal', remark: '—' },
  { key: 'admin', deptName: '行政后勤', amount: 60000, costRate: '4.50%', lastCostRate: '4.80%', yoyChange: '+0.30%', warningStatus: 'normal', remark: '—' }
]

const SPD_EFFICIENCY_COLUMNS = [
  { key: 'indicator', label: '效率指标' },
  { key: 'beforeValue', label: 'SPD上线前' },
  { key: 'afterValue', label: 'SPD上线后' },
  { key: 'improvementRate', label: '优化幅度' },
  { key: 'effectDesc', label: '优化效果说明' }
]

/** 服务效率上线前后对比（静态展示，后续对接接口） */
const SPD_EFFICIENCY_ROWS = [
  {
    key: 'picking',
    indicator: '人工拣货时长（小时/日）',
    beforeValue: '8',
    afterValue: '3',
    improvementRate: '62.50%',
    effectDesc: '拣货效率提升62.5%，人工成本大幅降低'
  },
  {
    key: 'inventory',
    indicator: '全院盘点耗时（小时/次）',
    beforeValue: '12',
    afterValue: '4',
    improvementRate: '66.67%',
    effectDesc: '盘点效率提升66.7%，库存准确率提升至99.9%'
  },
  {
    key: 'apply',
    indicator: '科室申领平均耗时（分钟）',
    beforeValue: '45',
    afterValue: '15',
    improvementRate: '66.67%',
    effectDesc: '申领响应效率提升66.7%，临床满意度大幅提升'
  },
  {
    key: 'capital',
    indicator: '库存资金占用总金额（万元）',
    beforeValue: '450',
    afterValue: '320',
    improvementRate: '28.89%',
    effectDesc: '库存资金压降28.9%，医院资金周转效率提升'
  },
  {
    key: 'scrap',
    indicator: '过期报废损耗率',
    beforeValue: '0.012',
    afterValue: '0.008',
    improvementRate: '33.33%',
    effectDesc: '报废损耗降低33.3%，年减少损失超10万元'
  }
]

const KEY_MATERIAL_COLUMNS = [
  { key: 'categoryName', label: '十八类重点耗材' },
  { key: 'amount', label: '年度重点耗材消耗总金额' },
  { key: 'yoyRate', label: '年度重点耗材同比(%)' },
  { key: 'yoyChange', label: '同比增减' },
  { key: 'remark', label: '备注' }
]

/** 十八类重点耗材（静态展示，后续对接接口） */
const KEY_MATERIAL_ROWS = [
  {
    key: 'bone-fix',
    categoryName: '单/多部件金属骨固定器械及附件',
    amount: 280000,
    yoyRate: '8.50%',
    yoyChange: '-8.50%',
    remark: '钛合金 / 不锈钢接骨板、锁定螺钉、髓内钉、骨科固定配件等'
  },
  {
    key: 'guidewire',
    categoryName: '导丝',
    amount: 320000,
    yoyRate: '108.50%',
    yoyChange: '-108.50%',
    remark: '冠脉导丝、外周血管导丝、肾动脉导丝、介入软硬导丝等'
  },
  {
    key: 'ear-implant',
    categoryName: '耳内假体',
    amount: 220000,
    yoyRate: '208.50%',
    yoyChange: '-208.50%',
    remark: '镫骨假体、鼓室成形假体、中耳通风管、人工听骨等'
  },
  {
    key: 'maxillofacial',
    categoryName: '颌面部髁复及修复重建材料及制品',
    amount: 150000,
    yoyRate: '308.50%',
    yoyChange: '-308.50%',
    remark: '颌面硅橡胶唇复体、树脂修复假体、颌面植入修复材料'
  },
  {
    key: 'spine',
    categoryName: '脊柱椎体间固定/置换系统',
    amount: 120000,
    yoyRate: '408.50%',
    yoyChange: '-408.50%',
    remark: '颈椎/胸腰椎钉棒系统、椎间融合器、人工椎间盘、脊柱前路固定板'
  },
  {
    key: 'hemostatic',
    categoryName: '可吸收外科止血材料',
    amount: 180000,
    yoyRate: '508.50%',
    yoyChange: '-508.50%',
    remark: '胶原蛋白海绵、可吸收止血微球、壳聚糖止血敷料等植入类止血耗材'
  },
  {
    key: 'hip',
    categoryName: '髋关节假体',
    amount: 350000,
    yoyRate: '608.50%',
    yoyChange: '-608.50%',
    remark: '全髋 / 半髋人工关节、股骨柄、髋臼杯、陶瓷内衬、髋关节配套配件'
  },
  {
    key: 'skull',
    categoryName: '颅骨矫形器械',
    amount: 80000,
    yoyRate: '708.50%',
    yoyChange: '-708.50%',
    remark: '颅骨钛网、颅骨固定螺钉、颅颌面整形修复植入物'
  },
  {
    key: 'bur',
    categoryName: '刨骨器',
    amount: 50000,
    yoyRate: '808.50%',
    yoyChange: '-808.50%',
    remark: '骨科关节镜刨削刀头、动力刨削系统、磨骨钻头等一次性刨削耗材'
  },
  {
    key: 'balloon',
    categoryName: '球囊扩张导管',
    amount: 30000,
    yoyRate: '908.50%',
    yoyChange: '-908.50%',
    remark: '冠脉球囊、外周血管球囊、肺动脉 / 肾动脉扩张球囊、PTCA 导管'
  },
  {
    key: 'bracket',
    categoryName: '托槽',
    amount: 30000,
    yoyRate: '1008.50%',
    yoyChange: '-1008.50%',
    remark: '口腔正畸金属托槽、陶瓷托槽、自锁托槽及正畸配套附件'
  },
  {
    key: 'stapler',
    categoryName: '吻合器(带钉)',
    amount: 30000,
    yoyRate: '1108.50%',
    yoyChange: '-1108.50%',
    remark: '消化道吻合器、血管吻合器、皮肤闭合吻合钉、腔镜切割吻合器'
  },
  {
    key: 'stent',
    categoryName: '血管支架',
    amount: 30000,
    yoyRate: '1208.50%',
    yoyChange: '-1208.50%',
    remark: '冠脉药物支架、裸支架、外周血管支架、颅内支架、颈动脉支架、覆膜支架'
  },
  {
    key: 'penile',
    categoryName: '阴茎假体',
    amount: 30000,
    yoyRate: '1308.50%',
    yoyChange: '-1308.50%',
    remark: '男性勃起功能障碍植入式人工假体、支撑假体套件'
  },
  {
    key: 'neurostim',
    categoryName: '植入式神经刺激器',
    amount: 30000,
    yoyRate: '1408.50%',
    yoyChange: '-1408.50%',
    remark: '脑深部电刺激、脊髓刺激器、迷走神经刺激植入系统及电极'
  },
  {
    key: 'icd',
    categoryName: '植入式心律转复除颤器(ICD)',
    amount: 30000,
    yoyRate: '1508.50%',
    yoyChange: '-1508.50%',
    remark: '心脏除颤器、三腔起搏器、植入式心电监测起搏电极套件'
  },
  {
    key: 'infusion',
    categoryName: '植入式药物输注设备',
    amount: 30000,
    yoyRate: '1608.50%',
    yoyChange: '-1608.50%',
    remark: '植入式镇痛泵、化疗药物缓释输注植入装置、皮下给药储药系统'
  },
  {
    key: 'vertebroplasty',
    categoryName: '椎体成形导引系统',
    amount: 30000,
    yoyRate: '1708.50%',
    yoyChange: '-1708.50%',
    remark: 'PVP/PKP 椎体成形穿刺针、扩张球囊、骨水泥输送套件、导向器械'
  }
]

/** 效能分析指标（静态展示，后续对接接口） */
const KPI_DEFINITIONS = [
  {
    key: 'totalConsumeAmount',
    label: '耗材总消耗金额',
    unit: '元',
    currentValue: '12,580,000.00',
    previousValue: '11,920,000.00',
    compareRate: '+5.52% 同比',
    targetValue: '12,000,000.00',
    diffValue: '+580,000.00',
    status: '未达标',
    remark: '高值耗材消耗占比上升'
  },
  {
    key: 'inventoryTurnoverDays',
    label: '库存周转天数',
    unit: '天',
    currentValue: '28',
    previousValue: '32',
    compareRate: '-12.50% 同比',
    targetValue: '30',
    diffValue: '-2 天',
    status: '达标',
    remark: '周转效率提升'
  },
  {
    key: 'expiredScrapRate',
    label: '过期报废率',
    unit: '%',
    currentValue: '1.20',
    previousValue: '1.45',
    compareRate: '-17.24% 同比',
    targetValue: '1.50',
    diffValue: '-0.30%',
    status: '达标',
    remark: '近效期预警执行良好'
  },
  {
    key: 'deliveryOnTimeRate',
    label: '配送准时率',
    unit: '%',
    currentValue: '96.50',
    previousValue: '95.20',
    compareRate: '+1.36% 同比',
    targetValue: '98.00',
    diffValue: '-1.50%',
    status: '未达标',
    remark: '部分供应商延迟'
  },
  {
    key: 'hisReconcileDiffRate',
    label: 'HIS对账差异率',
    unit: '%',
    currentValue: '0.80',
    previousValue: '1.10',
    compareRate: '-27.27% 同比',
    targetValue: '1.00',
    diffValue: '-0.20%',
    status: '达标',
    remark: '对账差异逐月收敛'
  },
  {
    key: 'deptInventoryAmount',
    label: '科室库存占用总金额',
    unit: '元',
    currentValue: '3,240,000.00',
    previousValue: '3,580,000.00',
    compareRate: '-9.50% 同比',
    targetValue: '3,500,000.00',
    diffValue: '-260,000.00',
    status: '达标',
    remark: '科室控费执行到位'
  },
  {
    key: 'highValueCostRatio',
    label: '高值耗材占总成本比例',
    unit: '%',
    currentValue: '32.60',
    previousValue: '30.80',
    compareRate: '+5.84% 同比',
    targetValue: '30.00',
    diffValue: '+2.60%',
    status: '未达标',
    remark: '高值使用需加强管控'
  }
]

const CATEGORY_ROWS = [
  {
    key: 'low',
    label: '低值耗材',
    currentAmount: '450,000.00',
    ratio: '35.16%',
    previousAmount: '420,000.00',
    chainChange: '7.14%',
    remark: '含注射器、输液器等',
    pieValue: 450000
  },
  {
    key: 'high',
    label: '高值耗材',
    currentAmount: '540,000.00',
    ratio: '42.19%',
    previousAmount: '480,000.00',
    chainChange: '12.50%',
    remark: '含介入、骨科植入等',
    pieValue: 540000
  },
  {
    key: 'reagent',
    label: '检验试剂',
    currentAmount: '180,000.00',
    ratio: '14.06%',
    previousAmount: '160,000.00',
    chainChange: '12.50%',
    remark: '含生化、免疫试剂',
    pieValue: 180000
  },
  {
    key: 'surgical',
    label: '手术套包',
    currentAmount: '110,000.00',
    ratio: '8.59%',
    previousAmount: '100,000.00',
    chainChange: '10.00%',
    remark: '含手术室专用套包',
    pieValue: 110000
  }
]

function defaultYear() {
  return parseTime(new Date(), '{y}')
}

export default {
  name: 'EfficiencyAnalysisReport',
  components: { DataCenterTopDecoration },
  data() {
    return {
      metricColumns: METRIC_COLUMNS,
      categoryColumns: CATEGORY_COLUMNS,
      trendColumns: TREND_COLUMNS,
      deptCostColumns: DEPT_COST_COLUMNS,
      deptCostRows: DEPT_COST_ROWS,
      spdEfficiencyColumns: SPD_EFFICIENCY_COLUMNS,
      spdEfficiencyRows: SPD_EFFICIENCY_ROWS,
      keyMaterialColumns: KEY_MATERIAL_COLUMNS,
      keyMaterialRows: KEY_MATERIAL_ROWS,
      categoryRows: CATEGORY_ROWS,
      queryParams: {
        year: defaultYear()
      },
      displayYear: defaultYear(),
      categoryPieInstance: null,
      categoryTrendLineInstance: null
    }
  },
  computed: {
    kpiList() {
      return KPI_DEFINITIONS
    },
    displayPeriod() {
      return `${this.displayYear}年1-12月`
    },
    displayDeptPeriod() {
      return `${this.displayYear}年${this.displayMonth}月`
    },
    displayMonth() {
      const now = new Date()
      const year = Number(this.displayYear)
      if (year === now.getFullYear()) {
        return now.getMonth() + 1
      }
      return 12
    },
    deptCostTotal() {
      return DEPT_COST_ROWS.reduce((sum, row) => sum + row.amount, 0)
    },
    categoryTotal() {
      return {
        currentAmount: '1,280,000.00',
        previousAmount: '1,160,000.00',
        ratio: '100.00%'
      }
    },
    trendRows() {
      return MONTHLY_TREND_ROWS.map(row => ({
        ...row,
        monthLabel: `${this.displayYear}-${row.month}`,
        total: row.low + row.high + row.reagent + row.surgical
      }))
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.renderCategoryPie()
      this.renderCategoryTrendLine()
      window.addEventListener('resize', this.handleChartResize)
    })
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleChartResize)
    if (this.categoryPieInstance) {
      this.categoryPieInstance.dispose()
      this.categoryPieInstance = null
    }
    if (this.categoryTrendLineInstance) {
      this.categoryTrendLineInstance.dispose()
      this.categoryTrendLineInstance = null
    }
  },
  methods: {
    formatMoney(value) {
      const num = Number(value)
      if (Number.isNaN(num)) {
        return '0.00'
      }
      return num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    },
    formatMetricValue(item, field) {
      const val = item[field]
      if (val == null || val === '') {
        return '—'
      }
      const unit = item.unit
      if (field === 'currentValue' || field === 'previousValue' || field === 'targetValue') {
        if (unit === '元') {
          return val
        }
        if (unit === '%') {
          return val + '%'
        }
        if (unit === '天') {
          return val + ' 天'
        }
      }
      return val
    },
    compareClass(text, isDiff) {
      if (!text) {
        return ''
      }
      const s = String(text)
      if (s.startsWith('+')) {
        return isDiff ? 'metric-negative' : 'metric-positive'
      }
      if (s.startsWith('-')) {
        return isDiff ? 'metric-positive' : 'metric-negative'
      }
      return ''
    },
    chainCompareClass(text) {
      if (!text || text === '—') {
        return ''
      }
      const num = parseFloat(String(text).replace('%', ''))
      if (num > 0) {
        return 'metric-positive'
      }
      if (num < 0) {
        return 'metric-negative'
      }
      return ''
    },
    deptChangeClass(text) {
      if (!text || text === '—') {
        return ''
      }
      const num = parseFloat(String(text).replace('%', '').replace('+', ''))
      if (String(text).startsWith('+') || num > 0) {
        return 'metric-negative'
      }
      if (String(text).startsWith('-') || num < 0) {
        return 'metric-positive'
      }
      return ''
    },
    handleChartResize() {
      if (this.categoryPieInstance) {
        this.categoryPieInstance.resize()
      }
      if (this.categoryTrendLineInstance) {
        this.categoryTrendLineInstance.resize()
      }
    },
    renderCategoryPie() {
      const el = this.$refs.categoryPieRef
      if (!el) {
        return
      }
      if (this.categoryPieInstance) {
        this.categoryPieInstance.dispose()
      }
      this.categoryPieInstance = echarts.init(el)
      const data = this.categoryRows.map((row, index) => ({
        name: row.label,
        value: row.pieValue,
        itemStyle: { color: PIE_COLORS[index % PIE_COLORS.length] }
      }))
      this.categoryPieInstance.setOption({
        color: PIE_COLORS,
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {d}%'
        },
        legend: {
          show: false
        },
        series: [
          {
            type: 'pie',
            radius: ['32%', '52%'],
            center: ['50%', '54%'],
            avoidLabelOverlap: true,
            minShowLabelAngle: 5,
            label: {
              show: true,
              position: 'outside',
              formatter: '{b}: {d}%',
              fontSize: 11,
              color: '#606266',
              lineHeight: 16,
              overflow: 'none',
              width: 120
            },
            labelLine: {
              show: true,
              length: 12,
              length2: 10,
              smooth: true,
              lineStyle: { color: '#909399' }
            },
            emphasis: {
              label: {
                show: true,
                fontWeight: 'bold'
              }
            },
            data
          }
        ]
      })
    },
    renderCategoryTrendLine() {
      const el = this.$refs.categoryTrendLineRef
      if (!el) {
        return
      }
      if (this.categoryTrendLineInstance) {
        this.categoryTrendLineInstance.dispose()
      }
      this.categoryTrendLineInstance = echarts.init(el)
      const months = this.trendRows.map(row => row.monthLabel)
      const series = TREND_LINE_SERIES.map(item => ({
        name: item.name,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 2, color: item.color },
        itemStyle: { color: item.color },
        data: this.trendRows.map(row => row[item.key])
      }))
      const maxValue = Math.max(
        ...this.trendRows.flatMap(row => [row.low, row.high, row.reagent, row.surgical])
      )
      const yMax = Math.ceil(maxValue / 100000) * 100000
      this.categoryTrendLineInstance.setOption({
        tooltip: {
          trigger: 'axis',
          formatter(params) {
            if (!params || !params.length) {
              return ''
            }
            let html = `${params[0].axisValue}<br/>`
            params.forEach(p => {
              const val = Number(p.value).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })
              html += `${p.marker}${p.seriesName}：¥${val}<br/>`
            })
            return html
          }
        },
        legend: {
          top: 4,
          left: 'center',
          itemWidth: 14,
          itemHeight: 8,
          textStyle: { fontSize: 12, color: '#606266' }
        },
        grid: {
          left: 56,
          right: 20,
          top: 48,
          bottom: 52
        },
        xAxis: {
          type: 'category',
          name: '月份',
          nameLocation: 'middle',
          nameGap: 32,
          nameTextStyle: { fontSize: 12, color: '#606266' },
          boundaryGap: false,
          data: months,
          axisLine: { lineStyle: { color: '#dcdfe6' } },
          axisLabel: {
            color: '#606266',
            fontSize: 11,
            interval: 0,
            rotate: 35
          }
        },
        yAxis: {
          type: 'value',
          name: '消耗金额(元)',
          nameTextStyle: { fontSize: 12, color: '#606266' },
          min: 0,
          max: yMax,
          interval: yMax / 6,
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { color: '#ebeef5', type: 'dashed' } },
          axisLabel: {
            color: '#606266',
            fontSize: 12,
            formatter(value) {
              return value.toLocaleString('en-US')
            }
          }
        },
        series
      })
    },
    handleQuery() {
      this.displayYear = this.queryParams.year || defaultYear()
      this.$nextTick(() => {
        this.renderCategoryPie()
        this.renderCategoryTrendLine()
      })
    },
    resetQuery() {
      this.queryParams.year = defaultYear()
      this.displayYear = defaultYear()
      this.$nextTick(() => {
        this.renderCategoryPie()
        this.renderCategoryTrendLine()
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.efficiency-analysis-page {
  height: calc(100vh - 84px);
  max-height: calc(100vh - 84px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
  box-sizing: border-box;
}

.efficiency-analysis-sticky {
  flex-shrink: 0;
  padding: 0 16px;
}

.efficiency-analysis-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 16px 20px;
  scrollbar-width: thin;
  scrollbar-color: #c0c0c0 #f0f2f5;
}

.efficiency-analysis-scroll::-webkit-scrollbar {
  width: 6px;
}

.efficiency-analysis-scroll::-webkit-scrollbar-track {
  background: #f0f2f5;
}

.efficiency-analysis-scroll::-webkit-scrollbar-thumb {
  background: #c0c0c0;
  border-radius: 3px;
}

.efficiency-analysis-scroll::-webkit-scrollbar-thumb:hover {
  background: #a0a0a0;
}

.form-fields-container {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 14px 16px 6px;
  margin-bottom: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.kpi-section,
.category-section,
.dept-cost-section,
.spd-efficiency-section,
.key-material-section {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px 16px 16px;
  margin-top: 12px;
  margin-bottom: 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.kpi-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  padding-left: 2px;
}

.kpi-metrics-table,
.category-metrics-table {
  width: 100%;
  border: 1px solid #e8ecf2;
  border-radius: 4px;
  overflow: hidden;
}

.kpi-metrics-row,
.category-metrics-row {
  display: grid;
  align-items: center;
}

.kpi-metrics-row {
  grid-template-columns: 1.4fr 1.1fr 1.1fr 1fr 1fr 1fr 0.9fr 1.5fr;
}

.category-metrics-row {
  grid-template-columns: 1.1fr 1.2fr 1fr 1.2fr 0.9fr 1.4fr;
}

.kpi-metrics-row--head,
.category-metrics-row--head {
  background: #5b9bd5;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
}

.kpi-metrics-row--body,
.category-metrics-row--body {
  font-size: 13px;
  color: #303133;
  min-height: 44px;
  border-top: 1px solid #ebeef5;
}

.kpi-metrics-row--alt,
.category-metrics-row--alt {
  background: #f0f5fa;
}

.kpi-metrics-row--plain,
.category-metrics-row--plain {
  background: #fff;
}

.category-metrics-row--total {
  background: #d9d9d9;
  font-weight: 600;
  font-size: 13px;
  min-height: 44px;
  border-top: 1px solid #c0c4cc;
}

.kpi-metrics-cell,
.category-metrics-cell {
  padding: 10px 12px;
  text-align: center;
  border-right: 1px solid rgba(255, 255, 255, 0.25);
  line-height: 1.4;
}

.kpi-metrics-row--body .kpi-metrics-cell,
.category-metrics-row--body .category-metrics-cell,
.category-metrics-row--total .category-metrics-cell {
  border-right: 1px solid #ebeef5;
}

.kpi-metrics-row .kpi-metrics-cell:last-child,
.category-metrics-row .category-metrics-cell:last-child {
  border-right: none;
}

.kpi-metrics-cell--label,
.category-metrics-cell--label {
  text-align: left;
  font-weight: 600;
  color: #303133;
}

.kpi-metrics-cell--value {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  color: #008cff;
}

.category-metrics-cell--money,
.category-metrics-cell--ratio {
  font-variant-numeric: tabular-nums;
  color: #303133;
}

.kpi-metrics-cell--remark,
.category-metrics-cell--remark {
  color: #606266;
  font-size: 12px;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kpi-metrics-cell--status {
  display: flex;
  align-items: center;
  justify-content: center;
}

.metric-positive {
  color: #67c23a;
  font-weight: 600;
}

.metric-negative {
  color: #f56c6c;
  font-weight: 600;
}

/* 耗材分类区块 */
.category-body {
  display: flex;
  gap: 12px;
  align-items: stretch;
  overflow: visible;
}

.dept-cost-table {
  width: 100%;
  border: 1px solid #e8ecf2;
  border-radius: 4px;
  overflow: hidden;
}

.dept-cost-row {
  display: grid;
  grid-template-columns: 1fr 1.35fr 1.3fr 1fr 0.9fr 1fr 1.2fr;
  align-items: center;
}

.dept-cost-row--head {
  background: #5b9bd5;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
}

.dept-cost-row--body {
  font-size: 13px;
  color: #303133;
  min-height: 42px;
  border-top: 1px solid #ebeef5;
}

.dept-cost-row--alt {
  background: #f0f5fa;
}

.dept-cost-row--plain {
  background: #fff;
}

.dept-cost-row--total {
  background: #d9d9d9;
  font-weight: 600;
  font-size: 13px;
  min-height: 42px;
  border-top: 1px solid #c0c4cc;
}

.dept-cost-cell {
  padding: 10px 12px;
  text-align: center;
  border-right: 1px solid rgba(255, 255, 255, 0.25);
  line-height: 1.4;
}

.dept-cost-row--body .dept-cost-cell,
.dept-cost-row--total .dept-cost-cell {
  border-right: 1px solid #ebeef5;
}

.dept-cost-row .dept-cost-cell:last-child {
  border-right: none;
}

.dept-cost-cell--label {
  text-align: left;
  font-weight: 600;
  color: #303133;
}

.dept-cost-cell--money {
  font-variant-numeric: tabular-nums;
  color: #303133;
}

.dept-cost-cell--warning {
  font-weight: 600;
}

.dept-warning--normal {
  color: #67c23a;
}

.dept-warning--exceeded {
  color: #f56c6c;
}

.dept-cost-cell--remark {
  color: #606266;
  font-size: 12px;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spd-efficiency-table {
  width: 100%;
  border: 1px solid #e8ecf2;
  border-radius: 4px;
  overflow: hidden;
}

.spd-efficiency-row {
  display: grid;
  grid-template-columns: 1.5fr 0.9fr 0.9fr 0.85fr 2.2fr;
  align-items: center;
}

.spd-efficiency-row--head {
  background: #5b9bd5;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
}

.spd-efficiency-row--body {
  font-size: 13px;
  color: #303133;
  min-height: 44px;
  border-top: 1px solid #ebeef5;
}

.spd-efficiency-row--alt {
  background: #f0f5fa;
}

.spd-efficiency-row--plain {
  background: #fff;
}

.spd-efficiency-cell {
  padding: 10px 12px;
  text-align: center;
  border-right: 1px solid rgba(255, 255, 255, 0.25);
  line-height: 1.4;
}

.spd-efficiency-row--body .spd-efficiency-cell {
  border-right: 1px solid #ebeef5;
}

.spd-efficiency-row .spd-efficiency-cell:last-child {
  border-right: none;
}

.spd-efficiency-cell--label {
  text-align: left;
  font-weight: 600;
  color: #303133;
}

.spd-efficiency-cell--value {
  font-variant-numeric: tabular-nums;
  color: #008cff;
  font-weight: 500;
}

.spd-improvement-rate {
  color: #67c23a;
  font-weight: 600;
}

.spd-efficiency-cell--remark {
  color: #606266;
  font-size: 12px;
  text-align: left;
}

.key-material-table {
  width: 100%;
  border: 1px solid #e8ecf2;
  border-radius: 4px;
  overflow: hidden;
}

.key-material-row {
  display: grid;
  grid-template-columns: 1.5fr 1.25fr 1.1fr 0.95fr 2.4fr;
  align-items: center;
}

.key-material-row--head {
  background: #5b9bd5;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
}

.key-material-row--body {
  font-size: 13px;
  color: #303133;
  min-height: 44px;
  border-top: 1px solid #ebeef5;
}

.key-material-row--alt {
  background: #f0f5fa;
}

.key-material-row--plain {
  background: #fff;
}

.key-material-cell {
  padding: 10px 12px;
  text-align: center;
  border-right: 1px solid rgba(255, 255, 255, 0.25);
  line-height: 1.4;
}

.key-material-row--body .key-material-cell {
  border-right: 1px solid #ebeef5;
}

.key-material-row .key-material-cell:last-child {
  border-right: none;
}

.key-material-cell--label {
  text-align: left;
  font-weight: 600;
  color: #303133;
}

.key-material-cell--money {
  font-variant-numeric: tabular-nums;
  color: #303133;
}

.key-material-cell--remark {
  color: #606266;
  font-size: 12px;
  text-align: left;
  white-space: normal;
  line-height: 1.5;
}

.category-chart-panel {
  flex: 0 0 460px;
  min-width: 460px;
  border: 1px solid #e8ecf2;
  border-radius: 4px;
  background: #fafbfc;
  padding: 12px 10px 8px;
  overflow: visible;
}

.category-chart-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  text-align: center;
  margin-bottom: 4px;
}

.category-pie {
  width: 100%;
  height: 300px;
  overflow: visible;
}

.category-table-panel {
  flex: 1;
  min-width: 0;
}

.category-trend-body {
  display: flex;
  gap: 12px;
  align-items: stretch;
  margin-top: 16px;
}

.category-trend-table-panel {
  flex: 1;
  min-width: 0;
  max-width: 48%;
}

.category-trend-chart-panel {
  flex: 1.35;
  min-width: 520px;
  border: 1px solid #e8ecf2;
  border-radius: 4px;
  background: #fafbfc;
  padding: 12px 12px 8px;
}

.category-trend-line {
  width: 100%;
  height: 420px;
}

.trend-metrics-table {
  width: 100%;
  border: 1px solid #e8ecf2;
  border-radius: 4px;
  overflow: hidden;
}

.trend-metrics-row {
  display: grid;
  grid-template-columns: 0.85fr 1fr 1fr 1fr 1fr 1fr;
  align-items: center;
}

.trend-metrics-row--head {
  background: #5b9bd5;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
}

.trend-metrics-row--body {
  font-size: 12px;
  color: #303133;
  min-height: 36px;
  border-top: 1px solid #ebeef5;
}

.trend-metrics-row--alt {
  background: #f0f5fa;
}

.trend-metrics-row--plain {
  background: #fff;
}

.trend-metrics-cell {
  padding: 6px 8px;
  text-align: center;
  border-right: 1px solid rgba(255, 255, 255, 0.25);
  line-height: 1.4;
}

.trend-metrics-row--body .trend-metrics-cell {
  border-right: 1px solid #ebeef5;
}

.trend-metrics-row .trend-metrics-cell:last-child {
  border-right: none;
}

.trend-metrics-cell--label {
  text-align: left;
  font-weight: 600;
  color: #303133;
}

.trend-metrics-cell--money {
  font-variant-numeric: tabular-nums;
  color: #303133;
}

.trend-metrics-cell--total {
  font-weight: 600;
}

@media (max-width: 1200px) {
  .category-body {
    flex-direction: column;
  }

  .category-chart-panel {
    flex: none;
    width: 100%;
    min-width: 0;
  }

  .category-trend-body {
    flex-direction: column;
  }

  .category-trend-table-panel {
    max-width: none;
  }

  .category-trend-chart-panel {
    flex: none;
    width: 100%;
    min-width: 0;
  }

  .kpi-metrics-row {
    grid-template-columns: 1.2fr 1fr 1fr 1fr;
  }

  .kpi-metrics-row--head .kpi-metrics-cell:nth-child(n + 5),
  .kpi-metrics-row--body .kpi-metrics-cell:nth-child(n + 5) {
    border-top: 1px solid rgba(255, 255, 255, 0.25);
  }

  .kpi-metrics-row--body .kpi-metrics-cell:nth-child(n + 5) {
    border-top: 1px solid #ebeef5;
  }
}
</style>
