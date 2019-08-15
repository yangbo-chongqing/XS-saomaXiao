//index.js
//获取应用实例
const config = require('../../config.js');
const md5 = require('../../utils/md5.js');
const app = getApp();
const recorderManager = wx.getRecorderManager();
const innerAudioContext = wx.createInnerAudioContext();
Page({
    data: {
        motto: '寻声伴读作业',
        link: "",
        share_title:"寻声伴读作业",
        share_url:"",
        share_image:"https://resource.xunsheng.org.cn/xsds_banner.png",
        task_info:[],
        work_list:[],
        recordingTimeqwe: 0,
        miuse_state:1,
        miuse_url:'',
        setInter:"",//录音名称
        setInter1: "",//录音名称
        strat:false,
        impression:"",
        class_id: 0,
        task_id: 0,
        audioCtx:[],
        is_play:0,
        play_miuse_id:'',
        minute: '0' + 0,   // 分
        second: '0' + 0,    // 秒
        audition:false,
        bf_src:'',
        indicatorDots: true, // 轮播参数
        autoplay: false, //轮播参数
        interval: 5000, // 轮播参数
        duration: 1000, // 轮播参数
        teacher_ids: [], // 范读导师id数组
        teacher_list: [], // 范读导师列表
        k_all: [], // 空数组 填充轮播图
        select_teacher_id: 0, // 选中的范读导师
        release:true,
        message:'',
        voucher_count:0,
        select_teacher:''
    },
    onUnload: function () {
      this.stop_miuse_one();
      this.stop_miuse_two();
      this.stop_miuse_three();
    },
    onLoad: function (options) {
        // 默认选择导师
        var select_teacher_id = wx.getStorageSync("select_teacher_id");
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
        var task_id = options.task_id;
        if(!task_id){ // 当前分享页的类型
            task_id =  wx.getStorageSync("task_id");
        }
        // task_id = 314;
        wx.setStorageSync('task_id',task_id);
        if(!token){ // 用户未登录 则跳转到授权登录
            wx.redirectTo({
                url: '../login/login?type=release'
            })
        }else{
            this.setData({
                task_id: task_id,
                class_id: class_id,
                select_teacher_id: select_teacher_id,
                class_name: wx.getStorageSync("current_class_name")
            })
            wx.setNavigationBarTitle({
              title: wx.getStorageSync("current_class_name")
            })
            if(!class_id){ // 当前直接进入作品详情页面 没有进入班级页面
              this.get_member_class();
            }else{
              this.get_tast_info();
              this.get_classworkslist();
              this.get_class_tea_list();
              this.release_verification();
            }  
        }
    },
    onShareAppMessage: function(res) {
        var share_url = "/pages/release/release?class_id="+wx.getStorageSync("class_id")+"&task_id="+wx.getStorageSync("task_id")+"&parent_id="+wx.getStorageSync("member_id");
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
    get_member_class:function(){
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
          method: 'get',
          header: { "Content-Type": "application/x-www-form-urlencoded" },
          success: function (res) {
            if (res.data.code == 200) {
              if(res.data.data.class_info){
                  var name = res.data.data.class_info.school_info.school_name + '-' + res.data.data.class_info.class_name;
                  that.setData({//存值
                    class_id: class_id,
                    class_name: name,
                  });
                  wx.setNavigationBarTitle({
                    title: name
                  })
                  wx.setStorageSync('class_id', class_id);
                  wx.setStorageSync('current_class_name', name)
             
                  that.get_tast_info();
                  that.get_classworkslist();
                  that.get_class_tea_list();
                  that.release_verification();
              }
            } else if (res.data.msg == "用户认证不通过") {
              wx.setStorageSync('member_id', '');
              wx.setStorageSync('token', '');
              wx.redirectTo({
                url: '../login/login?type=release'
              })
            }
          }
        })  
    },
    // 文稿详情
    get_tast_info:function(){
        var that = this;
        app.show_l(that);
        var ts = Date.parse(new Date());
        var data = {
            task_id:  wx.getStorageSync("task_id"),
            ts: ts,
        };
        var cs = app.encryption(data);
        data.cs = cs;
        wx.request({
            url: config.URL + "task/default/detail",
            data: data,
            method: 'post',
            header: { "Content-Type": "application/x-www-form-urlencoded" },
            success: function (res) {
              if(res.data.code == 200){
                  console.log(123);
                  that.setData({
                    task_info: res.data.data.task_detail,
                    share_title:res.data.data.task_detail.task_name,
                  })
                  app.hide_l(that);
              }else if (res.data.msg == "用户认证不通过") {
                  wx.setStorageSync('member_id', '');
                  wx.setStorageSync('token', '');
                  wx.redirectTo({
                    url: '../login/login?type=index'
                  })
              }
            }
        })
    },
    // 历史作品列表
    get_classworkslist:function(){
        var that = this;
        app.show_l(that);
        var ts = Date.parse(new Date());
        var data = {
            member_id:  wx.getStorageSync("member_id"),
            token:wx.getStorageSync("token"),
            page:1,
            page_size:10,
            class_id:wx.getStorageSync("class_id"),
            student_member_id: wx.getStorageSync("member_id"),
            task_id:wx.getStorageSync("task_id"),
            ts: ts,
        };
        var cs = app.encryption(data);
        data.cs = cs;
        wx.request({
            url: config.URL + "school/classwork/classworkslist",
            data: data,
            method: 'post',
            header: { "Content-Type": "application/x-www-form-urlencoded" },
            success: function (res) {
                app.hide_l(that);
                if(res.data.code == 200){
                    that.setData({
                        work_list: res.data.data
                    })
                }
            }
        })
    },
    //开始录音
    openRecording: function() {
        this.stop_miuse_one();
        var that = this;
        const options = {
            duration: 600000,//指定录音的时长，单位 ms
            sampleRate: 44100,//采样率
            numberOfChannels: 2,//录音通道数
            encodeBitRate: 84000,//编码码率
            format: 'mp3',//音频格式，有效值 aac/mp3
            frameSize: 64,//指定帧大小，单位 KB
        };
        //开始录音
        recorderManager.start(options);
        recorderManager.onStart(() => {
            //开始录音计时
            that.recordingTimer();
            that.timesetInterval();
            that.setData({//存值
                miuse_state:2,
                strat:true,
                tea_show:false
            })
            wx.showToast({
                title: '开始录音',
                icon: 'none',
                duration: 1500,
            });
        });
        //错误回调
        recorderManager.onError((res) => {
  
            wx.showToast({
                title: '没有权限',
                icon: 'none',
                duration: 1500,
            })
        })
    },
    //录音计时器
    recordingTimer:function(){
        var that = this;
        //将计时器赋值给setInter
        that.data.setInter = setInterval(
            function () {
                if(that.data.strat){
                    var time = that.data.recordingTimeqwe + 1;
                    if (time > 599){
                        that.shutRecording();
                        wx.showToast({
                          title: '录制最大时长10分钟',
                          icon: 'none',
                          duration: 3000,
                        })
                    }else{
                      that.setData({
                        recordingTimeqwe: time
                      })
                    } 
                }
            }
            , 1000);
    },
    //结束录音
    shutRecording: function() {
        var that = this;
        wx.showToast({
            title: '录制完成',
            icon: 'none',
            duration: 1500,
        })
        //结束录音计时
        clearInterval(that.data.setInter);
        clearInterval(that.data.setInter1);
        that.setData({//存值
          setInter1: ''
        })
        recorderManager.stop();
        recorderManager.onStop((res) => {
            this.tempFilePath = res.tempFilePath;
            that.setData({//存值
                miuse_url:res.tempFilePath,
                strat:false,
                miuse_state:4,
                tempFilePath:res,
                setInter1:''
            })
        })
    },
    //录音播放
    recordingAndPlaying: function(eve) {
        var that = this;
        this.stop_miuse_one();
        wx.showToast({
            title: '开始播放',
            icon: 'none',
            duration: 1500,
        })
        this.setData({
          audition:true
        });
        innerAudioContext.autoplay = true
        innerAudioContext.src = this.tempFilePath;
        innerAudioContext.play();

        innerAudioContext.onPlay(() => {
            this.setData({
              minute: '0' + 0,   // 分
              second: '0' + 0,    // 秒
            });
            if (!that.data.setInter1){
              that.timesetInterval();
            }
            
        });
        innerAudioContext.onError((res) => {
            console.log(res.errMsg);
            console.log(res.errCode);
        })
        innerAudioContext.onEnded((res) => {
          clearInterval(that.data.setInter1);
          that.setData({
            audition: false,
            setInter1:""
          });
          
        })
    },
    recordingAndPlayingzt:function(){
      var that = this;
      clearInterval(that.data.setInter1);
      this.setData({
        audition: false,
        setInter1: ""
      });
      
      innerAudioContext.stop();
    },
    //录音暂停
    suspendRecording: function(eve) {
        var that = this;
        recorderManager.pause();
        recorderManager.onPause((res) => {
            that.setData({//存值
                miuse_state:3,
                strat:false
            })
            wx.showToast({
                title: '暂停录制',
                icon: 'none',
                duration: 1500,
            })
            
        })
    },
    //录音继续
    continueRecording: function(eve) {
        var that = this;
        recorderManager.resume();
        recorderManager.onResume((res) => {
            wx.showToast({
                title: '继续录制',
                icon: 'none',
                duration: 1500,
            })
            that.setData({//存值
                miuse_state:2,
                strat:true
            })
        })
    },
    // 重置录音
    reset:function(){
        var that = this;
        that.stop_miuse_one();
        that.stop_miuse_two();
        that.stop_miuse_three();
        that.setData({//存值
            miuse_state:1,
            recordingTimeqwe:0,
            minute: '0' + 0,   // 分
            second: '0' + 0,    // 秒
        })
    },
    // 获取七牛云参数
    get_qiniu_info:function(){
      var that = this;
      if (this.data.play_miuse_id) { // 当前音频正在播放
        this.data.audioCtx[this.data.play_miuse_id].pause();
        this.setData({
          is_play: 0,
          play_miuse_id: ''
        })
      }
      if (this.data.miuse_state == 2) {
        //结束录音计时
        clearInterval(that.data.setInter);
        clearInterval(that.data.setInter1);
        recorderManager.stop();
        recorderManager.onStop((res) => {
          this.tempFilePath = res.tempFilePath;
          that.setData({//存值
            miuse_url: res.tempFilePath,
            strat: false,
            miuse_state: 4,
            tempFilePath: res
          })
        })
      }
      if (this.data.audition) {
        console.log(321321);
        clearInterval(that.data.setInter1);
        that.setData({
          audition: false,
          setInter1: ""
        });
        innerAudioContext.stop();
      }

        var ts = Date.parse(new Date());
        var data = {
            member_id: wx.getStorageSync("member_id"),
            token: wx.getStorageSync("token"),
            device_id:9999,
            suffix:"MP3",
            ts:ts
        };
        var cs = app.encryption(data);
        data.cs = cs;
        app.show_l(that);
        wx.request({
            url: config.URL + "/voice/qiniu/uploadtoken",
            data: data,
            method: 'post',
            header: {
                'content-type': 'application/x-www-form-urlencoded',
            },
            success: function (res) {
                app.hide_l(that);
                if(res.data.code == 200){
                    //上传录音
                    app.show_l(that);
                    wx.uploadFile({
                        url: config.QIUNIU_URL,//这是你自己后台的连接
                        filePath: that.data.miuse_url,
                        name:"file",//后台要绑定的名称
                        header: {
                            "Content-Type": "multipart/form-data"
                        },
                        //参数绑定
                        formData:{
                            token: res.data.data.upToken,
                            fileName: res.data.data.key,
                        },
                        dataType:'JSON',
                        success:function(ress){
                            app.hide_l(that);
                            var data = JSON.parse(ress.data);
                            that.setData({//存值
                                q_url:data.key,
                            })
                            that.release_work(data.key);
                        },
                        fail: function(ress){
                            wx.showToast({
                              title: "。。录音保存失败。。",
                              icon: 'success',
                              duration: 2000
                            })
                        }
                    })
                }
            }
        })
    },
    // 上传作品
    release_work:function(video_url){
        var that = this;
        var ts = Date.parse(new Date());
        var data = {
            member_id: wx.getStorageSync("member_id"),
            token: wx.getStorageSync("token"),
            lrc_text: that.data.task_info.lyric_text,
            lrc_source:that.data.task_info.lyric_source,
            audio_name:that.data.task_info.task_name,
            duration: that.data.recordingTimeqwe,
            cover_img:that.data.task_info.cover_img,
            banner_list:that.data.task_info.image_lists.join('|'),
            task_id:that.data.task_info.task_id,
            video_url:video_url,
            class_id:wx.getStorageSync("class_id"),
            impression:that.data.impression,
            ts:ts
        };
        var cs = app.encryption(data);
        data.cs = cs;
        app.show_l(that);
        wx.request({
            url: config.URL + "muse/works/savev2",
            data: data,
            method: 'post',
            header: {
                'content-type': 'application/x-www-form-urlencoded',
            },
            success: function (res) {
                // app.hide_l();
                if(res.data.code == 200){  // 发布成功自动给用户申请导师   
                    // wx.showToast({
                    //     title: "发布成功",
                    //     icon:'success',
                    //     duration:2000
                    // })
                    that.adding_order(res.data.data);
                    // wx.redirectTo({
                    //   url: '../apply_for/apply_for?works_id=' + res.data.data
                    // })
                }else{
                    wx.showToast({
                        title: res.data.msg,
                        icon:'success',
                        duration:2000
                    })
                }
            }
        })
    },
    bzInput:function(e){
      var that = this;
      that.setData({
        impression:e.detail.value
      })
    },
    //跳转个人中心
    jump(e) {
        var that = this;
        this.stop_miuse_one();
        this.stop_miuse_two();
        this.stop_miuse_three();
        var url = "../work/work?type=SsReport&class_id=" + this.data.class_id + "&task_id=" + this.data.task_id;
        wx.navigateTo({
          url: url,
        })
    },
    //跳转个人中心
    jump_data(e) {
      var that = this;
      this.stop_miuse_one();
      this.stop_miuse_two();
      this.stop_miuse_three();
      var url = e.currentTarget.dataset.url;
      wx.navigateTo({
        url: url,
      })
    },
    redirect(e){
      var that = this;
      this.stop_miuse_one();
      this.stop_miuse_two();
      this.stop_miuse_three();
      var url = e.currentTarget.dataset.url;
      wx.reLaunch({
          url: url,
      })
    },
    bf(e){
      if (this.data.is_play == 1){
          this.audioCtx.pause();
          this.setData({
              is_play: 0,
          })
      }else{
          this.audioCtx.play();
          this.setData({
              is_play: 1,
          })
      }
    },
    end_play(){
        this.setData({
          is_play: 0,
          play_miuse_id: ''
        })
    },
    play_miuse(e){
      var that = this;
      this.stop_miuse_two();
      this.stop_miuse_three();
      var miuse_id = e.target.id;
      if (miuse_id == this.data.play_miuse_id){ // 当前音频正在播放
        this.data.audioCtx[miuse_id].pause();
        this.setData({
          is_play: 0,
          play_miuse_id:''
        })
      }else{
        if (this.data.play_miuse_id) { // 当前正在播放的音频
          this.data.audioCtx[this.data.play_miuse_id].pause();
        }
        if (!this.data.audioCtx[miuse_id]) { // 当前音频未进行播放过
          this.data.audioCtx[miuse_id] = wx.createAudioContext(miuse_id)
        }
        this.data.audioCtx[miuse_id].play();
        this.setData({
          is_play: 1,
          play_miuse_id: miuse_id
        })
      }
      
    },
    timesetInterval(){
      const that = this
      var second = that.data.second
      var minute = that.data.minute
      clearInterval(this.data.setInter1)
      this.setData({
        setInter1: '',
      })
      if (!this.data.setInter1){
        this.data.setInter1 = setInterval(function (res) {  // 设置定时器
            second++
            if (second >= 60) {
              second = 0  //  大于等于60秒归零
              minute++
              if (minute >= 60) {
                minute = 0  //  大于等于60分归零
              }
              if (minute < 10) {
                // 少于10补零
                that.setData({
                  minute: '0' + minute
                })
              } else {
                that.setData({
                  minute: minute
                })
              }
            }
            if (second < 10) {
              // 少于10补零
              that.setData({
                second: '0' + second
              })
            } else {
              that.setData({
                second: second
              })
            }
        }, 1000)
      }
    },
    //播放老师点评
    play_comment(e){
      this.stop_miuse_three();
      var miuse_id = e.currentTarget.dataset.id;
      var url = e.currentTarget.dataset.url;
      if (miuse_id == this.data.play_miuse_id) { // 当前音频正在播放
        this.data.audioCtx[miuse_id].pause();
        this.setData({
          is_play: 0,
          play_miuse_id: ''
        })
      } else {
        if (this.data.play_miuse_id) { // 当前正在播放的音频
          this.data.audioCtx[this.data.play_miuse_id].pause();
        }
        if (!this.data.audioCtx[miuse_id]) { // 当前音频未进行播放过
          this.data.audioCtx[miuse_id] = wx.createInnerAudioContext();
          this.data.audioCtx[miuse_id].autoplay  = true;
          this.data.audioCtx[miuse_id].src = url;
          
        }
        this.data.audioCtx[miuse_id].play();
        this.setData({
          is_play: 1,
          play_miuse_id: miuse_id
        })
        this.data.audioCtx[miuse_id].onPlay(() => {
          console.log('开始播放')
        });
        this.data.audioCtx[miuse_id].onError((res) => {
          console.log(res.errMsg);
          console.log(res.errCode);
        })
        this.data.audioCtx[miuse_id].onEnded(() => {
          this.setData({
            play_miuse_id:'',
            is_play:0,
          });
        });
      }
    },
    //跳转首页
    jump_index(e) {
      this.stop_miuse_one();
      this.stop_miuse_two();
      this.stop_miuse_three();
      var url = e.currentTarget.dataset.url;
      wx.redirectTo({
        url: '../index/index?index_tab=' + url,
      })
    },
    stop_miuse_one(){
        var that = this;
        if (this.data.play_miuse_id) { // 当前音频正在播放
          this.data.audioCtx[this.data.play_miuse_id].pause();
          this.setData({
            is_play: 0,
            play_miuse_id: ''
          })
        }
    },
    stop_miuse_two(){
        var that = this;
        if (this.data.miuse_state == 2) {
            //结束录音计时
            clearInterval(that.data.setInter);
            clearInterval(that.data.setInter1);
            recorderManager.stop();
            recorderManager.onStop((res) => {
              this.tempFilePath = res.tempFilePath;
              that.setData({//存值
                miuse_url: res.tempFilePath,
                strat: false,
                miuse_state: 4,
                tempFilePath: res
              })
            })
        }
    },
    stop_miuse_three(){
        var that = this;
        if (this.data.audition) {
            clearInterval(that.data.setInter1);
            that.setData({
              audition: false,
              setInter1: ""
            });
            innerAudioContext.stop();
        }
    },
    // 查询班级付费导师
    get_class_tea_list() {
      var that = this;
      var ts = Date.parse(new Date());
      var data = {
        member_id: wx.getStorageSync("member_id"),
        token: wx.getStorageSync("token"),
        class_id: wx.getStorageSync("class_id"),
        page: 1,
        page_size: 20,
        type: 1,
        order: 'score',
        sort: 0,
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
            var new_list = [];
            var arr = [];
            for (var i = 0; i < res.data.data.tutor_list.length; i++) {
              if (that.data.select_teacher_id == res.data.data.tutor_list[i].example_reader_id) {
                is_online = true;
                that.setData({
                  select_teacher: res.data.data.tutor_list[i].name
                });
              }
              ids[i] = res.data.data.tutor_list[i].example_reader_id;
              if (arr.length == 4) {
                new_list.push(arr);
                arr = [];
                arr.push(res.data.data.tutor_list[i]);
              } else {
                arr.push(res.data.data.tutor_list[i]);
              }
            }
            if (arr.length > 0) {
              new_list.push(arr);
            }
            if (!is_online) {
              var index = Math.floor(Math.random() * ids.length);
              that.setData({
                select_teacher_id: ids[index],
              });
              wx.setStorageSync('select_teacher_id', ids[index]);
            }
            if (res.data.data.tutor_list.length == 0){
                that.setData({
                  release: false,
                  message: '班级暂无导师在线, 无法录制作品'
                });
            }
            that.setData({
              teacher_ids: ids,
             // k_all: k_all,
             // teacher_list: res.data.data.tutor_list
              teacher_list: new_list
            });
          }
        }
      })
    },
    // 修改默认导师
    edit_teacher(e) {
      var id = e.currentTarget.dataset.url;
      var name = e.currentTarget.dataset.name;
      this.setData({
        select_teacher_id: id,
        tea_show:false,
        select_teacher:name
      });
      wx.setStorageSync('select_teacher_id', id);
    },
    // 申请老师点评
    adding_order(works_id) {
        var that = this;
        var ts = Date.parse(new Date());
        var data = {
            member_id: wx.getStorageSync("member_id"),
            token: wx.getStorageSync("token"),
            tutor_id: that.data.select_teacher_id,
            works_id: works_id,
            ts: ts
        };
        var cs = app.encryption(data);
        data.cs = cs;
        // app.show_l(that);
        wx.request({
            url: config.URL + "/fa/Xspaycomment/adding_order",
            data: data,
            method: 'post',
            header: {
              'content-type': 'application/x-www-form-urlencoded',
            },
            success: function (res) {
                app.hide_l(that);
                if (res.data.code == 200) {
                    that.setData({
                      loading: true,
                      apply_success: true
                    })
                    wx.showToast({
                      title: res.data.msg,
                      icon: 'none',
                      duration: 4500,
                    })
                    wx.setStorageSync('work_id', data.works_id);
                    setTimeout(function () {
                      wx.redirectTo({
                        url: '../work_info/work_info?showShareTip=1'
                      });
                    }, 4000);
                } else {
                    wx.showToast({
                      title: "发布成功",
                      icon: 'none',
                      duration: 4500,
                    })
                    setTimeout(function () {
                      wx.redirectTo({
                        url: '../work_info/work_info'
                      });
                    }, 4000);
                }
              }
        })
    },
    // 发布作品验证
    release_verification(){
        var that = this;
        var ts = Date.parse(new Date());
        var data = {
          member_id: wx.getStorageSync("member_id"),
          token: wx.getStorageSync("token"),
          class_id: wx.getStorageSync("class_id"),
          ts: ts
        };
        var cs = app.encryption(data);
        data.cs = cs;
        app.show_l(that);
        wx.request({
            url: config.URL + "fa/xspaycomment/release_verification",
            data: data,
            method: 'post',
            header: {
              'content-type': 'application/x-www-form-urlencoded',
            },
            success: function (res) {
                if(res.data.code == 200){ // 
                    if(res.data.data.class_state == 0){
                        that.setData({
                            release: false,
                            message: res.data.data.class_message,
                        });
                    } else if (res.data.data.voucher_count == 0){
                        that.setData({
                          release: false,
                          message: res.data.data.voucher_message,
                        });
                    }
                    that.setData({
                      voucher_count: res.data.data.voucher_count
                    });

                }
            }
        })
    },
    show_teacher(e){
      var id = e.currentTarget.dataset.id;
      if(id == 1){
          this.setData({
              tea_show: true,
          });
      }else if(id == 0){
          this.setData({
              tea_show: false,
          });
      }
    }
});
