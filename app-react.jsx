/** @jsx React.DOM */
// vim:set ft=javascript sw=2 et:

var MatchForm = React.createClass({
  render: function () {
    return <div className="screen">Hello world!</div>;
  }
})

React.renderComponent(<MatchForm />, document.body);
