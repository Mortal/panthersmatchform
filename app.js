"use strict";

var App = function(elm) {
  this.mainElement = elm;
};

App.prototype.Start = function() {
  var set = new App.SetModel();
  this.setView = new this.SetView({model: set});
  $(this.mainElement).append(this.setView.render().el);
};

App.SetModel = Backbone.Model.extend({
  defaults: function() {
    return {
      number: 1,
      teams: ["ASV 7", "Viborg"]
    }
  }
});


App.AppView = Backbone.View.extend({
  tagName: "div",
  className: "screen",
  initialize: function() {
    this.setModel = new App.SetModel();
    this.setView = new this.SetView({model: set});
  }
});

App.SetView = Backbone.View.extend({
  tagName: "div",
  className: "set",
  initialize: function() {
  },
  render: function() {
    this.$el.html();
    return this;
  }
});


App.ScoreView = Backbone.View.extend({
  tagName: "div",
  className: "set_score",
  events: { },
  initialize: function() {
  },
  render: function() {
  }
});
