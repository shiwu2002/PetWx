const app = getApp();
const util = require('../../utils/util.js');

Page({
  data: {
    id: null,
    supply: null,
    loading: false,
    error: false,
    showBuyPopup: false,
    buyNum: 1,
    buyLoading: false
  },
  onLoad(options) {
    const id = options.id;
    this.setData({ id });
    this.fetchSupplyDetail(id);
  },
  fetchSupplyDetail(id) {
    this.setData({ loading: true, error: false });
    wx.request({
      url: getApp().globalData.MyUrl +`/supplies/selectById/${id}`,
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'token':app.globalData.token
      },
      success: (res) => {
        // 检查返回的数据格式
        let supply = null;
        if (res.data) {
          // 如果返回的是包装在data字段中的对象
          if (res.data.data && res.data.data.id) {
            supply = res.data.data;
          } else if (res.data.id || res.data.productName) {
            // 直接返回商品对象
            supply = res.data;
          }
        }
        
        if (supply) {
          // 处理图片路径
          supply.imageUrl = supply.imageUrl ? getApp().globalData.MyUrl +`/photo${supply.imageUrl}` : '/components/IMAGES/1293.jpg_wh860.jpg';
          
          // 格式化时间字段
          if (supply.manufactureDate) {
            supply.manufactureDate = util.formatTime(new Date(supply.manufactureDate));
          }
          if (supply.expiryDate) {
            supply.expiryDate = util.formatTime(new Date(supply.expiryDate));
          }
          if (supply.createdAt) {
            supply.createdAt = util.formatTime(new Date(supply.createdAt));
          }
          if (supply.updatedAt) {
            supply.updatedAt = util.formatTime(new Date(supply.updatedAt));
          }
          this.setData({ supply, loading: false });
        } else {
          this.setData({ error: true, loading: false });
        }
      },
      fail: () => {
        this.setData({ error: true, loading: false });
      }
    });
  },
  // 立即购买按钮
  onBuyTap() {
    this.setData({ showBuyPopup: true, buyNum: 1 });
  },
  // 关闭购买弹窗
  onCloseBuyPopup() {
    this.setData({ showBuyPopup: false });
  },
  // 数量输入
  onBuyNumInput(e) {
    let value = parseInt(e.detail.value) || 1;
    if (value < 1) value = 1;
    if (value > this.data.supply.stockQuantity) value = this.data.supply.stockQuantity;
    this.setData({ buyNum: value });
  },
  // 确认购买
  onConfirmBuy() {
    const { buyNum, supply } = this.data;
    this.setData({ buyLoading: true });
    wx.request({
      url: getApp().globalData.MyUrl +'/supplies/updateMoneyBySupplies',
      method: 'POST',
      header: {
        'content-type': 'application/json',
        'token': app.globalData.token
      },
      data: {
        openid: app.globalData.openid,
        suppliesId: supply.id,
        suppliesMoney: supply.price * buyNum,
        suppliesNum: buyNum
      },
      success: (res) => {
        this.setData({ buyLoading: false, showBuyPopup: false });
        if (res.data && res.data.code === 200) {
          wx.showToast({ title: '购买成功', icon: 'success' });
        } else {
          wx.showToast({ title: res.data.message || '购买失败', icon: 'none' });
        }
      },
      fail: () => {
        this.setData({ buyLoading: false, showBuyPopup: false });
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  }
}); 