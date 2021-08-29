<template>
  <view id="pHistory">
    <view class="type-wrapper">
      <view class="type" :class="{'type-active': pageState === 1}" @tap="handleTapType(1)">今日任务</view>
      <view class="type" :class="{'type-active': pageState === 2}" @tap="handleTapType(2)">在学单词</view>
      <view class="type" :class="{'type-active': pageState === 3}" @tap="handleTapType(3)">已学单词</view>
      <view class="type" :class="{'type-active': pageState === 4}" @tap="handleTapType(4)">未学单词</view>
    </view>
    <!-- <view class="word-wrapper" v-for="word in wordList" :key="word.word">
      <view class="word">{{ word.word }}</view>
      <view class="translation">{{ word.translation }}</view>
      <text class="icon" @tap="handleTapPron(word.pronounce)">[voice]</text>
    </view> -->
    <virtual-list
      :height="listHeight"
      :item-data="wordList"
      :item-count="wordList.length"
      :item-size="75"
      :item="ListItem"
      width="100%"
      v-if="wordList.length"
      :overscanCount="20"
    />
    <view class="empty" v-show="wordList.length === 0">- 暂无内容 -</view>
  </view>
</template>

<script>
import Taro from '@tarojs/taro'
import ListItem from './components/ListItem.vue'

export default {
  name: 'pageHistory',
  components: {

  },
  data() {
    return {
      pageState: 1,
      wordList: [],
      cache: {
        todayTask: [],
        learning: [],
        learned: [],
        notLearn: []
      },
      ListItem
    }
  },
  computed: {
    listHeight() {
      return Taro.getSystemInfoSync().windowHeight - 50
    }
  },
  methods: {
    handleTapType(type) {
      this.pageState = type
      this.getList()
    },
    getList() {
      const store = this.$store
      let result = []
      switch (this.pageState) {
        case 1:
          if (!this.cache.todayTask.length) {
            this.cache.todayTask = store.state.progress.todayTask
          }
          result = this.cache.todayTask
          break
        case 2:
          if (!this.cache.learning.length) {
            this.cache.learning = store.getters['progress/learningWords'].map(word => store.getters['resource/getWordInfo'](word))
          }
          result = this.cache.learning
          break
        case 3:
          if (!this.cache.learned.length) {
            this.cache.learned = store.getters['progress/learnedWords'].map(word => store.getters['resource/getWordInfo'](word))
          }
          result = this.cache.learned
          break
        case 4:
          if (!this.cache.notLearn.length) {
            this.cache.notLearn = store.getters['progress/notLearnWords'].map(word => store.getters['resource/getWordInfo'](word))
          }
          result = this.cache.notLearn
          break
      }
      this.wordList = result
    }
  },
  created() {
    this.getList()
  }
}
</script>

<style lang="scss">
#pHistory {
  font-size: 32px;
  overflow-x: hidden;
  .type-wrapper {
    display: flex;
    justify-content: space-between;
    padding: 20px 50px;
    .type-active {
      font-weight: bold;
      color: #D0E5A9;
    }
  }
  // .word-wrapper {
  //   position: relative;
  //   box-sizing: border-box;
  //   width: 100%;
  //   height: 150px;
  //   padding: 30px 20px;
  //   background: #f7f7f7;
  //   border-bottom: 1px solid #dddddd;
  //   .word {
  //     font-weight: bold;
  //     // margin-bottom: 10px;
  //   }
  //   .translation {
  //     max-width: 600px;
  //     text-overflow: ellipsis;
  //     overflow: hidden;
  //     white-space: nowrap;
  //   }
  //   .icon {
  //     position: absolute;
  //     right: 30px;
  //     top: 50px;
  //     color: #D0E5A9;
  //   }
  // }
  .empty {
    margin-top: 80px;
    font-size: 40px;
    color: #909399;
    text-align: center;
  }
}
</style>
