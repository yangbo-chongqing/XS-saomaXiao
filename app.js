//app.js
var config = require('config.js');
var md5 = require('utils/md5.js');

App({
  data:{
    loading:false
  },
  onLaunch: function () {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },
  
  globalData: {
    userInfo: null
  },
  encryption(data){
    var code = "";
    for(let key  in data){
      if(!code){
        code += key+"="+data[key];
      }else{
        code += "&"+key+"="+data[key];
      }
    }
    return md5.hexMD5(code);
  },
  show_l(e){
    wx.showLoading({
      title: '请稍后...',
    });
    e.setData({
      loading: true
    })
  },
  hide_l(e) {
    wx.hideLoading();
    e.setData({
      loading: false
    })
  },
  formatSeconds(time){
    var theTime = parseInt(time);// 秒
    var theTime1 = 0;// 分
    var theTime2 = 0;// 小时
    if (theTime > 60) {
      theTime1 = parseInt(theTime / 60);
      theTime = parseInt(theTime % 60);
      if (theTime1 > 60) {
        theTime2 = parseInt(theTime1 / 60);
        theTime1 = parseInt(theTime1 % 60);
      }
    }
    var result = "" + parseInt(theTime) + "秒";
    if (theTime1 > 0) {
      result = "" + parseInt(theTime1) + "分" + result;
    }
    if (theTime2 > 0) {
      result = "" + parseInt(theTime2) + "小时" + result;
    }
    return result;
  },
  timeToFormat: function (times) {
    var result = '00:00:00';
    var hour, minute, second
    if (times > 0) {
      hour = Math.floor(times / 3600);
      if (hour < 10) {
        hour = "0" + hour;
      }
      minute = Math.floor((times - 3600 * hour) / 60);
      if (minute < 10) {
        minute = "0" + minute;
      }

      second = Math.floor((times - 3600 * hour - 60 * minute) % 60);
      if (second < 10) {
        second = "0" + second;
      }
      result = minute + ':' + second;
    }
    return result;
  },
});