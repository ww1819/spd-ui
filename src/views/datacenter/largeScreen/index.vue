<template>
  <div id="index" ref="appRef">
    <div class="bg">
      <dv-loading v-show="loading">Loading...</dv-loading>
      <div class="host-body">
        <div>
          <!-- 顶部title部分 -->
          <el-row>
            <el-col :span="6"
            ><dv-decoration-8
              class="title_right"
              :color="['#008CFF', '#00ADDD']"
            /></el-col>
            <el-col :span="12"
            ><div class="title_text">数 据 可 视 化 系 统</div>
              <dv-decoration-5
                class="title_center"
                :color="['#008CFF', '#00ADDD']"
              /></el-col>
            <el-col :span="6"
            ><div class="title_time">{{ dateYear + dateWeek + dateDay }}</div>
              <div class="title_controls">
                <el-button 
                  type="primary" 
                  size="small" 
                  icon="el-icon-full-screen" 
                  @click="toggleFullscreen"
                  class="fullscreen-btn"
                >
                  {{ isFullscreen ? '退出全屏' : '全屏显示' }}
                </el-button>
              </div>
              <dv-decoration-8
                :reverse="true"
                class="title_left"
                :color="['#008CFF', '#00ADDD']"
              /></el-col>
          </el-row>
          <!-- 主体部分 -->
          <el-row>
            <!-- 第一列 -->
            <el-col :span="6">
              <!-- 饼图部分 -->
              <div class="left_box1">
                <dv-border-box-12>
                  <div id="Rose_diagram"></div>
                  <dv-active-ring-chart
                    :config="ring_chart_config"
                    class="left_box1_rose_right"
                  />
                  <div
                    class="rose_text"
                    v-for="(item, index) in numberData"
                    :key="index"
                  >
                    <p>
                      <span v-if="item.showCurrency" class="coin">￥</span>
                      <span class="rose_text_nmb">{{
                          item.number.number
                        }}</span>
                    </p>
                    <p>
                      <span>{{ item.text }}</span>
                      <span class="colorYellow">{{ item.unitSuffix || "(件)" }}</span>
                    </p>
                  </div>
                </dv-border-box-12>
              </div>
              <!-- 柱状图部分 -->
              <div class="left_box2">
                <dv-border-box-12 style="padding-top: 10px">
                  <p style="margin-left: 15px">高值消耗统计图</p>
                  <div id="columnar"></div>
                </dv-border-box-12>
              </div>
              <!-- 供应商排行（与右侧科室领用排名同一标题样式） -->
              <div class="left_box3">
                <dv-border-box-12 :reverse="true">
                  <div class="cone_title">本月供应商排行TOP10</div>
                  <div class="cone_chart_wrapper">
                    <dv-scroll-board
                      :config="board_info"
                      class="carousel_list"
                    />
                  </div>
                </dv-border-box-12>
              </div>
            </el-col>
            <!-- 第二列 -->
            <el-col :span="12">
              <!-- 统计框区域（替换地图位置） -->
              <div class="stats_container_map">
                <dv-border-box-8 class="stats_box">
                  <div class="stats_label">验收总金额</div>
                  <div class="stats_value">￥{{ statsData.acceptanceAmount }}</div>
                </dv-border-box-8>
                <dv-border-box-8 class="stats_box">
                  <div class="stats_label">出库总金额</div>
                  <div class="stats_value">￥{{ statsData.outboundAmount }}</div>
                </dv-border-box-8>
                <dv-border-box-8 class="stats_box">
                  <div class="stats_label">消耗总金额</div>
                  <div class="stats_value">￥{{ statsData.consumptionAmount }}</div>
                </dv-border-box-8>
                <dv-border-box-8 class="stats_box">
                  <div class="stats_label">验收总数量</div>
                  <div class="stats_value">{{ statsData.acceptanceQuantity }}<span class="stats_unit">件</span></div>
                </dv-border-box-8>
                <dv-border-box-8 class="stats_box">
                  <div class="stats_label">出库总数量</div>
                  <div class="stats_value">{{ statsData.outboundQuantity }}<span class="stats_unit">件</span></div>
                </dv-border-box-8>
                <dv-border-box-8 class="stats_box">
                  <div class="stats_label">消耗总数量</div>
                  <div class="stats_value">{{ statsData.consumptionQuantity }}<span class="stats_unit">件</span></div>
                </dv-border-box-8>
              </div>
              <!-- 折线图 -->
              <div class="line_center">
                <dv-border-box-8>
                  <div id="line_center_diagram"></div>
                </dv-border-box-8>
              </div>
            </el-col>
            <!-- 第三列 -->
            <el-col :span="6">
              <!-- 轮播排行榜部分 -->
              <div class="right_box1">
                <dv-border-box-12>
                  <dv-decoration-7 style="width: 100%; height: 30px"
                  >耗 材 排 行 榜</dv-decoration-7
                  >
                  <dv-scroll-ranking-board
                    :config="consumables_ranking_config"
                    style="width: 95%; height: 87%; margin-left: 2%"
                  />
                </dv-border-box-12>
              </div>
              <!-- 虚线柱状图部分 -->
              <div class="right_box2">
                <dv-border-box-12 :reverse="true">
                  <div id="dotter_bar"></div>
                </dv-border-box-12>
              </div>
              <!-- 科室领用排名（轮播表展示全部科室，避免锥形图科室过多重叠） -->
              <div class="right_box3">
                <dv-border-box-12 :reverse="true">
                  <div class="cone_title">科室领用排名</div>
                  <div class="cone_chart_wrapper">
                    <dv-scroll-board
                      :config="dept_rank_board"
                      class="dept_rank_list"
                    />
                  </div>
                </dv-border-box-12>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import drawMixin from "@/utils/drawMixin"; //自适应缩放
import { formatTimeDT } from "@/utils"; //日期格式转换
import * as echarts from "echarts";
import { listdepart } from "@/api/foundation/depart";
import { outboundSummaryByDepartment, biScreenConsumablesTotals, biScreenInboundSupplierTop10, biScreenInboundDailyHighLowValue, biScreenOutboundMaterialMonthTop, biScreenInboundFinanceCategoryMonth, biScreenTodayInboundOutboundBillCount, biScreenYearInboundReturnByMonth } from "@/api/warehouse/warehouse";
export default {
  mixins: [drawMixin],
  data() {
    return {
      //定时器
      timing: null,
      //loading图
      loading: true,
      //全屏状态
      isFullscreen: false,
      //时分秒
      dateDay: null,
      //年月日
      dateYear: null,
      //周几
      dateWeek: null,
      //周几
      weekday: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
      // 左侧圆环图（与耗材排行配置分离；数据与玫瑰饼图同源：当月财务分类入库金额）
      ring_chart_config: {
        data: [{ name: "加载中", value: 1 }],
        lineWidth: 18,
        activeTimeGap: 2800,
      },
      // 右侧耗材排行榜（独立 config，勿与左侧圆环 ring_chart_config 混用）
      consumables_ranking_config: {
        data: [],
        rowNum: 6,
        sort: true,
        unit: "",
        valueFormatter: null,
      },
      //左侧饼图下方三项：前两项为今日出库/入退货单据笔数（次），第三项仍为占位展示
      numberData: [
        {
          number: { number: 0 },
          text: "今日配送总单",
          showCurrency: false,
          unitSuffix: "(次)",
        },
        {
          number: { number: 0 },
          text: "今日验收总量",
          showCurrency: false,
          unitSuffix: "(次)",
        },
        {
          number: { number: 361 },
          text: "正在编译数量",
          showCurrency: true,
          unitSuffix: "(件)",
        },
      ],
      //左侧轮播表格：本月供应商配送金额 TOP10（两列：名称 + 金额；首列加宽由 columnWidth 控制）
      board_info: {
        header: ["供应商", "金额"],
        data: [],
        headerBGC: "transparent",
        evenRowBGC: "transparent",
        oddRowBGC: "transparent",
        rowNum: 10,
        columnWidth: [250],
        waitTime: 2500,
        headerHeight: 36,
        align: ["left", "right"]
      },
      // 定义颜色
      colorList: {
        linearYtoG: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 1,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: "#f5b44d",
            },
            {
              offset: 1,
              color: "#28f8de",
            },
          ],
        },
        linearGtoB: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 1,
          y2: 0,
          colorStops: [
            {
              offset: 0,
              color: "#43dfa2",
            },
            {
              offset: 1,
              color: "#28f8de",
            },
          ],
        },
        linearBtoG: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 1,
          y2: 0,
          colorStops: [
            {
              offset: 0,
              color: "#1c98e8",
            },
            {
              offset: 1,
              color: "#28f8de",
            },
          ],
        },
        areaBtoG: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: "rgba(35,184,210,.2)",
            },
            {
              offset: 1,
              color: "rgba(35,184,210,0)",
            },
          ],
        },
      },
      //右侧科室领用排名：轮播表（与接口当月出退库汇总一致，展示全部科室）
      dept_rank_board: {
        header: ["科室", "金额"],
        data: [],
        headerBGC: "transparent",
        evenRowBGC: "transparent",
        oddRowBGC: "transparent",
        rowNum: 10,
        columnWidth: [250],
        waitTime: 2500,
        headerHeight: 36,
        align: ["left", "right"]
      },
      //高值消耗柱状图：固定显示5个科室，金额+数量
      columnarCategories: ["手术室", "导管室", "口腔科", "眼科", "骨科"],
      columnarOutboundData: [],
      columnarOutboundQuantity: [],
      //统计数据
      statsData: {
        acceptanceAmount: '0.00',      // 验收总金额
        outboundAmount: '0.00',        // 出库总金额
        consumptionAmount: '0.00',      // 消耗总金额
        acceptanceQuantity: '0',        // 验收总数量
        outboundQuantity: '0',          // 出库总数量
        consumptionQuantity: '0'        // 消耗总数量
      },
    };
  },

  mounted() {
    //获取实时时间
    this.timeFn();
    //加载loading图
    this.cancelLoading();
    //大屏顶部六项：验收/出库/消耗 金额与数量
    this.loadStatsTotals();
    // 左下三项：今日出库单笔数、今日入退货单笔数
    this.loadTodayBillCounts();
    //送货入库前十供应商轮播表
    this.loadSupplierBoard();
    this.loadConsumablesRanking();
    //右侧：科室领用排名（轮播表，全部科室）
    this.loadDepartmentRankBoard();
    //中国地图
    // this.china_map();
    //左侧玫瑰饼图 + 圆环：当月按财务分类入库金额
    this.loadFinanceInboundByCategoryChart();
    //左侧高值消耗柱状图（科室出库数据）
    this.loadColumnarData();
    //中间折线图：当年按月入库/退货金额
    this.loadYearInboundReturnLineChart();
    //虚线柱状图
    this.dotter_bar();
    //监听全屏状态变化
    this.addFullscreenListener();
  },
  beforeDestroy() {
    //离开时删除计时器
    clearInterval(this.timing);
    //移除全屏状态监听
    this.removeFullscreenListener();
    if (this._rosePieOnResize) {
      window.removeEventListener("resize", this._rosePieOnResize);
      this._rosePieOnResize = null;
    }
    if (this._rosePieChart) {
      this._rosePieChart.dispose();
      this._rosePieChart = null;
    }
    if (this._yearLineResize) {
      window.removeEventListener("resize", this._yearLineResize);
      this._yearLineResize = null;
    }
    if (this._yearLineChart) {
      this._yearLineChart.dispose();
      this._yearLineChart = null;
    }
  },
  methods: {
    //全屏切换方法
    toggleFullscreen() {
      if (!document.fullscreenElement) {
        // 进入全屏
        if (this.$refs.appRef.requestFullscreen) {
          this.$refs.appRef.requestFullscreen();
        } else if (this.$refs.appRef.webkitRequestFullscreen) {
          this.$refs.appRef.webkitRequestFullscreen();
        } else if (this.$refs.appRef.mozRequestFullScreen) {
          this.$refs.appRef.mozRequestFullScreen();
        } else if (this.$refs.appRef.msRequestFullscreen) {
          this.$refs.appRef.msRequestFullscreen();
        }
        this.isFullscreen = true;
      } else {
        // 退出全屏
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
        this.isFullscreen = false;
      }
    },
    //添加全屏状态监听
    addFullscreenListener() {
      const fullscreenChangeEvents = [
        'fullscreenchange',
        'webkitfullscreenchange',
        'mozfullscreenchange',
        'MSFullscreenChange'
      ];
      
      fullscreenChangeEvents.forEach(event => {
        document.addEventListener(event, this.handleFullscreenChange);
      });
    },
    //移除全屏状态监听
    removeFullscreenListener() {
      const fullscreenChangeEvents = [
        'fullscreenchange',
        'webkitfullscreenchange',
        'mozfullscreenchange',
        'MSFullscreenChange'
      ];
      
      fullscreenChangeEvents.forEach(event => {
        document.removeEventListener(event, this.handleFullscreenChange);
      });
    },
    //处理全屏状态变化
    handleFullscreenChange() {
      this.isFullscreen = !!document.fullscreenElement;
    },
    //右上角当前日期时间显示：每一秒更新一次最新时间
    timeFn() {
      this.timing = setInterval(() => {
        //获取当前时分秒
        this.dateDay = formatTimeDT(new Date(), "HH: mm: ss");
        //获取当前年月日
        this.dateYear = formatTimeDT(new Date(), "yyyy-MM-dd");
        //获取当前周几
        this.dateWeek = this.weekday[new Date().getDay()];
      }, 1000);
    },
    //loading图
    cancelLoading() {
      setTimeout(() => {
        this.loading = false;
      }, 500);
    },
    /** 大屏左侧：本月送货入库前十供应商（已审核入退货，按金额降序；仅名称+金额两列） */
    loadSupplierBoard() {
      biScreenInboundSupplierTop10()
        .then((res) => {
          const raw = res && res.data;
          const rows = Array.isArray(raw) ? raw : [];
          const data = rows.map((r) => {
            const name = (r.supplierName || r.supplier_name || "—").toString();
            const a = Number(r.totalAmt != null ? r.totalAmt : (r.total_amt != null ? r.total_amt : 0));
            const amtStr = Number.isFinite(a) ? "¥" + a.toFixed(2) : "¥0.00";
            return [name, amtStr];
          });
          const finalData = data.length ? data : [["暂无数据", "¥0.00"]];
          // dv-scroll-board 对 config 深层变更常不刷新，需整体替换引用；rowNum 勿大于 data 行数
          const rowNum = Math.min(10, Math.max(1, finalData.length));
          this.board_info = { ...this.board_info, data: finalData, rowNum };
        })
        .catch(() => {
          this.board_info = {
            ...this.board_info,
            data: [["加载失败", "-"]],
            rowNum: 1
          };
        });
    },
    /** 耗材排行：去掉换行/HTML，控制长度（排行图为 v-html） */
    clipRankingMaterialName(raw) {
      let t = String(raw || "—")
        .replace(/<[^>]*>/g, "")
        .replace(/[\r\n\t]+/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
      const max = 48;
      const arr = Array.from(t);
      if (arr.length <= max) {
        return t;
      }
      return arr.slice(0, max).join("") + "…";
    },
    /** 耗材排行榜：当月出退库按单品金额 TOP（横向条 + 金额，与 DataV 排行图一致） */
    loadConsumablesRanking() {
      const fmt = (item) => {
        const v = Number(item && item.value);
        return Number.isFinite(v) ? "¥" + v.toFixed(2) : "¥0.00";
      };
      biScreenOutboundMaterialMonthTop()
        .then((res) => {
          const rows = Array.isArray(res && res.data) ? res.data : [];
          const data = rows.map((r) => {
            const raw = (r.materialName || r.material_name || "—").toString();
            const name = this.clipRankingMaterialName(raw);
            const v = Number(r.totalAmt != null ? r.totalAmt : r.total_amt);
            return { name, value: Number.isFinite(v) ? v : 0 };
          });
          const finalData = data.length ? data : [{ name: "暂无数据", value: 0 }];
          const rowNum = Math.min(8, Math.max(1, finalData.length));
          this.consumables_ranking_config = {
            ...this.consumables_ranking_config,
            data: finalData,
            sort: true,
            rowNum,
            unit: "",
            valueFormatter: fmt,
          };
        })
        .catch(() => {
          this.consumables_ranking_config = {
            ...this.consumables_ranking_config,
            data: [{ name: "加载失败", value: 0 }],
            sort: true,
            rowNum: 5,
            unit: "",
            valueFormatter: fmt,
          };
        });
    },
    /** 大屏顶部六项统计：全租户已审核入退货、出退库、科室消耗合计 */
    loadStatsTotals() {
      biScreenConsumablesTotals()
        .then((res) => {
          const d = res && res.data;
          if (!d || typeof d !== "object") {
            return;
          }
          const money = (v) => {
            const n = Number(v);
            return Number.isFinite(n) ? n.toFixed(2) : "0.00";
          };
          const qty = (v) => {
            const n = Number(v);
            return Number.isFinite(n) ? String(Math.round(n)) : "0";
          };
          this.statsData.acceptanceAmount = money(d.acceptanceAmount);
          this.statsData.outboundAmount = money(d.outboundAmount);
          this.statsData.consumptionAmount = money(d.consumptionAmount);
          this.statsData.acceptanceQuantity = qty(d.acceptanceQuantity);
          this.statsData.outboundQuantity = qty(d.outboundQuantity);
          this.statsData.consumptionQuantity = qty(d.consumptionQuantity);
        })
        .catch(() => {});
    },
    /** 左下角：今日已审核出库单(201)笔数、今日已审核入库单(101)笔数 */
    loadTodayBillCounts() {
      biScreenTodayInboundOutboundBillCount()
        .then((res) => {
          const d = res && res.data;
          if (!d || typeof d !== "object") {
            return;
          }
          const c = (v) => {
            const n = Number(v != null ? v : 0);
            return Number.isFinite(n) ? Math.round(n) : 0;
          };
          const out = c(d.todayOutboundBillCount != null ? d.todayOutboundBillCount : d.today_outbound_bill_count);
          const inn = c(d.todayInboundBillCount != null ? d.todayInboundBillCount : d.today_inbound_bill_count);
          this.$set(this.numberData[0].number, "number", out);
          this.$set(this.numberData[1].number, "number", inn);
        })
        .catch(() => {});
    },
    /** 高值消耗柱状图：固定五科室，数据为当月出退库汇总（与科室领用排名接口口径一致） */
    loadColumnarData() {
      Promise.all([
        listdepart({ pageNum: 1, pageSize: 200 }),
        outboundSummaryByDepartment()
      ]).then(([deptRes, outboundRes]) => {
        const rows = deptRes.rows || deptRes.data || [];
        const outboundList = outboundRes.data || outboundRes || [];
        const outboundAmountByDeptId = {};
        const outboundQtyByDeptId = {};
        outboundList.forEach(item => {
          const id = item.departmentId != null ? item.departmentId : item.department_id;
          if (id != null) {
            outboundAmountByDeptId[id] = parseFloat(item.outboundAmount || item.outbound_amount || 0) || 0;
            outboundQtyByDeptId[id] = parseInt(item.outboundQuantity || item.outbound_quantity || 0, 10) || 0;
          }
        });
        const nameToId = {};
        rows.forEach(d => {
          const name = d.name || d.departmentName || "";
          const id = d.id != null ? d.id : d.departmentId;
          if (name && id != null) nameToId[name] = id;
        });
        const categories = this.columnarCategories;
        this.columnarOutboundData = categories.map(name => {
          const id = nameToId[name];
          return id != null ? (outboundAmountByDeptId[id] != null ? outboundAmountByDeptId[id] : 0) : 0;
        });
        this.columnarOutboundQuantity = categories.map(name => {
          const id = nameToId[name];
          return id != null ? (outboundQtyByDeptId[id] != null ? outboundQtyByDeptId[id] : 0) : 0;
        });
        this.columnar();
      }).catch(() => {
        this.columnarOutboundData = this.columnarCategories.map(() => 0);
        this.columnarOutboundQuantity = this.columnarCategories.map(() => 0);
        this.columnar();
      });
    },
    /**
     * 科室领用排名：系统全部科室 + 当月出退库金额汇总，轮播表展示（金额高→低，金额为 0 的科室不展示）。
     */
    loadDepartmentRankBoard() {
      Promise.all([
        listdepart({ pageNum: 1, pageSize: 500 }),
        outboundSummaryByDepartment()
      ]).then(([deptRes, outboundRes]) => {
        const rows = deptRes.rows || deptRes.data || [];
        const outboundList = outboundRes.data || outboundRes || [];
        const outboundMap = {};
        outboundList.forEach((item) => {
          const id = item.departmentId != null ? item.departmentId : item.department_id;
          if (id != null) {
            outboundMap[id] = parseFloat(item.outboundAmount || item.outbound_amount || 0) || 0;
          }
        });
        const byId = new Map();
        rows.forEach((dept, index) => {
          const id = dept.id != null ? dept.id : dept.departmentId;
          if (id == null) {
            return;
          }
          const name = dept.name || dept.departmentName || "科室" + (index + 1);
          const v = outboundMap[id] != null ? outboundMap[id] : 0;
          byId.set(id, { name, value: v });
        });
        outboundList.forEach((item) => {
          const id = item.departmentId != null ? item.departmentId : item.department_id;
          if (id == null || byId.has(id)) {
            return;
          }
          const name =
            item.departmentName ||
            item.department_name ||
            "科室" + id;
          const v = parseFloat(item.outboundAmount || item.outbound_amount || 0) || 0;
          byId.set(id, { name, value: v });
        });
        const sorted = Array.from(byId.values())
          .filter((r) => {
            const amt = Number(r.value);
            return Number.isFinite(amt) && amt > 0;
          })
          .sort((a, b) => b.value - a.value);
        const dataRows = sorted.map((r) => {
          const amt = Number(r.value);
          const amtStr = Number.isFinite(amt) ? "¥" + amt.toFixed(2) : "¥0.00";
          return [r.name, amtStr];
        });
        const finalData = dataRows.length ? dataRows : [["暂无数据", "¥0.00"]];
        const rowNum = Math.min(12, Math.max(1, finalData.length));
        this.dept_rank_board = {
          ...this.dept_rank_board,
          data: finalData,
          rowNum: rowNum
        };
      }).catch(() => {
        this.dept_rank_board = {
          ...this.dept_rank_board,
          data: [["加载失败", "-"]],
          rowNum: 1
        };
      });
    },
    //中国地图
    china_map() {
      let mapChart = this.$echarts.init(document.getElementById("china-map")); //图表初始化，china-map是绑定的元素
      window.onresize = mapChart.resize; //如果容器变大小，自适应从新构图
      let series = []; //存放循环配置项
      let res = []; //存放射线的起始点和结束点位置
      let province = []; //存放有射线的省的名字，以此来拿到对应省份的坐标
      //提前存好的所有省份坐标，用于后面根据名字拿到对应的左边
      let chinaGeoCoordMap = {
        新疆: [86.9023, 41.148],
        西藏: [87.8695, 31.6846],
        内蒙古: [110.5977, 41.3408],
        青海: [95.2402, 35.4199],
        四川: [102.9199, 30.1904],
        黑龙江: [128.1445, 46.7156],
        甘肃: [102.7129, 38.166],
        云南: [101.0652, 24.6807],
        广西: [108.7813, 23.6426],
        湖南: [111.5332, 27.3779],
        陕西: [108.5996, 33.7396],
        广东: [113.8668, 22.8076],
        吉林: [126.1746, 43.5938],
        河北: [115.4004, 38.1688],
        湖北: [112.2363, 30.8572],
        贵州: [106.6113, 26.6385],
        山东: [118.2402, 36.2307],
        江西: [115.7156, 27.99],
        河南: [113.0668, 33.8818],
        辽宁: [123.0438, 41.0889],
        山西: [112.4121, 36.6611],
        安徽: [117.2461, 31.0361],
        福建: [118.3008, 25.9277],
        浙江: [120.498, 29.0918],
        江苏: [119.8586, 32.915],
        重庆: [107.7539, 29.8904],
        宁夏: [105.9961, 37.1096],
        海南: [109.9512, 19.2041],
        台湾: [120.8254, 23.5986],
        北京: [116.4551, 40.2539],
        天津: [117.4219, 39.4189],
        上海: [121.4648, 31.2891],
        香港: [114.6178, 22.3242],
        澳门: [113.5547, 21.6484],
      };
      //后台给的数据模拟
      let lineData = [
        {
          val: 32, //数据
          blat: [86.9023, 41.148], //发射点
          elon: [87.8695, 31.6846], //接收点
          bcitysim: "新疆", //发射省的名字
          ecitysim: "西藏", //接收省的名字
        },
        {
          val: 31,
          blat: [87.8695, 31.6846],
          elon: [95.2402, 35.4199],
          bcitysim: "西藏",
          ecitysim: "青海",
        },
        {
          val: 33,
          blat: [86.9023, 41.148],
          elon: [95.2402, 35.4199],
          bcitysim: "新疆",
          ecitysim: "青海",
        },
        {
          val: 33,
          blat: [116.4551, 40.2539],
          elon: [119.8586, 32.915],
          bcitysim: "北京",
          ecitysim: "江苏",
        },
        {
          val: 33,
          blat: [120.8254, 23.5986],
          elon: [109.9512, 19.2041],
          bcitysim: "台湾",
          ecitysim: "海南",
        },
        {
          val: 33,
          blat: [120.498, 29.0918],
          elon: [115.7156, 27.99],
          bcitysim: "浙江",
          ecitysim: "江西",
        },
        {
          val: 33,
          blat: [117.2461, 31.0361],
          elon: [119.8586, 32.915],
          bcitysim: "安徽",
          ecitysim: "江苏",
        },
        {
          val: 33,
          blat: [117.2461, 31.0361],
          elon: [105.9961, 37.1096],
          bcitysim: "安徽",
          ecitysim: "宁夏",
        },
        {
          val: 33,
          blat: [117.2461, 31.0361],
          elon: [107.7539, 29.8904],
          bcitysim: "安徽",
          ecitysim: "重庆",
        },
        {
          val: 33,
          blat: [117.2461, 31.0361],
          elon: [123.0438, 41.0889],
          bcitysim: "安徽",
          ecitysim: "辽宁",
        },
        {
          val: 33,
          blat: [119.8586, 32.915],
          elon: [102.7129, 38.166],
          bcitysim: "江苏",
          ecitysim: "甘肃",
        },
        {
          val: 33,
          blat: [119.8586, 32.915],
          elon: [128.1445, 46.7156],
          bcitysim: "江苏",
          ecitysim: "黑龙江",
        },
        {
          val: 33,
          blat: [119.8586, 32.915],
          elon: [110.5977, 41.3408],
          bcitysim: "江苏",
          ecitysim: "内蒙古",
        },
        {
          val: 33,
          blat: [119.8586, 32.915],
          elon: [101.0652, 24.6807],
          bcitysim: "江苏",
          ecitysim: "云南",
        },
        {
          val: 33,
          blat: [119.8586, 32.915],
          elon: [86.9023, 41.148],
          bcitysim: "江苏",
          ecitysim: "新疆",
        },
        {
          val: 33,
          blat: [86.9023, 41.148],
          elon: [110.5977, 41.3408],
          bcitysim: "新疆",
          ecitysim: "内蒙古",
        },
        {
          val: 33,
          blat: [86.9023, 41.148],
          elon: [102.9199, 30.1904],
          bcitysim: "新疆",
          ecitysim: "四川",
        },
      ];
      //循环拿到处理好的数据
      for (var i = 0; i < lineData.length; i++) {
        province.push(lineData[i].bcitysim); //存进去每个省的名字
        province.push(lineData[i].ecitysim); //存进去每个省的名字
        res.push({
          fromName: lineData[i].bcitysim, //发射的省名，保存用于弹框显示
          toName: lineData[i].ecitysim, //接收的省名，保存用于弹框显示
          coords: [
            lineData[i].blat, //发射
            lineData[i].elon, //接收
          ],
          count: lineData[i].val, //数据
        });
      }
      let index_data = new Set(province); //把省的名字去重
      let data_res = []; //定义一个新的变量存放省的坐标

      //注意这里一定要用name和value的形式。不是这个格式的散点图显示不出来
      index_data.forEach((item) => {
        data_res.push({
          name: item, //每个省的名字
          value: chinaGeoCoordMap[item], //每个省的坐标
        });
      });
      //循环往series内添加配置项
      series.push(
        {
          //射线效果图层
          type: "lines", //类型：射线
          zlevel: 1, //类似图层效果
          effect: {
            show: true, //是否显示图标
            symbol: "arrow", //箭头图标
            symbolSize: 5, //图标大小
            trailLength: 0.02, //特效尾迹长度[0,1]值越大，尾迹越长重
          },
          label: {
            show: true,
          },
          lineStyle: {
            color: "#fff",
            normal: {
              color: "#00A0FF",
              width: 1, //尾迹线条宽度
              opacity: 0.5, //尾迹线条透明度
              curveness: 0.1, //尾迹线条曲直度
            },
          },
          //提示框信息
          tooltip: {
            formatter: function (param) {
              return (
                param.data.fromName +
                ">" +
                param.data.toName +
                "<br>数量：" +
                param.data.count
              );
            },
          },
          data: res, //拿到射线的起始点和结束点
        },
        //散点图
        // {
        //   type: "effectScatter",//散点图
        //   coordinateSystem: "geo",//这个不能删，删了不显示
        //   zlevel: 1,
        //   rippleEffect: {
        //     //涟漪特效
        //     period: 4, //动画时间，值越小速度越快
        //     brushType: "stroke", //波纹绘制方式 stroke, fill
        //     scale: 4, //波纹圆环最大限制，值越大波纹越大
        //   },
        //   //设置文字部分
        //   label: {
        //     normal: {
        //       show: true, //省份名显示隐藏
        //       position: "right", //省份名显示位置
        //       offset: [5, 0], //省份名偏移设置
        //       formatter: function (params) {
        //         //圆环显示省份名
        //         return params.name;  //这个名字是根据data中的name来显示的
        //       },
        //       fontSize: 12,//文字大小
        //     },
        //     emphasis: {
        //       show: true,
        //     },
        //   },
        //   symbol: "circle",//散点图
        //   symbolSize: 5,//散点大小
        //   itemStyle: {//散点样式
        //     normal: {
        //       show: true,
        //       color: "#fff",
        //     },
        //   },
        //   data: data_res, //处理好后的散点图坐标数组
        // },
        //点击高亮
        {
          type: "map",
          mapType: "china",
          zlevel: 1,
          roam: true,
          geoIndex: 0,
          tooltip: {
            show: true,
          },
          itemStyle: {
            areaColor: "#00196d",
            borderColor: "#0a53e9",
          },
          emphasis: {
            show: true,
            label: {
              normal: {
                show: true, // 是否显示对应地名
                textStyle: {
                  color: "#fff",
                },
              },
            },
            itemStyle: {
              areaColor: "#00196d",
              borderColor: "#0a53e9",
            },
          },
        }
      );
      //配置
      let option = {
        //title可要可不要

        // title: {
        //   text: "查查的地图",
        //   textStyle: {
        //     color: "#ffffff",
        //   },
        // },
        legend: {
          show: true,
          selected: {},
          x: "left",
          orient: "vertical",
          textStyle: {
            color: "white",
          },
          data: [],
        },
        //鼠标移上去的弹框
        tooltip: {
          trigger: "item",
          show: true,
        },
        //geo：这是重点
        geo: {
          map: "china", //中国地图
          zoom: 1.2, //缩放倍数
          roam: false, //是否允许缩放和拖拽地图
          label: {
            normal: {
              show: true, // 是否显示省份名字，现在是隐藏的状态，因为和散点图的名字重叠了。如果需要就true
              textStyle: {
                //名字的样式
                color: "#fff",
              },
            },
            emphasis: {
              show: true,
            },
          },
          //地图样式
          itemStyle: {
            normal: {
              borderColor: "#293171", //地图边框颜色
              borderWidth: "2", //地图边框粗细
              areaColor: "#0A0F33", //地图背景色
            },
            //省份地图阴影
            emphasis: {
              areaColor: null,
              shadowOffsetX: 0,
              shadowOffsetY: 0,
              shadowBlur: 20,
              borderWidth: 0,
              shadowColor: "#fff",
            },
          },
        },
        series: series, //图表配置
      };
      mapChart.setOption(option); //生成图表
    },
    /** 当月财务分类入库：玫瑰图最多 6 块，第 6 名起合并为「其他」 */
    mergeFinanceInboundPieSlices(rows) {
      const parsed = (rows || [])
        .map((r) => {
          const name = (r.financeCategoryName || r.finance_category_name || "未分类").toString();
          const v = Number(r.totalAmt != null ? r.totalAmt : r.total_amt);
          return { name, value: Number.isFinite(v) && v > 0 ? v : 0 };
        })
        .filter((x) => x.value > 0)
        .sort((a, b) => b.value - a.value);
      if (!parsed.length) {
        return [{ name: "暂无当月入库", value: 0 }];
      }
      if (parsed.length <= 6) {
        return parsed;
      }
      const head = parsed.slice(0, 5);
      const rest = parsed.slice(5).reduce((s, x) => s + x.value, 0);
      return head.concat([{ name: "其他", value: rest }]);
    },
    /** 左侧玫瑰饼图 + 右侧圆环：接口「当月入退货按财务分类汇总金额」 */
    loadFinanceInboundByCategoryChart() {
      biScreenInboundFinanceCategoryMonth()
        .then((res) => {
          const rows = Array.isArray(res && res.data) ? res.data : [];
          const slices = this.mergeFinanceInboundPieSlices(rows);
          this.ring_chart_config = {
            ...this.ring_chart_config,
            data: slices.map((s) => ({
              name: s.name,
              value: s.value > 0 ? s.value : 1,
            })),
          };
          this.renderRoseFinancePie(slices);
        })
        .catch(() => {
          const fb = [{ name: "加载失败", value: 0 }];
          this.ring_chart_config = {
            ...this.ring_chart_config,
            data: [{ name: "加载失败", value: 1 }],
          };
          this.renderRoseFinancePie(fb);
        });
    },
    renderRoseFinancePie(slices) {
      const el = document.getElementById("Rose_diagram");
      if (!el) {
        return;
      }
      if (!this._rosePieChart) {
        this._rosePieChart = this.$echarts.init(el);
        this._rosePieOnResize = () => {
          if (this._rosePieChart) {
            this._rosePieChart.resize();
          }
        };
        window.addEventListener("resize", this._rosePieOnResize);
      }
      const colors = [
        "#37a2da",
        "#32c5e9",
        "#9fe6b8",
        "#ffdb5c",
        "#ff9f7f",
        "#fb7293",
        "#e7bcf3",
        "#8378ea",
        "#96bfff",
        "#c4ebad",
      ];
      const chart = this._rosePieChart;
      const seriesData = slices.map((s) => {
        const real = Number(s.value);
        const isZeroDisplay =
          !Number.isFinite(real) ||
          real <= 0 ||
          s.name === "暂无当月入库" ||
          s.name === "加载失败";
        const v = isZeroDisplay ? 1 : real;
        return {
          name: s.name,
          value: v,
          realAmt: isZeroDisplay ? 0 : real,
        };
      });
      const legendData = seriesData.map((d) => d.name);
      const option = {
        color: colors,
        tooltip: {
          trigger: "item",
          formatter: (p) => {
            const d = p.data || {};
            const amt = d.realAmt != null ? Number(d.realAmt) : Number(p.value);
            const money = Number.isFinite(amt) ? "¥" + amt.toFixed(2) : "¥0.00";
            return p.seriesName + "<br/>" + p.name + "：" + money + " (" + p.percent + "%)";
          },
        },
        toolbox: {
          show: true,
        },
        calculable: true,
        legend: {
          orient: "horizontal",
          icon: "circle",
          bottom: 0,
          x: "center",
          data: legendData,
          textStyle: {
            color: "#fff",
          },
        },
        series: [
          {
            name: "当月财务分类入库",
            type: "pie",
            radius: [10, 50],
            roseType: "area",
            center: ["50%", "40%"],
            data: seriesData,
          },
        ],
      };
      chart.setOption(option, true);
    },
    //柱状图（高值消耗：金额+数量，仅显示手术室/导管室/口腔科/眼科/骨科）
    columnar() {
      let mapChart = this.$echarts.init(document.getElementById("columnar"));
      window.onresize = mapChart.resize;
      const categories = this.columnarCategories || ["手术室", "导管室", "口腔科", "眼科", "骨科"];
      const amountData = (this.columnarOutboundData && this.columnarOutboundData.length) ? this.columnarOutboundData : categories.map(() => 0);
      const qtyData = (this.columnarOutboundQuantity && this.columnarOutboundQuantity.length) ? this.columnarOutboundQuantity : categories.map(() => 0);
      let option = {
        title: { text: "" },
        tooltip: {
          trigger: "axis",
          backgroundColor: "rgba(255,255,255,0.1)",
          axisPointer: { type: "shadow", label: { show: true, backgroundColor: "#7B7DDC" } },
          formatter: (params) => {
            if (!params || !params.length) return "";
            const name = params[0].name;
            const amt = params.find(p => p.seriesName === "金额");
            const qty = params.find(p => p.seriesName === "数量");
            let s = name + "<br/>";
            if (amt != null) s += "金额：￥" + (typeof amt.value === "number" ? amt.value.toFixed(2) : amt.value) + "<br/>";
            if (qty != null) s += "数量：" + (qty.value != null ? qty.value : 0);
            return s;
          },
        },
        legend: {
          data: ["金额", "数量"],
          textStyle: { color: "#B4B4B4" },
          top: "0%",
          selected: { "金额": true, "数量": true },
        },
        grid: { left: 52, right: 48, x: "16%", width: "78%", y: "4%" },
        xAxis: {
          data: categories,
          axisLine: { lineStyle: { color: "#B4B4B4" } },
          axisTick: { show: false },
        },
        yAxis: [
          {
            type: "value",
            position: "left",
            splitLine: { show: false },
            axisLine: { lineStyle: { color: "#B4B4B4" } },
            axisLabel: {
              margin: 8,
              color: "#B4B4B4",
              formatter: (value) => value >= 10000 ? (value / 10000) + "万" : String(value),
            },
          },
          {
            type: "value",
            position: "right",
            splitLine: { show: false },
            axisLine: { lineStyle: { color: "#B4B4B4" } },
            axisLabel: {
              margin: 8,
              color: "#B4B4B4",
              formatter: "{value}",
            },
          },
        ],
        series: [
          {
            name: "金额",
            yAxisIndex: 0,
            type: "bar",
            barWidth: 14,
            barGap: "30%",
            itemStyle: {
              normal: {
                barBorderRadius: 5,
                color: new this.$echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "#956FD4" },
                  { offset: 1, color: "#3EACE5" },
                ]),
              },
            },
            data: amountData,
          },
          {
            name: "数量",
            yAxisIndex: 1,
            type: "bar",
            barWidth: 14,
            barGap: "30%",
            itemStyle: {
              normal: {
                barBorderRadius: 5,
                color: new this.$echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "rgba(156,107,211,0.8)" },
                  { offset: 0.2, color: "rgba(156,107,211,0.5)" },
                  { offset: 1, color: "rgba(156,107,211,0.2)" },
                ]),
              },
            },
            data: qtyData,
          },
        ],
      };
      mapChart.setOption(option);
    },
    /** 将接口返回的「有数据的月份」铺到 1～12 月数组（入库 / 退货金额） */
    fillYearInboundReturnSeries(rows) {
      const inbound = new Array(12).fill(0);
      const ret = new Array(12).fill(0);
      (rows || []).forEach((r) => {
        const m = Number(r.monthNum != null ? r.monthNum : r.month_num);
        if (!Number.isFinite(m) || m < 1 || m > 12) {
          return;
        }
        const i = m - 1;
        inbound[i] = Number(r.inboundAmt != null ? r.inboundAmt : r.inbound_amt) || 0;
        ret[i] = Number(r.returnAmt != null ? r.returnAmt : r.return_amt) || 0;
      });
      return { inbound, ret };
    },
    /** 中间折线图：当年按月已审核入库(101)、退货入库(301)金额（年度采购与退货曲线） */
    loadYearInboundReturnLineChart() {
      const dom = document.getElementById("line_center_diagram");
      if (!dom) {
        return;
      }
      let chart = this.$echarts.getInstanceByDom(dom);
      if (!chart) {
        chart = this.$echarts.init(dom);
        this._yearLineChart = chart;
        if (!this._yearLineResize) {
          this._yearLineResize = () => {
            if (this._yearLineChart) {
              this._yearLineChart.resize();
            }
          };
          window.addEventListener("resize", this._yearLineResize);
        }
      } else {
        this._yearLineChart = chart;
      }
      const monthLabels = ["一月份", "二月份", "三月份", "四月份", "五月份", "六月份", "七月份", "八月份", "九月份", "十月份", "十一月份", "十二月份"];
      const currentYear = new Date().getFullYear();
      const moneyFmt = (v) => {
        const n = typeof v === "number" ? v : Number(v);
        return Number.isFinite(n) ? "¥" + n.toFixed(2) : v;
      };
      const buildOption = (inbound, ret) => ({
        title: {
          text: "年度采购（" + currentYear + "）",
          left: 50,
          top: 10,
          textStyle: {
            color: "rgba(255,255,255,.9)",
            fontSize: 14,
          },
        },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "cross", label: { backgroundColor: "#6a7985" } },
          valueFormatter: (v) => (typeof v === "number" && Number.isFinite(v) ? "¥" + v.toFixed(2) : v),
        },
        legend: {
          data: ["入库金额", "退货金额"],
          top: 8,
          right: 20,
          textStyle: { color: "rgba(255,255,255,.85)", fontSize: 12 },
        },
        grid: {
          left: 56,
          right: 16,
          bottom: 28,
          top: 52,
        },
        xAxis: {
          type: "category",
          data: monthLabels,
          position: "bottom",
          axisLine: { lineStyle: { color: "rgba(255,255,255,.25)" } },
          axisLabel: {
            color: "rgba(255,255,255,.8)",
            fontSize: 11,
          },
        },
        yAxis: {
          type: "value",
          splitNumber: 4,
          axisLine: { show: false },
          splitLine: {
            show: true,
            lineStyle: {
              color: "#fff",
              opacity: 0.1,
            },
          },
          axisLabel: {
            color: "rgba(255,255,255,.8)",
            fontSize: 12,
            formatter: (v) => moneyFmt(v),
          },
        },
        series: [
          {
            name: "入库金额",
            type: "line",
            smooth: true,
            symbol: "emptyCircle",
            symbolSize: 8,
            data: inbound,
            itemStyle: { color: "#fff" },
            lineStyle: {
              width: 3,
              color: this.colorList.linearBtoG,
            },
            areaStyle: {
              color: this.colorList.areaBtoG,
            },
          },
          {
            name: "退货金额",
            type: "line",
            smooth: true,
            symbol: "emptyCircle",
            symbolSize: 8,
            data: ret,
            itemStyle: { color: "#ffb088" },
            lineStyle: {
              width: 2,
              color: "#ff9f7f",
            },
          },
        ],
      });
      biScreenYearInboundReturnByMonth()
        .then((res) => {
          const rows = Array.isArray(res && res.data) ? res.data : [];
          const { inbound, ret } = this.fillYearInboundReturnSeries(rows);
          chart.setOption(buildOption(inbound, ret), true);
        })
        .catch(() => {
          chart.setOption(buildOption(new Array(12).fill(0), new Array(12).fill(0)), true);
        });
    },
    //右侧虚线柱状图：近 20 天入退货金额（折线=高值耗材，柱=低值耗材）
    dotter_bar() {
      const dom = document.getElementById("dotter_bar");
      if (!dom) {
        return;
      }
      let mapChart = this.$echarts.getInstanceByDom(dom);
      if (!mapChart) {
        mapChart = this.$echarts.init(dom);
      }
      window.onresize = () => {
        mapChart.resize();
      };
      const buildOption = (category, highData, lowData) => ({
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
          valueFormatter: (v) => (typeof v === "number" ? "¥" + v.toFixed(2) : v),
        },
        grid: {
          left: 50,
          right: 10,
          bottom: 25,
          top: "18%",
        },
        legend: {
          data: ["高值", "低值"],
          textStyle: {
            color: "#ccc",
          },
        },
        xAxis: {
          data: category,
          axisLine: {
            lineStyle: {
              color: "#ccc",
            },
          },
        },
        yAxis: {
          splitLine: { show: false },
          axisLine: {
            lineStyle: {
              color: "#ccc",
            },
          },
        },
        series: [
          {
            name: "高值",
            type: "line",
            smooth: true,
            showAllSymbol: true,
            symbol: "emptyCircle",
            symbolSize: 15,
            data: highData,
          },
          {
            name: "低值",
            type: "bar",
            barWidth: 10,
            itemStyle: {
              borderRadius: 5,
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#14c8d4" },
                { offset: 1, color: "#43eec6" },
              ]),
            },
            data: lowData,
          },
          {
            name: "高值",
            type: "bar",
            barGap: "-100%",
            barWidth: 10,
            silent: true,
            tooltip: { show: false },
            legendHoverLink: false,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "rgba(20,200,212,0.5)" },
                { offset: 0.2, color: "rgba(20,200,212,0.2)" },
                { offset: 1, color: "rgba(20,200,212,0)" },
              ]),
            },
            z: -12,
            data: highData,
          },
          {
            name: "底纹",
            type: "pictorialBar",
            symbol: "rect",
            silent: true,
            tooltip: { show: false },
            legendHoverLink: false,
            itemStyle: {
              color: "#0f375f",
            },
            symbolRepeat: true,
            symbolSize: [12, 4],
            symbolMargin: 1,
            z: -10,
            data: highData,
          },
        ],
      });
      const fillAxis = () => {
        const category = [];
        const keys = [];
        const highData = [];
        const lowData = [];
        for (let i = 19; i >= 0; i--) {
          const dt = new Date();
          dt.setHours(0, 0, 0, 0);
          dt.setDate(dt.getDate() - i);
          const y = dt.getFullYear();
          const mo = dt.getMonth() + 1;
          const da = dt.getDate();
          keys.push(
            `${y}-${String(mo).padStart(2, "0")}-${String(da).padStart(2, "0")}`
          );
          category.push(`${y}-${mo}-${da}`);
          highData.push(0);
          lowData.push(0);
        }
        return { category, keys, highData, lowData };
      };
      biScreenInboundDailyHighLowValue()
        .then((res) => {
          const list = Array.isArray(res && res.data) ? res.data : [];
          const { category, keys, highData, lowData } = fillAxis();
          const idx = {};
          keys.forEach((k, i) => {
            idx[k] = i;
          });
          list.forEach((row) => {
            const raw = row.statDate != null ? row.statDate : row.stat_date;
            if (raw == null) {
              return;
            }
            const statKey = String(raw).substring(0, 10);
            const j = idx[statKey];
            if (j == null) {
              return;
            }
            const h = Number(
              row.highValueAmt != null ? row.highValueAmt : row.high_value_amt
            );
            const l = Number(
              row.lowValueAmt != null ? row.lowValueAmt : row.low_value_amt
            );
            highData[j] = Number.isFinite(h) ? h : 0;
            lowData[j] = Number.isFinite(l) ? l : 0;
          });
          mapChart.setOption(buildOption(category, highData, lowData), true);
        })
        .catch(() => {
          const { category, highData, lowData } = fillAxis();
          mapChart.setOption(buildOption(category, highData, lowData), true);
        });
    },
  },
};
</script>

<style lang="scss">
//全局样式部分！！！！
* {
  margin: 0;
  padding: 0;
  list-style-type: none;
  outline: none;
  box-sizing: border-box;
}
html {
  margin: 0;
  padding: 0;
}
body {
  font-family: Arial, Helvetica, sans-serif;
  line-height: 1.2em;
  background-color: #f1f1f1;
  margin: 0;
  padding: 0;
}
a {
  color: #343440;
  text-decoration: none;
}
//--------------------------------------------

//页面样式部分！！！！
#index {
  color: #d3d6dd;
  width: 1920px;
  height: 1080px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  transform-origin: left top;
  overflow: hidden;
  .bg {
    //整体页面背景
    width: 100%;
    height: 100%;
    padding: 16px 16px 0 16px;
    background-image: url("../../../assets/bg.jpg"); //背景图
    background-size: cover; //背景尺寸
    background-position: center center; //背景位置
  }
  //顶部右边装饰效果
  .title_left {
    width: 100%;
    height: 50px;
  }
  //顶部左边装饰效果
  .title_right {
    width: 100%;
    height: 50px;
    margin-top: 18px;
  }
  //顶部中间装饰效果
  .title_center {
    width: 100%;
    height: 50px;
  }
  //顶部中间文字数据可视化系统
  .title_text {
    text-align: center;
    font-size: 24px;
    font-weight: bold;
    margin-top: 14px;
    color: #008cff;
  }
  //时间日期
  .title_time {
    text-align: center;
  }
  //全屏按钮控制区域
  .title_controls {
    text-align: center;
    margin-top: 10px;
  }
  //全屏按钮样式
  .fullscreen-btn {
    background: linear-gradient(45deg, #008CFF, #00ADDD);
    border: none;
    color: #fff;
    font-size: 12px;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 140, 255, 0.3);
  }
  .fullscreen-btn:hover {
    background: linear-gradient(45deg, #00ADDD, #008CFF);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 140, 255, 0.4);
  }
  .fullscreen-btn:active {
    transform: translateY(0);
  }
  //中国地图（隐藏）
  #china-map {
    display: none;
  }
  //统计框容器（地图位置）
  .stats_container_map {
    width: 100%;
    height: 660px;
    margin-bottom: 10px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-content: space-between;
    padding: 20px;
  }
  //统计框
  .stats_box {
    width: calc(33.33% - 14px);
    height: calc(50% - 10px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 10px;
  }
  //统计标签
  .stats_label {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 10px;
    text-align: center;
  }
  //统计值
  .stats_value {
    font-size: 28px;
    font-weight: bold;
    color: #00b891;
    text-align: center;
  }
  //统计单位
  .stats_unit {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.6);
    margin-left: 5px;
  }
  //中间折线图（框体上移，预留顶部空间避免标题被裁切）
  .line_center {
    width: 100%;
    height: 288px;
    margin-top: -6px;
    padding-top: 4px;
    box-sizing: border-box;
  }
  //左1模块
  .left_box1 {
    height: 310px;
    width: 100%;
    margin-bottom: 10px;
    position: relative;
  }
  //左2模块
  .left_box2 {
    height: 310px;
    width: 100%;
    margin-bottom: 10px;
  }
  //左3模块
  .left_box3 {
    height: 310px;
    width: 100%;
  }
  //右1模块：耗材排行（横向条样式，名称单行省略）
  .right_box1 {
    height: 310px;
    width: 100%;
    margin-bottom: 10px;
  }
  #index .right_box1 .dv-scroll-ranking-board .ranking-info {
    display: flex !important;
    flex-wrap: nowrap !important;
    align-items: center !important;
    width: 100% !important;
    max-height: 22px !important;
    min-height: 20px !important;
    line-height: 20px !important;
    overflow: hidden !important;
  }
  #index .right_box1 .dv-scroll-ranking-board .ranking-info .rank {
    flex: 0 0 44px !important;
    white-space: nowrap !important;
  }
  #index .right_box1 .dv-scroll-ranking-board .ranking-info .ranking-value {
    flex: 0 0 auto !important;
    margin-left: 4px !important;
    white-space: nowrap !important;
  }
  #index .right_box1 .dv-scroll-ranking-board .ranking-info .info-name {
    flex: 1 1 0 !important;
    min-width: 0 !important;
    max-width: 100% !important;
    overflow: hidden !important;
    white-space: nowrap !important;
    text-overflow: ellipsis !important;
    display: block !important;
  }
  //右2模块
  .right_box2 {
    height: 310px;
    width: 100%;
    margin-bottom: 10px;
  }
  //右3模块
  .right_box3 {
    height: 310px;
    width: 100%;
  }
  //左1模块-玫瑰饼图
  #Rose_diagram {
    height: 70%;
    width: 55%;
  }
  //左1模块-圆环图
  .left_box1_rose_right {
    height: 85%;
    width: 55%;
    position: absolute;
    right: 0;
    top: 0;
  }
  //左1模块-文字部分
  .rose_text {
    display: inline-block;
    margin-top: 4%;
    margin-left: 4%;
  }
  // 左1模块-￥符号样式
  .coin {
    font-size: 20px;
    color: #ffc107;
  }
  //左1模块-（件）样式
  .colorYellow {
    color: yellowgreen;
  }
  //左1模块-数字样式
  .rose_text_nmb {
    font-size: 20px;
    color: #00b891;
  }
  //左2模块 柱状图
  #columnar {
    height: 97%;
    width: 95%;
    margin-left: 3%;
    margin-top: 5px;
  }
  //折线图（overflow 避免标题被裁切）
  #line_center_diagram {
    height: 100%;
    width: 100%;
    overflow: visible;
  }
  //轮播表格（无背景色，与其它框内容区一致）
  .carousel_list {
    width: 96%;
    height: 98%;
    margin-left: 10px;
    background: transparent;
  }
  // 供应商表：与科室领用排名共用 cone_chart_wrapper，表体铺满标题下方区域
  .left_box3 .cone_chart_wrapper .carousel_list {
    width: 95%;
    height: 100%;
    margin-left: 3%;
    box-sizing: border-box;
  }
  // 供应商列：允许换行，尽量显示全称（DataV 默认单行省略）
  #index .left_box3 .dv-scroll-board .header .header-item:first-child .text,
  #index .left_box3 .dv-scroll-board .rows .row-item .ceil:first-child .text {
    white-space: normal;
    word-break: break-word;
    overflow: visible;
    text-overflow: clip;
    line-height: 1.25;
  }
  // 科室领用排名轮播表
  .right_box3 .cone_chart_wrapper .dept_rank_list {
    width: 95%;
    height: 100%;
    margin-left: 3%;
    box-sizing: border-box;
    background: transparent;
  }
  #index .right_box3 .dv-scroll-board .header .header-item:first-child .text,
  #index .right_box3 .dv-scroll-board .rows .row-item .ceil:first-child .text {
    white-space: normal;
    word-break: break-word;
    overflow: visible;
    text-overflow: clip;
    line-height: 1.25;
  }
  //虚线柱状图
  #dotter_bar {
    width: 100%;
    height: 100%;
  }
  //锥形图：科室名与底框持平往上一点点
  .cone_chart_wrapper {
    height: calc(100% - 32px);
    padding-bottom: 6px;
    box-sizing: border-box;
  }
  .cone_box {
    width: 95%;
    height: 95%;
    margin-left: 3%;
    box-sizing: border-box;
  }
  .cone_title {
    font-size: 14px;
    color: #00d4ff;
    text-align: center;
    padding: 6px 0 4px 0;
    font-weight: 600;
  }
}
</style>

