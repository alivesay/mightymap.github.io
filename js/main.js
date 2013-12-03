(function() {
  
  // Instantiate model, views.
  window.map = new window.mapModel();
  window.index = new window.indexView({model: window.map});
  window.mapMaker = new window.mapMakerView({model: window.map});

})();