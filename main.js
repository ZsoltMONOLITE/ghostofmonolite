/* global L Papa */

// URLs for the geometry layer and points layer
let geomURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS4sQJDfJGptqDkY-eNDqcR1xJ_YH-X0qb9BKnYvSf34ArSCPE5ducm_-FaG1cNcO1AgQjsjGxie8Fi/pub?gid=0&single=true&output=csv";
let pointsURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQqjdVDnZ6IBD_TNSAYEAqF58fbG77bM8w68DdBtkJR-Fa8JgptB-BswaEfUG8qu3o0Cn7Mrhjn1Zeb/pub?output=csv";

window.addEventListener("DOMContentLoaded", init);

let map;
let sidebar;
let panelID = "my-info-panel";
let pointGroupLayer;
let pointsData;

function init() {
  map = L.map("map").setView([51.5, -0.1], 14);
  
  L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}{r}.png", {
    attribution: "© OpenStreetMap © CartoDB",
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(map);

  sidebar = L.control.sidebar({
    container: "sidebar",
    closeButton: true,
    position: "right",
  }).addTo(map);

  let panelContent = {
    id: panelID,
    tab: "<i class='fa fa-bars active'></i>",
    pane: "<div id='sidebar-content'><input type='text' id='searchInput' onkeyup='searchFunction()' placeholder='Search for names..' title='Type in a name'><ul id='pointList'></ul></div>",
    title: "<h2 id='sidebar-title'>Select a Location</h2>",
  };
  sidebar.addPanel(panelContent);

  map.on("click", function () {
    sidebar.close(panelID);
  });

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
  let fc = {
    type: "FeatureCollection",
    features: data.data.filter(row => row.include === "y").map(row => {
      let feature = {
        type: "Feature",
        properties: {
          name: row.name,
          description: row.description
        },
        geometry: JSON.parse(row.geometry)
      };
      return feature;
    })
  };

  L.geoJSON(fc, {
    style: { color: "#2ca25f", fillColor: "#99d8c9", weight: 2 }
  }).addTo(map);
}

function addPoints(data) {
  pointsData = data.data;
  pointGroupLayer = L.layerGroup().addTo(map);

  pointsData.forEach((row, index) => {
    let marker = L.marker([row.lat, row.lon]);
    marker.addTo(pointGroupLayer);
    marker.bindPopup(`
      <h2>${row.name}</h2>
      <p>Description: ${row.description}</p>
      <p>Program: ${row.program}</p>
      <p>Client: ${row.client}</p>
      <p>Dropbox: ${row.dropbox}</p>
    `);

    let listItem = document.createElement("li");
    listItem.innerHTML = row.name;
    listItem.onclick = function () {
      map.setView([row.lat, row.lon], 14);
      marker.openPopup();
    };
    document.getElementById("pointList").appendChild(listItem);
  });
}

function searchFunction() {
  let input, filter, ul, li, i, txtValue;
  input = document.getElementById("searchInput");
  filter = input.value.toUpperCase();
  ul = document.getElementById("pointList");
  li = ul.getElementsByTagName("li");

  for (i = 0; i < li.length; i++) {
    txtValue = li[i].textContent || li[i].innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      li[i].style.display = "";
    } else {
      li[i].style.display = "none";
    }
  }
}
