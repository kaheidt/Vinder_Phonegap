// JavaScript source code
var SILLY = (function (module) {
    module.DoIt = function (resultObject) {
        resultObject.prepend(Date() + '<br/>');
    };




    return module;
}(SILLY || {}));