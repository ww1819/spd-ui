<template>
  <div class="app-container home">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="12" :lg="8" >
        <el-card class="update-log" style="height:42vh;">
          <div slot="header" class="clearfix">
            <span>仓库使用记录情况</span>
          </div>
          <div class="body">
              <div class="echart" id="ckchart" :style="myChartStyle"></div>
          </div>
        </el-card>

        <el-card class="update-log" style="height:43vh;margin-top: 2vh">
          <div slot="header" class="clearfix">
            <span>科室使用记录情况</span>
          </div>
          <div class="body">
              <div class="echart" id="kschart" :style="myChartStyle"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12" :lg="8">
        <el-card class="update-log" style="height: 87vh;">
          <div slot="header" class="clearfix">
            <span>今日统计</span>
          </div>
          <div class="body">
              <el-row>
                <el-col :xs="24" :sm="24" :md="12" :lg="8" >总订单数量</el-col>
                <el-col :xs="24" :sm="24" :md="12" :lg="8" >采购订单</el-col>
                <el-col :xs="24" :sm="24" :md="12" :lg="8" >入库单</el-col>
              </el-row>
              <el-row class="tj-number">
                <el-col :xs="24" :sm="24" :md="12" :lg="8" >0</el-col>
                <el-col :xs="24" :sm="24" :md="12" :lg="8" >0</el-col>
                <el-col :xs="24" :sm="24" :md="12" :lg="8" >0</el-col>
              </el-row>
              <el-row>
                <el-col :xs="24" :sm="24" :md="12" :lg="8" >出库单</el-col>
                <el-col :xs="24" :sm="24" :md="12" :lg="8" >退库单</el-col>
                <el-col :xs="24" :sm="24" :md="12" :lg="8" >申领单</el-col>
              </el-row>
              <el-row class="tj-number">
                <el-col :xs="24" :sm="24" :md="12" :lg="8" >0</el-col>
                <el-col :xs="24" :sm="24" :md="12" :lg="8" >0</el-col>
                <el-col :xs="24" :sm="24" :md="12" :lg="8" >0</el-col>
              </el-row>
              <el-row>
                <el-col :xs="24" :sm="24" :md="12" :lg="8" >申购单</el-col>
                <el-col :xs="24" :sm="24" :md="12" :lg="8" >库存数量</el-col>
                <el-col :xs="24" :sm="24" :md="12" :lg="8" >总库存金额</el-col>
              </el-row>
              <el-row class="tj-number">
                <el-col :xs="24" :sm="24" :md="12" :lg="8" >0</el-col>
                <el-col :xs="24" :sm="24" :md="12" :lg="8" >0</el-col>
                <el-col :xs="24" :sm="24" :md="12" :lg="8" >0</el-col>
              </el-row>
            </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12" :lg="8">
        <el-card class="update-log" style="height: 30vh;">
          <div slot="header" class="clearfix">
            <span>备忘录</span>
            <a style="margin-left: 80%;font-size: 10px;">更多>></a>
          </div>
        </el-card>
        <el-card class="update-log" style="height:55vh;margin-top: 2vh;">
          <div slot="header" class="clearfix">
            <span>常用附件下载</span>
            <a style="margin-left: 72%;font-size: 10px;">更多>></a>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
<style>
  a:hover {
    color: blue;
  }
  .tj-number{
    font-size: 2rem;
    color: blue;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }
</style>
<script>
  import * as echarts from "echarts";
export default {
  name: "Index",
  data() {
    return {
      // 版本号
      version: "3.8.6",
      CKtitle:['中心库', '试剂仓库', '高值耗材仓库'],
      CKxData: ['20', '30', '40', '50', '60', '70', '80'], //横坐标
      CKyData: [{name: '中心库',type: 'line', stack: 'Total',data: [120, 132, 101, 134, 90, 230, 210]},
                {name: '试剂仓库',type: 'line', stack: 'Total',data: [220, 182, 191, 234, 290, 330, 310] },
                {name: '高值耗材仓库',type: 'line',stack: 'Total',data: [150, 232, 201, 154, 190, 330, 410]}
      ], //数据
      KStitle:['领用数量', '领用金额','消耗数量','消耗金额'],
      KSxData: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'], //横坐标
      KSyData: [{name: '领用数量',type: 'line',stack: 'Total',data: [120, 132, 101, 134, 90, 230, 210, 289, 246, 250, 270, 220]},
                {name: '领用金额',type: 'line',stack: 'Total',data: [220, 182, 191, 234, 290, 330, 310, 270, 200, 230, 240, 250]},
                {name: '消耗数量',type: 'line',stack: 'Total',data: [320, 382, 391, 334, 390, 330, 310, 470, 300, 430, 240, 450]},
                {name: '消耗金额',type: 'line',stack: 'Total',data: [420, 482, 491, 434, 490, 430, 410, 370, 400, 330, 340, 250]}
      ], //数据
      myChartStyle: { float: "left", width: "100%", height: "30vh" } //图表样式
    };
  },mounted() {
    this.initCk();
    this.initKs();
  },
  methods: {
    goTarget(href) {
      window.open(href, "_blank");
    },
    initCk() {
      // 基本柱状图
      const option={
        title: {
          text: ''
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data:this.CKtitle
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        toolbox: {
          feature: {
            saveAsImage: {}
          }
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data:this.CKxData
        },
        yAxis: {
          type: 'value'
        },
        series:this.CKyData,
      };
      const myChart = echarts.init(document.getElementById("ckchart"));
      myChart.setOption(option);
      //随着屏幕大小调节图表
      window.addEventListener("resize", () => {
        myChart.resize();
      });
    },initKs() {
      // 基本柱状图
      const option={
        title: {
          text: ''
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data:this.KStitle
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        toolbox: {
          feature: {
            saveAsImage: {}
          }
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data:this.KSxData
        },
        yAxis: {
          type: 'value'
        },
        series:this.KSyData,
      };
      const myChart = echarts.init(document.getElementById("kschart"));
      myChart.setOption(option);
      //随着屏幕大小调节图表
      window.addEventListener("resize", () => {
        myChart.resize();
      });
    }
    }
};
</script>

<style scoped lang="scss">
.home {
  blockquote {
    padding: 10px 20px;
    margin: 0 0 20px;
    font-size: 17.5px;
    border-left: 5px solid #eee;
  }
  hr {
    margin-top: 20px;
    margin-bottom: 20px;
    border: 0;
    border-top: 1px solid #eee;
  }
  .col-item {
    margin-bottom: 20px;
  }

  ul {
    padding: 0;
    margin: 0;
  }

  font-family: "open sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 13px;
  color: #676a6c;
  overflow-x: hidden;

  ul {
    list-style-type: none;
  }

  h4 {
    margin-top: 0px;
  }

  h2 {
    margin-top: 10px;
    font-size: 26px;
    font-weight: 100;
  }

  p {
    margin-top: 10px;

    b {
      font-weight: 700;
    }
  }

  .update-log {
    ol {
      display: block;
      list-style-type: decimal;
      margin-block-start: 1em;
      margin-block-end: 1em;
      margin-inline-start: 0;
      margin-inline-end: 0;
      padding-inline-start: 40px;
    }
  }
}
</style>

