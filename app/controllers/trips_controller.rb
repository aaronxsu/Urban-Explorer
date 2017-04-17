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
      :cat_first => 'Store',
      :cat_second => ['Clothing Store', 'Department Store', 'Jewelry Store', 'Shopping Mall', 'Store']
    },{
      :cat_first => 'Food',
      :cat_second => ['Bakery', 'Café', 'Restaurant']
    },{
      :cat_first => 'Religion',
      :cat_second => ['Church', 'Hindu', 'Temple', 'Mosque', 'Synagogue']
    },{
      :cat_first => 'Bar',
      :cat_second => ['Bar', 'Night Club',]
    },{
      :cat_first => 'Art',
      :cat_second => ['Art Gallery', 'Museum', 'Movie Theater']
    },{
      :cat_first => 'Park',
      :cat_second => ['Amusement Park', 'Park']
    },{
      :cat_first => 'Other',
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
    @latitude = params[:latitude]
    @longitude = params[:longitude]
    @distance = params[:distance]
    @selected_types = params[:selected_types]
    # render js: "alert('The latitude is: #{params[:latitude]}')"
  end


  private

    def trip_params
      params.require(:trip).permit(:user_email, :place_ids, :mode, :feedback)
    end
end
