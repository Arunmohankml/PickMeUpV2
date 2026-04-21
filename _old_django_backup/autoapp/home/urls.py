from django.contrib import admin
from django.urls import path
from .import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('', views.index, name='home'),
    path('profiles', views.profiles,name='profiles'),
    path('booking', views.booking,name='booking'),
    path('requests', views.requests,name='requests'),
    path('register/<str:role>/', views.register, name='register'),
    path('login', views.user_login,name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='home'), name='logout'),
    path('bookride/', views.bookride,name='bookride'),
    path('getnewrides/', views.get_new_rides,name='getnewrides'),
    
    path('accept_ride/',views.accept_ride, name='accept_ride'),
    path('driver/<int:ride_id>/', views.ride_active, name='ride_active'),#<init:ride_id> means it will give ride_active() tht id as parameter
    path('cancel_ride/',views.cancel_ride, name='cancel_ride'),
    path('c_cancel_ride/',views.c_cancel_ride, name='c_cancel_ride'),
    path('profiles/<str:captain_name>', views.view_profile,name='view_profile'),
    path('edit_profile/', views.edit_profile,name='edit_profile'),
    
    path('client/ride/<int:ride_id>/', views.c_active_client_page, name='c_active_client_page'),
    path('check_ride_status/<int:rideId>/', views.check_ride_status, name='check_ride_status'),
    path('getDistance/', views.getDistance,name='getDistance'),
    path('sendCoords/', views.sendCoords,name='sendCoords'),
]
