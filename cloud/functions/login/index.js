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
  let isVip = false
  let isNewUser = false
  const user = await db.collection('user')
    .where({
      _openid: wxContext.OPENID
    })
    .get()
  const userData = user.data
  console.log('userData', userData)
  if (!userData.length) {
    // 当前新用户注册
    isNewUser = true
    const newUserData = getNewUserData(wxContext.OPENID)
    const newData = await db.collection('user')
      .add({
        data: newUserData
      })
    userId = newData._id
  } else {
    // 老用户更新登陆时间
    userId = userData[0]._id
    isVip = userData[0].isVip
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
    isVip,
    isNewUser,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
    env: wxContext.ENV,
  }
}

