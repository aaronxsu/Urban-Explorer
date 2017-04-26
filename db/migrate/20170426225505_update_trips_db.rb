class UpdateTripsDb < ActiveRecord::Migration[5.0]
  def change
    remove_column :trips, :place_ids, :text
    remove_column :trips, :mode, :string
    remove_column :trips, :feedback, :text

    add_column :trips, :places, :text
    add_column :trips, :start_end, :text
    add_column :trips, :visit_order, :string
    add_column :trips, :cost_time, :float
    add_column :trips, :cost_dist, :float
    add_column :trips, :cost_score, :integer
    add_column :trips, :green_score, :integer
  end
end
