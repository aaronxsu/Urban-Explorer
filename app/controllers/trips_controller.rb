# require 'csv'
# require 'orderedhash'
# require 'csv2json'
require 'open-uri'
require 'uri'
require 'net/http'
require 'json'
require "base64"

class TripsController < InheritedResources::Base
  before_action :authenticate_user!

  def index
    @trips = Trip.all
  end

  def show
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
  end

  def edit
  end

  def update
  end

  def destroy
  end

  def place_search
    @latitude = params[:latitude].to_f
    @longitude = params[:longitude].to_f
    @distance = params[:distance].to_f >= 5000 ? (5000) : (params[:distance].to_f)

    @selected_types = params[:selected_types].split(',')

    @radar_result = Array.new
    @detail_result = Array.new

    api_key = 'AIzaSyCxenfqNTnUG8_wI3G7lH2wSmDWsLmdWqA'
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
              @photo_base64 = Base64.encode64(f.read)
            end # end of open uri
          else
            @photo_base64 = 0
          end # end of if

          this_type_of_places.push({
            :place_id => each_place['place_id'],
            :name => each_place['name'],
            :loc_lat => location(each_place, 'lat'),
            :loc_lng => location(each_place, 'lng'),
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

    # an array of two hashes: the first being the start and the second being the end -> {lat: ..., lng: ... }
    @start_end = JSON.parse(params[:start_end])
    @start_location = [@start_end.first]
    @end_location = [@start_end.last]

    # an array of hashes: all the places to go through
    # each place has: place ID from Google, marker ID from leaflet, location in the form of [lat, lng], place name, place address
    @place_explore = JSON.parse(params[:place_explore])
    @place_locations = @place_explore.map {|this_place| this_place['location'] }

    # start point ... a lot other places ... end point
    @start_place_end_locations = @start_location + @place_locations + @end_location

    # calculate the time-distance matrix with Mapzen API
    tdm_base_uri = 'https://matrix.mapzen.com/many_to_many?'
    json = JSON.generate({ locations: @start_place_end_locations, costing: "pedestrian" })
    id = "ManyToMany_StartPlacesEnd"
    units = "miles"
    mapzen_key = 'mapzen-qJmfq5U'
    tdm_uri = tdm_base_uri + "json=" + json + "&id=" + id + "&units" + units + "&api_key" + mapzen_key
    open(tdm_uri) do |f|
      @tdm_result_json = JSON.parse(f.read)
    end

    # generates a list of possible route indexes
    @range = [*1..@place_locations.length]
    @range_opermutations = @range.permutation.to_a.map {|thisIndex| [0] + thisIndex + [@place_locations.length+1]}


    @tdm_result_json_flat = @tdm_result_json["many_to_many"].flatten(1)
    @cost_result = Array.new
    @range_opermutations.each do |route_order|
      #for each order of routes
      time_acc = 0
      distance_acc = 0.0

      [*0..route_order.length-2].each do |index|
        index_from = route_order[index] #from this point
        index_to = route_order[index + 1] #to the next point
        # @cost_result.push([index_from, index_to])

        # pick out such from-to route
        route_tdm_result = @tdm_result_json_flat.select do |tdm|
          tdm["from_index"] == index_from && tdm["to_index"] == index_to
        end #end of select

        # @cost_result.push(route_tdm_result)

        time_acc += route_tdm_result[0]['time']
        distance_acc += route_tdm_result[0]["distance"]
      end # end of this ordered route

      @cost_result.push({
        :ordered_route_index => route_order,
        :cost_time => time_acc,
        :cost_dist => distance_acc
      })

      @cost_result.sort_by! {|result| result[:cost_time]}

      @place_explore.each_index {|i| @place_explore[i]['index'] = i + 1}

      js :costResult => @cost_result, :places => @place_explore, :startEnd => @start_end, :routeOrders => @range_opermutations

    end # end of range permutation loop



  end # end of explore action


  private

    def location(data, cor)
      if data['geometry'] # if the geometry is not empty
        if data['geometry']['location'] # if the location is not empty
          return data['geometry']['location'][cor]
        else
          return nil
        end
      end
    end

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
      params.require(:trip).permit(:user_email, :place_ids, :mode, :feedback)
    end
end
