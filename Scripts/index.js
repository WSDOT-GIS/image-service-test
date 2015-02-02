/*global L*/
(function (L) {
	"use strict";
	var map, imgSvcUrl;

	imgSvcUrl = "http://hqolymgis99t/arcgis/rest/services/Airport/AirportRasterTest/ImageServer";

	map = L.map('map').setView(
		 [46.97116044960811, -123.93646717071533], 15);

	L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: 'Map data &copy; <a href="//openstreetmap.org">OpenStreetMap</a> contributors, <a href="//creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
		maxZoom: 18
	}).addTo(map);

	map.on('click', function (e) {
		var x, y;
		x = e.latlng.lng;
		y = e.latlng.lat;
		console.debug([x, y]);

		var request = new XMLHttpRequest();


		var point = {
			x: x,
			y: y,
			spatialReference: {
				wkid: 4326
			}
		};
		request.open("GET", imgSvcUrl + "/identify?f=json&geometryType=esriGeometryPoint&outSR=4326&geometry=" + JSON.stringify(point));

		request.onloadend = function () {
			var json = JSON.parse(this.responseText);
			console.debug(json);
		};

		request.send();
	});
}(L));