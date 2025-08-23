Page({
    data: {
      announcement: null,
      loading: true,
      error: false
    },
  
    onLoad(options) {
      const id = options.id;
      this.loadAnnouncementDetail(id);
    },
  
    // 加载公告详情
    loadAnnouncementDetail(id) {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
  
      // 从全局数据获取公告详情
      const app = getApp();
      const announcement = app.globalData.announcements 
        ? app.globalData.announcements.find(item => item.id == id)
        : null;
  
      if (announcement) {
        this.setData({
          announcement,
          loading: false,
          error: false
        });
        wx.hideLoading();
        // 设置导航栏标题
        wx.setNavigationBarTitle({
          title: announcement.title
        });
      } else {
        // 如果全局数据中没有找到，尝试重新请求列表数据
        this.reloadAnnouncements(id);
      }
    },
  
    // 重新请求公告列表数据
    reloadAnnouncements(id) {
      wx.request({
        url: getApp().globalData.MyUrl +'/announcement/getAll',
        method: 'GET',
        success: (res) => {
          wx.hideLoading();
          if (res.data && res.data.code === 200 && res.data.data) {
            const formattedData = res.data.data.map(item => ({
              ...item,
              publishTime: this.formatTime(item.publishTime)
            }));
            getApp().globalData.announcements = formattedData;
            
            const announcement = formattedData.find(item => item.id == id);
            if (announcement) {
              this.setData({
                announcement,
                loading: false,
                error: false
              });
              wx.setNavigationBarTitle({
                title: announcement.title
              });
            } else {
              this.setData({ error: true, loading: false });
              wx.showToast({ title: '未找到该公告', icon: 'error' });
            }
          } else {
            this.setData({ error: true, loading: false });
            wx.showToast({ title: '数据格式错误', icon: 'error' });
          }
        },
        fail: () => {
          wx.hideLoading();
          this.setData({ error: true, loading: false });
          wx.showToast({ title: '网络请求失败', icon: 'error' });
        }
      });
    },
  
    // 时间格式化
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
  
    // 返回上一页
    onBackTap() {
      wx.navigateBack();
    }
  });