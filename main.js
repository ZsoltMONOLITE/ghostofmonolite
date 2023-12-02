// PASTE YOUR URLs HERE
let geomURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vS4sQJDfJGptqDkY-eNDqcR1xJ_YH-X0qb9BKnYvSf34ArSCPE5ducm_-FaG1cNcO1AgQjsjGxie8Fi/pub?gid=0&single=true&output=csv";
let pointsURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQqjdVDnZ6IBD_TNSAYEAqF58fbG77bM8w68DdBtkJR-Fa8JgptB-BswaEfUG8qu3o0Cn7Mrhjn1Zeb/pub?output=csv";

window.addEventListener("DOMContentLoaded", init);

let map;
let sidebar;
let panelID = "my-info-panel";

function init() {
  map = L.map("map").setView([51.5, -0.1], 14);
  L.tileLayer(
    "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png",
    {
      attribution:
        "© <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> © <a href='http://cartodb.com/attributions'>CartoDB</a>",
      subdomains: "abcd",
      maxZoom: 19,
    }
  ).addTo(map);

  sidebar = L.control
    .sidebar({
      container: "sidebar",
      closeButton: true,
      position: "right",
    })
    .addTo(map);

  let panelContent = {
    id: panelID,
    tab: "<i class='fa fa-bars active'></i>",
    pane: "<p id='sidebar-content'></p>",
    title: "<h2 id='sidebar-title'>Nothing selected</h2>",
  };
  sidebar.addPanel(panelContent);

  let namesList = [];

  map.on("click", function () {
    sidebar.close(panelID);
  });

  Papa.parse(geomURL, {
    download: true,
    header: true,
    complete: function (result) {
      addGeoms(result, namesList);
    },
  });
    Papa.parse(pointsURL, {
    download: true,
    header: true,
    complete: addPoints,
  });

  let options = {
    valueNames: ["name"],
    listClass: "names-list",
    searchClass: "names-search",
  };

  let names = new List("sidebar-names", options);
  names.add(namesList);
}

function addGeoms(data, namesList) {
  data = data.data;
  let fc = {
    type: "FeatureCollection",
    features: [],
  };
  for (let row in data) {
    if (data[row].include == "y") {
      let features = parseGeom(JSON.parse(data[row].geometry));
      features.forEach((el) => {
        el.properties = {
          name: data[row].name,
          description: data[row].description,
        };
        fc.features.push(el);
        namesList.push(data[row].name);
      });
    }
  }

  let geomStyle = { color: "#2ca25f", fillColor: "#99d8c9", weight: 2 };
  let geomHoverStyle = { color: "green", fillColor: "#2ca25f", weight: 3 };

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
          L.DomEvent.stopPropagation(e, click);
          document.getElementById("sidebar-title").innerHTML =
            e.target.feature.properties.name;
          document.getElementById("sidebar-content").innerHTML =
            e.target.feature.properties.description;
          sidebar.open(panelID);
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
    marker.addTo(pointGroupLayer);

    marker.feature = {
      properties: {
        name: data[row].name,
        description: data[row].description,
        program: data[row].program,
        client: data[row].client,
        dropbox: data[row].dropbox,
      },
    };
    marker.on({
      click: function (e) {
        L.DomEvent.stopPropagation(e);
        document.getElementById("sidebar-title").innerHTML =
          e.target.feature.properties.name;
        document.getElementById("sidebar-content").innerHTML =
          e.target.feature.properties.description;
        document.getElementById("sidebar-content").innerHTML =
          e.target.feature.properties.program;
        document.getElementById("sidebar-content").innerHTML =
          e.target.feature.properties.client;
        document.getElementById("sidebar-content").innerHTML =
          e.target.feature.properties.dropbox;
        sidebar.open(panelID);
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
  }
}

function parseGeom(gj) {
  if (gj.type == "FeatureCollection") {
    return gj.features;
  } else if (gj.type == "Feature") {
    return [gj];
   } else if ("type" in gj) {
    return [{ type: "Feature", geometry: gj }];
  } else {
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
