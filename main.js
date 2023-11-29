/* global L Papa */

/*
 * Script to display two tables from Google Sheets as point and geometry layers using Leaflet
 * The Sheets are then imported using PapaParse and overwrite the initially laded layers
 */

// PASTE YOUR URLs HERE
// these URLs come from Google Sheets 'shareable link' form
// the first is the geometry layer and the second the points
let geomURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vS4sQJDfJGptqDkY-eNDqcR1xJ_YH-X0qb9BKnYvSf34ArSCPE5ducm_-FaG1cNcO1AgQjsjGxie8Fi/pub?output=csv";
let pointsURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQqjdVDnZ6IBD_TNSAYEAqF58fbG77bM8w68DdBtkJR-Fa8JgptB-BswaEfUG8qu3o0Cn7Mrhjn1Zeb/pub?output=csv";

window.addEventListener("DOMContentLoaded", init);

let map;
let sidebar;
let panelID = "my-info-panel";

/*
 * init() is called when the page has loaded
 */
function init() {
  map = L.map('map').setView([51.5, -0.1], 14);
  sidebar = L.control.sidebar({
    container: 'sidebar',
    closeButton: true,
    position: 'right',
  }).addTo(map);
  panelContent = {
    id: panelID,
    tab: '<i class="fa fa-bars active"></i>',
    pane: '<p id="sidebar-content"></p>',
    title: '<h2 id="sidebar-title">Nothing selected</h2>',
  };
  sidebar.addPanel(panelContent);
  map.on('click', function () {
    sidebar.close(panelID);
  });
  Papa.parse(geomURL, { download: true, header: true, complete: addGeoms });
  Papa.parse(pointsURL, { download: true, header: true, complete: addPoints });
}

/*
 * Expects a JSON representation of the table with properties columns
 * and a 'geometry' column that can be parsed by parseGeom()
 */
function addGeoms(data) {
  data = data.data;
  // Need to convert the PapaParse JSON into a GeoJSON
  // Start with an empty GeoJSON of type FeatureCollection
  // All the rows will be inserted into a single GeoJSON
  let fc  
