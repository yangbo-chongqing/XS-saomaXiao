//index.js
//获取应用实例
const config = require('../../config.js');
const md5 = require('../../utils/md5.js');
const app = getApp();
Page({
  data: {
    work_list: [],
    page:1,
    page_size:20,
    tab_type:0,
    select_order:'score',
    select_order_desc:'按评分排序',
    select_sort: '0',
    select_sort_desc: '正序',
    tutor_list:[],
    select_id:'',
  },
  onLoad: function (options) {
    var token = wx.getStorageSync("token");
    var member_id = wx.getStorageSync("member_id");
    if (options.parent_id) { // 上级信息
      var parent_id = options.parent_id;
      wx.setStorageSync('parent_id', parent_id);
    }
    var works_id = options.works_id;
    if (!works_id) { // 当前分享页的类型
      works_id = wx.getStorageSync("works_id");
    }
    wx.setStorageSync('works_id', works_id);
    if (!token) {
      wx.redirectTo({
        url: '../login/login?type=works_info'
      })
    } else {
      this.get_list();
    }
  },
  getUserInfo: function (e) {
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  // 获取用户信息
  getMembers: function () {
    var that = this;
    var ts = Date.parse(new Date());
    var data = {
      member_id: wx.getStorageSync("member_id"),
      token: wx.getStorageSync("token"),
      ts: ts
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
  //跳转个人中心
  jump(e) {
    var url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: url,
    })
  },
  tab_switch(e){
    var type = e.currentTarget.dataset.type;  
    this.setData({
      tab_type: type,
    })
    console.log(type);
  },
  list_switch(e){
    var type = e.currentTarget.dataset.type;  
    var value = e.currentTarget.dataset.value;  
    if(type == 1){ // 切换排序类型
        if (value == "score"){
            this.setData({
              select_order: 'score',
              select_order_desc:'按评分排序',
              tab_type:0
            })
        } else if (value == "price") {
            this.setData({
              select_order: 'price',
              select_order_desc: '按价格排序',
              tab_type: 0
            })
        } else if (value == "comments_count") {
            this.setData({
              select_order: 'comments_count',
              select_order_desc: '按点评数排序',
              tab_type: 0
            })
        } 
    }else{
      if (value == "0") {
        this.setData({
          select_sort: 0,
          select_sort_desc: '正序',
          tab_type: 0
        })
      } else if (value == "1"){
        this.setData({
          select_sort: 1,
          select_sort_desc: '倒序',
          tab_type: 0
        })
      }
    }
    this.get_list();
  },
  // 获取列表 
  get_list(){
    var that = this;
    var ts = Date.parse(new Date());
    var data = {
      member_id: wx.getStorageSync("member_id"),
      token: wx.getStorageSync("token"),
      page:that.data.page,
      page_size: that.data.page_size,
      type:1,
      order:that.data.select_order,
      sort:that.data.select_sort,
      works_id: wx.getStorageSync("works_id"),
      ts: ts
    };
    var cs = app.encryption(data);
    data.cs = cs;
    wx.request({
      url: config.URL + "/fa/XsPayComment/tutor_list",
      data: data,
      method: 'get',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      success: function (res) {
        if(res.data.code == 200){
            that.setData({
              tutor_list: res.data.data.tutor_list,
            })
        }
      }
    })
  },
  // 选择导师
  select_tutor(e){
    var id = e.currentTarget.dataset.id;
    var apply = e.currentTarget.dataset.apply;  
    if(apply != 1){
      this.setData({
        select_id: id,
      })
    }
  },
  adding_order(){
    var that = this;
    var ts = Date.parse(new Date());
    var data = {
      member_id: wx.getStorageSync("member_id"),
      token: wx.getStorageSync("token"),
      tutor_id: that.data.select_id,
      works_id: wx.getStorageSync("works_id"),
      ts: ts
    };
    if (!that.data.select_id){
      wx.showToast({
        title: "请选择付费导师",
        icon: 'none',
        duration: 1500,
      })
      return;
    }else{
      var cs = app.encryption(data);
      data.cs = cs;
      wx.request({
        url: config.URL + "/fa/Xspaycomment/adding_order",
        data: data,
        method: 'post',
        header: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        success: function (res) {
          if (res.data.code == 200) {
            wx.showToast({
              title: res.data.msg,
              icon: 'none',
              duration: 3000,
            })
            wx.setStorageSync('work_id', data.works_id);
            setTimeout(function(){
              wx.redirectTo({
                url: '../work_info/work_info'
              });
            },300);
          }else{
            wx.showToast({
              title: res.data.msg,
              icon: 'none',
              duration: 1500,
            })
          }
        }
      })
    }
    
  }

});
