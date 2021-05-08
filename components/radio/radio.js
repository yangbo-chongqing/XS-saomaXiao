// components/audio-player/audio-player.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    pid:String,
    url:{type:String,observer:function(newValue,oldValue){
      this.data.innerAudioContext.src=this.properties.url

    }},
    myDuration:Number
  },

  /**
   * 组件的初始数据
   */
  data: {
    innerAudioContext: null,
    waitFlag: false,
    duration: 0,
    percentage: "0%",
    status: "",
    value:0,
    thatTime:0,
    paused: true, // 默认都是暂停
    seeking: false, // 跳转
    seekPlay:true,
  },
  observers:{
    'value':function(num){
      console.log(num)
      console.log('变化')
      let t=this

      t.triggerEvent('myevent',{params: {'value':num,'paused':t.data.paused,'thatTime':t.data.thatTime}},{})

    },
    'paused':function(name){
      console.log('暂停')
      let t=this
      t.triggerEvent('myevent',{params: {'value':t.data.value,'paused':name,'thatTime':t.data.thatTime}},{})
    },
    'thatTime':function(name){
      console.log('时间变化')
      let t=this
      t.triggerEvent('myevent',{params: {'value':t.data.value,'paused':t.data.paused,'thatTime':name}},{})
    },
  },
  created(){
    const innerAudioContext = wx.createInnerAudioContext()
    innerAudioContext.autoplay = false
    console.log(this.properties.url)
     innerAudioContext.src=this.properties.url

    innerAudioContext.onPlay(() => {
      if(this.data.paused){
        this.setData({
          paused: false
        })
        console.log(innerAudioContext.paused)
      }
      console.log('开始播放')
    })

    innerAudioContext.onPause(()=>{
      if(!this.data.paused){
        this.setData({
          paused: true,
          seeking: false
        })
      }
    })

    innerAudioContext.onStop(()=>{
      if(!this.data.paused){
        this.setData({
          paused: true,
          seeking: false
        })
      }
    })

    innerAudioContext.onEnded(()=>{
      if(!this.data.paused){
        this.setData({
          paused: true
        })
      }
    })

    innerAudioContext.onError((res) => {
      console.log(res.errMsg)
      console.log(res.errCode)
    })

    innerAudioContext.onCanplay((res)=>{
      if(this.data.waitFlag){
        this.setData({
          waitFlag: false
        })
      }
      this.setData({
        duration: innerAudioContext.duration
      })
      console.log("暂停状态",innerAudioContext.paused) 
      console.log("可以播放了");
    })

    innerAudioContext.onWaiting((res)=>{
      this.setData({
        waitFlag: true
      })
      console.log("数据不足，正在加载中")
    })
    innerAudioContext.onTimeUpdate((res)=>{
      // console.log("正在播放中",innerAudioContext.currentTime/innerAudioContext.duration * 100)
      console.log(innerAudioContext.currentTime)
      let thatTime=parseInt(innerAudioContext.currentTime) 
      let time=parseInt(innerAudioContext.currentTime/innerAudioContext.duration * 100)
      console.log(time)
      if(this.data.seekPlay){
        this.setData({
        value:time,
        thatTime:thatTime
        })
      }
      this.setData({
        percentage: (innerAudioContext.currentTime/innerAudioContext.duration * 100)+"%"
      })
      console.log(this.data.value)
    })
    innerAudioContext.onSeeking(()=>{
      console.log(innerAudioContext.paused)

      this.setData({
        seeking: true,
        seekPlay:false,
        innerAudioContext:innerAudioContext,
      })
      if(this.data.innerAudioContext.duration>100){
        this.play()
      }
      console.log(this.data.innerAudioContext)
    })

    innerAudioContext.onSeeked(()=>{
      console.log(innerAudioContext.paused)

      this.setData({
        seeking: false,
        seekPlay:true,
      })
      this.play()
      console.log(innerAudioContext.paused)
    })

    console.log("初始化完毕");
    this.setData({
      innerAudioContext:innerAudioContext
    });
    console.log(this.data.innerAudioContext)
  },
  /**
   * 组件的方法列表
   */
  methods: {
    play(){
      console.log(!this.data.paused)
      if(!this.data.paused){
        return;
      }
      this.triggerEvent("play", {pid:this.properties.pid}, {})
      // this.data.innerAudioContext.src=this.properties.url

      // this.data.innerAudioContext.src = 'https://voice.xunsheng.org.cn/20210427220724189-67-792456.m4a'
      this.data.innerAudioContext.play()
      console.log("play");
      this.setData({
        status: "播放中"
      })
    },
    start(){
      console.log(this.data.seekPlay)
      this.pause()
      this.setData({
        seekPlay:false
      })
    },
    pause(){
      if(this.data.paused){
        return;
      }
      this.data.innerAudioContext.pause()
      console.log("pause");
      this.setData({
        status: "暂停"
      })
    },
    stop(){
      this.data.innerAudioContext.stop()
      console.log("stop");
      this.setData({
        status: "停止",
        percentage: "0%"
      })
    },
    seeks(value){
      // if(this.data.seeking){
      //   return
      // }
      console.log(value)

      let time=value*this.properties.myDuration/100
      console.log(time)
      // this.data.innerAudioContext.pause()
      this.data.innerAudioContext.seek(time)
      this.setData({
        percentage: (10/this.data.innerAudioContext.duration * 100)+"%",
        paused:true
      })
    },
    seek(e){
     
      // if(this.data.seeking){
      //   return
      // }
      let value=e.detail.value
      console.log(value)

      let time=value*this.properties.myDuration/100
      console.log(time)
      // this.data.innerAudioContext.pause()
      this.data.innerAudioContext.seek(time)
      this.setData({
        percentage: (10/this.data.innerAudioContext.duration * 100)+"%",
        paused:true
      })
    }
  }
})
