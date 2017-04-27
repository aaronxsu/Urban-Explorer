# == Route Map
#
#                    Prefix Verb       URI Pattern                          Controller#Action
#                     trips GET        /trips(.:format)                     trips#index
#                           POST       /trips(.:format)                     trips#create
#                  new_trip GET        /trips/new(.:format)                 trips#new
#                 edit_trip GET        /trips/:id/edit(.:format)            trips#edit
#                      trip GET        /trips/:id(.:format)                 trips#show
#                           PATCH      /trips/:id(.:format)                 trips#update
#                           PUT        /trips/:id(.:format)                 trips#update
#                           DELETE     /trips/:id(.:format)                 trips#destroy
#          new_user_session GET        /users/sign_in(.:format)             devise/sessions#new
#              user_session POST       /users/sign_in(.:format)             devise/sessions#create
#      destroy_user_session DELETE     /users/sign_out(.:format)            devise/sessions#destroy
#             user_password POST       /users/password(.:format)            devise/passwords#create
#         new_user_password GET        /users/password/new(.:format)        devise/passwords#new
#        edit_user_password GET        /users/password/edit(.:format)       devise/passwords#edit
#                           PATCH      /users/password(.:format)            devise/passwords#update
#                           PUT        /users/password(.:format)            devise/passwords#update
#  cancel_user_registration GET        /users/cancel(.:format)              devise_invitable/registrations#cancel
#         user_registration POST       /users(.:format)                     devise_invitable/registrations#create
#     new_user_registration GET        /users/sign_up(.:format)             devise_invitable/registrations#new
#    edit_user_registration GET        /users/edit(.:format)                devise_invitable/registrations#edit
#                           PATCH      /users(.:format)                     devise_invitable/registrations#update
#                           PUT        /users(.:format)                     devise_invitable/registrations#update
#                           DELETE     /users(.:format)                     devise_invitable/registrations#destroy
#         user_confirmation POST       /users/confirmation(.:format)        devise/confirmations#create
#     new_user_confirmation GET        /users/confirmation/new(.:format)    devise/confirmations#new
#                           GET        /users/confirmation(.:format)        devise/confirmations#show
#    accept_user_invitation GET        /users/invitation/accept(.:format)   devise/invitations#edit
#    remove_user_invitation GET        /users/invitation/remove(.:format)   devise/invitations#destroy
#           user_invitation POST       /users/invitation(.:format)          devise/invitations#create
#       new_user_invitation GET        /users/invitation/new(.:format)      devise/invitations#new
#                           PATCH      /users/invitation(.:format)          devise/invitations#update
#                           PUT        /users/invitation(.:format)          devise/invitations#update
#         new_admin_session GET        /admin/login(.:format)               active_admin/devise/sessions#new
#             admin_session POST       /admin/login(.:format)               active_admin/devise/sessions#create
#     destroy_admin_session DELETE|GET /admin/logout(.:format)              active_admin/devise/sessions#destroy
#            admin_password POST       /admin/password(.:format)            active_admin/devise/passwords#create
#        new_admin_password GET        /admin/password/new(.:format)        active_admin/devise/passwords#new
#       edit_admin_password GET        /admin/password/edit(.:format)       active_admin/devise/passwords#edit
#                           PATCH      /admin/password(.:format)            active_admin/devise/passwords#update
#                           PUT        /admin/password(.:format)            active_admin/devise/passwords#update
#                admin_root GET        /admin(.:format)                     admin/dashboard#index
# batch_action_admin_admins POST       /admin/admins/batch_action(.:format) admin/admins#batch_action
#              admin_admins GET        /admin/admins(.:format)              admin/admins#index
#                           POST       /admin/admins(.:format)              admin/admins#create
#           new_admin_admin GET        /admin/admins/new(.:format)          admin/admins#new
#          edit_admin_admin GET        /admin/admins/:id/edit(.:format)     admin/admins#edit
#               admin_admin GET        /admin/admins/:id(.:format)          admin/admins#show
#                           PATCH      /admin/admins/:id(.:format)          admin/admins#update
#                           PUT        /admin/admins/:id(.:format)          admin/admins#update
#                           DELETE     /admin/admins/:id(.:format)          admin/admins#destroy
#           admin_dashboard GET        /admin/dashboard(.:format)           admin/dashboard#index
#  batch_action_admin_users POST       /admin/users/batch_action(.:format)  admin/users#batch_action
#               admin_users GET        /admin/users(.:format)               admin/users#index
#                           POST       /admin/users(.:format)               admin/users#create
#            new_admin_user GET        /admin/users/new(.:format)           admin/users#new
#           edit_admin_user GET        /admin/users/:id/edit(.:format)      admin/users#edit
#                admin_user GET        /admin/users/:id(.:format)           admin/users#show
#                           PATCH      /admin/users/:id(.:format)           admin/users#update
#                           PUT        /admin/users/:id(.:format)           admin/users#update
#                           DELETE     /admin/users/:id(.:format)           admin/users#destroy
#            admin_comments GET        /admin/comments(.:format)            admin/comments#index
#                           POST       /admin/comments(.:format)            admin/comments#create
#             admin_comment GET        /admin/comments/:id(.:format)        admin/comments#show
#                           DELETE     /admin/comments/:id(.:format)        admin/comments#destroy
#                      root GET        /                                    home#index
#                           GET        /trips(.:format)                     trips#index
#                           POST       /trips(.:format)                     trips#create
#                           GET        /trips/new(.:format)                 trips#new
#                           GET        /trips/:id/edit(.:format)            trips#edit
#                           GET        /trips/:id(.:format)                 trips#show
#                           PATCH      /trips/:id(.:format)                 trips#update
#                           PUT        /trips/:id(.:format)                 trips#update
#                           DELETE     /trips/:id(.:format)                 trips#destroy
#    trips_new_place_search GET        /trips/new/place_search(.:format)    trips#place_search
#         trips_new_explore GET        /trips/new/explore(.:format)         trips#explore
#

Rails.application.routes.draw do

  resources :trips
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  devise_for :users
  devise_for :admins, ActiveAdmin::Devise.config

  # below code to fix the active admin issue when table not exists in database as activeadmin tries to load every model.
  # for reference https://github.com/activeadmin/activeadmin/issues/783
  begin
    ActiveAdmin.routes(self)
  rescue Exception => e
    puts "ActiveAdmin: #{e.class}: #{e}"
  end
  root to: "home#index"

  resources :trips

  get 'trips/new/place_search', to: 'trips#place_search'

  get 'trips/new/explore', to: 'trips#explore'

end
