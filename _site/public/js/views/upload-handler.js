// Upload handler view manages file upload, converts upload to JSON, and sets JSON on the model.
window.uploadHandlerView = Backbone.View.extend({

  // Element the view is attached to.
  el: '#container',

  // Handle events.
  events: {
    "change #fileInput": "handleUpload"
  },

  // Initialize view.
  initialize: function() {
    this.render();
  },

  // Render the view's template.
  render: function() {
    $(this.el).html(_.template($("#upload-handler").html()));
  },

  // Source: http://www.bennadel.com/blog/1504-Ask-Ben-Parsing-CSV-Strings-With-Javascript-Exec-Regular-Expression-Command.htm
  csvToArray: function(strData, strDelimiter) {
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
  },

  // Source: http://www.bennadel.com/blog/1504-Ask-Ben-Parsing-CSV-Strings-With-Javascript-Exec-Regular-Expression-Command.htm
  csvToJSON: function(csv) {
    var self = this;
    var array = self.csvToArray(csv);
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
  },

  // Source: niggler.github.io/js-xls/
  xlsToJSON: function(workbook) {
    var result = {};
    workbook.SheetNames.forEach(function(sheetName) {
      var roa = XLS.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
      if(roa.length > 0){
        result[sheetName] = roa;
      }
    });
    return result;
  },

  // Source: niggler.github.io/js-xlsx/
  xlsxToJSON: function(workbook) {
    var result = {};
    workbook.SheetNames.forEach(function(sheetName) {
      var roa = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
      if(roa.length > 0){
        result[sheetName] = roa;
      }
    });
    return result;
  },

  // Handle upload of CSV/XLS/XLSX.
  // TODO: If XLS and XLSX files have multiple sheets, ask user to choose a sheet from list.
  // TODO: Test SHP, JSON, geoJSON support. No idea what I'm doing or what method on reader to use.
  // TODO: Actually do something in case of error (either reader error or just if none of the conditions are met).
  handleUpload: function(event) {
    var file = event.target.files[0];
    var reader = new FileReader();
    var regex = /\.[0-9a-z]+$/i;
    var self = this;
    if (regex.exec(file.name)[0].toLowerCase() === ".csv") {
      reader.onload = function(e) {
        var csv = e.target.result;
        var json = self.csvToJSON(csv);
        json = $.parseJSON(json);
        self.model.set({"json": json});
      }
      reader.readAsText(file);
    } else if (regex.exec(file.name)[0].toLowerCase() === ".xls") {
      reader.onload = function(e) {
        var xls = e.target.result;
        var cfb = XLS.CFB.read(xls, {type: 'binary'});
        var wb = XLS.parse_xlscfb(cfb);
        var json = self.xlsToJSON(wb);
        self.model.set({"json": json.Sheet1});
      }
      reader.readAsBinaryString(file);
    } else if ((regex.exec(file.name)[0].toLowerCase() === ".xlsx")) {
      reader.onload = function(e) {
        var xlsx = e.target.result;
        var arr = String.fromCharCode.apply(null, new Uint8Array(xlsx));
        var wb = XLSX.read(btoa(arr), {type: 'base64'});
        var json = self.xlsxToJSON(wb);
        self.model.set({"json": json.Sheet1});
      }
      reader.readAsArrayBuffer(file);
    } else if ((regex.exec(file.name)[0].toLowerCase() === ".zip")) {
      reader.onload = function(e) {
        var zip = e.target.result;
        shp(zip).then(function(geojson) {
          self.model.set({"geojson": geojson});
        });
      }
      reader.readAsArrayBuffer(file);
    } else if ((regex.exec(file.name)[0].toLowerCase() === ".shp")) {
      reader.onload = function(e) {
        var shp = e.target.result;
        shp(shp).then(function(geojson) {
          self.model.set({"geojson": geojson});
        });
      }
      reader.readAsArrayBuffer(file);
    } else if ((regex.exec(file.name)[0].toLowerCase() === ".json")) {
      reader.onload = function(e) {
        var json = e.target.result;
        self.model.set({"json": json});
      }
    } else if ((regex.exec(file.name)[0].toLowerCase() === ".geojson")) {
      reader.onload = function(e) {
        var geojson = e.target.result;
        self.model.set({"geojson": geojson});
      }
      reader.readAsArrayBuffer(file);
    } else {
      console.log("The file you're uploading isn't a CSV, XLS, or XLSX.");
    }
  }

});