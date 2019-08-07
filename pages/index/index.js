//index.js
//获取应用实例
const config = require('../../config.js');
const md5 = require('../../utils/md5.js');
const app = getApp();
Page({
  data: {
    tab_index:2,
    class_id:0,
    work_list:[],
    share_title:"寻声朗读",
    share_url:"",
    share_image:"http://resource.xunsheng.org.cn/20190727175250-task-cover-283.JPG",
    banner_img:'',
  },
  onLoad: function (options) {
      var token = wx.getStorageSync("token");
      var member_id = wx.getStorageSync("member_id");

      if(options.parent_id){ // 上级信息
          var parent_id = options.parent_id;
          wx.setStorageSync('parent_id',parent_id);
      }


      var class_id = options.class_id;
      if (!class_id) {
        class_id = wx.getStorageSync("class_id");
      }
      wx.setStorageSync('class_id', class_id);
      this.setData({
        class_id:class_id
      });
      if(!token){
          wx.redirectTo({
              url: '../login/login?type=index'
          })
      }else{
          this.getClassInfo();
          this.getMembers();
    
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
          member_id: wx.getStorageSync("member_id"),
          token: wx.getStorageSync("token"),
          // member_id : 283,
          // token:'2fc9c9ace50b382d6f57676d05a7306c',
          class_id: that.data.class_id,
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
                var list = res.data.data;
                for (var i = 0; i < list.length;i++){
                    list[i].duration = app.formatSeconds(list[i].duration);
                }
                that.setData({//存值
                    work_list: list,
                });
                app.hide_l(that);
            }
          }
      })
  },
  onShareAppMessage: function(res) {
    var share_url = "/pages/work_list/work_list?&parent_id="+wx.getStorageSync("member_id");
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
  //查询班级详情
  getClassInfo(){
    
    var that = this;
    var ts = Date.parse(new Date());
    var data = {
      member_id: wx.getStorageSync("member_id"),
      token: wx.getStorageSync("token"),
      class_id: that.data.class_id,
      ts: ts
    };
    var cs = app.encryption(data);
    data.cs = cs;
    app.show_l(that);
    wx.request({
      url: config.URL + "fa/Xspaycomment/get_member_class",
      data: data,
      method: 'post',
      header: { "Content-Type": "application/x-www-form-urlencoded" },
      success: function (res) {
        if (res.data.code == 200) {
          var class_id = res.data.data.class_id;
          var banner_img = res.data.data.class_info.head_img;
        
          that.setData({//存值
            class_id: class_id,
            banner_img: banner_img
          });
          that.getHomeWork();
        }
      }
    })
  }
});
