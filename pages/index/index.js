//index.js
//获取应用实例
const config = require('../../config.js');
const md5 = require('../../utils/md5.js');
const app = getApp();
Page({
  data: {
    class_id:0,
    work_list:[],
    share_title:"寻声朗读",
    share_url:"",
    share_image:"https://resource.xunsheng.org.cn/xsds_banner.png",
    banner_img:'',
    class_name:'',
    index_tab:1,
    user_info:[],
    is_teacher:0,
    class_content:'',
    indicatorDots: true,
    autoplay: false,
    interval: 5000,
    duration: 1000,
    teacher_ids:[],
    teacher_list:[],
    k_all:[],
    select_teacher_id:0,
    is_read_count:0, // 已读数量
    comment_ing_cout:0, //点评中
    is_comment_cout:0,//已点评
    surplus_cout:0,// 剩余点评包
  },
  onLoad: function (options) {
      // 默认选择导师
      var select_teacher_id = wx.getStorageSync("select_teacher_id");
      var token = wx.getStorageSync("token");
      var member_id = wx.getStorageSync("member_id");
      if (options){
          if (options.index_tab) {
              this.setData({
                index_tab: options.index_tab
              });
          }
          if (options.parent_id) { // 上级信息
              var parent_id = options.parent_id;
              wx.setStorageSync('parent_id', parent_id);
          }
          var class_id = options.class_id||'9698';
          if (class_id) {
            class_id = wx.getStorageSync("class_id");
          }
          wx.setStorageSync('class_id', class_id);
          this.setData({
            class_id: class_id
          });
      }
      if(!token){
          wx.redirectTo({
              url: '../login/login?type=index'
          })
      }else{
          this.setData({
            select_teacher_id: select_teacher_id
          });
          this.getClassInfo();
          this.getMembers();
          // 查询首页统计数据
          this.get_statistical_data();
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
        if (res.data.code == 200) {
          if (res.data.data.vip.is_teacher) {
            var is_teacher = 1;
          } else {
            var is_teacher = 0;
          }
          that.setData({
            is_teacher: is_teacher,
            user_info: res.data.data
          });
        } else if (res.data.msg == "用户认证不通过") {
          wx.setStorageSync('member_id', '');
          wx.setStorageSync('token', '');
          wx.redirectTo({
            url: '../login/login?type=index'
          })
        }
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
    var share_url = "/pages/index/index?&parent_id="+wx.getStorageSync("member_id");
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
          if (res.data.data.class_info.class_name){
             var class_name = res.data.data.class_info.class_name;
             wx.setNavigationBarTitle({
                title: class_name,
             })
          }else{
             var class_name ="";
             var class_content = "";
          }
          that.setData({//存值
            class_id: class_id,
            banner_img: banner_img,
            class_name:class_name,
            class_content: res.data.data.class_info.content
          });
          that.getHomeWork();
          that.get_class_tea_list();
        } else if (res.data.msg == "用户认证不通过"){
          wx.setStorageSync('member_id', '');
          wx.setStorageSync('token', '');
          wx.redirectTo({
            url: '../login/login?type=index'
          })
        }
      }
    })
  },
  tab_swiper(e){
    var url = e.currentTarget.dataset.url;
    this.setData({
      index_tab: url
    });
  },
  // 查询班级付费导师
  get_class_tea_list(){
    var that = this;
    var ts = Date.parse(new Date());
    var data = {
      member_id: wx.getStorageSync("member_id"),
      token: wx.getStorageSync("token"),
      class_id: that.data.class_id,
      page:1,
      page_size:20,
      type:1,
      order: 'score',
      sort:0,
      ts: ts
    };
    var cs = app.encryption(data);
    data.cs = cs;
    app.show_l(that);
    wx.request({
      url: config.URL + "fa/Xspaycomment/tutor_list",
      data: data,
      method: 'get',
      header: { "Content-Type": "application/x-www-form-urlencoded" },
      success: function (res) {
        if (res.data.code == 200) {
            var ids = [];
            var is_online = false;
            for (var i=0;i<res.data.data.tutor_list.length;i++){
              if (that.data.select_teacher_id == res.data.data.tutor_list[i].example_reader_id){
                is_online = true;
              }
              ids[i] = res.data.data.tutor_list[i].example_reader_id;
            }
            if(!is_online){
              console.log(123);
              var index = Math.floor(Math.random() * ids.length); 
              that.setData({
                select_teacher_id: ids[index],
              });
              wx.setStorageSync('select_teacher_id', ids[index]);
            }
            var k_all = [];
            if (res.data.data.tutor_list.length < 4 && res.data.data.tutor_list.length > 0){
              for (var i = res.data.data.tutor_list.length;i<4;i++){
                  k_all.push([]);
              }
            }
          console.log(res.data.data.tutor_list);
            that.setData({
                teacher_ids: ids,
                k_all: k_all,
                teacher_list: res.data.data.tutor_list
            });
        }
      }
    })
  },
  edit_teacher(e){
    var id = e.currentTarget.dataset.url;
    this.setData({
      select_teacher_id: id,
    });
    wx.setStorageSync('select_teacher_id', id);
  },
  get_statistical_data(){
    var that = this;
    var ts = Date.parse(new Date());
    var data = {
      member_id: wx.getStorageSync("member_id"),
      token: wx.getStorageSync("token"),
      ts: ts
    };
    var cs = app.encryption(data);
    data.cs = cs;
    app.show_l(that);
    wx.request({
      url: config.URL + "fa/Xspaycomment/get_member_commen",
      data: data,
      method: 'get',
      header: { "Content-Type": "application/x-www-form-urlencoded" },
      success: function (res) {
        if (res.data.code == 200) {
            that.setData({
              is_read_count: res.data.data.is_read,
              comment_ing_cout: res.data.data.comment_ing,
              is_comment_cout: res.data.data.is_comment,
              surplus_cout: res.data.data.surplus_number,
            });
        }
      }
    })
  }
});
