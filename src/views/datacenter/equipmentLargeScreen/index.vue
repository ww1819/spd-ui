<template>
  <div id="equipment-index" ref="appRef">
    <div class="bg">
      <dv-loading v-show="loading">Loading...</dv-loading>
      <div class="host-body">
        <div>
          <!-- 顶部title部分 -->
          <el-row>
            <el-col :span="6">
              <dv-decoration-8
                class="title_right"
                :color="['#008CFF', '#00ADDD']"
              />
            </el-col>
            <el-col :span="12">
              <div class="title_text">医疗设备效益分析全生命周期</div>
              <dv-decoration-5
                class="title_center"
                :color="['#008CFF', '#00ADDD']"
              />
            </el-col>
            <el-col :span="6">
              <div class="title_time">{{ dateYear + dateWeek + dateDay }}</div>
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
              />
            </el-col>
          </el-row>
          
          <!-- 主体部分 - 顶部行 -->
          <el-row :gutter="10" class="top-row">
            <!-- 顶部左侧 - 柱状图 -->
            <el-col :span="8">
              <div class="chart-box">
                <dv-border-box-8>
                  <div class="chart-title">医疗设备</div>
                  <div id="top-left-bar-chart"></div>
                </dv-border-box-8>
              </div>
            </el-col>
            
            <!-- 顶部中间 - 关键指标面板 -->
            <el-col :span="8">
              <div class="chart-box">
                <dv-border-box-8>
                  <div class="chart-title">关键指标</div>
                  <div class="kpi-container">
                    <div class="kpi-item" v-for="(item, index) in kpiData" :key="index">
                      <div class="kpi-label">{{ item.label }}</div>
                      <div class="kpi-value">{{ item.value }}</div>
                    </div>
                  </div>
                </dv-border-box-8>
              </div>
            </el-col>
            
            <!-- 顶部右侧 - 折线图 -->
            <el-col :span="8">
              <div class="chart-box">
                <dv-border-box-8>
                  <div class="chart-title">医疗设备</div>
                  <div id="top-right-line-chart"></div>
                </dv-border-box-8>
              </div>
            </el-col>
          </el-row>
          
          <!-- 主体部分 - 中间行 -->
          <el-row :gutter="10" class="middle-row">
            <!-- 中间左侧 - 折线图 -->
            <el-col :span="8">
              <div class="chart-box">
                <dv-border-box-8>
                  <div class="chart-title">医疗设备</div>
                  <div id="middle-left-line-chart"></div>
                </dv-border-box-8>
              </div>
            </el-col>
            
            <!-- 中间中间 - 折线图 -->
            <el-col :span="8">
              <div class="chart-box">
                <dv-border-box-8>
                  <div class="chart-title">医疗设备</div>
                  <div id="middle-center-line-chart"></div>
                </dv-border-box-8>
              </div>
            </el-col>
            
            <!-- 中间右侧 - 多个小图表和列表 -->
            <el-col :span="8">
              <div class="chart-box">
                <dv-border-box-8>
                  <div class="chart-title">医疗设备</div>
                  <div class="right-charts-container">
                    <div class="small-donut-chart">
                      <div id="donut-chart-1"></div>
                    </div>
                    <div class="small-donut-chart">
                      <div id="donut-chart-2"></div>
                    </div>
                    <div class="small-list">
                      <div class="list-item" v-for="(item, index) in listData" :key="index">
                        <span class="list-label">{{ item.label }}</span>
                        <span class="list-value">{{ item.value }}</span>
                      </div>
                    </div>
                  </div>
                </dv-border-box-8>
              </div>
            </el-col>
          </el-row>
          
          <!-- 主体部分 - 底部行 -->
          <el-row :gutter="10" class="bottom-row">
            <!-- 底部左侧 - 环形图 -->
            <el-col :span="8">
              <div class="chart-box">
                <dv-border-box-8>
                  <div class="chart-title">医疗设备</div>
                  <div id="bottom-left-donut-chart"></div>
                </dv-border-box-8>
              </div>
            </el-col>
            
            <!-- 底部中间 - 横向柱状图 -->
            <el-col :span="8">
              <div class="chart-box">
                <dv-border-box-8>
                  <div class="chart-title">医疗设备</div>
                  <div id="bottom-center-bar-chart"></div>
                </dv-border-box-8>
              </div>
            </el-col>
            
            <!-- 底部右侧 - 环形图 -->
            <el-col :span="8">
              <div class="chart-box">
                <dv-border-box-8>
                  <div class="chart-title">医疗设备</div>
                  <div id="bottom-right-donut-chart"></div>
                </dv-border-box-8>
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
      //关键指标数据
      kpiData: [
        { label: "RRT4", value: "27" },
        { label: "23046", value: "179" },
        { label: "VEICA", value: "1.3" },
        { label: "", value: "0" },
        { label: "", value: "1.35" },
        { label: "", value: "635" },
        { label: "", value: "23.0" },
        { label: "", value: "17.13" },
        { label: "", value: "2.9" },
        { label: "", value: "320" }
      ],
      //列表数据
      listData: [
        { label: "每人", value: "200" },
        { label: "MOAN", value: "16ける" }
      ]
    };
  },
  mounted() {
    //获取实时时间
    this.timeFn();
    //加载loading图
    this.cancelLoading();
    //初始化所有图表
    this.initAllCharts();
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
    //初始化所有图表
    initAllCharts() {
      this.$nextTick(() => {
        this.initTopLeftBarChart();
        this.initTopRightLineChart();
        this.initMiddleLeftLineChart();
        this.initMiddleCenterLineChart();
        this.initDonutCharts();
        this.initBottomLeftDonutChart();
        this.initBottomCenterBarChart();
        this.initBottomRightDonutChart();
      });
    },
    //顶部左侧柱状图
    initTopLeftBarChart() {
      const chart = echarts.init(document.getElementById("top-left-bar-chart"));
      window.addEventListener('resize', () => chart.resize());
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' }
        },
        grid: {
          left: '10%',
          right: '10%',
          bottom: '15%',
          top: '10%'
        },
        xAxis: {
          type: 'category',
          data: ['108', '92', '230', '238'],
          axisLabel: { color: '#fff' },
          axisLine: { lineStyle: { color: '#008CFF' } }
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#fff' },
          axisLine: { lineStyle: { color: '#008CFF' } },
          splitLine: { lineStyle: { color: 'rgba(0, 140, 255, 0.2)' } }
        },
        series: [
          {
            name: '数据',
            type: 'bar',
            data: [300, 200, 100, 20],
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#008CFF' },
                { offset: 1, color: '#00ADDD' }
              ])
            }
          }
        ]
      };
      chart.setOption(option);
    },
    //顶部右侧折线图（2021-2027年）
    initTopRightLineChart() {
      const chart = echarts.init(document.getElementById("top-right-line-chart"));
      window.addEventListener('resize', () => chart.resize());
      
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        grid: {
          left: '10%',
          right: '10%',
          bottom: '15%',
          top: '10%'
        },
        xAxis: {
          type: 'category',
          data: ['2021', '2022', '2023', '2024', '2025', '2026', '2027'],
          axisLabel: { color: '#fff' },
          axisLine: { lineStyle: { color: '#008CFF' } }
        },
        yAxis: {
          type: 'value',
          max: 200,
          axisLabel: { color: '#fff' },
          axisLine: { lineStyle: { color: '#008CFF' } },
          splitLine: { lineStyle: { color: 'rgba(0, 140, 255, 0.2)' } }
        },
        series: [
          {
            name: '医疗设备',
            type: 'line',
            data: [50, 80, 120, 150, 180, 160, 190],
            smooth: true,
            lineStyle: { color: '#008CFF', width: 2 },
            itemStyle: { color: '#00ADDD' },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(0, 140, 255, 0.3)' },
                { offset: 1, color: 'rgba(0, 173, 221, 0.1)' }
              ])
            }
          }
        ]
      };
      chart.setOption(option);
    },
    //中间左侧折线图
    initMiddleLeftLineChart() {
      const chart = echarts.init(document.getElementById("middle-left-line-chart"));
      window.addEventListener('resize', () => chart.resize());
      
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        grid: {
          left: '10%',
          right: '10%',
          bottom: '15%',
          top: '10%'
        },
        xAxis: {
          type: 'category',
          data: ['24', '23', '22', '20', '32'],
          axisLabel: { color: '#fff' },
          axisLine: { lineStyle: { color: '#008CFF' } }
        },
        yAxis: {
          type: 'value',
          max: 2010,
          axisLabel: { color: '#fff' },
          axisLine: { lineStyle: { color: '#008CFF' } },
          splitLine: { lineStyle: { color: 'rgba(0, 140, 255, 0.2)' } }
        },
        series: [
          {
            name: '医疗设备',
            type: 'line',
            data: [190, 2000, 1500, 1800, 1900],
            smooth: true,
            lineStyle: { color: '#00FF88', width: 2 },
            itemStyle: { color: '#00FF88' },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(0, 255, 136, 0.3)' },
                { offset: 1, color: 'rgba(0, 255, 136, 0.1)' }
              ])
            }
          }
        ]
      };
      chart.setOption(option);
    },
    //中间中间折线图（2017-2023年）
    initMiddleCenterLineChart() {
      const chart = echarts.init(document.getElementById("middle-center-line-chart"));
      window.addEventListener('resize', () => chart.resize());
      
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        grid: {
          left: '10%',
          right: '10%',
          bottom: '15%',
          top: '10%'
        },
        xAxis: {
          type: 'category',
          data: ['2017', '2018', '2019', '2020', '2021', '2022', '2023'],
          axisLabel: { color: '#fff' },
          axisLine: { lineStyle: { color: '#008CFF' } }
        },
        yAxis: {
          type: 'value',
          max: 300,
          axisLabel: { color: '#fff' },
          axisLine: { lineStyle: { color: '#008CFF' } },
          splitLine: { lineStyle: { color: 'rgba(0, 140, 255, 0.2)' } }
        },
        series: [
          {
            name: '医疗设备',
            type: 'line',
            data: [50, 100, 150, 200, 250, 280, 300],
            smooth: true,
            lineStyle: { color: '#FFA500', width: 2 },
            itemStyle: { color: '#FFA500' },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(255, 165, 0, 0.3)' },
                { offset: 1, color: 'rgba(255, 165, 0, 0.1)' }
              ])
            }
          }
        ]
      };
      chart.setOption(option);
    },
    //中间右侧小环形图
    initDonutCharts() {
      // 第一个小环形图
      const chart1 = echarts.init(document.getElementById("donut-chart-1"));
      window.addEventListener('resize', () => chart1.resize());
      
      const option1 = {
        tooltip: { trigger: 'item' },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          data: [
            { value: 2, name: 'A' },
            { value: 6, name: 'B' }
          ],
          itemStyle: {
            color: function(params) {
              const colors = ['#008CFF', '#00ADDD'];
              return colors[params.dataIndex];
            }
          },
          label: { show: true, formatter: '{b}: {c}' }
        }]
      };
      chart1.setOption(option1);
      
      // 第二个小环形图
      const chart2 = echarts.init(document.getElementById("donut-chart-2"));
      window.addEventListener('resize', () => chart2.resize());
      
      const option2 = {
        tooltip: { trigger: 'item' },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          data: [
            { value: 3, name: 'C' },
            { value: 4, name: 'D' }
          ],
          itemStyle: {
            color: function(params) {
              const colors = ['#FFA500', '#FF6B6B'];
              return colors[params.dataIndex];
            }
          },
          label: { show: true, formatter: '{b}: {c}' }
        }]
      };
      chart2.setOption(option2);
    },
    //底部左侧环形图
    initBottomLeftDonutChart() {
      const chart = echarts.init(document.getElementById("bottom-left-donut-chart"));
      window.addEventListener('resize', () => chart.resize());
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          textStyle: { color: '#fff' }
        },
        series: [{
          name: '医疗设备',
          type: 'pie',
          radius: ['40%', '70%'],
          data: [
            { value: 758, name: '类别1' },
            { value: 726, name: '类别2' },
            { value: 153, name: '类别3' },
            { value: 112, name: '类别4' },
            { value: 50, name: '类别5' }
          ],
          itemStyle: {
            color: function(params) {
              const colors = ['#9B59B6', '#FFA500', '#008CFF', '#00ADDD', '#FF6B6B'];
              return colors[params.dataIndex % colors.length];
            }
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%'
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      };
      chart.setOption(option);
    },
    //底部中间横向柱状图
    initBottomCenterBarChart() {
      const chart = echarts.init(document.getElementById("bottom-center-bar-chart"));
      window.addEventListener('resize', () => chart.resize());
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' }
        },
        grid: {
          left: '20%',
          right: '10%',
          bottom: '15%',
          top: '10%'
        },
        xAxis: {
          type: 'value',
          axisLabel: { color: '#fff' },
          axisLine: { lineStyle: { color: '#008CFF' } },
          splitLine: { lineStyle: { color: 'rgba(0, 140, 255, 0.2)' } }
        },
        yAxis: {
          type: 'category',
          data: ['03', 'STD', '11263', '153', '786'],
          axisLabel: { color: '#fff' },
          axisLine: { lineStyle: { color: '#008CFF' } }
        },
        series: [{
          name: '医疗设备',
          type: 'bar',
          data: [100, 200, 300, 150, 250],
          itemStyle: {
            color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
              { offset: 0, color: '#008CFF' },
              { offset: 1, color: '#00ADDD' }
            ])
          }
        }]
      };
      chart.setOption(option);
    },
    //底部右侧环形图
    initBottomRightDonutChart() {
      const chart = echarts.init(document.getElementById("bottom-right-donut-chart"));
      window.addEventListener('resize', () => chart.resize());
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          right: 'right',
          textStyle: { color: '#fff' }
        },
        series: [{
          name: '医疗设备',
          type: 'pie',
          radius: ['40%', '70%'],
          data: [
            { value: 400, name: '类型A' },
            { value: 300, name: '类型B' },
            { value: 200, name: '类型C' },
            { value: 100, name: '类型D' }
          ],
          itemStyle: {
            color: function(params) {
              const colors = ['#008CFF', '#00ADDD', '#9B59B6', '#FFA500'];
              return colors[params.dataIndex % colors.length];
            }
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%'
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      };
      chart.setOption(option);
    }
  }
};
</script>

<style lang="scss" scoped>
* {
  margin: 0;
  padding: 0;
  list-style-type: none;
  outline: none;
  box-sizing: border-box;
}

#equipment-index {
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
    width: 100%;
    height: 100%;
    padding: 16px 16px 0 16px;
    background-image: url("../../../assets/bg.jpg");
    background-size: cover;
    background-position: center center;
  }
  
  //顶部装饰
  .title_left {
    width: 100%;
    height: 50px;
  }
  
  .title_right {
    width: 100%;
    height: 50px;
    margin-top: 18px;
  }
  
  .title_center {
    width: 100%;
    height: 50px;
  }
  
  .title_text {
    text-align: center;
    font-size: 24px;
    font-weight: bold;
    margin-top: 14px;
    color: #008cff;
  }
  
  .title_time {
    text-align: center;
    color: #fff;
    font-size: 14px;
  }
  
  .title_controls {
    text-align: center;
    margin-top: 10px;
  }
  
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
    
    &:hover {
      background: linear-gradient(45deg, #00ADDD, #008CFF);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 140, 255, 0.4);
    }
  }
  
  //图表容器
  .chart-box {
    height: 100%;
    width: 100%;
    margin-bottom: 10px;
    
    .chart-title {
      text-align: center;
      font-size: 16px;
      color: #fff;
      padding: 10px 0;
      font-weight: bold;
    }
  }
  
  //顶部行
  .top-row {
    margin-top: 10px;
    margin-bottom: 10px;
    
    .chart-box {
      height: 300px;
    }
  }
  
  //中间行
  .middle-row {
    margin-bottom: 10px;
    
    .chart-box {
      height: 300px;
    }
  }
  
  //底部行
  .bottom-row {
    .chart-box {
      height: 300px;
    }
  }
  
  //关键指标容器
  .kpi-container {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 10px;
    padding: 20px;
    height: calc(100% - 50px);
  }
  
  .kpi-item {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: rgba(0, 140, 255, 0.1);
    border-radius: 4px;
    padding: 10px;
  }
  
  .kpi-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 5px;
  }
  
  .kpi-value {
    font-size: 20px;
    font-weight: bold;
    color: #00b891;
  }
  
  //右侧小图表容器
  .right-charts-container {
    display: flex;
    flex-direction: column;
    height: calc(100% - 50px);
    padding: 10px;
  }
  
  .small-donut-chart {
    flex: 1;
    margin-bottom: 10px;
    
    div {
      width: 100%;
      height: 100%;
    }
  }
  
  .small-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    padding: 10px;
  }
  
  .list-item {
    display: flex;
    justify-content: space-between;
    padding: 8px;
    background: rgba(0, 140, 255, 0.1);
    border-radius: 4px;
    margin-bottom: 5px;
  }
  
  .list-label {
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
  }
  
  .list-value {
    color: #00b891;
    font-size: 14px;
    font-weight: bold;
  }
  
  //图表容器
  #top-left-bar-chart,
  #top-right-line-chart,
  #middle-left-line-chart,
  #middle-center-line-chart,
  #donut-chart-1,
  #donut-chart-2,
  #bottom-left-donut-chart,
  #bottom-center-bar-chart,
  #bottom-right-donut-chart {
    width: 100%;
    height: calc(100% - 50px);
  }
}
</style>
