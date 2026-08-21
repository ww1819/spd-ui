<template>
  <div class="login">
    <div class="warehouse-bg" aria-hidden="true"></div>
    <div class="ceiling-glow" aria-hidden="true"></div>
    <div class="ceiling-glow ceiling-glow-second" aria-hidden="true"></div>
    <div class="light-breathe" aria-hidden="true"></div>
    <div class="air-dust" aria-hidden="true">
      <span></span><span></span><span></span><span></span><span></span>
      <span></span><span></span><span></span><span></span><span></span>
      <span></span><span></span><span></span><span></span><span></span>
    </div>
    <div class="brand" aria-hidden="false">
      <h1 class="brand-title">SPD 医疗耗材管理系统</h1>
      <p class="brand-subtitle">智慧供应链 · 精益化管理 · 全周期追溯</p>
    </div>
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
  flex-direction: column;
  justify-content: center;
  align-items: stretch;
  height: 100vh;
  padding: 0 6vw 0 8vw;
  background-color: #f0f4f8;
  overflow: hidden;
  position: relative;
}

.warehouse-bg {
  position: absolute;
  inset: -2%;
  background-image: url("../assets/images/login-bg-warehouse-shelves.jpg");
  background-size: cover;
  background-position: center;
  z-index: 0;
  animation: warehouseShift 34s ease-in-out infinite alternate;
}

@keyframes warehouseShift {
  0% {
    transform: scale(1) translate(0, 0);
  }
  100% {
    transform: scale(1.03) translate(-0.6%, -0.3%);
  }
}

.ceiling-glow {
  position: absolute;
  top: -15%;
  left: 20%;
  width: 55%;
  height: 130%;
  background: linear-gradient(
    160deg,
    rgba(255, 255, 255, 0) 25%,
    rgba(255, 255, 255, 0.12) 45%,
    rgba(255, 255, 255, 0.2) 55%,
    rgba(255, 255, 255, 0.1) 65%,
    rgba(255, 255, 255, 0) 80%
  );
  transform: rotate(18deg);
  filter: blur(28px);
  pointer-events: none;
  z-index: 1;
  opacity: 0.6;
  animation: glowSway 20s ease-in-out infinite alternate;
}

.ceiling-glow-second {
  top: -5%;
  left: 45%;
  width: 35%;
  height: 110%;
  opacity: 0.35;
  animation-delay: -10s;
  animation-duration: 24s;
}

@keyframes glowSway {
  0% {
    transform: rotate(14deg) translateX(-1.5vw);
    opacity: 0.45;
  }
  100% {
    transform: rotate(22deg) translateX(1.5vw);
    opacity: 0.7;
  }
}

.light-breathe {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 5%,
    rgba(230, 242, 255, 0.28) 0%,
    rgba(230, 242, 255, 0.1) 35%,
    transparent 65%
  );
  z-index: 1;
  pointer-events: none;
  animation: lightPulse 14s ease-in-out infinite alternate;
}

@keyframes lightPulse {
  0% {
    opacity: 0.55;
  }
  100% {
    opacity: 0.9;
  }
}

.air-dust {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.air-dust span {
  position: absolute;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  filter: blur(0.5px);
  box-shadow: 0 0 3px rgba(255, 255, 255, 0.35);
  animation: floatDust linear infinite;
}

.air-dust span:nth-child(1) { width: 2px; height: 2px; left: 15%; top: 78%; animation-duration: 26s; animation-delay: 0s; --dust-opacity: 0.4; }
.air-dust span:nth-child(2) { width: 2px; height: 2px; left: 25%; top: 85%; animation-duration: 30s; animation-delay: 3s; --dust-opacity: 0.3; }
.air-dust span:nth-child(3) { width: 3px; height: 3px; left: 35%; top: 72%; animation-duration: 24s; animation-delay: 7s; --dust-opacity: 0.35; }
.air-dust span:nth-child(4) { width: 2px; height: 2px; left: 45%; top: 88%; animation-duration: 28s; animation-delay: 1s; --dust-opacity: 0.28; }
.air-dust span:nth-child(5) { width: 2px; height: 2px; left: 55%; top: 76%; animation-duration: 22s; animation-delay: 11s; --dust-opacity: 0.32; }
.air-dust span:nth-child(6) { width: 3px; height: 3px; left: 65%; top: 82%; animation-duration: 32s; animation-delay: 5s; --dust-opacity: 0.22; }
.air-dust span:nth-child(7) { width: 2px; height: 2px; left: 18%; top: 68%; animation-duration: 27s; animation-delay: 9s; --dust-opacity: 0.26; }
.air-dust span:nth-child(8) { width: 2px; height: 2px; left: 28%; top: 90%; animation-duration: 29s; animation-delay: 13s; --dust-opacity: 0.24; }
.air-dust span:nth-child(9) { width: 2px; height: 2px; left: 38%; top: 80%; animation-duration: 25s; animation-delay: 2s; --dust-opacity: 0.34; }
.air-dust span:nth-child(10) { width: 2px; height: 2px; left: 48%; top: 70%; animation-duration: 31s; animation-delay: 6s; --dust-opacity: 0.2; }
.air-dust span:nth-child(11) { width: 3px; height: 3px; left: 58%; top: 86%; animation-duration: 23s; animation-delay: 10s; --dust-opacity: 0.3; }
.air-dust span:nth-child(12) { width: 2px; height: 2px; left: 68%; top: 74%; animation-duration: 28s; animation-delay: 4s; --dust-opacity: 0.25; }
.air-dust span:nth-child(13) { width: 2px; height: 2px; left: 20%; top: 92%; animation-duration: 33s; animation-delay: 8s; --dust-opacity: 0.18; }
.air-dust span:nth-child(14) { width: 2px; height: 2px; left: 30%; top: 66%; animation-duration: 21s; animation-delay: 0s; --dust-opacity: 0.3; }
.air-dust span:nth-child(15) { width: 2px; height: 2px; left: 40%; top: 84%; animation-duration: 26s; animation-delay: 14s; --dust-opacity: 0.22; }

@keyframes floatDust {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: var(--dust-opacity, 0.25);
  }
  90% {
    opacity: var(--dust-opacity, 0.25);
  }
  100% {
    transform: translateY(-58vh) translateX(10px);
    opacity: 0;
  }
}

.brand {
  position: absolute;
  top: 10vh;
  left: 8vw;
  z-index: 2;
  max-width: 520px;
  animation: brandEnter 1s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.brand-title {
  margin: 0 0 12px 0;
  font-size: 42px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.2;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 16px rgba(255, 255, 255, 0.75);
}

.brand-subtitle {
  margin: 0;
  font-size: 17px;
  color: #4b5563;
  line-height: 1.5;
  text-shadow: 0 1px 10px rgba(255, 255, 255, 0.65);
}

@keyframes brandEnter {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.title {
  display: none;
}

.login-form {
  position: absolute;
  top: 50%;
  right: 6vw;
  transform: translateY(-50%);
  z-index: 2;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow: 0 28px 70px rgba(30, 111, 219, 0.1), 0 10px 30px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
  width: 380px;
  padding: 32px 34px 16px 34px;
  animation: cardEnter 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.15s forwards;
  opacity: 0;
  .el-input {
    height: 44px;
    input {
      height: 44px;
      background: rgba(255, 255, 255, 0.9);
      border-color: rgba(30, 111, 219, 0.16);
      border-radius: 10px;
      transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
      &:focus {
        border-color: #1e6fdb;
        background: #fff;
        box-shadow: 0 0 0 4px rgba(30, 111, 219, 0.1);
      }
    }
  }
  .input-icon {
    height: 44px;
    width: 14px;
    margin-left: 2px;
  }
  .el-button--primary {
    height: 46px;
    background: linear-gradient(135deg, #1e6fdb, #3b93f7);
    border-color: transparent;
    box-shadow: 0 10px 24px rgba(30, 111, 219, 0.32);
    transition: transform 0.15s, box-shadow 0.2s;
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 14px 30px rgba(30, 111, 219, 0.38);
    }
    &:active {
      transform: translateY(0);
    }
  }
}

@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .login {
    padding: 8vh 24px 6vh;
    justify-content: flex-start;
    gap: 36px;
  }
  .brand {
    position: relative;
    top: auto;
    left: auto;
    align-self: center;
    text-align: center;
    margin-top: 4vh;
  }
  .brand-logo {
    margin: 0 auto 20px;
    width: 48px;
    height: 48px;
  }
  .brand-title {
    font-size: 28px;
  }
  .brand-subtitle {
    font-size: 14px;
  }
  .login-form {
    position: relative;
    top: auto;
    right: auto;
    transform: none;
    align-self: center;
    width: 100%;
    max-width: 380px;
    padding: 28px 24px 12px;
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

@media (max-width: 768px) {
  .login {
    justify-content: center;
    padding-right: 0;
    padding: 24px;
  }
  .login-form {
    width: 100%;
    max-width: 400px;
    padding: 28px 24px 8px;
  }
}
</style>
