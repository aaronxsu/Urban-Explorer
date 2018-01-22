require 'open-uri'
require 'uri'
require 'net/http'
require 'json'
require 'base64'

class TripsController < InheritedResources::Base
  before_action :authenticate_user!

  def index
    @trips = Trip.where(user_email: current_user.email).reorder('id').reverse_order
    @trips_array = Array.new()
    api_key = ENV['GOOGLE_MAPS_WEB_SERVICES_KEY_UE']

    @trips.each do |eachTrip|
      @trips_array.push({
        :cost_dist => eachTrip['cost_dist'],
        :cost_score => eachTrip['cost_score'],
        :cost_time => eachTrip['cost_time'],
        :created_at => eachTrip['created_at'],
        :green_score => eachTrip['green_score'],
        :id => eachTrip['id'],
        :places => JSON.parse(eachTrip['places']),
        :start_end => JSON.parse(eachTrip['start_end']),
        :user_email => eachTrip['user_email'],
        :visit_order => eachTrip['visit_order']
      })
    end #end of turning the query result into array

    @trips_index_group1 = Array.new
    @trips_index_group2 = Array.new
    @trips_index_group3 = Array.new

    @trips_array.each_with_index do |trip, index|
      #----------------------------------------------------
      #
      # Get the date of the trip
      #
      #----------------------------------------------------
      trip[:date_created] = trip[:created_at].to_s.split(" ")[0]
      #----------------------------------------------------
      #
      # Put the places into the vist order
      #
      #----------------------------------------------------
      #turn the stirng of place orders to an array
      trip[:visit_order_array] = trip[:visit_order].split(//)
      #put the places into the vist order
      trip[:places_ordered] = trip[:visit_order_array].map {|order_index| trip[:places].select { |place| place['index'].to_s === order_index }}.flatten
      #----------------------------------------------------
      #
      # get the first place's photo and store its base64
      #
      #----------------------------------------------------
      #a string to store the photo's base64 code
      place_photo = String.new
      first_place = trip[:places_ordered][0]

      #call the place detail API
      open("https://maps.googleapis.com/maps/api/place/details/json?key=" + api_key + "&placeid=" + first_place['id']) do |f|
        #get the photos from the place detail API call
        photos = JSON.parse(f.read)["result"]["photos"]

        # if there are photos
        if photos.length then
          #the height of the photo
          height = photos[0]["height"]
          #the reference of the photo
          reference = photos[0]["photo_reference"]
          #call the place photo API to get the photo
          open("https://maps.googleapis.com/maps/api/place/photo?key=" + api_key + "&photoreference=" + reference + "&maxheight=" + height.to_s) do |t|
            place_photo = "data:image/jpeg;base64," + Base64.encode64(t.read)
          end #end of calling photo API
        else
          place_photo = "0"
        end #end of if there are photos

        first_place[:photo_base64] = place_photo
      end #end of calling  the place detail API
      #----------------------------------------------------
      #
      # put this trip into the right bucket based on index
      #
      #----------------------------------------------------
      index_plus_one = index + 1
      if(index_plus_one == 1) then
        @trips_index_group1.push(trip)
      elsif (index_plus_one == 2) then
        @trips_index_group2.push(trip)
      elsif (index_plus_one == 3) then
        @trips_index_group3.push(trip)
      else
        remainder = index_plus_one % 3
        if(remainder == 1) then
          @trips_index_group1.push(trip)
        elsif (remainder == 2) then
          @trips_index_group2.push(trip)
        elsif (remainder == 0) then
          @trips_index_group3.push(trip)
        end #enf of evaluating the remainder
      end #end of evaluating the index_plus_one

    end #end of @trips_array loop

    # js :trips => @trips
  end

  def show
    #----------------------------------------------------
    #
    # Find this trip based on id
    #
    #----------------------------------------------------
    @trip = Trip.find(params[:id])
    #----------------------------------------------------
    #
    # Turn the query result to array
    #
    #----------------------------------------------------
    @trip_hash = Hash.new
    @trip_hash = {
      :cost_dist => @trip['cost_dist'],
      :cost_score => @trip['cost_score'],
      :cost_time => @trip['cost_time'],
      :created_at => @trip['created_at'],
      :green_score => @trip['green_score'],
      :id => @trip['id'],
      :places => JSON.parse(@trip['places']),
      :start_end => JSON.parse(@trip['start_end']),
      :user_email => @trip['user_email'],
      :visit_order => @trip['visit_order']
    }
    #----------------------------------------------------
    #
    # Put the places into the vist order
    #
    #----------------------------------------------------
    #turn the stirng of place orders to an array
    @trip_hash[:visit_order_array] = @trip_hash[:visit_order].split(//)
    #put the places into the vist order
    @trip_hash[:places_ordered] = @trip_hash[:visit_order_array].map {|order_index| @trip_hash[:places].select { |place| place['index'].to_s === order_index }}.flatten
    #----------------------------------------------------
    #
    # Get the turn by turn result
    #
    #----------------------------------------------------
    mapzen_key = ENV['MAPZEN_KEY_UE']
    @trip_places = @trip_hash[:places_ordered].map {|place| place.values_at("geo")}.flatten
    @tbt_json = {
      :locations => [@trip_hash[:start_end][0]] + @trip_places + [@trip_hash[:start_end][1]],
      :costing => "pedestrian",
      :directions_options => {:units => "miles"}
    }
    @tbt_result = Hash.new
    open("https://valhalla.mapzen.com/route?json=" + JSON.generate(@tbt_json) + "&api_key=" + mapzen_key) do |f|
      @tbt_result = JSON.parse(f.read)
    end
    #----------------------------------------------------
    #
    # Get the photos of these places
    #
    #----------------------------------------------------
    api_key = ENV['GOOGLE_MAPS_WEB_SERVICES_KEY_UE']
    @trip_hash[:places_ordered].each do |place|
      #a string to store the photo's base64 code
      place_photo = String.new

      #call the place detail API
      open("https://maps.googleapis.com/maps/api/place/details/json?key=" + api_key + "&placeid=" + place['id']) do |f|
        #get the photos from the place detail API call
        photos = JSON.parse(f.read)["result"]["photos"]

        # if there are photos
        if photos.length then
          #the height of the photo
          height = photos[0]["height"]
          #the reference of the photo
          reference = photos[0]["photo_reference"]

          #call the place photo API to get the photo
          open("https://maps.googleapis.com/maps/api/place/photo?key=" + api_key + "&photoreference=" + reference + "&maxheight=" + height.to_s) do |t|
            place_photo = "data:image/jpeg;base64," + Base64.encode64(t.read)
          end #end of calling photo API

        else
          place_photo = "0"
        end #end of if there are photos
        place[:photo_base64] = place_photo
      end #end of calling  the place detail API

    end #end of @trip_hash[:places_ordered] loop



    js :trip => @trip_hash, :tbt_result => @tbt_result
  end

  def new
    @trip = Trip.new

    @types = [{
      :cat_first => 'Stores',
      :cat_second => ['Clothing Store', 'Department Store', 'Jewelry Store', 'Shopping Mall', 'Store']
    },{
      :cat_first => 'Foods',
      :cat_second => ['Bakery', 'Cafe', 'Restaurant']
    },{
      :cat_first => 'Religions',
      :cat_second => ['Church', 'Hindu', 'Temple', 'Mosque', 'Synagogue']
    },{
      :cat_first => 'Bars',
      :cat_second => ['Bar', 'Night Club',]
    },{
      :cat_first => 'Arts',
      :cat_second => ['Art Gallery', 'Museum', 'Movie Theater']
    },{
      :cat_first => 'Parks',
      :cat_second => ['Amusement Park', 'Park']
    },{
      :cat_first => 'Others',
      :cat_second => ['Casino', 'Library', 'Spa', 'Bowling Alley', 'Stadium']
    }]

    respond_to do |format|
      format.html
      format.json
    end

    #the paloma gem uses this to pass variables from contoller to javascript
    js :types => @types
  end

  def create
    @trip = Trip.new(trip_params)

    if @trip.save
      redirect_to action: "index"
    else
      render "new"
    end

  end

  def place_search
    @latitude = params[:latitude].to_f
    @longitude = params[:longitude].to_f
    @distance = params[:distance].to_f >= 5000 ? (5000) : (params[:distance].to_f)

    @selected_types = params[:selected_types].split(',')

    @radar_result = Array.new
    @detail_result = Array.new

    api_key = ENV['GOOGLE_MAPS_WEB_SERVICES_KEY_UE']
    nearby_base_uri = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?"
    radar_base_uri = "https://maps.googleapis.com/maps/api/place/radarsearch/json?"
    detail_base_uri = "https://maps.googleapis.com/maps/api/place/details/json?"
    # render js: "alert('The latitude is: #{params[:latitude]}')"

    @selected_types.each do |place_type|
      location = "location=" + @latitude.to_s + "," + @longitude.to_s
      radius = 'radius=' + @distance.to_s
      type = 'type=' + place_type.downcase!
      key = 'key=' + api_key
      nearby_uri = nearby_base_uri + location + "&" + type + "&" + key + "&" + radius
      this_type_of_places = Array.new

      open(nearby_uri) do |f|
        nearby_result_json = JSON.parse(f.read)
        nearby_result_array = nearby_result_json['results'].first(10)

        nearby_result_array.each do |each_place|
          if photo(each_place, 'photo_reference')

            photo_search_uri = "https://maps.googleapis.com/maps/api/place/photo?"+ key + "&photoreference=" + photo(each_place, 'photo_reference') + "&maxheight=" + photo(each_place, 'height').to_s

            open(photo_search_uri) do |f|
              @photo_base64 = "data:image/jpeg;base64," + Base64.encode64(f.read)
            end # end of open uri
          else
            @photo_base64 = 0
          end # end of if

          if each_place['geometry'] # if the geometry is not empty
            if each_place['geometry']['location'] # if the location is not empty
              @location_latitude = each_place['geometry']['location']['lat']
            else
              @location_latitude = nil
            end
          end

          if each_place['geometry'] # if the geometry is not empty
            if each_place['geometry']['location'] # if the location is not empty
              @location_longitude = each_place['geometry']['location']['lng']
            else
              @location_longitude = nil
            end
          end
          
          this_type_of_places.push({
            :place_id => each_place['place_id'],
            :name => each_place['name'],
            :loc_lat => @location_latitude,
            :loc_lng => @location_longitude,
            :types => each_place['types'],
            :icon => each_place['icon'],
            :photo_reference => photo(each_place, 'photo_reference'),
            :photo_height => photo(each_place, 'height'),
            :photo_width => photo(each_place, 'width'),
            :photo_attr => photo(each_place, 'html_attributions'),
            :photo_64 => @photo_base64.to_s,
            :price => each_place['price_level'],
            :rating => each_place['rating'] == nil ? 0 : each_place['rating'],
            :address => each_place['vicinity']
          })
        end # end of nearby_result_array loop

        this_type_of_places.sort_by! { |obj| obj[:rating]}
        this_type_of_places = this_type_of_places.reverse
      end # end of open uri

      @detail_result.push({
        :type => place_type,
        :places => this_type_of_places
      }.to_json)

    end #end of @selected_types loop

  end #end of place_search action

  def explore
    # a new trip storing user selected info
    @trip = Trip.new

    # an array of two hashes: the first being the start and the second being the end -> [{lat: , lng: }, {lat: , lng: }]
    @start_end = JSON.parse(params[:start_end])

    @start_end_ad = getStartEndAddress(@start_end)

    # an array of hashes: all the places to go through
    # each place has: place ID from Google, marker ID from leaflet, location in the form of [lat, lng], place name, place address
    @place_explore = JSON.parse(params[:place_explore]).each.with_index {|ele, idx| ele[:index] = idx + 1}

    place_locations = @place_explore.map {|place| place['location']}

    range_permutations = [*1..place_locations.length].permutation.to_a.map {|thisIndex| [0] + thisIndex + [place_locations.length + 1]}

    @cost_result = get_tdm(@start_end, place_locations, range_permutations)

    @range_permutations_with_index = range_permutations.map.with_index {|ele, idx| {:index => idx + 1, :order => ele}}

    @tbt_result = get_tbt(@start_end, @range_permutations_with_index, place_locations)

    @place_explore.each do |each_place|
      if each_place["photo_reference"] then
        open(
          "https://maps.googleapis.com/maps/api/place/photo?key=" + ENV['GOOGLE_MAPS_WEB_SERVICES_KEY_UE'] +
          "&photoreference=" + each_place["photo_reference"] + "&maxheight=" + each_place["photo_height"].to_s
        ) do |f|
          each_place["photo_base64"] = "data:image/jpeg;base64," + Base64.encode64(f.read)
        end # end of photo search open uri
      else
        each_place["photo_base64"] = '0'
      end # end of if there is photo reference
    end # end of places loop

    js :costResult => @cost_result, :places => @place_explore, :startEnd => @start_end, :startEndAd => @start_end_ad,
       :routeOrders => @range_permutations_with_index, :tbtResult => @tbt_result
  end # end of explore action


  private

    def photo(data, key)
      if data['photos']
        if key == 'html_attributions'
          return data['photos'][0][key][0]
        else
          return data['photos'][0][key]
        end
      end
    end

    def trip_params
      params.require(:trip).permit(:user_email, :places, :start_end, :visit_order, :cost_time, :cost_dist, :cost_score, :green_score)
    end

    def get_tdm(start_end, place_locations, range_permutations)
      cost_result = Array.new
      # in the form of: 41.43206,-81.38992|-33.86748,151.20699....
      start_place_end_locations = (
        [start_end.first] + place_locations + [start_end.last]
      ).map {|place|
        place['lat'].to_s + ',' + place['lon'].to_s
      }.join('|')

      # the http request uri for td matrix using google maps service
      tdm_base_uri = 'https://maps.googleapis.com/maps/api/distancematrix/json?'
      tdm_uri = tdm_base_uri +
        'origins=' + start_place_end_locations +
        '&destinations=' + start_place_end_locations +
        '&mode=walking' +
        '&units=imperial' +
        '&key=' + ENV['GOOGLE_MAPS_WEB_SERVICES_KEY_UE']

      open(tdm_uri) do |f|
        tdm_result_json = JSON.parse(f.read)
        range_permutations.each do |route_order|
          time_acc = 0.0
          distance_acc = 0.0

          place_idx = route_order.slice(1..route_order.length-2).map {|i| [i] * 2}.flatten
          row_col = ([route_order[0]] + place_idx + [route_order[route_order.length - 1]]).each_slice(2).to_a

          row_col.each do |pair|
            td = tdm_result_json['rows'][pair[0]]['elements'][pair[1]]
            time_acc += td['duration']['value']
            distance_acc += td['distance']['value']
          end # end of this ordered route

          cost_result.push({
            :ordered_route_index => route_order,
            :cost_time => time_acc, # in seconds
            :cost_dist => distance_acc # in meters
          }).sort_by! {|result| result[:cost_time]}
          .reverse!
          .map.with_index {|ele, idx| ele[:cost_score] = idx + 1}
        end # end of range permutation loop
      end

      cost_result.reverse!
    end

    def get_tbt(start_end, range_permutations, place_locations)
      range_permutations.map do |order|
        open(
          'https://maps.googleapis.com/maps/api/directions/json?' +
          'origin=' + start_end[0]['lat'].to_s + ',' + start_end[0]['lon'].to_s +
          '&destination=' + start_end[1]['lat'].to_s + ',' + start_end[1]['lon'].to_s +
          '&waypoints=' + order[:order].slice(1...-1).map {|idx| place_locations[idx - 1]['lat'].to_s + ','+place_locations[idx - 1]['lon'].to_s}.join('|') +
          '&mode=walking' +
          '&units=imperial' +
          '&key=' + ENV['GOOGLE_MAPS_WEB_SERVICES_KEY_UE']
        ) do |f|
          res = JSON.parse(f.read)
          res[:id] = order[:index]
          res
        end
      end
    end

    def getStartEndAddress(start_end)
      start_end.map do |point|
        open('https://maps.googleapis.com/maps/api/geocode/json?latlng=' + point['lat'].to_s + ',' + point['lon'].to_s + '&key=' + ENV['GOOGLE_MAPS_WEB_SERVICES_KEY_UE']) do |f|
          JSON.parse(f.read)['results'][0]['formatted_address']
        end
      end

    end

end
