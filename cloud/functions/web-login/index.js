const cloud = require('wx-server-sdk')
// 初始化 cloud
cloud.init({
  // API 调用都保持和云函数当前所在环境一致
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()


exports.main = async (event, context) => {
  console.log('event', event)

  const { userId } = event

  const wxContext = cloud.getWXContext()
  console.log('web wxContext', wxContext)

  function getNewUserData(id) {
    return {
      "_id": id,
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
      "remark": ""
    }
  }

  let isVip = false
  let isNewUser = false
  const user = await db.collection('web_user')
    // .doc(userId)
    .where({
      _id: userId
    })
    .get()
  const userData = user.data
  console.log('userData', userData)
  if (!userData.length) {
    // 当前新用户注册
    isNewUser = true
    const newUserData = getNewUserData(userId)
    await db.collection('web_user')
      .add({
        data: newUserData
      })
  } else {
    // 老用户更新登陆时间
    isVip = userData[0].isVip
    await db.collection('web_user')
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
  }
}

