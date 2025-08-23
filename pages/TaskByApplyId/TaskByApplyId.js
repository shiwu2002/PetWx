// pages/TaskByApplyId/TaskByApplyId.js
function formatChinaTime(dateStr) {
  if (!dateStr) return '';
  let date;
  if (typeof dateStr === 'string' && dateStr.length > 10 && dateStr.indexOf('T') > 0) {
    // ISO格式
    date = new Date(dateStr.replace(/-/g, '/'));
  } else {
    date = new Date(dateStr);
  }
  if (isNaN(date.getTime())) return dateStr;
  // 转为中国时区
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const h = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  const s = date.getSeconds().toString().padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    task: null,
    loading: false,
    error: '',
    visitDate: '',
    visitTime: '',
    deliveryAddress: '',
    submitting: false,
    userInfo: {
      avatarUrl: '',
      nickName: '',
      phone: ''
    },
    showEditModal: false,
    showServiceModal: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const applyId = options.applyId;
    console.log("applyId="+applyId)
    if (!applyId) {
      this.setData({ error: '未获取到申请ID' });
      return;
    }
    this.setData({ loading: true, error: '', task: null });
    this._fetchTask(applyId, 0);
  },

  // 新增：带重试的任务获取方法
  _fetchTask(applyId, retryCount) {
    wx.request({
      url: getApp().globalData.MyUrl +`/staffTask/selectById/${applyId}`,
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'token': getApp().globalData.token
      },
      success: (res) => {
          console.log(res)
        if (res.data && res.data.code === 200 && res.data.data) {
          // 格式化家访时间
          const task = res.data.data;
          if (task.visitDate) {
            task.visitDate = formatChinaTime(task.visitDate);
          }
          this.setData({ task: task, loading: false, error: '' });
        } else if (res.data && res.data.code === 202) {
          this.setData({ task: null, loading: false, error: '' });
        } else if (res.statusCode === 500 && retryCount < 2) {
          // 500错误，重试
          setTimeout(() => {
            this._fetchTask(applyId, retryCount + 1);
          }, 500);
        } else {
          this.setData({ task: null, loading: false, error: res.data && res.data.message ? res.data.message : '未查询到家访任务' });
        }
      },
      fail: () => {
        this.setData({ error: '获取家访任务失败', loading: false });
      }
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  // 预约日期选择
  onDateChange(e) {
    this.setData({ visitDate: e.detail.value });
  },

  // 预约时间选择
  onTimeChange(e) {
    this.setData({ visitTime: e.detail.value });
  },

  // 家访地址输入
  onAddressInput(e) {
    this.setData({ deliveryAddress: e.detail.value });
  },

  // 提交家访任务
  onSubmitTask() {
    const { visitDate, visitTime, deliveryAddress, submitting } = this.data;
    if (submitting) return;
    if (!visitDate || !visitTime || !deliveryAddress) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    const applyId = this.options.applyId;
    const scheduleTime = `${visitDate}T${visitTime}:00`;
    wx.request({
      url: getApp().globalData.MyUrl +'/staffTask/insertMyTask',
      method: 'POST',
      header: {
        'content-type': 'application/json',
        'token': getApp().globalData.token
      },
      data: {
        staffId: 0,
        applyId: applyId,
        taskType: '家访',
        taskStatus: '未完成',
        deliveryAddress: deliveryAddress,
        scheduleTime: scheduleTime
      },
      success: (res) => {
        if (res.data && res.data.code === 200) {
          wx.showToast({ title: '家访任务已提交', icon: 'success' });
          setTimeout(() => { this.onLoad(this.options); }, 800);
        } else {
          wx.showToast({ title: res.data.message || '提交失败', icon: 'none' });
        }
        this.setData({ submitting: false });
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
        this.setData({ submitting: false });
      }
    });
  },

  showProfile() {
    // 实现显示用户信息的逻辑
  },

  editProfile() {
    // 实现编辑用户信息的逻辑
  },

  contactService() {
    // 实现联系客服的逻辑
  },

  closeServiceModal() {
    // 实现关闭客服弹窗的逻辑
  }
})