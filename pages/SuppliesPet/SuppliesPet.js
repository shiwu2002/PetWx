// pages/SuppliesPet/SuppliesPet.js
const app = getApp(); 
Page({

  /**
   * 页面的初始数据
   */
  data: {
    suppliesList: [],
    loading: false,
    error: false,
    // 分页相关
    current: 1,
    size: 5,
    total: 0,
    pages: 0,
    hasMore: true,
    likeStates: {}, // 存储点赞状态
    likeCounts: {} // 存储点赞数
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.fetchSuppliesList();
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
    this.fetchSuppliesList();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      // 直接调用加载更多，让fetchSuppliesList内部处理页码
      this.fetchSuppliesList(true);
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  fetchSuppliesList(isLoadMore = false) {
    // 防止重复调用
    if (this.data.loading) {
      console.log('正在加载中，忽略重复调用');
      return;
    }
    
    if (isLoadMore) {
      if (!this.data.hasMore) {
        console.log('没有更多数据了');
        return;
      }
    } else {
      this.setData({ current: 1, suppliesList: [] });
    }
    
    this.setData({ loading: true, error: false });
    
    // 计算当前请求的页码
    let currentPage;
    if (isLoadMore) {
      // 加载更多时，使用当前页码+1
      currentPage = this.data.current + 1;
    } else {
      // 首次加载或刷新时，使用页码1
      currentPage = 1;
    }
    
    // 调试信息
    console.log('请求分页数据:', {
      pageNum: currentPage - 1,
      pageSize: this.data.size,
      isLoadMore,
      currentPage,
      currentData: this.data.current
    });
    
    wx.request({
      url: getApp().globalData.MyUrl +'/supplies/selectAll',
      method: 'POST',
      header: {
        'content-type': 'application/json',
        'token':app.globalData.token
      },
      data: {
        pageNum: currentPage - 1, // 后端从0开始
        pageSize: this.data.size,
        productName: '',
        category: ''
      },
      success: (res) => {
        console.log('分页响应数据:', res.data);
        if (res.data && res.data.records && Array.isArray(res.data.records)) {
          // 处理图片路径
          const processedRecords = res.data.records.map(item => ({
            ...item,
            imageUrl: item.imageUrl ? getApp().globalData.NodeUrl +`${item.imageUrl}` : '/components/IMAGES/1293.jpg_wh860.jpg'
    
        }));
          // 合并并去重
          const newList = isLoadMore
            ? [...this.data.suppliesList, ...processedRecords].filter(
                (item, index, arr) => arr.findIndex(i => i.id === item.id) === index
              )
            : processedRecords;
          
          const hasMore = currentPage < res.data.pages;
          
          console.log('处理后的数据:', {
            newListLength: newList.length,
            currentListLength: this.data.suppliesList.length,
            hasMore,
            currentPage,
            totalPages: res.data.pages,
            recordsLength: res.data.records.length,
            recordsIds: res.data.records.map(item => item.id),
            isLoadMore
          });
          
          this.setData({ 
            suppliesList: newList, 
            loading: false,
            total: res.data.total,
            pages: res.data.pages,
            hasMore: hasMore,
            current: currentPage // 在这里更新current
          });

          // 为每个商品加载点赞信息
          newList.forEach(item => {
            this.loadLikeInfo(item.id);
          });
        } else {
          this.setData({ error: true, loading: false });
        }
      },
      fail: () => {
        this.setData({ error: true, loading: false });
      }
    });
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    console.log(id)
    wx.navigateTo({
      url: `/pages/SuppliesDetail/SuppliesDetail?id=${id}`
    });
  },

  // 点赞功能相关方法
  loadLikeInfo: function(targetId) {
    this.getLikeCount(targetId);
    this.getLikeState(targetId);
  },

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
        targetType: 'supper'
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          const likeCounts = { ...that.data.likeCounts };
          likeCounts[targetId] = res.data.data || 0;
          that.setData({ likeCounts });
        }
      }
    });
  },

  getLikeState: function(targetId) {
    const that = this;
    wx.request({
      url: getApp().globalData.MyUrl + '/like/isLiked',
      method: 'GET',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'token': app.globalData.token
      },
      data: {
        targetId: targetId,
        targetType: 'supper',
        userId: getApp().globalData.userId
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          const likeStates = { ...that.data.likeStates };
          likeStates[targetId] = res.data.data || false;
          that.setData({ likeStates });
        }
      }
    });
  },

  toggleLike: function(e) {
    const targetId = e.currentTarget.dataset.targetId;
    const that = this;

    wx.request({
      url: getApp().globalData.MyUrl + '/like/toggle',
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'token': app.globalData.token
      },
      data: {
        targetId: targetId,
        targetType: 'supper',
        userId: getApp().globalData.userId
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          const likeStates = { ...that.data.likeStates };
          likeStates[targetId] = !likeStates[targetId];
          that.setData({ likeStates });

          const likeCounts = { ...that.data.likeCounts };
          if (likeStates[targetId]) {
            likeCounts[targetId] = (likeCounts[targetId] || 0) + 1;
          } else {
            likeCounts[targetId] = Math.max(0, (likeCounts[targetId] || 0) - 1);
          }
          that.setData({ likeCounts });

          wx.showToast({
            title: likeStates[targetId] ? '点赞成功' : '取消点赞',
            icon: 'none'
          });
        } else {
          wx.showToast({
            title: '操作失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    });
  }
})