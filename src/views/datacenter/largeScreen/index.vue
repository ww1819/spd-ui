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
                    :config="config"
                    class="left_box1_rose_right"
                  />
                  <div
                    class="rose_text"
                    v-for="(item, index) in numberData"
                    :key="index"
                  >
                    <p>
                      <span class="coin">￥</span>
                      <span class="rose_text_nmb">{{
                          item.number.number
                        }}</span>
                    </p>
                    <p>
                      <span>{{ item.text }}</span>
                      <span class="colorYellow">(件)</span>
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
              <!-- 轮播表格部分 -->
              <div class="left_box3">
                <dv-border-box-12 style="padding-top: 10px">
                  <dv-scroll-board
                    :config="board_info"
                    class="carousel_list"
                  />
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
                    :config="config"
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
              <!-- 科室领用排名 -->
              <div class="right_box3">
                <dv-border-box-12 :reverse="true">
                  <div class="cone_title">科室领用排名</div>
                  <div class="cone_chart_wrapper">
                    <dv-conical-column-chart :config="cone" class="cone_box" />
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
import { outboundSummaryByDepartment } from "@/api/warehouse/warehouse";
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
      //轮播排行榜
      config: {
        data: [
          {
            name: "一次性手术无菌包",
            value: 55,
          },
          {
            name: "手套",
            value: 120,
          },
          {
            name: "棉签",
            value: 78,
          },
          {
            name: "一次性注射器",
            value: 66,
          },
          {
            name: "碘伏",
            value: 80,
          },
          {
            name: "一次性输液器",
            value: 45,
          },
          {
            name: "注射用水",
            value: 29,
          },
        ],
      },
      //左侧饼图文字
      numberData: [
        {
          number: {
            number: 15,
          },
          text: "今日构建总量",
        },
        {
          number: {
            number: 1144,
          },
          text: "总共完成数量",
        },
        {
          number: {
            number: 361,
          },
          text: "正在编译数量",
        },
      ],
      //左侧轮播表格配置项（无背景色，与边框框内容一致）
      board_info: {
        header: ["供应商", "数量", "金额"],
        data: [
          ["国药器械有限责任公司", "1083", "￥0"],
          ["广东华润医疗器械有限公司", "1350", "￥0"],
          ["江门国药器械责任有限责任公司", "1035", "￥0"],
          ["华融医疗器械有限责任公司", "1330", "￥0"],
          ["四川科华生物医疗器械有限责任公司", "1250", "￥0"],
        ],
        headerBGC: "transparent",
        evenRowBGC: "transparent",
        oddRowBGC: "transparent",
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
      //锥形柱状图（科室，名称从系统科室列表读取）
      cone: {
        data: [],
        showValue: true,
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
    //加载科室列表用于锥形图
    this.loadConeDepartmentData();
    //中国地图
    // this.china_map();
    //左侧玫瑰饼图
    this.Rose_diagram();
    //左侧高值消耗柱状图（科室出库数据）
    this.loadColumnarData();
    //中间折线图
    this.line_center_diagram();
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
    /** 高值消耗柱状图：拉取手术室/导管室/口腔科/眼科/骨科的科室出库数据 */
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
    /** 从系统读取科室列表并拉取科室出库总数据，只显示前5个科室 */
    loadConeDepartmentData() {
      Promise.all([
        listdepart({ pageNum: 1, pageSize: 200 }),
        outboundSummaryByDepartment()
      ]).then(([deptRes, outboundRes]) => {
        const rows = deptRes.rows || deptRes.data || [];
        const outboundList = outboundRes.data || outboundRes || [];
        const outboundMap = {};
        outboundList.forEach(item => {
          const id = item.departmentId != null ? item.departmentId : item.department_id;
          if (id != null) outboundMap[id] = parseFloat(item.outboundAmount || item.outbound_amount || 0) || 0;
        });
        const all = rows.slice(0, 5).map((dept, index) => {
          const id = dept.id != null ? dept.id : dept.departmentId;
          const name = dept.name || dept.departmentName || '科室' + (index + 1);
          const value = id != null ? (outboundMap[id] != null ? outboundMap[id] : 0) : 0;
          return { name, value };
        });
        this.cone.data = all.length ? all : [{ name: '暂无科室', value: 0 }];
      }).catch(() => {
        this.cone.data = [{ name: '加载失败', value: 0 }];
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
    //玫瑰饼图
    Rose_diagram() {
      let mapChart = this.$echarts.init(
        document.getElementById("Rose_diagram")
      ); //图表初始化，china-map是绑定的元素
      window.onresize = mapChart.resize; //如果容器变大小，自适应从新构图
      let option = {
        color: [
          "#37a2da",
          "#32c5e9",
          "#9fe6b8",
          "#ffdb5c",
          "#ff9f7f",
          "#fb7293",
          "#e7bcf3",
          "#8378ea",
        ],
        tooltip: {
          trigger: "item",
          formatter: "{a} <br/>{b} : {c} ({d}%)",
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
          data: ["data1", "data2", "data3", "data4", "data5", "data6"],
          textStyle: {
            color: "#fff",
          },
        },
        series: [
          {
            name: "通过率统计",
            type: "pie",
            radius: [10, 50],
            roseType: "area",
            center: ["50%", "40%"],
            data: [
              { value: 10, name: "data1" },
              { value: 5, name: "data2" },
              { value: 15, name: "data3" },
              { value: 25, name: "data4" },
              { value: 20, name: "data5" },
              { value: 35, name: "data6" },
            ],
          },
        ],
      };
      mapChart.setOption(option); //生成图表
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
    //折线图
    line_center_diagram() {
      let mapChart = this.$echarts.init(
        document.getElementById("line_center_diagram")
      ); //图表初始化，china-map是绑定的元素
      window.onresize = mapChart.resize; //如果容器变大小，自适应从新构图
      const currentYear = new Date().getFullYear();
      let option = {
        title: {
          text: "年度采购（" + currentYear + "）",
          left: 50,
          top: 12,
          textStyle: {
            color: "rgba(255,255,255,.9)",
            fontSize: 14,
          },
        },
        xAxis: {
          type: "category",
          data: ["一月份", "二月份", "三月份", "四月份", "五月份", "六月份", "七月份", "八月份", "九月份", "十月份", "十一月份", "十二月份"],
          position: "bottom",
          axisLine: true,
          axisLabel: {
            color: "rgba(255,255,255,.8)",
            fontSize: 12,
          },
        },
        yAxis: {
          type: "value",
          splitNumber: 4,
          axisLine: {
            lineStyle: {
              opacity: 0,
            },
          },
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
          },
        },
        grid: {
          left: 50,
          right: 10,
          bottom: 25,
          top: 42,
        },
        series: [
          {
            data: [820, 932, 901, 934, 1290, 1330, 1320, 1250, 1180, 1100, 1050, 1200],
            type: "line",
            smooth: true,
            symbol: "emptyCircle",
            symbolSize: 8,
            itemStyle: {
              normal: {
                color: "#fff",
              },
            },
            //线的颜色样式
            lineStyle: {
              normal: {
                color: this.colorList.linearBtoG,
                width: 3,
              },
            },
            //填充颜色样式
            areaStyle: {
              normal: {
                color: this.colorList.areaBtoG,
              },
            },
          },
        ],
      };
      mapChart.setOption(option); //生成图表
    },
    //右侧虚线柱状图图
    dotter_bar() {
      let mapChart = this.$echarts.init(document.getElementById("dotter_bar")); //图表初始化，china-map是绑定的元素
      window.onresize = mapChart.resize; //如果容器变大小，自适应从新构图
      // Generate data
      let category = [];
      let dottedBase = +new Date();
      let lineData = [];
      let barData = [];
      for (let i = 0; i < 20; i++) {
        let date = new Date((dottedBase += 3600 * 24 * 1000));
        category.push(
          [date.getFullYear(), date.getMonth() + 1, date.getDate()].join("-")
        );
        let b = Math.random() * 200;
        let d = Math.random() * 200;
        barData.push(b);
        lineData.push(d + b);
      }
      // option
      let option = {
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow",
          },
        },
        grid: {
          left: 50,
          right: 10,
          bottom: 25,
          top: "18%",
        },
        legend: {
          data: ["line", "bar"],
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
            name: "line",
            type: "line",
            smooth: true,
            showAllSymbol: true,
            symbol: "emptyCircle",
            symbolSize: 15,
            data: lineData,
          },
          {
            name: "bar",
            type: "bar",
            barWidth: 10,
            itemStyle: {
              borderRadius: 5,
              // color: "#14c8d4",
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "#14c8d4" },
                { offset: 1, color: "#43eec6" },
              ]),
            },
            data: barData,
          },
          {
            name: "line",
            type: "bar",
            barGap: "-100%",
            barWidth: 10,
            itemStyle: {
              // color: "rgba(20,200,212,0.5)",
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "rgba(20,200,212,0.5)" },
                { offset: 0.2, color: "rgba(20,200,212,0.2)" },
                { offset: 1, color: "rgba(20,200,212,0)" },
              ]),
            },
            z: -12,
            data: lineData,
          },
          {
            name: "dotted",
            type: "pictorialBar",
            symbol: "rect",
            itemStyle: {
              color: "#0f375f",
            },
            symbolRepeat: true,
            symbolSize: [12, 4],
            symbolMargin: 1,
            z: -10,
            data: lineData,
          },
        ],
      };
      mapChart.setOption(option); //生成图表
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
  //右1模块
  .right_box1 {
    height: 310px;
    width: 100%;
    margin-bottom: 10px;
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

