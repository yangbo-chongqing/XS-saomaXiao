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
        strat:false,
        impression:"",
        class_id: 0,
        task_id: 0,
        audioCtx:[],
        is_play:0,
        play_miuse_id:''
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
        var task_id = options.task_id;
        if(!task_id){ // 当前分享页的类型
            task_id =  wx.getStorageSync("task_id");
        }
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
    // 文稿详情
    get_tast_info:function(){
        var that = this;
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
              }
            }
        })
    },
    // 历史作品列表
    get_classworkslist:function(){
        var that = this;
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
                if(res.data.code == 200){
                    that.setData({
                        work_list: res.data.data
                    })
                    console.log(111);
                }
            }
        })
    },
    //开始录音
    openRecording: function() {
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
            console.log(res);
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
            title: '停止录音',
            icon: 'none',
            duration: 1500,
        })
        //结束录音计时
        clearInterval(that.data.setInter);
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
        wx.showToast({
            title: '开始播放',
            icon: 'none',
            duration: 1500,
        })
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
            recordingTimeqwe:0
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
        wx.request({
            url: config.URL + "/voice/qiniu/uploadtoken",
            data: data,
            method: 'post',
            header: {
                'content-type': 'application/x-www-form-urlencoded',
            },
            success: function (res) {
                console.log(res);
                if(res.data.code == 200){
                    //上传录音
                    wx.uploadFile({
                        url: 'http://up.qiniu.com',//这是你自己后台的连接
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
                            wx.showToast({
                                title: '保存完成',
                                icon:'success',
                                duration:2000
                            })
                            var data = JSON.parse(ress.data);
                            console.log(ress);
                            that.setData({//存值
                                q_url:data.key,
                            })
                            that.release_work(data.key);
                        },
                        fail: function(ress){
                            console.log("。。录音保存失败。。");
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
        wx.request({
            url: config.URL + "muse/works/savev2",
            data: data,
            method: 'post',
            header: {
                'content-type': 'application/x-www-form-urlencoded',
            },
            success: function (res) {
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
      console.log(this.data.audioCtx);
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
      
    }
});
