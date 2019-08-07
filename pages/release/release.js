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
        share_image:"http://resource.xunsheng.org.cn/20190727175250-task-cover-283.JPG",
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
        audition:false
    },
    onLoad: function (options) {
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
            })
            this.get_tast_info();
            this.get_classworkslist();
        }
    },
    onShareAppMessage: function(res) {
        var share_url = "/pages/release/release?class_id="+wx.getStorageSync("class_id")+"&task_id="+wx.getStorageSync("task_id")+"&parent_id="+wx.getStorageSync("member_id");
        return {
            title: "寻声朗读",
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
                  that.setData({
                    task_info: res.data.data.task_detail
                  })
                  app.hide_l(that);
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
        if (this.data.play_miuse_id) { // 当前正在播放的音频
          this.data.audioCtx[this.data.play_miuse_id].pause();
        }
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
                strat:true
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
                    that.setData({
                        recordingTimeqwe: time
                    })
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
        recorderManager.stop();
        recorderManager.onStop((res) => {
            this.tempFilePath = res.tempFilePath;
            that.setData({//存值
                miuse_url:res.tempFilePath,
                strat:false,
                miuse_state:4,
                tempFilePath:res
            })
        })
    },
    //录音播放
    recordingAndPlaying: function(eve) {
        if (this.data.play_miuse_id) { // 当前正在播放的音频
          this.data.audioCtx[this.data.play_miuse_id].pause();
        }
        wx.showToast({
            title: '开始播放',
            icon: 'none',
            duration: 1500,
        })
        this.setData({
          audition:true
        });
        innerAudioContext.autoplay = true
        innerAudioContext.src = this.tempFilePath,
        innerAudioContext.onPlay(() => {
            console.log('开始播放')
        });
        innerAudioContext.onError((res) => {
            console.log(res.errMsg);
            console.log(res.errCode);
        })
    },
    recordingAndPlayingzt:function(){
      this.setData({
        audition: false
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
            duration:that.data.task_info.duration,
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
                app.hide_l();
                if(res.data.code == 200){
                    wx.showToast({
                        title: "发布成功",
                        icon:'success',
                        duration:2000
                    })
                    wx.redirectTo({
                      url: '../apply_for/apply_for?works_id=' + res.data.data
                    })
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
        var url = "../work/work?type=SsReport&class_id=" + this.data.class_id + "&task_id="+this.data.task_id ;
        wx.navigateTo({
          url: url,
        })
    },
    //跳转个人中心
    jump_data(e) {
      var url = e.currentTarget.dataset.url;
      wx.navigateTo({
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
      if (this.data.audition){
        this.setData({
          audition: false
        });
        innerAudioContext.stop();
      }
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
      that.data.setInter1 = setInterval(function () {  // 设置定时器
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
    },
    //播放老师点评
    play_comment(e){
      console.log(this.data.audioCtx);
      if (this.data.audition) {
        this.setData({
          audition: false
        });
        innerAudioContext.stop();
      }
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
          this.data.audioCtx[miuse_id] = wx.createInnerAudioContext(miuse_id);
          this.data.audioCtx[miuse_id].src = url;
          console.log(url);
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
          console.log('112233')
          this.setData({
            play_miuse_id:'',
            is_play:0,
          });
        });
      }
    }
});
