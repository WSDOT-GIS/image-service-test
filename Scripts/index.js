/*global L*/
(function (L) {
	"use strict";
	var map, imgSvcUrl, baseLayer, imgLayer;

	imgSvcUrl = "http://hqolymgis99t/arcgis/rest/services/Airport/AirportRasterTest/ImageServer";

	map = L.map('map').setView(
		 [47.41322033015946, -120.80566406246835], 7);

	baseLayer = L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: 'Map data &copy; <a href="//openstreetmap.org">OpenStreetMap</a> contributors, <a href="//creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
		maxZoom: 18
	}).addTo(map);

	imgLayer = L.esri.Layers.imageMapLayer(imgSvcUrl, {
		opacity: 0.5
	}).addTo(map);

	L.control.layers({ OpenStreetMap: baseLayer }, {"Raster": imgLayer}).addTo(map);

	map.on('click', function (e) {
		L.esri.Tasks.identifyImage({
			url: imgSvcUrl
		}).at([e.latlng.lat, e.latlng.lng]).run(function (error, identifyImageResponse, rawResponse) {
			if (error) {
				console.error(error);
			} else {
				console.debug({
					identifyImageRespnose: identifyImageResponse,
					rawResponse: rawResponse
				});
			}
		});
	});
}(L));