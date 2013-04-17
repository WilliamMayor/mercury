
module_dict=function() {
  var d=dict()
  for (var key in __BRYTHON__.modules) {
      d.__setitem__(key, __BRYTHON__.modules[key])
  }
  return d
}

$module = {
    __getattr__ : function(attr){
        if(attr==="stdout"){return document.$stdout}
        if(attr==="stderr"){return document.$stderr}
        if(attr==="modules"){return module_dict()}
        else{return $getattr(this,attr)}
        },
    __setattr__ : function(attr,value){
        if(attr==="stdout"){document.$stdout=value}
        if(attr==="stderr"){document.$stderr=value}
        },
    has_local_storage:__BRYTHON__.has_local_storage,
    has_json:__BRYTHON__.has_json,
    version_info:__BRYTHON__.version_info,
    path:__BRYTHON__.path
}
