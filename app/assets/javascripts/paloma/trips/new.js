var getPlacePrice = function(originalPrice){
  var placePrice = parseInt(originalPrice);
  var placePriceDollars;
  if(placePrice){
    if(placePrice == 0){
      placePriceDollars = "Free";
    }else if(placePrice == 1){
      placePriceDollars = "$";
    }else if(placePrice == 2){
      placePriceDollars = "$$";
    }else if(placePrice == 3){
      placePriceDollars = "$$$";
    }else if(placePrice == 4){
      placePriceDollars = "$$$$";
    }
  }else {
    placePriceDollars = 'Unavailable';
  }
  return placePriceDollars;
}

var getPlaceRating = function(originalRating){
  var placeRatingStars = '';
  if(originalRating){
    _.times(Math.round(parseFloat(originalRating)), function(n){
      placeRatingStars += "<img src='https://cdn2.iconfinder.com/data/icons/basic-ui-flat/605/106_-_Star-512.png' height='25' width='25' style='display: inline-block'>"
    })
  }else{
    placeRatingStars = "Unavailable"
  }
  return placeRatingStars;
}

var getPlacePhoto = function(originalPhotoCode){
  if(originalPhotoCode != "0"){
    return originalPhotoCode;
  }else if(originalPhotoCode == '0'){
    return "http://www.nurnberg.com/images/image_unavailable_lrg.png"
  }
}

var getPlaceAddress = function(originalAddress){
  if(!originalAddress){
    return "Unavailable"
  }else{
    return originalAddress;
  }
}

var getPlaceHighCat = function(originalHighCat){
  if(originalHighCat.includes('_')){
    var firstWord = originalHighCat.split('_')[0].charAt(0).toUpperCase() + originalHighCat.split('_')[0].slice(1);
    var secondWord = originalHighCat.split('_')[1].charAt(0).toUpperCase() + originalHighCat.split('_')[1].slice(1);
    return firstWord + " " + secondWord;
  }else{
    return originalHighCat.charAt(0).toUpperCase() + originalHighCat.slice(1);
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

var findNextPlace = function(catPlacesAll, thisPlaceId){
  var nextPlace = [];
  _.each(_.range(catPlacesAll.length), function(num){
    if(this[num].place_id == thisPlaceId){
      if(num == catPlacesAll.length - 1){
        findNextPlace(catPlacesAll, thisPlaceI);
      }else{
        nextPlace.push(this[num+1])
      }
    }
  }, catPlacesAll);
  return nextPlace;
};


Paloma.controller('Trips', {
  new: function(){

    $('#place-types').hide();
    $('#btn-explore-fake').hide();
    $('#sidebar-tab-explore').parent().prop('class', 'active');

    var types = this.params.types;

    var map = L.map('map', {
      center: [39.952, -75.1652],
      zoom: 14
    });

    var cartoToner = L.tileLayer('http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png', {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      minZoom: 0,
      maxZoom: 20,
      ext: 'png'
    }).addTo(map);

    var drawControl = new L.Control.Draw({
      draw: {
        polyline: false,
        polygon: true,
        circle: false,
        marker: false,
        rectangle: false
      }
    });

    map.addControl(drawControl);

    //store the search area layer
    var selectedArea = [];
    //store all must go placrs markers
    var mustGoMarkers = [];
    //store explore search places detailed info
    var searchPlaces;
    //store all selected place markers to explore
    var markersExplorePois = [];
    //store all selected places IDs and marker IDs
    var idExplorePois = [];

    map.on('draw:created', function (e) {
      var type = e.layerType; // The type of shape
      var layer = e.layer; // The Leaflet layer for the shape
      var id = L.stamp(layer); // The unique Leaflet ID for the layer

      if(type !== 'marker'){

        if(selectedArea[0]){
          map.removeLayer(selectedArea[0])
        }

        layer.setStyle({
          color: '#ffffff',
          opacity: 0.8,
          weight: 2,
          fillColor: '#ffffff',
          fillOpacity: 0.4
        });

        selectedArea.push(layer);

        map.addLayer(layer);

        var latitude = layer.getBounds().getCenter().lat;
        var longitude = layer.getBounds().getCenter().lng;
        var box = turf.bbox(layer.toGeoJSON())
        var sqaure = turf.square(box);
        var poly = turf.bboxPolygon(sqaure);
        var radius = (turf.lineDistance(poly, 'kilometers')/4)*1000;

        map.fitBounds(layer.getBounds());

        $('#latitude').val(latitude);
        $('#longitude').val(longitude);
        $('#distance').val(radius);
      }else{
        var point = turf.point([layer.getLatLng().lng, layer.getLatLng().lat]);
        var polygon = turf.polygon(selectedArea[0].toGeoJSON().geometry.coordinates);
        var isPtInPoly = turf.inside(point, polygon);
        if(isPtInPoly && mustGoMarkers.length < 2){
          var layerMarker = layer.on('click', function(e){
                                    if(mustGoMarkers.length){
                                      mustGoMarkers = _.reject(mustGoMarkers, function(marker){ return marker === e.target; });
                                      locMustGo = _.reject(locMustGo, function(location){ return location === {lat: e.target.getLatLng.lat, lon: e.target.getLatLng.lng}; });
                                      $('#start_end').val(JSON.stringify(locMustGo));
                                    }
                                    map.removeLayer(e.target);
                                  })
                                 .addTo(map)
          mustGoMarkers.push(layerMarker);
        }

        var locMustGo = _.map(mustGoMarkers, function(place){
          return {lat: place.getLatLng().lat, lon: place.getLatLng().lng};
        })
        $('#start_end').val(JSON.stringify(locMustGo));
      }



    });//end of map on draw

    var selectedTypes = [];

    // Any checkbox marked as the top classes is checked
    // Then append all its secondary classes
    // Any checkbox marked as the top classes is not checked
    // Empty the appended secondary classes and uncheck them
    $('.cat_first').on('change', function(e){

      var id = this.id;
      var status = $(this).prop('checked');

      if(status){

        _.chain(types)
          .filter(function(type){ return type.cat_first === id; })
          .first()
          .pick('cat_second')
          .values()
          .first()
          .each(function(cat){

            var newCat = new String();
            _.each(cat.split(' '), function(word,index){
              if(index != cat.split(' ').length-1){
                newCat += word + '-'
              }else {
                newCat += word
              }
            });
            var html = "<div><span style='font-size: 12px;'>&ensp;&ensp;" + cat + "</span><div id='div-subcat-ckbox'>"
                     + "<input type='checkbox' id='" + newCat + "' class='cat_second' style='visibility: hidden;' unchecked>"
                     + "<label for='" + newCat + "'></label></div></div>"

            // "<div id='div-subcat-ckbox'>"
            //           +"&ensp;&ensp;" + cat
            //           + "<input type='checkbox' id='" + newCat + "' class='cat_second' style='visibility: hidden;' unchecked><label for='"+newCat+"'></label></div>"

            $('#'+id+'-second').append(html);

          })
          .value();



        $('.cat_second').on('change', function(e){
          var idTwo = this.id;
          var statusTwo = $(this).prop('checked');
          var currentId = new String();


          if(statusTwo){

            _.each(idTwo.split('-'), function(word,index){
              if(index != idTwo.split('-').length-1){
                currentId += word + '_'
              }else {
                currentId += word
              }
            });

            selectedTypes.push(currentId)
            console.log(selectedTypes);

            $('#selected_types').val(_.uniq(selectedTypes));

          }else{

            _.each(idTwo.split('-'), function(word,index){
              if(index != idTwo.split('-').length-1){
                currentId += word + '_'
              }else {
                currentId += word
              }
            });

            selectedTypes = _.reject(selectedTypes, function(type){return type == currentId})
            console.log(selectedTypes);

            $('#selected_types').val(_.uniq(selectedTypes));

          }
        })

      }else{
        var idToDelete = [];
        $('#'+id+'-second').children().each(function(){


          var childId = this.id;


          if(childId){
            var childIdNew = '';
            _.each(childId.split('-'), function(word,index){
              if(word && index != childId.split('-').length-1){
                childIdNew += word + '_'
              }else {
                childIdNew += word
              }

            });

            idToDelete.push(childIdNew);
          }

        })

        selectedTypes = _.difference(selectedTypes, idToDelete)

        console.log(selectedTypes)
        $('#selected_types').val(_.uniq(selectedTypes));
        $('#'+id+'-second').empty();
        $('#'+id+'-second .cat_second').prop('checked', false);

      }
    });


    $('#btn-place_search_submit').click(function(e){

      $('#spinner').append('<img src="https://simplygym.co.uk/wp-content/themes/simplygym/img/spinner.gif" style="height: 80px; width:80px">')

      var checkExist = setInterval(function() {
         if ($('#place-search-result').text().length) {

            clearInterval(checkExist);

            searchPlaces =  _.map(JSON.parse($('#place-search-result').text()), function(obj){return JSON.parse(obj)});
            console.log(searchPlaces);

            $('#spinner').empty();

            _.each(searchPlaces, function(typePlaces){
              var catHigh = typePlaces.type;
              var firstPlaceId = typePlaces.places[0].place_id;
              var firstPlaceName = typePlaces.places[0].name.toUpperCase();

              var html = "<div class='card' id='" + catHigh + "-card'>"
                       +    "<div class='view overlay hm-white-slight'>"
                       +      "<img src='" + getPlacePhoto(typePlaces.places[0].photo_64) + "' class='img-fluid' id='" + firstPlaceId + "-place-img'>"
                       +      "<a href='#'><div class='mask waves-effect waves-light'></div></a>"
                       +    "</div>"
                       +    "<div class='card-block'>"
                       +      "<h4 class='card-title' id='" + firstPlaceId + "-place-name'>" + firstPlaceName + "</h4>"
                       +      "<p class='card-text' id='" + firstPlaceId + "-place-rating'><span>" + getPlaceRating(typePlaces.places[0].rating) + "</span></p>"
                       +      "<p class='card-text' id='" + firstPlaceId + "-place-price-types'>"+ getPlacePrice(typePlaces.places[0].price)  + " &bull; " + getPlaceHighCat(catHigh) + "</p>"
                       +      "<p class='card-text' id='" + firstPlaceId + "-place-address'>" + getPlaceAddress(typePlaces.places[0].address) +"</p>"
                       +      "<button class='btn btn-outline-default waves-effect btn-place-next' id='" + firstPlaceId + "-place-next'>Next</a>"
                       +      "<button class='btn btn-outline-primary waves-effect btn-place-add' id='" + firstPlaceId + "-place-add'>add to map</a>"
                       +    "</div>"
                       + "</div>";

              $("#map-sidebar").append(html);
            })
         }
      }, 1000);

    })

    $('#must-go').click(function(e){

      if(selectedArea.length){
        $(this).toggleClass( "active" );

        drawControl.remove();
        drawControl = new L.Control.Draw({
          draw: {
            polyline: false,
            polygon: false,
            circle: false,
            marker: true,
            rectangle: false
          }
        });
        map.addControl(drawControl);
      }
    });


    $('#explore').click(function(e){
      if(selectedArea.length && mustGoMarkers.length == 2){
        $(this).toggleClass( "active" );
        $('#place-types').show();
      }

      $("#btn-search-fake").click(function(e){
        if($('#selected_types').val().length){
          $("#btn-place_search_submit").click();
        }
      })
    });



    $("#map-sidebar").on("click", ".btn-place-next", function(e){
      // the place id of the currently cliked card
      var thisPlaceId = this.id.split("-place-next")[0];
      console.log(thisPlaceId)
      // the category id in an array
      var parentCardId = $(this).parent().parent().prop('id').split('-');
      // the category name
      var category = parentCardId[0];

      // All places of the same category as the clicked card per the searchPlaces
      var catPlacesAll =  _.chain(searchPlaces)
         .filter(function(catPlaces){
           return catPlaces.type == category
        })
         .first()
         .value()
         .places;
      console.log(catPlacesAll);

      var catPlaceAllIds = _.pluck(catPlacesAll, "place_id");
      console.log(catPlaceAllIds)

      var thisPlaceIndex = _.indexOf(catPlaceAllIds, thisPlaceId);
      console.log(thisPlaceIndex)

      var nextPlace;
      if(thisPlaceIndex == 9){
        nextPlace = catPlacesAll[0]
      }else{
        nextPlace = catPlacesAll[thisPlaceIndex+1]
      }

      // catPlacesAll[thisPlaceIndex+1]
      console.log(nextPlace)

      // Update card information
      $("#"+thisPlaceId+"-place-img").prop('src', getPlacePhoto(nextPlace.photo_64)).prop('id', nextPlace.place_id+"-place-img")
      $("#"+thisPlaceId+"-place-name").prop('id', nextPlace.place_id+"-place-name").text(nextPlace.name);
      $("#"+thisPlaceId+"-place-rating").prop('id', nextPlace.place_id+"-place-rating").empty().append("<span>" + getPlaceRating(nextPlace.rating) + "</span>");
      $("#"+thisPlaceId+"-place-price-types").prop('id', nextPlace.place_id+"-place-price-types").text(getPlacePrice(nextPlace.price)  + ' • '  + getPlaceHighCat(category));
      $("#"+thisPlaceId+"-place-address").prop('id', nextPlace.place_id+"-place-address").text(getPlaceAddress(nextPlace.address));
      $("#"+thisPlaceId+"-place-next").prop('id', nextPlace.place_id+"-place-next");
      $("#"+thisPlaceId+"-place-add").prop('id', nextPlace.place_id+"-place-add");

    });




    // Add places to explore on the map as markers
    // Also store their place IDs, marker IDs, and locations
    $("#map-sidebar").on("click", ".btn-place-add", function(e){
      // The currently clicked card's place ID, based on HTML
      var placeId = this.id.split("-place-add")[0];
      // The currenly clicked place catgory
      var highCat = $(this).parent().parent().attr('id').split('-')[0];
      console.log(placeId);
      console.log(highCat);

      var higerCat;
      _.each(types, function(thisType){
        var found = false;
        _.each(thisType.cat_second, function(thisLilType){

          if(thisLilType.split(' ')[0].toUpperCase() == highCat.split('_')[0].toUpperCase()){
            console.log(thisLilType.split(' ')[0])
            console.log(highCat.split('_')[0])
            found = true;
          }
        })
        if(found){ higerCat = thisType.cat_first;}
      })

      console.log(higerCat)

      // This clicked place's detailed information
      var selectedPlace = _.chain(searchPlaces)
       .filter(function(catPlace){
         return catPlace.type.toUpperCase() == highCat.toUpperCase();
       })
       .first()
       .value()
       .places
       .filter(function(thisPlace){
         return thisPlace.place_id == placeId;
       });
       console.log(selectedPlace)

      // The marker of this clicked place on the map
      var marker = L.circleMarker([selectedPlace[0].loc_lat, selectedPlace[0].loc_lng],{
        fillColor: getMarkerFillColor(higerCat),
        color: '#d6d6d6',
        weight: 2,
        opacity: 0.8,
        radius: 10,
        fillOpacity: 0.8
      })
      .on('click', function(e){
        // when the marker is cliked, remove it from the map view
        map.removeLayer(e.target);
        // remove from the array that stores markers
        markersExplorePois = _.reject(markersExplorePois, function(savedMarker){ return savedMarker == e.target})
        // remove from the array that stores marker IDs and place IDs
        idExplorePois = _.reject(idExplorePois, function(savedIds){return savedIds.marker == L.stamp(e.target)})
        // update the text fied that contains all places to explore
        $('#place_explore').val(JSON.stringify(idExplorePois));
      })
      .bindPopup(selectedPlace[0].name)
      .on('mouseover', function(e){
        e.target.openPopup();
      })
      .addTo(map);

      // All markers of places to explore
      markersExplorePois.push(marker)
      // All marker IDs, place IDs, and place locations of places to explore
      idExplorePois.push({place: placeId,
                          marker: L.stamp(marker),
                          location: {lat: selectedPlace[0].loc_lat, lon: selectedPlace[0].loc_lng},
                          name: selectedPlace[0].name,
                          address: selectedPlace[0].address,
                          photo_reference: selectedPlace[0].photo_reference,
                          photo_height: selectedPlace[0].photo_height,
                          photo_width: selectedPlace[0].photo_width,
                          type_high: higerCat
                        });
      // Update the text box for all marker IDs, place IDs, and place locations of places to explore
      $('#place_explore').val(JSON.stringify(idExplorePois))


    })

    $('#confirm').click(function(e){
      if(selectedArea.length && mustGoMarkers.length == 2 && idExplorePois.length){
        $(this).toggleClass( "active" );
        $('#place-types').hide();

        $('#btn-explore-fake').show().click(function(e){
          $('#btn-place_explore_submit').click();
        });
      }
    })

  }
});
