// Map maker view will manage map creation.
// TODO: Add option to symbolize data by one of the fields.
// TODO: Also a wizard that lets them choose what type of map (or how they want to symbolize their data). Think heat map, graduated symbols, proportional symbols, choropleth for quantitative data, simple color coding for qualitative data.
// TODO: Add ability to search for points within X miles of given address/point.
// TODO: Maybe add an option to drop a pin and search within X miles of that, too.
// TODO: Add ability to filter the data that's being symbolized (drop high/low values, etc.).
// TODO: Add ability to correct the app's assumptions about fields and geocode again or join to different geometry.
// TODO: Add ability to address failed geocodes.
// TODO: Add link back to main page/ability to upload a different spreadsheet.
// TODO: Add ability to save map to account.
// TODO: Add links to share map.
// TODO: Add ability to print/save a PDF of the map.
// TODO: Add legend if data is symbolized.
window.mapMakerView = Backbone.View.extend({

  // Element the view is attached to.
  el: '#container',

  // Handle events.
  events: {},

  // Initialize view.
  initialize: function() {
    this.render();
    makeMap();
  },

  // Render the view's template.
  render: function() {
    var self = this;
    $.get("js/templates/map-maker.html", function(data) {
      $(self.el).html(data);
    });
  },

  // Make map and add geoJSON. Assumes map model has been instantiated as window.map, geojson object attached to model.
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
  }

});