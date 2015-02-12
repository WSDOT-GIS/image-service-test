/*global L*/
(function (L) {
	"use strict";
	var map, imgSvcUrl, osmLayer, imgLayer;

	/**
	 * Creates a TileLayer using tiles from thunderforest.com.
	 * @param {string} name - The name of the layer. This is part of the URL.
	 * @returns {L.TileLayer}
	 */
	function createThunderforestTileLayer(name) {
		return L.tileLayer('http://{s}.tile.thunderforest.com/' + name + '/{z}/{x}/{y}.png', {
			attribution: 'Maps © <a href="http://www.thunderforest.com/">Thunderforest</a>, Data © <a href="//openstreetmap.org">OpenStreetMap</a> contributors',
			detectRetina: true,
			subdomains: ['a', 'b', 'c'],
		});
	}

	/**
	 * Converts an object into a query string.
	 * @param {object} o
	 * @returns {string}
	 */
	function toQueryStringParameters(o) {
		var output = [];
		for (var name in o) {
			if (o.hasOwnProperty(name)) {
				output.push([name, o[name]].join("="));
			}
		}
		return output.join("&");
	}

	/**
	 * Adds a marker to the map
	 * @param {LatLng} latlng
	 * @param {object} identifyImageResponse
	 * @param {number} elevation
	 * @returns {L.Marker}
	 */
	function addMarkerToMap(latlng, identifyImageResponse, elevation) {
		/**
		 * Creates a definition list
		 * @returns {HTMLDListElement}
		 */
		function createDl() {
			var dl = document.createElement("dl"), dt, dd;

			dt = document.createElement("dt");
			dt.textContent = "Pixel value";
			dl.appendChild(dt);

			dd = document.createElement("dd");
			dd.textContent = identifyImageResponse.pixel.properties.value;
			dl.appendChild(dd);

			dt = document.createElement("dt");
			dt.textContent = "Elevation";
			dl.appendChild(dt);

			dd = document.createElement("dd");
			dd.textContent = elevation;
			dl.appendChild(dd);
			
			return dl;
		}

		return L.marker(latlng, {
			icon: L.divIcon({
				html: String(identifyImageResponse.pixel.properties.value) + "&prime;",
				className: "elevation-div-icon",
				iconSize: [30, 13]
			})
		}).addTo(map).bindPopup(createDl());
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

	// Create overlays

	imgLayer = L.esri.Layers.imageMapLayer(imgSvcUrl, {
		opacity: 0.5
	}).addTo(map);

	L.control.layers({
		OpenStreetMap: osmLayer,
		"Landscape": createThunderforestTileLayer("landscape"),
		"Transport": createThunderforestTileLayer("transport"),
		"Transport Dark": createThunderforestTileLayer("transport-dark"),
		"OpenCycleMap": createThunderforestTileLayer("cycle"),
		"Outdoors": createThunderforestTileLayer("outdoors")
	}, {
		"Airport Surfaces": imgLayer
	}).addTo(map);

	function createElevationPromise(latlng) {
		return new Promise(function (resolve, reject) {
			var baseUrl = "http://ned.usgs.gov/epqs/pqs.php";
			var params = {
				x: latlng.lng,
				y: latlng.lat,
				units: "Feet",
				output: "json"
			};
			var request = new XMLHttpRequest();
			request.open("get", [baseUrl, toQueryStringParameters(params)].join("?"));
			request.onloadend = function () {
				/*
				{
					"USGS_Elevation_Point_Query_Service": {
						"Elevation_Query": {
							"x": -123,
							"y": 45,
							"Data_Source": "NED 1/3 arc-second",
							"Elevation": 177.965854,
							"Units": "Feet"
						}
					}
				}
				 */
				var response = JSON.parse(this.responseText);
				resolve(response.USGS_Elevation_Point_Query_Service.Elevation_Query);
			};
			request.onerror = function (e) {
				reject(e);
			};
			request.send();
		});
	}

	function createIdentifyPromise(imgSvcUrl, latlng) {
		return new Promise(function (resolve, reject) {
			L.esri.Tasks.identifyImage({
				url: imgSvcUrl
			}).at(latlng).run(function (error, identifyImageResponse, rawResponse) {
				if (error) {
					reject(error);
				} else {
					resolve({
						latlng: latlng,
						identifyImageResponse: identifyImageResponse,
						rawResponse: rawResponse
					});
				}
			});
		});
	}


	/**
	 * Starts the query
	 * @param {L.MouseEvent} e
	 */
	function beginQuery(e) {

		var heightPromise = createIdentifyPromise(imgSvcUrl, e.latlng);
		var elevationPromise = createElevationPromise(e.latlng);

		Promise.all([heightPromise, elevationPromise]).then(function (responses) {
			var heightResponse = responses[0];
			var elevationResponse = responses[1];
			console.debug("all response", arguments);
			addMarkerToMap([elevationResponse.y, elevationResponse.x], heightResponse.identifyImageResponse, elevationResponse.Elevation).openPopup();
		}, function (err) {
			console.error("all error", err);
		});
	}

	map.on('click', beginQuery);
}(L));