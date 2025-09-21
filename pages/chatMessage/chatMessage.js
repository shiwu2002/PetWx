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
    aiDisabled: false, // AI回复冷却
    targetName: '客服', // 对方名称
    targetAvatar: '/components/IMAGES/Customer.png', // 客服头像资源
    isOnline: false, // 对方是否在线
    showDateDivider: false, // 是否显示日期分隔符
    todayDate: '', // 今天的日期
    showOptions: false, // 是否显示聊天选项
    userInfo: {}, // 当前用户信息
    showEmojiPanel: false, // 是否显示表情面板
    emojiList: ['😀', '😂', '😍', '😎', '👍', '👏', '❤️', '🎉', '🤔', '😢', '😡', '😱', '😴', '🤩', '🥳', '😭', '😤', '🤗', '🥰', '😇', '🥳', '🥺', '🤓', '😜', '🤪', '😋', '🤓', '🤑', '🤠', '😷', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾']
  },
  onLoad(options) {
    // 假设 userId/targetId 通过 options 或全局获取
    const userId = wx.getStorageSync('userId') || getApp().globalData.openid || '1001';
    const targetId = options.targetId || '2001'; // 例如客服id
    this.setData({ 
      userId, 
      targetId,
      todayDate: this.formatDate(new Date())
    });

    // 获取用户信息
    const userInfo = wx.getStorageSync('userInfo') || getApp().globalData.userInfo || {};
    // 如果全局数据中没有用户信息，尝试从全局变量中获取
    if (!userInfo.avatarUrl) {
      // 优先从本地存储获取用户头像
      const storedAvatar = wx.getStorageSync('userAvatar');
      if (storedAvatar) {
        userInfo.avatarUrl = storedAvatar;
      } else if (getApp().globalData.nickName) {
        userInfo.nickName = getApp().globalData.nickName;
        userInfo.avatarUrl = '/components/IMAGES/1293.jpg_wh860.jpg'; // 默认头像
      }
    }
    this.setData({ userInfo });

    // 建立 WebSocket 连接
    connect(userId, (msg) => {
      // 只处理当前会话消息
      if (
        (msg.sender == targetId && msg.receiver == userId) ||
        (msg.sender == userId && msg.receiver == targetId)
      ) {
        // 格式化时间戳
        msg.timeStr = formatTime(msg.timestamp);
        
        // 更新我发送的消息状态为已送达
        if (msg.sender == targetId && msg.receiver == userId) {
          msg.status = 'delivered';
          this.updateMessageStatus(msg);
          
          // 模拟已读状态（3秒后）
          setTimeout(() => {
            this.markMessageAsRead(msg.timestamp);
          }, 3000);
        }
        
        this.setData({
          messages: [...this.data.messages, msg],
          toView: 'msg-' + (msg.timestamp || Date.now())
        });
      }
    });
  },
  // 更新消息状态
  updateMessageStatus(msg) {
    const updatedMessages = this.data.messages.map(item => {
      if (item.timestamp === msg.timestamp && item.sender === this.data.userId) {
        return { ...item, status: msg.status || 'delivered' };
      }
      return item;
    });
    this.setData({ messages: updatedMessages });
  },
  // 格式化日期
  formatDate(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
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
      status: 'sending' // 初始状态为发送中
    };
    // 本地先显示
    this.setData({
      messages: [...this.data.messages, msg],
      inputValue: '',
      toView: 'msg-' + ts
    });

    // 判断客服是否在线
    const online = await checkKefuOnline();
    this.setData({ isOnline: online });
    
    if (online) {
      sendMessage(msg);
      // 更新消息状态为已发送
      const updatedMessages = this.data.messages.map(item => {
        if (item.timestamp === ts) {
          return { ...item, status: 'sent' };
        }
        return item;
      });
      this.setData({ messages: updatedMessages });
    } else {
      // 更新消息状态为已发送（AI消息）
      const updatedMessages = this.data.messages.map(item => {
        if (item.timestamp === ts) {
          return { ...item, status: 'sent' };
        }
        return item;
      });
      this.setData({ messages: updatedMessages });
      
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
          status: 'sent'
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
        // 发送失败，更新状态
        const updatedMessages = this.data.messages.map(item => {
          if (item.timestamp === ts) {
            return { ...item, status: 'failed' };
          }
          return item;
        });
        this.setData({ messages: updatedMessages });
        
        wx.showToast({ title: 'AI客服接口异常', icon: 'none' });
        this.setData({ aiDisabled: false });
      }
    }
  },
  // 显示聊天选项
  showChatOptions() {
    this.setData({ showOptions: true });
  },
  // 隐藏聊天选项
  hideChatOptions() {
    this.setData({ showOptions: false });
  },
  // 阻止事件冒泡
  stopPropagation(e) {
    // 空函数，用于阻止事件冒泡
  },
  // 清空聊天记录
  clearChat() {
    this.setData({ 
      messages: [],
      showOptions: false
    });
    wx.showToast({ title: '聊天记录已清空', icon: 'none' });
  },
  // 屏蔽用户
  blockUser() {
    this.setData({ showOptions: false });
    wx.showToast({ title: '已屏蔽该用户', icon: 'none' });
  },
  // 举报用户
  reportUser() {
    this.setData({ showOptions: false });
    wx.showToast({ title: '已举报该用户', icon: 'none' });
  },
  // 显示表情
  showEmoji() {
    wx.showToast({ title: '表情功能开发中', icon: 'none' });
  },
  // 显示/隐藏表情面板
  toggleEmojiPanel() {
    this.setData({ 
      showEmojiPanel: !this.data.showEmojiPanel,
      showOptions: false // 关闭其他面板
    });
  },
  // 选择表情
  selectEmoji(e) {
    const emoji = e.currentTarget.dataset.emoji;
    const currentValue = this.data.inputValue || '';
    this.setData({
      inputValue: currentValue + emoji,
      showEmojiPanel: false // 选择后关闭面板
    });
  },
  // 显示更多功能
  showMore() {
    wx.showToast({ title: '更多功能开发中', icon: 'none' });
  },
  // 标记消息为已读
  markMessageAsRead(timestamp) {
    const updatedMessages = this.data.messages.map(item => {
      if (item.timestamp === timestamp && item.status === 'delivered') {
        return { ...item, status: 'read' };
      }
      return item;
    });
    this.setData({ messages: updatedMessages });
  }
});