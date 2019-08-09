//index.js
//获取应用实例
const config = require('../../config.js');
const md5 = require('../../utils/md5.js');
const app = getApp();
Page({
  data: {
    tab_index: 2,
    class_id: 0,
    work_list: [],
    share_title: "寻声朗读",
    share_url: "",
    share_image: "https://resource.xunsheng.org.cn/xsds_banner.png",
    banner_img: '',
    page:1,
    page_size:10,
    select_type:0,
    apply_list:[],
    items: []
  },
  onLoad: function (options) {
    var token = wx.getStorageSync("token");
    var member_id = wx.getStorageSync("member_id");
    if (options.parent_id) { // 上级信息
      var parent_id = options.parent_id;
      wx.setStorageSync('parent_id', parent_id);
    }

    if (options.type) { // 上级信息
      var type = options.type;
    }else{
      var type = wx.getStorageSync("apply_type");
    }
    wx.setStorageSync('apply_type', type);
    if (!token) { // 用户未登录 则跳转到授权登录
      wx.redirectTo({
        url: '../login/login?type=user'
      })
    } else {
      // 获取用户信息
      this.setData({
        select_type: type
      });
      this.my_apply_comment();
      if(type == 1){
        this.get_my_state();
        wx.setNavigationBarTitle({
          title: '点评中心'
        })
      }else{
        wx.setNavigationBarTitle({
          title: '我的点评'
        })
      }
    }
  },
  onShareAppMessage: function (res) {
    var share_url = "/pages/apply_list/apply_list?type=" + wx.getStorageSync("apply_type")+"&parent_id=" + wx.getStorageSync("member_id");
    return {
      title: this.data.share_title,
      imageUrl: this.data.share_image,
      path: share_url,
      success: function (res) {
        // 转发成功
      },
      fail: function (res) {
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
  // 查询我的未点评数据
  my_apply_comment(){
    var that = this;
    var ts = Date.parse(new Date());
    var data = {
      member_id: wx.getStorageSync("member_id"),
      token: wx.getStorageSync("token"),
      page:that.data.page,
      page_size: that.data.page_size,
      identity: that.data.select_type,
      type:0,
      ts: ts
    };
    var cs = app.encryption(data);
    data.cs = cs;
    wx.request({
      url: config.URL + "/fa/XsPayComment/my_apply_comment",
      data: data,
      method: 'get',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      success: function (res) {
        if (res.data.code == 200) {
          that.setData({
            apply_list: res.data.data.list,
          });
        }
      }
    })
  },
  // 查询导师在线状态
  get_my_state(){
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
      url: config.URL + "/fa/XsPayComment/get_my_state",
      data: data,
      method: 'get',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      success: function (res) {
        if (res.data.code == 200) {
          if (res.data.data.state == 1){
            var list = [
              { name: '1', value: '在线', checked: 'true' },
              { name: '0', value: '离线' }
            ];
          }else{
            var list = [
              { name: '1', value: '在线' },
              { name: '0', value: '离线', checked: 'true' }
            ];
          }
          that.setData({
            items: list
          });
        }
      }
    })
  },
  // 修改导师点评状态
  radioChange: function (e) {
    var val = e.detail.value;
    var that = this;
    var ts = Date.parse(new Date());
    var data = {
      member_id: wx.getStorageSync("member_id"),
      token: wx.getStorageSync("token"),
      state: val,
      ts: ts
    };
    var cs = app.encryption(data);
    app.show_l(this);
    data.cs = cs;
    wx.request({
      url: config.URL + "/fa/XsPayComment/tutor_edit",
      data: data,
      method: 'post',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      success: function (res) {
        app.hide_l(that);
        if(res.data.code == 200){
          wx.showToast({
            title: "修改成功",
            icon: 'none',
            duration: 1500,
          })
        }else{
          wx.showToast({
            title: "修改失败",
            icon: 'none',
            duration: 1500,
          })
        }
        that.get_my_state();
      }
    })
  }
 
});
