// Map maker view will manage map creation.
window.mapMakerView = Backbone.View.extend({

  initialize: function() {},

  render: function() {},

  // Make map and add geoJSON.
  // TODO: Map not rendering geoJSON layer initially nor setting bounds correctly. I think it's a race condition - the geojson object I'm passing in isn't formatted yet since $.each just returns a promise.
  makeMap: function() {
    var geojson = L.geoJson(window.map.geojson, {
      onEachFeature: function(feature, layer) {
        textBlob = ""
        $.each(feature.properties, function(key, value) {
          textBlob = textBlob + key + ": " + value + "<br>";
        });
        layer.bindPopup(textBlob);
      }
    });
    var map = L.map('map').fitBounds(geojson.getBounds());
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    geojson.addTo(map);
    $('#input').hide();
    $('#map').show();
    $('#toggles').show();
  }

});