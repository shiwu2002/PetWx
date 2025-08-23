// pages/MyMain/MyMain.js
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
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
    selectedNav: 'profile', // 'profile' | 'myApply' | 'myDiscover'
    loading: false,
    error: '',
    applyData: [],
    applyDataPreviewUrls: [],
    myDiscoverData: [],
    myDiscoverPreviewUrls: [],
    // 侧边栏链表
    sideNavList: [
      { key: 'profile', label: '个人信息' },
      { key: 'myApply', label: '我的预约' },
      { key:'myDiscover',label:'救助信息'}
    ]
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
              avatarUrl = getApp().globalData.NodeUrl + '/photo' + avatarUrl;
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
                const MyUrl = app.globalData.MyUrl;
                const applyDataPreviewUrls = applyList.map(item => {
                  let previewUrl = item.petImage ? (MyUrl + '/photo' + item.petImage) : '/components/IMAGES/Discover.png';
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
                urls = JSON.parse(item.imageUrls);
              } catch (e) {}
              if (typeof urls === 'string') urls = [urls];
              imgArr = urls.map(url => {
                url = url.replace(/^"|"$/g, ''); // 去除首尾引号
                if (/^http/.test(url)) return url;
                return MyUrl + '/photo' + url;
              });
            }
            return imgArr;
          });
          this.setData({ myDiscoverData: list, myDiscoverPreviewUrls: previewUrls });
        } else {
          this.setData({ myDiscoverData: [], myDiscoverPreviewUrls: [] });
        }
      },
      fail: () => {
        this.setData({ myDiscoverData: [], myDiscoverPreviewUrls: [] });
      }
    });
  }
})