  function busBgPngForSignType(signType) {
  // Map sign types to background PNGs
  switch(signType) {
    case "עד הניצחון": return "background_7.png";
    case "מטה משפחות החטופים": return "background_3.png";
    case "שלטי תחבורה ציבורית": return "background_4.png";
    case "מדבקות הנצחה": return "background_5.png";
    case "מודעות פרטיות": return "background_2.png";
    case "שלטים נגד ביבי": return "background_1.png";
    case "שלטי חבד": return "background_6.png";
    default: return "background_default.png";
  }
}

  function busPngForPopulation(type) {
  switch(type) {
    case "חרדית - רמת הומוגניות נמוכה": return "bus_purple.png";
    case "חרדית - רמת הומוגניות גבוהה": return "bus_darkpurple.png";
    case "יהודית - כללית": return "bus_blue.png";
    case "ערבית": return "bus_orange.png";
    case "אזור לא למגורים": return "bus_green.png";
    default: return "bus_default.png";
  }
}

    let currentType = "a";
    let activeLegend = 'color'; 

    if (!Chart.registry.plugins.get('centerText')) {
        Chart.register({
          id: 'centerText',
          afterDraw(chart) {
            const { ctx, chartArea } = chart;
            const dataset = chart.data.datasets[0];
            if (!dataset || !dataset.data.length) return;

            const total = dataset.data.reduce((a, b) => a + b, 0);
            const centerX = (chartArea.left + chartArea.right) / 2;
            const centerY = (chartArea.top + chartArea.bottom) / 2;

            ctx.save();
            ctx.textAlign = 'center';
            ctx.fillStyle = '#000000';

            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.fillText('סה"כ', centerX, centerY - 10);

            ctx.font = 'bold 14px Inter, sans-serif';
            ctx.fillText(total, centerX, centerY + 8);

            ctx.restore();
          }
        });
      }
    if (typeof window.selectedBorderBuckets === "undefined") window.selectedBorderBuckets = [];

    var streetLayer = L.tileLayer(
      'https://tiles.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }
    );
    var satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri'
      }
    );
    var map = L.map('map', {
      center: [31.76973, 35.208990],
      zoom: 13,
      layers: [streetLayer]
    });

    // --- Multi-select legend logic ---
    let selectedPopTypes = [];
    let selectedSizeBuckets = [];
    let selectedOpacityBuckets = [];
    let selectedBorderBuckets = [];

    function createCompositeBusIcon(busImgUrl, bgImgUrl, size=100) {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');

        const bgImg = new Image();
        const busImg = new Image();

        let loaded = 0;
        function checkLoaded() {
          loaded++;
          if (loaded === 2) {
            ctx.clearRect(0, 0, size, size);
            ctx.drawImage(bgImg, 0, 0, size, size);      // Draw background first
            const BUS_SCALE = 0.6; // 60% of size; change as you like!
            const busSize = size * BUS_SCALE;
            const offset = (size - busSize) / 2;
            ctx.drawImage(busImg, offset, offset, busSize, busSize);
            resolve(canvas.toDataURL());                 // Use as Leaflet icon
          }
        }

        bgImg.onload = checkLoaded;
        busImg.onload = checkLoaded;
        bgImg.onerror = busImg.onerror = reject;

        bgImg.src = bgImgUrl;
        busImg.src = busImgUrl;
      });
    }


    function filterByPopulation() {
      const showAll = selectedPopTypes.length === 0;
      neighborhoodsLayer.setStyle(function(feature) {
        const name = feature.properties["SCHN_NAME"];
        const pop = populationByNeighborhood[name] || "לא ידוע";
        if (showAll || selectedPopTypes.includes(pop)) {
          return {
            color: "#232323",
            weight: 0.1,
            fillColor: populationColor(pop),
            fillOpacity: 0.37,
            opacity: 1
          };
        } else {
          return {
            color: "#232323",
            weight: 0.1,
            fillColor: "#bbbbbb",
            fillOpacity: 0.09,
            opacity: 0.14
          };
        }
      });
      // Show/hide bus markers
      busMarkers.forEach(marker => {
        const bus = marker._busData;
        const busPop = bus.neighborhood ? (populationByNeighborhood[bus.neighborhood] || "לא ידוע") : "לא ידוע";
        if (showAll || selectedPopTypes.includes(busPop)) {
          marker.addTo(map);
        } else {
          map.removeLayer(marker);
        }
      });
    }

    // Add a legend control DIV to the map at bottom left
    var legend = L.control({ position: 'bottomleft' });
    legend.onAdd = function(map) {
      var div = L.DomUtil.create('div', 'info legend');
      div.id = "dynamic-legend";
      div.style.display = "none"; // hidden at start
      return div;
    };
    legend.addTo(map);

    const signTypeColors = {
      "עד הניצחון": "#004aad",      // Blue
      "מטה משפחות החטופים": "#ff3131", // Red
      "שלטי תחבורה ציבורית": "#ffde59",    // Yellow
      "מדבקות הנצחה": "#829241",           // Green
      "מודעות פרטיות": "#c7c4b7",     // Light gray
      "שלטים נגד ביבי": "#8252ff",         // Purple
      "שלטי חבד": "#5bc0eb",             // Light blue
      "default": "#bbbbbb"
    };

  
    function getSizeBucket(signs) {
      if (signs <= 10) return "small";
      if (signs <= 40) return "medium";
      return "large";
    }
    function getOpacityBucket(age) {
      if (age <= 10) return "new";
      if (age <= 20) return "mid";
      return "old";
    }

    function getBorderBucket(bus) {
        if (!bus.signscount || Object.keys(bus.signscount).length === 0) return "default";
        let maxType = "default";
        let maxCount = -Infinity;
        for (const [type, count] of Object.entries(bus.signscount)) {
            if (count > maxCount) {
            maxType = type;
            maxCount = count;
            }
        }
        return maxType;
        }


    function filterMarkers() {
      busMarkers.forEach(marker => {
        const bus = marker._busData;
        let show = true;

        // Color filter
        if (selectedPopTypes.length > 0) {
          const busPop = bus.neighborhood ? (populationByNeighborhood[bus.neighborhood] || "לא ידוע") : "לא ידוע";
          if (!selectedPopTypes.includes(busPop)) show = false;
        }
        // Size filter
        if (selectedSizeBuckets.length > 0) {
          const n = totalSigns(bus);
          const sizeBucket = getSizeBucket(n);
          if (!selectedSizeBuckets.includes(sizeBucket)) show = false;
        }
        // Opacity filter
        if (selectedOpacityBuckets.length > 0) {
          const age = bus.age || 0;
          const opacityBucket = getOpacityBucket(age);
          if (!selectedOpacityBuckets.includes(opacityBucket)) show = false;
        }

        if (selectedBorderBuckets.length > 0) {
          const borderBucket = getBorderBucket(bus); // use bus object
          if (!selectedBorderBuckets.includes(borderBucket)) show = false;
        }


        if (show) marker.addTo(map);
        else map.removeLayer(marker);
      });
      // Always update neighborhoods style based on population filter only in color mode
      neighborhoodsLayer.setStyle(function(feature) {
        const name = feature.properties["SCHN_NAME"];
        const pop = populationByNeighborhood[name] || "לא ידוע";
        if (!markerModes.color) {
          return {
                color: "#232323",
                weight: 0.1,
                fillColor: "#bbbbbb",
                fillOpacity: 0.13,
                opacity: 0.22
              };
            }
            if (selectedPopTypes.length === 0 || selectedPopTypes.includes(pop)) {
              return {
                color: "#232323",
                weight: 0.1,
                fillColor: populationColor(pop),
                fillOpacity: 0.37,
                opacity: 1
              };
            } else {
              return {
                color: "#232323",
                weight: 0.1,
                fillColor: "#bbbbbb",
                fillOpacity: 0.09,
                opacity: 0.14
              };
            }
          });
        }
    function getPopulationLegendHtml(selectedPopTypes) {
      return `
        <div style="font-weight:700;font-size:1.08em;margin-bottom:10px;direction:rtl;text-align:right;">סוג אוכלוסיה</div>
        <div class="legend-pop-item${selectedPopTypes.includes('חרדית - רמת הומוגניות נמוכה') ? ' legend-active' : ''}" data-pop="חרדית - רמת הומוגניות נמוכה"
            style="display: flex; flex-direction: row; align-items: center; cursor:pointer; direction:rtl;text-align:right; margin-bottom: 6px;">
          <span style="flex:1; text-align:right;">חרדית - רמת הומוגניות נמוכה</span>
          <span style="width: 26px; display:inline-block; margin-left:4px;">
            <span style="display:inline-block; width: 22px; height: 22px; border-radius: 5px; background:#b39ddb; border:2px solid #232323;"></span>
          </span>
        </div>
        <div class="legend-pop-item${selectedPopTypes.includes('חרדית - רמת הומוגניות גבוהה') ? ' legend-active' : ''}" data-pop="חרדית - רמת הומוגניות גבוהה"
            style="display: flex; flex-direction: row; align-items: center; cursor:pointer; direction:rtl;text-align:right; margin-bottom: 6px;">
          <span style="flex:1; text-align:right;">חרדית - רמת הומוגניות גבוהה</span>
          <span style="width: 26px; display:inline-block; margin-left:4px;">
            <span style="display:inline-block; width: 22px; height: 22px; border-radius: 5px; background:#512da8; border:2px solid #232323;"></span>
          </span>
        </div>
        <div class="legend-pop-item${selectedPopTypes.includes('יהודית - כללית') ? ' legend-active' : ''}" data-pop="יהודית - כללית"
            style="display: flex; flex-direction: row; align-items: center; cursor:pointer; direction:rtl;text-align:right; margin-bottom: 6px;">
          <span style="flex:1; text-align:right;">יהודית - כללית</span>
          <span style="width: 26px; display:inline-block; margin-left:4px;">
            <span style="display:inline-block; width: 22px; height: 22px; border-radius: 5px; background:#5bc0eb; border:2px solid #232323;"></span>
          </span>
        </div>
        <div class="legend-pop-item${selectedPopTypes.includes('ערבית') ? ' legend-active' : ''}" data-pop="ערבית"
            style="display: flex; flex-direction: row; align-items: center; cursor:pointer; direction:rtl;text-align:right; margin-bottom: 6px;">
          <span style="flex:1; text-align:right;">ערבית</span>
          <span style="width: 26px; display:inline-block; margin-left:4px;">
            <span style="display:inline-block; width: 22px; height: 22px; border-radius: 5px; background:#f86f03; border:2px solid #232323;"></span>
          </span>
        </div>
        <div class="legend-pop-item${selectedPopTypes.includes('אזור לא למגורים') ? ' legend-active' : ''}" data-pop="אזור לא למגורים"
            style="display: flex; flex-direction: row; align-items: center; cursor:pointer; direction:rtl;text-align:right; margin-bottom: 6px;">
          <span style="flex:1; text-align:right;">אזור לא למגורים</span>
          <span style="width: 26px; display:inline-block; margin-left:4px;">
            <span style="display:inline-block; width: 22px; height: 22px; border-radius: 5px; background:#5fbf9b; border:2px solid #232323;"></span>
          </span>
        </div>
        <div class="legend-pop-item${selectedPopTypes.includes('לא ידוע') ? ' legend-active' : ''}" data-pop="לא ידוע"
            style="display: flex; flex-direction: row; align-items: center; cursor:pointer; direction:rtl;text-align:right; margin-bottom: 6px;">
          <span style="flex:1; text-align:right;">לא ידוע</span>
          <span style="width: 26px; display:inline-block; margin-left:4px;">
            <span style="display:inline-block; width: 22px; height: 22px; border-radius: 5px; background:#bbbbbb; border:2px solid #232323;"></span>
          </span>
        </div>
      `;
    }

    function getSizeLegendHtml(selectedSizeBucket) {
      return `
        <div style="font-weight:700;font-size:1.08em;margin-bottom:10px;direction:rtl;text-align:right;">בחר טווח שלטים</div>
        <div class="legend-size-item${selectedSizeBuckets.includes('small') ? ' legend-active' : ''}" data-size="small"
            style="display:flex;flex-direction:row;align-items:center;cursor:pointer;direction:rtl;text-align:right;margin-bottom:6px;">
          <span style="flex:1; text-align:right;">עד 10 שלטים</span>
          <span style="width:38px; display:inline-block; margin-left:4px;">
            <img src="bus_default.png" style="width:25px;height:25px;">
          </span>
        </div>
        <div class="legend-size-item${selectedSizeBuckets.includes('medium') ? ' legend-active' : ''}" data-size="medium"
            style="display:flex;flex-direction:row;align-items:center;cursor:pointer;direction:rtl;text-align:right;margin-bottom:6px;">
          <span style="flex:1; text-align:right;">11-40 שלטים</span>
          <span style="width:38px; display:inline-block; margin-left:4px;">
            <img src="bus_default.png" style="width:40px;height:40px;">
          </span>
        </div>
        <div class="legend-size-item${selectedSizeBuckets.includes('large') ? ' legend-active' : ''}" data-size="large"
            style="display:flex;flex-direction:row;align-items:center;cursor:pointer;direction:rtl;text-align:right;margin-bottom:6px;">
          <span style="flex:1; text-align:right;">מעל 40 שלטים</span>
          <span style="width:38px; display:inline-block; margin-left:4px;">
            <img src="bus_default.png" style="width:55px;height:55px;">
          </span>
        </div>
        <div style="margin-top:8px;font-size:0.96em;color:#444;direction:rtl;text-align:right;">* ייתכן שונות קלה בהתאם לנתוני התחנה</div>
      `;
    }

    function getOpacityLegendHtml(selectedOpacityBucket) {
      return `
        <div style="font-weight:700;font-size:1.08em;margin-bottom:10px;direction:rtl;text-align:right;"> גיל שלטים</div>
        <div class="legend-opacity-item${selectedOpacityBuckets.includes('new') ? ' legend-active' : ''}" data-opacity="new"
            style="display:flex;flex-direction:row;align-items:center;cursor:pointer;direction:rtl;text-align:right;margin-bottom:6px;">
          <span style="flex:1; text-align:right;">חדש</span>
          <span style="width:38px; display:inline-block; margin-left:4px;">
            <img src="bus_default.png" style="width:36px;height:36px;opacity:1;">
          </span>
        </div>
        <div class="legend-opacity-item${selectedOpacityBuckets.includes('mid') ? ' legend-active' : ''}" data-opacity="mid"
            style="display:flex;flex-direction:row;align-items:center;cursor:pointer;direction:rtl;text-align:right;margin-bottom:6px;">
          <span style="flex:1; text-align:right;">בינוני</span>
          <span style="width:38px; display:inline-block; margin-left:4px;">
            <img src="bus_default.png" style="width:36px;height:36px;opacity:0.55;">
          </span>
        </div>
        <div class="legend-opacity-item${selectedOpacityBuckets.includes('old') ? ' legend-active' : ''}" data-opacity="old"
            style="display:flex;flex-direction:row;align-items:center;cursor:pointer;direction:rtl;text-align:right;margin-bottom:6px;">
          <span style="flex:1; text-align:right;">ישן</span>
          <span style="width:38px; display:inline-block; margin-left:4px;">
            <img src="bus_default.png" style="width:36px;height:36px;opacity:0.17;">
          </span>
        </div>
      `;
    }

    function getBorderLegendHtml() {
      let html = `<div style="font-weight:700;font-size:1.08em;margin-bottom:10px;direction:rtl;text-align:right;">שלט נפוץ</div>`;
      if (typeof selectedBorderBuckets === "undefined") window.selectedBorderBuckets = [];
      Object.entries(signTypeColors).forEach(([type, color]) => {
        if (type === "default") return;
        const isActive = selectedBorderBuckets.includes(type) ? ' legend-active' : '';
        html += `
          <div class="legend-border-item${isActive}" data-border="${type}"
            style="display:flex;flex-direction:row;align-items:center;cursor:pointer;direction:rtl;text-align:right;margin-bottom:6px;">
            <span style="width:38px; display:inline-block; margin-left:4px;">
              <span style="
                display:inline-block; 
                width:32px; height:32px; 
                border-radius:50%; 
                overflow:hidden;
                background:url('${busBgPngForSignType(type)}') center center/cover no-repeat, ${color};
                border:2.5px solid ${color};
                vertical-align:middle;
              ">
              </span>
            </span>
            <span style="flex:1; text-align:right;">${type}</span>
          </div>
        `;
      });
      return html;
    }


    function updateLegend() {
    updateLegendFor(activeLegend);
    }


    function populationColor(type) {
      switch(type) {
        case "חרדית - רמת הומוגניות נמוכה": return "#b39ddb";
        case "חרדית - רמת הומוגניות גבוהה": return "#512da8";
        case "יהודית - כללית": return "#5bc0eb";
        case "ערבית": return "#f86f03";
        case "אזור לא למגורים": return "#5fbf9b";
        default: return "#bbbbbb";
      }
    }

    var neighborhoodsLayer = L.esri.featureLayer({
      url: "https://services.arcgis.com/IYUfZFmrlf94i3k0/arcgis/rest/services/Neighborhoods/FeatureServer/0",
      style: function(feature) {
        var name = feature.properties["SCHN_NAME"];
        var popType = populationByNeighborhood[name] || "unknown";
        return {
          color: "#232323",
          weight: 0.1,
          fillColor: populationColor(popType),
          fillOpacity: 0.37
        };
      },
      onEachFeature: function (feature, layer) {
        var name = feature.properties["SCHN_NAME"] || "שכונה";
        var popType = populationByNeighborhood[name] || "לא ידוע";
        layer.bindPopup(`<b>${name}</b><br>סוג אוכלוסיה: ${popType}`);
      }
    });
    // Make sure filtering is always applied after layer updates (zoom/pan)
    neighborhoodsLayer.on('update', filterByPopulation);
    neighborhoodsLayer.on('load', filterByPopulation);


    // Layers control
    const baseLayers = { "מפה": streetLayer, "לוויין": satelliteLayer };
    const overlayLayers = { "שכונות": neighborhoodsLayer };
    L.control.layers(baseLayers, overlayLayers, {collapsed: false, position: 'topleft'}).addTo(map);

    var busIcon = L.icon({
      iconUrl: 'bus.png',
      iconSize: [15, 15],
      iconAnchor: [11, 22],
      popupAnchor: [0, -18]
    });

    function totalSigns(bus) {
      if (!bus.signscount) return 5;
      return Object.values(bus.signscount).reduce((a, b) => a + b, 0);
    }

    // Bus markers
    let busMarkers = [];
    let markerModes = {
      color: false,
      size: false,
      opacity: false,
      border: false
    };

    function iconSizeForSigns(n) {
        const minSize = 14;
        const maxSize = 48;
        const minSigns = 0;
        const maxSigns = 100;
        let size = minSize + ((n - minSigns) / (maxSigns - minSigns)) * (maxSize - minSize);
        // Clamp size
        size = Math.max(minSize, Math.min(maxSize, size));
        return size;
      }
    function mostPopularSignType(signscount) {
      if (!signscount) return "default";
      let max = -1, maxType = "default";
      Object.entries(signscount).forEach(([type, count]) => {
        if (count > max) { max = count; maxType = type; }
      });
      return maxType;
    }

    function anyModeActive() {
      return markerModes.color || markerModes.size || markerModes.opacity || markerModes.border;
    }

    async function addBusMarkers(type) {
      busMarkers.forEach(marker => map.removeLayer(marker));
      busMarkers = [];

      for (const bus of galleryData[type].buses) {
        let popType = bus.neighborhood ? (populationByNeighborhood[bus.neighborhood] || "לא ידוע") : "לא ידוע";
        let busImgUrl = "bus_default.png";
        let bgImgUrl = "background_default.png"; // Default background

        let size = 25;
        if (markerModes.size) {
          let n = totalSigns(bus);
          size = iconSizeForSigns(n);
        }

        // If population color mode is ON, change the bus image
        if (markerModes.color) {
          let popType = bus.neighborhood ? (populationByNeighborhood[bus.neighborhood] || "לא ידוע") : "לא ידוע";
          busImgUrl = busPngForPopulation(popType);
        }

        // If "border" mode is ON (background change), change the background image
        if (markerModes.border) {
          const mainType = mostPopularSignType(bus.signscount);
          bgImgUrl = busBgPngForSignType(mainType);
        }
        if (bus.age === undefined) bus.age = 0; // Default age if not provided

        if (!markerModes.border) {
          bgImgUrl = "background_default.png";
        }

        const compositeUrl = await createCompositeBusIcon(busImgUrl, bgImgUrl, size);

        let opacity = 1.0;
        if (markerModes.opacity) {
          let age = bus.age || 0;
          opacity = 1.0 - Math.min(0.9, age / 25);
        }

        let borderColor = "transparent";
        if (markerModes.border) {
          const mainType = mostPopularSignType(bus.signscount);
          borderColor = signTypeColors[mainType] || "#bbbbbb";
        }

        const iconHtml = `
          <img src="${compositeUrl}" style="
            width: ${size}px; height: ${size}px;
            opacity: ${opacity};
            display: block;
            border: none;
            border-radius: 50%;
            box-sizing: border-box;
          " />
        `;

        const icon = L.divIcon({
          html: iconHtml,
          iconSize: [size, size],
          className: 'custom-bus-icon',
          iconAnchor: [size / 2, size],
          popupAnchor: [0, -size / 2]
        });

        const marker = L.marker(bus.coords, { icon }).addTo(map);
        marker._busData = bus;
        marker.bindPopup(`
                  <div class="popp-wrapper">
            <a href="#" class="leaflet-popup-close-button" role="button">×</a>
            <img src="${bus.img}" class="popup-img" onclick="openInNewPage('${bus.fullImg}')" />
          </div>`);
        marker.on('popupopen', function(e) { showBusInfo(bus); });
        busMarkers.push(marker);
      }
      filterByPopulation();
    }

    function updateLegendFor(mode) {
      activeLegend = mode;

      const legend = document.getElementById('dynamic-legend');
      if (!legend) return;

      let html = '';
      if (mode === 'color') html = getPopulationLegendHtml(selectedPopTypes);
      if (mode === 'size')  html = getSizeLegendHtml(selectedSizeBuckets);
      if (mode === 'opacity') html = getOpacityLegendHtml(selectedOpacityBuckets);
      if (mode === 'border') html = getBorderLegendHtml(selectedBorderBuckets);

      legend.innerHTML = html;
      legend.style.display = "";

        if (mode === 'size' || mode === 'opacity') {
          // Find all <img> icons in the legend
          legend.querySelectorAll('img').forEach(async img => {
            // All legend bus icons are the same, so use default bus and background
            const compositeUrl = await createCompositeBusIcon("bus_default.png", "background_default.png", parseInt(img.style.width));
            img.src = compositeUrl;
          });
        }

      // Add interactive handlers:
      if (mode === 'color') {
        legend.querySelectorAll(".legend-pop-item, #legend-pop-all").forEach(item => {
          item.onclick = function() {
            const pop = this.getAttribute("data-pop");
            if (!pop) {
              selectedPopTypes = [];
            } else {
              if (selectedPopTypes.includes(pop)) {
                selectedPopTypes = selectedPopTypes.filter(p => p !== pop);
              } else {
                selectedPopTypes.push(pop);
              }
            }
            updateLegendFor(mode); // Re-render legend
            filterMarkers();
          };
        });
      }
      if (mode === 'size') {
        legend.querySelectorAll(".legend-size-item").forEach(item => {
          item.onclick = function() {
            const val = this.getAttribute("data-size");
            if (!val) {
              selectedSizeBuckets = [];
            } else {
              if (selectedSizeBuckets.includes(val)) {
                selectedSizeBuckets = selectedSizeBuckets.filter(p => p !== val);
              } else {
                selectedSizeBuckets.push(val);
              }
            }
            updateLegendFor(mode); // Re-render legend
            filterMarkers();
          };
        });
      }
      if (mode === 'opacity') {
        legend.querySelectorAll(".legend-opacity-item").forEach(item => {
          item.onclick = function() {
            const val = this.getAttribute("data-opacity");
            if (!val) {
              selectedOpacityBuckets = [];
            } else {
              if (selectedOpacityBuckets.includes(val)) {
                selectedOpacityBuckets = selectedOpacityBuckets.filter(p => p !== val);
              } else {
                selectedOpacityBuckets.push(val);
              }
            }
            updateLegendFor(mode); // Re-render legend
            filterMarkers();
          };
        });
      }
      if (mode === 'border') {
        legend.querySelectorAll(".legend-border-item").forEach(item => {
          item.onclick = function() {
            const val = this.getAttribute("data-border");
            if (!val) {
              selectedBorderBuckets = [];
            } else {
              if (selectedBorderBuckets.includes(val)) {
                selectedBorderBuckets = selectedBorderBuckets.filter(p => p !== val);
              } else {
                selectedBorderBuckets.push(val);
              }
            }
            updateLegendFor(mode); // Re-render legend
            filterMarkers();
          };
        });
      }
    }
    function updateGallery(type) {
      const readerDiv = document.getElementById('reader-static-image');
      const readerImg = readerDiv.querySelector('img');
      const staticSrc = galleryData[type].static;
      if (staticSrc) {
        readerDiv.style.display = 'flex';
        readerImg.src = staticSrc;
        document.body.classList.add('reader-visible');
      } else {
        readerDiv.style.display = 'none';
        document.body.classList.remove('reader-visible');
      }
      document.getElementById('gallery-images').innerHTML = '';
    }
function getTextColor(bgColor) {
    // Remove hash if present
    let c = bgColor.replace('#', '');
    if (c.length === 3) c = c[0]+c[0]+c[1]+c[1]+c[2]+c[2];
    const r = parseInt(c.substr(0,2),16);
    const g = parseInt(c.substr(2,2),16);
    const b = parseInt(c.substr(4,2),16);
    // Calculate luminance
    return (0.299*r + 0.587*g + 0.114*b > 170) ? '#222' : '#fff';
}

  // Store last-shown bus info (for later, if needed)
  let lastBusInfo = null;

  function showBusInfo(bus) {
    document.getElementById('gallery').style.display = 'flex';
    lastBusInfo = {
      id: bus.id,
      neighborhood: bus.neighborhood,
      popType: bus.neighborhood ? (populationByNeighborhood[bus.neighborhood] || "לא ידוע") : "לא ידוע"
    };

    const galleryImages = document.getElementById('gallery-images');
    galleryImages.innerHTML = ''; // Clear previous content

    const popType = lastBusInfo.popType;
    const popColor = populationColor(popType);
    const pillTextColor = getTextColor(popColor);


    const infoDiv = document.createElement('div');
    infoDiv.className = 'bus-info';

        // 🟢 Stop name
    const nameEl = document.createElement('h3');
    nameEl.textContent = bus.id;
    infoDiv.appendChild(nameEl);


    // 🏘️ Neighborhood
    if (bus.neighborhood) {
      const n = document.createElement('div');
      n.style.fontSize = '1em';
      n.style.marginTop = '0px';
      n.textContent = "שכונה: " + bus.neighborhood;
      infoDiv.appendChild(n);
    }

    // 🔵 Population type pill
    const popPill = document.createElement('div');
    popPill.className = 'pop-type-label';
    popPill.style.background = popColor;
    popPill.style.color = pillTextColor;
    popPill.textContent = `סוג אוכלוסייה: ${popType}`;
    infoDiv.appendChild(popPill);


      // 🖼️ Analysis image with label
      if (bus.analysisImg) {
        const label = document.createElement('div');
        label.textContent = "מיפוי שלטים";
        label.style.fontWeight = '600';
        label.style.fontSize = '0.95em';
        label.style.color = '#444';
        infoDiv.appendChild(label);

        // 🖼️ Analysis image with label
        const analysisImg = document.createElement('img');
        analysisImg.src = bus.analysisImg;
        analysisImg.alt = 'Analysis Image';
        analysisImg.className = 'image-outlined';
        analysisImg.style.margin = 0;
        analysisImg.style.borderColor = popColor;


      if (bus.analysisImg && bus.signscount && Object.keys(bus.signscount).length) {
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.justifyContent = 'space-between'; // ⬅️ image left, chart right
        wrapper.style.flexDirection = 'row'; // RTL: chart right, image left
        wrapper.style.alignItems = 'center';
        wrapper.style.margin = '10px 0';
        wrapper.style.padding = '0';
        wrapper.style.maxWidth = '100%';
        wrapper.style.width = '100%';
        wrapper.style.overflow = 'hidden';



        // ⬅️ Image
        const img = document.createElement('img');
        img.src = 'legend.png';
        img.alt = 'צד שמאל';
        img.style.width = '160px';
        img.style.height = '160px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';
        img.style.marginLeft = '12px';
        img.style.objectFit = 'contain'; // avoids cropping
        img.style.flexShrink = '0';      // prevent image from being squished


        // ➡️ Chart canvas
        const canvas = document.createElement('canvas');
        canvas.id = 'signPieChart';
        canvas.style.width = '160px';
        canvas.style.height = '160px';
        canvas.style.margin = '0';
        canvas.style.padding = '0';

        wrapper.appendChild(img);
        wrapper.appendChild(canvas);
        infoDiv.appendChild(wrapper);
        infoDiv.appendChild(analysisImg);

        const agePill = document.createElement('div');
        agePill.className = 'age-pill';
        agePill.innerHTML = `גיל השלטים: ${bus.age || 0} חודשים <span class="age-pill-asterisk">*</span>`;
        popPill.style.background = popColor;
        popPill.style.color = pillTextColor;
        infoDiv.appendChild(agePill);     // pill under stop name


        setTimeout(() => {
          new Chart(canvas, {
            type: 'doughnut',
            data: {
              labels: Object.keys(bus.signscount),
              datasets: [{
                data: Object.values(bus.signscount),
                backgroundColor: ['#004aad','#ff3131','#ffde59','#829241','#c7c4b7','#8252ff','#5bc0eb'],
                borderWidth: 0
              }]
            },
            options: {
              responsive: false,
              cutout: '60%',
              plugins: {
                legend: { display: false },
                tooltip: { enabled: true }
              },
              layout: { padding: 0 }
            }
          });
        }, 0);
      }
      }

    // ✏️ Sketch label
    const sketchLabel = document.createElement('div');
    sketchLabel.textContent = "סקיצה";
    sketchLabel.style.fontWeight = '600';
    sketchLabel.style.marginTop = '8px';
    sketchLabel.style.marginBottom = '6px';
    sketchLabel.style.fontSize = '0.95em';
    sketchLabel.style.color = '#444';
    infoDiv.appendChild(sketchLabel);

    // 🖍️ Sketch image
    if (bus.sketchImg) {
      const sketchImg = document.createElement('img');
      sketchImg.src = bus.sketchImg;
      sketchImg.alt = 'Sketch Image';
      sketchImg.className = 'image-outlined';
      sketchImg.style.borderColor = popColor;
      infoDiv.appendChild(sketchImg);
    }
    galleryImages.appendChild(infoDiv);

    const aiNote = document.createElement('div');
    aiNote.textContent = '* הערכה ממוחשבת (AI)';
    aiNote.style.fontSize = '0.82em';
    aiNote.style.color = '#bbbbb';
    aiNote.style.textAlign = 'left';
    aiNote.style.marginTop = '18px';
    aiNote.style.direction = 'rtl';
    infoDiv.appendChild(aiNote);
  }

    function openInNewPage(url) {
      var win = window.open('', '_blank');
      win.document.write('<!DOCTYPE html><html><head><title>Enlarged Image</title><style>body{margin:0;background:#fffff;display:flex;align-items:center;justify-content:center;height:100vh;}img{max-width:98vw;max-height:98vh;box-shadow:0 0 18px #000;border-radius:16px;}</style></head><body>');
      win.document.write('<img src="' + url + '" alt="Enlarged" />');
      win.document.write('</body></html>');
      win.document.close();
    }
    let pressedModes = []; // Track press order (stack)

    // Attach handlers for each mode button
    document.querySelectorAll('#view-mode-bar button[data-mode]').forEach(btn => {
    btn.addEventListener('click', function() {
        const mode = this.dataset.mode;
        const wasPressed = markerModes[mode];
        markerModes[mode] = !wasPressed;
        this.classList.toggle('pressed', !wasPressed);

        // Update pressedModes stack
        if (!wasPressed) {
        // Just pressed, add to end
        pressedModes = pressedModes.filter(m => m !== mode); // Remove if already
        pressedModes.push(mode);
        } else {
        // Just unpressed, remove from stack
        pressedModes = pressedModes.filter(m => m !== mode);
        }

        // Show/hide legend logic
        const legend = document.getElementById('dynamic-legend');
        if (pressedModes.length === 0) {
        // None pressed, hide
        legend.style.display = "none";
        } else {
        // Show legend for most recently pressed
        const lastMode = pressedModes[pressedModes.length - 1];
        activeLegend = lastMode;
        updateLegendFor(lastMode);
        legend.style.display = "";
        }

        addBusMarkers(currentType);
        filterMarkers();
    });
    });

  // Initialize on load:
  window.onload = function() {
    updateGallery("a");
    addBusMarkers("a");
    filterMarkers();
  };
