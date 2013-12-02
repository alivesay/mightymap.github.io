// The router instantiates each view. Index view creates new map model, navigates to /#/mapmaker (with the router than instantiating the mapMakerView).
window.router = Backbone.Router.extend({
   
  routes: {
    "" : "index",
    "mapmaker" : "mapMaker"
  },

  index: function() {
    this.index = new window.indexView();
  },

  mapMaker: function() {
    if (window.map.geojson) {
      this.mapMaker = new window.mapMakerView();
    } else {
      window.app.navigate("");
    }
  }

});