import { connect, sendMessage, disconnect } from '../../utils/webSocket.js';


const tokenMy = getApp().globalData.token;
function formatTime(ts) {
  if (!ts) return '';
  const date = new Date(ts);
  const pad = n => n < 10 ? '0' + n : n;
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// 新增：判断客服是否在线
function checkKefuOnline() {
  return new Promise((resolve) => {
    wx.request({
      url: getApp().globalData.MyUrl + '/GetIsBeOnline',
      method: 'GET',
      header: {
        token: tokenMy
      },
      success: (res) => {
          console.log(res)
        resolve(res.data.data === true);
      },
      fail: () => resolve(false)
    });
  });
}

// 新增：调用AI客服接口
function callAI(message, sessionId) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: getApp().globalData.MyUrl +`/aiCustomerService/chat`,
      method: 'GET',
      header: {
        token: tokenMy
      },
      data: { message, sessionId },
      success: (res) => resolve(res.data),
      fail: reject
    });
  });
}

// 清除AI记忆
function clearAISession(sessionId) {
  return new Promise((resolve) => {
    wx.request({
      url: getApp().globalData.MyUrl +`/aiCustomerService/clearMemory/${sessionId}`,
      method: 'GET',
      header: {
        token: tokenMy
      },
      success: () => resolve(),
      fail: () => resolve()
    });
  });
}

Page({
  data: {
    userId: '', // 当前用户id
    targetId: '', // 对方用户id（如客服id）
    inputValue: '',
    messages: [], // 当前会话消息
    toView: '', // 用于自动滚动到底部
    aiDisabled: false // AI回复冷却
  },
  onLoad(options) {
    // 假设 userId/targetId 通过 options 或全局获取
    const userId = wx.getStorageSync('userId') || getApp().globalData.openid || '1001';
    const targetId = options.targetId || '2001'; // 例如客服id
    this.setData({ userId, targetId });

    // 建立 WebSocket 连接
    connect(userId, (msg) => {
      // 只处理当前会话消息
      if (
        (msg.sender == targetId && msg.receiver == userId) ||
        (msg.sender == userId && msg.receiver == targetId)
      ) {
        // 格式化时间戳
        msg.timeStr = formatTime(msg.timestamp);
        this.setData({
          messages: [...this.data.messages, msg],
          toView: 'msg-' + (msg.timestamp || Date.now())
        });
      }
    });
  },
  onUnload() {
    disconnect(this.data.userId);
    // 离开页面时清除AI记忆
    const userId = this.data.userId;
    const sessionId = userId + '_' + getApp().globalData.openid;
    clearAISession(sessionId);
  },
  onHide() {
    // 离开页面时清除AI记忆
    const userId = this.data.userId;
    const sessionId = userId + '_' + getApp().globalData.openid;
    clearAISession(sessionId);
  },
  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },
  async sendMsg() {
    if (this.data.aiDisabled) {
      wx.showToast({ title: 'AI客服冷却中，请稍后再试', icon: 'none' });
      return;
    }
    const { userId, targetId, inputValue } = this.data;
    if (!inputValue.trim()) return;
    let senderName = '';
    try {
      senderName = getApp().globalData.nickName || wx.getStorageSync('userInfo')?.nickName || '';
    } catch (e) {}
    const ts = Date.now();
    const msg = {
      sender: userId,
      receiver: targetId,
      content: inputValue,
      senderName: senderName,
      timestamp: ts,
    };
    // 本地先显示
    this.setData({
      messages: [...this.data.messages, msg],
      inputValue: '',
      toView: 'msg-' + ts
    });

    // 判断客服是否在线
    const online = await checkKefuOnline();
    if (online) {
      sendMessage(msg);
    } else {
      // 生成会话id（可用userId+sessionId或其它规则）
      const sessionId = userId + '_' + getApp().globalData.openid;
      try {
        this.setData({ aiDisabled: true });
        const aiRes = await callAI(inputValue, sessionId);
        // AI回复内容在 aiRes.data.response
        const aiMsg = {
          sender: targetId,
          receiver: userId,
          content: aiRes && aiRes.data && aiRes.data.response ? aiRes.data.response : 'AI未回复',
          senderName: 'AI客服',
          timestamp: Date.now(),
        };
        this.setData({
          messages: [...this.data.messages, aiMsg],
          toView: 'msg-' + aiMsg.timestamp
        });
        // 3秒后解除AI冷却
        setTimeout(() => {
          this.setData({ aiDisabled: false });
        }, 3000);
      } catch (e) {
        wx.showToast({ title: 'AI客服接口异常', icon: 'none' });
        this.setData({ aiDisabled: false });
      }
    }
  }
});
