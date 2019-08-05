//index.js
//获取应用实例
const config = require('../../config.js');
const md5 = require('../../utils/md5.js');
const app = getApp();
Page({
  data: {
    motto: '寻声',
    link: "",
    share_title:"个人中心",
    share_url:"",
    share_image:"http://resource.xunsheng.org.cn/20190727175250-task-cover-283.JPG",
  },
  onLoad: function (options) {
    var token = wx.getStorageSync("token");
    var member_id = wx.getStorageSync("member_id");
    var parent_id = options.parent_id;
    if(parent_id){
       wx.setStorageSync('parent_id',parent_id);
    }
    if(!token){ // 用户未登录 则跳转到授权登录
      wx.redirectTo({
        url: '../login/login?type=user'
      })
    }else{
      // 获取用户信息
      //this.getMembers();
      var url = "http://test.xunsheng.org.cn/apph5/#/SsWorksDetail?mid=6003&tk=8033ce1629cfdbc5afa35d6db8ed8042&works_id=188465";
      this.setData({
        link: config.SITE_URL+'/apph5/#/UserLevel?mid='+member_id
      })
    }
  },
  getUserInfo: function(e) {
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  // 获取用户信息
  getMembers:function(){
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
        if(res.data.code == 200){
          var user = {};
          user.nickName = res.data.data.name;
          user.avatarUrl = res.data.data.avatar;
          that.setData({//存值
            userInfo:user,
            hasUserInfo:true
          })
        }
      }
    })
  },
  onShareAppMessage: function(res) {
    return {
      title: this.data.share_title,
      imageUrl: this.data.share_image,
      path: '/pages/user/user?parent_id='+wx.getStorageSync("member_id"),
      success: function(res) {
        // 转发成功
      },
      fail: function(res) {
        // 转发失败
      }
    }
  },
});
