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
    likeStates: {}, // 存储每个pet的点赞状态
    likeCounts: {}, // 存储每个pet的点赞数
    // 新增评论相关数据
    comments: [],
    commentCount: 0,
    commentContent: '',
    replyContent: '',
    showReplyId: null,
    showCommentModal: false,
    // 轮播相关数据
    currentImageIndex: 0,
    showImagePreview: false,
    previewImageList: [],
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.fetchPetList(); // 你原本用于加载pet列表的方法
    // 加载用户ID
    this.loadUserId();
    // 如果有pet数据，加载点赞信息和评论
    if (this.data.pet && this.data.pet.id) {
      this.loadLikeInfoForPet(this.data.pet.id);
      this.fetchComments();
    }
  },

  // 加载用户ID
  loadUserId() {
    const that = this;
    // 先检查全局是否已有userId
    if (app.globalData.userId) {
      that.setData({
        userId: app.globalData.userId
      });
      return;
    }

    // 如果没有，尝试通过openid获取
    wx.request({
      url: getApp().globalData.MyUrl +`/selectByOpenidGetId/${app.globalData.openid || ''}`,
      method: 'POST',
      header: {
        'token': app.globalData.token
      },
      success(res) {
        if (res.data != null) {
          // 有 userId
          that.setData({
            userId: res.data
          });
          // 同时保存到全局
          app.globalData.userId = res.data;
        } else {
          // 没有 userId，但不跳转登录，而是在提交评论时处理
          console.log('未获取到userId');
        }
      },
      fail() {
        console.error('获取userId失败');
      }
    });
  },

  // 加载指定pet的点赞信息
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
        targetType: 'pet'
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
        targetType: 'pet',
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
    const targetType = 'pet';
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
    const petId = options.id || options.petId; // 兼容id和petId参数
    const productId = options.productId;
    this.setData({ petId });

  // 验证petId有效性
  if (!petId) {
    wx.showToast({ title: '未获取到宠物ID', icon: 'none', duration: 2000 });
    wx.navigateBack();
    return;
  }
    
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
    
    // 兼容原有pet详情逻辑
    if (petId) {
      this.fetchPetList();
      this.fetchVaccineInfo(petId);
      // 加载评论
      this.fetchComments();
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
    const { pet } = this.data;
    if (!pet) return {};

    // 设置分享内容
    return {
      title: `可爱的${pet.name}寻找新家`,
      path: `/pages/PetDetails/PetDetails?petId=${pet.id}`,
      imageUrl: pet.processedImageUrl || '/components/IMAGES/1293.jpg_wh860.png',
      success: function(res) {
        wx.showToast({
          title: '分享成功',
          icon: 'success'
        });
      },
      fail: function(res) {
        wx.showToast({
          title: '分享失败',
          icon: 'none'
        });
      }
    };
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
      console.error('没有获取到petID');
      wx.showToast({ title: '参数错误', icon: 'none' });
      return;
    }
    
    // 检查是否已有pet数据，如果没有则请求
    if (!this.data.pet) {
      this.setData({ vaccineLoading: true, vaccineError: false });
      
      // 获取pet基本信息
      console.log('fetchPetList中开始获取pet基本信息，petId:', this.data.petId);
      wx.request({
        url: getApp().globalData.MyUrl+`/pet/getOneById/${this.data.petId}`,
        method: 'GET',
        header: {
          'content-type': 'application/json',
          'token': app.globalData.token
        },
        success: (res) => {
          console.log('fetchPetList中pet基本信息接口返回:', res);
          if (res.data && res.data.code === 200 && res.data.data) {
            let petData = res.data.data;
            
            // 处理pet图片URL
            let processedImageUrl = null;
            let processedImages = [];
            const nodeUrl = getApp().globalData.NodeUrl;
            
            // 处理图片数据：支持数组中逗号分隔的字符串格式
            if (petData.images && petData.images.length > 0) {
              // 遍历图片数组，处理每个元素
              petData.images.forEach(imageItem => {
                if (typeof imageItem === 'string' && imageItem.trim()) {
                  // 如果图片项包含逗号，则拆分成多个图片
                  if (imageItem.includes(',')) {
                    const splitImages = imageItem.split(',').map(img => img.trim()).filter(img => img);
                    splitImages.forEach(img => {
                      // 确保URL格式正确，避免双斜杠
                      const normalizedImage = img.replace(/^\//, ''); // 移除开头的斜杠
                      const fullUrl = nodeUrl.replace(/\/$/, '') + '/' + normalizedImage;
                      processedImages.push(fullUrl);
                    });
                  } else {
                    // 单个图片地址
                    const normalizedImage = imageItem.replace(/^\//, '');
                    const fullUrl = nodeUrl.replace(/\/$/, '') + '/' + normalizedImage;
                    processedImages.push(fullUrl);
                  }
                }
              });
              
              // 更新petData的images为处理后的图片数组
              petData.images = processedImages;
              
              // 设置第一张图片作为主图
              if (processedImages.length > 0) {
                processedImageUrl = processedImages[0];
              }
            }
            
            // 如果没有有效图片路径，使用默认图片
            if (!processedImageUrl) {
              processedImageUrl = '/components/IMAGES/1293.jpg_wh860.jpg'; // 默认图片，修正扩展名
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
              vaccineLoading: false,
              currentImageIndex: 0 // 初始化轮播索引
            });
            console.log('fetchPetList中pet信息已设置:', this.data.pet);
            this.loadLikeInfoForPet(petData.id);
          } else {
            console.error('fetchPetList中pet基本信息接口返回错误:', res.data);
            this.setData({ vaccineLoading: false });
            wx.showToast({ title: '获取pet信息失败', icon: 'none' });
          }
        },
        fail: (err) => {
          console.error('请求pet信息失败:', err);
          this.setData({ vaccineError: true, vaccineLoading: false });
          wx.showToast({ title: '网络错误，请重试', icon: 'none' });
        }
      });
    } else {
      // 如果已有pet数据，确保加载点赞信息
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
    
    if (pet.images.length > 0 && index !== undefined && pet.images[index]) {
      // 如果有images数组，替换对应索引的图片
      pet.images[index] = defaultImage;
    } else {
      // 否则替换processedImageUrl
      pet.processedImageUrl = defaultImage;
    }
    
    // 更新数据
    this.setData({ pet });
    
    console.log(`图片加载失败，已替换为默认图片，索引: ${index}`);
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 切换评论弹窗显示/隐藏
  toggleCommentModal() {
    this.setData({
      showCommentModal: !this.data.showCommentModal
    });
    // 如果显示弹窗，获取评论数据
    if (this.data.showCommentModal) {
      this.fetchComments();
    }
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止事件冒泡
  },

  // 分享pet信息
  sharePet() {
    const { pet } = this.data;
    console.log('分享按钮被点击，pet数据:', pet);
    
    if (!pet) {
      wx.showToast({
        title: 'pet信息未加载完成',
        icon: 'none'
      });
      return;
    }
    
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
      success: () => {
        console.log('分享菜单显示成功');
      },
      fail: (err) => {
        console.error('分享菜单显示失败:', err);
        wx.showToast({
          title: '分享功能异常',
          icon: 'none'
        });
      }
    });
  },

  // 获取评论列表
  fetchComments() {
    const { petId } = this.data;
    if (!petId) return;

    wx.request({
      url: getApp().globalData.MyUrl+ '/comment/list',
      method: 'GET',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'token': app.globalData.token
      },
      data: {
        targetId: petId,
        targetType: 'pet'
      },
      success: (res) => {
          console.log(res)
        if (res.statusCode === 200 && res.data.code === 200) {
          // 格式化评论数据，处理三级评论的平铺展示
          const formattedComments = this.formatComments(res.data.data || []);
          this.setData({
            comments: formattedComments,
            commentCount: res.data.data?.length || 0
          });
        } else {
          wx.showToast({
            title: '获取评论失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('获取评论失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 格式化评论数据，最多支持两层评论
  formatComments(comments) {
      console.log(comments)
    // 首先构建评论ID到评论的映射
    const commentMap = new Map();
    // 获取头像基础URL
    const avatarBaseUrl = getApp().globalData.NodeUrl;
    
    comments.forEach(comment => {
      // 处理缺少的字段
      comment.replies = [];
      comment.level = 0; // 初始化层级
      comment.userName = comment.userName || '匿名用户';
      
      // 处理头像URL，确保与基础URL拼接
      if (comment.userAvatar) {
        // 检查头像URL是否已经包含基础URL
        if (comment.userAvatar.startsWith('http://') || comment.userAvatar.startsWith('https://')) {
          // 已经是完整URL，保持不变
        } else {
          // 需要拼接基础URL，确保格式正确，避免双斜杠
          comment.userAvatar = avatarBaseUrl + (comment.userAvatar.startsWith('/') ? '' : '/') + comment.userAvatar;
            console.log(comment.userAvatar)
        }
      } else {
        comment.userAvatar = '';
      }

      // 格式化日期
      if (comment.createTime && Array.isArray(comment.createTime)) {
        const [year, month, day, hour, minute, second] = comment.createTime;
        comment.createTime = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      } else {
        comment.createTime = '刚刚';
      }

      commentMap.set(comment.id, comment);
    });

    // 分离一级评论和子评论
    const level1Comments = [];
    comments.forEach(comment => {
      if (!comment.parentId || comment.parentId === 0) {
        // 一级评论 (parentId为null、undefined或0)
        comment.level = 1;
        level1Comments.push(comment);
      } else {
        // 子评论
        const parentComment = commentMap.get(comment.parentId);
        if (parentComment) {
          // 设置父评论用户名，用于@显示
          comment.parentUserName = parentComment.userName;

          // 计算当前评论的层级
          comment.level = parentComment.level + 1;

          // 检查是否超过两层
          if (comment.level > 2) {
            // 超过两层，找到最近的层级≤1的祖先
            let ancestor = parentComment;
            while (ancestor && ancestor.level > 1) {
              ancestor = commentMap.get(ancestor.parentId);
            }

            // 如果找到了合适的祖先，则添加到其replies中
            if (ancestor) {
              ancestor.replies.push(comment);
            }
          } else {
            // 未超过两层，直接添加到父评论的replies中
            parentComment.replies.push(comment);
          }
        }
      }
    });

    return level1Comments;
  },

  // 评论输入
  onCommentInput(e) {
    this.setData({
      commentContent: e.detail.value
    });
  },

  // 提交评论
  submitComment() {
    const { commentContent, petId } = this.data;
    const userId = this.data.userId || app.globalData.userId || 1;

    if (!commentContent.trim()) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      });
      return;
    }

    if (!petId) {
      wx.showToast({
        title: 'petID不存在',
        icon: 'none'
      });
      return;
    }

    if (!userId) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      wx.navigateTo({
        url: '/pages/login/login'
      });
      return;
    }

    console.log(userId)
    console.log(petId)
    console.log(commentContent.trim())
    console.log(app.globalData.token)
    wx.request({
      url: getApp().globalData.MyUrl+'/comment/add',
      method: 'POST',
      header: {
        'content-type': 'application/json',
        'token': app.globalData.token
      },
      data: {
        targetId: petId,
        targetType: 'pet',
        userId: userId || app.globalData.userId || 1,
        content: commentContent.trim(),
        parentId: 0
      },
      success: (res) => {
          console.log(res)
        if (res.statusCode === 200 && res.data.code === 200) {
          wx.showToast({
            title: '评论成功',
            icon: 'success'
          });
          // 清空评论输入框
          this.setData({
            commentContent: ''
          });
          // 重新获取评论列表
          this.fetchComments();
        } else {
          wx.showToast({
            title: res.data?.message || '评论失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('提交评论失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 显示回复框
  showReplyBox(e) {
    const { id } = e.currentTarget.dataset;
    // 如果点击的是当前显示的回复框，则隐藏它；否则显示新的回复框
    this.setData({
      showReplyId: this.data.showReplyId === id ? null : id,
      replyContent: ''
    });
  },

  // 隐藏回复框
  hideReplyBox() {
    this.setData({
      showReplyId: null,
      replyContent: ''
    });
  },

  // 回复输入
  onReplyInput(e) {
    this.setData({
      replyContent: e.detail.value
    });
  },

  // 提交回复
  submitReply(e) {
    const { replyContent, petId, userId } = this.data;
    const parentId = e.currentTarget.dataset.id;

    if (!replyContent.trim()) {
      wx.showToast({
        title: '请输入回复内容',
        icon: 'none'
      });
      return;
    }

    if (!petId) {
      wx.showToast({
        title: 'petID不存在',
        icon: 'none'
      });
      return;
    }

    if (!userId) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      wx.navigateTo({
        url: '/pages/login/login'
      });
      return;
    }

    if (!parentId) {
      wx.showToast({
        title: '回复对象不存在',
        icon: 'none'
      });
      return;
    }

    wx.request({
      url: getApp().globalData.MyUrl+'/comment/add',
      method: 'POST',
      header: {
        'content-type': 'application/json',
        'token': app.globalData.token
      },
      data: {
        targetId: petId,
        targetType: 'pet',
        userId: userId || app.globalData.userId || 1,
        content: replyContent.trim(),
        parentId: parentId
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          wx.showToast({
            title: '回复成功',
            icon: 'success'
          });
          // 隐藏回复框
          this.hideReplyBox();
          // 重新获取评论列表
          this.fetchComments();
        } else {
          wx.showToast({
            title: res.data?.message || '回复失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('提交回复失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 删除评论
  deleteComment(e) {
    const commentId = e.currentTarget.dataset.id;
    if (!commentId) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条评论吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: getApp().globalData.MyUrl+'/comment/delete',
            method: 'GET',
            header: {
              'content-type': 'application/x-www-form-urlencoded',
              'token': app.globalData.token
            },
            data: {
              id: commentId,
              userId:getApp().globalData.userId
            },
            success: (res) => {
              if (res.statusCode === 200 && res.data.code === 200) {
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
                // 重新获取评论列表
                this.fetchComments();
              } else {
                wx.showToast({
                  title: res.data?.message || '删除失败',
                  icon: 'none'
                });
              }
            },
            fail: (err) => {
              console.error('删除评论失败:', err);
              wx.showToast({
                title: '网络错误，请重试',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 轮播图变化事件
  onSwiperChange(e) {
    this.setData({
      currentImageIndex: e.detail.current
    });
  },

  // 点击图片预览
  previewImages(e) {
    const { pet } = this.data;
    if (!pet) return;

    // 获取图片列表
    let imageList = [];
    if (pet.images && pet.images.length > 0) {
      imageList = pet.images;
    } else if (pet.processedImageUrl) {
      imageList = [pet.processedImageUrl];
    }

    if (imageList.length === 0) return;

    // 获取当前点击的图片索引
    const currentIndex = e.currentTarget.dataset.index || this.data.currentImageIndex || 0;

    // 使用微信小程序的图片预览功能
    wx.previewImage({
      current: imageList[currentIndex],
      urls: imageList,
      fail: (err) => {
        console.error('图片预览失败:', err);
        wx.showToast({
          title: '图片预览失败',
          icon: 'none'
        });
      }
    });
  },

  // 获取图片总数
  getImageCount() {
    const { pet } = this.data;
    if (!pet) return 0;
    
    if (pet.images && pet.images.length > 0) {
      return pet.images.length;
    } else if (pet.processedImageUrl) {
      return 1;
    }
    return 0;
  },

  // 上一张图片
  prevImage() {
    const { currentImageIndex } = this.data;
    const imageCount = this.getImageCount();
    
    if (imageCount <= 1) return;
    
    const newIndex = currentImageIndex === 0 ? imageCount - 1 : currentImageIndex - 1;
    this.setData({
      currentImageIndex: newIndex
    });
  },

  // 下一张图片
  nextImage() {
    const { currentImageIndex } = this.data;
    const imageCount = this.getImageCount();
    
    if (imageCount <= 1) return;
    
    const newIndex = currentImageIndex === imageCount - 1 ? 0 : currentImageIndex + 1;
    this.setData({
      currentImageIndex: newIndex
    });
  }
})