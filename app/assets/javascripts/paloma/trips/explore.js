// This is adapted from the implementation in Project-OSRM
// https://github.com/DennisOSRM/Project-OSRM-Web/blob/master/WebContent/routing/OSRM.RoutingGeometry.js
var decode = function(str, precision) {
    var index = 0,
        lat = 0,
        lng = 0,
        coordinates = [],
        shift = 0,
        result = 0,
        byte = null,
        latitude_change,
        longitude_change,
        factor = Math.pow(10, precision || 6);

    // Coordinates have variable length when encoded, so just keep
    // track of whether we've hit the end of the string. In each
    // loop iteration, a single coordinate is decoded.
    while (index < str.length) {

        // Reset shift, result, and byte
        byte = null;
        shift = 0;
        result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        shift = result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        lat += latitude_change;
        lng += longitude_change;

        coordinates.push([lat / factor, lng / factor]);
    }

    return coordinates;
};

// _.range(48).concat([3200])
var weatherIcons = ['&#xf056;', '&#xf01d;', '&#xf073;', '&#xf01e;', '&#xf01e;', '&#xf017;', '&#xf0b5;', '&#xf0b5;', '&#xf04e;', '&#xf04e;', '&#xf019;', '&#xf01a', '&#xf01a;', '&#xf01b;', '&#xf01b;', '&#xf064;', '&#xf01b;', '&#xf015;', '&#xf0b5;', '&#xf063;', '&#xf014;', '&#xf0b6', '&#xf062;', '&#xf050;', '&#xf021;', '&#xf076;', '&#xf013;', '&#xf086;', '&#xf002;', '&#xf083;', '&#xf00c;', '&#xf02e;', '&#xf00d;', '&#xf02e;', '&#xf00d;', '&#xf015;', '&#xf072;', '&#xf01e;', '&#xf01e;', '&#xf01e;', '&#xf01a;', '&#xf01b;', '&#xf01b;', '&#xf01b;', '&#xf013;', '&#xf01e;', '&#xf01b;', '&#xf01d;', '&#xf075'];


Paloma.controller('Trips', {
  explore: function(){

    $('#sidebar-tab-explore').parent().prop('class', 'active');

    $('.sidebar').toggleClass('explore-map');

    var costResult = this.params.costResult;
    var places = this.params.places;
    var startEnd = this.params.startEnd;
    var routeOrders = this.params.routeOrders;
    var tbtResult = this.params.tbtResult;

    _.each(routeOrders, function(eachOrder){
      var orderString = "";
      _.each(eachOrder.order, function(index){ orderString += index.toString()})
      eachOrder.order_string = orderString;
    })

    _.each(costResult, function(eachCost){
      var orderString = "";
      _.each(eachCost.ordered_route_index, function(index){ orderString += index.toString()} )
      eachCost.ordered_route_index_string = orderString;
    })

    var treeCounts = "https://raw.githubusercontent.com/aaronxsu/MyData/master/tree_count_points.geojson";

    console.log("All places: ", places)
    console.log("Start and end: ", startEnd)
    console.log("Route orders: ", routeOrders)
    console.log("Cost result: ", costResult)
    console.log("Turn by Turn Result: ", tbtResult)

    // the HTML for the sidebar top summary card
    var summaryCardHtml = "<div class='card' id='card-summary'>"
                        +   "<div class='view overlay hm-white-slight'>"
                        +     "<img src='http://bitcoinist.com/wp-content/uploads/2016/02/Philadelphia.jpg' class='img-fluid' alt=''>"
                        +     "<a href='#'><div class='mask waves-effect waves-light'></div></a>"
                        +   "</div>"
                        +   "<div class='card-block'>"
                        +     "<table class='tbl-temperature'>"
                        +       "<tr>"
                        +         "<td id='temperature'></td>"
                        +         "<td id='weather-icon'></td>"
                        +       "</tr>"
                        +     "</table>"
                        +     "<table class='tbl-trip-start-end'>"
                        +       "<tr>"
                        +         "<td>Start</td>"
                        +         "<td><span class='glyphicon glyphicon-play' aria-hidden='true'></span></td>"
                        +         "<td id='td-start-address'></td>"
                        +       "</tr>"
                        +       "<tr>"
                        +         "<td>End</td>"
                        +         "<td><span class='glyphicon glyphicon-play' aria-hidden='true'></span></td>"
                        +         "<td id='td-end-address'></td>"
                        +       "</tr>"
                        +     "</table>"
                        +     "<table class='tbl-trip-summary'>"
                        +       "<tr>"
                        +         "<td id='trip-time'>N/A</td>"
                        +         "<td id='trip-distance'>N/A</td>"
                        +       "</tr>"
                        +       "<tr>"
                        +         "<td>Minutes</td>"
                        +         "<td>Miles</td>"
                        +       "</tr>"
                        +       "<tr>"
                        +         "<td id='trip-stops'>" + places.length +"</td>"
                        +         "<td><img src='https://d30y9cdsu7xlg0.cloudfront.net/png/19727-200.png'></td>"
                        +       "</tr>"
                        +       "<tr>"
                        +         "<td>Stops</td>"
                        +         "<td>By walk</td>"
                        +       "</tr>"
                        +     "</table>"
                        +   "</div>"
                        + "</div>"

    // append it to the sibe bar
    $('#map-sidebar').append(summaryCardHtml);

    // get the current location weather and update the summary table weather part
    $.simpleWeather({
      location: 'Philadelphia, PA',
      woeid: '',
      unit: 'f',
      success: function(weather) {
        $("#temperature").text(weather.temp+'°'+weather.units.temp)
        var weatherIcon;
        _.each(weatherIcons, function(icon, index){
          if(index.toString() == weather.code){ weatherIcon = icon; }
        })
        $('#weather-icon').html(weatherIcon);
      },
      error: function(error) {
        $("#temperature").text("N/A");
        $('#weather-icon').text("N/A");
      }
    });

    var reverseGeoCodeUriStart = "https://search.mapzen.com/v1/reverse?api_key=mapzen-qJmfq5U&point.lat=" + startEnd[0].lat + "&point.lon=" + startEnd[0].lon + "&size=1"
    var reverseGeoCodeUriEnd = "https://search.mapzen.com/v1/reverse?api_key=mapzen-qJmfq5U&point.lat=" + startEnd[1].lat + "&point.lon=" + startEnd[1].lon + "&size=1"
    $.ajax(reverseGeoCodeUriStart).done(function(data){
      $('#td-start-address').text(data.features[0].properties.name);
    })
    $.ajax(reverseGeoCodeUriEnd).done(function(data){
      $('#td-end-address').text(data.features[0].properties.name);
    })


    var mapExplore = L.map('map-explore', {
      center: [39.952, -75.1652],
      zoom: 14
    });

    var cartoToner = L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png', {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      minZoom: 0,
      maxZoom: 20,
      ext: 'png'
    }).addTo(mapExplore);

    var shapes = [];
    _.each(tbtResult, function(tbt){
      var thisShape = [];
      _.each(tbt.trip.legs, function(leg){
        thisShape.push(decode(leg.shape));
      })
      shapes.push({
        id: tbt.id,
        shape: thisShape,
        all_points: _.flatten(thisShape, true),
        line_string: L.polyline(_.flatten(thisShape, true)).toGeoJSON(),
        buffer: turf.buffer(L.polyline(_.flatten(thisShape, true)).toGeoJSON(), 0.5, "kilometers")
      })
    })

    $.ajax(treeCounts).done(function(data){
      var trees = JSON.parse(data);
      var treeCountResult = [];

      _.each(shapes, function(thisShape){

        var points = turf.within(trees, { "type": "FeatureCollection", "features": [ thisShape.buffer ] })

        var averageTreeCount = _.reduce(points.features, function(memo, num){ return memo + num.properties.count; }, 0) / points.features.length


        treeCountResult.push({
          permutation_index: thisShape.id,
          avg_tree_count: averageTreeCount
        })
      })

      treeCountResult = _.chain(treeCountResult)
                         .sortBy(function(result){
                           return result.avg_tree_count}
                         )
                         .each(function(result, index){
                           result.score = index + 1;
                         })
                         .value()

      var routeScore = [];
      _.each(treeCountResult, function(treeCount){
        var matchedRoute = _.filter(routeOrders, function(eachOrder){
          return eachOrder.index === parseInt(treeCount.permutation_index)
        })

        var matchedCostResult = _.filter(costResult, function(thisCost){
          return thisCost.ordered_route_index_string === matchedRoute[0].order_string;
        })

        var averageScore = (treeCount.score + matchedCostResult[0].cost_score) / 2

        routeScore.push({
          point_index_order_index: parseInt(treeCount.permutation_index),
          point_index_order: matchedCostResult[0].ordered_route_index,
          point_index_order_string: matchedCostResult[0].ordered_route_index_string,
          cost_tree_score: averageScore,
          cost_score: matchedCostResult[0].cost_score,
          tree_score: treeCount.score
        })
      })

      routeScore = _.sortBy(routeScore, function(thisScore){ return -thisScore.cost_tree_score; });

      console.log(routeScore)




    }); // end of ajax call


  }
})
