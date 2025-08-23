const app = getApp(); 
Page({
  data: {
    pets: [],
    processedPets: [],
    currentPage: 1,
    pageSize: 5,
    totalPages: 0,
    loading: false,
    hasMore: true,
    baseImageUrl: getApp().globalData.NodeUrl +'/photo', 
    defaultImage: '/components/IMAGES/Discover.png', 
    searchKeyword: '', 
    // 新增点赞相关数据
    likeStates: {}, // 存储每个宠物的点赞状态
    likeCounts: {}, // 存储每个宠物的点赞数
  },

  onLoad: function () {
    if (!app.globalData.token) {
      wx.showToast({ title: '未检测到登录状态，请先登录', icon: 'none' });
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    this.fetchPetList();
  },

  onShow() {
    this.fetchPetList();
  },

  onPullDownRefresh() {
    this.fetchPetList(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 新增：统一宠物列表请求方法
  fetchPetList(callback) {
    this.loadPetsData(1);
    if (typeof callback === 'function') {
      setTimeout(callback, 800);
    }
  },

  // 加载宠物数据，支持传入自定义请求体
  loadPetsData: function (page, customRequestData) {
    const that = this;
    this.setData({ loading: true });
    const requestData = customRequestData || {
      size: this.data.pageSize,
      current: page,
      name: "",
      breed: "",
      healthStatus: "",
      isAdopt: "待领养"
    };

    wx.request({
      url: getApp().globalData.MyUrl +'/pet/getPetsByPage',
      method: 'POST',
      header: {
        'content-type': 'application/json',
        'token': app.globalData.token
      },
      data: requestData,
      success: function (res) {
        if (res.statusCode === 200 && res.data.code === 200) {
          const newPets = res.data.data.records;
          const totalPages = res.data.data.pages;

          const processedNewPets = newPets.map(pet => {
            return {
              ...pet,
              processedImageUrl: that.processPetImageUrl(pet)
            };
          });

          that.setData({
            processedPets: page === 1 
              ? processedNewPets 
              : that.data.processedPets.concat(processedNewPets),
            currentPage: page,
            totalPages: totalPages,
            hasMore: page < totalPages,
            loading: false
          });

          // 加载完宠物数据后，获取每个宠物的点赞信息
          that.loadLikeInfo(processedNewPets);
        } else {
          wx.showToast({ 
            title: `错误: ${res.data?.message || res.statusCode}`, 
            icon: 'none' 
          });
          that.setData({ loading: false });
        }
      },
      fail: function (res) {
        console.error("请求失败:", res.errMsg);
        wx.showToast({ title: '请求失败', icon: 'none' });
        that.setData({ loading: false });
      }
    });
  },

  // 新增：加载点赞信息
  loadLikeInfo: function(pets) {
    if (!pets || pets.length === 0) return;
    
    pets.forEach(pet => {
      this.getLikeCount(pet.id);
      this.getLikeState(pet.id);
    });
  },

  // 新增：获取点赞数
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

  // 新增：获取点赞状态
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

  // 新增：点赞/取消点赞
  toggleLike: function(e) {
    // 微信小程序中不需要手动阻止事件冒泡，使用catchtap即可
    // 或者使用e.detail来获取事件详情
    
    const targetId = e.currentTarget.dataset.targetId;
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
          console.log(res)
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

  // 预处理宠物图片URL
  processPetImageUrl: function (pet) {
    console.log("=== 预处理图片URL ===");
    console.log("宠物数据:", pet);

    if (!pet) {
      console.log("宠物数据为空，返回默认图");
      return this.data.defaultImage;
    }

    let imageArray = [];
    if (pet.images) {
      if (Array.isArray(pet.images)) {
        imageArray = pet.images;
      } else if (typeof pet.images === 'string') {
        imageArray = pet.images.split(',').filter(img => img && img.trim());
      }
    }

    const firstImage = imageArray.find(img => img && img.trim());
    console.log("找到的第一张有效图片:", firstImage);

    if (firstImage) {
      try {
        const baseUrl = this.data.baseImageUrl.replace(/\/$/, ''); 
        const imagePath = firstImage.startsWith('/') 
          ? firstImage 
          : `/${firstImage}`; 
        const fullUrl = `${baseUrl}${imagePath}`;
        console.log("生成的完整图片URL:", fullUrl);
        return fullUrl;
      } catch (e) {
        console.error("生成图片URL出错:", e);
      }
    }

    console.log("没有找到有效图片，使用默认图");
    return this.data.defaultImage;
  },

  // 搜索输入框内容变化时触发
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 点击搜索按钮触发
  searchPets() {
    const { searchKeyword } = this.data;
    // 重置分页相关数据，重新从第一页开始搜索
    this.setData({
      currentPage: 1,
      processedPets: [],
      hasMore: true
    }, () => {
      const requestData = {
        size: this.data.pageSize,
        current: 1,
        name: "", 
        breed: searchKeyword,
        healthStatus: "",
        isAdopt: "待领养"
      };
      this.loadPetsData(1, requestData); 
    });
  },

  // 加载更多宠物数据
  loadMorePets: function () {
    if (this.data.loading || !this.data.hasMore) return;
    const nextPage = this.data.currentPage + 1;
    this.loadPetsData(nextPage);
  },

  // 宠物卡片点击事件
  handlePetClick: function (e) {
    const petId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/petDetail/petDetail?id=${petId}`
    });
  },

  // 图片加载错误处理
  handleImageError(e) {
    console.error('图片加载失败：', e.detail);
    const { index } = e.currentTarget.dataset;
    if (index !== undefined) {
      const processedPets = this.data.processedPets;
      processedPets[index].processedImageUrl = this.data.defaultImage;
      this.setData({ processedPets });
    }
  },

  // 格式化日期
  formatDate: function (timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  },

  // 宠物图片点击事件
  onPetImageTap: function (e) {
    const petId = e.currentTarget.dataset.petId;
    wx.navigateTo({
      url: `/pages/PetDetails/PetDetails?petId=${petId}`
    });
  },

  getUserProfile(e) {
    wx.getUserProfile({
      desc: '展示用户信息',
      success: (res) => {
        console.log(res)
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
        wx.switchTab({
          url: '/pages/PetAll/PetAll'
        })
      }
    })
  },
})