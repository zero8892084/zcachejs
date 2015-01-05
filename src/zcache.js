/*
    config:{
        cache:{
            "cachename":{
                key:"storeKey",
                url:"",
                realTime:true,
                maxAge:0//缓存时长,毫秒,默认为0，为0的时候表示无限长
            }
        },
        remoteFun:ajaxfunction
    }
    ajaxfunction(url,param,chain)是调用远程数据的方法,
    自行实现该方法时,必须在该方法内部调用chain方法。
    chain.success(json);//获取数据成功
    chain.error(json);//获取数据失败
    如果不设置ajaxfunction，那么会默认使用jQuery的ajax方法来实现
*/

function ZCache(config){
    this.config=config;
    if(!this.config.remoteFun){
        this.config.remoteFun=function(url,param,chain){
            $.ajax({
                url: url,
                type: "POST",
                data : param +"&_=" + (new Date()).getTime(),
                cache: false,
                dataType: "json",
                beforeSend: function (xhr) {
                    xhr.overrideMimeType("text/plain; charset=utf-8");
                },
                success: function(json) {
                    chain.success( json );
                },
                error: function(e) {
                    chain.error( "error", {"returnMessage":"服务器连接出错,请稍后再试!"} );
                },
                complete:function(){
                }
            });
        }
    }
}
ZCache.prototype.utils={
    setStr: function(name, value) {
        localStorage.setItem(name, value);
    },
    getStr: function(name) {
        return localStorage.getItem(name);
    },
    remove:function(name){
        localStorage.removeItem(name);
    },
    clear:function(){
        //清除所有的存储，谨慎使用
        localStorage.clear();
    },
    setJson:function(name,json){
        var str=JSON.stringify(json);
        this.setStr(name,str);
    },
    getJson:function(name){
        var str=this.getStr(name);
        if(str){
            return JSON.parse(str);
        }else{
            return null;
        }
    }
}
ZCache.prototype.getRemote=function(name,param,callback){
    var target=this.config.cache[name];
    if(!target.url){
        return;
    }
    var cacheKey=target.key;
    var json=this.utils.getJson(cacheKey);
    //可以获取缓存必须符合以下条件
    //1、缓存中已有数据
    //2、配置中未指定数据是实时的
    //3、访问后端数据的入参相同
    //4、缓存数据时长没有超过maxAge
    var time=new Date().getTime();
    if(json&&!target.realTime&&json._param==param&&
        (!parseInt(target.maxAge)||(time-json._create)<parseInt(target.maxAge))){
        callback('success',json);
        return;
    }else{
        this.updateRemote(name,param,callback);
    }
}
ZCache.prototype.updateRemote=function(name,param,callback){
    var target=this.config.cache[name];
    if(!target.url){
        return;
    }
    var cacheKey=target.key;
    var _self = this;
    this.config.remoteFun(target.url,param,{
        success:function(json){
            json._param=param;
            json._create=new Date().getTime();
            _self.utils.setJson(cacheKey,json);
            callback('success',json,true);
        },
        error:function(json){
            _self.del(name);
            callback('error',json,true);
        }
    });
}
ZCache.prototype.setNative=function(name,param){
    var target=this.config.cache[name];
    var cacheKey=target.key;
    this.utils.setStr(cacheKey,param);
}
ZCache.prototype.getNative=function(name){
    var target=this.config.cache[name];
    var cacheKey=target.key;
    return this.utils.getStr(cacheKey);
}
ZCache.prototype.get=function(name,param,callback){
    if(callback && typeof callback == 'function'){
        this.getRemote(name,param,callback);
        return null;
    }else{
        return this.getNative(name);
    }
}
ZCache.prototype.set=function(name,param,callback){
    if(callback && typeof callback == 'function'){
        this.updateRemote(name,param,callback);
    }else{
        this.setNative(name,param);
    }
}
ZCache.prototype.del=function(name){
    var target=this.config.cache[name];
    var cacheKey=target.key;
    this.utils.remove(cacheKey);
}
ZCache.prototype.clearAll=function(){
    var cache=this.config.cache;
    for(var attr in cache){
        var target=cache[attr];
        var cacheKey=target.key;
        this.utils.remove(cacheKey);
    }
}
ZCache.prototype.addCache=function(c){
    var cache=this.config.cache;
    for(var i in c){
        cache[i]=c[i];
    }
}

