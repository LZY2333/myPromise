//1.5 考虑异步的情况
//1.5版本先给大家看代码，这部分比较简单，增加的内容不多，增加的代码都有注释，主要理解思想。看完后有解析。

const RESOLVED = 'RESOLVED'; // 成功
const REJECTED = 'REJECTED'; // 失败
const PENDING = 'PENDING'; // 等待态

class Promise {
    constructor(executor) {
        this.status = PENDING;
        this.value = undefined;
        this.reason = undefined;
        this.onResolvedCallbacks = []; // 专门用来存放成功的回调
        this.onRejectedCallbacks = []; // 因为promise可能多次.then接收多个回调函数，所以采用栈的形式
        let resolve = (value) => {
            if(this.status === PENDING){
                this.value = value;
                this.status = RESOLVED;
                this.onResolvedCallbacks.forEach(fn=>fn());// executor调用resolve时执行栈中保存的回调
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
    then(onFulfilled,onRejected){
        if(this.status ===RESOLVED){
            onFulfilled(this.value);
        }
        if(this.status ===REJECTED ){
            onRejected(this.reason)
        }

        if(this.status === PENDING){//执行到then时promise状态还是pending，说明executor异步
            this.onResolvedCallbacks.push(()=>{//异步时，将用户传入的onFulfilled函数保存起来(闭包)
              //在回调调用用户传入的onFulfilled前会做一些操作(下一版加入)
                onFulfilled(this.value);
            });
            //这里不能直接this.onResolvedCallbacks.push(onFulfilled())这样onFulfilled会立即执行
            //也没有采用this.onResolvedCallbacks.push(onFulfilled)这样虽然不会直接执行但是，不方便扩展
            this.onRejectedCallbacks.push(()=>{
               onRejected(this.reason);
            });
        }
    }
}
module.exports = Promise



// 在promise异步的情况下，promise本身(或者说promise内用户传入的executor)是立即执行的，但executor函数内部结果的是异步返回的。
// 而then方法是同步执行，因此比executor先执行完，所以then中传入的方法先保存起来，供executor回调调用。
// 总结就是，异步情况下，不确定promise状态，先执行完then，储存then中的onFulfilled，onRejected函数，再供给executor异步返回结果确定状态后调用
// 与 'mypromise1.0'中先执行完executor，确定promise状态，再执行then，根据状态决定执行哪个用户传入的函数相反。

