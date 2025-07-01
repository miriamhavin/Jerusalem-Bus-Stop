// Base map layers
const streetLayer = L.tileLayer(
  'https://tiles.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  {
    attribution: '&copy; CARTO & OpenStreetMap',
    subdomains: 'abcd',
    maxZoom: 20
  }
);

const satelliteLayer = L.tileLayer(
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  {
    attribution: 'Tiles &copy; Esri'
  }
);

// Create map
window.map = L.map('map', {
  center: [31.76543, 35.22162],
  zoom: 13,
  layers: [streetLayer]
});

// Neighborhood polygon layer
window.neighborhoodsLayer = L.esri.featureLayer({
  url: "https://services.arcgis.com/IYUfZFmrlf94i3k0/arcgis/rest/services/Neighborhoods/FeatureServer/0",
  style: feature => {
    const name = feature.properties["SCHN_NAME"];
    const type = populationByNeighborhood[name] || "לא ידוע";
    return {
      color: "#232323",
      weight: 0.1,
      fillColor: populationColor(type),
      fillOpacity: 0.37
    };
  },
  onEachFeature: (feature, layer) => {
    const name = feature.properties["SCHN_NAME"] || "שכונה";
    const pop = populationByNeighborhood[name] || "לא ידוע";
    layer.bindPopup(`<b>${name}</b><br>סוג אוכלוסיה: ${pop}`);
  }
});

neighborhoodsLayer.addTo(map);

const baseLayers = { "רחוב": streetLayer, "לוויין": satelliteLayer };
const overlayLayers = { "שכונות": neighborhoodsLayer };
L.control.layers(baseLayers, overlayLayers, { collapsed: false }).addTo(map);
