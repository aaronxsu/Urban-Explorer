$(document).ready(function(){
  Paloma.start();
});

$(document).on('page:restore', function(){
  Paloma.start();
});

Paloma.controller('Trips', {
  index: function(){

    $('#sidebar-tab-history').parent().prop('class', 'active')

    var trips = this.params.trips;
    // console.log(trips)

  }
})
