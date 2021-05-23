<template>
  <view id="pCollection">
    <view class="total">共有 {{ markWords.length }} 个单词</view>
    <view class="word-wrapper" v-for="word in markWords" :key="word.word">
      <view class="word">{{ word.word }}</view>
      <view class="translation">{{ word.translation }}</view>
      <text class="icon" @tap="handleTapRemove(word.word)">×</text>
    </view>
    <view class="empty" v-show="markWords.length === 0">- 暂无内容 -</view>
  </view>
</template>

<script>
import Taro from '@tarojs/taro'

export default {
  name: 'pageCollection',
  data() {
    return {
      modified: false,
    }
  },
  computed: {
    markWords() {
      return this.$store.state.user.mark.map(word => {
        const wordData = this.$store.state.resource.dict[word]
        return {
          word,
          ...wordData
        }
      })
    }
  },
  methods: {
    handleTapRemove(word) {
      this.$store.commit('user/cancelMark', word)
      this.modified = true
      Taro.showToast({
        title: '取消标记',
        duration: 1000
      })
    }
  },
  beforeDestroy() {
    if (this.modified) {
      this.$store.dispatch('user/syncMark', {
        source: 0
      })
    }
  }
}
</script>

<style lang="scss">
#pCollection {
  font-size: 32px;
  .total {
    margin: 10px 0;
    text-align: center;
  }
  .word-wrapper {
    position: relative;
    box-sizing: border-box;
    width: 100%;
    height: 150px;
    padding: 30px 20px;
    background: #f7f7f7;
    border-bottom: 1px solid #dddddd;
    .word {
      font-weight: bold;
      // margin-bottom: 10px;
    }
    .translation {

    }
    .icon {
      position: absolute;
      right: 30px;
      top: 40px;
      font-size: 50px;
      color: #D0E5A9;
    }
  }
  .empty {
    margin-top: 80px;
    font-size: 40px;
    color: #909399;
    text-align: center;
  }
}
</style>
