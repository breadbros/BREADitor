


function initZonesWidget(map) {
  $("#zones-number").text( map.mapData.zones.length );
}


export var ZonesWidget = {
    initZonesWidget: initZonesWidget,
};