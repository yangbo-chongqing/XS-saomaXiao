//index.js
//获取应用实例
const config = require('../../config.js');
const md5 = require('../../utils/md5.js');
const app = getApp();
Page({
  data: {
    tab_index:2,
    work_list:[],
    share_title:"寻声朗读",
    share_url:"",
    share_image:"http://resource.xunsheng.org.cn/20190727175250-task-cover-283.JPG",
  },
  onLoad: function (options) {
      var token = wx.getStorageSync("token");
      var member_id = wx.getStorageSync("member_id");
      if(options.parent_id){ // 上级信息
          var parent_id = options.parent_id;
          wx.setStorageSync('parent_id',parent_id);
      }
      if(!token){
          wx.redirectTo({
              url: '../login/login?type=work_list'
          })
      }else{
          this.getMembers();
          this.getHomeWork();
    
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
      }
    })
  },
  getHomeWork:function(){
      var that = this;
      var ts = Date.parse(new Date());
      var data = {
          member_id: 283,
          token: "2fc9c9ace50b382d6f57676d05a7306c",
          class_id: 9698,
          page:1,
          page_size:15,
          ts:ts
      };
      var cs = app.encryption(data);
      data.cs = cs;
      wx.request({
          url: config.URL + "school/course/homeworklistv2",
          data: data,
          method: 'post',
          header: { "Content-Type": "application/x-www-form-urlencoded" },
          success: function (res) {
            if(res.data.code == 200){
                that.setData({//存值
                    work_list:res.data.data,
                })
            }
          }
      })
  },
  onShareAppMessage: function(res) {

    var share_url = "/pages/work_list/work_list?&parent_id="+wx.getStorageSync("member_id");
    console.log(share_url);
    return {
      title: this.data.share_title,
      imageUrl: this.data.share_image,
      path: share_url,
      success: function(res) {
        // 转发成功
      },
      fail: function(res) {
        // 转发失败
      }
    }
  },
  //跳转个人中心
  jump(e) {
    var url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: url,
    })
  },
});
