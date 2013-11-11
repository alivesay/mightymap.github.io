(function() {

  // source for CSVToArray and CSV2JSON: http://www.bennadel.com/blog/1504-Ask-Ben-Parsing-CSV-Strings-With-Javascript-Exec-Regular-Expression-Command.htm
  function CSVToArray(strData, strDelimiter) {
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

  // source for CSVToArray and CSV2JSON: http://www.bennadel.com/blog/1504-Ask-Ben-Parsing-CSV-Strings-With-Javascript-Exec-Regular-Expression-Command.htm
  function CSV2JSON(csv) {
    var array = CSVToArray(csv);
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

  // make map with geoJSON
  function makeMap(geojson) {
    var geojson = L.geoJson(geojson);
    var map = L.map('map').fitBounds(geojson.getBounds());
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    geojson.addTo(map);
  }

  // make valid geoJSON (from points), add to map
  // assumes that the "location" key we just added to JSON is the only "location" key
  // which could be false if the user had a "location" row in spreadsheet originally
  function makeGeoJSON(json) {
    var geojson = {"type": "FeatureCollection", "features": []}
    $.each(json, function(index, record) {
      var feature = {
        "type": "Feature",
        "properties": record,
        "geometry": {
          "type": "Point",
          "coordinates": [
            record.location.lng,
            record.location.lat
          ]
        }
      };
      geojson.features.push(feature);
    });
    makeMap(geojson);
  }

  // geocode each record (assumes you had "Address", "City", "State", and "ZIP" columns in CSV for right now)
  // eventually I want to try to guess which field is which, only ask the user if uncertain/to verify
  // I will have to ask which row, if any, contains the quantitative/qualititative data
  function geocode(json) {
    var json = $.parseJSON(json);
    $.when.apply($, $.map(json, function(record, index) {
      var url = "http://maps.googleapis.com/maps/api/geocode/json?sensor=false&address=" + record.Address + ", " + record.City + ", " + record.State + " " + record.ZIP
      return $.getJSON(url, function(data) {
        $.extend(json[index], data.results[0].geometry);
      });
    })).done(function() {
      makeGeoJSON(json);
    });
  }

  // handle upload of CSV (and eventually XLS/XLSX with https://github.com/SheetJS/js-xls and https://github.com/SheetJS/js-xlsx)
  $('#fileInput').change(function(event) {
    var file = event.target.files[0];
    var reader = new FileReader()
    reader.onload = function(e) {
      var csv = e.target.result;
      var json = CSV2JSON(csv);
      // eventually I want to detect if there's an address to geocode, otherwise I'll assume we're joining the data to geometry for counties/states/countries
      // and try to figure out which it is, do that automatically
      geocode(json);
    }
    reader.onerror = function(e) {
      console.log("FileReader Error: " + e)
    }
    reader.readAsText(file)
  });

})();

