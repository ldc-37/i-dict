<template>
  <view id="pAbout">
    <view class="block">
      <view class="title">功能介绍</view>
      <view class="content">
        <text class="em">宅单词（i-dict）</text>是一款基于拼写来辅助用户记忆单词的小程序产品，它拥有有趣的机制、多元化的选择和丰富自定义功能，让用户可以更好的坚持学习，也可以自由根据自己的习惯进行配置。打卡、生词本、学习计划等功能同样一应俱全。
      </view>
    </view>
    <view class="block">
      <view class="title">致谢</view>
      <view class="content">
        <view>感谢：咩咩单词@mieruko0713/airingursb、福利单词@easychen 提供的部分<text class="em">开源资源&amp;灵感</text></view>
        <view><text class="em">图片</text>收集于无版权图片站，如unsplash等等</view>
        <view><text class="em">词库及音频</text>来自扇贝单词的开发者接口，在此表示感谢</view>
      </view>
    </view>
    <view class="block">
      <view class="title">联系开发者</view>
      <view class="content">
        <view>QQ: 791551236 - ldc@Fzu</view>
      </view>
    </view>
    <view class="block">
      <view class="title">开源地址</view>
      <view class="content">
        https://github.com/ldc-37/i-dict
      </view>
    </view>
    <view class="block">
      <view class="title">更新历史</view>
      <view class="content">
        <view>v2.6.0 最近更新</view>
        <view>【新增】点击单词可发音；新用户学习指引；分享按钮</view>
        <view>【修复】处理苹果手机页面可横划问题；单词过长超出边界问题；极端情况/新设备同步出错；部分样式问题</view>
        <view>【适配】浏览器H5模式基本可用，采用匿名登陆方案</view>
        <view>【调整】根据用户反馈调整了默认设置值</view>
        <view>v2.5.0</view>
        <view>【新增】VIP用户展示及会员图库功能</view>
        <view>【修复】图库类型展示问题；统一文案</view>
        <view>【优化】数据同步容错逻辑；新用户设置同步方案</view>
        <view>v2.4.0</view>
        <view>所有功能已经可以正常使用。优化细节和问题修复</view>
        <view>v2.3.0</view>
        <view>完成设置功能、同步和页面的重新适配</view>
        <view>v2.2.0</view>
        <view>单词标记（收藏）逻辑重构完成，标记列表修改完成</view>
        <view>v2.1.0</view>
        <view>词书选择重构完成，切换速度大幅度提升</view>
        <view>v2.0.0</view>
        <view>完全重构代码，新版本拥有更加完善的底层逻辑和更好的性能</view>
      </view>
    </view>
  </view>
</template>

<script>
import Taro from '@tarojs/taro'

export default {
  name: 'pageAbout',
  data() {
    return {}
  }
}
</script>

<style lang="scss">
#pAbout {
  padding: 30px;
}

.block {
  margin-bottom: 60px;
}

.title {
  position: relative;
  margin-bottom: 20px;
  padding-left: 30px;
  color: #303336;
  font-size: 36px;
  letter-spacing: 4px;
  vertical-align: middle;
  &::before {
    content: '';
    position: absolute;
    left: 0;
    width: 8px;
    height: 100%;
    background-color: #78A4FA;
  }
}

.content {
  font-size: 28px;
  color: #909399;
}

.em {
  // font-weight: bold;
  color: #333;
}
</style>
