const cloud = require('wx-server-sdk')
// 初始化 cloud
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()


exports.main = async (event, context) => {
  console.log('event', event)

  const wxContext = cloud.getWXContext()

  function getNewUserData(openid) {
    return {
      "createAt": new Date(),
      "finishDate": [],
      "isVip": false,
      "lastLoginAt": new Date(),
      "mark": [],
      "openid": openid,
      "progress": {},
      "setting": {
        "albumId": 1,
        "amountPerDay": 10,
        "dictId": 1,
        "durationKeepAfterRecite": 1500,
        "timesToChangeBackground": 1,
        "tipsDuration": 1000
      },
      "syncTime": {
        "mark": new Date(),
        "progress": new Date(),
        "setting": new Date()
      },
      "unionid": ""
    }
  }

  let userId = ''
  const userData = await db.collection('user')
    .where({
      openid: wxContext.OPENID
    })
    .get()
  if (!userData.length) {
    const newUserData = getNewUserData(wxContext.OPENID)
    const newData = await db.collection('user')
      .add({
        data: newUserData
      })
    userId = newData._id
    } else {
    userId = userData._id
    await db.collection('user')
      .update({
        lastLoginAt: new Date()
      })
  }

  return {
    event,
    userId,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
    env: wxContext.ENV,
  }
}

