/*
	config:{
		key:'_pageParam',//缓存管理器中的key值，默认值_pageParam
		scope:['common','','']//缓存域，会有一个默认值common
	}
*/
function ModuleData(cacheManager,config){
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
	var body=document.getElementsByTagName('body');
	if(body){
		body=body[0];
	}
	var curScope=body.getAttribute('datascope');
	if(!curScope)curScope='common';
	if(this._isInScope(curScope)){
		this.curScope=curScope;
	}
}
ModuleData.prototype.use=function(scope){
	if(!scope)scope=this.curScope;
	if(!this._isInScope(scope)){return;}
	this.curScope=scope;
}
ModuleData.prototype.get=function(name,scope){
	if(!scope)scope=this.curScope;
	if(!this._isInScope(scope)){return undefined;}
	var json=this._getJson();
	var data=json[scope];
	if(!data){
		return undefined;
	}
	return data[name];
}
/*
	两种调用方式：
	1、md.set('mykey','myvalue','myscope');
	2、md.set({
		key1:val1,
		key2:val2
	},'myscope');
	第二种方式会在数据域中新增传入的key
*/
ModuleData.prototype.set=function(name,value,scope){
	if(typeof name == 'object'){
		scope=value;
	}
	if(!scope)scope=this.curScope;
	if(!this._isInScope(scope)){return;}
	var json=this._getJson();
	if(!json[scope]){
		json[scope]={};
	}
	if(typeof name == 'string'){
		json[scope][name]=value;
	}else{
		for(var i in name){
			json[scope][i]=name[i];
		}
	}
	this.cacheManager.set(this.config.key,JSON.stringify(json));
}
ModuleData.prototype.del=function(scope){
	if(!scope)scope=this.curScope;
	if(!this._isInScope(scope)){return;}
	var json=this._getJson();
	if(json&&json[scope]){
		delete json[scope];
		this.cacheManager.set(this.config.key,JSON.stringify(json));
	}
}
ModuleData.prototype.setTemp=function(name,value,scope){
	if(typeof name == 'object'){
		scope=value;
	}
	if(!scope)scope=this.curScope;
	if(!this._isInScope(scope)){return;}
	var json=this._getJson();
	if(!json[scope]){
		json[scope]={};
	}
	json[scope]._temp={};
	if(typeof name == 'string'){
		json[scope]._temp[name]=value;
	}else{
		for(var i in name){
			json[scope]._temp[i]=name[i];
		}
	}
	this.cacheManager.set(this.config.key,JSON.stringify(json));
}
ModuleData.prototype.getTemp=function(name,scope){
	if(!scope)scope=this.curScope;
	if(!this._isInScope(scope)){return undefined;}
	var json=this._getJson();
	var data=json[scope];
	if(data&&data._temp&&data._temp[name]){
		return data._temp[name];
	}
	if(data&&data[name]){
		return data[name];
	}
	return undefined;
}
ModuleData.prototype.isTemp=function(name,scope){
	if(!scope)scope=this.curScope;
	if(!this._isInScope(scope)){return undefined;}
	var json=this._getJson();
	var data=json[scope];
	if(data&&data._temp&&data._temp[name]){
		return true;
	}else{
		return false;
	}
}
ModuleData.prototype.getAllTemp=function(scope){
	if(!scope)scope=this.curScope;
	if(!this._isInScope(scope)){return undefined;}
	var json=this._getJson();
	var data=json[scope];
	if(data&&data._temp){
		return data._temp;
	}else{
		return null;
	}
}
ModuleData.prototype.commit=function(scope){
	if(!scope)scope=this.curScope;
	if(!this._isInScope(scope)){return;}
	var json=this._getJson();
	var data=json[scope];
	if(!data||!data._temp){
		return;
	}
	for(var i in data._temp){
		data[i]=data._temp[i];
	}
	delete data._temp;
	this.cacheManager.set(this.config.key,JSON.stringify(json));
}
/*判断当前scope是否在config中配置过*/
ModuleData.prototype._isInScope=function(name){
	var flag=false;
	var scope=this.config.scope;
	for(var i in scope){
		if(name == scope[i]){
			flag=true;
		}
	}
	return flag;
}
ModuleData.prototype._getJson=function(name){
	var json=this.cacheManager.get(this.config.key);
	if(!json){
		json={};
	}else{
		json=JSON.parse(json);
	}
	return json;
}