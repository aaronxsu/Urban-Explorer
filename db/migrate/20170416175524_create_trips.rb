class CreateTrips < ActiveRecord::Migration[5.0]
  def change
    create_table :trips do |t|
      t.string :user_email
      t.text :place_ids
      t.string :mode
      t.text :feedback

      t.timestamps
    end
  end
end
