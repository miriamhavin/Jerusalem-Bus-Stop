let selectedPopTypes = [];
let currentType = "a";

// Handle legend filtering
function filterByPopulation() {
  const showAll = selectedPopTypes.length === 0;

  neighborhoodsLayer.setStyle(feature => {
    const name = feature.properties["SCHN_NAME"];
    const pop = populationByNeighborhood[name] || "לא ידוע";
    return {
      color: "#232323",
      weight: 0.1,
      fillColor: populationColor(pop),
      fillOpacity: showAll || selectedPopTypes.includes(pop) ? 0.37 : 0.09,
      opacity: showAll || selectedPopTypes.includes(pop) ? 1 : 0.14
    };
  });

  busMarkers.forEach(marker => {
    const bus = marker._busData;
    const pop = bus.neighborhood ? (populationByNeighborhood[bus.neighborhood] || "לא ידוע") : "לא ידוע";
    if (showAll || selectedPopTypes.includes(pop)) {
      marker.addTo(map);
    } else {
      map.removeLayer(marker);
    }
  });
}

function populationColor(type) {
  switch (type) {
    case "חרדית - רמת הומוגניות נמוכה": return "#b39ddb";
    case "חרדית - רמת הומוגניות גבוהה": return "#512da8";
    case "יהודית - חילונית": return "#5bc0eb";
    case "ערבית": return "#f86f03";
    case "אזור לא למגורים": return "#5fbf9b";
    default: return "#bbbbbb";
  }
}

function getTextColor(bgColor) {
  const c = bgColor.replace('#', '');
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b > 170) ? '#222' : '#fff';
}

function showBusInfo(bus) {
  const panel = document.getElementById('info-panel');
  panel.innerHTML = '';

  const div = document.createElement('div');
  div.className = 'bus-info';

  const type = populationByNeighborhood[bus.neighborhood] || "לא ידוע";
  const color = populationColor(type);
  const textColor = getTextColor(color);

  const popPill = document.createElement('div');
  popPill.className = 'pop-type-label';
  popPill.style.background = color;
  popPill.style.color = textColor;
  popPill.textContent = type;
  div.appendChild(popPill);

  const title = document.createElement('h3');
  title.textContent = bus.id;
  div.appendChild(title);

  const hood = document.createElement('div');
  hood.textContent = `שכונה: ${bus.neighborhood}`;
  div.appendChild(hood);

  ['analysisImg', 'sketchImg', 'graffitiImg'].forEach(key => {
    if (bus[key]) {
      const label = document.createElement('div');
      label.textContent = key === 'sketchImg' ? 'סקיצה' : key === 'graffitiImg' ? 'גרפיטי' : 'ניתוח';
      label.style.color = '#ccc';
      label.style.margin = '8px 0 6px';
      div.appendChild(label);

      const img = document.createElement('img');
      img.src = bus[key];
      img.className = 'image-outlined';
      img.style.borderColor = color;
      div.appendChild(img);
    }
  });

  panel.appendChild(div);
  panel.classList.remove('hidden');
}

function openInNewPage(url) {
  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>Image</title><style>
      body { margin: 0; background: #111; display: flex; align-items: center; justify-content: center; height: 100vh; }
      img { max-width: 98vw; max-height: 98vh; box-shadow: 0 0 18px #000; border-radius: 16px; }
    </style></head><body><img src="${url}" /></body></html>
  `);
  win.document.close();
}

// Tabs
document.querySelectorAll('.analysis-tab').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.analysis-tab').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    currentType = this.dataset.type;
    addBusMarkers(currentType);
  });
});

// Initial run
window.onload = function () {
  const defaultType = document.querySelector('.analysis-tab.active').dataset.type;
  addBusMarkers(defaultType);
};
