// Map model contains JSON set by upload handler, converts that JSON to geoJSON that's also stored on the model. If it can't automagically parse fields to create geoJSON, sets fieldsParsed to false.
// Map model will eventually also contain number of views, user association, field being symbolized, styles for symbology, etc.
// TODO: Store the field that was used to geocode/join to geometry on the model. Then the user can change it in the map maker view.
// TODO: Store failed geocodes on the model.
// TODO: Store leftover features that didn't join to some geometry on the model.
// TODO: Hook up analytics for real.
// TODO: Add Olark or similar chat support.
window.mapModel = Backbone.Model.extend({

  initialize: function() {
    this.on('change:json', this.parseFields, this);
  },

  defaults: {
    "json": {},
    "geojson": {"type": "FeatureCollection", "features": []},
    "fieldsParsed": true
  },

  // Make valid geoJSON.
  makeGeoJSON: function(json) {
    var self = this;
    var geojson = {"type": "FeatureCollection", "features": []}
    $.each(json, function(index, record) {
      var feature = {
        "type": "Feature",
        "properties": record,
        "geometry": {
          "type": "Point",
          "coordinates": [
            record.lng,
            record.lat
          ]
        }
      };
      delete feature.properties.lat;
      delete feature.properties.lng;
      delete feature.properties.geocode;
      delete feature.properties.__rowNum__;
      geojson.features.push(feature);
    });
    // The mapMaker view is listening to changes on geojson attribute.
    self.set({"geojson": geojson});
  },

  // Geocode each record.
  // TODO: Put failed geocodes somewhere that the user can see and edit them/try to geocode them again.
  geocode: function(json) {
    var self = this;
    $.when.apply($, $.map(json, function(record, index) {
      var url = "http://maps.googleapis.com/maps/api/geocode/json?sensor=false&address=" + record.geocode;
      return $.getJSON(url, function(data) {
        $.extend(json[index], data.results[0].geometry.location);
      });
    })).done(function() {
      self.makeGeoJSON(json);
    });
  },

  // Take JSON and attach it to appropriate country/state/county/ZIP/area code geoJSON.
  // TODO: Pass the key for the given type as a property (in case it's user-defined rather than divined by parseFields). This will replace this.findProperty call.
  // TODO: If a record name is a 90% match to a feature name, join them.
  // TODO: Also search feature abbreviations if the initial pass over feature names fails.
  // TODO: Figure out why the break statement throws an error.
  joinToGeometry: function(json, type) {
    var features = {};
    var sampleRecord = json[0];
    var self = this;
    if (self.findProperty("zip", sampleRecord)) {
      features = {};
    } else if (self.findProperty("county", sampleRecord)) {
      features = {};
    } else if (self.findProperty("state", sampleRecord)) {
      features = statesAndProvinces.features;
    } else if (self.findProperty("country", sampleRecord)) {
      features = countries.features;
    }
    var geojson = {"type": "FeatureCollection", "features": []};
    $.each(json, function(index, record) {
      recordName = self.findProperty(type, record);
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

  // Checks if any keys of given record match values in keyMap, returns value associated with matching key.
  findProperty: function(type, record) {
    var keyMap = {
      address: ["address", "addr", "add"],
      city: ["city"],
      state: ["state"],
      zip: ["zip", "zipcode", "zip code"],
      county: ["county"],
      country: ["country"],
      latitude: ["lat", "latitude"],
      longitude: ["lon", "lng", "long", "longitude"]
    };
    return _.find(record, function(val, key) {
      var keyTypes = (keyMap[type]);
      return _.find(keyTypes, function(keyOption) {
        return(keyOption === key.toLowerCase());
      });
    });
  },

  // Parse fields so we don't have to ask user which is which, send JSON on to appropriate function.
  // TODO: For address and city cases (the ones we're geocoding), we need to only concatenate properties which actually exist.
  // TODO: Continue thinking about the best way to try to identify spatial columns in user data. Not super stoked on just checking against a handful of possible column names. What if I compared each record to a list of city names or state names or whatever, and if I get >50% hits assume it's correct?
  // TODO: Think about options for joinToGeometry case. Right now we check for any of several geometry types you might join to, then just go from smallest to biggest option looking for a match.
  parseFields: function() {
    var self = this;
    var json = self.get("json");
    var sampleRecord = json[0];
    if (self.findProperty("latitude", sampleRecord) && self.findProperty("longitude", sampleRecord)) {
      $.each(json, function(index, record) {
        record.lat = {"lat": self.findProperty("latitude", sampleRecord)};
        record.lng = {"lng": self.findProperty("latitude", sampleRecord)};
      });
      self.makeGeoJSON(json)
    } else if (self.findProperty("address", sampleRecord)) {
      $.each(json, function(index, record) {
        record.geocode = self.findProperty("address", record) + ", " + self.findProperty("city", record) + ", " + self.findProperty("state", record) + " " + self.findProperty("zip", record);
      });
      self.geocode(json);
    } else if (self.findProperty("city", sampleRecord)) {
      $.each(json, function(index, record) {
        record.geocode = self.findProperty("city", record) + ", " + self.findProperty("state", record)
      });
      self.geocode(json);
    } else if (self.findProperty("state", sampleRecord) || self.findProperty("zip", sampleRecord) || self.findProperty("country", sampleRecord) || self.findProperty("county", sampleRecord)) {
      var type = "";
      if (self.findProperty("zip", sampleRecord)) {
        type = "zip";
      } else if (self.findProperty("county", sampleRecord)) {
        type = "county";
      } else if (self.findProperty("state", sampleRecord)) {
        type = "state";
      } else if (self.findProperty("country", sampleRecord)) {
        type = "county";
      }
      self.joinToGeometry(json, type);
    } else {
      // The selectFields view is listening to changes on json attribute.
      self.set({"fieldsParsed": false});
    }
  }

});