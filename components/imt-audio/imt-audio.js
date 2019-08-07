const audio = wx.createInnerAudioContext(); //创建音频
Component({
    data: {
        currentTime: '', //当前播放时间
        durationTime: '', //总时长
        current: '', //slider当前进度
        loading: false, //是否处于读取状态
        paused: true, //是否处于暂停状态
        seek: false //是否处于拖动状态
    },
    properties: {
        src: String, //音频链接
        autoplay: {
            type: Boolean,
            default: false
        }, //是否自动播放
        duration: Number, //总时长（单位：s）
        control: {
            type: Boolean,
            default: false
        }, //是否需要上一曲/下一曲按钮
        continue: {
            type: Boolean,
            default: false
        },//播放完成后是否继续播放下一首，需定义@next事件
        color: {
            type: String,
            default: '#169af3'
        } //主色调
    },
    methods: {
        //返回prev事件
        prev() {
            this.$emit('prev')
        },
        //返回next事件
        next() {
            this.$emit('next')
        },
        //格式化时长
        format(num) {
            return '0'.repeat(2 - String(Math.floor(num / 60)).length) + Math.floor(num / 60) + ':' + '0'.repeat(2 - String(
                Math.floor(num % 60)).length) + Math.floor(num % 60)
        },
        //播放/暂停操作
        operation() {
            if (audio.paused) {
                audio.play();
                this.setData({
                    loading: true
                })
            } else {
                audio.pause()
            }
        },
        //完成拖动事件
        change(e) {
            audio.seek(e.detail.value)
        },
        changing(e){
            this.setData({
                seek:true,
                current:e.detail.value
            })
        }
    },
    attached() {
//        audio.src = this.data.src;
//        audio.obeyMuteSwitch = true;
//        audio.autoplay = this.data.autoplay;
//        audio.onCanplay(() => {
//
//        });
//        console.log(audio.src);
        this.setData({
            current: 0,
//            durationTime: this.format(audio.duration)
            durationTime: this.format(this.data.duration)
        });
        audio.onCanplay(() => {

        });
        //音频进度更新事件
        audio.onTimeUpdate(() => {
            if (!this.data.seek) {
                this.setData({
                    current: audio.currentTime
                })
            }
        });
        //音频播放事件
        audio.onPlay(() => {
            this.setData({
                paused: false,
                loading: false,
                durationTime: this.format(audio.duration)
            })
        });
        //音频暂停事件
        audio.onPause(() => {
            this.setData({
                paused: true
            })
        });
        //音频结束事件
        audio.onEnded(() => {
            if (this.data.continue) {
                this.next()
            } else {
                this.setData({
                    paused: true,
                    current: 0
                })
            }
        });
        //音频完成更改进度事件
        audio.onSeeked(() => {
            this.setData({
                seek: false
            })
        })
    },
    detached(){
        audio.destroy();
    },
    observers: {
        //监听音频地址更改
        src(e) {
            audio.src = e;
            audio.obeyMuteSwitch = true;
            audio.autoplay = this.data.autoplay;

            console.log(e);
            this.setData({
                current: 0,
                durationTime: this.format(this.data.duration)
//            durationTime: this.format(this.data.duration)
            });
//            audio.src = e;
//            this.setData({
//                current: 0
//            })
//            audio.play();
//            this.setData({
//                loading: true
//            })
        },
        //监听总时长改变
//        duration(e) {
//            this.setData({
//                durationTime: this.format(e)
//            })
//        },
        //监听当前进度改变
        current(e) {
            this.setData({
                currentTime: this.format(e)
            })
        }
    }
})