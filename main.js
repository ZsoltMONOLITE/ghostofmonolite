/* global L Papa */
// PASTE YOUR URLs HERE
// these URLs come from Google Sheets 'shareable link' form
// the first is the geometry layer and the second the points
let geomURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vS4sQJDfJGptqDkY-eNDqcR1xJ_YH-X0qb9BKnYvSf34ArSCPE5ducm_-FaG1cNcO1AgQjsjGxie8Fi/pub?gid=0&single=true&output=csv";
let pointsURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQqjdVDnZ6IBD_TNSAYEAqF58fbG77bM8w68DdBtkJR-Fa8JgptB-BswaEfUG8qu3o0Cn7Mrhjn1Zeb/pub?output=csv";
window.addEventListener("DOMContentLoaded", init);
let map;
let panelID = "my-info-panel";
function init() {
  map = L.map("map").setView([51.5, -0.1], 14);
  // This is the Carto Positron basemap
  L.tileLayer(
    "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png",
    {
      attribution:
        "© <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> © <a href='http://cartodb.com/attributions'>CartoDB</a>",
      subdomains: "abcd",
      maxZoom: 19,
    }
  ).addTo(map);
  // Use PapaParse to load data from Google Sheets
  // And call the respective functions to add those to the map.
  Papa.parse(geomURL, {
    download: true,
    header: true,
    complete: addGeoms,
  });
  Papa.parse(pointsURL, {
    download: true,
    header: true,
    complete: addPoints,
  });
}
function addGeoms(data) {
  data = data.data;
  let fc = {
    type: "FeatureCollection",
    features: [],
  };
  for (let row in data) {
    if (data[row].include === "y" || data[row].include === "2_Registered" || data[row].include === "1_Admin") {
      let features = parseGeom(JSON.parse(data[row].geometry));
      features.forEach((el) => {
        el.properties = {
          name: data[row].name,
          description: data[row].description,
        };
        fc.features.push(el);
      });
    }
  }
  let geomStyle = { color: "black", fillColor: "#adbab7", weight: 2 };
  let geomHoverStyle = { color: "green", fillColor: "#1e751e", weight: 4 };
  L.geoJSON(fc, {
    onEachFeature: function (feature, layer) {
      layer.on({
        mouseout: function (e) {
          e.target.setStyle(geomStyle);
        },
        mouseover: function (e) {
          e.target.setStyle(geomHoverStyle);
        },
        click: function (e) {
    // Create a popup content string
    var popupContent = "<b>" + e.target.feature.properties.name + "</b><br>" + e.target.feature.properties.description;
    // Create a popup and set its content
    var popup = L.popup()
        .setLatLng(e.latlng)
        .setContent(popupContent);
	map.setView(e.latlng, 12);
    // Open the popup on the map
    popup.openOn(map);
},
      });
    },
    style: geomStyle,
  }).addTo(map);
}
function addPoints(data) {
  data = data.data;
  let pointGroupLayer = L.layerGroup().addTo(map);
  let markerType = "marker";
  let markerRadius = 100;

  for (let row = 0; row < data.length; row++) {
    let marker;
    if (markerType == "circleMarker") {
      marker = L.circleMarker([data[row].lat, data[row].lon], {
        radius: markerRadius,
      });
    } else if (markerType == "circle") {
      marker = L.circle([data[row].lat, data[row].lon], {
        radius: markerRadius,
      });
    } else {
      marker = L.marker([data[row].lat, data[row].lon]);
    }

    marker.name = data[row].name; // Extend marker with a name property for search

    let descriptionLink = data[row].description ? `<p>Description: <a href="${data[row].description}" target="_blank"> &gt; Go there &lt;</a></p>` : '';
    let dropboxLink = data[row].dropbox ? `<p>Dropbox: <a href="${data[row].dropbox}" target="_blank"> &gt; Dropbox Link &lt;</a></p>` : '';

    marker.bindPopup(`
      <h2>Project: ${data[row].name}</h2>
      ${descriptionLink}
      <p>Program: ${data[row].program}</p>
      <p>Client: ${data[row].client}</p>
      ${dropboxLink}
    `);

    marker.on({
      click: function (e) {
        map.setView(e.latlng, map.getZoom() + 2);
      },
    });

    let icon = L.AwesomeMarkers.icon({
      icon: "info-circle",
      iconColor: "white",
      markerColor: data[row].color,
      prefix: "fa",
      extraClasses: "fa-rotate-0",
    });

    if (!markerType.includes("circle")) {
      marker.setIcon(icon);
    }

    if (data[row].include === "y" || data[row].include === "2_Registered" || data[row].include === "1_Admin") {
      pointGroupLayer.addLayer(marker);
    }
  }

  // Add search control
  var searchControl = new L.Control.Search({
    layer: pointGroupLayer,
    propertyName: 'name',
    marker: false,
    moveToLocation: function(latlng, title, map) {
      map.setView(latlng, map.getZoom()); // Adjust to set the desired zoom level
    }
  });

  searchControl.on('search:locationfound', function(e) {
    e.layer.openPopup();
  });

  map.addControl(searchControl);
}
function parseGeom(gj) {
  // FeatureCollection
  if (gj.type == "FeatureCollection") {
    return gj.features;
  }
  // Feature
  else if (gj.type == "Feature") {
    return [gj];
  }
  // Geometry
  else if ("type" in gj) {
    return [{ type: "Feature", geometry: gj }];
  }
  // Coordinates
  else {
    let type;
    if (typeof gj[0] == "number") {
      type = "Point";
    } else if (typeof gj[0][0] == "number") {
      type = "LineString";
    } else if (typeof gj[0][0][0] == "number") {
      type = "Polygon";
    } else {
      type = "MultiPolygon";
    }
    return [{ type: "Feature", geometry: { type: type, coordinates: gj } }];
  }
}
