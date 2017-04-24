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


Paloma.controller('Trips', {
  explore: function(){

    $('#sidebar-tab-explore').parent().prop('class', 'active');

    $('.sidebar').toggleClass('explore-map')


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
          cost_tree_score: averageScore
        })
      })

      routeScore = _.sortBy(routeScore, function(thisScore){ return -thisScore.cost_tree_score; });

      console.log(routeScore)




    }); // end of ajax call


  }
})
