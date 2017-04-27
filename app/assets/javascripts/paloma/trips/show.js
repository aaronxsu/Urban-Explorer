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
    return originalPhotoCode;
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
  show: function(){

    $('#sidebar-tab-history').parent().prop('class', 'active')

    $('.sidebar').toggleClass('show-map');

    var trip = this.params.trip;
    var tbtResult = this.params.tbt_result;
    console.log(trip);
    console.log(tbtResult)

    var mapShow = L.map('map-show', {
      center: [39.952, -75.1652],
      zoom: 14
    });

    var cartoToner = L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png', {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      minZoom: 0,
      maxZoom: 20,
      ext: 'png'
    }).addTo(mapShow);


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
                        +         "<td id='trip-time'>" + trip.cost_time + "</td>"
                        +         "<td id='trip-distance'>" + trip.cost_dist + "</td>"
                        +       "</tr>"
                        +       "<tr>"
                        +         "<td>Minutes</td>"
                        +         "<td>Miles</td>"
                        +       "</tr>"
                        +       "<tr>"
                        +         "<td id='trip-stops'>" + trip.places.length +"</td>"
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

    var reverseGeoCodeUriStart = "https://search.mapzen.com/v1/reverse?api_key=mapzen-qJmfq5U&point.lat=" + trip.start_end[0].lat + "&point.lon=" + trip.start_end[0].lon + "&size=1"
    var reverseGeoCodeUriEnd = "https://search.mapzen.com/v1/reverse?api_key=mapzen-qJmfq5U&point.lat=" + trip.start_end[1].lat + "&point.lon=" + trip.start_end[1].lon + "&size=1"
    var startName = '';
    var endName = '';
    $.ajax(reverseGeoCodeUriStart).done(function(data){
      startName = data.features[0].properties.name + ", " + data.features[0].properties.localadmin + ", " + data.features[0].properties.region_a + " " + data.features[0].properties.postalcode;
      $('#td-start-address').text(startName);
      $('#start-name').text(startName);
    })
    $.ajax(reverseGeoCodeUriEnd).done(function(data){
      endName = data.features[0].properties.name + ", " + data.features[0].properties.localadmin + ", " + data.features[0].properties.region_a + " " + data.features[0].properties.postalcode;
      $('#td-end-address').text(endName);
      $('#end-name').text(endName);
    })

    var layerStartEndMarkers = [];
    _.each(trip.start_end, function(point, i){
      if(i == 0){
        var markerStart = L.circleMarker([point.lat, point.lon], {
          stroke: false,
          fillColor: '#00cd00',
          fillOpacity: 0.8
        }).addTo(mapShow);
        layerStartEndMarkers.push({
          marker: markerStart,
          marker_id: L.stamp(mapShow),
          id: 'start'
        });
      }else{
        var markerEnd = L.circleMarker([point.lat, point.lon], {
          stroke: false,
          fillColor: '#cd0000',
          fillOpacity: 0.8
        }).addTo(mapShow);
        layerStartEndMarkers.push({
          marker: markerEnd,
          marker_id: L.stamp(markerEnd),
          id: 'end'
        });
      }
    })

    var layerPlaceMarkers = [];
    _.each(trip.places, function(eachPlace){
      var placeMarker = L.circleMarker([eachPlace.geo.lat, eachPlace.geo.lon], {
        fillColor: getMarkerFillColor(eachPlace.type),
        fillOpacity: 0.8,
        color: '#ffffff',
        weight: 2,
        opacity: 0.6,
        radius: 8
      }).bindPopup(eachPlace.name)
        .addTo(mapShow);
      layerPlaceMarkers.push({
        marker: placeMarker,
        marker_id: L.stamp(placeMarker),
        id: eachPlace.id
      })
    });


    var routeHtml =     "<div class='card card-block route'>"
                  +       "<div class='div-route-rank'>"
                  +         "<table class='tbl-route-rank'>"
                  +           "<tr>"
                  +             "<td>" + trip.cost_score + "</td>"
                  +             "<td>" + trip.green_score + "</td>"
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

    var legPoints = [];
    _.each(tbtResult.trip.legs, function(eachLeg, i){

      legPoints.push(decode(eachLeg.shape));

      var time = math.round(eachLeg.summary.time / 60 , 2);
      var dist = math.round(eachLeg.summary.length    , 2);
      var placeId = '';
      var placePhotoHtml = '';
      var placeName = ''

      if(i != tbtResult.trip.legs.length - 1){
        placeId = trip.places_ordered[i].id;
        placeName = trip.places_ordered[i].name;
        placePhotoHtml +=   "<tr>"
                        +      "<td colspan='2' style='padding-top: 10px;'><div class='view overlay hm-white-slight'>"
                        +        "<img src='" + getPlacePhoto(trip.places_ordered[i].photo_base64) + "' class='img-fluid' id='" + placeId + "-place-img'>"
                        +      "</div></td>"
                        +   "</tr>"
      }else{
        placeId = 'end';
        placePhotoHtml = '';
        placeName = endName;
      }
      routeHtml +=        "<tr id='leg-" + i + "'>"
                 +          "<td class='leg-time'>" + time + "</td>"
                 +          "<td class='leg-distance'>" + dist + "</td>"
                 +        "</tr>"
                 +        "<tr id='leg-" + i + "'>"
                 +          "<td class='leg-time-unit'>Minutes</td>"
                 +          "<td class='leg-distance-unit'>Miles</td>"
                 +        "</tr>"
                 +        placePhotoHtml
                 +        "<tr>"
                 +          "<td colspan='2' id='" + placeId + "-name'>" + placeName + "</td>"
                 +        "</tr>"
    });

    routeHtml +=          "</table>"
               +        "</div>"
               +    "</div>";
    $('#map-sidebar').append(routeHtml);
    console.log(legPoints)

    var layerLegs = [];
    _.each(legPoints, function(eachPointSet, i){
      var legPolyline = L.polyline(eachPointSet, {
        color: "#ffffff",
        weight: 2
      }).addTo(mapShow);
      layerLegs.push({
        polyline: legPolyline,
        leg_id: "leg-" + i.toString()
      });
    });

    console.log(layerLegs)

    mapShow.fitBounds(L.polyline(_.flatten(legPoints, true)).getBounds());



    $("#map-sidebar")
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
//      THIS PART LOOKS LIKE A LITTLE BIT BUGGY----------------------------------------------------------------------------------------------------------------
//
//--------------------------------------------------------
    .on("mouseover", "tr[id*='leg-']", function(e){
      $(this).children().css('font-size', 'bold');
      var elementId = this.id;
      var hoveredPolyline = _.filter(layerLegs, function(eachLeg){
        return eachLeg.leg_id === elementId;
      })[0]
      hoveredPolyline.polyline.setStyle({weight: 4, color: '#428bca'}).bringToFront();
    })
//--------------------------------------------------------
//
//      When the mouse is out of the route legs
//      make this leg the original stroke and color
//
//--------------------------------------------------------
    .on("mouseout", "tr[id*='leg-']", function(e){
      $(this).children().css('font-size', 'normal');
      var elementId = this.id;
      var hoveredPolyline = _.filter(layerLegs, function(eachLeg){
        return eachLeg.leg_id === elementId;
      })[0]
      hoveredPolyline.polyline.setStyle({weight: 2, color: '#ffffff'}).bringToBack();
    })



  }
})
