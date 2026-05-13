<template>
  <div class="login">
    <el-form ref="loginForm" :model="loginForm" :rules="loginRules" class="login-form">
      <h3 class="title"></h3><!-- SPD后台管理系统 -->
      <el-form-item v-if="showOrgSelector" prop="customerId" label="组织机构">
        <el-select
          v-model="loginForm.customerId"
          placeholder="请选择组织机构"
          clearable
          filterable
          style="width: 100%"
        >
          <el-option
            v-for="item in customerOptions"
            :key="item.customerId"
            :label="item.customerName"
            :value="item.customerId"
          />
        </el-select>
      </el-form-item>
      <el-form-item prop="username">
        <el-input
          v-model="loginForm.username"
          type="text"
          auto-complete="off"
          placeholder="账号"
        >
          <svg-icon slot="prefix" icon-class="user" class="el-input__icon input-icon" />
        </el-input>
      </el-form-item>
      <el-form-item prop="password">
        <el-input
          v-model="loginForm.password"
          type="password"
          auto-complete="off"
          placeholder="密码"
          @keyup.enter.native="handleLogin"
        >
          <svg-icon slot="prefix" icon-class="password" class="el-input__icon input-icon" />
        </el-input>
      </el-form-item>
<!--      <el-form-item prop="code" v-if="captchaEnabled">-->
<!--        <el-input-->
<!--          v-model="loginForm.code"-->
<!--          auto-complete="off"-->
<!--          placeholder="验证码"-->
<!--          style="width: 63%"-->
<!--          @keyup.enter.native="handleLogin"-->
<!--        >-->
<!--          <svg-icon slot="prefix" icon-class="validCode" class="el-input__icon input-icon" />-->
<!--        </el-input>-->
<!--        <div class="login-code">-->
<!--          <img :src="codeUrl" @click="getCode" class="login-code-img"/>-->
<!--        </div>-->
<!--      </el-form-item>-->
      <el-checkbox v-model="loginForm.rememberMe" style="margin:0px 0px 25px 0px;">记住密码</el-checkbox>
      <el-form-item style="width:100%;">
        <el-button
          :loading="loading"
          size="medium"
          type="primary"
          style="width:100%;"
          @click.native.prevent="handleLogin"
        >
          <span v-if="!loading">登 录</span>
          <span v-else>登 录 中...</span>
        </el-button>
        <div style="float: right;" v-if="register">
          <router-link class="link-type" :to="'/register'">立即注册</router-link>
        </div>
      </el-form-item>
    </el-form>
    <!--  底部  -->
    <div class="el-login-footer">
      <p class="login-version-line" @click="onLicenseSecretClick">前端 v{{ frontendVersion }} · 后端 v{{ backendVersionTip }}</p>
      <span>Copyright © 2018-2023 spd.vip All Rights Reserved.</span>
    </div>

    <el-dialog
      title="系统授权"
      :visible.sync="licenseDialogVisible"
      width="480px"
      append-to-body
      :close-on-click-modal="false"
    >
      <div class="lic-section">
        <div class="lic-label">注册</div>
        <p class="lic-tip">请粘贴厂商提供的整行注册码。</p>
        <el-input
          v-model="licenseRegCode"
          type="textarea"
          :rows="4"
          placeholder="粘贴整行注册码"
        />
        <el-button
          type="primary"
          style="margin-top:12px;width:100%"
          :loading="licenseSubmitting"
          @click="submitLicenseRegister"
        >注册</el-button>
      </div>

      <el-divider content-position="left">厂商</el-divider>
      <div class="lic-section">
        <el-button size="small" type="warning" plain @click="openLicenseBuilderPwd">生成注册码</el-button>
        <span class="lic-muted">（点击后需输入签发口令）</span>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="licenseDialogVisible = false">关 闭</el-button>
      </div>
    </el-dialog>

    <el-dialog
      title="签发口令"
      :visible.sync="licensePwdDialogVisible"
      width="400px"
      append-to-body
      :close-on-click-modal="false"
      @closed="licenseBuilderPwd = ''"
    >
      <el-input
        v-model="licenseBuilderPwd"
        type="password"
        placeholder="请输入签发口令"
        show-password
        autocomplete="off"
        @keyup.enter.native="confirmLicenseBuilderPwd"
      />
      <div slot="footer" class="dialog-footer">
        <el-button @click="licensePwdDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmLicenseBuilderPwd">进 入</el-button>
      </div>
    </el-dialog>

    <el-dialog
      title="生成注册码（私钥仅在浏览器内使用，不会上传服务器）"
      :visible.sync="licenseGenDialogVisible"
      width="520px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form label-width="96px" size="small">
        <el-form-item label="私钥文件">
          <input
            ref="licensePemInput"
            type="file"
            accept=".pem,.key,.txt"
            style="max-width:100%"
            @change="onLicensePemFile"
          >
          <div v-if="licenseGenPemFileName" class="lic-muted" style="margin-top:4px;">已选：{{ licenseGenPemFileName }}</div>
        </el-form-item>
        <el-form-item label="医院全称">
          <el-input v-model="licenseGenHospital" placeholder="医院全称" />
        </el-form-item>
        <el-form-item label="到期日期">
          <el-date-picker
            v-model="licenseGenExpireDay"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="到期日（UTC 当日 23:59:59）"
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="注册码">
          <el-input v-model="licenseGenOutput" type="textarea" :rows="4" readonly placeholder="点击下方「生成」" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="licenseGenDialogVisible = false">关 闭</el-button>
        <el-button v-if="licenseGenOutput" @click="copyLicenseGenOutput">复制注册码</el-button>
        <el-button type="primary" :loading="licenseGenSubmitting" @click="runLicenseGen">生成</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getCodeImg, getCustomerOptions, registerLicense } from "@/api/login";
import { getAppVersion } from '@/api/common/version'
import { signLicenseV2InBrowser } from '@/utils/licenseBrowserSign'
import Cookies from "js-cookie";
import { encrypt, decrypt } from '@/utils/jsencrypt'

export default {
  name: "Login",
  data() {
    return {
      codeUrl: "",
      customerOptions: [],
      showOrgSelector: false,
      loginForm: {
        customerId: "",
        username: "",
        password: "",
        rememberMe: false,
        code: "",
        uuid: ""
      },
      loginRules: {
        username: [
          { required: true, trigger: "blur", message: "请输入您的账号" }
        ],
        password: [
          { required: true, trigger: "blur", message: "请输入您的密码" }
        ],
        customerId: [
          {
            validator: (rule, value, callback) => {
              if (!this.showOrgSelector) {
                callback();
                return;
              }
              if (!value || String(value).trim() === '') {
                callback(new Error('请选择组织机构'));
              } else {
                callback();
              }
            },
            trigger: 'change'
          }
        ],
        code: [{ required: true, trigger: "change", message: "请输入验证码" }]
      },
      loading: false,
      // 验证码开关
      captchaEnabled: true,
      // 注册开关
      register: false,
      redirect: undefined,
      frontendVersion: process.env.VUE_APP_VERSION || '—',
      backendVersionTip: '…',
      licenseDialogVisible: false,
      licenseRegCode: '',
      licenseSubmitting: false,
      licensePwdDialogVisible: false,
      licenseGenDialogVisible: false,
      licenseBuilderPwd: '',
      licenseGenPemText: '',
      licenseGenPemFileName: '',
      licenseGenHospital: '',
      licenseGenExpireDay: '',
      licenseGenOutput: '',
      licenseGenSubmitting: false
    };
  },
  computed: {
    licenseBuilderEnabled() {
      const s = process.env.VUE_APP_LICENSE_BUILDER_SECRET
      return !!(s != null && String(s).trim() !== '')
    }
  },
  watch: {
    $route: {
      handler: function(route) {
        this.redirect = route.query && route.query.redirect;
      },
      immediate: true
    }
  },
  created() {
    this.getCode();
    this.initCustomerOptions();
    this.getCookie();
    getAppVersion()
      .then(res => {
        this.backendVersionTip = (res && res.version) ? res.version : '—'
      })
      .catch(() => {
        this.backendVersionTip = '—'
      })
  },
  methods: {
    initCustomerOptions() {
      getCustomerOptions("hc").then(res => {
        this.customerOptions = res.data || [];
        const def = res.defaultCustomerId;
        // 若系统配置了默认租户，则默认带入；否则显示下拉供用户选择
        if (def) {
          this.loginForm.customerId = def;
          this.showOrgSelector = false;
        } else {
          this.showOrgSelector = true;
        }
      }).catch(() => {
        this.customerOptions = [];
        // 查询失败时按“无默认租户”处理，仍允许用户手动选择
        this.showOrgSelector = true;
      });
    },
    getCode() {
      getCodeImg().then(res => {
        this.captchaEnabled = res.captchaEnabled === undefined ? true : res.captchaEnabled;
        if (this.captchaEnabled) {
          this.codeUrl = "data:image/gif;base64," + res.img;
          this.loginForm.uuid = res.uuid;
        }
      });
    },
    getCookie() {
      const username = Cookies.get("username");
      const password = Cookies.get("password");
      const rememberMe = Cookies.get('rememberMe');
      const customerId = Cookies.get("customerId");
      this.loginForm = {
        customerId: customerId === undefined ? this.loginForm.customerId : customerId,
        username: username === undefined ? this.loginForm.username : username,
        password: password === undefined ? this.loginForm.password : decrypt(password),
        rememberMe: rememberMe === undefined ? false : Boolean(rememberMe),
        code: this.loginForm.code,
        uuid: this.loginForm.uuid
      };
    },
    onLicenseSecretClick() {
      const t = Date.now()
      if (t - (this._licLastTs || 0) > 1200) {
        this._licClicks = 0
      }
      this._licLastTs = t
      this._licClicks = (this._licClicks || 0) + 1
      if (this._licClicks >= 4) {
        this._licClicks = 0
        this.licenseDialogVisible = true
        this.licenseRegCode = ''
      }
    },
    submitLicenseRegister() {
      const code = (this.licenseRegCode || '').trim()
      if (!code) {
        this.$message.warning('请输入注册码')
        return
      }
      this.licenseSubmitting = true
      registerLicense({
        licenseCode: code,
        customerId: this.loginForm.customerId || undefined,
        systemType: 'hc'
      }).then(res => {
        this.$message.success((res && res.msg) || '注册成功，请登录')
        this.licenseDialogVisible = false
      }).catch(() => {}).finally(() => {
        this.licenseSubmitting = false
      })
    },
    openLicenseBuilderPwd() {
      if (!this.licenseBuilderEnabled) {
        this.$message.warning('未配置签发口令：请在 spd-ui 根目录 .env 中设置 VUE_APP_LICENSE_BUILDER_SECRET 后重新打包')
        return
      }
      this.licensePwdDialogVisible = true
      this.licenseBuilderPwd = ''
    },
    confirmLicenseBuilderPwd() {
      const expect = process.env.VUE_APP_LICENSE_BUILDER_SECRET || ''
      if ((this.licenseBuilderPwd || '') !== expect) {
        this.$message.error('口令错误')
        return
      }
      this.licensePwdDialogVisible = false
      this.licenseBuilderPwd = ''
      this.licenseGenPemText = ''
      this.licenseGenPemFileName = ''
      this.licenseGenHospital = ''
      this.licenseGenExpireDay = ''
      this.licenseGenOutput = ''
      if (this.$refs.licensePemInput) {
        this.$refs.licensePemInput.value = ''
      }
      this.licenseGenDialogVisible = true
    },
    onLicensePemFile(e) {
      const input = e.target
      const f = input.files && input.files[0]
      if (!f) {
        this.licenseGenPemText = ''
        this.licenseGenPemFileName = ''
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        this.licenseGenPemText = reader.result || ''
        this.licenseGenPemFileName = f.name
      }
      reader.onerror = () => {
        this.$message.error('读取私钥文件失败')
        this.licenseGenPemText = ''
        this.licenseGenPemFileName = ''
      }
      reader.readAsText(f, 'UTF-8')
    },
    async runLicenseGen() {
      const pem = (this.licenseGenPemText || '').trim()
      if (!pem) {
        this.$message.warning('请选择 PKCS#8 私钥 PEM 文件（BEGIN PRIVATE KEY）')
        return
      }
      if (!pem.includes('BEGIN PRIVATE KEY')) {
        this.$message.warning('私钥须为 PKCS#8 PEM（以 -----BEGIN PRIVATE KEY----- 开头）')
        return
      }
      const hospital = (this.licenseGenHospital || '').trim()
      if (!hospital) {
        this.$message.warning('请输入医院全称')
        return
      }
      const day = this.licenseGenExpireDay
      if (!day) {
        this.$message.warning('请选择到期日期')
        return
      }
      const expireAt = `${day}T23:59:59Z`
      this.licenseGenSubmitting = true
      this.licenseGenOutput = ''
      try {
        const line = await signLicenseV2InBrowser(pem, hospital, expireAt)
        this.licenseGenOutput = line
        this.$message.success('已生成，可复制后发给客户')
      } catch (err) {
        this.$message.error((err && err.message) || '生成失败')
      } finally {
        this.licenseGenSubmitting = false
      }
    },
    copyLicenseGenOutput() {
      const t = (this.licenseGenOutput || '').trim()
      if (!t) return
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(t).then(() => {
          this.$message.success('已复制')
        }).catch(() => this.fallbackCopyText(t))
      } else {
        this.fallbackCopyText(t)
      }
    },
    fallbackCopyText(text) {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        this.$message.success('已复制')
      } catch (e) {
        this.$message.error('复制失败')
      }
      document.body.removeChild(ta)
    },
    handleLogin() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.loading = true;
          if (this.loginForm.rememberMe) {
            Cookies.set("username", this.loginForm.username, { expires: 30 });
            Cookies.set("password", encrypt(this.loginForm.password), { expires: 30 });
            Cookies.set('rememberMe', this.loginForm.rememberMe, { expires: 30 });
            if (this.loginForm.customerId) {
              Cookies.set("customerId", this.loginForm.customerId, { expires: 30 });
            } else {
              Cookies.remove("customerId");
            }
          } else {
            Cookies.remove("username");
            Cookies.remove("password");
            Cookies.remove('rememberMe');
            Cookies.remove("customerId");
          }
          this.$store.dispatch("Login", this.loginForm).then(() => {
            const username = (this.loginForm.username || '').trim()
            const redirectPath = this.redirect || '/'
            if (username && username.toLowerCase() === 'admin') {
              this.$router.push({
                path: '/tenant-switch/index',
                query: { redirect: redirectPath }
              }).catch(() => {})
            } else {
              this.$router.push({ path: redirectPath }).catch(() => {})
            }
          }).catch(() => {
            this.loading = false;
            if (this.captchaEnabled) {
              this.getCode();
            }
          });
        }
      });
    }
  }
};
</script>

<style rel="stylesheet/scss" lang="scss">
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  //background-image: url("../assets/images/login-background.jpg");
  //background-image: url("../assets/images/login.jpg");
  background-image: url("../assets/images/log.png");
  background-size: cover;
}
.title {
  margin: 0px auto 30px auto;
  text-align: center;
  color: #707070;
}

.login-form {
  border-radius: 6px;
  background: #ffffff;
  width: 400px;
  padding: 25px 25px 5px 25px;
  .el-input {
    height: 38px;
    input {
      height: 38px;
    }
  }
  .input-icon {
    height: 39px;
    width: 14px;
    margin-left: 2px;
  }
}
.login-tip {
  font-size: 13px;
  text-align: center;
  color: #bfbfbf;
}
.login-code {
  width: 33%;
  height: 38px;
  float: right;
  img {
    cursor: pointer;
    vertical-align: middle;
  }
}
.el-login-footer {
  min-height: 40px;
  line-height: 1.5;
  padding: 8px 0 12px;
  position: fixed;
  bottom: 0;
  width: 100%;
  text-align: center;
  color: #fff;
  font-family: Arial;
  font-size: 12px;
  letter-spacing: 1px;
  .login-version-line {
    margin: 0 0 6px;
    font-size: 12px;
    opacity: 0.95;
  }
}
.login-code-img {
  height: 38px;
}
.lic-label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
}
.lic-tip {
  font-size: 13px;
  color: #606266;
  margin: 0 0 10px;
  line-height: 1.5;
}
.lic-muted {
  font-size: 12px;
  color: #909399;
  margin-left: 6px;
  vertical-align: middle;
}
.lic-section {
  margin-bottom: 4px;
}
</style>
