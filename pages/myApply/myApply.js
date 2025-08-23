const app = getApp();

Page({
  data: {
    animalType: '',
    location: '',
    description: '',
    imageUrlsList: [], // 已上传图片URL
    imagePreviewUrls: [], // 已上传图片预览URL
    uploading: false,
    submitLoading: false
  },

  // 选择/拍摄图片
  chooseImage() {
    wx.chooseImage({
      count: 3,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFiles = res.tempFilePaths;
        this.uploadImages(tempFiles);
      }
    });
  },

  // 上传图片到服务器
  uploadImages(tempFiles) {
    this.setData({ uploading: true });
    const uploadPromises = tempFiles.map(filePath => {
      return new Promise((resolve, reject) => {
        wx.uploadFile({
          url: app.globalData.MyUrl + '/upload/profile',
          filePath,
          name: 'file',
          header: {
            'token': app.globalData.token
          },
          success: (res) => {
            let data = {};
            try {
              data = JSON.parse(res.data);
            } catch (e) {}
            const url = data.filePath || data.data;
            // 只保存相对路径
            if (url) {
              resolve(url);
            } else {
              reject('上传失败');
            }
          },
          fail: () => reject('上传失败')
        });
      });
    });
    Promise.all(uploadPromises)
      .then(urls => {
        const newImageUrlsList = this.data.imageUrlsList.concat(urls);
        // 拼接完整URL用于预览
        const imagePreviewUrls = newImageUrlsList.map(item => app.globalData.MyUrl + '/photo' + item);
        this.setData({
          imageUrlsList: newImageUrlsList,
          imagePreviewUrls,
          uploading: false
        });
      })
      .catch(() => {
        wx.showToast({ title: '图片上传失败', icon: 'none' });
        this.setData({ uploading: false });
      });
  },

  // 删除已选图片
  removeImage(e) {
    const idx = e.currentTarget.dataset.idx;
    const arr = this.data.imageUrlsList.slice();
    arr.splice(idx, 1);
    // 同步预览数组
    const previewArr = arr.map(item => app.globalData.MyUrl + '/photo' + item);
    this.setData({ imageUrlsList: arr, imagePreviewUrls: previewArr });
  },

  // 表单输入
  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [field]: e.detail.value });
  },

  // 提交表单
  submit() {
    const { animalType, location, description, imageUrlsList } = this.data;
    if (!animalType || !location || !description || imageUrlsList.length === 0) {
      wx.showToast({ title: '请填写完整信息并上传图片', icon: 'none' });
      return;
    }
    console.log(animalType, location, description, imageUrlsList)
    this.setData({ submitLoading: true });
    const userId = app.globalData.userId;
    console.log(userId)
    wx.request({
      url: 'http://localhost:8082/discover/submit',
      method: 'POST',
      header:{
        token : getApp().globalData.token
    },
      data: {
        userId,
        animalType,
        location,
        description,
        imageUrls: imageUrlsList.join(','),
        status: '待处理',
        createTime: '',
        imageUrlsList
      },
      success: (res) => {
          console.log(res.data)
        if (res.data && res.data.code === 200) {
          wx.showToast({ title: '提交成功', icon: 'success' });
          this.setData({
            animalType: '',
            location: '',
            description: '',
            imageUrlsList: []
          });
        } else {
          wx.showToast({ title: res.data.message || '提交失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '提交失败', icon: 'none' });
      },
      complete: () => {
        this.setData({ submitLoading: false });
      }
    });
  }
});
