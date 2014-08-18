/** @jsx React.DOM */
"use strict";
var React = require("react");
var PropTypes = React.PropTypes;
var Link = require("react-router").Link;
var Table = require("react-bootstrap/Table");
var Glyphicon = require("react-bootstrap/Glyphicon");

var EventStore = require("../stores/event");


module.exports = React.createClass({
  displayName: "AdminEventList",
  getInitialState: function() {
    return {
      events: EventStore.getEvents(),
    };
  },
  componentWillMount: function () {
    EventStore.init();
  },
  componentDidMount: function () {
    EventStore.addChangeListener(this.updateEvents);
  },
  componentWillUnmount: function() {
    EventStore.removeChangeListener(this.updateEvents);
  },
  updateEvents: function () {
    if(!this.isMounted()) {
      return;
    }
    this.setState({
      events: EventStore.getEvents(),
    });
  },
  renderEventList: function () {
    var rows = [];
    if(this.state.events.length === 0) {
      rows.push(<tr key="emptyTable"><td colSpan="4">Aucun événement</td></tr>);
    } else {
      rows = this.state.events.map(function (event) {
        return (
          <tr key={event.id}>
            <td>{event.isClosed? (<Glyphicon glyph="remove" />) : null}</td>
            <td><Link to="edit-event" id={event.id}>{event.name}</Link></td>
            <td>{event.startDate.toLocaleString()}</td>
            <td>{event.endDate.toLocaleString()}</td>
            <td>{/* Actions delete */}</td>
          </tr>
        );
      });
    }

    return (
      <div className="event-list">
        <h3>Événements</h3>
        <Table bordered hover responsive>
          <thead>
            <tr>
              <th>État</th>
              <th>Nom</th>
              <th>Début</th>
              <th>Fin</th>
              <th>{/* Actions */}</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </Table>
      </div>
    );
  },
  render: function() {
    return this.props.activeRouteHandler() || this.renderEventList();
  }
});