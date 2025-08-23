// login.js
const app = getApp(); 
Page({
    data: {
      username: '',
      password: '',
      loading: false,
      // 注册相关
      showRegister: false,
      regUsername: '',
      regPassword: '',
      regNickname: '',
      regPhone: '',
      regPasswordVisible: false,
      // 登录密码可见性
      passwordVisible: false,
      // 找回密码相关
      showForgot: false,
      fgUsername: '',
      fgPhone: '',
      fgPassword: '',
      fgPasswordVisible: false
    },
  
    // 处理用户名输入
    handleUsernameInput(e) {
      this.setData({ username: e.detail.value })
    },
  
    // 处理密码输入
    handlePasswordInput(e) {
      this.setData({ password: e.detail.value })
    },
  
    // 登录密码显示/隐藏
    togglePasswordVisible() {
      this.setData({ passwordVisible: !this.data.passwordVisible });
    },
  
    // 注册弹窗密码显示/隐藏
    toggleRegPasswordVisible() {
      this.setData({ regPasswordVisible: !this.data.regPasswordVisible });
    },
  
    // 找回密码弹窗密码显示/隐藏
    toggleFgPasswordVisible() {
      this.setData({ fgPasswordVisible: !this.data.fgPasswordVisible });
    },
  
    // 登录函数
    login() {
      const { username, password } = this.data;
      
      // 表单验证
      if (!username.trim()) {
        wx.showToast({
          title: '请输入用户名',
          icon: 'none'
        });
        return;
      }
      
      if (!password.trim()) {
        wx.showToast({
          title: '请输入密码',
          icon: 'none'
        });
        return;
      }
      
      // 显示加载状态
      this.setData({ loading: true });
      console.log(app.globalData.openid)
      // 发送登录请求
      wx.request({
          
        url: getApp().globalData.MyUrl +'/admin/login',
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'token' :app.globalData.token
        },
        data: {
          "username": username,
          "password": password,
          "phone": "",
          "role": "",
          "openid":app.globalData.openid
        },
        success: (res) => {
            console.log(res)
          // 处理登录成功逻辑
          if (res.statusCode === 200 && res.data.code) {
            wx.showToast({
              title: '登录成功',
              icon: 'success'
            });
            
            // 保存登录状态（示例）
            wx.setStorageSync('token', res.data.token);
            wx.setStorageSync('userInfo', res.data.userInfo);
            
            // 跳转到首页
            setTimeout(() => {
              wx.switchTab({
                url: '/pages/homePage/homePage'
              });
            }, 1500);
          } else {
            wx.showToast({
              title: res.data.message || '登录失败',
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          wx.showToast({
            title: '网络错误，请稍后重试',
            icon: 'none'
          });
          console.error('登录请求失败:', err);
        },
        complete: () => {
          // 隐藏加载状态
          this.setData({ loading: false });
        }
      });
    },
    // 注册弹窗相关
    showRegisterModal() { this.setData({ showRegister: true }); },
    closeRegisterModal() { this.setData({ showRegister: false }); },
    onRegUsername(e) { this.setData({ regUsername: e.detail.value }); },
    onRegPassword(e) { this.setData({ regPassword: e.detail.value }); },
    onRegNickname(e) { this.setData({ regNickname: e.detail.value }); },
    onRegPhone(e) { this.setData({ regPhone: e.detail.value }); },
    register() {
      const { regUsername, regPassword, regNickname, regPhone } = this.data;
      if (!regUsername.trim() || !regPassword.trim() || !regNickname.trim() || !regPhone.trim()) {
        wx.showToast({ title: '请填写完整信息', icon: 'none' }); return;
      }
      if (regUsername.length < 6) {
        wx.showToast({ title: '用户名至少6位', icon: 'none' }); return;
      }
      if (regPassword.length < 6) {
        wx.showToast({ title: '密码至少6位', icon: 'none' }); return;
      }
      wx.request({
        url: getApp().globalData.MyUrl +'/admin/register',
        method: 'POST',
        header: { 'Content-Type': 'application/json' },
        data: {
          username: regUsername,
          passwordHash: regPassword,
          nickname: regNickname,
          phone: regPhone
        },
        success: (res) => {
          if (res.data && res.data.code === 200) {
            wx.showToast({ title: '注册成功', icon: 'success' });
            this.setData({ showRegister: false });
          } else {
            wx.showToast({ title: res.data.message || '注册失败', icon: 'none' });
          }
        },
        fail: () => { wx.showToast({ title: '网络错误', icon: 'none' }); },
      });
    },
    // 找回密码弹窗相关
    showForgotModal() { this.setData({ showForgot: true }); },
    closeForgotModal() { this.setData({ showForgot: false }); },
    onFgUsername(e) { this.setData({ fgUsername: e.detail.value }); },
    onFgPhone(e) { this.setData({ fgPhone: e.detail.value }); },
    onFgPassword(e) { this.setData({ fgPassword: e.detail.value }); },
    findPassword() {
      const { fgUsername, fgPhone, fgPassword } = this.data;
      if (!fgUsername.trim() || !fgPhone.trim() || !fgPassword.trim()) {
        wx.showToast({ title: '请填写完整信息', icon: 'none' }); return;
      }
      wx.request({
        url: getApp().globalData.MyUrl +'/admin/update',
        method: 'POST',
        header: { 'Content-Type': 'application/json' },
        data: {
          username: fgUsername,
          phone: fgPhone,
          password: fgPassword
        },
        success: (res) => {
          if (res.data && res.data.code === 200) {
            wx.showToast({ title: '密码已重置', icon: 'success' });
            this.setData({ showForgot: false });
          } else {
            wx.showToast({ title: res.data.message || '重置失败', icon: 'none' });
          }
        },
        fail: () => { wx.showToast({ title: '网络错误', icon: 'none' }); },
      });
    }
  })