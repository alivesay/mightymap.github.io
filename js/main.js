(function() {

  // Source: http://www.bennadel.com/blog/1504-Ask-Ben-Parsing-CSV-Strings-With-Javascript-Exec-Regular-Expression-Command.htm
  function csvToArray(strData, strDelimiter) {
    strDelimiter = (strDelimiter || ",");
    var objPattern = new RegExp((
      "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
      "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
      "([^\"\\" + strDelimiter + "\\r\\n]*))"), "gi");
    var arrData = [[]];
    var arrMatches = null;
    while (arrMatches = objPattern.exec(strData)) {
      var strMatchedDelimiter = arrMatches[1];
      if (strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter)) {
        arrData.push([]);
      }
      if (arrMatches[2]) {
        var strMatchedValue = arrMatches[2].replace(
        new RegExp("\"\"", "g"), "\"");
      } else {
        var strMatchedValue = arrMatches[3];
      }
      arrData[arrData.length - 1].push(strMatchedValue);
    }
    return (arrData);
  }

  // Source: http://www.bennadel.com/blog/1504-Ask-Ben-Parsing-CSV-Strings-With-Javascript-Exec-Regular-Expression-Command.htm
  function csvToJSON(csv) {
    var array = csvToArray(csv);
    var objArray = [];
    for (var i = 1; i < array.length; i++) {
      objArray[i - 1] = {};
      for (var k = 0; k < array[0].length && k < array[i].length; k++) {
        var key = array[0][k];
        objArray[i - 1][key] = array[i][k]
      }
    }
    var json = JSON.stringify(objArray);
    var str = json.replace(/},/g, "},\r\n");
    return str;
  }

  // Source: niggler.github.io/js-xls/
  function xlsToJSON(workbook) {
    var result = {};
    workbook.SheetNames.forEach(function(sheetName) {
      var roa = XLS.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
      if(roa.length > 0){
        result[sheetName] = roa;
      }
    });
    return result;
  }

  // Source: niggler.github.io/js-xlsx/
  function xlsxToJSON(workbook) {
    var result = {};
    workbook.SheetNames.forEach(function(sheetName) {
      var roa = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
      if(roa.length > 0){
        result[sheetName] = roa;
      }
    });
    return result;
  }

  // Make map and add geoJSON
  // TODO: We will have to ask which row, if any, contains the quantitative/qualititative data to group by/symbolize.
  // TODO: Symbolize data based on quantitative/qualitative data properties.
  // TODO: Add ability to search for points within a given distance of user input.
  // TODO: Allow filtering of data on the map.
  // TODO: Add an option to fix our assumptions about fields and geocode again, join to different geometry, or address failed geocodes.
  function makeMap(geojson) {
    var geojson = L.geoJson(geojson, {
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

  // Make valid geoJSON
  function makeGeoJSON(json) {
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
    makeMap(geojson);
  }

  // Geocode each record
  // TODO: Put failed geocodes somewhere that the user can see and edit them/try to geocode them again.
  function geocode(json) {
    $.when.apply($, $.map(json, function(record, index) {
      var url = "http://maps.googleapis.com/maps/api/geocode/json?sensor=false&address=" + record.geocode;
      return $.getJSON(url, function(data) {
        $.extend(json[index], data.results[0].geometry.location);
      });
    })).done(function() {
      makeGeoJSON(json);
    });
  }

  // Take JSON and attach it to appropriate country/state/county/ZIP/area code geoJSON
  // TODO: Make the $.each() function actually work to loop through and put JSON data in properties of appropriate feature.
  // TODO: Record source of geoJSON as comments in geoJSON files.
  function joinToGeometry(json, type, typeProperty) {
    console.log(type);
    console.log(typeProperty);
    // function findRecord(type, record) {
    //   return _.find(record, function(val, key) {
    //     keyOpportunities = (keyMap[type]);
    //     return _.find(keyOpportunities, function(keyOption) {
    //       return(keyOption === key.toLowerCase());
    //     });
    //   });
    // }
    if (type === "states") {
      $.each(states, function(index, state) {
        console.log(state)
        // state.properties = find(state.name) in json
      });
    } else if (type === "country") {
      $.each(states, function(index, state) {
        country.properties = find(state.name) in json
      });
    }
  }

  // Parse fields so we don't have to ask user which is which, send JSON on to appropriate function
  // TODO: For address and city cases (the ones we're geocoding), we need to only concatenate properties which actually exist.
  // TODO: Continue thinking about the best way to try to identify spatial columns in user data. Not super stoked on this solution.
  // TODO: Think about options for joinToGeometry case. Right now we check for any of several geometry types you might join to, then just pick the first one that matches (semi-randomly) to actually join.
  // TODO: Actually handle the else case by allowing the user to select which fields are which.
  function parseFields(json) {
    var sampleRecord = json[0]
    var keyMap = {
      address: ["address", "addr", "add"],
      city: ["city"],
      state: ["state"],
      zip: ["zip", "zipcode", "zip code"],
      county: ["county"],
      country: ["country"],
      latitude: ["lat", "latitude"],
      longitude: ["lng", "long", "longitude"]
    };
    function findProperty(type, record) {
      return _.find(record, function(val, key) {
        var keyOpportunities = (keyMap[type]);
        return _.find(keyOpportunities, function(keyOption) {
          return(keyOption === key.toLowerCase());
        });
      });
    }
    if (findProperty("latitude", sampleRecord) && findProperty("longitude", sampleRecord)) {
      $.each(json, function(index, record) {
        record.lat = {"lat": findProperty("latitude", sampleRecord)};
        record.lng = {"lng": findProperty("latitude", sampleRecord)};
      });
      makeGeoJSON(json)
    } else if (findProperty("address", sampleRecord)) {
      console.log(findProperty("address", sampleRecord));
      $.each(json, function(index, record) {
        record.geocode = findProperty("address", record) + ", " + findProperty("city", record) + ", " + findProperty("state", record) + " " + findProperty("zip", record);
      });
      geocode(json);
    } else if (findProperty("city", sampleRecord)) {
      $.each(json, function(index, record) {
        record.geocode = findProperty("city", record) + ", " + findProperty("state", record)
      });
      geocode(json);
    } else if (findProperty("state", sampleRecord) || findProperty("zip", sampleRecord) || findProperty("country", sampleRecord) || findProperty("county", sampleRecord)) {
      var type = "";
      var typeProperty = "";
      if (findProperty("state", sampleRecord)) {
        type = "state";
        typeProperty = findProperty("state", sampleRecord);
      } else if (findProperty("zip", sampleRecord)) {
        type = "zip";
        typeProperty = findProperty("zip", sampleRecord);
      } else if (findProperty("country", sampleRecord)) {
        type = "country";
        typeProperty = findProperty("country", sampleRecord);
      } else if (findProperty("county", sampleRecord)) {
        type = "county";
        typeProperty = findProperty("county", sampleRecord);
      }
      joinToGeometry(json, type, typeProperty);
    } else {
      console.log("Couldn't tell which fields were which.")
    }
  }

  // Handle upload of CSV/XLS/XLSX
  // TODO: Either combine all sheets in XLS and XLSX files or ask user to choose a sheet from list of sheets with content.
  // TODO: Add SHP, JSON, geoJSON support. Use https://github.com/calvinmetcalf/shapefile-js for SHP.
  $('#fileInput').change(function(event) {
    var file = event.target.files[0];
    var reader = new FileReader()
    var regex = /\.[0-9a-z]+$/i;
    if (regex.exec(file.name)[0].toLowerCase() === ".csv") {
      reader.onload = function(e) {
        var csv = e.target.result;
        var json = csvToJSON(csv);
        json = $.parseJSON(json);
        parseFields(json);
      }
      reader.readAsText(file);
    } else if (regex.exec(file.name)[0].toLowerCase() === ".xls") {
      reader.onload = function(e) {
        var xls = e.target.result;
        var cfb = XLS.CFB.read(xls, {type: 'binary'});
        var wb = XLS.parse_xlscfb(cfb);
        var json = xlsToJSON(wb);
        parseFields(json.Sheet1);
      }
      reader.readAsBinaryString(file);
    } else if ((regex.exec(file.name)[0].toLowerCase() === ".xlsx")) {
      reader.onload = function(e) {
        var xlsx = e.target.result;
        var arr = String.fromCharCode.apply(null, new Uint8Array(xlsx));
        var wb = XLSX.read(btoa(arr), {type: 'base64'});
        var json = xlsxToJSON(wb);
        parseFields(json.Sheet1);
      }
      reader.readAsArrayBuffer(file);
    } else {
      console.log("The file you're uploading isn't a CSV, XLS, or XLSX.");
    }
  });

})();

