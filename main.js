/* global L Papa */

for (let row = 0; row < data.length; row++) {
  let marker;

  // add condition
  if (data[row].include === "y" || data[row].include === "2_Registered" || data[row].include === "1_Admin") {
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
    marker.addTo(pointGroupLayer);

    // Pop-up marker with all data
    marker.bindPopup(`
      <h2>Project: ${data[row].name}</h2>
      <p>Description: <a href="${data[row].description}" target="_blank"> &gt; Go there &lt;</a></p>
      <p>Program: ${data[row].program}</p>
      <p>Client: ${data[row].client}</p>
      <p>Dropbox: <a href="${data[row].dropbox}" target="_blank"> &gt; Dropbox Link &lt;</a></p>
    `);

    marker.on({
      click: function (e) {
	L.DomEvent.stopPropagation(e);
	map.setView(e.latlng, map.getZoom() + 2);
      },
    });

    // AwesomeMarkers is used to create fancier icons
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
  }
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
