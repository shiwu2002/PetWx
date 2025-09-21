const IosUrl = "http://192.168.0.4:8082"
const WindowsUrl = "http://localhost:8082"

App({
    onLaunch() {
      // 展示本地存储能力
      const logs = wx.getStorageSync('logs') || []
      logs.unshift(Date.now())
      wx.setStorageSync('logs', logs)
  
      // 登录
      wx.login({
        success: res => {
          // 发送 res.code 到后台换取 openId, sessionKey, unionId
          wx.request({
            url: this.globalData.MyUrl+'/wxapi/wxLogin',
            data:{
                code:res.code
            },header: {
              'content-type': 'application/json' // ✨ 关键修复：强制声明JSON格式[1,6](@ref)
            },
            success:res=>{
                console.log(res)
                if(res.data.code==200){

                    //存储openid到全局变量，当然也可以同时存储到作用域中
                  this.globalData.openid = res.data.data.wxLoginDto.openid
                  this.globalData.session_key = res.data.data.wxLoginDto.session_key

                  wx.setStorageSync('openid', res.data.data.openid)
                  this.globalData.token = res.data.data.token
                  if(this.globalData.token != null&&this.globalData.openid != null){
                    wx.request({
                        url: getApp().globalData.MyUrl +`/selectByOpenidGetId/${this.globalData.openid}`,
                        method: 'POST',
                        header: {
                          'content-type': 'application/json',
                          'token': this.globalData.token
                        },
                        success: (res) => {
                          console.log(res)
                          this.globalData.userId = res.data
                        }
                      });
                  }
                  console.log(res.data.data.token)

                }
  
            }
          })
      
      }
      })
    },
    globalData: {
      userInfo: null,
      userInfo: null,
      url: 'http://localhost:8082', //请求的url
      openid: '',
      session_key: '',
      token: '',
      announcements: [],
      nickName:'',
      MyUrl: WindowsUrl,
      NodeUrl:'http://localhost:8080/photo',
      userId:''
    }
  })
  