// JavaScript source code
var VINDER = (function (module) {
	var _apiRoot = "http://coxautoinc.api.mashery.com/hackathon_vinder/";
	var _api_key = "43hawqdeqhhdxd4mssvjs39t";


	module.doAjax = function (endpoint, rData, appendKey) {
		var reqData = rData || {};
		if (appendKey) {
			endpoint += (endpoint.indexOf("?") > -1 ? "&" : "?");
			endpoint += "api_key=" + _api_key;
		} else {
			reqData.api_key = _api_key;
		}
		var url = _apiRoot + endpoint;
		//alert("ajax url: " + url + "\ndata: " + JSON.stringify(reqData));
		return $.ajax({
			url: url,
			data: reqData,
			//data: JSON.stringify(reqData),
			dataType: "json"
			//contentType: 'application/json; charset=utf-8',
			//type: "GET"
		});
	};

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

	var _lastLatLon = {
		getLastLatitude: function () {
			if (Modernizr.localstorage) {
				return localStorage.lastLatitude || "";
			}
			return "";
		},
		getLastLongitude: function () {
			if (Modernizr.localstorage) {
				return localStorage.lastLongitude || "";
			}
			return "";
		},
		setLastLatitude: function (val) {
			if (Modernizr.localstorage) {
				localStorage.lastLatitude = val;
			}
		},
		setLastLongitude: function (val) {
			if (Modernizr.localstorage) {
				localStorage.lastLongitude = val;
			}
		}
	};

	

	var _uuid = getUUID();

	//#region Knockout Stuff
	var _ko_vm_factories = {
		vehicle_display: function (data) {
			var self = this;
			var isBlankObj = !data;
			data = data || {};

			self.isBlankObj = isBlankObj;
			self.Vin = data.Vin;
			self.Distance = data.Distance;
			self.MasterImage = data.MasterImage;
			self.Images = ko.observableArray(data.Images || []);
			self.AttributesDictionary = ko.observable(data.AttributesDictionary);

			self.attributes = ko.computed(function() {
				var attsObj = self.AttributesDictionary();
				var atts = [];
				for (var prop in attsObj) {
					if (attsObj.hasOwnProperty(prop)) {
						atts.push({
							key: prop,
							value: attsObj[prop]
						});
					}
				}
				return atts;
			}, this);
		},
		koVM: function () {
			var self = this;

			self.showDebug = false;	//set this to true if you want to see device info when it's loaded

			self.deviceLoaded = ko.observable(false);
			self.latitude = ko.observable(_lastLatLon.getLastLatitude());
			self.longitude = ko.observable(_lastLatLon.getLastLongitude());
			self.locationError = ko.observable();

			self.uuid = ko.observable(_uuid);
			self.prevVins = ko.observableArray();
			self.vehicle_displays = ko.observableArray();

			self.loadNextVehicleBatch = function() {
				var reqData = {
					vins: ko.toJS(self.prevVins),
					uid: self.uuid(),
					latitude: self.latitude(),
					longitude: self.longitude()
				};

				var url = "vehicles/?";
				url += "uid=" + reqData.uid;
				url += "&latitude=" + reqData.latitude;
				url += "&longitude=" + reqData.longitude;
				for (var j = 0, k=reqData.vins.length; j < k; j++) {
					url += "&vins=" + reqData.vins[j];
				}

				var ajax = module.doAjax(url, {}, true);
				ajax.done(function (data) {
					//alert("data received:\n" + JSON.stringify(data));
					if (data && $.isArray(data)) {
						for (var i = 0, l= data.length; i < l; i++) {
							self.vehicle_displays.push(new _ko_vm_factories.vehicle_display(data[i]));
						}
					}
				}).fail(function (jqXHR, textStatus, errorThrown) {
					//alert("textStatus: " + textStatus + "\nerrorThrown: " + errorThrown);
				});
			};


			self.first_vehicle = ko.computed(function () {
				var vehics = self.vehicle_displays();
				if (vehics.length > 0) {
					return vehics[0];
				}
				if (vehics.length <= 3) {
					self.loadNextVehicleBatch();
				}
				return new _ko_vm_factories.vehicle_display(null);
			}, this);

			self.loadComplete = ko.computed(function () {
				//alert("loadComplete: " + self.deviceLoaded());
				if (self.deviceLoaded()) {
					self.loadNextVehicleBatch();
				}
			}, this);

			self.actOnVehicle = function (isLike) {
				isLike = !!isLike;
				var firstVehicle = self.first_vehicle();
				if (firstVehicle) {
					var nextAnim = isLike ? "zoomOutRight" : "zoomOutLeft";
					var resultsRow = $('.results-row');
					var doStuff = function () {
						var vin = self.first_vehicle().Vin;

						var url = "likes/?";
						url += "uid=" + self.uuid();
						url += "&distance=" + self.first_vehicle().Distance;
						url += "&vin=" + vin;
						url += "&like=" + isLike;

						var ajax = module.doAjax(url, {}, true);
						ajax.done(function (data) {
							//hooray
						}).fail(function (jqXHR, textStatus, errorThrown) {
							console.log(textStatus, errorThrown);
							//alert("textStatus: " + textStatus + "\nerrorThrown: " + errorThrown);
						});
						self.prevVins.push(vin);
						if (self.prevVins().length > 5) {
							self.prevVins.shift();
						}
						self.vehicle_displays.shift();

						resultsRow.removeClass("animated " + nextAnim).addClass("animated bounceInDown");
					}
					//resultsRow.one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', doStuff);
					
					resultsRow.removeClass("animated bounceInDown").addClass("animated " + nextAnim);
					setTimeout(doStuff, 1500);

				}
				return false;
			}
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
				_lastLatLon.setLastLatitude(position.coords.latitude);
				_koVM.longitude(position.coords.longitude);
				_lastLatLon.setLastLongitude(position.coords.longitude);
			}
			_koVM.deviceLoaded(true);
		}

		var showError = function (error) {
			_koVM.latitude(null);
			_koVM.longitude(null);
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
				var options = { timeout: 25000 };
				navigator.geolocation.getCurrentPosition(showPosition, showError, options);
			} else {
				_koVM.locationError("Device does not support geolocation");
				//_koVM.deviceLoaded(true);
			}
			_koVM.deviceLoaded(true);
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

	

	return module;
}(VINDER || {}));