// Map model will contain geoJSON, number of views, user association, field being symbolized, styles for symbology, etc.
window.mapModel = Backbone.Model.extend({

  defaults: {
    "geojson": {"type": "FeatureCollection", "features": []},
    "json": {},
  },

});