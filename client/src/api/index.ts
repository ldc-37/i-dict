import H5Cloud from './h5'
import WeappCloud from './weapp'

const CloudClass = process.env.TARO_ENV === 'weapp' ? WeappCloud : H5Cloud
export default new CloudClass()