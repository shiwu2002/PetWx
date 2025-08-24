// pages/PetDetails/PetDetails.js
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    petId: null,
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
    // 新增点赞相关数据
    likeStates: {}, // 存储每个宠物的点赞状态
    likeCounts: {}, // 存储每个宠物的点赞数
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.fetchPetList(); // 你原本用于加载宠物列表的方法
    // 如果有宠物数据，加载点赞信息
    if (this.data.pet && this.data.pet.id) {
      this.loadLikeInfoForPet(this.data.pet.id);
    }
  },

  // 加载指定宠物的点赞信息
  loadLikeInfoForPet: function(petId) {
    this.getLikeCount(petId);
    this.getLikeState(petId);
  },

  // 获取点赞数
  getLikeCount: function(targetId) {
    const that = this;
    wx.request({
      url: getApp().globalData.MyUrl + '/like/count',
      method: 'GET',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'token': app.globalData.token
      },
      data: {
        targetId: targetId,
        targetType: '宠物'
      },
      success: function(res) {
        if (res.statusCode === 200 && res.data.code === 200) {
          const likeCounts = { ...that.data.likeCounts };
          likeCounts[targetId] = res.data.data || 0;
          that.setData({ likeCounts });
        }
      },
      fail: function(err) {
        console.error('获取点赞数失败:', err);
      }
    });
  },

  // 获取点赞状态
  getLikeState: function(targetId) {
    const that = this;
    const userId = app.globalData.userId || 1;
    
    wx.request({
      url: getApp().globalData.MyUrl + '/like/isLiked',
      method: 'GET',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'token': app.globalData.token
      },
      data: {
        targetId: targetId,
        targetType: '宠物',
        userId: userId
      },
      success: function(res) {
        if (res.statusCode === 200 && res.data.code === 200) {
          const likeStates = { ...that.data.likeStates };
          likeStates[targetId] = res.data.data || false;
          that.setData({ likeStates });
        }
      },
      fail: function(err) {
        console.error('获取点赞状态失败:', err);
        // 如果获取失败，默认设置为未点赞状态
        const likeStates = { ...that.data.likeStates };
        likeStates[targetId] = false;
        that.setData({ likeStates });
      }
    });
  },

  // 点赞/取消点赞
  toggleLike: function(e) {
    const targetId = e.currentTarget.dataset.targetId || this.data.pet.id;
    const targetType = '宠物';
    const userId = app.globalData.userId || 1; // 从全局数据获取用户ID
    
    if (!targetId) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      return;
    }

    wx.request({
      url: getApp().globalData.MyUrl + '/like/toggle',
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'token': app.globalData.token
      },
      data: {
        targetId: targetId,
        targetType: targetType,
        userId: userId
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          // 更新点赞状态
          const likeStates = { ...this.data.likeStates };
          likeStates[targetId] = !likeStates[targetId];
          
          // 更新点赞数
          const likeCounts = { ...this.data.likeCounts };
          if (likeStates[targetId]) {
            likeCounts[targetId] = (likeCounts[targetId] || 0) + 1;
          } else {
            likeCounts[targetId] = Math.max(0, (likeCounts[targetId] || 0) - 1);
          }
          
          this.setData({ 
            likeStates,
            likeCounts 
          });
          
          wx.showToast({
            title: likeStates[targetId] ? '点赞成功' : '取消点赞',
            icon: 'success',
            duration: 1000
          });
        } else {
          wx.showToast({
            title: res.data?.message || '操作失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('点赞操作失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const petId = options.petId;
    const productId = options.productId;
    this.setData({ petId });
    
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
      this.fetchPetList();
      this.fetchVaccineInfo(petId);
    }
  },
  
  // 获取疫苗详情信息
  fetchVaccineInfo: function(petId) {
    this.setData({ vaccineLoading: true, vaccineError: false });
    wx.request({
      url: getApp().globalData.MyUrl +`/pet/getPetById/${petId}`,
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'token': app.globalData.token
      },
      success: (vaccineRes) => {
        if (vaccineRes.data && vaccineRes.data.code === 200 && vaccineRes.data.data) {
          let vaccineInfo = vaccineRes.data.data;
          if (vaccineInfo.lastCheckup) {
            const date = new Date(vaccineInfo.lastCheckup);
            vaccineInfo.lastCheckupStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          } else {
            vaccineInfo.lastCheckupStr = '';
          }
          
          this.setData({ 
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
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

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
    // 首先检查是否有petId
    if (!this.data.petId) {
      console.error('没有获取到宠物ID');
      wx.showToast({ title: '参数错误', icon: 'none' });
      return;
    }
    
    // 检查是否已有宠物数据，如果没有则请求
    if (!this.data.pet) {
      this.setData({ vaccineLoading: true, vaccineError: false });
      
      // 获取宠物基本信息
      console.log('fetchPetList中开始获取宠物基本信息，petId:', this.data.petId);
      wx.request({
        url: getApp().globalData.MyUrl+`/pet/getOneById/${this.data.petId}`,
        method: 'GET',
        header: {
          'content-type': 'application/json',
          'token': app.globalData.token
        },
        success: (res) => {
          console.log('fetchPetList中宠物基本信息接口返回:', res);
          if (res.data && res.data.code === 200 && res.data.data) {
            let petData = res.data.data;
            
            // 处理宠物图片URL
            let processedImageUrl = null;
            const nodeUrl = getApp().globalData.NodeUrl + "/photo";
            
            // 优先从数据中获取图片路径并与NodeUrl拼接
            if (petData.images && petData.images.length > 0) {
              // 处理所有图片路径，与NodeUrl拼接
              petData.images = petData.images.map(image => {
                // 确保URL格式正确，避免双斜杠
                return nodeUrl + (image.startsWith('/') ? '' : '/') + image;
              });
              processedImageUrl = petData.images[0];
            }
            
            // 如果没有有效图片路径，使用默认图片
            if (!processedImageUrl) {
              processedImageUrl = '/components/IMAGES/1293.jpg_wh860.png'; // 默认图片
            }
            // 设置处理后的图片URL
            petData.processedImageUrl = processedImageUrl;
            console.log(petData.processedImageUrl)
            // 格式化创建时间
            if (petData.createTime) {
              const date = new Date(petData.createTime);
              petData.createTimeStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            } else {
              petData.createTimeStr = '';
            }

            this.setData({
              pet: petData,
              vaccineLoading: false
            });
            console.log('fetchPetList中宠物信息已设置:', this.data.pet);
            this.loadLikeInfoForPet(petData.id);
          } else {
            console.error('fetchPetList中宠物基本信息接口返回错误:', res.data);
            this.setData({ vaccineLoading: false });
            wx.showToast({ title: '获取宠物信息失败', icon: 'none' });
          }
        },
        fail: (err) => {
          console.error('请求宠物信息失败:', err);
          this.setData({ vaccineError: true, vaccineLoading: false });
          wx.showToast({ title: '网络错误，请重试', icon: 'none' });
        }
      });
    } else {
      // 如果已有宠物数据，确保加载点赞信息
      if (this.data.pet && this.data.pet.id) {
        this.loadLikeInfoForPet(this.data.pet.id);
      }
    }
  },

  // 图片加载错误处理
  onImageError(e) {
    const { index } = e.currentTarget.dataset;
    const { pet } = this.data;
    
    // 确保pet.images数组存在
    if (!pet.images) {
      pet.images = [];
    }
    
    // 替换为默认图片
    const defaultImage = '/components/IMAGES/1293.jpg_wh860.png';
    
    if (pet.images.length > 0) {
      // 如果有images数组，替换对应索引的图片
      pet.images[index] = defaultImage;
    } else {
      // 否则替换processedImageUrl
      pet.processedImageUrl = defaultImage;
    }
    
    // 更新数据
    this.setData({ pet });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 分享宠物信息
  sharePet() {
    const { pet } = this.data;
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  }
})