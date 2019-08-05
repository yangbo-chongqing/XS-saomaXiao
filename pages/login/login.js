//index.js
//获取应用实例
//index.js
const config = require('../../config.js');
const app = getApp();
Page({
	data: {
		motto: 'Hello World',
		userInfo: {},
		hasUserInfo: false,
		canIUse: wx.canIUse('button.open-type.getUserInfo'),
		key:'',// 微信小程序登录信息
		type:'',
		parent_id:0,
	},
	onLoad: function (options) {
		var parent_id = wx.getStorageSync('parent_id');
		console.log(11111);
		console.log(parent_id);
		var that = this;
		var type = options.type;
		that.setData({
			type: type,
			parent_id:parent_id
		})
		var token = wx.getStorageSync("token");
		if(token) { // 用户未登录 则跳转到授权登录
			if(type == "index"){
        wx.redirectTo({
					url: '../index/index'
				})
			}else if(type == "work"){
        wx.redirectTo({
					url: '../work/work'
				})
			}else if(type == "user"){
        wx.redirectTo({
					url: '../user/user'
				})
			}else if(type == "work_list"){
        wx.redirectTo({
					url: '../work_list/work_list'
				})
			}else if(type == "report"){
        wx.redirectTo({
					url: '../report/report'
				})
			}else if(type == "release"){
        wx.redirectTo({
					url: '../release/release'
				})
      }else if (type == "work_info") {
        wx.redirectTo({
          url: '../work_info/work_info'
        })
      }
		}
			// that.setData({
		// 	login_show: true
		// });
	},
	onGotUserInfo: function (e) {
		var that = this;
		var user = {
			encryptedData: e.detail.encryptedData,
			iv: e.detail.iv,
		}
		that.setData({
			user: user
		})
		if (e.detail.userInfo) {
			wx.login({
				success: function (res) {
					var code = res.code;
					wx.request({
						url: config.URL + "/fa/Xseechatmini/login",
						data: {
							code: code,
							v: 1
						},
						method: 'get',
						header: {
							'content-type': 'application/x-www-form-urlencoded',
						},
						success: function (res) {
							console.log(res);
							if (!res.data.data.is_tel) {
								that.setData({
									is_tel: true,
									state: res.data.data.state,
									token: res.data.data.token
								});
							} else {
								that.setData({
									is_tel: false,
									state: res.data.data.state,
									token: res.data.data.token
								});
								if (that.data.state) {
									var token = that.data.token;
									// 调用统一登录接口  在用户已经授权的情况下，wechat_phone方法前面两个参数没用到，所以填’0‘站位
									that.wechat_phone(0, 0, token, 2)
								}
							}
						}
					})
				}
			});
		} else {
		
		}
	},
	getPhoneNumber: function (e) { //点击获取手机号码按钮
		var that = this;
		wx.login({
			success: function (res) {
				var code = res.code;
				that.wechat_phone(e.detail.encryptedData, e.detail.iv, that.data.token, 1)
			}
		})
	},
	// types==1未注册用户，types==2 已注册用户
	wechat_phone: function (encryptedData, iv, token, types) {
		
		var that = this,requestData;
		var parent_id = this.data.parent_id;
		if (types == 1) {
			var phone = {
				encryptedData: encryptedData,
				iv: iv
			}
			requestData = {
				phone: phone,
				user: that.data.user
			}
		} else {
			requestData = {
				user: that.data.user
			}
		}
		if(parent_id){
			var datas = {
				token: token,
				requestData: JSON.stringify(requestData),
				v: 2,
				parent_id:parent_id
			}
		}else{
			var datas = {
				token: token,
				requestData: JSON.stringify(requestData),
				v: 2
			}
		}
		console.log(datas);
		console.log(that.data.type);
		wx.request({
			url: config.URL + '/fa/Xseechatmini/login_user_phone',
			method: 'post',
			header: { "Content-Type": "application/x-www-form-urlencoded" },
			data: datas,
			success: function (res) {
				if (res.data.code == 200) {
					var member_id = res.data.data.member_id;
					var token = res.data.data.token;
					wx.setStorageSync('token', token);
					wx.setStorageSync('member_id', member_id);
					if(that.data.type == "index"){
            wx.redirectTo({
							url: '../index/index'
						})
					}else if(that.data.type == "work"){
            wx.redirectTo({
							url: '../work/work'
						})
					}else if(that.data.type == "user"){
            wx.redirectTo({
							url: '../user/user'
						})
					}else if(that.data.type == "work_list"){
            wx.redirectTo({
							url: '../work_list/work_list'
						})
					}else if(that.data.type  == "report"){
            wx.redirectTo({
							url: '../report/report'
						})
          } else if (that.data.type == "work_info") {
            wx.redirectTo({
              url: '../work_info/work_info'
            })
          }
					// wx.navigateTo({
					// 	url: '/pages/index/index',
					// })
				} else {
					wx.showToast({
						title: res.data.data.msg,
						icon: 'none',
						duration: 1500,
					})
				}
			}
		})
	},
});
