
/*global L*/
(function (L) {
	"use strict";
	var map, imgSvcUrl, osmLayer, imgLayer;

	/**
	 * Provides information about surface penetration.
	 * @param {number} agl
	 * @param {number} surfaceElevation
	 * @param {number} terrainElevation
	 */
	function SurfacePenetrationInfo(agl, surfaceElevation, terrainElevation) {
		if (typeof surfaceElevation === "string") {
			if (surfaceElevation === "NoData") {
				throw new Error("Surface elevation has no data.");
			} else {
				surfaceElevation = parseFloat(surfaceElevation);
			}
		}

		this.distanceFromSurface = surfaceElevation - terrainElevation;
		this.penetrationOfSurface = agl - this.distanceFromSurface;
		this.agl = agl;
		this.surfaceElevation = surfaceElevation;
		this.terrainElevation = terrainElevation;
	}

	/**
	 * Indicates if a surface has been penetrated.
	 * @returns {Boolean}
	 */
	SurfacePenetrationInfo.prototype.penetratesSurface = function () {
		return this.penetrationOfSurface > 0;
	};

	/**
	 * Creates a TileLayer using tiles from thunderforest.com.
	 * @param {string} name - The name of the layer. This is part of the URL.
	 * @returns {L.TileLayer}
	 */
	function createThunderforestTileLayer(name) {
		return L.tileLayer('http://{s}.tile.thunderforest.com/' + name + '/{z}/{x}/{y}.png', {
			attribution: 'Maps © <a href="http://www.thunderforest.com/">Thunderforest</a>, Data © <a href="//openstreetmap.org">OpenStreetMap</a> contributors',
			detectRetina: true,
			subdomains: "abc",
		});
	}

	/**
	 * Creates a TileLayer using tiles from thunderforest.com.
	 * @param {string} name - The name of the layer. This is part of the URL.
	 * @returns {L.TileLayer}
	 */
	function createMapQuestTileLayer(name) {
		var attribution = 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">,' +
						' Data © <a href="//openstreetmap.org">OpenStreetMap</a> contributors';

		if (name === 'sat') {
			attribution += ", Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency";
		}

		return L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/' + name + '/{z}/{x}/{y}.png', {
			attribution: attribution,
			detectRetina: true,
			subdomains: "1234",
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
	 * @param {SurfacePenetrationInfo} surfacePenetrationInfo
	 * @returns {L.Marker}
	 */
	function addMarkerToMap(latlng, surfacePenetrationInfo) {
		/**
		 * Creates a definition list
		 * @returns {HTMLDListElement}
		 */
		function createDl(info) {
			var dl;

			function addItem(name, value) {
				var dt, dd;
				dt = document.createElement("dt");
				dt.textContent = name;
				dl.appendChild(dt);

				dd = document.createElement("dd");
				dd.textContent = value;
				dl.appendChild(dd);
			}

			dl = document.createElement("dl");
			addItem("Penetrates Surface", info.penetratesSurface() ? "Yes" : "No");
			addItem("Distance from Surface", info.distanceFromSurface +  "′");
			addItem("Penetration of Surface", info.penetrationOfSurface + "′");
			addItem("AGL", info.agl + "′");
			addItem("Surface Elev.", info.surfaceElevation + "′");
			addItem("Terrain Elev.", info.terrainElevation + "′");
			
			return dl;
		}

		return L.marker(latlng, {
			icon: L.divIcon({
				html: surfacePenetrationInfo.surfaceElevation,
				className: surfacePenetrationInfo.penetratesSurface() ? "elevation-div-icon penetrates-surface" : "elevation-div-icon",
				iconSize: [30, 13]
			})
		}).addTo(map).bindPopup(createDl(surfacePenetrationInfo));
	}

	imgSvcUrl = "http://hqolymgis99t/arcgis/rest/services/Airport/Statewide_40ft_Int/ImageServer";

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
		"Outdoors": createThunderforestTileLayer("outdoors"),
		"MapQuest-OSM": createMapQuestTileLayer("map"),
		"MapQuest Open Aerial": createMapQuestTileLayer("sat")
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

		var heightPromise, elevationPromise;
		var aglBox = document.getElementById("aglBox");
		var agl = aglBox.value;
		if (agl) {
			agl = parseInt(agl, 10);
		}
		if (agl > 0) {
			heightPromise = createIdentifyPromise(imgSvcUrl, e.latlng);
			elevationPromise = createElevationPromise(e.latlng);

			Promise.all([heightPromise, elevationPromise]).then(function (responses) {
				var heightResponse = responses[0];
				var elevationResponse = responses[1];
				var elev = elevationResponse.Elevation;
				var height = heightResponse.identifyImageResponse.pixel.properties.value;
				var info = new SurfacePenetrationInfo(agl, height, elev);
				addMarkerToMap([elevationResponse.y, elevationResponse.x], info).openPopup();
			}, function (err) {
				console.error("all error", err);
			});
		} else {
			alert("Undefined AGL");
		}
	}

	map.on('click', beginQuery);
}(L));