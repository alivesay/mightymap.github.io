(function() {

  // initialize map, add tile layer
  var map = L.map('map').setView([51.505, -0.09], 13);
  L.tileLayer('http://{s}.tile.cloudmade.com/API-key/997/256/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
    maxZoom: 18
  }).addTo(map);

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

  // stick JSON in map
  function addToMap(json) {
    console.log(json);
  }

  // geocode each record (assumes you had "Address", "City", "State", and "ZIP" columns in CSV)
  // eventually I want to try to guess which field is which, only ask the user if uncertain/to verify
  // I will have to ask which row, if any, contains the quantitative/qualititative data
  function geocode(json) {
    var json = $.parseJSON(json);
    $.each(json, function(index, record) {
      var url = "http://maps.googleapis.com/maps/api/geocode/json?sensor=false&address=" + record.Address + ", " + record.City + ", " + record.State + " " + record.ZIP
      $.getJSON(url, function(data) {
        $.extend(json[index], data.results[0].geometry.location);
      });
    });
    // send json (now with lat and lng as keys) off to be mapped
    // ACTUALLY, this has to be geojson, so let's convert this shit first (or do it back on line 64)
    addToMap(json)
  }

  // handle upload of CSV (and eventually XLS/XLSX with https://github.com/SheetJS/js-xls and https://github.com/SheetJS/js-xlsx)
  $('#fileInput').change(function(event) {
    var file = event.target.files[0];
    var reader = new FileReader()
    reader.onload = function(e) {
      var csv = e.target.result;
      var json = CSV2JSON(csv);
      // eventually detect if there's an address to geocode, otherwise assume we're joining the data to our geometry
      // then guess by comparing to list of countries, states (or equivalent for other countries), and counties (or equivalent for other countries)
      geocode(json);
    }
    reader.onerror = function(e) {
      console.log("FileReader Error: " + e)
    }
    reader.readAsText(file)
  });

})();

