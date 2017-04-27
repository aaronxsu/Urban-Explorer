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

// these are the weather icon fonts, the index of each element is the code mapped to yahoo weather code
var weatherIcons = ['&#xf056;', '&#xf01d;', '&#xf073;', '&#xf01e;', '&#xf01e;', '&#xf017;', '&#xf0b5;', '&#xf0b5;', '&#xf04e;', '&#xf04e;', '&#xf019;', '&#xf01a', '&#xf01a;', '&#xf01b;', '&#xf01b;', '&#xf064;', '&#xf01b;', '&#xf015;', '&#xf0b5;', '&#xf063;', '&#xf014;', '&#xf0b6', '&#xf062;', '&#xf050;', '&#xf021;', '&#xf076;', '&#xf013;', '&#xf086;', '&#xf002;', '&#xf083;', '&#xf00c;', '&#xf02e;', '&#xf00d;', '&#xf02e;', '&#xf00d;', '&#xf015;', '&#xf072;', '&#xf01e;', '&#xf01e;', '&#xf01e;', '&#xf01a;', '&#xf01b;', '&#xf01b;', '&#xf01b;', '&#xf013;', '&#xf01e;', '&#xf01b;', '&#xf01d;', '&#xf075'];


var getPlacePhoto = function(originalPhotoCode){
  if(originalPhotoCode != "0"){
    return "data:image/jpeg;base64," + originalPhotoCode;
  }else if(originalPhotoCode == '0'){
    return "http://www.nurnberg.com/images/image_unavailable_lrg.png"
  }
}

var getMarkerFillColor = function(category){
  switch(category) {
    case 'Stores':
      return '#008000';
      break;
    case 'Foods':
      return '#000080';
      break;
    case 'Religions':
      return '#400080';
      break;
    case 'Bars':
      return '#800040';
      break;
    case 'Arts':
      return '#808000';
      break;
    case 'Parks':
      return '#804000';
      break;
    case 'Others':
      return '#800080';
      break
    default:
      return '#ffffff';
    }
}


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
    var startName = '';
    var endName = '';
    $.ajax(reverseGeoCodeUriStart).done(function(data){
      console.log(data)
      startName = data.features[0].properties.name + ", " + data.features[0].properties.localadmin + ", " + data.features[0].properties.region_a + " " + data.features[0].properties.postalcode;
      $('#td-start-address').text(startName);
    })
    $.ajax(reverseGeoCodeUriEnd).done(function(data){
      endName = data.features[0].properties.name + ", " + data.features[0].properties.localadmin + ", " + data.features[0].properties.region_a + " " + data.features[0].properties.postalcode;
      $('#td-end-address').text(endName);
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

    var layerStartEndMarkers = [];
    _.each(startEnd, function(point, i){
      if(i == 0){
        var markerStart = L.circleMarker([point.lat, point.lon], {
          stroke: false,
          fillColor: '#00cd00',
          fillOpacity: 0.8
        }).addTo(mapExplore);
        layerStartEndMarkers.push({
          marker: markerStart,
          marker_id: L.stamp(markerStart),
          id: 'start'
        });
      }else{
        var markerEnd = L.circleMarker([point.lat, point.lon], {
          stroke: false,
          fillColor: '#cd0000',
          fillOpacity: 0.8
        }).addTo(mapExplore);
        layerStartEndMarkers.push({
          marker: markerEnd,
          marker_id: L.stamp(markerEnd),
          id: 'end'
        });
      }
    })

    var layerPlaceMarkers = [];
    _.each(places, function(eachPlace){
      var placeMarker = L.circleMarker([eachPlace.location.lat, eachPlace.location.lon], {
        fillColor: getMarkerFillColor(eachPlace.type_high),
        fillOpacity: 0.8,
        color: '#ffffff',
        weight: 2,
        opacity: 0.6,
        radius: 8
      }).bindPopup(eachPlace.name)
        .addTo(mapExplore);
      layerPlaceMarkers.push({
        marker: placeMarker,
        marker_id: L.stamp(placeMarker),
        id: eachPlace.place
      })
    })

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

    var routeScore = [];
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

      _.each(routeScore, function(route, routeIndex){
        //first generate the html for the route collapse, the time and tree rank, and the first place name
        var routeHtml = "<div>"
                      +   "<div class='card card-block' style='background-color: #428bca; color: white;'>"
                      +     "<h4 class='card-title' style='display:inline-block;'>Route&ensp;" + (routeIndex + 1).toString() + "</h4>"
                      +     "<button class='btn-up-arrow' id='" + route.point_index_order_index + "' type='button' data-toggle='collapse' data-target='#collapse-" + route.point_index_order_index + "' aria-expanded='false' aria-controls='collapse-" + route.point_index_order_index + "'><span class='glyphicon glyphicon-chevron-up up-arrow' aria-hidden='true'></span></button>"
                      +   "</div>"
                      +   "<div class='collapse' id='collapse-" + route.point_index_order_index + "'>"
                      +     "<div class='card card-block route'>"
                      +       "<div class='div-route-rank'>"
                      +         "<table class='tbl-route-rank'>"
                      +           "<tr>"
                      +             "<td>" + (routeScore.length - route.cost_score + 1).toString() + "</td>"
                      +             "<td>" + (routeScore.length - route.tree_score + 1).toString() + "</td>"
                      +           "</tr>"
                      +           "<tr>"
                      +             "<td>Efficiency</td>"
                      +             "<td>Green</td>"
                      +           "</tr>"
                      +         "</table>"
                      +       "</div>"
                      +     "<div class='div-route-table'>"
                      +       "<table class='tbl-routes'>"
                      +         "<tr>"
                      +           "<td colspan='2'id='start-name'>" + startName + "</td>"
                      +         "</tr>"

        // match the turb by turn result by the route id, find that turn by turn result
        // this result contains time and distance which are info needed for the trip leg display
        var routeTbt = _.chain(tbtResult)
                        .filter(function(tbt){
                          return parseInt(tbt.id) === route.point_index_order_index;
                        })
                        .first()
                        .value();

        //for this route's places, loop on these places
        _.each(route.point_index_order, function(pointIndex, arrayIndex){

          //if it is not the first place, because the first places should be the starting point
          if(arrayIndex != 0){
            //ge the time and distance from the current place to the next place
            var time = math.round(routeTbt.trip.legs[arrayIndex - 1].summary.time / 60.0, 1);
            var dist = math.round(routeTbt.trip.legs[arrayIndex - 1].summary.length, 2);
            //find the next place's name
            var placeName = '';
            var placePhotoHtml = "";
            var placeId = '';
            //if this is the last place, then this place should be the end point
            if(arrayIndex == route.point_index_order.length - 1){
              placeName = endName;
              placePhotoHtml = "";
              placeId = "end";
            }else{
              // if this is not the last place, find this place's name based on place index from the places array
              var thePlace = _.chain(places)
                              .filter(function(thisPlace){
                                return thisPlace.index === pointIndex;
                              })
                              .first()
                              .value()
              placeName = thePlace.name;
              // the place ID from google maps
              placeId = thePlace.place;
              // the html for the place photo from google
              placePhotoHtml =   "<tr>"
                             +      "<td colspan='2' style='padding-top: 10px;'><div class='view overlay hm-white-slight'>"
                             +        "<img src='" + getPlacePhoto(thePlace.photo_base64) + "' class='img-fluid' id='" + placeId + "-place-img'>"
                             +      "</div></td>"
                             +   "</tr>"
            }
            //generate the html for time and distance from current place to the next, and the next place's name
            routeHtml +=        "<tr id='" + route.point_index_order_index.toString()  + "-" + (arrayIndex - 1).toString() + "-leg'>"
                       +          "<td class='leg-time'>" + time + "</td>"
                       +          "<td class='leg-distance'>" + dist + "</td>"
                       +        "</tr>"
                       +        "<tr id='" + route.point_index_order_index.toString()  + "-" + (arrayIndex - 1).toString() + "-leg'>"
                       +          "<td class='leg-time-unit'>Minutes</td>"
                       +          "<td class='leg-distance-unit'>Miles</td>"
                       +        "</tr>"
                       +        placePhotoHtml
                       +        "<tr>"
                       +          "<td colspan='2' id='" + placeId + "-name'>" + placeName + "</td>"
                       +        "</tr>"

          }
        })
        //complte the html table, add +, -, and select buttons to this route
        routeHtml +=          "</table>"
                   +        "</div>"
                  //  +      "<button type='button' class='btn btn-outline-primary waves-effect' id='route-add' data-index='" + route.point_index_order_index + "'>+</button>"
                  //  +      "<button type='button' class='btn btn-outline-danger waves-effect' id='route-delete' data-index='" + route.point_index_order_index + "'>-</button>"
                   +      "<button type='button' class='btn btn-outline-default waves-effect' id='route-select' data-index='" + route.point_index_order_index + "'>Select</button>"
                   +    "</div>"
                   +  "</div>"
                   + "</div>"
        $('#map-sidebar').append(routeHtml);
      })

    }); // end of ajax call



    var layerRouteLegs = [];

    $("#map-sidebar")
//--------------------------------------------------------
//
//   When a route collapse button is clicked
//   update the route length and time cost
//   plot the route onto the map
//
//--------------------------------------------------------
    .on("click", ".btn-up-arrow", function(e){
      //the id of this route in string format
      var routeIdString = this.id;
      //the entire route
      var clickedRoute = _.filter(tbtResult, function(tbt){return tbt.id === routeIdString})[0];
      //set the time and distance in the summary card
      $("#trip-time").text(math.round(clickedRoute.trip.summary.time/60, 2));
      $("#trip-distance").text(math.round(clickedRoute.trip.summary.length, 2));

      if(layerRouteLegs.length){
        _.each(layerRouteLegs, function(eachLeg){
          mapExplore.removeLayer(eachLeg.polyline);
        });
        layerRouteLegs = [];
      }
      _.each(clickedRoute.trip.legs, function(thisLeg, legIndex){
        var turnPoints = decode(thisLeg.shape);
        var polylineLeg = L.polyline(turnPoints, {
          color: "#ffffff",
          weight: 2
        }).addTo(mapExplore);
        layerRouteLegs.push({
          polyline: polylineLeg,
          leg_id: routeIdString + "-" + legIndex.toString(),
          polyline_id: L.stamp(polylineLeg)
        })
      })
    })
//--------------------------------------------------------
//
//      When the mouse is over the place names
//      make its marker bigger

//--------------------------------------------------------
    .on("mouseover", "td[id*='-name']", function(e){
      $(this).css('font-weight', 'bold')
      var elementId = this.id;
      var hoveredMarker;
      if(elementId.split("-")[0] == 'start' || elementId.split("-")[0] == 'end'){
        hoveredMarker = _.filter(layerStartEndMarkers, function(eachMarker){
          return (eachMarker.id + "-name") === elementId;
        })[0]
        hoveredMarker.marker.setRadius(15);
      }else{
        hoveredMarker = _.filter(layerPlaceMarkers, function(eachMarker){
          return (eachMarker.id + "-name") === elementId;
        })[0]
        hoveredMarker.marker.setRadius(10).openPopup();
      }
    })
//--------------------------------------------------------
//
//      When the mouse is out of the place names
//      make its marker the original size
//
//--------------------------------------------------------
    .on("mouseout", "td[id*='-name']", function(e){
      $(this).css('font-weight', 'normal')
      var elementId = this.id;
      var hoveredMarker;
      if(elementId.split("-")[0] == 'start' || elementId.split("-")[0] == 'end'){
        hoveredMarker = _.filter(layerStartEndMarkers, function(eachMarker){
          return (eachMarker.id + "-name") === elementId;
        })[0]
        hoveredMarker.marker.setRadius(10);
      }else{
        hoveredMarker = _.filter(layerPlaceMarkers, function(eachMarker){
          return (eachMarker.id + "-name") === elementId;
        })[0]
        hoveredMarker.marker.setRadius(8).closePopup();
      }
    })
//--------------------------------------------------------
//
//      When the mouse is over the place photos
//      make its marker bigger
//
//--------------------------------------------------------
    .on("mouseover", "img[id*='-place-img']", function(e){
      var elementId = this.id;
      var hoveredMarker = _.filter(layerPlaceMarkers, function(eachMarker){
        return (eachMarker.id.toString() + "-place-img") === elementId;
      })[0]
      hoveredMarker.marker.setRadius(10).openPopup();
    })
//--------------------------------------------------------
//
//      When the mouse is out of the place photos
//      make its marker the original size
//
//--------------------------------------------------------
    .on("mouseout", "img[id*='-place-img']", function(e){
      var elementId = this.id;
      var hoveredMarker = _.filter(layerPlaceMarkers, function(eachMarker){
        return (eachMarker.id.toString() + "-place-img") === elementId;
      })[0]
      hoveredMarker.marker.setRadius(8).closePopup();
    })
//--------------------------------------------------------
//
//      When the mouse is over the route legs
//      make this leg bolder and change color to blue
//
//--------------------------------------------------------
    .on("mouseover", "tr[id*='-leg']", function(e){
      $(this).children().css('font-size', 'bold');
      var elementId = this.id;
      var hoveredPolyline = _.filter(layerRouteLegs, function(eachLeg){
        return (eachLeg.leg_id + '-leg') === elementId;
      })[0]
      hoveredPolyline.polyline.setStyle({weight: 4, color: '#428bca'}).bringToFront();
    })
//--------------------------------------------------------
//
//      When the mouse is out of the route legs
//      make this leg the original stroke and color
//
//--------------------------------------------------------
    .on("mouseout", "tr[id*='-leg']", function(e){
      $(this).children().css('font-size', 'normal');
      var elementId = this.id;
      var hoveredPolyline = _.filter(layerRouteLegs, function(eachLeg){
        return (eachLeg.leg_id + '-leg') === elementId;
      })[0]
      hoveredPolyline.polyline.setStyle({weight: 2, color: '#ffffff'}).bringToBack();
    })
    .on('click', "#route-select", function(e){

      //clear all fields
      _.each(["#trip_places", "#trip_start_end", "#trip_visit_order", "#trip_cost_time", "#trip_cost_dist", "#trip_cost_score", "#trip_green_score"], function(id){
        $(id).val("");
      })

      //the route index in string
      var routeIndexString = $(this).data('index').toString();

      //all the places info
      var placesToSave = [];
      _.each(places, function(thisPlace){
        placesToSave.push({
          id: thisPlace.place,
          name: thisPlace.name,
          geo: thisPlace.location,
          address: thisPlace.address,
          index: thisPlace.index,
          type: thisPlace.type_high
        })
      })
      $('#trip_places').val(JSON.stringify(placesToSave));

      //the start and end point locations
      $('#trip_start_end').val(JSON.stringify(startEnd));

      //visit order in string
      var placeOrder = _.filter(routeOrders, function(trip){return trip.index.toString() === routeIndexString })[0];
      $('#trip_visit_order').val(placeOrder.order_string);

      //time and distance cost
      var routeToSave = _.filter(tbtResult, function(tbt){return tbt.id === routeIndexString})[0];
      $('#trip_cost_time').val(math.round(routeToSave.trip.summary.time / 60, 2));
      $('#trip_cost_dist').val(math.round(routeToSave.trip.summary.length, 2));

      //the cost and green score
      var scoreToSave = _.filter(routeScore, function(score){ return score.point_index_order_index.toString() === routeIndexString})[0]
      $('#trip_cost_score').val(routeScore.length - scoreToSave.cost_score + 1);
      $('#trip_green_score').val(routeScore.length - scoreToSave.tree_score + 1);
    })


  }// end of paloma explore action functions
})//end of paloma controller trips
