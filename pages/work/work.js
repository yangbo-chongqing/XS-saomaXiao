//index.js
//获取应用实例
const config = require('../../config.js');
const md5 = require('../../utils/md5.js');
const app = getApp();
Page({
  data: {
    motto: '寻声',
    link: "",
    share_title:"寻声朗读",
    share_url:"",
    share_image:"https://resource.xunsheng.org.cn/xcxds_banner.png",
    
  },
  onLoad: function (options) {
    console.log(options);
    // 用户信息
    var token = wx.getStorageSync("token");
    var member_id = wx.getStorageSync("member_id");
    if(options.parent_id){ // 上级信息
      var parent_id = options.parent_id;
      wx.setStorageSync('parent_id',parent_id);
    }
    var type = options.type;
    if(!type){ // 当前分享页的类型
      type =  wx.getStorageSync("work_type");
    }
    wx.setStorageSync('work_type',type);
    
    if(type == "SsWorksDetail"){ //作品详情页面
        var work_id = options.work_id;
        if(!work_id){
          work_id = wx.getStorageSync("work_id")
        }
        wx.setStorageSync('work_id',work_id);
        if(!work_id){
            wx.showToast({
              title: "参数错误",
              icon: 'none',
              duration: 1500,
            })
            wx.navigateTo({
              url: '../index/index'
            })
        }
        wx.setNavigationBarTitle({
          title: '作品详情'
        })
        this.setData({
          link: config.SITE_URL+'/apph5/#/SsWorksDetail?mid='+member_id+'&tk='+token+"&works_id="+work_id
        })
    }else if(type == "SsTask"){ // 做作业
        var task_id = options.task_id;
        if(!task_id){
          task_id = wx.getStorageSync("task_id")
        }
        wx.setStorageSync('task_id',task_id);
        var class_id = options.class_id;
        if(!class_id){
          class_id = wx.getStorageSync("class_id")
        }
        wx.setStorageSync('class_id',class_id);
        if(!task_id || !class_id){
          wx.showToast({
            title: "参数错误",
            icon: 'none',
            duration: 1500,
          })
          wx.navigateTo({
            url: '../index/index'
          })
        }
        wx.setNavigationBarTitle({
          title: '做作业'
        })
        this.setData({
          link: config.SITE_URL+'/apph5/#/SsTask?task_id='+task_id+'&class_id='+class_id+"&tk="+token+"&mid="+member_id
        })
    }else if(type == "SsReport"){ // 分享海报
        var task_id = options.task_id;
        if(!task_id){
          task_id = wx.getStorageSync("task_id")
        }
        wx.setStorageSync('task_id',task_id);
        var class_id = options.class_id;
        if(!class_id){
          class_id = wx.getStorageSync("class_id")
        }
        wx.setStorageSync('class_id',class_id);
        var mid = options.mid;
        if(!mid){
          mid = wx.getStorageSync("mid")
        }
        wx.setStorageSync('mid',mid);
        var tk = options.tk;
        if(!tk){
          tk = wx.getStorageSync("tk")
        }
        wx.setStorageSync('tk',tk);
        wx.setNavigationBarTitle({
          title: '分享海报'
        })
        if(!task_id || !class_id){
            wx.showToast({
              title: "参数错误",
              icon: 'none',
              duration: 1500,
            })
            wx.navigateTo({
              url: '../index/index'
            })
        }
        if(!tk || !mid){
          tk = token;
          mid = member_id;
        }
        this.setData({
          link: config.SITE_URL+'/apph5/#/SsReport?task_id='+task_id+'&class_id='+class_id+"&tk="+tk+"&mid="+mid
        })
    } else if (type == "MyCoupon") { // 我的卷包
      wx.setNavigationBarTitle({
        title: '我的券包'
      })
      this.setData({
        link: config.SITE_URL + '/apph5/#/MyCoupon?showUseBtn=0&mid=' + member_id + '&tk=' + token + "&show_buy_url=0"
      })
    } else if (type == "CommentOrder"){
      wx.setNavigationBarTitle({
        title: '申请详情'
      })
      var apply_id = options.apply_id;
      if (!apply_id) {
        apply_id = wx.getStorageSync("apply_id")
      }
      wx.setStorageSync('apply_id', apply_id);
      this.setData({
        link: config.SITE_URL + '/apph5/#/CommentOrder?mid=' + member_id + '&tk=' + token + "&apply_id="+apply_id
      })
    }
  
    if(!token){ // 用户未登录 则跳转到授权登录
        wx.redirectTo({
          url: '../login/login?type=work'
        })
    }else{
    
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
    var web_url = res.webViewUrl;
    //获取最后一个/的位置
    var s_site = web_url.lastIndexOf("\/");
    var url = web_url.substring(s_site + 1, web_url.length);
    var e_site = url.lastIndexOf("?");
    var site_url = url.substring(0, e_site);
    var share_title;
   console.log(web_url);
    if(site_url == "SsWorksDetail"){ // 作品详情
        var works_id = this.getQueryString('works_id',web_url);
        var share_url = "/pages/work/work?type=SsWorksDetail&work_id="+works_id+"&parent_id="+wx.getStorageSync("member_id");
    }else if(site_url == "SsTask"){ //
      var task_id = this.getQueryString('task_id',web_url);
      var class_id = this.getQueryString('class_id',web_url);
      var share_url = "/pages/work/work?type=SsTask&task_id="+task_id+"&class_id="+class_id+"&parent_id="+wx.getStorageSync("member_id");
    }else if(site_url == "SsReport"){ // 分享海报
      var class_id = this.getQueryString('class_id',web_url);
      var task_id = this.getQueryString('task_id',web_url);
      var mid = this.getQueryString('mid',web_url);
      var tk = this.getQueryString('tk',web_url);
      var share_url = "/pages/work/work?type=SsReport&task_id="+task_id+"&class_id="+class_id+"&mid="+mid+"&tk="+tk+"&parent_id="+wx.getStorageSync("member_id");
        share_title='成就报表';
    } else if (site_url == "MyCoupon") { // 我的卷包
      var share_url = "/pages/work/work?type=MyCoupon";
    } else if (site_url == "CommentOrder"){
      var share_url = "/pages/work/work?type=CommentOrder&apply_id=" + wx.getStorageSync("apply_id");
    }
    console.log(share_url);
    return {
      title: share_title||this.data.share_title,
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
  getQueryString:function(name,url) {
      var reg = new RegExp("(^|[&?])" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
      var r = url.match(reg);  //匹配目标参数
      if (r != null) return unescape(r[2]); return null; //返回参数值
  }
});
