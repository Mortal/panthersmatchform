"use strict"; // vim: set ft=javascript sw=2 noet:

var App = function(elm) {
  this.mainElement = elm;
};

App.prototype.Start = function() {
  this.appView = new App.AppView();
  $(this.mainElement).html(this.appView.render().el);
};

App.Set = Backbone.Model.extend({
  defaults: function() {
    return {
      number: 1,
      teams: ["ASV 7",
              "Viborg"]
    }
  }
});

App.AppView = Backbone.View.extend({
  tagName: "div",
  className: "screen",
  initialize: function() {
    this.activeSet = new App.Set();
  },
  render: function() {
    this.setView = new App.SetView({model: this.activeSet});
    this.modalView = new App.ModalView();
    this.$el.append(this.setView.render().el);
    this.$el.append(this.modalView.render().el);
    return this;
  }
});

App.TeamViewModel = Backbone.Model.extend();

App.SetView = Backbone.View.extend({
  tagName: "div",
  className: "set",
  initialize: function() {
    this.template = _.template($('#set_main').html());
  },
  render: function() {
    this.$el.html(this.template({
      number: this.model.get('number')
    }));
    this.leftTeamView = new App.TeamView({
                              el: this.$('.team_left')
                        }).render();
    this.rightTeamView = new App.TeamView({
                              el: this.$('.team_right')
                        }).render();
    return this;
  }
});

App.TeamView = Backbone.View.extend({
  initialize: function() {
    this.template = _.template($('#team_main').html());
  },
  render: function() {
    this.$el.html(this.template({score: 0,
                                 name: "derp"}));
    return this;
  }
});

App.ModalView = Backbone.View.extend({
  tagName: 'div',
  className: 'modal',
  initialize: function() {
    this.template = _.template($('#modal_main').html());
  },
  render: function() {
    this.$el.html(this.template());
    return this;
  }
});
