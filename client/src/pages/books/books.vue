<template>
  <view id="pDicts">
    <view class="header">
      <image :src="image.dot" id="decorationLeft" mode="aspectFit" />
      <view class="welcome-text">我的学习任务</view>
      <image :src="image.decorationCircle" id="decorationRight" mode="aspectFit" />
    </view>
    <view class="learning-wrapper" v-if="dictList.length && usingDict">
      <image :src="usingDict.coverImg" class="dict-img" />
      <view class="learning-body">
        <view class="title">{{ usingDict.name }}</view>
        <view class="plan">
          每日学习<text id="number"> {{ userSetting.amountPerDay }} </text>词
          <picker mode="selector"
            :value="amountIndex"
            :range="amountList"
            header-text="修改后会重新分配今日任务"
            @change="onTaskAmountPickerChange"
          >
            <image class="icon" :src="image.edit" />
          </picker>
        </view>
        <view class="progress">
          <view class="progress-text">已学习：{{ learnedAmount + learningAmount }} / {{ usingDict.count }} 词</view>
          <smallProgress :progress="(learnedAmount + learningAmount) / usingDict.count * 100" color="#87e2d0" blankColor="#aaa"></smallProgress>
        </view>
      </view>
    </view>
    <view class="dict-list-wrapper" v-if="dictList.length">
      <view id="titleText">所有单词书</view>
      <view class="dict-list" v-for="(dict, index) in dictList" :key="dict._id">
        <view class="dict-card">
          <image :src="dict.coverImg" class="dict-img" />
          <view class="card-body">
            <view class="title">{{ dict.name }}<text v-show="dict._id === usingDict._id">（学习中）</text></view>
            <view class="desc">[共{{ dict.count }}词] {{ dict.desc }}</view>
            <view class="btn-dict" @tap="handleTapDict($event, index)" v-if="dict._id !== usingDict._id">学习此书</view>
            <view class="btn-dict btn-dict-locked" v-else>正在学习</view>
          </view>
        </view>
      </view>
      <view id="endText">- 更多词书 敬请期待 -</view>
    </view>
  </view>
</template>

<script>
import Taro from '@tarojs/taro'
import { mapState, mapMutations } from 'vuex'
import smallProgress from "../../components/smallProgress.vue"

import dot from '../../../assets/images/dots.png'
import decorationCircle from '../../../assets/images/icon-2circle.png'
import edit from '../../../assets/icon/edit.png'
import Api from '../../api'
import { SYNC_SOURCE } from 'src/store/type'

export default {
  name: 'pageDicts',
  components: {
    smallProgress
  },
  data() {
    return {
      image: {
        dot,
        decorationCircle,
        edit
      },
      dictList: [],

      amountList: [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100],
      amountIndex: 0,

      mySetting: {
        amountPerDay: 0
      }
    }
  },
  computed: {
    ...mapState('user', {
      userSetting: state => state.setting
    }),
    learnedAmount() {
      return this.$store.getters['progress/learnedAmount']
    },
    learningAmount() {
      return this.$store.getters['progress/learningAmount']
    },
    usingDict() {
      return this.$store.state.resource.dictInfo
    }
  },
  methods: {
    async handleTapDict(e, index) {
      try {
        const { confirm } = await Taro.showModal({
          title: '更换确认',
          content: '您即将更换单词书为《' + this.dictList[index].name + '》，是否继续？',
        })
        if (confirm) {
          this.showLoadingProgress(1)
          console.time('1、合并今日任务并上传')
          await this.$store.dispatch('progress/assignTaskToProgress')
          console.timeEnd('1、合并今日任务并上传')

          this.showLoadingProgress(2)
          console.time('2、更新并同步设置')
          this.$store.commit('user/assignSetting', {
            dictId: this.dictList[index]._id
          })
          await this.$store.dispatch('user/syncSetting', {
            source: 0 // SYNC_SOURCE.local
          })
          console.timeEnd('2、更新并同步设置')

          this.showLoadingProgress(3)
          console.time('3、下载并解析词书')
          await this.$store.dispatch('resource/syncDict', {
            source: 1 // SYNC_SOURCE.cloud
          })
          console.timeEnd('3、下载并解析词书')

          this.showLoadingProgress(4)
          console.time('4、生成新的今日任务')
          await this.$store.dispatch('progress/checkCurrentTask', true)
          console.timeEnd('4、生成新的今日任务')

          Taro.hideLoading()
          Taro.showToast({
            title: '更换完成',
            duration: 1500
          })
        }
      } catch (e) {
        console.error(e)
        Taro.showModal({
          title: '错误',
          content: '更换单词书出错，请重试'
        })
        Taro.hideLoading()
      }
    },
    async onTaskAmountPickerChange(e) {
      Taro.showLoading({
        title: '修改中...',
        mask: true
      })
      this.$store.commit('user/assignSetting', {
        amountPerDay: this.amountList[e.detail.value]
      })
      this.$store.dispatch('user/syncSetting', {
        source: 0 // SYNC_SOURCE.local
      })
      await this.$store.dispatch('progress/checkCurrentTask', true)
      Taro.hideLoading()
      Taro.showToast({
        title: '修改完成！'
      })
    },

    showLoadingProgress(seq) {
      const tipWords = [
        '更新设置',
        '同步当前任务',
        '下载词书',
        '生成新任务'
      ]
      const len = tipWords.length
      const percent = Math.round(seq / len * 100)
      if (seq < 1 || seq > len) throw new Error('showLoadingProgress params err!')
      Taro.showLoading({
        title: `${process}%${tipWords[seq - 1]}`,
        mask: true
      })
    }
  },
  async created() {
    this.amountIndex = this.amountList.indexOf(this.userSetting.amountPerDay)
    this.mySetting.amountPerDay = this.userSetting.amountPerDay
    Taro.showLoading({
      title: '加载词库列表'
    })
    try {
      this.dictList = await Api.getResourceData('dict')
    } catch (e) {
      console.error(e)
    } finally {
      Taro.hideLoading()
    }
    console.log('data', JSON.parse(JSON.stringify(this.$data)))
  }
}
</script>

<style lang="scss">
@import "../../styles/common";

#pDicts {
  padding: 30px;
    .header {
    position: relative;
    margin-bottom: 60px;
    padding: 0.1px; /* 避免被子元素margin影响 */
    .welcome-text {
      margin-top: 100px;
      margin-left: 30px;
      font-size: 40px;
      letter-spacing: 2px;
    }
    #decorationLeft {
      position: absolute;
      left: 0;
      top: 0;
      width: 225px;
      height: 150px;
      z-index: -1;
    }
    #decorationRight {
      position: absolute;
      right: -50px;
      top: 40px;
      width: 120px;
      height: 120px;
      z-index: -1;
    }
  }
  .learning-wrapper {
    display: flex;
    padding: 0 20px;
    .dict-img {
      zoom: .7;
    }
    .learning-body {
      display: flex;
      flex-direction: column;
      flex: 1;
      margin-left: 20px;
    }
    .title {
      font-size: 38px;
      margin-bottom: 15px;
    }
    .plan {
      font-size: 30px;
      display: inline-flex;
      align-items: center;
    }
    #number {
      margin: 0 10px;
      font-size: 32px;
      color: $mainColor;
    }
    .icon {
      @include simpleIcon(40px);
      margin-left: 20px;
      opacity: .4;
    }
    .progress {
      margin-top: 70px;
    }
    .progress-text {
      margin-bottom: 8px;
      font-size: 20px;
    }
  }
  .dict-list-wrapper {
    margin-top: 100px;
    padding: 0 20px;
    #titleText {
      font-size: 28px;
      margin-bottom: 25px;
    }
    #endText {
      margin-top: 40px;
      text-align: center;
      color: #909399;
      font-size: 28px;
    }
    .dict-card {
      display: flex;
      padding: 25px;
      box-shadow: 0 0 4px 0 #bbb;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .dict-img {
      zoom: .5;
    }
    .card-body {
      display: flex;
      flex-direction: column;
      flex: 1;
      margin-left: 20px;
    }
    .title {
      margin-bottom: 25px;
    }
    .desc {
      color: #909399;
      font-size: 26px;
    }
    .btn-dict {
      box-sizing: border-box;
      width: 150px;
      margin-top: 30px;
      margin-left: auto;
      padding: 2px 6px;
      background: $mainColor;
      color: #fff;
      border-radius: 50px;
      font-size: 24px;
      text-align: center;
    }
    .btn-dict-locked {
      background: #b2b2b2;
      color: #fff;
    }
  }

  .dict-img {
    width: 240px;
    height: 320px;
  }
}
</style>
