const app = getApp(); 
Page({
    data: {
      announcements: [],
      loading: true,
      error: false,
      todayCount: 0
    },
    onLoad() {
      this.loadAnnouncements();
    },
    loadAnnouncements() {
      // 显示加载提示
      this.setData({
        loading: true,
        error: false
      });
      
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
      
      wx.request({
        url: app.globalData.MyUrl +'/announcement/getAll',
        method: 'GET',
        header: {
            'content-type': 'application/json',
            'token': app.globalData.token
          },
        success: (res) => {
            console.log(res)
          wx.hideLoading();
          if (res.data && res.data.code === 200 && res.data.data) {
            // 格式化时间并存储数据
            const formattedData = res.data.data.map(item => ({
              ...item,
              publishTime: this.formatTime(item.publishTime)
            }));
            
            // 计算今日更新数量
            const today = new Date().toDateString();
            const todayCount = formattedData.filter(item => {
              const itemDate = new Date(item.publishTime).toDateString();
              return itemDate === today;
            }).length;
            
            this.setData({
              announcements: formattedData,
              loading: false,
              error: false,
              todayCount: todayCount
            });
            // 存储到全局数据，供详情页使用
            app.globalData.announcements = formattedData;
          } else {
            this.setData({ 
              error: true, 
              loading: false 
            });
            wx.showToast({
              title: '数据格式错误',
              icon: 'error'
            });
          }
        },
        fail: () => {
          wx.hideLoading();
          this.setData({ 
            error: true, 
            loading: false 
          });
          wx.showToast({
            title: '网络请求失败',
            icon: 'error'
          });
        }
      });
    },
    // 时间戳转换为YYYY-MM-DD HH:MM格式
    formatTime(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },
    // 跳转到详情页
    goToDetail(e) {
      const id = e.currentTarget.dataset.id;
      wx.navigateTo({
        url: `/pages/detail/detail?id=${id}`
      });
    },
    // 下拉刷新
    onPullDownRefresh() {
      this.loadAnnouncements().then(() => {
        wx.stopPullDownRefresh();
      }).catch(() => {
        wx.stopPullDownRefresh();
      });
    }
  });