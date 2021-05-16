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
      "_openid": openid,
      "createAt": new Date(),
      "finishDate": [],
      "isVip": false,
      "lastLoginAt": new Date(),
      "mark": [],
      "progress": {},
      "setting": {}, // 由前端初始化
      "syncTime": {
        "mark": new Date(),
        "progress": new Date(),
        "setting": new Date()
      },
      "unionid": ""
    }
  }

  let userId = ''
  const user = await db.collection('user')
    .where({
      _openid: wxContext.OPENID
    })
    .get()
  const userData = user.data
  console.log('userData', userData)
  if (!userData.length) {
    const newUserData = getNewUserData(wxContext.OPENID)
    const newData = await db.collection('user')
      .add({
        data: newUserData
      })
    userId = newData._id
  } else {
    userId = userData[0]._id
    await db.collection('user')
      .doc(userId)
      .update({
        data: {
          lastLoginAt: new Date()
        }
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

