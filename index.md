#   三步完成A+规范Promise，平均一行代码一句注释(上)

## 前言

这篇文章是由我上培训班课程的一个笔记整理后完成。

带小白一步步完成一个A+规范Promise实现，由浅入深。

内容解析非常详细，尽量把每个点为什么这样写都注释清楚,甚至某些地方略显啰嗦了。

平均一行代码一句注释，拆分为三个版本1.0，2.0，3.0，层层递进，最终3.0版本将实现Pomise/A+规范。

至于本文为什么分为上中下三篇，是怕很多人和我一样看见太长的文章先收藏，再吃灰，这篇真的不难。

所以，绝不是懒：)。(其实就是)

## myPromise 1.0 介绍

`myPromise 1.0`版本将完成一个能处理同步状态的`promise`(不考虑异步)。实现了`promise`的以下特性，很多日常使用的时候并没有注意到，却不知不觉在用了。

1.`promise`构造函数接收一个`executor`函数，且该函数立即执行(即同步执行)

2.`executor`函数接收两个`promise`内部提供的方法`resolve方法`和`reject方法`用于供使用者调用，在合适的时候改变`promise`成合适的状态
```js
let mypromise = new Promise((resolve,reject) => {
  //这个箭头函数就是executor
})
```

3.`executor`函数内部执行异常时会被捕获并执行`reject`
```js
let mypromise = new Promise((resolve,reject) => {
  throw new Error('抛出异常')
  //相当于执行了reject，代码出现错误同理，会被捕获且将错误传给reject并执行。
})
```
4.具备三个状态(`resolve`成功,`reject`失败,`pending`等待)和then方法(使用者用于传入`onFulfilled函数`和`onRejected函数`)
```js
let mypromise = new Promise((resolve,reject) => {
  resolve('成功')
})
mypromise.then((data) => { //onFulfilled函数
  console.log('then resolve---',data);
},(err) => { //onRejected函数
  console.log('then reject---',err);
})
//注意:then中的使用者传入的onFulfilled函数和使用者executor中使用的resolve都是成功时要调用的方法，可以认为resolve触发onFulfilled。

//reject和onRejected同上
```

5.只有`pending`状态时可以调用`resolve函数`或`reject函数`并改变状态。
```js
let mypromise = new Promise((resolve,reject) => {
  resolve('成功')//resolve内部会改变状态由pending变resolve
  resolve('成功2')//这三行执行已经没有反应
  reject('失败')
  throw new Error('抛出异常')
})
```

## mypromise 1.0 源码

话不多说，开始上代码，话都在注释里。

```js
const RESOLVED = 'RESOLVED'
const REJECTED = 'REJECTED'
const PENDING = 'PENDING'
console.log('my promise working');
class Promise {
  constructor(executor) {//new Promise时，立即调用构造函数constructor，接收用户传入的executor。
    this.status = PENDING;//默认等待态
    this.value = undefined;//用于成功时数据存储，可能是js值，undefined，promise三者之一
    this.reason = undefined;//用于失败原因储存

    let resolve = (value) => {//这两个函数不绑定到this上是因为，这两个函数不属于实例，由使用者传入
      if(this.status === PENDING) {//只有等待态才能改变状态并执行resolve函数，非等待态调用直接return
        this.status = RESOLVED//用户调用resolve时第一步，状态置为'resolve'
        this.value = value//第二步，保存成功消息
      } 
    }

    let reject = (reason) => {//同上
      if(this.status === PENDING) {//状态已经是resove或reject的时候即使调用也不执行
        this.status = REJECTED
        this.reason = reason
      }
    }

    
    try {//在executor外包裹trycatch是为了捕获运行时的错误，以及throw new Error()这种非用户主动调用reject时的情况。
      executor(resolve,reject);//执行器就是executor用户传入的函数，该函数立即执行
      //并传入两个函数给执行器使用。
      //并约定，用户认为成功或者说想调用'成功'方法或者是想将状态置为成功时使用resolve，并传入成功消息
      //反之调用reject，并传入失败原因
    } catch (error) {//假设trycatch捕获到错误，自动调用reject。
      reject(error)//也就是说，用户主动调用reject和promise内executor运行出错都会调用reject。
    }
    
  }


  //上面是promise调用时初始化执行的构造器，下面是promise这个类自带的方法
  then(onFulfilled,onRejected) { //使用者调用promise的then方法，传入成功时调用的函数，失败时调用的函数
    if(this.status === RESOLVED) {//然后then执行，根据promise的状态决定调用的函数
      onFulfilled(this.value);
    }
    if(this.status === REJECTED) {
      onRejected(this.reason)
    }
  }
}

module.exports = Promise

//也就是说，用户调用promise，promise立即执行，并改变promise的状态，当用户调用then的时候
//传入两个状态对应的要执行的方法。promise根据当前状态的不同，选择执行resolve或reject

```

## 马上试试

```js
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
```

最后输出:my promise working then resolve--- 成功

## 总结

感悟都在注释里了，这里讲点其他的吧。

前端菜鸟第一次发文战战兢兢，怕想写的东西已经有大佬写了，怕想写的知识点大家都懂太简单了，怕写少了，讲的不够清晰，怕写多了，讲的太罗嗦。

我还是比较喜欢这种讲的非常详细，层次递进的行文方式，能让每个人都能看懂，也在模仿着写。一直记得读第一遍冴羽大佬的博客的感觉，那种知识突然串联在一起，原来如此的欣喜。

如果能帮到大家就是对我最大的鼓励，1.5和2.0代码注释版已经基本完成，写好后会排markdown版发出。

myPromise1.0其实很简单的东西，但是也不排除有没发现的错误，大家轻喷，感谢阅读，感谢指错。



