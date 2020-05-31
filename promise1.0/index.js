let Promise = require('./promise') //引入自己的promise实验一下

let mypromise = new Promise((resolve,reject) => {
  resolve('成功')//改变状态由pending变resolve
  throw new Error('抛出异常')//后两行执行已经没有反应
  reject('失败')
})
mypromise.then((data) => {
  console.log('then resolve---',data);
},(err) => {
  console.log('then reject---',err);
})