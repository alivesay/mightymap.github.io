(function() {

  // Map viewer will manage folks hitting a saved map.
  // window.mapView = Backbone.View.extend();

  // About view will show static content about the app.
  // window.aboutView = Backbone.View.extend();

  // Blog view will show list of blog posts.
  // window.blogView = Backbone.View.extend();

  // Post view will show indiviudal blog posts.
  // window.postView = Backbone.View.extend();

  // Sign up view will manage sign up.
  // window.signUpView = Backbone.View.extend();

  // Sign in view will manage sign in.
  // window.signInView = Backbone.View.extend();

  // Dashboard will be what users see when they log in. Should show all the maps associated with user, number of views on each.
  // window.dashboardView = Backbone.View.extend();
   
  window.app = new window.router();
  Backbone.history.start();

})();

