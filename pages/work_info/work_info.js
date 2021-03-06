//index.js
//获取应用实例
const config = require('../../config.js');
const md5 = require('../../utils/md5.js');

const util = require('../../utils/util.js');
const app = getApp();
const recorderManager = wx.getRecorderManager();
// const innerAudioContext = wx.createInnerAudioContext();
let innerAudioContext = null;

Page({
  data: {
    work_info: [],
    share_title: "寻声朗读",
    share_url: "",
    share_image: "https://resource.xunsheng.org.cn/xsds_banner.png",
    audioCtx: [],
    grade_arr: ['', 'D', 'C', 'B', 'A', 'S'],
    is_play: 0,
    play_miuse_id: '',
    loadding:false,
    form_grade: '',
    loading:true,
    form_score: 0,
    form_star_count: 0, //星星数量
    hasright: 0,
    recordingTimeqwe: 0,
    miuse_state: 1,
    miuse_url: '',
    setInter: "",//录音名称
    strat: false,
    form_yd: '', // 优点
    form_tsd: '',// 提升点
    form_xl: '', // 训练
    is_apply: '',
    apply_content: '',
    apply_count: 0,
    //底部评论音频
    // isPlay: [false, false, false, false, false, false, false, false],
    // playTime: [0, 0, 0, 0, 0, 0, 0, 0],
    // typeId: null,
    // seekArry: [0, 0, 0, 0, 0, 0, 0, 0],
    //
    next_apply: 0,
    minute: '0' + 0,   // 分
    second: '0' + 0,    // 秒
    my_work: false,
    show_grade_tip: false, //五星好评提示
    comment_yd: [], // 提升点范文
    yd_template: false,
    comment_tsd: [], // 提升点范文
    tsd_template: false,
    comment_xlff: [], // 提升点范文
    xlff_template: false,
    user_info: [],
    submit_state: 1,
    tea_show: false,
    history_work_list: [],
    work_id: 0,
    reread: 1,
    member_id: 0,
    //音频
    isPlayAudio: true,
    // audioSeek: 0,
    // audioDuration: 0,
    showTime1: 0,
    // showTime2: '00:00',
    // audioTime: 0,
    // videoUrl: '',
  },
  onUnload: function () {
    this.stop_miuse_one();
    console.log(123)
  },
  onLoad: function (options) {

    innerAudioContext = wx.createInnerAudioContext();
    innerAudioContext.onSeeked(res => {
      console.log(res)
    });
    innerAudioContext.onSeeking(res => {
      console.log(232)
    })
    var token = wx.getStorageSync("token");
    var member_id = wx.getStorageSync("member_id");
    var work_id = '';
    if (!options.work_id) {
      var work_id = wx.getStorageSync("work_id");
    } else {
      var work_id = options.work_id;
    }
    //work_id = 56803;
    this.setData({
      work_id: work_id,
      member_id: member_id
    });
    wx.setStorageSync('work_id', work_id);
    if (!token) {
      wx.redirectTo({
        url: '../login/login?type=work_info'
      })
    } else {
      this.getworkinfo();
      this.hasright();
      this.animation = wx.createAnimation()
      this.getMembers();
    }
    if (options.showShareTip == '1') {
      wx.showModal({
        title: '温馨提示',
        content: '点击转发作品分享至微信班级群，提醒导师及时点评；如需查看点评进度，请进入个人中心->我的点评查看。',
        showCancel: false,
        confirmText: '我知道了',
        success: (res) => {
          if (res.confirm) {
          }
        }
      })
    }
  },
  onPlayEvent(e) {
    console.log("event", e.detail)
    if(e.detail.pid!='p99'){
      this.selectComponent("#p99").pause()
    }
    let id=e.detail.pid.split('p')[1]
    console.log(this.data.work_info.teacher_comment_list.length)
    for(let i=0;i<this.data.work_info.teacher_comment_list.length;i++){
      console.log(1)
      if(i!==e.detail.pid&&this.data.work_info.teacher_comment_list[i].voice_comment){
        console.log(this.data.work_info.teacher_comment_list[i].voice_comment)

        this.selectComponent("#"+"p" + i).pause()
      }
    }
  },
  onPullDownRefresh: function () {
    wx.stopPullDownRefresh();
    this.getworkinfo();
    this.hasright();
  },
  // 获取作品详情
  getworkinfo: function () {
    var that = this;
    app.show_l(that);
    var ts = Date.parse(new Date());
    var data = {
      member_id: wx.getStorageSync("member_id"),
      token: wx.getStorageSync("token"),
      works_id: wx.getStorageSync("work_id"),
      ts: ts
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
          if (works_detail.task_info && works_detail.class_info) {
            var tid = works_detail.task_info.task_id;
            var cid = works_detail.class_info.class_id;
            var mid = works_detail.author_id;
            that.classworkslist(tid, cid, mid);
          }
          var audio_name = works_detail.author_name + "           " + app.timeToFormat(works_detail.duration);
          that.setData({
            audio_name: audio_name,
            loading:false
          });
          var date = new Date();
          works_detail.create_time = util.formatTimeTwo(works_detail.create_time, 'Y-M-D h:m:s');
          // if (works_detail.cover_img && !that.data.share_image){
          //     that.setData({//存值
          //       share_image: works_detail.cover_img,
          //     })
          // }
          if (!that.data.share_title) {
            that.setData({//存值
              share_title: works_detail.works_name + " " + works_detail.author + " " + util.formatTimeTwo(works_detail.duration, 'm:s')
            })
          }
          if (res.data.data.works_detail.class_info && res.data.data.works_detail.class_info.class_name) {
            wx.setNavigationBarTitle({
              title: res.data.data.works_detail.class_info.class_name
            })
          }
          that.setData({//存值
            work_info: res.data.data.works_detail,
          })

          if (res.data.data.works_detail.class_info && res.data.data.works_detail.member_id == wx.getStorageSync("member_id")) {
            that.setData({//存值
              is_apply: 1,
            })
          } else {
            that.setData({//存值
              is_apply: 0,
            })
          }
          if (works_detail.member_id == wx.getStorageSync("member_id")) { // 当前作品是我的作品
            that.setData({
              my_work: true
            });

            //5星奖励提示
            if (works_detail.teacher_comment_list.length > 0) {
              var teacher_comment_arr = [];
              works_detail.teacher_comment_list.forEach(item => {
                if (item.grade === 'S') {
                  teacher_comment_arr.push(item.comment_id);
                }
              })
              var max_comment_id = teacher_comment_arr.length > 0 ? Math.max.apply(null, teacher_comment_arr) : '';
              var storage_comment_id = wx.getStorageSync('show_teacher_comment_' + wx.getStorageSync("work_id"));
              if ((max_comment_id && !storage_comment_id) || (max_comment_id && storage_comment_id && max_comment_id > storage_comment_id)) {
                that.setData({
                  show_grade_tip: true
                })
                wx.setStorageSync('show_teacher_comment_' + wx.getStorageSync("work_id"), max_comment_id);
                //                wx.showModal({
                //                  title:'温馨提示',
                //                  content:'恭喜你作品获得5星好评',
                //                  showCancel:false,
                //                  confirmText:'我知道了',
                //                  success:(res) =>{
                //                    if(res.confirm){
                //                      wx.setStorageSync('show_teacher_comment',max_comment_id);
                //                    }
                //                  }
                //                });
              }
            }
          }
          that.is_apply_work();
        } else if (res.data.msg == "用户认证不通过") {
          wx.setStorageSync('member_id', '');
          wx.setStorageSync('token', '');
          wx.redirectTo({
            url: '../login/login?type=index'
          })
        } else if (res.data.msg == "获取作品失败") {
          wx.showToast({
            title: '获取作品失败',
            icon: 'none',
            duration: 1500,
          });
          that.setData({
            loading: true
          });
          setTimeout(function () {
            wx.redirectTo({
              url: '../index/index'
            })
          }, 1800)

        }
      }
    })
  },
  onShareAppMessage: function (res) {

    var share_url = "/pages/work_info/work_info?work_id=" + wx.getStorageSync('work_id') + "&parent_id=" + wx.getStorageSync("member_id");
    console.log(this.data.share_title);
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
    this.stop_miuse_one();
    var url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: url,
    })
  },
  //跳转首页
  jump_index(e) {
    this.stop_miuse_one();
    var url = e.currentTarget.dataset.url;
    wx.redirectTo({
      url: '../index/index?index_tab=' + url,
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
  myevent(e) {
    // 这里就是子组件传过来的内容了
    let showTime1=parseInt(e.detail.params.thatTime) 
console.log(e)
if(!e.detail.params.paused){
this.setData({
  loadding:false
})
}
    this.setData({
      showTime1:showTime1,
      isPlayAudio:e.detail.params.paused,
      audioTime:e.detail.params.value,
    })
      console.log(e.detail.params)
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
  select_score(e) {
    var id = e.detail;  //星星数
    var score = id * 20;
    if (this.data.grade_arr[id] == "S") {
      score = 100;
    } else if (this.data.grade_arr[id] == "A") {
      score = 94;
    } else if (this.data.grade_arr[id] == "B") {
      score = 89;
    } else if (this.data.grade_arr[id] == "C") {
      score = 79;
    } else if (this.data.grade_arr[id] == "D") {
      score = 70;
    }
    this.setData({
      form_grade: this.data.grade_arr[id],
      form_score: score,
      form_star_count: id
    })
  },
  // 隐藏点评框
  comment_hide() {
    // 停止录音
    var that = this;
    //结束录音计时 
    clearInterval(that.data.setInter);
    clearInterval(that.data.setInter1);
    recorderManager.stop();
    recorderManager.onStop((res) => {
      wx.showToast({
        title: '录制完成',
        icon: 'none',
        duration: 1500,
      })
      this.tempFilePath = res.tempFilePath;
      that.setData({//存值
        miuse_url: res.tempFilePath,
        strat: false,
        miuse_state: 1,
        tempFilePath: res
      })
    })
    this.animation.translateY(800).step({ duration: 300 })
    this.setData({ animation: this.animation.export() })
  },
  // 显示点评框
  comment_show() {
    this.animation.translateY(0).step({ duration: 300 })
    this.setData({ animation: this.animation.export() })
    // 暂停音频
    let t=this
    t.selectComponent("#p99").pause()
    for(let i=0;i<t.data.work_info.teacher_comment_list.length;i++){
      console.log(1)
      if(t.data.work_info.teacher_comment_list[i].voice_comment){
        console.log(t.data.work_info.teacher_comment_list[i].voice_comment)
        t.selectComponent("#"+"p" + i).pause()
      }
    }
  },
  // 查询当前用户是否有评论权限
  hasright() {
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
        if (res.data.code == 200) { //
          if (res.data.data.hasright) {
            that.setData({
              hasright: 1
            })
            // 查询评论模板

          }
          that.get_commont_tpl();
        }
      }
    })
  },
  get_form_info(e) {
    var id = e.target.id;
    var value = e.detail.value;
    if (id == "yd") {
      this.setData({
        form_yd: value
      });
    } else if (id == "tsd") {
      this.setData({
        form_tsd: value
      });
    } else if (id == "xl") {
      this.setData({
        form_xl: value
      });
    } else if (id == "score") {
      var grade = "";
      value = parseInt(value);
      if (value > 0 && value <= 70) {
        grade = "D";
      } else if (value >= 71 && value <= 79) {
        grade = "C";
      } else if (value >= 80 && value <= 89) {
        grade = "B";
      } else if (value >= 90 && value <= 94) {
        grade = "A";
      } else if (value >= 95 && value <= 100) {
        grade = "S";
      } else if (value > 100) {
        grade = "S";
        value = 100;
      } else if (value <= 0) {
        grade = "";
        value = 0;
      } else {
        return;
      }
      this.setData({
        form_score: value,
        form_grade: grade,
        form_star_count: this.data.grade_arr.indexOf(grade)
      });
    }
  },
  //开始录音
  openRecording: function () {
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
      that.setData({//存值
        miuse_state: 2,
        strat: true,
        miuse_url: '',
        recordingTimeqwe: 0,
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
    // recorderManager.onError((res) => {
    //   console.log(res);
    //   wx.showToast({
    //     title: '录音失败',
    //     icon: 'none',
    //     duration: 1500,
    //   })
    // })
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
        miuse_url: res.tempFilePath,
        strat: false,
        miuse_state: 1,
        tempFilePath: res
      })
    })
  },
  submit_from(qiniu_url) {
    var that = this;
    //app.show_l(that);
    var ts = Date.parse(new Date());
    var data = {
      member_id: wx.getStorageSync("member_id"),
      token: wx.getStorageSync("token"),
      teacher_comment: '优点：' + that.data.form_yd + '\r\n提升点:' + that.data.form_tsd + '\r\n训练方法:' + that.data.form_xl,
      voice_url: qiniu_url,
      grade: that.data.form_grade,
      score: that.data.form_score,
      work_id: wx.getStorageSync("work_id"),
      duration: that.data.recordingTimeqwe,
      reread: that.data.reread,
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
          var content = that.data.work_info.works_name + ' ' + that.data.work_info.author + ' ' + util.formatTimeTwo(that.data.work_info.duration, 'm:s') + ' ' + that.data.user_info.name + '点评了该作品';
          console.log(content);
          that.setData({//存值
            share_image: 'https://resource.xunsheng.org.cn/xcxshare_dp.png',
            share_title: content,
            form_yd: '',
            form_tsd: '',
            form_xl: '',
            form_grade: '',
            form_star_count: 0,
            miuse_state: 1,
            strat: true,
            miuse_url: '',
            recordingTimeqwe: 0,
            minute: '0' + 0,   // 分
            second: '0' + 0,    // 秒
            form_score: 0
          })
          that.getworkinfo();
          that.is_apply_work();
          that.onLoad({ work_id: wx.getStorageSync("work_id") });
          that.comment_hide();
          wx.showModal({
            title: '温馨提示',
            content: '分享至微信班级群，提示学生查看点评内容',
            showCancel: false,
            confirmText: '我知道了',
            success: (res) => {
              if (res.confirm) {

              }
            }
          })
        } else {
          wx.showToast({
            title: res.data.error,
            icon: 'none',
            duration: 1500,
          });
        }
        that.setData({
          submit_state: 1
        });
      }
    })

  },
  // 获取七牛云参数
  get_qiniu_info: function () {
    var that = this;
    if (!that.data.submit_state) {
      return false;
    } else {
      this.setData({
        submit_state: 0
      })
    }
    if (!that.data.miuse_url && that.data.recordingTimeqwe) {
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
          tempFilePath: res,
          submit_state: 1
        })
        that.get_qiniu_info();
      })
      return false;
    }

    if (!that.data.form_yd && !that.data.form_tsd && !that.data.form_xl) {
      wx.showToast({
        title: '未填写点评内容',
        icon: 'none',
        duration: 1500,
      });
      that.setData({
        submit_state: 1
      });
      return;
    } else if (that.data.recordingTimeqwe <= 30) {
      wx.showToast({
        title: '点评语音需要大于30秒',
        icon: 'none',
        duration: 1500,
      });
      that.setData({
        submit_state: 1
      });
      return;
    } else if (!that.data.form_grade) {
      wx.showToast({
        title: '请选择评分',
        icon: 'none',
        duration: 1500,
      });
      that.setData({
        submit_state: 1
      });
      return;
    }
    app.show_l(that);
    var ts = Date.parse(new Date());
    var data = {
      member_id: wx.getStorageSync("member_id"),
      token: wx.getStorageSync("token"),
      device_id: 9999,
      suffix: "MP3",
      ts: ts
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
              that.setData({//存值
                q_url: data.key,
              })
              that.submit_from(data.key);
            },
            fail: function (ress) {
              app.hide_l(that);
              wx.showToast({
                title: '录音保存失败',
                icon: 'none',
                duration: 1500,
              });
              that.setData({
                submit_state: 1
              });
            }
          })
        } else {
          app.hide_l(that);
          that.setData({
            submit_state: 1
          });
        }
      }
    })
  },
  // 判断当前作品是否是点评作品
  is_apply_work: function () {
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
      url: config.URL + "fa/Xspaycomment/is_apply_work",
      data: data,
      method: 'post',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      success: function (res) {
        if (res.data.code == 200) {
          if (res.data.data.untreated_count > 0) {
            that.setData({//存值
              apply_count: res.data.data.untreated_count,
              next_apply: res.data.data.nep_work
            })
          } else {
            that.setData({//存值
              apply_count: 0,
              next_apply: 0
            })
          }
          var html = "";
          var names = ""
          for (var i = 0; i < res.data.data.tutor_info.length; i++) {
            if (!html) {
              html += "此作品申请" + res.data.data.tutor_info[i].name;
              names += res.data.data.tutor_info[i].name;
            } else {
              html += "," + res.data.data.tutor_info[i].name;
              names += "," + res.data.data.tutor_info[i].name;
            }

          }
          if (html) {
            html += '老师进行点评指导';
          } else {
            html = "";
          }
          that.setData({//存值
            apply_content: html
          })
          if (html && that.data.my_work) {
            console.log(11);
            that.setData({//存值
              share_image: 'https://resource.xunsheng.org.cn/xcxshare_dpw.png',
              share_title: that.data.work_info.works_name + ' ' + that.data.work_info.author + " " + util.formatTimeTwo(that.data.work_info.duration, 'm:s') + ' 申请' + names + '老师点评',
            })
          }

        }
      }
    })
  },

  next_work: function () {
    if (this.data.next_apply) {
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
  },
  //隐藏五星好评提示
  hideGradeTip() {
    this.setData({
      show_grade_tip: false
    })
  },
  stop_miuse_one() {
    var that = this;
    if (this.data.play_miuse_id) { // 当前音频正在播放
      this.data.audioCtx[this.data.play_miuse_id].pause();
      this.setData({
        is_play: 0,
        play_miuse_id: ''
      })
    }
  },
  radioChange: function (e) {
    var checked = e.detail.value
    var changed = {}
    var type = e.currentTarget.dataset.type;
    if (type == 1) {
      for (var i = 0; i < this.data.comment_yd.length; i++) {
        if (checked.indexOf(this.data.comment_yd[i].name) !== -1) {
          this.setData({
            form_yd: this.data.comment_yd[i].value
          })
          changed['comment_yd[' + i + '].checked'] = true
        } else {
          changed['comment_yd[' + i + '].checked'] = false
        }
      }
      this.setData(changed)
    } else if (type == 2) {
      for (var i = 0; i < this.data.comment_tsd.length; i++) {
        if (checked.indexOf(this.data.comment_tsd[i].name) !== -1) {
          this.setData({
            form_tsd: this.data.comment_tsd[i].value
          })
          changed['comment_tsd[' + i + '].checked'] = true
        } else {
          changed['comment_tsd[' + i + '].checked'] = false
        }
      }
      this.setData(changed)
    } else if (type == 3) {
      for (var i = 0; i < this.data.comment_xlff.length; i++) {
        if (checked.indexOf(this.data.comment_xlff[i].name) !== -1) {
          this.setData({
            form_xl: this.data.comment_xlff[i].value
          })
          changed['comment_xlff[' + i + '].checked'] = true
        } else {
          changed['comment_xlff[' + i + '].checked'] = false
        }
      }
      this.setData(changed)
    }

  },
  template(e) {
    return;
    var type = e.currentTarget.dataset.type;
    if (type == 1) {
      this.setData({
        yd_template: true,
        tsd_template: false,
        xlff_template: false
      })
    } else if (type == 2) {
      this.setData({
        yd_template: false,
        tsd_template: true,
        xlff_template: false
      })
    } else if (type == 3) {
      this.setData({
        yd_template: false,
        tsd_template: false,
        xlff_template: true
      })
    }
  },
  get_commont_tpl() {
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
      url: config.URL + "fa/Xspaycomment/get_comment_tpl",
      data: data,
      method: 'post',
      header: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      success: function (res) {
        if (res.data.code == 200) { //
          var tsd_list = [];
          var xlff_list = [];
          var yd_list = [];
          for (var i = 0; i < res.data.data.comment_tsd.length; i++) {
            tsd_list.push(
              { name: res.data.data.comment_tsd[i], value: res.data.data.comment_tsd[i] },
            );
          }
          for (var i = 0; i < res.data.data.comment_xlff.length; i++) {
            xlff_list.push(
              { name: res.data.data.comment_xlff[i], value: res.data.data.comment_xlff[i] },
            );
          }
          for (var i = 0; i < res.data.data.comment_yd.length; i++) {
            yd_list.push(
              { name: res.data.data.comment_yd[i], value: res.data.data.comment_yd[i] },
            );
          }
          that.setData({
            comment_yd: res.data.data.comment_yd,
            comment_tsd: res.data.data.comment_tsd,
            comment_xlff: res.data.data.comment_xlff
          })

        }
      }
    })
  },
  // 查询我的信息
  getMembers() {
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

          that.setData({
            user_info: res.data.data
          });
        }
      }
    })
  },
  bindPickerChange: function (e) {
    this.setData({
      form_yd: this.data.form_yd + " " + this.data.comment_yd[e.detail.value]
    })
  },
  bindtsdChange: function (e) {
    this.setData({
      form_tsd: this.data.form_tsd + " " + this.data.comment_tsd[e.detail.value]
    })
  },
  bindxlffChange: function (e) {
    this.setData({
      form_xl: this.data.form_xl + " " + this.data.comment_xlff[e.detail.value]
    })
  },
  classworkslist: function (tid, cid, mid) {
    var that = this;
    app.show_l(that);
    var ts = Date.parse(new Date());
    var data = {
      member_id: wx.getStorageSync("member_id"),
      token: wx.getStorageSync("token"),
      page: 1,
      page_size: 10,
      class_id: cid,
      student_member_id: mid,
      task_id: tid,
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
        if (res.data.code == 200) {
          var list = res.data.data;
          for (var i = 0; i < list.length; i++) {
            list[i].duration = app.timeToFormat(list[i].duration);
          }
          that.setData({
            history_work_list: list
          })
        }
      }
    })
  },
  //跳转个人中心
  work_switch(e) {
    var that = this;
    var work_id = e.currentTarget.dataset.url;
    // 停止音频
    this.stop_miuse_one();
    // 回到顶部
    wx.pageScrollTo({
      scrollTop: 0
    })
    this.setData({
      work_id: work_id
    });
    wx.setStorageSync('work_id', work_id);
    this.getworkinfo();
    this.hasright();
    this.animation = wx.createAnimation()
    this.getMembers();
  },
  // 修改导师点评状态
  rChange: function (e) {
    var val = e.detail.value;
    if (val) {
      this.setData({
        reread: val
      });
    }
  },
  // 跳转文稿详情
  jump_test: function () {
    this.stop_miuse_one();
    var task_id = this.data.work_info.task_info.task_id;
    wx.navigateTo({
      url: '../release/release?task_id=' + task_id
    })
  },
  start(e){
    this.selectComponent("#p99").start()

  },
  sliderChange(e){
    console.log(e.detail.value)
    this.setData({
      loadding:true
    })
    this.selectComponent("#p99").seeks(e.detail.value)

  },
  playMyRadio(){
    console.log(this.selectComponent("#p99"))
    this.setData({
      loadding:true
    })
    this.selectComponent("#p99").play()
  },
  stopAudio(){
    this.selectComponent("#p99").pause()
  },
  onUnload: function () {
    console.log('AAAA')
    this.selectComponent("#p99").pause()
    for(let i=0;i<this.data.work_info.teacher_comment_list.length;i++){
      console.log(i)
        console.log(this.data.work_info.teacher_comment_list[i].voice_comment)
        this.selectComponent("#"+"p" + i).pause()
    }
  },
  onHide:function(){

  },
  onShow: function () {
  },
});