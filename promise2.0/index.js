//2.0 完成promise链式调用
//先看看promise的链式调用有哪些特性  
let fs = require('fs')

function read(filename) {
  return new Promise((resolve,reject) => {//包装一层promise的好处还有相当于做了错误处理
    fs.readFile(filename,'utf8',(err,data) => {
      if(err) reject(err)
      resolve(data)
    })
  })
}

// 1.promise then中的回调不管是成功的回调还是失败的回调的return都会传给下一个.then的成功的回调函数，也就是链式调用
// read('./na1me.txt').then((data) => {// 这里故意写错进入第一层的reject
//   return 'then1 [resolve] return.'//第一层resolve中正常的return会被下一层的then的resolve接受
// },(err) => {
//   return 'then1 [reject] return.' //第一层reject中正常的return也会被下一层的then的resolve接受(这里要记住，容易搞混)
// }).then((data) => {
//   console.log(data,'then2 [resolve] worked.');//结果是这里被调用
// },(err) => {err
//   console.log(err,'then2 [reject] worked.');
// })


// 2.then中回调的返回值有三种情况，正常值(情况同上↑，传给下个then的resolve)，出错值(传给下个then的reject)，promise(先执行再根据这个promise结果及状态)要分别进行处理

//2.1返回出错值
// read('./na1me.txt').then((data) => {// 这里故意写错进入reject
//   throw new Error('then1 [resolve] throw error.')//第一层resolve中的报错会被下一层的then的reject接受
// },(err) => {
//   throw new Error('then1 [reject] throw error.')//第一层reject中的报错也会被下一层的then的reject接受
// }).then((data) => {
//   console.log(data,'\n---then2 [resolve] worked.'); 
// },(err) => {
//   console.log(err,'\n---then2 [reject] worked.');//结果是这里被调用
// })

//2.2返回promise
// read('./name.txt').then((data) => {//name.txt里的内容是age.txt
//   return read(data)
// }, (err) => {})
// .then((data) => {//第二层执行哪个由第一层返回的promise执行完的状态判断
//   console.log(data,'\n---then2 [resolve] worked.'); //这里执行并输出age.txt中的内容
// }, (err) => {
//   console.log(err,'\n---then2 [reject] worked.');
// })

//3.错误没有被捕获的话，可以在后面任意一层被捕获，被捕获后这个错误将不会再向后传递
// read('./na1me.txt').then((data) => {//这里故意写错进入reject，而这层then没有reject
//   return read(data) //这里写不写都一样，因为并没有走第一层then的resolve
// })
// .then((data) => {
//   console.log(data,'\n---then2 [resolve] worked.');
// }, (err) => {
//   console.log(err,'\n---then2 [reject] worked.'); //被这里捕获，这里输出 no file na1me.txt的错
// })
// .then((data) => {
//   console.log(data,'\n---then3 [resolve] worked.'); //然后这里被调用，因为错误在第二层被捕获了
// }, (err) => {
//   console.log(err,'\n---then3 [reject] worked.');
//   // 补充，如果第二层then代码运行出现了错误或throw new error 就会执行这里捕获第二层而不是第一层的错误。如果第二层没有传入reject方法，则第一层的错误会被这里第三层then的reject捕获
// })// 如果错误从头到尾都没有被捕获则代码运行报错

// 4.每次执行完promise.then方法后返回的都是一个新的'promise'，这也是为什么可以一直.then
// read('./name.txt').then((data) => {
//   return 111
// })// 即使这里返回的是111也会被包装成promise，第二层的then其实是这个新promise的then
// .then((data) => {
//   console.log(data)
// })