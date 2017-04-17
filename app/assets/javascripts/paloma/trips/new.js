
Paloma.controller('Trips', {
  new: function(){

    // var initialize = _.once(function(){location.reload()});
    // initialize()
    // if (window.location.href.indexOf('reload')==-1) {
    //          window.location.replace(window.location.href+'?reload');
    //     }

    var types = this.params.types;

    var map = L.map('map', {
      center: [39.952, -75.1652],
      zoom: 11
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

    var myGraphics = [];

    map.on('draw:created', function (e) {
      var type = e.layerType; // The type of shape
      var layer = e.layer; // The Leaflet layer for the shape
      var id = L.stamp(layer); // The unique Leaflet ID for the layer

      console.log(type)

      if(myGraphics[0]){
        map.removeLayer(myGraphics[0])
      }
      myGraphics.push(layer);

      map.addLayer(layer);

      var latitude = layer.getBounds().getCenter().lat;
      var longitude = layer.getBounds().getCenter().lng;
      console.log(latitude, longitude)
      var box = turf.bbox(layer.toGeoJSON())
      var sqaure = turf.square(box);
      var poly = turf.bboxPolygon(sqaure);
      var radius = (turf.lineDistance(poly, 'kilometers')/4)*1000;
      console.log(radius)

      $('#latitude').val(latitude);
      $('#longitude').val(longitude);
      $('#distance').val(radius);

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
            var html = "&ensp;&ensp;"+cat + "<input type='checkbox' data-size='mini' name='my-checkbox' unchecked id='" + newCat + "' class='cat_second'><br>"
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

      var checkExist = setInterval(function() {
         if ($('#place-search-result').text().length) {
            console.log("Exists!");
            clearInterval(checkExist);
            var searchPlaces =  _.map(JSON.parse($('#place-search-result').text()), function(obj){return JSON.parse(obj)});
            console.log(searchPlaces)
         }
      }, 1000);

    })


  }
});
