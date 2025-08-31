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
    buyLoading: false,
    // 评论相关数据
    showCommentModal: false,
    comments: [],
    commentCount: 0,
    commentContent: '',
    replyContent: '',
    showReplyId: null,
    userId: null,
  },
  onLoad(options) {
    const id = options.id;
    this.setData({ id });
    this.fetchSupplyDetail(id);
    this.loadUserId();
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
      url: getApp().globalData.MyUrl + `/selectByOpenidGetId/${app.globalData.openid || ''}`,
      method: 'POST',
      header: {
        'token': app.globalData.token
      },
      success(res) {
        if (res.data != null) {
          that.setData({
            userId: res.data
          });
          app.globalData.userId = res.data;
        } else {
          console.log('未获取到userId');
        }
      },
      fail() {
        console.error('获取userId失败');
      }
    });
  },

  // 显示/隐藏评论弹窗
  toggleCommentModal() {
    this.setData({
      showCommentModal: !this.data.showCommentModal
    });
    if (this.data.showCommentModal) {
      this.fetchComments();
    }
  },

  // 获取评论列表
  fetchComments() {
    const { id } = this.data;
    if (!id) return;

    wx.request({
      url: 'http://localhost:8082/comment/list',
      method: 'GET',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
        'token': app.globalData.token
      },
      data: {
        targetId: id,
        targetType: 'supper'
      },
      success: (res) => {
        console.log('评论数据:', res);
        if (res.statusCode === 200 && res.data.code === 200) {
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

  // 格式化评论数据
  formatComments(comments) {
    const commentMap = new Map();
    const avatarBaseUrl = getApp().globalData.NodeUrl;
    
    comments.forEach(comment => {
      comment.replies = [];
      comment.level = 0;
      comment.userName = comment.userName || '匿名用户';
      
      // 处理头像URL
      if (comment.userAvatar) {
        if (comment.userAvatar.startsWith('http://') || comment.userAvatar.startsWith('https://')) {
          // 已经是完整URL
        } else {
          comment.userAvatar = avatarBaseUrl + (comment.userAvatar.startsWith('/') ? '' : '/') + comment.userAvatar;
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
        comment.level = 1;
        level1Comments.push(comment);
      } else {
        const parentComment = commentMap.get(comment.parentId);
        if (parentComment) {
          comment.parentUserName = parentComment.userName;
          comment.level = parentComment.level + 1;
          
          if (comment.level > 2) {
            let ancestor = parentComment;
            while (ancestor && ancestor.level > 1) {
              ancestor = commentMap.get(ancestor.parentId);
            }
            if (ancestor) {
              ancestor.replies.push(comment);
            }
          } else {
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
    const { commentContent, id, userId } = this.data;

    if (!commentContent.trim()) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      });
      return;
    }

    if (!id) {
      wx.showToast({
        title: '商品ID不存在',
        icon: 'none'
      });
      return;
    }

    if (!userId) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    wx.request({
      url: 'http://localhost:8080/comment/add',
      method: 'POST',
      header: {
        'content-type': 'application/json',
        'token': app.globalData.token
      },
      data: {
        targetId: id,
        targetType: 'supper',
        userId: userId,
        content: commentContent.trim(),
        parentId: 0
      },
      success: (res) => {
        console.log('评论提交结果:', res);
        if (res.statusCode === 200 && res.data.code === 200) {
          wx.showToast({
            title: '评论成功',
            icon: 'success'
          });
          this.setData({
            commentContent: ''
          });
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
    const { replyContent, id, userId } = this.data;
    const parentId = e.currentTarget.dataset.id;

    if (!replyContent.trim()) {
      wx.showToast({
        title: '请输入回复内容',
        icon: 'none'
      });
      return;
    }

    if (!userId) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    wx.request({
      url: 'http://localhost:8080/comment/add',
      method: 'POST',
      header: {
        'content-type': 'application/json',
        'token': app.globalData.token
      },
      data: {
        targetId: id,
        targetType: 'supper',
        userId: userId,
        content: replyContent.trim(),
        parentId: parentId
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          wx.showToast({
            title: '回复成功',
            icon: 'success'
          });
          this.hideReplyBox();
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
            url: getApp().globalData.MyUrl + '/comment/delete',
            method: 'GET',
            header: {
              'content-type': 'application/x-www-form-urlencoded',
              'token': app.globalData.token
            },
            data: {
              id: commentId,
              userId: this.data.userId
            },
            success: (res) => {
              if (res.statusCode === 200 && res.data.code === 200) {
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
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

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止事件冒泡
  }
}); 