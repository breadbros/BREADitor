
function initZonesWidget(map) {
  $("#zones-number").text( map.mapData.zones.length );

  var $list = $(".zones-list");
  var $tmp; 

  //#zones-list

  var zones = map.mapData.zones;
  for (var i = 0; i < zones.length - 1; i++) {

    $tmp = $("<li class='zone-row'><span class='zone-index'></span><span class='zone-name'></span></li>");
    $tmp.find(".zone-index").text( i );
    $tmp.find(".zone-name").text( zones[i].name );

    $list.append($tmp);

    // Object {name: "NULL_ZONE", activation_script: "", activation_chance: 0, can_by_adjacent_activated: false}
  }

  fixContainerSize();

}

var fixContainerSize = function() {
  var palette = $(".zones-palette");
  var container = $(".zones-palette .window-container");

  container.height( palette.height() - 70 );  
};


$(".zones-palette").resize( function() {
  fixContainerSize();
} );

export var ZonesWidget = {
    initZonesWidget: initZonesWidget,
};