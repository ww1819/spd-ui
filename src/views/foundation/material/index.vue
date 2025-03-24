<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="耗材名称" prop="name">
            <el-input
              v-model="queryParams.name"
              placeholder="请输入耗材名称"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="供应商" prop="supplierId">
            <SelectSupplier v-model="queryParams.supplierId"/>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="6">
          <div style="display: inline">
            <span>起</span>
            <el-date-picker clearable
                            v-model="queryParams.beginDate"
                            type="date"
                            value-format="yyyy-MM-dd"
                            placeholder="请选择起始日期"
                            style="width: 140px"
            >
            </el-date-picker>
            <span>止</span>
            <el-date-picker clearable
                            v-model="queryParams.endDate"
                            type="date"
                            value-format="yyyy-MM-dd"
                            placeholder="请选择截止日期"
                            style="width: 140px"
            >
            </el-date-picker>
          </div>
        </el-col>

        <el-col :span="6">
          <el-form-item label="是否高值" prop="isGz">
            <el-select v-model="queryParams.isGz" placeholder="请选择">
              <el-option
                v-for="dict in dict.type.is_yes_no"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
            <el-button
              type="info"
              icon="el-icon-upload2"
              size="mini"
              @click="handleImport"
              v-hasPermi="['foundation:material:import']"
            >导入</el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['foundation:material:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['foundation:material:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="single"
          @click="handleDelete"
          v-hasPermi="['foundation:material:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['foundation:material:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="materialList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="id" width="50"/>
      <el-table-column label="耗材编码" align="center" prop="code" width="80"/>
      <el-table-column label="耗材名称" align="center" prop="name" width="180"/>
      <el-table-column label="供应商" align="center" prop="supplier.name" width="180"/>
      <el-table-column label="规格" align="center" prop="speci" />
      <el-table-column label="型号" align="center" prop="model" />
      <el-table-column label="价格" align="center" prop="prince" />
      <el-table-column label="单位" align="center" prop="fdUnit.unitName" />
      <el-table-column label="是否高值" align="center" prop="isGz">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.is_yes_no" :value="scope.row.isGz"/>
        </template>
      </el-table-column>
      <el-table-column label="创建日期" align="center" prop="createTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['foundation:material:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['foundation:material:remove']"
          >删除</el-button>
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

    <!-- 添加或修改耗材产品对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="1200px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col :span="6">
            <el-form-item label="耗材编码" prop="code" label-width="100px">
              <el-input v-model="form.code" :disabled="isDisabled" placeholder="请输入耗材编码" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="耗材名称" prop="name" label-width="100px">
              <el-input v-model="form.name" @input="nameChange" placeholder="请输入耗材名称" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="名称简码" prop="referredName" label-width="100px">
              <el-input v-model="form.referredName" :disabled="true" placeholder="请输入名称简码" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="供应商" prop="supplierId">
              <SelectSupplier v-model="form.supplierId" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="6">
            <el-form-item label="规格" prop="speci" label-width="100px">
              <el-input v-model="form.speci" placeholder="请输入规格" />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="型号" prop="model" label-width="100px">
              <el-input v-model="form.model" placeholder="请输入型号" />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="价格" prop="prince" label-width="100px">
              <el-input v-model="form.prince" placeholder="请输入价格" />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="通用名称" prop="useName" label-width="100px">
              <el-input v-model="form.useName" placeholder="请输入通用名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="6">
            <el-form-item label="生产厂家" prop="factoryId" label-width="100px">
              <SelectFactory v-model="form.factoryId"/>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="库房分类" prop="storeroomId" label-width="100px">
              <SelectWarehouseCategory v-model="form.storeroomId"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="财务分类" prop="financeCategoryId" label-width="100px">
              <SelectFinanceCategory v-model="form.financeCategoryId"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="单位" prop="unitId" label-width="100px">
              <SelectUnit v-model="form.unitId" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="6">
            <el-form-item label="注册证名称" prop="registerName" label-width="100px">
              <el-input v-model="form.registerName" placeholder="请输入注册证名称" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="注册证件号" prop="registerNo" label-width="100px">
              <el-input v-model="form.registerNo" placeholder="请输入注册证件号" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="医保名称" prop="medicalName" label-width="100px">
              <el-input v-model="form.medicalName" placeholder="请输入医保名称" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="医保编码" prop="medicalNo" label-width="100px">
              <el-input v-model="form.medicalNo" placeholder="请输入医保编码" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="6">
            <el-form-item label="有效期" prop="periodDate" label-width="100px">
              <el-date-picker clearable
                              v-model="form.periodDate"
                              type="date"
                              value-format="yyyy-MM-dd"
                              style="width: 150px"
                              placeholder="请选择有效期">
              </el-date-picker>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="招标类别" prop="successfulType" label-width="100px">
              <el-input v-model="form.successfulType" placeholder="请输入招标类别" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="中标号" prop="successfulNo" label-width="100px">
              <el-input v-model="form.successfulNo" placeholder="请输入中标号" />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="中标价格" prop="successfulPrice" label-width="100px">
              <el-input v-model="form.successfulPrice" placeholder="请输入中标价格" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="6">
            <el-form-item label="销售价" prop="salePrice" label-width="100px">
              <el-input v-model="form.salePrice" placeholder="请输入销售价" />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="包装规格" prop="packageSpeci" label-width="100px">
              <el-input v-model="form.packageSpeci" placeholder="请输入包装规格" />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label=" 产地" prop="producer" label-width="100px">
              <el-input v-model="form.producer" placeholder="请输入 产地" />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label=" 耗材级别" label-width="100px">
              <el-select v-model="form.materialLevel" placeholder="请选择耗材级别">
                <el-option
                  v-for="dict in dict.type.material_level_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="6">
            <el-form-item label=" 注册证级别" label-width="100px">
              <el-select v-model="form.registerLevel" placeholder="请选择注册证级别">
                <el-option
                  v-for="dict in dict.type.register_level_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label=" 风险级别" label-width="100px">
              <el-select v-model="form.riskLevel" placeholder="请选择风险级别">
                <el-option
                  v-for="dict in dict.type.risk_level_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label=" 急救类型" prop="firstaidLevel" label-width="100px">
              <el-select v-model="form.firstaidLevel" placeholder="请选择急救类型">
                <el-option
                  v-for="dict in dict.type.firstaid_level_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label=" 医用级别" prop="doctorLevel" label-width="100px">
              <el-select v-model="form.doctorLevel" placeholder="请选择医用级别">
                <el-option
                  v-for="dict in dict.type.doctor_level_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="6">
            <el-form-item label="品牌" prop="brand" label-width="100px">
              <el-input v-model="form.brand" placeholder="请输入品牌" />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="用途" prop="useto" label-width="100px">
              <el-input v-model="form.useto" placeholder="请输入用途" />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="材质" prop="quality" label-width="100px">
              <el-input v-model="form.quality" placeholder="请输入材质" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="功能" prop="function" label-width="100px">
              <el-input v-model="form.function" placeholder="请输入功能" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="6">
            <el-form-item label="储存方式" prop="isWay" label-width="100px">
              <el-select v-model="form.isWay" placeholder="请选择储存方式">
                <el-option
                  v-for="dict in dict.type.way_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="UDI码" prop="udiNo" label-width="100px">
              <el-input v-model="form.udiNo" placeholder="请输入UDI码" />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="许可证编号" prop="permitNo" label-width="100px">
              <el-input v-model="form.permitNo" placeholder="请输入许可证编号" />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="国家编码" prop="countryNo" label-width="100px">
              <el-input v-model="form.countryNo" placeholder="请输入国家编码" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="6">
            <el-form-item label="国家医保名称" prop="countryName" label-width="100px">
              <el-input v-model="form.countryName" placeholder="请输入国家医保名称" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="商品说明" prop="description" label-width="100px">
              <el-input v-model="form.description" placeholder="请输入商品说明" />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="使用状态" prop="isUse" label-width="100px">
              <el-select v-model="form.isUse" placeholder="请选择使用状态">
                <el-option
                  v-for="dict in dict.type.is_use_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="带量采购" prop="isProcure" label-width="100px">
              <el-select v-model="form.isProcure" placeholder="请选择带量采购">
                <el-option
                  v-for="dict in dict.type.is_yes_no"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="6">
            <el-form-item label="重点监测" prop="isMonitor" label-width="100px">
              <el-select v-model="form.isMonitor" placeholder="请选择重点监测">
                <el-option
                  v-for="dict in dict.type.is_yes_no"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="是否高值" prop="isGz" label-width="100px">
              <el-select v-model="form.isGz" placeholder="请选择是否高值">
                <el-option
                  v-for="dict in dict.type.is_yes_no"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
    <!-- 耗材导入对话框 -->
    <el-dialog :title="upload.title" :visible.sync="upload.open" width="400px" append-to-body>
      <el-upload
        ref="upload"
        :limit="1"
        accept=".xlsx, .xls"
        :headers="upload.headers"
        :action="upload.url + '?updateSupport=' + upload.updateSupport"
        :disabled="upload.isUploading"
        :on-progress="handleFileUploadProgress"
        :on-success="handleFileSuccess"
        :auto-upload="false"
        drag
      >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <div class="el-upload__tip text-center" slot="tip">
          <div class="el-upload__tip" slot="tip">
            <el-checkbox v-model="upload.updateSupport" /> 是否更新已经存在的耗材数据
          </div>
          <span>仅允许导入xls、xlsx格式文件。</span>
          <el-link type="primary" :underline="false" style="font-size:12px;vertical-align: baseline;" @click="importTemplate">下载模板</el-link>
        </div>
      </el-upload>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitFileForm">确 定</el-button>
        <el-button @click="upload.open = false">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listMaterial, getMaterial, delMaterial, addMaterial, updateMaterial } from "@/api/foundation/material";
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import SelectFactory from '@/components/SelectModel/SelectFactory';
import SelectFinanceCategory from "@/components/SelectModel/SelectFinanceCategory";
import SelectWarehouseCategory from "@/components/SelectModel/SelectWarehouseCategory";
import SelectUnit from "@/components/SelectModel/SelectUnit";
import { pinyin } from 'pinyin-pro'
import { getToken } from "@/utils/auth";

export default {
  name: "Material",
  dicts: ['is_use_status', 'is_yes_no','way_status','material_level_status', 'register_level_status','risk_level_status','firstaid_level_status','doctor_level_status'],
  components: {SelectSupplier,SelectFactory,SelectFinanceCategory,SelectWarehouseCategory,SelectUnit},
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      isDisabled: false,
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 耗材产品表格数据
      materialList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        code: undefined,
        name: undefined,
        supplierId: undefined,
        speci: undefined,
        model: undefined,
        prince: undefined,
        isGz: undefined,
        beginDate: undefined,
        endDate: undefined,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        code: [
          { required: true, message: "耗材编码不能为空", trigger: "blur" }
        ],
        name: [
          { required: true, message: "耗材名称不能为空", trigger: "blur" }
        ],
        supplierId: [
          { required: true, message: "供应商不能为空", trigger: "blur" }
        ],
        speci: [
          { required: true, message: "规格不能为空", trigger: "blur" }
        ],
        model: [
          { required: true, message: "型号不能为空", trigger: "blur" }
        ],
        prince: [
          { required: true, message: "价格不能为空", trigger: "blur" }
        ],
        referredName: [
          { required: true, message: "名称简码不能为空", trigger: "blur" }
        ],
        factoryId: [
          { required: true, message: "生产厂家不能为空", trigger: "blur" }
        ],
        storeroomId: [
          { required: true, message: "库房分类不能为空", trigger: "blur" }
        ],
        financeCategoryId: [
          { required: true, message: "财务分类不能为空", trigger: "blur" }
        ],
        unitId: [
          { required: true, message: "单位不能为空", trigger: "blur" }
        ],
      },
      // 用户导入参数
      upload: {
        // 是否显示弹出层（用户导入）
        open: false,
        // 弹出层标题（用户导入）
        title: "",
        // 是否禁用上传
        isUploading: false,
        // 是否更新已经存在的用户数据
        updateSupport: 0,
        // 设置上传的请求头部
        headers: { Authorization: "Bearer " + getToken() },
        // 上传的地址
        url: process.env.VUE_APP_BASE_API + "/foundation/material/importData"
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询耗材产品列表 */
    getList() {
      this.loading = true;
      listMaterial(this.queryParams).then(response => {
        this.materialList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
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
        code: null,
        name: null,
        supplierId: null,
        speci: null,
        model: null,
        prince: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        isGz: null,
        beginDate: null,
        endDate: null
      };
      this.resetForm("form");
    },
    nameChange(val){
      const pinYinCode = pinyin(val, {
        pattern: 'first',
        toneType: 'none',
        type: 'array',
      }).join('').toUpperCase();

      this.form.referredName = pinYinCode;
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
      this.handleQuery();
    },
    /** 导入按钮操作 */
    handleImport() {
      this.upload.title = "耗材导入";
      this.upload.open = true;
    },
    /** 下载模板操作 */
    importTemplate() {
      this.download('foundation/material/importTemplate', {
      }, `fdmaterial_template_${new Date().getTime()}.xlsx`)
    },
    // 文件上传中处理
    handleFileUploadProgress(event, file, fileList) {
      this.upload.isUploading = true;
    },
    // 文件上传成功处理
    handleFileSuccess(response, file, fileList) {
      this.upload.open = false;
      this.upload.isUploading = false;
      this.$refs.upload.clearFiles();
      this.$alert("<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + response.msg + "</div>", "导入结果", { dangerouslyUseHTMLString: true });
      this.getList();
    },
    // 提交上传文件
    submitFileForm() {
      this.$refs.upload.submit();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.isDisabled = false;
      this.title = "添加耗材产品";
      this.form.isGz = '2';
      this.form.isUse = '2';
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getMaterial(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.isDisabled = true;
        this.title = "修改耗材产品";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateMaterial(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addMaterial(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除耗材产品编号为"' + ids + '"的数据项？').then(function() {
        return delMaterial(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('foundation/material/export', {
        ...this.queryParams
      }, `material_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
