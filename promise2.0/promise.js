const RESOLVED = 'RESOLVED';
const REJECTED = 'REJECTED';
const PENDING = 'PENDING';






const resolvePromise = (promise2, x, resolve, reject) => {
    console.log(promise2, x, resolve, reject);
}


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
    then(onFulfilled,onRejected){// 为了实现链式调用，把整个then函数也变成返回一个promise，这样返回值就有.then方法了
        let promise2 = new Promise((resolve, reject) => {//new promise 传入executor，立即执行
            if(this.status ===RESOLVED){
                //难点，注意这里为什么要加settimeout
                //因为下面的resolvePromise中要传入promise2自己本身
                //而在去掉setTimeout的情况下promise2的new操作里的构造函数里的executor都还没执行完成
                //所以此时promise2还没有初始化完成，相当于还没有promise2无法传给resolvePromise，会显示promise2 undefined。
                //所以这里用setTimeout，这样写会将resolvePromise放在下一个事件循环执行，事件循环的知识这里不讲了，可以认为和异步一样在同步代码执行完之后执行。
                //在node自己实现的promise中不是用settimeout的，而是用更底层的方法,但是使用settimeout方法是A+规范里建议方法之一，所以不用担心。
                setTimeout(() => {
                    try {
                        let x = onFulfilled(this.value); //这里获取到用户resolve回调函数运行的返回值，也就是then函数会获取到resolve中return的值
                        //补充，这里本来不用担心onFulfilled也就是用户传入的resolve执行抛错，因为这里属于promise2的executor报错会被promise2的try/catch捕获
                        //      但是由于外层包了settimeout，变成了异步，而try/catch无法捕获异步错误，所以得再包一层try/catch
                        resolvePromise(promise2,x,resolve,reject) //这里x有三种情况(正常值、错误值、promise)，这个函数根据x决定调用resolve还是reject    
                    } catch (e) {// 抛错就直接让promise2失败
                        reject(e)
                    }
                    
                },0)
            }//下面改动的原因和这里一样
            if(this.status ===REJECTED ){
                setTimeout(() => {
                    try {
                        let x = onRejected(this.reason)
                        resolvePromise(promise2,x,resolve,reject)
                    } catch (e) {
                        reject(e)
                    }
                },0)
            }
    
            if(this.status === PENDING){
                this.onResolvedCallbacks.push(()=>{
                    setTimeout(() => {//这里完全可以不用加setTimeout，因为本身就是异步的，不需要settimeout。加了是为了保持代码一致(好看)
                        try {
                            let x = onFulfilled(this.value);
                            resolvePromise(promise2,x,resolve,reject)
                        } catch (e) {
                            reject(e)
                        }
                    },0)
                });
                this.onRejectedCallbacks.push(()=>{
                    setTimeout(() => {
                        try {
                            let x = onRejected(this.reason);
                            resolvePromise(promise2,x,resolve,reject)
                        } catch (e) {
                            reject(e)
                        }
                    },0)
                });
            }
        })
    }
}



// resolvePromise 所有的promise都要坚持 bluebird q  es6-promise
const resolvePromise = (promise2, x, resolve, reject) => {
    // 1.循环引用 自己等待自己完成 错误的实现
    // let p = new Promise((resolve,reject) => {
    //     resolve(1)
    // }) 
    // let p2 = p.then(data => {
    //     return p2// 报错，因为这里promise p2的返回值还是p2，而resolvePromise方法内，
    //     //当onFulfilled/onRejected的返回值X是promise时，会执行返回的这个promise，再根据这个promise的返回值决定p2的状态
    //     //而这里返回值还是p2，p2的状态又由内部的p2决定，无限循环。所以当用户这样使用promise时会报错
    //     //所以我们自己写resolvePromise时，要针对返回值还是这个promise实例自己时，要识别并报错。
    // })
    // p2.then(() => {},() => {}) // 报错TypeError: Chaining cycle detected for promise #<Promise>
    
    if (promise2 === x) { // 用一个类型错误 结束掉promise
        return reject(new TypeError('Chaining cycle detected for promise #<Promise>'))
    }
    // 后续的条件要严格判断 保证代码能和别的库一起使用
    let called;
    if ((typeof x === 'object' && x != null) || typeof x === 'function') { // 有可能是一个promise
        // 要继续判断
        try {
            let then = x.then;
            if (typeof then === 'function') { // 只能认为是一个promise了
                // 不要写成x.then  直接then.call就可以了 因为x.then 会再次取值
                then.call(x, y => { // 根据promise的状态决定是成功还是失败
                    if (called) return;
                    called = true;
                    resolvePromise(promise2, y, resolve, reject); // 递归解析的过程
                }, e => {
                    if (called) return;
                    called = true;
                    reject(e); // 只要失败就失败
                });
            } else { // {then:'23'}
                resolve(x);
            }
        } catch (e) { // 防止失败了再次进入成功
            if (called) return;
            called = true;
            reject(e); // 取值出错
        }
    } else {
        resolve(x);
    }
}




module.exports = Promise


// let p1 = new Promise((resolve,reject) => {
//     resolve('p1')
// })
// p1
// .then((data) => {//产生一个新promise p2
//         resolve(data + ' + p2')
//     }, (err) => {
//         console.log(err);
//     })
// //实际上，下面是第二个promise p2的.then方法，与p1无关
// .then((data) => {//又产生一个新promise p3
//         console.log(data + ' + p3');
//     }, (err) => {
//         console.log(err);
//     })

//     总结:1.将then函数本身变成了一个promise，并且执行，从而实现了能不停.then的链式调用
//     实现链式调用其实就是把then函数也写成返回promise，于是then就有了状态，有自己的.then方法,p1调用then产生p2,并将数据传给p2或者说then，可以认为then就是p2
//     then执行就是p2执行，p2立即执行，就是onFulfilled或onRejected立即执行，执行结果代表p2的状态为成功还是失败，
//     根据p2的状态才执行了第二个.then方法，实现了链式调用，这就是 同步状态下 promise实现链式调用的原理!!!! 
//     (异步状态差不多，只不过绕了一点弯，回头总结补上)

//     p1的改变状态很简单易懂，执行器executor中调用了resolve p1就是resolve状态，调用了reject p1就是reject状态，
//     用户自己会判断并在执行器中写好p1什么情况调用哪个，决定好p1的状态，从而决定第一个.then该调用onFulfilled还是onRejected
//     而第二个.then该调用onFulfilled还是onRejected，要根据第一个.then 或者说 p2的状态 决定
//     p2的状态由onFulfilled/onRejected的返回结果x决定，x是什么，这又是第二个难点了。

//     2.实现了resolvePromise
//     大部分情况下，不管是执行onFulfilled还是onRejected，正常运行都会调用resolve。
//     但是还有有另外两种情况，一种是用户写的onFulfilled/onRejected代码执行抛错，将调用reject
//     另一种是nFulfilled/onRejected的返回值是promise,将执行这个promise，根据这个promise的状态决定p2的状态。

