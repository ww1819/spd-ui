<template>
  <div class="app-container">
    <el-row :gutter="20">
      <!-- 左侧68分类树 -->
      <el-col :span="4">
        <el-card class="tree-card">
          <div slot="header" class="tree-header">
            <span>68分类</span>
          </div>
          <el-tree
            :data="treeData"
            :props="treeProps"
            node-key="category68Id"
            highlight-current
            @node-click="handleCategoryNodeClick"
            :indent="20"
            :default-expanded-keys="defaultExpandedKeys"
          >
            <span slot-scope="{ node }" class="custom-tree-node">
              <i class="el-icon-folder-opened" />
              <span>{{ node.label }}</span>
            </span>
          </el-tree>
        </el-card>
      </el-col>

      <!-- 右侧表格区域 -->
      <el-col :span="20">
        <!-- 查询条件容器 -->
        <div class="query-container">
          <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
            <el-row class="query-row-first">
              <el-col :span="24">
                <el-form-item label="档案名称" prop="name" class="query-item-inline">
                  <el-input
                    v-model="queryParams.name"
                    placeholder="请输入档案名称"
                    clearable
                    @keyup.enter.native="handleQuery"
                    style="width: 180px"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row class="query-row-second">
              <el-col :span="24" style="display: flex; flex-wrap: nowrap; align-items: center;">
                <el-form-item label="创建日期" class="query-item-inline" style="margin-right: 16px;">
                  <el-date-picker
                    v-model="queryParams.beginDate"
                    type="date"
                    value-format="yyyy-MM-dd"
                    placeholder="起始日期"
                    clearable
                    style="width: 100px; margin-right: 4px;"
                  />
                  <span style="margin: 0 2px;">至</span>
                  <el-date-picker
                    v-model="queryParams.endDate"
                    type="date"
                    value-format="yyyy-MM-dd"
                    placeholder="截止日期"
                    clearable
                    style="width: 100px; margin-left: 4px;"
                  />
                </el-form-item>

                <el-form-item label="状态" prop="isUse" class="query-item-inline" style="margin-right: 16px;">
                  <el-select v-model="queryParams.isUse" placeholder="请选择" style="width: 100px">
                    <el-option
                      v-for="dict in dict.type.is_use_status"
                      :key="dict.value"
                      :label="dict.label"
                      :value="dict.value"
                    ></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <!-- 操作按钮 -->
        <el-row :gutter="10" class="mb8" style="padding-top: 10px">
          <el-col :span="1.5">
            <el-button
              type="primary"
              plain
              icon="el-icon-plus"
              size="small"
              @click="handleAdd"
              v-hasPermi="['foundation:equipmentDict:add']"
            >新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              type="success"
              plain
              icon="el-icon-edit"
              size="small"
              :disabled="single"
              @click="handleUpdate"
              v-hasPermi="['foundation:equipmentDict:edit']"
            >修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              type="danger"
              plain
              icon="el-icon-delete"
              size="small"
              :disabled="single"
              @click="handleDelete"
              v-hasPermi="['foundation:equipmentDict:remove']"
            >删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              type="warning"
              plain
              icon="el-icon-download"
              size="small"
              @click="handleExport"
              v-hasPermi="['foundation:equipmentDict:export']"
            >导出</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              type="primary"
              icon="el-icon-search"
              size="small"
              @click="handleQuery"
            >搜索</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              icon="el-icon-refresh"
              size="small"
              @click="resetQuery"
            >重置</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              type="info"
              icon="el-icon-upload2"
              size="small"
              @click="handleImport"
              v-hasPermi="['foundation:equipmentDict:import']"
            >导入</el-button>
          </el-col>
          <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>

    <el-table v-loading="loading" :data="equipmentDictList" :row-class-name="equipmentDictIndex" @selection-change="handleSelectionChange" height="58vh" border>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column type="index" label="序号" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="档案编码" align="center" prop="code" width="100" show-overflow-tooltip resizable/>
      <el-table-column label="档案名称" align="center" prop="name" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="所属分类" align="center" prop="speci" width="250" show-overflow-tooltip resizable/>
      <el-table-column label="资产分类" align="center" prop="model" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="单位" align="center" prop="fdUnit.unitName" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="财务分类" align="center" prop="isWay" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.way_status" :value="scope.row.isWay"/>
        </template>
      </el-table-column>
      <el-table-column label="折旧年限" align="center" prop="depreciationYears" width="100" show-overflow-tooltip resizable/>
      <el-table-column label="使用年限" align="center" prop="useYears" width="100" show-overflow-tooltip resizable/>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['foundation:equipmentDict:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['foundation:equipmentDict:remove']"
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
      </el-col>
    </el-row>

    <!-- 添加或修改设备字典局部弹窗 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content equipmentDict-modal-content">
        <div class="modal-header">
          <div class="modal-title">{{ title }}</div>
          <el-button @click="cancel" class="close-btn">关闭</el-button>
          </div>
        <el-tabs v-model="activeTab">
          <!-- 基本信息 -->
          <el-tab-pane label="基本信息" name="form">
            <el-form ref="form" :model="form" :rules="rules" label-width="120px">
              <!-- 第一行 -->
              <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="档案编码：" prop="code">
                    <el-input 
                      v-model="form.code" 
                      :disabled="true"
                      placeholder="选择所属分类后自动显示" 
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="档案名称：" prop="name">
                    <el-input v-model="form.name" @input="nameChange" placeholder="请输入档案名称" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="所属分类：" prop="category68Id">
                    <el-select 
                      v-model="form.category68Id" 
                      placeholder="请选择所属分类" 
                      style="width: 100%"
                      filterable
                      clearable
                      @change="handleCategory68Change"
                    >
                      <el-option
                        v-for="item in category68Options"
                        :key="item.category68Id"
                        :label="getCategory68DisplayLabel(item)"
                        :value="item.category68Id"
                      >
                        <span>{{ item.category68Name }}</span>
                      </el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- 第二行 -->
              <el-row :gutter="20">
                <el-col :span="4">
                  <el-form-item label="单位：" prop="unitId">
                    <SelectUnit v-model="form.unitId" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="财务分类：" prop="isWay">
                    <el-select v-model="form.isWay" placeholder="请选择财务分类" style="width: 100%">
                      <el-option
                        v-for="dict in dict.type.way_status"
                        :key="dict.value"
                        :label="dict.label"
                        :value="dict.value"
                      ></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="折旧年限：" prop="depreciationYears">
                    <el-input-number v-model="form.depreciationYears" placeholder="请输入折旧年限" :min="0" :precision="0" style="width: 100%" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="使用年限：" prop="useYears">
                    <el-input-number v-model="form.useYears" placeholder="请输入使用年限" :min="0" :precision="0" style="width: 100%" />
                  </el-form-item>
                </el-col>
              </el-row>
            </el-form>
          </el-tab-pane>
        
          <!-- 产品图片 -->
          <el-tab-pane label="产品图片" name="image">
            <div class="image-tab-content" style="text-align: center; padding: 40px 20px;">
            <div class="equipmentDict-image-container" style="display: inline-block;">
              <el-upload
                ref="imageUpload"
                :action="imageUploadUrl"
                :headers="imageUploadHeaders"
                :show-file-list="false"
                :on-success="handleImageSuccess"
                :before-upload="beforeImageUpload"
                :auto-upload="true"
                accept="image/*"
              >
                <div v-if="form.imageUrl" class="equipmentDict-image-preview-large" slot="trigger">
                  <img :src="form.imageUrl" alt="设备图片" @click.stop="previewImage" />
                  <div class="image-overlay">
                    <i class="el-icon-zoom-in" @click.stop="previewImage" title="查看图片"></i>
                    <i class="el-icon-delete" @click.stop="removeImage" title="删除图片"></i>
                  </div>
                </div>
                <div v-else class="equipmentDict-image-placeholder-large" slot="trigger">
                  <i class="el-icon-plus"></i>
                  <div style="font-size: 14px; color: #999; margin-top: 10px;">点击上传图片</div>
                  <div style="font-size: 12px; color: #ccc; margin-top: 5px;">支持 JPG、PNG 格式，大小不超过 2MB</div>
                </div>
              </el-upload>
              <div v-if="form.imageUrl" style="margin-top: 20px;">
                <el-button type="primary" icon="el-icon-view" @click="previewImage">查看图片</el-button>
                <el-button type="success" icon="el-icon-check" @click="saveImage">保存</el-button>
                <el-button type="danger" icon="el-icon-delete" @click="removeImage">删除图片</el-button>
              </div>
            </div>
          </div>
          </el-tab-pane>
        </el-tabs>
        
        <div class="dialog-footer" style="text-align:center;margin-top:16px;">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>

    <!-- 图片预览对话框 -->
    <el-dialog
      title="图片预览"
      :visible.sync="imagePreviewVisible"
      width="800px"
      append-to-body
    >
      <div style="text-align: center;">
        <img :src="imagePreviewUrl" style="max-width: 100%; max-height: 600px;" alt="预览图片" />
      </div>
    </el-dialog>

    <!-- 设备导入对话框 -->
    <div v-if="upload.open" class="local-modal-mask">
      <div class="local-modal-content" style="width: 500px;">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ upload.title }}</div>
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
            <el-checkbox v-model="upload.updateSupport" /> 是否更新已经存在的资产数据
          </div>
          <span>仅允许导入xls、xlsx格式文件。</span>
          <el-link type="primary" :underline="false" style="font-size:12px;vertical-align: baseline;" @click="importTemplate">下载模板</el-link>
        </div>
      </el-upload>
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
        <el-button type="primary" @click="submitFileForm">确 定</el-button>
        <el-button @click="upload.open = false">取 消</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { listEquipmentDict, listEquipmentDictAll, getEquipmentDict, delEquipmentDict, addEquipmentDict, updateEquipmentDict } from "@/api/foundation/equipmentDict";
import { treeselect } from "@/api/foundation/category68";
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import SelectFactory from '@/components/SelectModel/SelectFactory';
import SelectFinanceCategory from "@/components/SelectModel/SelectFinanceCategory";
import SelectWarehouseCategory from "@/components/SelectModel/SelectWarehouseCategory";
import SelectUnit from "@/components/SelectModel/SelectUnit";
import SelectLocation from "@/components/SelectModel/SelectLocation";
import { pinyin } from 'pinyin-pro'
import { getToken } from "@/utils/auth";

export default {
  name: "EquipmentDict",
  dicts: ['is_use_status', 'is_yes_no','way_status','equipment_level_status', 'register_level_status','risk_level_status','firstaid_level_status','doctor_level_status'],
  components: {SelectSupplier,SelectFactory,SelectFinanceCategory,SelectWarehouseCategory,SelectUnit,SelectLocation},
  data() {
    return {
      // 树形数据
      treeData: [],
      treeProps: {
        label: 'category68Name',
        children: 'children'
      },
      // 默认展开的节点keys（根节点）
      defaultExpandedKeys: [],
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
      // 设备字典表格数据
      equipmentDictList: [],
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
        price: undefined,
        isGz: undefined,
        storeroomId: undefined,
        financeCategoryId: undefined,
        isFollow: undefined,
        isUse: undefined,
        udiNo: undefined,
        beginDate: undefined,
        endDate: undefined,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        code: [
          { required: true, message: "资产编码不能为空", trigger: "blur" },
          { validator: (rule, value, callback) => {
            if (!value) {
              callback();
              return;
            }
            
            // 只验证编码不能为空，不限制长度和格式
            // 手工输入的编码可以是任意长度和格式
            // 自动生成的编码仍然是6位数字
            
            // 检查编码是否已存在（排除当前编辑的记录）
            listEquipmentDict({ code: value, pageNum: 1, pageSize: 1 }).then(response => {
              if (response.rows && response.rows.length > 0) {
                const existingEquipmentDict = response.rows[0];
                // 如果是新增模式，或者存在其他记录的编码，则报错
                if (!this.form.id || existingEquipmentDict.id !== this.form.id) {
                  callback(new Error('该资产编码已存在，请使用其他编码'));
                } else {
                  callback();
                }
              } else {
                callback();
              }
            }).catch(() => {
              callback();
            });
          }, trigger: "blur" }
        ],
        name: [
          { required: true, message: "资产名称不能为空", trigger: "blur" }
        ],
        category68Id: [
          { required: true, message: "所属分类不能为空", trigger: "change" }
        ],
        referredName: [
          { required: true, message: "资产简码不能为空", trigger: "blur" }
        ],
        unitId: [
          { required: true, message: "资产单位不能为空", trigger: "blur" }
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
        url: process.env.VUE_APP_BASE_API + "/foundation/equipmentDict/importData"
      },
      // 图片上传配置
      imageUploadUrl: process.env.VUE_APP_BASE_API + "/common/upload",
      imageUploadHeaders: { Authorization: "Bearer " + getToken() },
      imagePreviewVisible: false,
      imagePreviewUrl: '',
      // 当前激活的标签页：'form' 表单视图，'image' 图片视图
      activeTab: 'form',
      // 68分类选项列表（用于资产分类下拉框）
      category68Options: []
    };
  },
  created() {
    this.loadTreeData();
    this.loadCategory68Options();
    this.getList();
  },
  methods: {
    /** 加载68分类树形数据 */
    loadTreeData() {
      treeselect().then(response => {
        const allData = response.data || [];
        // 构建树形数据
        const tree = this.buildTree(allData, 0);
        this.treeData = [{
          category68Id: 'root',
          category68Name: '全部68分类',
          children: tree
        }];
        // 默认只展开根节点，一级分类显示但折叠（向右箭头），二级及以下不显示
        this.defaultExpandedKeys = ['root'];
      }).catch(() => {
        console.error('加载68分类树失败');
      });
    },
    /** 构建树形结构 */
    buildTree(data, parentId) {
      const tree = [];
      data.forEach(item => {
        if (item.parentId === parentId || (parentId === 0 && (item.parentId === null || item.parentId === 0))) {
          const children = this.buildTree(data, item.category68Id);
          if (children.length > 0) {
            item.children = children;
          }
          tree.push(item);
        }
      });
      return tree;
    },
    /** 加载68分类选项（用于资产分类下拉框） */
    loadCategory68Options() {
      return treeselect().then(response => {
        const allData = response.data || [];
        // 将树形数据扁平化为选项数组
        this.category68Options = this.flattenCategory68Tree(allData);
        return this.category68Options;
      }).catch(() => {
        console.error('加载68分类选项失败');
        this.category68Options = [];
        return [];
      });
    },
    /** 将68分类树形数据扁平化为选项数组 */
    flattenCategory68Tree(data) {
      const options = [];
      const flatten = (items) => {
        items.forEach(item => {
          // 生成首字母拼音码
          let pinyinCode = '';
          if (item.category68Name) {
            try {
              pinyinCode = pinyin(item.category68Name, {
                pattern: 'first',
                toneType: 'none',
                type: 'array',
              }).join('').toUpperCase();
            } catch (e) {
              console.error('生成拼音码失败:', e);
            }
          }
          options.push({
            category68Id: item.category68Id,
            category68Name: item.category68Name,
            category68Code: item.category68Code,
            pinyinCode: pinyinCode
          });
          if (item.children && item.children.length > 0) {
            flatten(item.children);
          }
        });
      };
      flatten(data);
      return options;
    },
    /** 获取所属分类的显示标签（包含拼音码用于搜索，但显示时隐藏） */
    getCategory68DisplayLabel(item) {
      // 在 label 中包含拼音码，用特殊字符分隔
      // Element UI 的默认过滤会搜索整个 label，包括拼音码
      // 但显示时我们只显示中文名称（通过 el-option 的 slot）
      if (item.pinyinCode) {
        return `${item.category68Name}|${item.pinyinCode}`;
      }
      return item.category68Name;
    },
    /** 所属分类选择变化事件 */
    handleCategory68Change(value) {
      if (value) {
        const selectedCategory = this.category68Options.find(item => item.category68Id === value);
        if (selectedCategory && selectedCategory.category68Code) {
          this.form.code = selectedCategory.category68Code;
          // 触发code字段验证
          this.$nextTick(() => {
            this.$refs.form && this.$refs.form.validateField('code');
          });
        }
      } else {
        this.form.code = '';
      }
    },
    /** 68分类树节点点击事件 */
    handleCategoryNodeClick(data) {
      if (data.category68Id !== 'root') {
        // 根据选中的分类筛选设备列表
        // 这里可以根据需要添加分类筛选逻辑
        console.log('选中分类:', data);
      } else {
        // 点击根节点，清除分类筛选
        this.queryParams.category68Id = undefined;
        this.handleQuery();
      }
    },
    /** 查询设备字典列表 */
    getList() {
      this.loading = true;
      listEquipmentDict(this.queryParams).then(response => {
        this.equipmentDictList = response.rows;
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
        price: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        isGz: '2', // 默认否
        isBilling: '2', // 默认否
        isFollow: '2', // 默认否
        isMonitor: '2', // 默认否
        isUse: '2', // 默认停用
        beginDate: null,
        endDate: null,
        imageUrl: null,
        sunshineCode: null,
        locationId: null
      };
      this.resetForm("form");
    },
    nameChange(val){
      if (!val || val.trim() === '') {
        this.form.referredName = '';
        // 清空所属分类
        this.form.category68Id = null;
        this.form.code = '';
        return;
      }
      
      // 提取每个字符的首字母
      const pinYinCode = pinyin(val, {
        pattern: 'first',
        toneType: 'none',
        type: 'array',
      }).join('').toUpperCase();

      this.form.referredName = pinYinCode;
      
      // 自动匹配所属分类
      this.autoMatchCategory68(val);
    },
    /** 自动匹配68分类 */
    autoMatchCategory68(name) {
      if (!name || !name.trim() || !this.category68Options || this.category68Options.length === 0) {
        return;
      }
      
      const searchName = name.trim();
      let bestMatch = null;
      let bestScore = 0;
      
      // 遍历所有68分类选项，查找匹配项
      this.category68Options.forEach(item => {
        if (!item.category68Name) return;
        
        const categoryName = item.category68Name;
        let score = 0;
        
        // 如果分类名称完全包含档案名称，得分最高
        if (categoryName.includes(searchName)) {
          score = searchName.length / categoryName.length;
          // 如果分类名称以档案名称结尾，得分更高
          if (categoryName.endsWith(searchName)) {
            score += 0.5;
          }
          // 如果分类名称完全等于档案名称，得分最高
          if (categoryName === searchName) {
            score = 1;
          }
        }
        
        // 如果档案名称包含分类名称的关键部分，也给一定分数
        // 提取分类名称的最后部分（通常是具体分类）
        const parts = categoryName.split('-');
        if (parts.length > 0) {
          const lastPart = parts[parts.length - 1];
          if (lastPart.includes(searchName) || searchName.includes(lastPart)) {
            score = Math.max(score, 0.3);
          }
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = item;
        }
      });
      
      // 如果找到匹配项且得分足够高（大于0.3），自动选择
      if (bestMatch && bestScore >= 0.3) {
        this.form.category68Id = bestMatch.category68Id;
        // 触发分类变化事件，自动填充档案编码
        this.handleCategory68Change(bestMatch.category68Id);
      }
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
      this.upload.title = "资产导入";
      this.upload.open = true;
    },
    /** 下载模板操作 */
    importTemplate() {
      this.download('foundation/equipmentDict/importTemplate', {
      }, `fdequipmentDict_template_${new Date().getTime()}.xlsx`)
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
    /** 生成6位数字编码 */
    async generateCode() {
      // 查询所有资产编码，找出最大的6位数字编码
      try {
        const response = await listEquipmentDictAll({});
        const equipmentDictList = response.rows || response.data || [];
        const codes = equipmentDictList
          .map(item => item.code)
          .filter(code => code && /^\d{6}$/.test(code))
          .map(code => parseInt(code))
          .filter(num => !isNaN(num) && num >= 100000 && num <= 999999);
        
        if (codes.length > 0) {
          const maxCode = Math.max(...codes);
          const nextCode = maxCode + 1;
          // 确保不超过999999
          if (nextCode <= 999999) {
            return String(nextCode).padStart(6, '0');
          }
        }
      } catch (error) {
        console.error('查询编码失败:', error);
      }
      
      // 如果没有现有编码或已达到最大值，从100000开始
      return '100000';
    },
    /** 处理编码输入 */
    handleCodeInput(value) {
      // 如果用户清空编码，在blur时自动生成
      if (!value || value.trim() === '') {
        this.form.code = '';
      }
    },
    /** 验证编码（blur事件） */
    async validateCode() {
      if (!this.form.code || this.form.code.trim() === '') {
        // 如果没有输入编码，自动生成
        this.form.code = await this.generateCode();
        // 触发验证
        this.$nextTick(() => {
          this.$refs.form.validateField('code');
        });
      } else {
        // 如果有输入，验证唯一性
        this.$refs.form.validateField('code');
      }
    },
    /** 新增按钮操作 */
    async handleAdd() {
      this.reset();
      this.open = true;
      this.isDisabled = false;
      this.loadCategory68Options();
      this.title = "添加资产字典";
      this.form.isGz = '2';
      this.form.isBilling = '2';
      this.form.isFollow = '2';
      this.form.isMonitor = '2';
      this.form.isUse = '1'; // 默认为启用
      this.form.code = ''; // 初始为空，选择所属分类后自动填充
      this.activeTab = 'form'; // 默认显示表单视图
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      this.isDisabled = true; // 修改模式下，资产编码不可修改
      const id = row.id || this.ids
      // 确保68分类选项已加载
      Promise.resolve().then(() => {
        if (!this.category68Options || this.category68Options.length === 0) {
          return this.loadCategory68Options();
        }
      }).then(() => {
        return getEquipmentDict(id);
      }).then(response => {
        this.form = response.data;
        // 确保 isUse 是字符串类型，以便开关组件正常工作
        if (this.form.isUse !== null && this.form.isUse !== undefined) {
          this.form.isUse = String(this.form.isUse);
        } else {
          this.form.isUse = '2'; // 默认为停用
        }
        // 确保 isGz 是字符串类型，以便开关组件正常工作
        if (this.form.isGz !== null && this.form.isGz !== undefined) {
          this.form.isGz = String(this.form.isGz);
        } else {
          this.form.isGz = '2'; // 默认为否
        }
        // 确保 isBilling 是字符串类型，以便开关组件正常工作
        if (this.form.isBilling !== null && this.form.isBilling !== undefined) {
          this.form.isBilling = String(this.form.isBilling);
        } else {
          this.form.isBilling = '2'; // 默认为否
        }
        // 确保 isFollow 是字符串类型，以便开关组件正常工作
        if (this.form.isFollow !== null && this.form.isFollow !== undefined) {
          this.form.isFollow = String(this.form.isFollow);
        } else {
          this.form.isFollow = '2'; // 默认为否
        }
        // 确保 isMonitor 是字符串类型，以便开关组件正常工作
        if (this.form.isMonitor !== null && this.form.isMonitor !== undefined) {
          this.form.isMonitor = String(this.form.isMonitor);
        } else {
          this.form.isMonitor = '2'; // 默认为否
        }
        // 根据speci字段反向匹配category68Id
        if (this.form.speci && this.category68Options && this.category68Options.length > 0) {
          const matchedCategory = this.category68Options.find(item => 
            item.category68Name === this.form.speci || 
            item.category68Name.includes(this.form.speci) ||
            this.form.speci.includes(item.category68Name)
          );
          if (matchedCategory) {
            this.form.category68Id = matchedCategory.category68Id;
            // 自动填充档案编码
            this.$nextTick(() => {
              this.handleCategory68Change(matchedCategory.category68Id);
            });
          }
        } else if (this.form.category68Id) {
          // 如果已有所属分类，自动填充档案编码
          this.$nextTick(() => {
            this.handleCategory68Change(this.form.category68Id);
          });
        }
        this.open = true;
        this.isDisabled = true;
        this.title = "修改资产字典";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          // 将68分类名称保存到speci字段
          if (this.form.category68Id) {
            const selectedCategory = this.category68Options.find(item => item.category68Id === this.form.category68Id);
            if (selectedCategory && selectedCategory.category68Name) {
              this.form.speci = selectedCategory.category68Name;
            }
          }
          
          if (this.form.id != null) {
            updateEquipmentDict(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addEquipmentDict(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除资产字典编号为"' + ids + '"的数据项？').then(function() {
        return delEquipmentDict(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    equipmentDictIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('foundation/equipmentDict/export', {
        ...this.queryParams
      }, `equipmentDict_${new Date().getTime()}.xlsx`)
    },
    /** 图片上传前验证 */
    beforeImageUpload(file) {
      const isImage = file.type.indexOf('image/') === 0;
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isImage) {
        this.$modal.msgError('上传文件只能是图片格式!');
        return false;
      }
      if (!isLt2M) {
        this.$modal.msgError('上传图片大小不能超过 2MB!');
        return false;
      }
      return true;
    },
    /** 图片上传成功 */
    handleImageSuccess(response, file) {
      if (response.code === 200) {
        this.form.imageUrl = response.url || response.data || response.fileName;
        this.$modal.msgSuccess('图片上传成功');
      } else {
        this.$modal.msgError(response.msg || '图片上传失败');
      }
    },
    /** 预览图片 */
    previewImage() {
      this.imagePreviewUrl = this.form.imageUrl;
      this.imagePreviewVisible = true;
    },
    /** 保存图片 */
    saveImage() {
      // 图片已经通过上传保存到 form.imageUrl 中
      // 当用户点击表单的"确定"按钮时，图片URL会随表单一起提交
      this.$modal.msgSuccess('图片已保存，请点击"确定"按钮提交表单');
    },
    /** 删除图片 */
    removeImage() {
      this.$modal.confirm('确定要删除这张图片吗？').then(() => {
        this.form.imageUrl = null;
        this.$modal.msgSuccess('图片已删除');
      }).catch(() => {});
    }
  }
};
</script>

<style scoped>
/* 查询条件容器 */
.query-container {
  background: #fff;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 10px;
}

.tree-card {
  margin-right: 15px;
  height: calc(100vh - 180px);
  overflow-y: auto;
}
.tree-header {
  font-weight: bold;
  font-size: 14px;
}
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  font-size: 14px;
  padding: 3px 0;
}
.custom-tree-node i {
  margin-right: 5px;
}
.el-tree {
  background: transparent;
  padding: 10px;
}
.local-modal-mask {
  position: absolute;
  left: 0; top: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.local-modal-content {
  background: #fff;
  border-radius: 6px;
  min-width: 600px;
  max-width: 95vw;
  max-height: 95vh;
  overflow: visible;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
}

.local-modal-content.equipmentDict-modal-content {
  width: 1700px !important;
  min-width: 1700px !important;
  min-height: 880px !important;
}

.local-modal-content.equipmentDict-modal-content > .el-tabs {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #F5F7FA;
  flex-shrink: 0;
  min-height: 48px;
  margin: -24px -24px 16px -24px;
  border-radius: 6px 6px 0 0;
  position: relative;
  z-index: 1;
  width: calc(100% + 48px);
  box-sizing: border-box;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.close-btn {
  border: 1px solid #dcdfe6;
  background: #fff;
  color: #606266;
  padding: 8px 16px;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f5f7fa;
  color: #409eff;
  border-color: #c6e2ff;
}

/* 所属分类下拉框样式 - 隐藏拼音码显示 */
.category68-pinyin {
  display: none;
}
.app-container > .el-form .el-row {
  margin-bottom: 8px;
}

.app-container > .el-form .el-row:last-child {
  margin-bottom: 0;
}

.app-container > .el-form .el-form-item {
  margin-bottom: 0;
}

/* 第一行查询条件左对齐紧凑布局 */
.app-container > .el-form .query-row-left .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.app-container > .el-form .query-row-left .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.app-container > .el-form .query-row-left .query-item-inline:last-child {
  margin-right: 0;
}

/* 统一控制查询条件输入框宽度 */
.app-container > .el-form .query-row-left .query-item-inline .el-input {
  width: 180px;
}

.app-container > .el-form .query-row-left .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.app-container > .el-form .query-row-left .query-item-inline .query-select-wrapper > * {
  width: 100%;
}

.app-container > .el-form .query-row-left .query-item-inline .el-select {
  width: 150px;
}

/* 第二行日期范围布局 */
.app-container > .el-form .query-row-second {
  position: relative;
}

.app-container > .el-form .query-row-second .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

/* 第三行字段间距调整 - 状态、高值、跟台更紧凑 */
.app-container > .el-form .query-row-third .query-item-inline {
  margin-right: 8px !important;
}

.app-container > .el-form .query-row-third .query-item-inline:last-child {
  margin-right: 0 !important;
}

/* 高值和跟台字段更紧凑 */
.app-container > .el-form .query-row-third .query-item-compact {
  margin-right: 4px !important;
}

.app-container > .el-form .query-row-third .query-item-compact + .query-item-compact {
  margin-left: 0 !important;
}

/* 确保日期的两个日期选择器在同一行 */
.app-container > .el-form .query-row-second .el-form-item {
  white-space: nowrap;
}

.app-container > .el-form .query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

/* 图片容器样式 */
.equipmentDict-image-container {
  cursor: pointer;
  position: relative;
}

.equipmentDict-image-preview {
  width: 120px;
  height: 120px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  background-color: #f5f7fa;
}

.material-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.material-image-preview .image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  opacity: 0;
  transition: opacity 0.3s;
}

.material-image-preview:hover .image-overlay {
  opacity: 1;
}

.material-image-preview .image-overlay i {
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
}

.material-image-preview .image-overlay i:hover {
  color: #409eff;
}

.equipmentDict-image-placeholder {
  width: 120px;
  height: 120px;
  border: 2px dashed #dcdfe6;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  cursor: pointer;
  transition: border-color 0.3s;
}

.material-image-placeholder:hover {
  border-color: #409eff;
}

.material-image-placeholder i {
  font-size: 28px;
  color: #8c939d;
}

/* 图片视图内容区域 */
.image-tab-content {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

/* 大尺寸图片预览 */
.equipmentDict-image-preview-large {
  width: 300px;
  height: 300px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  background-color: #f5f7fa;
  cursor: pointer;
}

.material-image-preview-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}

.material-image-preview-large .image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  opacity: 0;
  transition: opacity 0.3s;
}

.material-image-preview-large:hover .image-overlay {
  opacity: 1;
}

.material-image-preview-large .image-overlay i {
  color: #fff;
  font-size: 28px;
  cursor: pointer;
  padding: 10px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
}

.material-image-preview-large .image-overlay i:hover {
  color: #409eff;
  background-color: rgba(64, 158, 255, 0.5);
}

/* 大尺寸占位符 */
.equipmentDict-image-placeholder-large {
  width: 300px;
  height: 300px;
  border: 2px dashed #dcdfe6;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
  cursor: pointer;
  transition: border-color 0.3s;
}

.material-image-placeholder-large:hover {
  border-color: #409eff;
}

.material-image-placeholder-large i {
  font-size: 48px;
  color: #8c939d;
}
</style>

<style>
/* 非scoped样式，确保弹窗宽度生效 */
.local-modal-content.equipmentDict-modal-content {
  width: 1700px !important;
  min-width: 1700px !important;
  max-width: 95vw !important;
}

/* 使用状态开关样式：启用文字在左边 */
.switch-with-label-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.switch-with-label-left .switch-label {
  font-size: 14px;
  color: #909399;
  min-width: 40px;
  white-space: nowrap;
}

.switch-with-label-left .switch-label.active {
  color: #409eff;
  font-weight: 500;
}

/* 表格滚动条样式 - 减小四分之一 */
.el-table__body-wrapper::-webkit-scrollbar {
  width: 6px !important;
  height: 12px !important;
}

.el-table__body-wrapper::-webkit-scrollbar:vertical {
  width: 6px !important;
}

.el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  /* 通过background-clip和padding来减小滚动条滑块视觉长度 */
  background-clip: padding-box;
  border: 2px solid transparent;
}

.el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8 !important;
}

/* 针对Element UI表格的滚动条组件 */
.el-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.el-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.el-table .el-scrollbar__thumb {
  min-width: 2px !important;
  min-height: 4px !important;
  /* 通过设置固定尺寸来减小滚动条滑块长度 */
  width: 2px !important;
  height: 4px !important;
  max-width: 2px !important;
  max-height: 4px !important;
}
</style>

