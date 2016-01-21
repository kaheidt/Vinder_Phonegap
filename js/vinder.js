// JavaScript source code
var VINDER = (function (module) {
	var _apiRoot = "http://coxautoinc.api.mashery.com/hackathon_vinder/";
	var _api_key = "43hawqdeqhhdxd4mssvjs39t";


	function generateUUID() {
		var d = new Date().getTime();
		var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			var r = (d + Math.random() * 16) % 16 | 0;
			d = Math.floor(d / 16);
			return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
		});
		return uuid;
	};

	function getUUID() {
		if (Modernizr.localstorage) {
			//var _id = localStorage['uuid'] || generateUUID();
			var _id = localStorage.uuid || generateUUID();
			//localStorage['uuid'] = _id;
			localStorage.uuid = _id;
			console.log("localStorage.uuid", localStorage.uuid);
			return _id;
		}
		console.log("no localStorage");
		return generateUUID();
	}

	var _uuid = getUUID();

	//#region Knockout Stuff
	var _ko_vm_factories = {
		koVM: function () {
			var self = this;

			self.showDebug = true;	//set this to true if you want to see device info when it's loaded

			self.deviceLoaded = ko.observable(false);
			self.latitude = ko.observable();
			self.longitude = ko.observable();
			self.locationError = ko.observable();

			self.uuid = ko.observable(_uuid);
			self.vehicle_displays = ko.observableArray();
		},
		vehicle_display: function (data) {
			var self = this;
			data = data || {};

			self.Vin = data.Vin;
			self.Distance = data.Distance;
			self.MasterImage = data.MasterImage;
			self.Images = ko.observableArray(data.Images || []);
			self.AttributesDictionary = data.AttributesDictionary;
		}
	};

	var _koVM = new _ko_vm_factories.koVM();
	ko.applyBindings(_koVM);


	//#endregion

	
	//#region Device Ready
	var onDeviceReady = function () {
		console.log("device ready", window.device || device || "no device object in global");
		var showPosition = function (position) {
			console.log("showPosition", position);
			if (position && position.coords) {
				_koVM.latitude(position.coords.latitude);
				_koVM.longitude(position.coords.longitude);
			}
			_koVM.deviceLoaded(true);
		}

		var showError = function (error) {
			console.log("showError", error);
			var errorTxt = "Error code: " + error.code + " ... ";
			switch (error.code) {
				case error.PERMISSION_DENIED:
					errorTxt += "User denied the request for Geolocation.";
					break;
				case error.POSITION_UNAVAILABLE:
					errorTxt += "Location information is unavailable.";
					break;
				case error.TIMEOUT:
					errorTxt += "The request to get user location timed out.";
					break;
				case error.UNKNOWN_ERROR:
					errorTxt += "An unknown error occurred.";
					break;
			}
			_koVM.locationError(errorTxt);
			_koVM.deviceLoaded(true);
		}

		try {
			console.log("navigator.geolocation", navigator.geolocation);
			if (navigator.geolocation) {
				var options = {};
				navigator.geolocation.getCurrentPosition(showPosition, showError, options);
			} else {
				_koVM.locationError("Device does not support geolocation");
				_koVM.deviceLoaded(true);
			}
		}
		catch (ex) {
			console.log(ex);
			var errorTxt = "Error occured: " + ex + '<br />' +
							'lineNumber: ' + lineNumber + '<br />' +
							'url: ' + url + '<br />' + '<hr />';
			_koVM.locationError(errorTxt);
			_koVM.deviceLoaded(true);
			//return false;
		}
	};

	//$(document).on('deviceready', onDeviceReady);
	document.addEventListener('deviceready', onDeviceReady, false);
	//#endregion


	module.koVM = _koVM;

	module.doAjax = function (endpoint, rData) {
		var reqData = rData || {};
		reqData.api_key = _api_key;
		return $.ajax({
			url: _apiRoot + endpoint,
			data: reqData,
			//data: JSON.stringify(d),
			dataType: "json"
			//contentType: 'application/json; charset=utf-8',
			//type: "GET"
		});
	};
	

	return module;
}(VINDER || {}));