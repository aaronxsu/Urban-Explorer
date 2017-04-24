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

    console.log(places)
    console.log(startEnd)
    console.log(routeOrders)
    console.log(costResult)
    console.log(tbtResult)



  }
})
