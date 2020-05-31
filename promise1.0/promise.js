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