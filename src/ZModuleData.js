;(function(){
	/*
		config:{
			key:'_pageParam',//缓存管理器中的key值，默认值_pageParam
			scope:['common','','']//缓存域，会有一个默认值common
		}
	*/
	var ZModuleData=function(cacheManager,config){
		if(!config)config={};
		this.config=config;
		this.cacheManager=cacheManager;
		if(!this.config.key){
			this.config.key='_pageParam';
		}
		if(!this.config.scope){
			this.config.scope=[];
		}
		this.config.scope.push('common');
		var cache={};
		cache[this.config.key]={
			key:this.config.key
		};
		this.cacheManager.addCache(cache);
		this.curScope='common';

		this.readyScope={};
		this.readyTempScope={};
	}
	ZModuleData.prototype.use=function(scope){
		if(!scope)scope=this.curScope;
		if(!_isInScope(this.config.scope,scope)){return;}
		this.curScope=scope;
	}
	ZModuleData.prototype.get=function(name,scope){
		if(!scope)scope=this.curScope;
		if(!_isInScope(this.config.scope,scope)){return undefined;}
		var data=this.getScope(scope);
		if(!data){
			return undefined;
		}
		return data[name];
	}
	ZModuleData.prototype.getScope=function(scope){
		if(!scope)scope=this.curScope;
		if(!_isInScope(this.config.scope,scope)){return undefined;}
		var json=this.readyScope[scope];
		if(!json){
			json=_getJson(this.cacheManager,this.config.key)[scope];
		}
		return json;
	}
	ZModuleData.prototype.setScope=function(obj,scope){
		if(!scope)scope=this.curScope;
		if(!_isInScope(this.config.scope,scope)){return;}
		var json=_getJson(this.cacheManager,this.config.key);
		json[scope]=obj;
		this.cacheManager.set(this.config.key,json);
		if(this.readyScope[scope]){
			this.readyScope[scope]=obj;
		}
	}
	/*
		两种调用方式：
		1、md.set('mykey','myvalue','myscope');
		2、md.set({
			key1:val1,
			key2:val2
		},'myscope');
		第二种方式会在数据域中新增或覆盖传入的key
	*/
	ZModuleData.prototype.set=function(name,value,scope){
		if(typeof name == 'object'){
			scope=value;
		}
		if(!scope)scope=this.curScope;
		if(!_isInScope(this.config.scope,scope)){return;}
		var json=this.getScope(scope);
		if(!json){
			json={};
		}
		if(typeof name == 'string'){
			json[name]=value;
		}else{
			for(var i in name){
				json[i]=name[i];
			}
		}
		if(this.readyScope[scope]){
			this.readyScope[scope]=json;
		}
		this.setScope(json,scope);
	}
	ZModuleData.prototype.del=function(scope){
		if(!scope)scope=this.curScope;
		if(!_isInScope(this.config.scope,scope)){return;}
		var json=_getJson(this.cacheManager,this.config.key);
		if(json&&json[scope]){
			delete json[scope];
			this.cacheManager.set(this.config.key,json);
		}
	}

	ZModuleData.prototype.setTempScope=function(obj,scope){
		if(!scope)scope=this.curScope;
		if(!_isInScope(this.config.scope,scope)){return;}
		var json=this.getScope(scope);
		if(!json){
			json={};
		}
		json._z_temp_=obj;
		this.setScope(json,scope);
	}

	ZModuleData.prototype.getTempScope=function(scope){
		if(!scope)scope=this.curScope;
		if(!_isInScope(this.config.scope,scope)){return;}
		var json=this.getScope(scope);
		if(json&&json._z_temp_){
			for(var attr in json._z_temp_){
				json[attr]=json._z_temp_[attr];
			}
		}
		return json;
	}



	ZModuleData.prototype.setTemp=function(name,value,scope){
		if(typeof name == 'object'){
			scope=value;
		}
		if(!scope)scope=this.curScope;
		if(!_isInScope(this.config.scope,scope)){return;}
		var json=this.getScope(scope);
		if(!json){
			json={};
		}
		json._z_temp_={};
		if(typeof name == 'string'){
			json._z_temp_[name]=value;
		}else{
			for(var i in name){
				json._z_temp_[i]=name[i];
			}
		}
		this.setScope(json,scope);
	}
	ZModuleData.prototype.getTemp=function(name,scope){
		if(!scope)scope=this.curScope;
		if(!_isInScope(this.config.scope,scope)){return undefined;}
		var data=this.getScope(scope);
		if(data&&data._z_temp_&&data._z_temp_[name]){
			return data._z_temp_[name];
		}
		if(data&&data[name]){
			return data[name];
		}
		return undefined;
	}
	ZModuleData.prototype.isTemp=function(name,scope){
		if(!scope)scope=this.curScope;
		if(!_isInScope(this.config.scope,scope)){return undefined;}
		var data=this.getScope(scope);
		if(data&&data._z_temp_&&data._z_temp_[name]){
			return true;
		}else{
			return false;
		}
	}
/*	ZModuleData.prototype.getAllTemp=function(scope){
		if(!scope)scope=this.curScope;
		if(!_isInScope(this.config.scope,scope)){return undefined;}
		var data=this.getScope(scope);
		if(data&&data._z_temp_){
			return data._z_temp_;
		}else{
			return null;
		}
	}*/
	ZModuleData.prototype.commitTemp=function(scope){
		if(!scope)scope=this.curScope;
		if(!_isInScope(this.config.scope,scope)){return;}
		var data=this.getScope(scope);
		if(!data||!data._z_temp_){
			return;
		}
		for(var i in data._z_temp_){
			data[i]=data._z_temp_[i];
		}
		delete data._z_temp_;
		this.setScope(data,scope);
	}


	


	ZModuleData.prototype.ready=function(arr,fuc){
		var data=this.readyScope;
		for(var i in arr){
			data[arr[i]]=this.getScope(arr[i]);
			data[arr[i]]=data[arr[i]]?data[arr[i]]:{};
		}
		fuc.apply(this,[data]);
		this.commit();
	}
	ZModuleData.prototype.commit=function(){
		var scope=this.readyScope;
		for(var attr in scope){
			this.set(scope[attr],attr);
		}
	}


	ZModuleData.prototype.on=function(id,event,clazz,callback){
		//var data=arguments.callee.caller.arguments[0];
		var i=(typeof arguments[2] == 'function')?2:3;
		var cb=arguments[i];
		if(cb){
			arguments[i]=this.mcb(cb);
			$(id).on(event,clazz,callback);
		}
	}

	ZModuleData.prototype.setTimeout=function(callback,time){
		setTimeout(this.mcb(callback),time);
	}

	ZModuleData.prototype.ajax=function(options){
		for(var attr in options){
			var f=options[attr];
			if(typeof f == 'function'){
				options[attr]=this.mcb(f);
			}
		}
		$.ajax(options);
	}

	ZModuleData.prototype.mcb=function(cb){
		var _th=this;
		return function(){
			var arg=[_th.readyScope];
			for(var attr in arguments){
				arg.push(arguments[attr])
			}
			cb.apply(this,arg);
			_th.commit();
		}
	}

	/*判断当前scope是否在config中配置过*/
	function _isInScope(scope,name){
		var flag=false;
		for(var i in scope){
			if(name == scope[i]){
				flag=true;
			}
		}
		return flag;
	}
	function _getJson(cacheManager,key){
		var json=cacheManager.get(key);
		if(!json){
			json={};
		}
		return json;
	}

	window.ZModuleData=ZModuleData;
})();