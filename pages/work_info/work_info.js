//index.js
//获取应用实例
const config = require('../../config.js');
const md5 = require('../../utils/md5.js');
const util = require('../../utils/util.js');
const app = getApp();
const recorderManager = wx.getRecorderManager();
const innerAudioContext = wx.createInnerAudioContext();
Page({
  data: {
    work_info:[],
    share_title:"寻声朗读",
    share_url:"",
    share_image:"http://resource.xunsheng.org.cn/20190727175250-task-cover-283.JPG",
    audioCtx:[],
    grade_arr:['','D','C','B','A','S'],
    is_play: 0,
    play_miuse_id: '',
    form_grade : '',
    form_score :0,
    hasright:0,
    recordingTimeqwe: 0,
    miuse_state: 1,
    miuse_url: '',
    setInter: "",//录音名称
    strat: false,
    form_yd:'', // 优点
    form_tsd:'',// 提升点
    form_xl:'', // 训练
    is_apply:'',
    apply_content:'',
    apply_count:0,
    next_apply:0,
    minute: '0' + 0,   // 分
    second: '0' + 0,    // 秒
  },
  onLoad: function (options) {
      var token = wx.getStorageSync("token");
      var member_id = wx.getStorageSync("member_id");
      var work_id = options.work_id;
      if (!work_id){
        work_id = wx.getStorageSync("work_id")
      }
      // work_id = 188533;
      wx.setStorageSync('work_id', work_id);
      if(!token){
          wx.redirectTo({
              url: '../login/login?type=work_info'
          })
      }else{
        this.getworkinfo();
        this.hasright();
        this.animation = wx.createAnimation()
        this.is_apply_work();
      }
  },
  // 获取作品详情
  getworkinfo:function(){
    var that = this;
    app.show_l(that);
    var ts = Date.parse(new Date());
    var data = {
      member_id: wx.getStorageSync("member_id"),
      token: wx.getStorageSync("token"),
      works_id: wx.getStorageSync("work_id"),
      ts:ts
    };
    var cs = app.encryption(data);
    data.cs = cs;
    wx.request({
      url: config.URL + "muse/works/detail",
      data: data,
      method: 'post',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      success: function (res) {
        app.hide_l(that);
        if (res.data.code == 200) {
            var works_detail = res.data.data.works_detail;
            var date = new Date();
            works_detail.create_time = util.formatTimeTwo(works_detail.create_time,'Y-M-D h:m:s');
            if (works_detail.cover_img){
                that.setData({//存值
                  share_image: works_detail.cover_img,
                })
            }
            that.setData({//存值
                 work_info: res.data.data.works_detail,
            })

          if (res.data.data.works_detail.class_info && res.data.data.works_detail.member_id == wx.getStorageSync("member_id")){
            that.setData({//存值
              is_apply: 1,
            })
          }else{
            that.setData({//存值
              is_apply: 0,
            })
          }
        }
      }
    })
  },
  onShareAppMessage: function(res) {

    var share_url = "/pages/work_info/work_info?work_id=" + wx.getStorageSync('work_id')+"&parent_id="+wx.getStorageSync("member_id");
  
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
  bf(e) {
    if (this.data.is_play == 1) {
      this.audioCtx.pause();
      this.setData({
        is_play: 0,
      })
    } else {
      this.audioCtx.play();
      this.setData({
        is_play: 1,
      })
    }
  },
  end_play() {
    this.setData({
      is_play: 0,
      play_miuse_id: ''
    })
  },
  // 播放音频
  play_miuse(e) {
    var miuse_id = e.target.id;
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
        this.data.audioCtx[miuse_id] = wx.createAudioContext(miuse_id)
      }
      this.data.audioCtx[miuse_id].play();
      this.setData({
        is_play: 1,
        play_miuse_id: miuse_id
      })
    }
  },
  // 选择评星
  select_score(e){
    var id = e.detail;  //星星数
    var score = id*20;
    let form_grade=this.data.grade_arr[id];
//    if(id== "S"){
//      score = 100;
//    } else if (id == "A"){
//      score = 80;
//    } else if (id == "B") {
//      score = 60;
//    } else if (id == "C") {
//      score = 40;
//    } else if (id == "D") {
//      score = 20;
//    }
    this.setData({
      form_grade: form_grade,
      form_score: score
    })
  },
  // 隐藏点评框
  comment_hide(){
    console.log(0);
    this.animation.translateY(800).step({ duration: 300 })
    this.setData({ animation: this.animation.export() })
  },
  // 显示点评框
  comment_show(){
      console.log(1);
      this.animation.translateY(0).step({ duration: 300 })
      this.setData({ animation: this.animation.export() })
  },
  // 查询当前用户是否有评论权限
  hasright(){
    var that = this;  
    var ts = Date.parse(new Date());
    var data = {
      member_id: wx.getStorageSync("member_id"),
      token: wx.getStorageSync("token"),
      work_id: wx.getStorageSync("work_id"),
      ts: ts
    };
    var cs = app.encryption(data);
    data.cs = cs;
    wx.request({
      url: config.URL + "school/classwork/hasright",
      data: data,
      method: 'post',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      success: function (res) {
         if(res.data.code == 200){ //
            if (res.data.data.hasright){
                that.setData({
                  hasright:1
                })
            }
         }
      }
    })
  },
  get_form_info(e){
    var id = e.target.id;
    var value = e.detail.value;
    if (id == "yd"){
       this.setData({
         form_yd: value
       });
    } else if (id == "tsd"){
      this.setData({
        form_tsd: value
      });
    } else if (id == "xl") {
      this.setData({
        form_xl: value
      });
    } else if (id == "score"){
      var grade = "";
      value = parseInt(value);
      if (value > 0 && value <= 70){
         grade = "D"; 
      } else if (value >= 71 && value <= 79) {
        grade = "C";
      } else if(value >= 80 && value <= 89){
        grade = "B";
      } else if(value >= 90 && value <= 94){
        grade = "A";
      } else if(value >= 95 && value <= 100){
        grade = "S";
      } else if (value > 100){
        grade = "S";
        value = 100;
      } else if (value < 0) {
        grade = "D";
        value = 0;
      }else{
        return;
      }
      this.setData({
        form_score: value,
        form_grade: grade
      });
    }
  },
  //开始录音
  openRecording: function () {
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
      that.setData({//存值
        miuse_state: 2,
        strat: true,
        miuse_url: '',
        recordingTimeqwe:0,
        minute: '0' + 0,   // 分
        second: '0' + 0,    // 秒
      })
      //开始录音计时
      that.recordingTimer();
      that.timesetInterval();
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
  recordingTimer: function () {
    var that = this;
    //将计时器赋值给setInter
    that.data.setInter = setInterval(
      function () {
        if (that.data.strat) {
          var time = that.data.recordingTimeqwe + 1;
          that.setData({
            recordingTimeqwe: time
          })
        }
      }
      , 1000);
  },
  //结束录音
  shutRecording: function () {
    var that = this;
    wx.showToast({
      title: '停止录音',
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
        miuse_url: res.tempFilePath,
        strat: false,
        miuse_state: 1,
        tempFilePath: res
      })
    })
  },
  submit_from(qiniu_url){
    var that = this;
    app.show_l(that);
    var ts = Date.parse(new Date());
    var data = {
      member_id: wx.getStorageSync("member_id"),
      token: wx.getStorageSync("token"),
      teacher_comment: '优点：' + that.data.form_yd + '\r\n提升点:' + that.data.form_tsd +'\r\n训练方法:'+that.data.form_xl,
      voice_url: qiniu_url,
      grade:that.data.form_grade,
      score:that.data.form_score,
      work_id: wx.getStorageSync("work_id"),
      duration: that.data.recordingTimeqwe,
      ts: ts
    };
    var cs = app.encryption(data);
    data.cs = cs;
    wx.request({
      url: config.URL + "fa/Xspaycomment/apply_comment",
      data: data,
      method: 'post',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      success: function (res) {
        app.hide_l(that);
        if (res.data.code == 200) {
          wx.showToast({
            title: '点评成功',
            icon: 'none',
            duration: 1500,
          });
          that.getworkinfo();
          that.onLoad();
          that.comment_hide();
          wx.redirectTo({
            url: '../work_info/work_info'
          })
        }else{
          wx.showToast({
            title: res.data.error,
            icon: 'none',
            duration: 1500,
          });
        }
      }
    })
    
  },
  // 获取七牛云参数
  get_qiniu_info: function () {
    var that = this;
    if (!that.data.miuse_url){
      //结束录音计时 
      clearInterval(that.data.setInter);
      clearInterval(that.data.setInter1);
      recorderManager.stop();
      recorderManager.onStop((res) => {
        this.tempFilePath = res.tempFilePath;
        that.setData({//存值
          miuse_url: res.tempFilePath,
          strat: false,
          miuse_state: 1,
          tempFilePath: res
        })
      })
    }
    if (!that.data.form_yd && !that.data.form_tsd && !that.data.form_xl) {
      wx.showToast({
        title: '未填写点评内容',
        icon: 'none',
        duration: 1500,
      });
      return;
    } else if (that.data.recordingTimeqwe < 30) {
      wx.showToast({
        title: '点评语音需要大于30秒',
        icon: 'none',
        duration: 1500,
      });
      return;
    } else if (!that.data.form_grade) {
      wx.showToast({
        title: '请选择评分',
        icon: 'none',
        duration: 1500,
      });
      return;
    }
    
    var ts = Date.parse(new Date());
    var data = {
      member_id: wx.getStorageSync("member_id"),
      token: wx.getStorageSync("token"),
      device_id: 9999,
      suffix: "MP3",
      ts: ts
    };
    console.log(that.data.miuse_url);
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
        if (res.data.code == 200) {
          //上传录音
          wx.uploadFile({
            url: config.QIUNIU_URL,//这是你自己后台的连接
            filePath: that.data.miuse_url,
            name: "file",//后台要绑定的名称
            header: {
              "Content-Type": "multipart/form-data"
            },
            //参数绑定
            formData: {
              token: res.data.data.upToken,
              fileName: res.data.data.key,
            },
            dataType: 'JSON',
            success: function (ress) {
              var data = JSON.parse(ress.data);
              console.log(ress);
              that.setData({//存值
                q_url: data.key,
              })
              that.submit_from(data.key);
            },
            fail: function (ress) {
              wx.showToast({
                title: '录音保存失败',
                icon: 'none',
                duration: 1500,
              });
            }
          })
        }
      }
    })
  },
  // 判断当前作品是否是点评作品
  is_apply_work:function(){
      var that = this;
      var ts = Date.parse(new Date());
      var data = {
        member_id: wx.getStorageSync("member_id"),
        token: wx.getStorageSync("token"),
        work_id: wx.getStorageSync("work_id") ,
        ts: ts
      };
      var cs = app.encryption(data);
      data.cs = cs;
      wx.request({
        url: config.URL + "fa/Xspaycomment/is_apply_work",
        data: data,
        method: 'post',
        header: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        success: function (res) {
          if (res.data.code == 200) {
            if (res.data.data.untreated_count > 0 ){
              that.setData({//存值
                apply_count: res.data.data.untreated_count,
                next_apply: res.data.data.nep_work
              })
            }
            var html = "";
            for (var i = 0; i < res.data.data.tutor_info.length; i++) {
              if (!html) {
                html += "此作品申请" + res.data.data.tutor_info[i].name;
              } else {
                html += "," + res.data.data.tutor_info[i].name;
              }

            }
            if (html) {
              html += '老师进行点评指导';
            }else{
              html = "";
            }
            that.setData({//存值
              apply_content: html
            })
          }
        }
      })
  },
  next_work:function(){
    if (this.data.next_apply){
      wx.setStorageSync('work_id', this.data.next_apply);
    }
    this.getworkinfo();
    this.hasright();
    this.is_apply_work();
  },
  timesetInterval() {
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
  }
});
