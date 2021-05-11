<template>
  <view id="pSpell" :style="{'background-color': isUsingBlur ? 'rgba(0, 0, 0, 0.1)' : `rgba(0, 0, 0, ${1 - bgRatio})`}">
    <view class="bg" ref="bg" :style="{'background-image': `url(${bgImageUrl})`}"></view>
    <!-- 预下载下一张图片 -->
    <view :style="{'background-image': `url(${bgImageUrlNext})`, 'display': 'none'}"></view>
    <!-- <view class="header">
      <text class="go-back" @tap="handleTapReturn">&lt;</text>
    </view> -->
    <view class="header">
      <text class="level" v-show="state === 1 || state === 3">单词熟练度 {{ wordLevel }}</text>
      <text class="jump" v-show="state === 1" @tap="handleTapJump">跳过</text>
      <text class="tips" v-show="state === 2" @tap="handleTapForget">忘记了</text>
      <!-- NOTE: 换行会导致text节点内容也换行 -->
      <text class="mark" v-show="state === 1 || state === 3" @tap="handleTapMark(isWordMarked)">{{ isWordMarked ? '取消标记' : '标记'}}</text>
    </view>
    <view class="body" :class="{'body-large': state !== 2}">
      <view class="word" v-if="state !== 2">{{ display.word }}</view>
      <view class="word word-mask" v-else>{{ wordMasked }}</view>
      <view class="translation">{{ display.translation }}</view>
    </view>
    <view class="footer">
      <view class="main-buttons">
        <button class="known" @tap="handleTapKnown" hover-class="main-buttons-hover" v-if="state === 1">已掌握</button>
        <button class="start" @tap="handleTapStart" hover-class="main-buttons-hover" v-if="state === 1">开始拼写</button>
        <button class="next" @tap="handleTapNext" hover-class="main-buttons-hover" v-if="state === 3">下一个</button>
      </view>
      <SpellBox :length="display.word.length" :content="userInput" v-if="state === 2"></SpellBox>
      <Keyboard @tap="handleTapKb" @longpress="handleLongPressKb" v-if="state === 2"></Keyboard>
      <view class="progress">
        <view>学习进度 {{ stat.learned }} / {{ stat.total }}</view>
        <!-- <view>单词熟练度 +++--</view> -->
      </view>
    </view>
  </view>
</template>

<script>
import Taro from '@tarojs/taro'
import Keyboard from './components/Keyboard.vue'
import SpellBox from './components/SpellBox.vue'
import { mapState, mapGetter } from 'vuex'
import cloneDeep from 'lodash/cloneDeep'

const STATE =  {
  'beforeSpell': 1,
  'spelling': 2,
  'spelled': 3
}

export default {
  name: 'pageSpell',
  components: {
    Keyboard,
    SpellBox
  },
  data() {
    return {
      state: STATE.beforeSpell,

      // display是waitingList[0]的拷贝
      display: {
        word: '......',
        translation: '',
        pron: '',
        // isDone: false, // 拼写完成时调用的mutation会自动设为isDone: true 此处不再需要
        isCorrect: true,
        isMastered: false,
        level: 0
      },
      waitingList: [],
      stat: {
        learned: 0,
        total: 0
      },

      bgImageUrl: '',
      bgImageUrlNext: '',
      bgCount: 0,
      bgRatio: 0,

      userInput: '',

      timer: 0,
    }
  },
  computed: {
    ...mapState('user', {
      setting: state => state.setting
    }),
    wordMasked() {
      const word = this.display.word
      const replaceLength = word.substring(1, word.length - 1).length
      return word[0] + '_'.repeat(replaceLength) + word[word.length - 1]
    },
    isWordMarked: {
      get() {
        return this.$store.state.user.mark.includes(this.display.word)
      }
    },
    isUsingBlur() {
      return this.$store.state.user.setting.transitionType === '模糊渐变'
    },
    wordLevel() {
      const filledStarChar = '⭐️'
      const emptyStarChar = '☆'
      return filledStarChar.repeat(this.display.level) + emptyStarChar.repeat(5 - this.display.level)
    }
  },
  methods: {
    handleTapKb(ch) {
      if (ch === '←') {
        this.userInput = this.userInput.substring(0, this.userInput.length - 1)
      } else if (this.userInput.length < this.display.word.length) {
        this.userInput += ch
      }
      const input = this.userInput
      const theWord = this.display.word.toLowerCase()
      // 提示要输入首字母
      if (input.length === 1 && input[0] !== theWord[0] && input[0] == theWord[1] ) {
        Taro.showToast({
          title: '首字母和末字母也要输入哦~',
          duration: 2500,
          icon: 'none'
        })
      }
      if (theWord.startsWith(input)) {
        this.bgRatio = input.length / theWord.length
        if (this.isUsingBlur) {
          // 设置了模糊渐变
          this.$refs.bg.style.filter = `blur(${10 - this.bgRatio * 10}px)`
        }
        if (theWord.length === input.length) {
          this.onFinishSpelling()
        }
      }
    },
    handleLongPressKb(ch) {
      if (ch === '←') {
        this.userInput = ''
        this.bgRatio = 0
      }
    },
    handleTapKnown() {
      this.display.isMastered = true
      this.onFinishSpelling()
      Taro.showToast({
        title: '已掌握',
        duration: 1000,
        icon: 'none'
      })
    },
    handleTapStart() {
      this.state = STATE.spelling
    },
    handleTapNext() {
      // 重置页面和计时器
      this.userInput = '',
      this.bgRatio = 0,
      this.state = STATE.beforeSpell
      if (this.timer) {
        clearTimeout(this.timer)
        this.timer = 0
      }
      // 更换图片（注意渐变）
      setTimeout(this.changeBgImage, 500);
      // 移除前一个单词
      const word = this.waitingList.shift()
      this.stat.learned += 1
      if (this.waitingList.length) {
        // 显示下一个单词
        this.display = {...this.waitingList[0]}
      } else {
        // 完成今日任务
        this.$store.dispatch('progress/assignTaskToProgress')
        Taro.showModal({
          title: '学习完成',
          content: '您已经完成了今天的单词拼写任务，可以休息一下啦~',
          showCancel: false,
          success() {
            Taro.navigateBack()
          }
        })
      }
    },
    handleTapJump() {
      const word = this.waitingList.splice(0, 1)[0]
      this.waitingList.push(word)
      this.display = {...this.waitingList[0]}
      this.changeBgImage()
    },
    handleTapForget() {
      Taro.showToast({
        title: this.display.word,
        duration: this.setting.tipsDuration,
        icon: 'none'
      })
      this.display.isCorrect = false
    },
    handleTapMark(isMarked) {
      this.$store.dispatch(isMarked ? 'user/cancelMark' : 'user/addMark', this.display.word)
    },

    onFinishSpelling() {
      this.$store.commit('progress/updateTodayTask', {
        word: this.display.word,
        isCorrect: this.display.isCorrect,
        isMastered: this.display.isMastered
      })
      const time = this.setting.durationKeepAfterRecite
      setTimeout(() => {
        this.state = STATE.spelled
        if (time > 0) {
          this.timer = setTimeout(() => {
            this.handleTapNext()
          }, time)
        }
      }, 150)
    },

    changeBgImage() {
      this.bgCount++
      if (this.bgCount >= this.setting.timesToChangeBackground) {
        this.bgImageUrl = this.bgImageUrlNext || this.$store.getters['resource/getImages'](1)[0]
        this.bgImageUrlNext = this.$store.getters['resource/getImages'](1)[0]
        this.bgCount = 0
      }
      if (this.isUsingBlur) {
        // 处理模糊渐变
        this.$refs.bg.style.filter = 'blur(10px)'
      }
    },
  },
  created() {
    this.bgImageUrl = this.$store.state.resource.firstBackground || this.$store.getters['resource/getImages'](1)[0] // 用启动时预加载的图片
    this.bgImageUrlNext = this.$store.getters['resource/getImages'](1)[0]
    const task = this.$store.state.progress.todayTask
    const notLearnWords = this.$store.getters['progress/todayNotLearnWords']
    const finishedWords = this.$store.getters['progress/todayFinishedWords']
    this.stat = {
      total: task.length,
      learned: finishedWords.length
    }
    this.waitingList = cloneDeep(notLearnWords)
    console.log('data', JSON.parse(JSON.stringify(this.$data)))
    if (this.waitingList.length === 0) {
      Taro.showModal({
        title: '提示',
        content: '您已经背完了今天的单词，希望你劳逸结合，明日再战~',
        showCancel: false,
        success() {
          Taro.navigateBack()
        }
      })
    } else {
      this.display = {...this.waitingList[0]}
    }
  },
  mounted() {
    if (this.isUsingBlur) {
      // 设置为模糊渐变
      this.$refs.bg.style.filter = 'blur(10px)'
    }
  }
}
</script>

<style lang="scss">
@import "../../styles/common";

#pSpell {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-height: 100vh;
  padding: 20px;
  background-color: #000;
  transition: background-color .5s;
  color: #fff;
  .bg {
    position: fixed;
    height: 100%;
    width: 100%;
    margin: -20px;
    background-size: cover;
    background-position: center;
    transition: filter .5s;
    z-index: -1;
  }
  .bg--blur {
    filter: blur(10Px);
  }
  .header {
    text-align: right;
    text {
      display: inline-block;
      margin-left: 20px;
    }
    .level {
      float: left;
      font-size: 28px;
      line-height: 54px;
      opacity: .7;
    }
  }
  .body {
    margin-top: 30%;
    .word {
      font: 80px Georgia,serif;
      // font-weight: bold;
      text-shadow: 2px 2px 4px #000;
      text-align: center;
      letter-spacing: 2Px;
    }
    .translation {
      width: 550px;
      margin: 20px auto;
      text-align: center;
    }
  }
  .body-large {
    transform: scale(1.3);
    padding: 100px 0;
  }
  .footer {
    margin-top: auto;
  }
  .main-buttons {
    display: flex;
    justify-content: space-between;
    width: 600px;
    margin: 0 auto;
    margin-bottom: 40px;
    .known {
      @include simpleButton(#fff);
      width: 200px;
    }
    .start {
      @include simpleButton(#fff);
      width: 350px;
    }
    .next {
      @include simpleButton(#fff);
      width: 400px;
      margin: 0 auto;
    }
  }
  .main-buttons-hover {
    background: #303339;
  }
  #cSpellBox {
    margin-bottom: 130px;
  }
  #cKeyboard {
    margin-bottom: 40px;
  }
  .progress {
    width: 600px;
    margin: 0 auto;
    // display: flex;
    // justify-content: space-between;
    text-align: center;
    font-size: 28px;
    opacity: .8;
  }
}
</style>
