// Map model contains JSON set by upload handler, converts that JSON to geoJSON that's also stored on the model. If it can't automagically parse fields to create geoJSON, sets fieldsParsed to false.
// Map model will eventually also contain number of views, user association, field being symbolized, styles for symbology, etc.
// TODO: Store failed geocodes on the model for correction in mapMaker view.
// TODO: Store leftover features that didn't join to some geometry on the model for correction in mapMaker view.
// TODO: Hook up analytics for real.
// TODO: Add Olark or similar chat support.
window.mapModel = Backbone.Model.extend({

  // Initialize model.
  initialize: function() {
    this.on('change:json', this.parseFields, this);
    this.on('change:geometryType', this.delegate, this);
  },

  // The geometryType will either be "point" if point data or the type of geometry if polygon data.
  // The spatialFields property is object containing key/value pairs of data type and field name in the data.
  // TODO: Replace references to geometryType and spatialFields with spatialData, then delete them.
  defaults: {
    "json": {},
    "geometryType": "",
    "spatialFields": {},
    "spatialData": {
      "dataType": "",
      "spatialFields": ""
    },
    "geojson": {"type": "FeatureCollection", "features": []}
  },

  // Geocode JSON records using spatialFields, set geoJSON.
  // TODO: Put failed geocodes somewhere that the user can see and edit them/try to geocode them again.
  geocode: function() {
    var self = this;
    var json = self.get("json");
    var spatialFields = self.get("spatialFields");
    var geojson = {"type": "FeatureCollection", "features": []};
    $.each(json, function(index, record) {
      var geocode = "";
      $.each(spatialFields, function(type, field) {
        geocode = geocode + record[field] + ", ";
      });
      var url = "http://maps.googleapis.com/maps/api/geocode/json?sensor=false&address=" + geocode;
      $.ajax({
        dataType: "json",
        url: url,
        async: false,
        success: function(data) {
          var coordinates = data.results[0].geometry.location;
          var feature = {
            "type": "Feature",
            "properties": record,
            "geometry": {
              "type": "Point",
              "coordinates": [
                coordinates.lng,
                coordinates.lat
              ]
            }
          };
          delete feature.properties.__rowNum__;
          geojson.features.push(feature);
        }
      });
    });
    // The mapMaker view is listening to changes on geojson attribute.
    self.set({"geojson": geojson});
    console.log(geojson);
  },

  // Take JSON and attach it to appropriate country/state/county/ZIP/area code geoJSON.
  // TODO: Currently only looking for exact matches to join user data and geoJSON. Make it so if a record name is a 90% match to a feature name, we join them. 
  // TODO: Also search feature abbreviations/alternate names if the initial pass over feature names fails.
  // TODO: Figure out why the break statement throws an error or if there's a similar option to exit the $.each() loop.
  // TODO: Don't load all the JSON in advance. Use $.getJSON() to get only the file I need.
  joinToGeometry: function() {
    var self = this;
    var json = self.get("json");
    var geometryType = self.get("geometryType");
    var spatialField = self.get("spatialFields");
    var features = {};
    if (geometryType === "zip") {
      features = {};
    } else if (geometryType === "county") {
      features = {};
    } else if (geometryType === "state") {
      features = statesAndProvinces.features;
    } else if (geometryType === "country") {
      features = countries.features;
    }
    var geojson = {"type": "FeatureCollection", "features": []};
    $.each(json, function(index, record) {
      recordName = record[spatialField];
      $.each(features, function(index, feature) {
        if (recordName.replace(/^\s\s*/, '').replace(/\s\s*$/, '').toLowerCase() === feature.properties.name.toLowerCase()) {
          var feature = {
            "type": "Feature",
            "properties": record,
            "geometry": feature.geometry
          };
          geojson.features.push(feature);
          // break;
        }
      });
    });
    // The mapMaker view is listening to changes on geojson attribute.
    self.set({"geojson": geojson});
  },

  // Checks if any keys in JSON on model match values in keyMap, returns name of matching key.
  findProperty: function(type) {
    var json = this.get("json");
    var record = json[0];
    var property = "";
    var keyMap = {
      address: ["address", "addr", "add"],
      city: ["city"],
      state: ["state", "province"],
      zip: ["zip", "zipcode", "zip code"],
      county: ["county", "cnty"],
      country: ["country", "cntry"],
      latitude: ["lat", "latitude", "y", "shape.y"],
      longitude: ["lon", "lng", "long", "longitude", "x", "shape.x"]
    };
    _.find(record, function(val, key) {
      var keyTypes = (keyMap[type]);
      _.find(keyTypes, function(keyOption) {
        if (keyOption === key.replace(/^\s\s*/, '').replace(/\s\s*$/, '').toLowerCase()) {
          property = key;
        }
      });
    });
    return property;
  },

  // Called when either geometryType or spatialFields is changed (by parseFields below or selectFields view) to process JSON.
  delegate: function() {
    var geometryType = this.get("geometryType");
    if (geometryType === "point") {
      this.geocode();
    } else {
      this.joinToGeometry();
    }
  },

  // Parse fields so we don't have to ask user which is which, set geometryType and spatialFields on model (which will then trigger spatialFieldsDefined).
  // TODO: Continue thinking about the best way to try to identify spatial columns in user data. Not super stoked on just checking against a handful of possible column names. What if I compared each record to a list of city names or state names or whatever, and if I get >50% hits assume it's correct?
  // TODO: Think about options for cases where the geometryType isn't points. Right now we check for any of several geometry types you might join to, then just go from smallest to biggest option looking for a match.
  // TODO: Figure out how to handle JSON that has lat/long data, since that whole bit is now broken.
  parseFields: function() {
    var self = this;
    var json = self.get("json");
    var addressField = self.findProperty("address");
    var cityField = self.findProperty("city");
    var stateField = self.findProperty("state");
    var countyField = self.findProperty("county");
    var zipField = self.findProperty("zip");
    var countryField = self.findProperty("country");
    var latitudeField = self.findProperty("latitude");
    var longitudeField = self.findProperty("longitude");
    var spatialFields = {};
    if (latitudeField && longitudeField) {
      $.each(json, function(index, record) {
        record.lat = {"lat": record[latitudeField]};
        record.lng = {"lng": record[longitudeField]};
      });
      self.makeGeoJSON(json)
    } else if (addressField) {
      spatialFields.address = addressField;
      if (cityField) {
        spatialFields.city = cityField;
      } if (stateField) {
        spatialFields.state = stateField;
      } if (zipField) {
        spatialFields.zip = zipField;
      }
      self.set({"geometryType": "point", "spatialFields": spatialFields})
    } else if (cityField) {
      spatialFields.city = cityField;
      if (stateField) {
        spatialFields.state = stateField;
      }
      self.set({"geometryType": "point", "spatialFields": spatialFields})
    } else if (self.findProperty("state") || self.findProperty("zip") || self.findProperty("country") || self.findProperty("county")) {
      if (zipField) {
        self.set({"geometryType": "zip", "spatialFields": zipField})
      } else if (countyField) {
        self.set({"geometryType": "county", "spatialFields": countyField})
      } else if (stateField) {
        self.set({"geometryType": "state", "spatialFields": stateField})
      } else if (countryField) {
        self.set({"geometryType": "country", "spatialFields": countryField})
      }
    } else {
      // Render selectFields view.
      window.selectFields.render();
    }
  }

});