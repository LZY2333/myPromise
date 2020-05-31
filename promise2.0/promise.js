const RESOLVED = 'RESOLVED';
const REJECTED = 'REJECTED';
const PENDING = 'PENDING';

class Promise {
    constructor(executor) {
        this.status = PENDING;
        this.value = undefined;
        this.reason = undefined;
        this.onResolvedCallbacks = []; 
        this.onRejectedCallbacks = []; 
        let resolve = (value) => {
            if(this.status === PENDING){
                this.value = value;
                this.status = RESOLVED;
                this.onResolvedCallbacks.forEach(fn=>fn());
            }
        }
        let reject = (reason) => {
            if(this.status === PENDING){
                this.reason = reason;
                this.status = REJECTED;
                this.onRejectedCallbacks.forEach(fn=>fn());
            }
        }
        try{
            executor(resolve,reject);
        }catch(e){
            reject(e);
        }
    }
    then(onFulfilled,onRejected){// 为了实现链式调用，把整个then函数也变成一个promise，这样就有.then方法了
        let promise2 = new Promise((resolve, reject) => {//new promise 传入executor，立即执行
            if(this.status ===RESOLVED){
                //难点，注意这里为什么要加settimeout
                //因为下面的resolvePromise中用到了promise2自己本身
                //而在去掉setTimeout的情况下promise2的new操作里的构造函数里的executor都还没执行完成
                //所以此时promise2还没有初始化完成，无法传给resolvePromise，会显示promise2 undefined。
                //所以这里用setTimeout，这样写会将resolvePromise放在下一个事件循环执行，事件循环的知识这里不讲了，可以认为和异步一样在同步代码执行完之后执行。

                setTimeout(() => {
                    let x = onFulfilled(this.value); //这里获取到用户resolve回调函数运行的返回值，也就是then函数会获取到resolve中return的值
                    //补充，这里不用担心onFulfilled也就是用户传入的resolve抛错，因为会被promise2的try/catch捕获
                    resolvePromise(promise2,x,resolve,reject) //这里判断return返回值类型(正常值、错误值、promise)，决定promise2的状态
                },0)
            }//下面改动的原因和这里一样
            if(this.status ===REJECTED ){
                setTimeout(() => {
                    let x = onRejected(this.reason)
                    resolvePromise(promise2,x,resolve,reject)
                },0)
            }
    
            if(this.status === PENDING){
                this.onResolvedCallbacks.push(()=>{
                    setTimeout(() => {//这里完全可以不用加setTimeout，因为本身就是异步的，不需要settimeout。加了是为了保持代码一致(好看)
                        let x = onFulfilled(this.value);
                        resolvePromise(promise2,x,resolve,reject)
                    },0)
                });
                this.onRejectedCallbacks.push(()=>{
                    setTimeout(() => {
                        let x = onRejected(this.reason);
                        resolvePromise(promise2,x,resolve,reject)
                    },0)
                });
            }
        })
    }
}
module.exports = Promise


