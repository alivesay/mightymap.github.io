// When parseFields fails, selectFields allows the user to manually select which fields to geocode/join to geometry.
// TODO: For points/geocoding, switch from a bunch of select elements to something like geojson.io's drag-and-drop interface.
// TODO: Only show choice between points or polygons initially, then show either #points-form or #polygons-form depending on choice.
window.selectFieldsView = Backbone.View.extend({

  // Element the view is attached to.
  el: '#container',

  // Handle events.
  events: {
    // "click #points": "showPointsForm",
    // "click #polygons": "showPolygonsForm",
    "click #points-form input": "callGeocode",
    "click #polygons-form input": "callJoinToGeometry"
  },

  // Initialize view.
  initialize: function() {},

  // Render the view's template.
  render: function() {
    $(this.el).html(_.template($("#select-fields-template").html()));
  },

  // Reveal form that allows user to select which fields to use to geocode.
  // showPointsForm: function(e) {
  //   e.preventDefault();
  // },

  // Reveal form that allows user to select which field to join to which geometry.
  // showPolygonsForm: function(e) {
  //   e.preventDefault();
  // }

  // Get data from select elements, make an object containing spatial fields and their names, and set that data on the model.
  // TODO: I don't like the way I'm matching fields. What if the user's address column is named "Address"? (I realize that woould have been caught by parseFields, but what if they're coming back to correct an error?)
  callGeocode: function() {
    var form = $("#points-form");
    var addressField = $("#address", form).find(":selected").text();
    var cityField = $("#city", form).find(":selected").text();
    var stateField = $("#state", form).find(":selected").text();
    var countyField = $("#county", form).find(":selected").text();
    var zipField = $("#zip", form).find(":selected").text();
    var countryField = $("#country", form).find(":selected").text();
    var spatialProperties = {};
    if (addressField !== "Address") {
      spatialProperties.address = addressField;
    } if (cityField !== "City") {
      spatialProperties.city = cityField;
    } if (stateField !== "State") {
      spatialProperties.state = stateField;
    } if (countyField !== "County") {
      spatialProperties.county = countyField;
    } if (zip !== "ZIP") {
      spatialProperties.zip = zipField;
    } if (countryField !== "Country") {
      spatialProperties.country = countryField;
    }
    this.model.set({"spatialData": {"dataType": "point", "spatialProperties": spatialProperties}});
  },

  // Get data from select elements, set that data on the model.
  callJoinToGeometry: function() {
    var form = $("#points-form");
    var geometry = $("#geometry", form).find(":selected").text();
    var field = $("#field", form).find(":selected").text();
    this.model.set({"spatialData": {"dataType": geometry, "spatialProperties": {geometry: field}}});
  }

});