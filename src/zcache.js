/*
    config:{
        cache:{
            "cachename":{
                key:"storeKey",
                url:"",
                realTime:true,
                maxAge:0,//缓存时长,毫秒,默认为0，为0的时候表示无限长
                count:0//缓存读取次数
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
(function(){
    function ZCache(config){
        if(!config){
            config={
                cache:{}
            };
        }
        this.config=config;
        if(!this.config.remote){
            this.config.remote={
                func:function(args,tools){
                    $.ajax({
                        url: tools.getUrl(),
                        type: "POST",
                        data : args[1] +"&_=" + (new Date()).getTime(),
                        cache: false,
                        dataType: "json",
                        beforeSend: function (xhr) {
                            xhr.overrideMimeType("text/plain; charset=utf-8");
                        },
                        success: function(json) {
                            tools.tag(args[1],1);
                            tools.success(args,json);
                        },
                        error: function(e) {
                            console.log(args);
                            tools.error(args);
                        }
                    });
                },
                success:function(args,json){
                    args[2]('success',json);
                },
                error:function(args){
                    args[2]('error',{returnMessage:'服务器连接出错了，请稍后再试！'});
                }
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
    ZCache.prototype.getRemote=function(name){
        var target=this.config.cache[name];
        var json=this.getNative(name);
        //可以获取缓存必须符合以下条件
        //1、缓存中已有数据
        //2、配置中未指定数据是实时的
        //3、tag字段的值相同
        //4、缓存数据时长没有超过maxAge
        var time=new Date().getTime();
        if(json&&!target.realTime&&json._tagVal==arguments[json._tagIndex]&&
            (!parseInt(target.maxAge)||(time-json._create)<parseInt(target.maxAge))&&
            (!parseInt(target.count)||parseInt(target.count)>parseInt(json._count))){
            json._count++;
            this.setNative(name,json);
            //callback('success',json._data);
            var args=[];
            for(var attr in arguments){
                args.push(arguments[attr]);
            }
            this.config.remote.success(args,json._data);
            return;
        }else{
            this.updateRemote.apply(this,arguments);
        }
    }
    
    ZCache.prototype.updateRemote=function(name){
        var _th = this;
        var args=[];
        for(var i in arguments){
            args.push(arguments[i]);
        }
        this.config.remote.func.call(this,args,mkTools(this,args[0]));
    }

    function mkTools(zcache,cacheName){
        return {
            getUrl:function(){
                return zcache.config.cache[cacheName].url;
            },
            success:function(args,data){
                var json=zcache.getNative(cacheName);

                if(!json){json={}}

                json._create=new Date().getTime();
                json._count=1;
                json._data=data;
                zcache.setNative(cacheName,json);
                zcache.config.remote.success(args,data);
            },
            tag:function(tagVal,tagIndex){
                var json=zcache.getNative(cacheName);
                if(!json){json={}}
                json._tagVal=tagVal;
                json._tagIndex=tagIndex;
                zcache.setNative(cacheName,json);
            },
            error:function(args){
                zcache.del(cacheName);
                zcache.config.remote.error(args);
            }
        }
    }




    ZCache.prototype.setNative=function(name,param){
        var target=this.config.cache[name];
        var cacheKey=target.key;
        var json=processObj(param);
        this.utils.setJson(cacheKey,json);
    }

    function processObj(obj){
        if(obj instanceof Function){
            return {
                _z_type_:'Function',
                _z_val_:obj.toString().replace(/\s/g,'')
            };
        }else if(obj instanceof Date){
            return {
                _z_type_:'Date',
                _z_val_:obj.getTime()
            };
        }else if(obj instanceof Array){
            var arr=[];
            for(var i=0;i<obj.length;i++){
               arr[i]=arguments.callee(obj[i]);
            }
            return arr;
        }else if(typeof obj == 'object'){
            var json = {};
            for(var attr in obj){
                json[attr] = arguments.callee(obj[attr]);
            }
            return json;
        }else{
            return obj;
        }
    }

    ZCache.prototype.getNative=function(name){
        var target=this.config.cache[name];
        var cacheKey=target.key;
        var json=this.utils.getJson(cacheKey);
        if(!json){
            return json;
        }
        json=reconsitutionObj(json);
        return json;
    }
    function reconsitutionObj(obj){
        if(!obj)return obj;
        var type=obj._z_type_;
        if(type == 'Function'){
            return eval('('+obj._z_val_+')');
        }else if(type == 'Date'){
            return new Date(obj._z_val_);
        }else if(obj instanceof Array){
            var arr=[];
            for(var i=0;i<obj.length;i++){
               arr[i]=arguments.callee(obj[i]);
            }
            return arr;
        }else if(typeof obj == 'object'){
            var json = {};
            for(var attr in obj){
                json[attr] = arguments.callee(obj[attr]);
            }
            return json;
        }else{
            return obj;
        }
    }
    ZCache.prototype.get=function(name){
        if( arguments.length>1 ){
            this.getRemote.apply(this,arguments);
            return null;
        }else{
            var o=this.getNative(name);
            if(o&&o._data){
                return o._data;
            }else{
                return o;
            }
        }
    }
    ZCache.prototype.set=function(name,param){
        var target=this.config.cache[name];
        if(target.url){
            var o=this.getNative(name);  
            if(!o){o={}}
            o._data=param;
            this.setNative(name,o);
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
    window.ZCache=ZCache;
})()

