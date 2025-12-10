<template>
  <el-autocomplete
    v-model="warehouseName"
    :fetch-suggestions="querySearchAsync"
    placeholder="请输入内容"
    :trigger-on-focus="false"
  ></el-autocomplete>
</template>

<script>
import {listWarehouse, listWarehouseAll} from "@/api/foundation/warehouse";

export default {
  props: ['value','value2'],
  data() {
    return {
      // warehouseName:'',
      // 表单参数
      form: {},
    }
  },
  computed: {
    warehouseName: {
      get() {
        return this.value;
      },
      set(v) {
        this.$emit('input', v);
      }
    }
  },
  mounted() {
    // listWarehouse().then((res) => {
    //   this.restaurants = res.rows;
    // });
    let userId = this.$store.state.user.userId;
    listWarehouseAll(userId).then(response => {
      this.restaurants = response;
    });
  },
  created() {
    // this.getList();
  },
  methods: {
    querySearchAsync(queryString, cb) {

      const res = this.restaurants;
      if(res.length>0) {
        res.forEach(item => {
          item.value = item.name;
        })
      }

      let results = res.filter(item => {
        return item.value.toLowerCase().indexOf(queryString.toLowerCase()) !== -1;
      })
      cb(results);
    },
  }
}
</script>
