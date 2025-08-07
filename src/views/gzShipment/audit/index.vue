<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="出库单号" prop="shipmentNo" label-width="100px">
            <el-input v-model="queryParams.shipmentNo"
                      placeholder="请输入出库单号"
                      clearable
                      @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="制单日期" prop="shipmentDate" label-width="100px">
            <el-date-picker clearable
                            v-model="queryParams.shipmentDate"
                            type="date"
                            value-format="yyyy-MM-dd"
                            placeholder="请选择制单日期">
            </el-date-picker>
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="科室" prop="departmentId" label-width="100px">
            <SelectDepartment v-model="queryParams.departmentId" />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="仓库" prop="warehouseId" label-width="100px">
            <SelectWarehouse v-model="queryParams.warehouseId"/>
          </el-form-item>

        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="6" label-width="100px">
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-table v-loading="loading" :data="shipmentList" @selection-change="handleSelectionChange">
      <el-table-column label="出库单号" align="center" prop="shipmentNo" width="180">
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.shipmentNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="shipmentDate" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.shipmentDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" />
      <el-table-column label="科室" align="center" prop="department.name" />
      <el-table-column label="单据状态" align="center" prop="shipmentStatus">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.shipmentStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="出库类型" align="center" prop="shipmentType" >
        <template slot-scope="scope">
          <dict-tag :options="dict.type.bill_type" :value="scope.row.shipmentType"/>
        </template>
      </el-table-column>
      <el-table-column label="操作人" align="center" prop="createBy" />

      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            @click="handlePrint(scope.row,true)"
            v-if="scope.row.shipmentStatus == 2"
          >打印</el-button>
          <el-dropdown v-if="scope.row.shipmentStatus != 2">
            <el-button type="primary">
              更多操作<i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item @click.native="handleUpdate(scope.row)"
                                v-hasPermi="['gzShipment:apply:edit']"
              >修改</el-dropdown-item>

              <el-dropdown-item @click.native="handleAudit(scope.row)"
                                v-hasPermi="['gzShipment:apply:audit']"
              >审核</el-dropdown-item>

              <el-dropdown-item @click.native="handleDelete(scope.row)"
                                v-hasPermi="['gzShipment:apply:remove']"
              >删除</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </template>


      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改高值出库对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="1600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">

        <el-row>
          <el-col :span="4">
            <el-form-item label="单据状态" prop="shipmentStatus" label-width="100px">
              <el-select v-model="form.shipmentStatus" placeholder="请选择单据状态"
                         :disabled="true"
                         clearable style="width: 150px">
                <el-option v-for="dict in dict.type.biz_status"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="仓库" prop="warehouseId" label-width="80px">
              <SelectWarehouse v-model="form.warehouseId"/>
            </el-form-item>

          </el-col>
          <el-col :span="4">
            <el-form-item label="科室" prop="departmentId" label-width="100px">
              <SelectDepartment v-model="form.departmentId"/>
            </el-form-item>

          </el-col>

          <el-col :span="4">
            <el-form-item label="出库类型" prop="shipmentType" label-width="100px">
              <el-select v-model="form.shipmentType" placeholder="请选择出库类型"
                         :disabled="true"
                         clearable style="width: 150px">
                <el-option v-for="dict in dict.type.bill_type"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="制单日期" prop="shipmentDate" label-width="100px">
              <el-date-picker clearable
                              v-model="form.shipmentDate"
                              type="date"
                              :disabled="true"
                              value-format="yyyy-MM-dd"
                              style="width: 150px"
                              placeholder="请选择制单日期">
              </el-date-picker>
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="操作人" prop="createBy" label-width="100px">
              <el-input v-model="form.createBy" :disabled="true" />
            </el-form-item>
          </el-col>

        </el-row>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <span>出库明细信息</span>
          </el-col>

          <div v-show="action">
            <el-col :span="1.5">
              <el-button type="primary" icon="el-icon-plus" size="mini" @click="nameBtn">添加</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="danger" icon="el-icon-delete" size="mini" @click="handleDeleteGzShipmentEntry">删除</el-button>
            </el-col>
          </div>

        </el-row>
        <el-table :data="gzShipmentEntryList" :row-class-name="rowGzShipmentEntryIndex"
                  @selection-change="handleGzShipmentEntrySelectionChange"
        >
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="序号" align="center" prop="index" width="50"/>
          <el-table-column label="耗材" prop="materialId" width="120">
            <template slot-scope="scope">
              <SelectMaterial v-model="scope.row.materialId" :value2="isShow" />
            </template>
          </el-table-column>

          <el-table-column label="数量" prop="qty" width="120">
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.qty" placeholder="请输入数量"
                        onkeyup="value=value.replace(/\D/g,'')"
                        onafterpaste="value=value.replace(/\D/g,'')"
                        @blur="form.result=$event.target.value"
                        @input="qtyChange(scope.row)"
              />
            </template>
          </el-table-column>

          <el-table-column label="单价" prop="price" width="120">
            <template slot-scope="scope">
              <el-input v-model="scope.row.price" type='number' :disabled="true"
                        @input="priceChange(scope.row)" placeholder="请输入单价" />
            </template>
          </el-table-column>

          <el-table-column label="金额" prop="amt" width="120">
            <template slot-scope="scope">
              <el-input v-model="scope.row.amt" :disabled="true" placeholder="请输入金额" />
            </template>
          </el-table-column>
          <el-table-column label="批次号" prop="batchNo" width="240">
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNo" :disabled="true" placeholder="请输入批次号" />
            </template>
          </el-table-column>

          <el-table-column label="批号" prop="batchNumber" width="240">
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNumber" label-width="200px" placeholder="请输入批号" />
            </template>
          </el-table-column>
          <el-table-column label="生产日期" prop="beginTime" width="240">
            <template slot-scope="scope">
              <el-date-picker clearable
                              v-model="scope.row.beginTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              placeholder="请选择生产日期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="有效期" prop="andTime" width="240">
            <template slot-scope="scope">
              <el-date-picker clearable
                              v-model="scope.row.andTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              placeholder="请选择有效期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="400">
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" placeholder="请输入备注" />
            </template>
          </el-table-column>
        </el-table>
      </el-form>
      <div slot="footer" v-show="action" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync=" modalObj.show " :title=" modalObj.title " :width=" modalObj.width ">
      <template v-if=" modalObj.component === 'print-type' ">
        <el-radio-group v-model=" modalObj.form.value ">
          <el-radio :label=" 2 ">浏览器打印</el-radio>
        </el-radio-group>
      </template>
      <template v-if=" modalObj.form.value === 2 || modalObj.component === 'window-print-preview' ">
        <gz-shipment-print :row=" modalObj.form.row " ref="receiptOrderPrintRef"></gz-shipment-print>
      </template>
      <template slot="footer" class="dialog-footer">
        <el-button @click=" modalObj.cancel ">取消</el-button>
        <el-button @click=" modalObj.ok " type="primary">确认</el-button>
      </template>
    </el-dialog>

    <!-- 3、使用组件 -->
    <SelectGzDepotInventory
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :warehouseValue="warehouseValue"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectGzDepotInventory>
  </div>
</template>

<script>
import { listShipment, getShipment, delShipment, addShipment, updateShipment, auditShipment } from "@/api/gz/shipment";
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectGzDepotInventory from '@/components/SelectModel/SelectGzDepotInventory';
import {STOCK_OUT_TEMPLATE} from "@/utils/printData";
import RMBConverter from "@/utils/tools";
import gzShipmentPrint from "@/views/gzShipment/audit/gzShipmentPrint";

export default {
  name: "ShipmentAudit",
  dicts: ['biz_status','bill_type'],
  components: {SelectMaterial,SelectWarehouse,SelectDepartment,SelectGzDepotInventory,gzShipmentPrint},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      warehouseValue: "",
      isShow: true,
      modalObj: {
        title: '选择打印方式',
        width: '520px',
        component: null,
        form: {
          value: null,
          row: null
        },
        ok: () => {
        },
        cancel: () => {
        }
      },
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedGzShipmentEntry: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 高值出库表格数据
      shipmentList: [],
      // 高值出库明细表格数据
      gzShipmentEntryList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      //是否显示
      action: true,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        shipmentNo: null,
        departmentId: null,
        shipmentDate: null,
        warehouseId: null,
        shipmentStatus: null,
        shipmentType: null,
        auditDate: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询高值出库列表 */
    getList() {
      this.loading = true;
      listShipment(this.queryParams).then(response => {
        this.shipmentList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    nameBtn() {
      if(!this.form.warehouseId) {
        this.$message({ message: '请先选择仓库', type: 'warning' })
        return
      }

      //打开“弹窗组件”
      this.DialogComponentShow = true
      this.warehouseValue = this.form.warehouseId;
    },
    closeDialog() {
      //关闭“弹窗组件”
      this.DialogComponentShow = false
    },
    selectData(val) {
      //监听“弹窗组件”返回的数据
      this.selectRow = val;
      this.selectRow.forEach((item, index) => {

        let obj = {};
        obj.materialId = item.materialId;
        obj.price = item.unitPrice;
        obj.amt = item.amt;
        obj.batchNo = item.batchNo;
        obj.batchNumber = item.batchNumber;
        obj.beginTime = item.beginTime;
        obj.andTime = item.andTime;
        obj.remark = item.remark;
        this.gzShipmentEntryList.push(obj);
      });
    },
    //当天日期
    getBillDate(){
      let now = new Date();
      let year = now.getFullYear();
      let month = now.getMonth() + 1;
      let day = now.getDate();
      return year + "-" + month + "-" + day;
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        shipmentNo: null,
        departmentId: null,
        shipmentDate: null,
        warehouseId: null,
        shipmentStatus: null,
        shipmentType: null,
        delFlag: null,
        auditDate: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.gzShipmentEntryList = [];
      this.resetForm("form");
    },
    //数量改变事件
    qtyChange(row){
      let totalAmt = 0;
      if(row.qty && row.price){
        totalAmt = row.qty * row.price;
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);
    },
    //价格改变事件
    priceChange(row){
      let totalAmt = 0;
      if(row.qty && row.price){
        totalAmt = row.qty * row.price;
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 查看按钮操作 */
    handleView(row){
      const id = row.id
      getShipment(id).then(response => {
        this.form = response.data;
        this.gzShipmentEntryList = response.data.gzShipmentEntryList;
        this.open = true;
        this.action = false;
        this.form.shipmentStatus = '2';
        this.form.shipmentType = '201';
        this.title = "查看高值出库";
      });
    },
    /** 审核按钮操作 */
    handleAudit(row) {
      this.reset();
      const id = row.id || this.ids

      this.$modal.confirm('确定要审核"' + id + '"的数据项？').then(function() {
        return auditShipment({id:id});
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("审核出库成功！");
      }).catch(() => {});

    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.form.shipmentStatus = '1';
      this.form.shipmentType = '201';
      //操作人
      var userName = this.$store.state.user.name;
      this.form.createBy = userName;
      this.form.shipmentDate = this.getBillDate();
      this.open = true;
      this.title = "添加高值出库";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getShipment(id).then(response => {
        this.form = response.data;
        this.gzShipmentEntryList = response.data.gzShipmentEntryList;
        this.open = true;
        this.title = "修改高值出库";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.form.gzShipmentEntryList = this.gzShipmentEntryList;
          if (this.form.id != null) {
            updateShipment(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addShipment(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 打印按钮操作 */
    handlePrint(row, print){
      this.modalObj = {
        show: true,
        title: '选择打印方式',
        width: '520px',
        component: 'print-type',
        form: {
          value: 1,
          row
        },
        ok: () => {
          this.modalObj.show = false
          if (this.modalObj.form.value === 1) {
            this.doPrintOut(row, false)
          } else {
            this.windowPrintOut(row, print)
          }
        },
        cancel: () => {
          this.modalObj.show = false
        }
      }
    },
    windowPrintOut(row, print) {
      this.getShipmentDetail(row).then(res => {
        if (print) {
          this.modalObj.form.row = res
          this.$nextTick(() => {
            this.$refs['receiptOrderPrintRef'].start()
          })
          return
        }
        this.$nextTick(() => {
          this.modalObj = {
            show: true,
            title: '浏览器打印预览',
            width: '800px',
            component: 'window-print-preview',
            form: {
              value: 1,
              row,
              print
            },
            ok: () => {
              this.modalObj.show = false
            },
            cancel: () => {
              this.modalObj.show = false
            }
          }
        })
      })
    },
    doPrintOut(row, print) {
      this.row.then(result => {
        if (print) {
          this.$lodop.print(STOCK_OUT_TEMPLATE, [result])
        } else {
          this.$lodop.preview(STOCK_OUT_TEMPLATE, [result])
        }
      })
    },
    //组装打印信息
    getShipmentDetail(row) {
      //查询详情
      return row;
      // getShipment(row.id).then(response => {
      //   const details = response.data.gzShipmentEntryList
      //   const materiaDetails = response.data.materialList
      //   const map = {};
      //
      //   (materiaDetails || []).forEach(it => {
      //     map[it.id] = it
      //   })
      //
      //   let detailList = [], totalAmt = 0, totalQty = 0
      //
      //   details && details.forEach(item => {
      //     totalAmt += item.amt
      //     totalQty += item.qty
      //
      //     const prod = map[item.materialId]
      //
      //     detailList.push({
      //       batchNumber: item.batchNumber,
      //       amt: item.amt,
      //       qty: item.qty,
      //       price: item.price,
      //       materialCode: prod.code,
      //       materialName: prod.name,
      //       materialSpeci: prod.speci,
      //       periodDate: prod.periodDate,
      //       factoryName: prod.fdFactory.factoryName,
      //       warehouseCategoryName: prod.fdWarehouseCategory.warehouseCategoryName,
      //     })
      //
      //   })
      //
      //   let totalAmtConverter = RMBConverter.numberToChinese(totalAmt);
      //
      //   return {
      //     shipmentNo: row.shipmentNo,
      //     departmentName: row.department.name,
      //     warehouseName: row.warehouse.name,
      //     shipmentDate: row.shipmentDate,
      //     auditDate: row.auditDate,
      //     totalAmt: totalAmt,
      //     totalQty: totalQty,
      //     totalAmtConverter: totalAmtConverter,
      //     detailList:detailList
      //   }
      // })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除高值出库编号为"' + ids + '"的数据项？').then(function() {
        return delShipment(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
	/** 高值出库明细序号 */
    rowGzShipmentEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 高值出库明细添加按钮操作 */
    handleAddGzShipmentEntry() {
      let obj = {};
      obj.materialId = "";
      obj.qty = "";
      obj.price = "";
      obj.amt = "";
      obj.batchNo = "";
      obj.batchNumber = "";
      obj.beginTime = "";
      obj.andTime = "";
      obj.remark = "";
      this.gzShipmentEntryList.push(obj);
    },
    /** 高值出库明细删除按钮操作 */
    handleDeleteGzShipmentEntry() {
      if (this.checkedGzShipmentEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的高值出库明细数据");
      } else {
        const gzShipmentEntryList = this.gzShipmentEntryList;
        const checkedGzShipmentEntry = this.checkedGzShipmentEntry;
        this.gzShipmentEntryList = gzShipmentEntryList.filter(function(item) {
          return checkedGzShipmentEntry.indexOf(item.index) == -1
        });
      }
    },
    /** 复选框选中数据 */
    handleGzShipmentEntrySelectionChange(selection) {
      this.checkedGzShipmentEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('gz/shipment/export', {
        ...this.queryParams
      }, `shipment_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
