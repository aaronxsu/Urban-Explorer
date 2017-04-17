json.extract! trip, :id, :user_email, :place_ids, :mode, :feedback, :created_at, :updated_at
json.url trip_url(trip, format: :json)