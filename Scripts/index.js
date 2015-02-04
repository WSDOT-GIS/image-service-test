/*global L*/
(function (L) {
	"use strict";
	var map, imgSvcUrl, osmLayer, imgLayer, landscapeLayer, openCycleMapLayer, transportLayer, outdoorsLayer, transportDarkLayer;

	/**
	 * Creates a TileLayer using tiles from thunderforest.com.
	 * @param {string} name - The name of the layer. This is part of the URL.
	 */
	function createThunderforestTileLayer(name) {
		return L.tileLayer('http://{s}.tile.thunderforest.com/' + name + '/{z}/{x}/{y}.png', {
			attribution: 'Maps © <a href="http://www.thunderforest.com/">Thunderforest</a>, Data © <a href="//openstreetmap.org">OpenStreetMap</a> contributors',
			detectRetina: true,
			subdomains: ['a', 'b', 'c'],
		});
	}

	imgSvcUrl = "http://hqolymgis99t/arcgis/rest/services/Airport/AirportRasterTest/ImageServer";

	map = L.map('map', {
		center: [47.41322033015946, -120.80566406246835],
		zoom: 7,
		maxZoom: 18
	});

	L.control.scale().addTo(map);

	// Create basemaps

	osmLayer = L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: 'Map data &copy; <a href="//openstreetmap.org">OpenStreetMap</a> contributors, <a href="//creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
		detectRetina: true
	}).addTo(map);
	landscapeLayer = createThunderforestTileLayer("landscape");
	openCycleMapLayer = createThunderforestTileLayer("cycle");
	transportLayer = createThunderforestTileLayer("transport");
	outdoorsLayer = createThunderforestTileLayer("outdoors");
	transportDarkLayer = createThunderforestTileLayer("outdoors-dark");

	// Create overlays

	imgLayer = L.esri.Layers.imageMapLayer(imgSvcUrl, {
		opacity: 0.5
	}).addTo(map);

	L.control.layers({
		OpenStreetMap: osmLayer,
		"Landscape": landscapeLayer,
		"Transport": transportLayer,
		"Transport Dark": transportDarkLayer,
		"OpenCycleMap": openCycleMapLayer,
		"Outdoors": outdoorsLayer
	}, {
		"Airport Surfaces": imgLayer
	}).addTo(map);

	map.on('click', function (e) {
		L.esri.Tasks.identifyImage({
			url: imgSvcUrl
		}).at(e.latlng).run(function (error, identifyImageResponse, rawResponse) {
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