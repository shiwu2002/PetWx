// pages/PetDetails/PetDetails.js
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    petid: null,
    vaccineList: [],
    vaccineLoading: false,
    vaccineError: false,
    showAdoptForm: false,
    applyReason: '',
    petExperience: '',
    adoptLoading: false,
    adoptError: false,
    adoptErrorMsg: '',
    userId: null,
    supply: null,
    supplyLoading: false,
    supplyError: false,
    pet: null,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const petId = options.petId;
    const productId = options.productId;
    this.data.petId = petId;
    
    // 商品详情逻辑
    if (productId) {
      this.setData({ supplyLoading: true, supplyError: false });
      wx.request({
        url: getApp().globalData.MyUrl +`/supplies/selectById/${productId}`,
        method: 'GET',
        header: {
          'content-type': 'application/json',
        },
        success: (res) => {
          if (res.data && (res.data.id || res.data.productName)) {
            this.setData({ supply: res.data, supplyLoading: false });
          } else {
            this.setData({ supplyError: true, supplyLoading: false });
          }
        },
        fail: () => {
          this.setData({ supplyError: true, supplyLoading: false });
        }
      });
    }
    
    // 兼容原有宠物详情逻辑
    if (petId) {
      this.setData({ vaccineLoading: true, vaccineError: false });
      wx.request({
        url: getApp().globalData.MyUrl +`/pet/getPetById/${petId}`,
        method: 'GET',
        header: {
          'content-type': 'application/json',
          'token': app.globalData.token
        },
        success: (res) => {
          if (res.data && res.data.code === 200 && res.data.data) {
            let vaccineInfo = res.data.data;
            if (vaccineInfo.lastCheckup) {
              const date = new Date(vaccineInfo.lastCheckup);
              vaccineInfo.lastCheckupStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            } else {
              vaccineInfo.lastCheckupStr = '';
            }
            
            // 设置宠物信息
            this.setData({ 
              pet: vaccineInfo, 
              vaccineInfo, 
              vaccineLoading: false 
            });
          } else {
            this.setData({ vaccineError: true, vaccineLoading: false });
          }
        },
        fail: () => {
          this.setData({ vaccineError: true, vaccineLoading: false });
        }
      });
    }
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
    this.fetchPetList(); // 你原本用于加载宠物列表的方法
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

  onAdopt() {
    const that = this;
    wx.request({
      url: getApp().globalData.MyUrl +`/selectByOpenidGetId/${app.globalData.openid}`,
      method: 'POST',
      header: {
        'token': app.globalData.token
      },
      success(res) {
          console.log(res)
        if (res.data != null) {
          // 有 userId，弹出表单
          that.setData({
            userId: res.data,
            showAdoptForm: true,
            adoptError: false
          });
        } else {
          // 没有 userId，跳转登录
          wx.navigateTo({
            url: '/pages/login/login'
          });
        }
      },
      fail() {
        that.setData({ adoptError: true, adoptErrorMsg: '网络错误，请重试' });
      }
    });
  },

  onCloseVaccine() {
    this.setData({ showVaccine: false });
  },

  submitAdoptionApply() {
    const { userId, pet, applyReason, petExperience } = this.data;
    if (!applyReason || !petExperience) {
      this.setData({ adoptError: true, adoptErrorMsg: '请填写完整信息' });
      return;
    }
    this.setData({ adoptLoading: true, adoptError: false });
    wx.request({
      url: getApp().globalData.MyUrl +'/adoptionApply/insert',
      method: 'POST',
      header: {
        'content-type': 'application/json',
        'token': app.globalData.token
      },
      data: {
        userId,
        petId: this.data.petId,
        applyReason,
        petExperience,
        status:"已预约"
      },
      success: (res) => {
        if (res.data && res.data.code === 200) {
          wx.showToast({
            title: '申请成功',
            icon: 'success',
            duration: 1200,
            success: () => {
              setTimeout(() => {
                wx.navigateBack(); // 返回上一页
              }, 1200); // 等待toast显示完
            }
          });
        } else {
          this.setData({ adoptError: true, adoptErrorMsg: res.data.msg || '申请失败' });
        }
      },
      fail: () => {
        this.setData({ adoptError: true, adoptErrorMsg: '网络错误，请重试' });
      },
      complete: () => {
        this.setData({ adoptLoading: false });
      }
    });
  },

  onApplyReasonInput(e) {
    this.setData({ applyReason: e.detail.value });
  },

  onPetExperienceInput(e) {
    this.setData({ petExperience: e.detail.value });
  },

  onCloseAdoptForm() {
    this.setData({ showAdoptForm: false, adoptError: false, applyReason: '', petExperience: '' });
  },

  fetchPetList() {
    // 实现获取宠物列表的逻辑
  }
})