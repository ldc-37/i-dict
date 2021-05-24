<template>
  <view id="pSettings">
    <view class="type">习惯</view>
    <view class="column-picker">
      <picker mode='selector' :value="selectedIndex.durationKeepAfterRecite" :range="settingOptions.durationKeepAfterRecite" @change="onPickerChange($event, 'durationKeepAfterRecite')">
        <view class="picker-wrapper">
          <view class="item">
            <text>拼写完成停留时间</text>
            <text class="tips">选择 0秒 时手动切换</text>
          </view>
          <text class="value">{{ settings.durationKeepAfterRecite }} 秒</text>
        </view>
      </picker>
    </view>
    <view class="column-picker">
      <picker mode='selector' :value="selectedIndex.tipsDuration" :range="settingOptions.tipsDuration" @change="onPickerChange($event, 'tipsDuration')">
        <view class="picker-wrapper">
          <text class="item">单词提示浮窗出现时长</text>
          <text class="value">{{ settings.tipsDuration }} 秒</text>
        </view>
      </picker>
    </view>

    <view class="type">外观</view>
    <view class="column-picker">
      <picker mode='selector' :value="selectedIndex.timesToChangeBackground" :range="settingOptions.timesToChangeBackground" @change="onPickerChange($event, 'timesToChangeBackground')">
        <view class="picker-wrapper">
          <text class="item">背景图更换频率</text>
          <text class="value">每 {{ settings.timesToChangeBackground }} 词更换</text>
        </view>
      </picker>
    </view>
    <view class="column-picker">
      <picker mode='selector' :value="selectedIndex.imageType" :range="settingOptions.imageType" @change="onPickerChange($event, 'imageType')">
        <view class="picker-wrapper">
          <text class="item">背景图片集类型</text>
          <text class="value">{{ settings.imageType }}</text>
        </view>
      </picker>
    </view>
    <view class="column-picker">
      <picker mode='selector' :value="selectedIndex.transitionType" :range="settingOptions.transitionType" @change="onPickerChange($event, 'transitionType')">
        <view class="picker-wrapper">
          <text class="item">渐变方式</text>
          <text class="value">{{ settings.transitionType }}</text>  
        </view>
      </picker>
    </view>

    <view class="type">计划</view>
    <view class="column">
      <text class="item">复习比例（%）</text>
      <text class="tips">此设置将于次日生效。如果你没有需要复习的单词，那么就会补充新单词进入当日任务。</text>
      <slider :value="reviewRate" min="30" max="70" block-size="20" step="5" :show-value="true" @change="handleChangeRate" />
    </view>

    <view class="type">操作</view>
    <view class="column" @tap="handleTapClearAll">
      <text class="item" style="color: red;">清空学习进度</text>
      <text class="tips">此按钮将移除所有学习进度，请谨慎！。</text>
    </view>
    <view class="column" @tap="handleTapAssignProgress">
      <text class="item">导入网页版学习进度</text>
      <!-- <text class="tips">此按钮将移除所有学习进度，请谨慎！。</text> -->
    </view>

    <button class="btn" hover-class="btn--hover" @tap="handleTapSave">保存设置</button>
  </view>
</template>

<script>
import Taro from '@tarojs/taro'
import { mapState } from 'vuex'
import Api from '../../api'
import cloneDeep from 'lodash/cloneDeep'

export default {
  name: 'pageSettings',
  data() {
    return {
      settingOptions: {
        durationKeepAfterRecite: [0, 1, 1.5, 2, 2.5, 3, 4, 5],
        tipsDuration: [1, 3, 5],
        timesToChangeBackground: [1, 2, 3, 4, 5],
        imageType: [], // init need
        transitionType: ['透明度渐变', '模糊渐变']
      },
      selectedIndex: {
        durationKeepAfterRecite: 0,
        tipsDuration: 0,
        timesToChangeBackground: 0,
        imageType: 0,
        transitionType: 0,
      },
      reviewRate: 50,

      albumIdArr: [],
    }
  },
  computed: {
    settings() {
      const setting = cloneDeep(this.selectedIndex)
      const option = this.settingOptions
      Object.keys(setting).forEach(name => {
        setting[name] = option[name][setting[name]]
      })
      setting.reviewRate = this.reviewRate
      return setting
    }
  },
  methods: {
    onPickerChange(e, name) {
      // NOTE: 直接修改无法被监听
      // this.selectedIndexes[index] = parseInt(e.detail.value)
      // this.$set(this.selectedIndexes, index, parseInt(e.detail.value))
      this.selectedIndex[name] = +e.detail.value
    },
    handleChangeRate(e) {
      this.reviewRate = e.detail.value
    },
    async handleTapClearAll(e) {
      try {
        const res = await Taro.showActionSheet({
          itemList: ['清空学习进度']
        })
        if (res.tapIndex === 0) {
          Taro.showModal({
            title: '警告',
            content: '【暂时不支持】', // 此操作将不可撤回地永久移除您的学习记录，是否继续？
            confirmText: '确认删除',
            confirmColor: '#ff0000',
            success: (res) => {
              console.warn(111)
              // 清空本地进度、当日任务并同步云端
            }
          })
        }
      } catch (e) {}
    },
    async handleTapAssignProgress(e) {
      Taro.showToast({
        title: '敬请期待下一版本',
        icon: 'none'
      })
    },
    async handleTapSave() {
      Taro.showLoading({
        title: '保存中...'
      })
      const s = cloneDeep(this.settings)
      s.durationKeepAfterRecite *= 1000
      s.tipsDuration *= 1000
      s.reviewRate /= 100
      console.log(this.settings, this.selectedIndex)
      const willUpdateAlbum = this.$store.state.user.setting.imageType !== s.imageType
      willUpdateAlbum && (s.albumId = this.albumIdArr[this.selectedIndex.imageType])
      this.$store.commit('user/assignSetting', s)
      try {
        await this.$store.dispatch('user/syncSetting', {
          source: 0 // local
        })
        if (willUpdateAlbum) {
          await this.$store.dispatch('resource/syncAlbum', {
            source: 1 // cloud
          })
          this.$store.dispatch('resource/fetchFirstBackground')
        }
        Taro.hideLoading()
        Taro.showToast({
          title: '修改成功！'
        })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1000)
      } catch (e) {
        console.error(e)
        Taro.hideLoading()
      }
    }
  },
  async created() {
    const albumList = await Api.getResourceData('album')
    this.settingOptions.imageType = albumList.map(info => info.name) // 初始化图片类型文字
    this.albumIdArr = albumList.map(item => item._id)
    const originSetting = cloneDeep(this.$store.state.user.setting)
    originSetting.durationKeepAfterRecite /= 1000
    originSetting.tipsDuration /= 1000
    const i = this.selectedIndex
    Object.keys(i).forEach(name => {
      i[name] = this.settingOptions[name].indexOf(originSetting[name])
    })
    this.reviewRate = originSetting.reviewRate * 100

    console.log('data', this.$data, this.settings)
  }
}
</script>

<style lang="scss">
@import "../../styles/common";

#pSettings {
  height: 100vh;
  background: #f9f9f9;
  font-size: 32px;
  overflow-x: hidden;
  .type {
    padding: 40px 0 10px 40px;
    border-bottom: 1px solid #e3e3e3;
    font-size: 36px;
    color: #909399;
  }
  .column {
    background: #fff;
    border-bottom: 1px solid #e3e3e3;
    padding: 20px 40px;
  }
  .column-picker {
    background: #fff;
    border-bottom: 1px solid #e3e3e3;
  }
  .picker-wrapper {
    display: flex;
    flex-wrap: nowrap;
    justify-content: space-between;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    padding: 20px 40px;
  }
  .item {
    color: #303132;
  }
  .value {
    margin-left: auto;
    color: #909399;
  }
  .tips {
    display: block;
    color: #babbbd;
    font-size: 26px;
  }
  .btn {
    @include commonButton($mainColor, #fff);
    display: block;
    margin: 120px auto;
    width: 650px;
  }
  .btn--hover {
    background: #44ceb2;
  }
  slider {
    margin-left: 0;
    margin-right: 0;
  }
  // switch {
  //   transform: scale(.8);
  // }
}
</style>
