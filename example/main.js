'use strict';

var polyfill = require("babel-polyfill");
var document = require('global/document');
var window = require('global/window');
var React = require('react');
var ReactDOM = require('react-dom');
var Immutable = require('immutable');
var r = require('r-dom');
var MapGL = require('react-map-gl');
var HeatmapOverlay = require('../');
var assign = require('object-assign');
var rasterTileStyle = require('raster-tile-style');
var socketio = require('socket.io-client');
var $ = require("jquery");
var locations = require('example-cities');


function color() {
  return 'rgb(35, 207, 185)';
}

// {{'latitude', 'longitude'}, expire}
var cache = [];

var App = React.createClass({

  displayName: 'App',

  loadInitialData: function loadInitialData() {
      var app = this;
      for (var i = 0; i < locations.length; i++) {
          cache.push({point: locations[i], timeout: Math.floor(Math.random() * 200 + 60)});
      }
      app.setState({points: locations});
      //$.ajax({
      //    url: '',
      //}).done(function() {
      //    app.setState({points: locations});
      //});
  },

  getInitialState: function getInitialState() {
    return {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        latitude: 39.50,
        longitude: -98.25,
        zoom: 3
      },
      points: [],
      gradientColors: Immutable.List([color(), color()]),
    };
  },

  componentDidMount: function componentDidMount() {
    //this.loadInitialData();
    window.addEventListener('resize', function onResize() {
      this.setState({
        viewport: assign({}, this.state.viewport, {
          width: window.innerWidth,
          height: window.innerHeight
        })
      });
    }.bind(this));
    window.setInterval(function setInterval() {
      this.setState({gradientColors: Immutable.List([color(), color()])});
    }.bind(this), 2000);
    this.pulse();
  },

  _onChangeViewport: function _onChangeViewport(viewport) {
    this.setState({viewport: assign({}, this.state.viewport, viewport)});
  },

  render: function render() {
    return r(MapGL, assign({}, this.state.viewport, {
      onChangeViewport: this._onChangeViewport,
      mapboxApiAccessToken: 'pk.eyJ1IjoiZm9ya2xvb3AiLCJhIjoiY2lyNWphMmt6MDA3amdjbmZkd2drazNqOSJ9.65mr0gv1_YWV2bd-NOlRHQ',
    }), [
      r(HeatmapOverlay, assign({}, this.state.viewport, {
        locations: this.state.points,
        // Semantic zoom
        sizeAccessor: function sizeAccessor() {
          return 60;
        }
        // gradientColors: this.state.gradientColors
        // Geometric zoom
        // sizeAccessor: function sizeAccessor() {
        //   return 30 * Math.pow(2, this.state.viewport.zoom - 0);
        // }
      }))
    ]);
  },

    pulse: function pulse() {
      window.setInterval(function(app) {
          return function() {
              var index = Math.floor(Math.random() * locations.length);
              //cache.push({point: locations[index], timeout: Math.floor(Math.random() * 300)});
              var points = [];
              var c = [];
              for (var i = 0; i < cache.length; i++) {
                  var timeout = cache[i].timeout;
                  if (--timeout > 0) {
                      points.push(cache[i].point);
                      c.push({point: cache[i].point, timeout: timeout});
                  }
              }
              cache = c;
              app.setState({points: points});
          }
      }(this), 1000);
    },

});

var io = socketio('http://localhost:5000');
io.on('connect', function() {
    console.log('connected...');
    io.on('searches', function(msg) {
        console.log(msg.data);
        var points = msg.data;
        console.log(points.length);
        for (var i = 0; i < points.length; i++) {
            var point = points[i];
            cache.push({point: {latitude: parseFloat(point[0]), longitude: parseFloat(point[1])}, timeout: Math.random() * 300});
        }
    });
});

var reactContainer = document.createElement('div');
document.body.style.margin = '0';
document.body.appendChild(reactContainer);
ReactDOM.render(r(App), reactContainer);

