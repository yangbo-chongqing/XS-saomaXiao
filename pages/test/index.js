//index.js
//获取应用实例
const config = require('../../config.js');
const md5 = require('../../utils/md5.js');
const app = getApp();
const recorderManager = wx.getRecorderManager();
const innerAudioContext = wx.createInnerAudioContext();
Page({
  data: {
    motto: '寻声',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    recordingTimeqwe:0,
    miuse_state:1,
    miuse_url:'',
    setInter:"",//录音名称
    strat:false,
    tempFilePath:{},
    q_url:'',
    share_title:"录音测试",
    share_url:"",
    share_image:"http://resource.xunsheng.org.cn/20190727175250-task-cover-283.JPG",
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function (options) {
    var parent_id = options.parent_id;
    if(parent_id){
       wx.setStorageSync('parent_id',parent_id);
    }
    var token = wx.getStorageSync("token");
    if(!token){ // 用户未登录 则跳转到授权登录
      wx.redirectTo({
        url: '../login/login?type=index'
      })
    }else{
        // 获取用户信息
      this.getMembers();
    }
  },
  getUserInfo: function(e) {
    app.globalData.userInfo = e.detail.userInfo;
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  // 获取用户信息
  getMembers:function(){
    console.log(123);
    var that = this;
    var ts = Date.parse(new Date());
    var data = {
      member_id: wx.getStorageSync("member_id"),
      token: wx.getStorageSync("token"),
      ts:ts
    };
    var cs = app.encryption(data);
    data.cs = cs;
    wx.request({
      url: config.URL + "/member/member/index",
      data: data,
      method: 'post',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      success: function (res) {
        console.log(res);
        if(res.data.code == 200){
          var user = {};
          user.nickName = res.data.data.name;
          user.avatarUrl = res.data.data.avatar;
          that.setData({//存值
            userInfo:user,
            hasUserInfo:true
          })
        } else if (res.data.msg == "用户认证不通过"){
          console.log(111);
          wx.setStorageSync('member_id', '');
          wx.setStorageSync('token', '');
          wx.redirectTo({
            url: '../login/login?type=index'
          })
        }
      }
    })
  },
  //开始录音
  openRecording: function() {
    var that = this;
    const options = {
      duration: 600000,//指定录音的时长，单位 ms
      sampleRate: 44100,//采样率
      numberOfChannels: 2,//录音通道数
      encodeBitRate: 84000,//编码码率
      format: 'mp3',//音频格式，有效值 aac/mp3
      frameSize: 64,//指定帧大小，单位 KB
    };
    //开始录音
    recorderManager.start(options);
    recorderManager.onStart(() => {
      //开始录音计时
      that.recordingTimer();
      that.setData({//存值
        miuse_state:2,
        strat:true
      })
      wx.showToast({
        title: '开始录音',
        icon: 'none',
        duration: 1500,
      });
    });
    //错误回调
    recorderManager.onError((res) => {
      console.log(res);
      wx.showToast({
        title: '没有权限',
        icon: 'none',
        duration: 1500,
      })
    })
  },
  //录音计时器
  recordingTimer:function(){
    var that = this;
    //将计时器赋值给setInter
    that.data.setInter = setInterval(
        function () {
          if(that.data.strat){
            var time = that.data.recordingTimeqwe + 1;
            that.setData({
              recordingTimeqwe: time
            })
          }
        }
        , 1000);
  },
  //结束录音
  shutRecording: function() {
    var that = this;
    wx.showToast({
      title: '停止录音',
      icon: 'none',
      duration: 1500,
    })
    recorderManager.stop();
    recorderManager.onStop((res) => {
      this.tempFilePath = res.tempFilePath;
      that.setData({//存值
        miuse_url:res.tempFilePath,
        strat:false,
        miuse_state:4,
        tempFilePath:res
      })
    })
  },
  //录音播放
  recordingAndPlaying: function(eve) {
    wx.showToast({
      title: '开始播放',
      icon: 'none',
      duration: 1500,
    })
    innerAudioContext.autoplay = true
    innerAudioContext.src = this.tempFilePath,
        innerAudioContext.onPlay(() => {
          console.log('开始播放')
        });
    innerAudioContext.onError((res) => {
      console.log(res.errMsg);
      console.log(res.errCode);
    })
  },
  //录音暂停
  suspendRecording: function(eve) {
    var that = this;
    recorderManager.pause();
    recorderManager.onPause((res) => {
        that.setData({//存值
          miuse_state:3,
          strat:false
        })
        wx.showToast({
          title: '暂停录制',
          icon: 'none',
          duration: 1500,
        })
      
    })
  },
  //录音继续
  continueRecording: function(eve) {
    var that = this;
    recorderManager.resume();
    recorderManager.onResume((res) => {
      wx.showToast({
        title: '继续录制',
        icon: 'none',
        duration: 1500,
      })
      that.setData({//存值
        miuse_state:2,
        strat:true
      })
    })
  },
  // 重置录音
  reset:function(){
    var that = this;
    that.setData({//存值
      miuse_state:1,
      recordingTimeqwe:0
    })
  },
  // 获取七牛云参数
  get_qiniu_info:function(){
    var that = this;
    var ts = Date.parse(new Date());
    var data = {
      member_id: wx.getStorageSync("member_id"),
      token: wx.getStorageSync("token"),
      device_id:9999,
      suffix:"MP3",
      ts:ts
    };
    var cs = app.encryption(data);
    data.cs = cs;
    wx.request({
      url: config.URL + "/voice/qiniu/uploadtoken",
      data: data,
      method: 'post',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      success: function (res) {
        console.log(res);
        if(res.data.code == 200){
          console.log(that.data.miuse_url);
            //上传录音
            wx.uploadFile({
              url: config.QIUNIU_URL,//这是你自己后台的连接
              filePath: that.data.miuse_url,
              name:"file",//后台要绑定的名称
              header: {
                "Content-Type": "multipart/form-data"
              },
              //参数绑定
              formData:{
                token: res.data.data.upToken,
                fileName: res.data.data.key,
              },
              dataType:'JSON',
              success:function(ress){
                wx.showToast({
                  title: '保存完成',
                  icon:'success',
                  duration:2000
                })
                var data = JSON.parse(ress.data);
                console.log(ress);
                that.setData({//存值
                  q_url:data.key,
                })
              },
              fail: function(ress){
                console.log("。。录音保存失败。。");
              }
            })
        }
      }
    })
  },
 
  //跳转个人中心
  jump(e){
    var url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: url,
    })
  },
  onShareAppMessage: function(res) {
    return {
      title: this.data.share_title,
      imageUrl: this.data.share_image,
      path: '/pages/index/index?parent_id='+wx.getStorageSync("member_id"),
      success: function(res) {
        // 转发成功
      },
      fail: function(res) {
        // 转发失败
      }
    }
  },
  
});
