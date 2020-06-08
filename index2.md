# 三步完成A+规范Promise，平均一行代码一句注释(中)

## 前言

这篇文章也是由我培训班课程的一个笔记整理后完成。

在上篇中完成了一个最基本的能处理同步状态的promise，链接在此。

这篇将通过promise 1.5完成异步处理，promise 2.0完成链式调用和处理then返回值的resolvePromise

最后的总结部分是真正精华所在，是至少看了五遍视频，review了无数次自己的代码之后的我对promise原理的文字描述。

## myPromise 1.5 过渡 

在进入promise 2.0 之前，我认为可能需要一个1.5作为过渡，专门讲一下异步的处理，其实peomise处理异步就是发布订阅模式。

这部分比较简单，直接上代码，所有相较于1.0有增加的地方都有注释，关键在理解思想。

```js
const RESOLVED = 'RESOLVED'; // 成功
const REJECTED = 'REJECTED'; // 失败
const PENDING = 'PENDING'; // 等待态

class Promise {
    constructor(executor) {
        this.status = PENDING;
        this.value = undefined;
        this.reason = undefined;
        // 专门用来存放成功的回调
        this.onResolvedCallbacks = []; 
        // 因为promise可能多次.then接收多个回调函数，所以采用栈的形式
        this.onRejectedCallbacks = []; 
        let resolve = (value) => {
            if(this.status === PENDING){
                this.value = value;
                this.status = RESOLVED;
                // executor调用resolve时执行栈中保存的回调
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
    then(onFulfilled,onRejected){
        if(this.status === RESOLVED){
            onFulfilled(this.value);
        }
        if(this.status === REJECTED ){
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
```


**总结一下**

在promise异步的情况下，promise本身(或者说promise内用户传入的executor)是立即执行的，但executor函数内部结果的是异步返回的。

而then方法是同步执行，因此比executor先执行完，于是then中传入的方法先保存起来，供executor回调调用。

也就是说，异步情况下，不确定promise状态，先执行完then，储存好then中的onFulfilled，onRejected函数，再供给executor异步返回结果确定状态后调用。

与 'mypromise1.0'中先执行完executor，确定promise状态，再执行then，根据状态决定执行哪个用户传入的函数相反。



## myPromise 2.0 介绍


`myPromise 2.0`版本解决了实现promise的两大难题:

- 链式调用

- then三种返回值的处理

和上期一样，下面先举几个例子，看一看node中的promise这两个特性。

1. promise then中的回调不管是成功的回调还是失败的回调的return都会传给下一个.then的成功的回调函数，也就是链式调用


```js
read('./na1me.txt').then((data) => {// 这里故意写错进入第一层的reject
  //第一层resolve中正常的return会被下一层的then的resolve接受
  return 'then1 [resolve] return.'
},(err) => {
  //第一层reject中正常的return也会被下一层的then的resolve接受(这里要记住，容易搞混)
  return 'then1 [reject] return.' 
}).then((data) => {
  console.log(data,'then2 [resolve] worked.');//结果是这里被调用
},(err) => {err
  console.log(err,'then2 [reject] worked.');
})
```

2. then中回调的返回值有三种情况，正常值(情况同上↑，传给下个then的resolve)，出错值(传给下个then的reject)，promise(先执行再根据这个promise结果及状态)要分别进行处理。实现resolvePromise函数进行处理

2.1 返回出错值
```js
read('./na1me.txt').then((data) => {// 这里故意写错进入reject
  throw new Error('then1 [resolve] throw error.')//第一层resolve中的报错会被下一层的then的reject接受
},(err) => {
  throw new Error('then1 [reject] throw error.')//第一层reject中的报错也会被下一层的then的reject接受
}).then((data) => {
  console.log(data,'\n---then2 [resolve] worked.'); 
},(err) => {
  console.log(err,'\n---then2 [reject] worked.');//结果是这里被调用
})
```

2.2 返回 promise
```js
read('./name.txt').then((data) => {//name.txt里的内容是age.txt
  return read(data)
}, (err) => {})
.then((data) => {//第二层执行哪个由第一层返回的promise执行完的状态判断
  console.log(data,'\n---then2 [resolve] worked.'); //这里执行并输出age.txt中的内容
}, (err) => {
  console.log(err,'\n---then2 [reject] worked.');
})
```

3. 错误没有被捕获的话，可以在后面任意一层被捕获，被捕获后这个错误将不会再向后传递
```js
read('./na1me.txt').then((data) => {//这里故意写错进入reject，而这层then没有reject
  return read(data) //这里写不写都一样，因为并没有走第一层then的resolve
})
.then((data) => {
  console.log(data,'\n---then2 [resolve] worked.');
}, (err) => {
  console.log(err,'\n---then2 [reject] worked.'); //被这里捕获，这里输出 no file na1me.txt的错
})
.then((data) => {
  console.log(data,'\n---then3 [resolve] worked.'); //然后这里被调用，因为错误在第二层被捕获了
}, (err) => {
  console.log(err,'\n---then3 [reject] worked.');
  // 补充，如果第二层then代码运行出现了错误或throw new error 就会执行这里捕获第二层而不是第一层的错误。如果第二层没有传入reject方法，则第一层的错误会被这里第三层then的reject捕获
})// 如果错误从头到尾都没有被捕获则代码运行报错
```

4. 每次执行完promise.then方法后返回的都是一个新的'promise'，这也是为什么可以一直.then
```js
read('./name.txt').then((data) => {
  return 111
})// 即使这里返回的是111也会被包装成promise，第二层的then其实是这个新promise的then
.then((data) => {
  console.log(data)
})
```

## mypromise 2.0 源码

话不多说，开始上代码，话都在注释里。

```js
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

```


## 总结

先上一段代码，后以p1,p2,p3指代三个先后产生的promise

```js
let p1 = new Promise((resolve,reject) => {
    resolve('p1')
})
p1
.then((data) => {//产生一个新promise p2
        resolve(data + ' + p2')
    }, (err) => {
        console.log(err);
    })
//实际上，下面是第二个promise p2的.then方法，与p1无关
.then((data) => {//又产生一个新promise p3
        console.log(data + ' + p3');
    }, (err) => {
        console.log(err);
    })
```
**1.将then函数本身变成了一个promise，并且执行，从而实现了能不停.then的链式调用**

实现链式调用其实就是把then函数也写成返回promise，于是then就有了状态，有自己的.then方法,p1调用then产生p2,并将数据传给p2或者说then，可以认为then就是p2

then执行就是p2执行，p2立即执行，就是onFulfilled或onRejected立即执行，执行结果代表p2的状态为成功还是失败，

根据p2的状态才执行了第二个.then方法，实现了链式调用，这就是 同步状态下 promise实现链式调用的原理!!!! 

(异步状态差不多，只不过绕了一点弯，回头总结补上)

p1的改变状态很简单易懂，执行器executor中调用了resolve p1就是resolve状态，调用了reject p1就是reject状态，

用户自己会判断并在执行器中写好p1什么情况调用哪个，决定好p1的状态，从而决定第一个.then该调用onFulfilled还是onRejected

而第二个.then该调用onFulfilled还是onRejected，要根据第一个.then 或者说 p2的状态 决定

p2的状态由onFulfilled/onRejected的返回结果x决定，x是什么，这又是第二个难点了。

**2.实现resolvePromise**

大部分情况下，不管是执行onFulfilled还是onRejected，正常运行都会调用resolve。

但是还有有另外两种情况，一种是用户写的onFulfilled/onRejected代码执行抛错，将调用reject

另一种是nFulfilled/onRejected的返回值是promise,将执行这个promise，根据这个promise的状态决定p2的状态。




