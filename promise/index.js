class Promise {
    status = "pending";
    value = undefined;
    reason = undefined;
    onFulfilledList = [];
    onRejectedList = [];

    constructor(excutor){
        let resolve = (value) => {
            if(this.status === "pending"){
                this.status = "fulfilled";
                this.value = value;
                Object.freeze(this);

                this.onFulfilledList.forEach((fn) => fn(this.value));
            }
        };

       let reject = (reason) =>{
            if(this.status === "pending"){
                this.status = "rejected";
                this.reason = reason;
                Object.freeze(this);

                this.onRejectedList.forEach(fn => fn(this.reason));
            }
        };
        
        try {
            excutor(resolve, reject);
        } catch(e){
            reject(e);
        }
    }

    then(onFulfilled, onRejected){
        // 执行回调
        const excutorCb = (cb, valueKey, resolve, reject) => {
            setTimeout(() => {
                const value = this[valueKey];
                if(typeof cb === "function"){
                    try {
                        const x = cb(value);
                        promiseResolution(promise2, x, resolve, reject);
                    } catch(e){
                        reject(e);
                    }
                } else {
                    if(valueKey === "value"){
                        resolve(value);
                    } else if(valueKey === "reason"){
                        reject(value);
                    }
                }
            });
        }

        // promise解析
        const promiseResolution = (promise, x, resolve, reject) =>{
            if(promise === x) {
                reject(new TypeError("循环啦循环啦！"));
            } else if(x instanceof Promise){
                if(x.status === "pending") {
                    x.then(y => {
                        promiseResolution(promise, y, resolve, reject);
                    }, reject);
                } else if(x.status === "fulfilled"){
                    resolve(x.value);
                }  else if(x.status === "rejected"){
                    reject(x.reason);
                }
            } else {
                if(x !== null && /^(object|function)$/.test(typeof x)){
                    let isCalled = false;
                    try {
                        const then = x.then;
                        if(typeof then === "function"){
                            let resolvePromise = (y) => {
                                if(isCalled) return;
                                isCalled = true;
                                promiseResolution(promise, y, resolve, reject);
                            }
                            let rejectPromise = (r) => {
                                if(isCalled) return;
                                isCalled = true;
                                reject(r);
                            }
                            then.call(x, resolvePromise, rejectPromise);
                        } else {
                            resolve(x);
                        }
                    } catch(e) {
                        if(isCalled) return;
                        reject(e);
                    }
                } else {
                    resolve(x);
                }
            }
        }
        const promise2 =  new Promise((resolve, reject) => {
            if(this.status === "pending"){
                this.onFulfilledList.push(() => {
                    excutorCb(onFulfilled, "value", resolve, reject);
                });
                
                this.onRejectedList.push(() => {
                    excutorCb(onRejected, "reason", resolve, reject);
                });
            } 
            else if(this.status === "fulfilled"){
                excutorCb(onFulfilled, "value", resolve, reject);
            } 
            else if(this.status === "rejected"){
                excutorCb(onRejected, "reason", resolve, reject);
            }
        });
        return promise2;
    }

    catch(onRejected) {
        this.then(null, onRejected);
    }

    static resolve(value){
        return new Promise(resolve => {
            resolve(value);
        });
    }

    static reject(reason){
        return new Promise((resolve, reject) => {
            reject(reason);
        });
    }

    static all(promises){
        return new Promise((resolve, reject) => {
            try {
                const results = [];
                let resolvedCount = 0;
                promises.forEach((x, i) => {
                    if(x instanceof Promise){
                        x.then(value => {
                            results[i] = value;
                            resolvedCount++;
                            if(resolvedCount === promises.length){
                                resolve(results);
                            }
                        }, error => {
                            reject(error);
                        });
                    } else {
                        results[i] = x;
                        resolvedCount++;
                        if(resolvedCount === promises.length){
                            resolve(results);
                        }
                    }
                });
            } catch(e) {
                reject(e);
            }
        });
    }
}