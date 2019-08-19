//index.js
//获取应用实例
const config = require('../../config.js');
const md5 = require('../../utils/md5.js');
const app = getApp();
Page({
    data: {
        motto: '寻声',
        link: "",
        share_title:"统计报表",
        share_url:"",
        share_image:"https://resource.xunsheng.org.cn/xsds_banner.png",
        
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
        var class_id = options.class_id;
        if(!class_id){ // 当前分享页的类型
            class_id =  wx.getStorageSync("class_id");
        }
        wx.setStorageSync('class_id',class_id);
        if(!token){ // 用户未登录 则跳转到授权登录
            wx.redirectTo({
                url: '../login/login?type=report'
            })
        }else{
            this.setData({
                link: config.SITE_URL+'/apph5/#/SsClassChart?class_id='+class_id
            })
        }
    },
    onShareAppMessage: function(res) {
        var share_url = "/pages/report/report?class_id="+wx.getStorageSync("class_id")+"&parent_id="+wx.getStorageSync("member_id")+"&type=report";
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
    getQueryString:function(name,url) {
        var reg = new RegExp("(^|[&?])" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
        var r = url.match(reg);  //匹配目标参数
        if (r != null) return unescape(r[2]); return null; //返回参数值
    }
});
