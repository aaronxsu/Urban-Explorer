# == Schema Information
#
# Table name: trips
#
#  id          :integer          not null, primary key
#  user_email  :string
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  places      :text
#  start_end   :text
#  visit_order :string
#  cost_time   :float
#  cost_dist   :float
#  cost_score  :integer
#  green_score :integer
#

require 'test_helper'

class TripTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
