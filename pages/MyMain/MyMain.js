// pages/MyMain/MyMain.js
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    likeList: [],
    // 购物车相关数据
    cartList: [],
    cartTotal: 0,
    loading: true,
    error: false,
    userInfo: {
      avatarUrl: '',
      nickName: '',
      phone: '',
      username: '',
      money: '',
      credit_score: ''
    },
    showEditModal: false,
    showServiceModal: false,
    editNickName: '',
    editPhone: '',
    selectedNav: 'profile', // 'profile' | 'myApply' | 'myDiscover' | 'myLike' | 'myCart'
    applyData: [],
    applyDataPreviewUrls: [],
    myDiscoverData: [],
    myDiscoverPreviewUrls: [],
    // 侧边栏链表
    sideNavList: [
      { key: 'profile', label: '个人信息' },
      { key: 'myApply', label: '我的预约' },
      { key:'myDiscover',label:'救助信息'},
      { key:'myLike',label:'我的喜欢'},
      { key:'myCart',label:'购物车'}
    ]
  },

  // 加载用户喜欢列表
  loadUserLikes: function() {
    this.setData({ loading: true, error: false });
    const userId = app.globalData.userId || 1; // 从全局获取用户ID

    wx.request({
      url:  getApp().globalData.MyUrl + `/like/getLikeByUserId?userId=${userId}`,
      method: 'GET',
      header: {
          'token': getApp().globalData.token
        },
      success: (res) => {
          console.log('喜欢列表数据:', res)
        this.setData({ loading: false });
        if (res.data && res.data.code === 200 && res.data.data) {
          // 处理图片拼接和数据格式化
         const formattedLikes = res.data.data.filter(item => {
           // 过滤掉无效数据
           if (item.targetType === 'pet') {
             return item.petsPet && item.petsPet.id && item.petsPet.name;
           } else if (item.targetType === 'supper') {
             return item.supplies && item.supplies.id && item.supplies.productName;
           }
           return false;
         }).map(item => {
           let imageUrl = '/components/IMAGES/default.png'; // 默认图片
           let title = '';
           let subtitle = '';
           let type = item.targetType;
           let extraInfo = ''; // 额外信息
            
           // 根据类型处理不同数据
           if (type === 'pet' && item.petsPet) {
             const pet = item.petsPet;
             title = pet.name || '未知宠物';
             subtitle = `${pet.breed || '未知品种'} · ${pet.age || 0}岁 · ${pet.gender || '未知'}`;
             extraInfo = `${pet.location || '位置未知'} · ${pet.isAdopt || '状态未知'}`;
             
             // 宠物图片处理
             if (pet.images && Array.isArray(pet.images) && pet.images.length > 0) {
               let petImage = pet.images[0];
               imageUrl = petImage.includes('http') ? petImage : getApp().globalData.NodeUrl + petImage;
             }
           } else if (type === 'supper' && item.supplies) {
             const supply = item.supplies;
             title = supply.productName || '未知商品';
             subtitle = `${supply.brand || '未知品牌'} · ¥${(supply.price || 0).toFixed(2)}`;
             extraInfo = `品种：  ${supply.category || '未分类'}`;
             
             // 用品图片处理
             if (supply.imageUrl) {
               imageUrl = supply.imageUrl.includes('http') ? supply.imageUrl : getApp().globalData.NodeUrl + supply.imageUrl;
             }
           }
            
           // 格式化时间
           const createTime = new Date(...item.createTime).toLocaleString('zh-CN', {
             year: 'numeric',
             month: '2-digit', 
             day: '2-digit',
             hour: '2-digit',
             minute: '2-digit'
           });
            
           return {
             ...item,
             title,
             subtitle,
             extraInfo,
             imageUrl,
             createTime,
             displayType: type === 'pet' ? '宠物' : '用品'
           };
         });
         
         console.log('处理后的数据:', formattedLikes);
         this.setData({ likeList: formattedLikes });
        } else {
          this.setData({ error: true, likeList: [] });
          wx.showToast({ title: '获取喜欢列表失败', icon: 'none' });
        }
      },
      fail: () => {
        this.setData({ loading: false, error: true, likeList: [] });
        wx.showToast({ title: '网络请求失败', icon: 'none' });
      }
    });
  },

  // ==================== 购物车功能 ====================
  // 加载用户购物车列表
  loadUserCart: function() {
    this.setData({ loading: true, error: false });
    const userId = app.globalData.userId;
    
    if (!userId) {
      this.setData({ loading: false, error: true, cartList: [] });
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.request({
      url: getApp().globalData.MyUrl + '/supplies/list',
      method: 'GET',
      header: {
        'token': getApp().globalData.token
      },
      data: {
        userId: userId
      },
      success: (res) => {
        console.log('购物车数据:', res);
        this.setData({ loading: false });
        if (res.data && res.data.code === 200) {
          // 处理购物车数据
          const cartItems = res.data.data || [];
          const formattedCartItems = cartItems.map(item => {
            // 计算小计
            const subtotal = (item.price * item.quantity).toFixed(2);
            
            // 处理商品图片
            let imageUrl = '/components/IMAGES/default.png'; // 默认图片
            if (item.supplies && item.supplies.imageUrl) {
              imageUrl = item.supplies.imageUrl.includes('http') ? 
                item.supplies.imageUrl : 
                getApp().globalData.NodeUrl + item.supplies.imageUrl;
            }
            
            // 商品信息
            const productName = item.supplies?.productName || '未知商品';
            const brand = item.supplies?.brand || '未知品牌';
            const category = item.supplies?.category || '未分类';
            
            return {
              ...item,
              imageUrl,
              productName,
              brand,
              category,
              subtotal
            };
          });
          
          // 计算总价
          const total = formattedCartItems.reduce((sum, item) => {
            return sum + parseFloat(item.subtotal);
          }, 0).toFixed(2);
          
          this.setData({ 
            cartList: formattedCartItems,
            cartTotal: total
          });
        } else {
          this.setData({ error: true, cartList: [] });
          wx.showToast({ title: res.data?.message || '获取购物车失败', icon: 'none' });
        }
      },
      fail: () => {
        this.setData({ loading: false, error: true, cartList: [] });
        wx.showToast({ title: '网络请求失败', icon: 'none' });
      }
    });
  },

  // 更新购物车商品数量
  updateCartItemQuantity: function(e) {
    const id = e.currentTarget.dataset.id;
    const action = e.currentTarget.dataset.action; // 获取操作类型（plus或minus）
    let quantity;
    
    // 判断是按钮点击还是输入框变化
    if (action) {
      // 按钮点击
      // 先获取当前商品的数量
      const currentItem = this.data.cartList.find(item => item.id === id);
      if (!currentItem) return;
      
      // 根据操作类型增加或减少数量
      if (action === 'plus') {
        quantity = currentItem.quantity + 1;
      } else if (action === 'minus') {
        quantity = currentItem.quantity - 1;
        if (quantity < 1) {
          wx.showToast({ title: '数量不能小于1', icon: 'none' });
          return;
        }
      }
    } else {
      // 输入框变化
      quantity = parseInt(e.detail.value);
      if (isNaN(quantity) || quantity < 1) {
        wx.showToast({ title: '请输入有效的数量', icon: 'none' });
        // 恢复原来的值
        const currentItem = this.data.cartList.find(item => item.id === id);
        if (currentItem) {
          this.setData({
            [`cartList[${this.data.cartList.findIndex(item => item.id === id)}].quantity`]: currentItem.quantity
          });
        }
        return;
      }
    }
    
    console.log("id:" + id);
    console.log("quantity:" + quantity);
    
    wx.request({
      url: getApp().globalData.MyUrl + '/supplies/updateQuantity',
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'token': app.globalData.token
      },
      data: {
        id: id,
        quantity: quantity
      },
      success: (res) => {
        if (res.data && res.data.code === 200) {
          // 更新本地数据
          const cartList = this.data.cartList.map(item => {
            if (item.id === id) {
              const subtotal = (item.price * quantity).toFixed(2);
              return { ...item, quantity, subtotal };
            }
            return item;
          });
          
          // 重新计算总价
          const total = cartList.reduce((sum, item) => {
            return sum + parseFloat(item.subtotal);
          }, 0).toFixed(2);
          
          this.setData({ 
            cartList: cartList,
            cartTotal: total
          });
          
          wx.showToast({ title: '更新成功', icon: 'success' });
        } else {
          wx.showToast({ title: res.data?.message || '更新失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  // 从购物车删除商品
  removeCartItem: function(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要从购物车中删除该商品吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: getApp().globalData.MyUrl + `/supplies/remove/${id}`,
            method: 'DELETE',
            header: {
              'token': getApp().globalData.token
            },
            success: (res) => {
              if (res.data && res.data.code === 200) {
                // 更新本地数据
                const cartList = this.data.cartList.filter(item => item.id !== id);
                
                // 重新计算总价
                const total = cartList.reduce((sum, item) => {
                  return sum + parseFloat(item.subtotal);
                }, 0).toFixed(2);
                
                this.setData({ 
                  cartList: cartList,
                  cartTotal: total
                });
                
                wx.showToast({ title: '删除成功', icon: 'success' });
              } else {
                wx.showToast({ title: res.data?.message || '删除失败', icon: 'none' });
              }
            },
            fail: () => {
              wx.showToast({ title: '网络错误', icon: 'none' });
            }
          });
        }
      }
    });
  },

  // 清空购物车
  clearCart: function() {
    const userId = app.globalData.userId;
    
    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    
    wx.showModal({
      title: '确认清空',
      content: '确定要清空购物车吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: getApp().globalData.MyUrl + `/supplies/clear/${userId}`,
            method: 'GET',
            header: {
              'token': getApp().globalData.token
            },
            success: (res) => {
              if (res.data && res.data.code === 200) {
                this.setData({ 
                  cartList: [],
                  cartTotal: 0
                });
                wx.showToast({ title: '购物车已清空', icon: 'success' });
              } else {
                wx.showToast({ title: res.data?.message || '清空失败', icon: 'none' });
              }
            },
            fail: () => {
              wx.showToast({ title: '网络错误', icon: 'none' });
            }
          });
        }
      }
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 假设 openid 已经获取到，可以通过 app.globalData.openid 获取
    const openid = app.globalData.openid;
    if (openid) {
      wx.request({
        url: getApp().globalData.MyUrl +`/selectByOpenidGetUser/${openid}`,
        method: 'POST',
        header: {
          'content-type': 'application/json',
          'token': app.globalData.token
        },
        success: (res) => {
          console.log(res)
          if (res.data && res.data.code === 200 && res.data.data) {
            const user = res.data.data;
            let avatarUrl = user.avatar || '';
            if (avatarUrl && !/^http/.test(avatarUrl)) {
              avatarUrl = getApp().globalData.NodeUrl + avatarUrl;
            }
            this.setData({
              userInfo: {
                avatarUrl: avatarUrl,
                nickName: user.nickname || '',
                phone: user.phone || '',
                username: user.username || '',
                money: user.money || '',
                credit_score: user.credit_score || ''
              }
            })
          } else {
            // 未查到绑定数据，跳转到登录页面
            wx.redirectTo({
              url: '/pages/login/login'
            });
          }
        }
      })
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

  showProfile() {
    // 侧边栏点击个人信息，主内容区已展示，无需额外处理
  },

  editProfile() {
    // 打开编辑弹窗，并初始化编辑内容
    this.setData({
      showEditModal: true,
      editNickName: this.data.userInfo.nickName || '',
      editPhone: this.data.userInfo.phone || ''
    })
  },

  contactService() {
    // 跳转到聊天页面，假设客服id为 '2001'
    wx.navigateTo({
      url: '/pages/chatMessage/chatMessage?targetId=2001'
    });
  },

  closeServiceModal() {
    this.setData({ showServiceModal: false })
  },

  closeEditModal() {
    this.setData({ showEditModal: false })
  },

  onEditNickName(e) {
    this.setData({ editNickName: e.detail.value })
  },

  onEditPhone(e) {
    this.setData({ editPhone: e.detail.value })
  },

  saveProfile() {
    const { editNickName, editPhone, userInfo } = this.data;
    // 表单校验
    if (!editNickName.trim()) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' });
      return;
    }
    if (!editPhone.trim()) {
      wx.showToast({ title: '手机号不能为空', icon: 'none' });
      return;
    }
    // 简单手机号格式校验（中国大陆手机号）
    if (!/^1[3-9]\d{9}$/.test(editPhone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }
    // 只传递有变动的字段
    const changedFields = {};
    if (editNickName !== userInfo.nickName) changedFields.nickname = editNickName;
    if (editPhone !== userInfo.phone) changedFields.phone = editPhone;
    // 必须传 openid
    changedFields.openid = app.globalData.openid;
    if (Object.keys(changedFields).length <= 1) { // 只有 openid
      wx.showToast({ title: '没有修改内容', icon: 'none' });
      this.setData({ showEditModal: false });
      return;
    }
    // 更新本地 userInfo
    const newUserInfo = Object.assign({}, userInfo, {
      nickName: editNickName,
      phone: editPhone
    });
    this.setData({
      userInfo: newUserInfo,
      showEditModal: false
    });
    wx.request({
      url: getApp().globalData.MyUrl +'/updateUserAvatar',
      method: 'POST',
      header: {
        'content-type': 'application/json',
        'token': app.globalData.token
      },
      data: changedFields,
      success(res) {
        if (res.data && res.data.code === 200) {
          wx.showToast({ title: '保存成功', icon: 'success' });
        } else {
          wx.showToast({ title: '保存失败', icon: 'none' });
        }
      },
      fail() {
        wx.showToast({ title: '保存失败', icon: 'none' });
      }
    });
  },

  onChooseAvatar() {
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        const tempFilePath = res.tempFilePaths[0];
        wx.uploadFile({
          url: getApp().globalData.MyUrl +'/upload/profile',
          filePath: tempFilePath,
          name: 'file',
          header: {
            'token': app.globalData.token
          },
          success(uploadRes) {
            let data = {};
            try {
              data = JSON.parse(uploadRes.data);
            } catch (e) {
              wx.showToast({ title: '上传失败', icon: 'none' });
              return;
            }
            // 兼容 filePath 字段
            const avatarPath = data.filePath || data.data;
            if (avatarPath) {
              let avatarUrl = avatarPath;
              if (avatarUrl && !/^http/.test(avatarUrl)) {
                avatarUrl = getApp().globalData.MyUrl +'/photo' + avatarUrl;
              }
              that.setData({
                'userInfo.avatarUrl': avatarUrl
              });
              wx.showToast({ title: '上传成功', icon: 'success' });
              // 同步到后端用户信息
              wx.request({
                url: getApp().globalData.MyUrl +`/updateUserAvatar`,
                method: 'POST',
                header: {
                  'content-type': 'application/json',
                  'token': app.globalData.token
                },
                data: {
                  openid: app.globalData.openid,
                  avatar: avatarPath
                }
              });
            } else {
              wx.showToast({ title: '上传失败', icon: 'none' });
            }
          },
          fail() {
            wx.showToast({ title: '上传失败', icon: 'none' });
          }
        });
      }
    });
  },

  onSelectNav(e) {
    const nav = e.currentTarget.dataset.nav;
    this.setData({ selectedNav: nav });
    if (nav === 'myApply') {
      this.onShowApply();
    }
    if (nav === 'myDiscover') {
      this.onShowMyDiscover();
    }
    if (nav === 'myLike') {
      this.loadUserLikes();
    }
    if (nav === 'myCart') {
      this.loadUserCart();
    }
  },

  /**
   * 退出登录
   */
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储的用户数据
          wx.removeStorageSync('openid');
          wx.removeStorageSync('token');
          
          // 重置全局状态
          app.globalData.openid = null;
          app.globalData.token = null;
          
          // 跳转到登录页面
          wx.redirectTo({
            url: '/pages/login/login'
          });
        }
      }
    });
  },

  onShowApply() {
    this.setData({ loading: true, error: '', applyData: [] });
    let openid = app.globalData.openid || wx.getStorageSync('openid');
    if (!openid) {
      this.setData({ loading: false, error: '未获取到 openid，请重新登录' });
      return;
    }
    wx.request({
      url: getApp().globalData.MyUrl + '/selectByOpenidGetId/' + openid,
      method: 'POST',
      header: {
        'content-type': 'application/json',
        'token': app.globalData.token
      },
      success: (res) => {
        if (res.data) {
          const userId = res.data;
          wx.request({
            url: getApp().globalData.MyUrl + '/adoptionApply/getByUserId/' + userId,
            method: 'GET',
            header: {
              'content-type': 'application/json',
              'token': app.globalData.token
            },
            success: (res2) => {
              if (res2.data && res2.data.code === 200 && res2.data.data) {
                let applyList = Array.isArray(res2.data.data) ? res2.data.data : [res2.data.data];
                // 拼接图片完整URL
                const MyUrl = app.globalData.NodeUrl;
                const applyDataPreviewUrls = applyList.map(item => {
                  let previewUrl = item.petImage ? (MyUrl + item.petImage) : '/components/IMAGES/Discover.png';
                  return previewUrl;
                });
                this.setData({ applyData: applyList, applyDataPreviewUrls: applyDataPreviewUrls, loading: false });
              } else {
                this.setData({ error: res2.data.message || '未查询到申请数据', loading: false });
              }
            },
            fail: () => {
              this.setData({ error: '获取申请数据失败', loading: false });
            }
          });
        } else {
          this.setData({ error: res.data.message || '未查询到用户ID', loading: false });
        }
      },
      fail: () => {
        this.setData({ error: '获取用户ID失败', loading: false });
      }
    });
  },

  onViewTask(e) {
    const applyId = e.currentTarget.dataset.applyid;
    wx.navigateTo({
      url: `/pages/TaskByApplyId/TaskByApplyId?applyId=${applyId}`
    });
  },

  // 获取本人救助信息
  onShowMyDiscover() {
    const userId = app.globalData.userId;
    if (!userId) {
      this.setData({ myDiscoverData: [], myDiscoverPreviewUrls: [] });
      return;
    }
    wx.request({
      url: app.globalData.MyUrl + '/discover/selectByUserId/' + userId,
      method: 'GET',
      header: {
        'token': app.globalData.token
      },
      success: (res) => {
        if (res.data && res.data.code === 200 && res.data.data) {
          const list = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
          // 处理图片URL
          const MyUrl = app.globalData.NodeUrl;
          const previewUrls = list.map(item => {
            let imgArr = [];
            // 兼容imageUrls为字符串（可能带引号）或数组
            if (item.imageUrls) {
              let urls = item.imageUrls;
              try {
                // 先尝试解析JSON字符串
                urls = JSON.parse(item.imageUrls);
              } catch (e) {
                // 如果解析失败，保持原样
                console.log('JSON解析失败，使用原始数据:', item.imageUrls);
              }
              
              // 确保urls是数组格式
              if (!Array.isArray(urls)) {
                urls = [urls];
              }
              
              imgArr = urls.map(url => {
                // 处理可能的引号和空格
                if (typeof url === 'string') {
                  url = url.replace(/^"|"$/g, '').trim(); // 去除首尾引号
                  // 如果URL不为空且不是完整的http地址，则拼接基础URL
                  if (url && !/^https?:\/\//.test(url)) {
                    // 确保URL以/开头
                    if (!url.startsWith('/')) {
                      url = '/' + url;
                    }
                    return MyUrl + url;
                  }
                  // 对于HTTP链接，在真机上使用一个中转服务或者提示用户
                  // 这里我们保持原样，但在WXML中会添加错误处理
                  return url;
                }
                return url;
              }).filter(url => url); // 过滤掉空值
            }
            return imgArr;
          });
          console.log('处理后的图片URL:', previewUrls);
          this.setData({ myDiscoverData: list, myDiscoverPreviewUrls: previewUrls });
        } else {
          this.setData({ myDiscoverData: [], myDiscoverPreviewUrls: [] });
        }
      },
      fail: () => {
        this.setData({ myDiscoverData: [], myDiscoverPreviewUrls: [] });
      }
    });
  },

  // 跳转到详情页
  navigateToDetail: function(e) {
    const type = e.currentTarget.dataset.type;
    const id = e.currentTarget.dataset.id;
    let url = '';
    
    if (type === 'pet') {
      url = `/pages/PetDetails/PetDetails?id=${id}`;
    } else if (type === 'supper') {
      url = `/pages/SuppliesDetail/SuppliesDetail?id=${id}`;
    }
    
    if (url) {
      wx.navigateTo({
        url: url
      });
    }
  },

  // 图片加载错误处理
  onImageError: function(e) {
    console.log('图片加载失败:', e);
    const originalSrc = e.currentTarget.dataset.originalSrc;
    console.log('原始图片地址:', originalSrc);
    // 这里可以设置默认图片或者提示用户
    // 在实际应用中，您可以在这里添加错误处理逻辑
  }
});