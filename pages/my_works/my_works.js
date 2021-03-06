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
    hasMore:true, //是否有更多数据
    select: false,
    tihuoWay: '杉树伴读模拟板',
    class_list:[],
    c_list: [],
    cinfo_list: [],
    class_name:''
  },
  onLoad: function (options) {
      var token = wx.getStorageSync("token");
      var member_id = wx.getStorageSync("member_id");
      var class_id = wx.getStorageSync("class_id");
      var class_name = wx.getStorageSync("my_works_class_name");
      if (!token) { // 用户未登录 则跳转到授权登录
          wx.redirectTo({
              url: '../login/login?type=my_works'
          })
      } else {
        this.setData({
          class_id: class_id,
          class_name:class_name,
          tihuoWay: "当前班级："+class_name,
        });
        this.lists();
        // 查询我的班级
        this.my_class_list();
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
          class_id: this.data.class_id,
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
                   if (that.data.page == 1){
                      that.setData({
                          works_list: res.data.data.list,
                          sum: res.data.data.sum,
                          works_count: res.data.data.works_count,
                          max_info: res.data.data.max_info,
                      });
                   }else{
                      that.setData({
                          works_list: that.data.works_list.concat(res.data.data.list),
                          sum: res.data.data.sum,
                          works_count: res.data.data.works_count,
                          max_info: res.data.data.max_info,
                      });
                   }
                
                  if(res.data.data.list.length<that.data.page_size){
                      that.setData({
                          hasMore: false
                      })
                  }else{
                      that.setData({
                          page:++that.data.page
                      })
                  }
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
  onReachBottom(){
    if(!this.data.hasMore) return false;
    this.lists();
  },
  bindShowMsg() {
    this.setData({
      select: !this.data.select
    })
  },
  mySelect(e) {
    var name = e.currentTarget.dataset.name
    var id = e.currentTarget.dataset.id
    this.setData({
      tihuoWay: "当前班级：" +name,
      class_id: id,
      select: false,
      page:1,
      hasMore:true
    })
    this.lists();
  },
  my_class_list(){
    var that = this;
    var ts = Date.parse(new Date());
    var data = {
      member_id: wx.getStorageSync("member_id"),
      token: wx.getStorageSync("token"),
      page: 1,
      page_size: 20,
      type: 2,
      ts: ts
    };
    var cs = app.encryption(data);
    data.cs = cs;
    app.show_l(that);
    wx.request({
        url: config.URL + "school/class/signclasslistnew",
        data: data,
        method: 'post',
        header: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        success: function (res) {
            app.hide_l(that);
            if (res.data.code == 200) {
                var list = [];
                for (var i = 0; i < res.data.data.length; i++) {
                  list.push(res.data.data[i].class_name);
                }
                if(res.data.data.length > 0){
                  that.setData({
                      c_list:list,
                      cinfo_list: res.data.data,
                      class_list: res.data.data
                  });
                }
            }
          }
      })
  },
  bindPickerChange: function (e) {
    if (this.data.cinfo_list[e.detail.value].class_id) {
      this.setData({
        class_id: this.data.cinfo_list[e.detail.value].class_id,
        class_name: this.data.cinfo_list[e.detail.value].class_name,
        page:1,
        works_list:[],
        hasMore:true
      })
      this.lists();
    }
  },
});
