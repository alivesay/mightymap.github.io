window.router = Backbone.Router.extend({
   
  routes: {
    "" : "index",
    "mapmaker" : "mapMaker"
  },

  index: function() {
    this.index = new window.indexView();
  },

  mapMaker: function() {
    this.mapMaker = new window.mapMakerView()
  }

});