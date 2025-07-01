const busIcon = L.icon({
  iconUrl: 'bus.PNG',
  iconSize: [22, 22],
  iconAnchor: [11, 22],
  popupAnchor: [0, -18]
});

let busMarkers = [];

function addBusMarkers(type) {
  busMarkers.forEach(m => map.removeLayer(m));
  busMarkers = [];

  galleryData[type].buses.forEach(bus => {
    const marker = L.marker(bus.coords, { icon: busIcon }).addTo(map);
    marker._busData = bus;
    marker.bindPopup(`<img src="${bus.img}" class="popup-img" onclick="openInNewPage('${bus.fullImg}')" />`);
    marker.on('popupopen', () => showBusInfo(bus));
    busMarkers.push(marker);
  });

  filterByPopulation();
}
