//index.js
//获取应用实例
const config = require('../../config.js');
const md5 = require('../../utils/md5.js');
const app = getApp();
Page({
  data: {
    page:1,
    page_size:10,
    works_list :[],
    sum: 0,
    works_count: 0,
    max_info: [],
  },
  onLoad: function (options) {
      var token = wx.getStorageSync("token");
      var member_id = wx.getStorageSync("member_id");
      if (!token) { // 用户未登录 则跳转到授权登录
          wx.redirectTo({
              url: '../login/login?type=my_works'
          })
      } else {
          this.lists();
      }
  },
  // 我的作品列表
  lists:function(){
      var that = this;
      var ts = Date.parse(new Date());
      var data = {
          member_id: wx.getStorageSync("member_id"),
          token: wx.getStorageSync("token"),
          page: that.data.page,
          page_size: that.data.page_size,
          class_id: wx.getStorageSync("class_id"),
          need_comment:true,
          ts: ts
      };
      var cs = app.encryption(data);
      data.cs = cs;
      app.show_l(that);
      wx.request({
          url: config.URL + "fa/Xspaycomment/get_my_class_work",
          data: data,
          method: 'get',
          header: {
            'content-type': 'application/x-www-form-urlencoded',
          },
          success: function (res) {
              app.hide_l(that);
              if (res.data.code == 200) {
                   that.setData({
                      works_list: res.data.data.list,
                      sum: res.data.data.sum,
                      works_count: res.data.data.works_count,
                      max_info: res.data.data.max_info,
                  });
              }
          }
      })
  },
  //跳转个人中心
  jump(e) {
      var url = e.currentTarget.dataset.url;
      wx.navigateTo({
          url: url,
      })
  },
});
