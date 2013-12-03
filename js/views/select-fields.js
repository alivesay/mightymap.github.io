// When parseFields fails, selectFields allows the user to manually select which fields to geocode/join to geometry.
// TODO: For points/geocoding, switch from a bunch of select elements to something like geojson.io's drag-and-drop interface.
window.selectFieldsView = Backbone.View.extend({

  // Element the view is attached to.
  el: '#container',

  // Handle events.
  events: {
    "click #points": "showPointsForm",
    "click #polygons": "showPolygonsForm"
  },

  // Initialize view.
  initialize: function() {
    this.model.on('change:json', this.render, this);
  },

  // Render the view's template.
  render: function() {
    $(this.el).html(_.template($("#select-fields-template").html()));
  },

  showPointsForm: function(e) {
    e.preventDefault();
  },

  showPolygonsForm: function(e) {
    e.preventDefault();
  }

});