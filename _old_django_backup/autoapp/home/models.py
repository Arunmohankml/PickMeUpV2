from django.db import models
from django.conf import settings 
from django.contrib.auth.models import AbstractUser
class Profiles(models.Model):
    captain_name = models.CharField(max_length=16, default="Captain")
    captain_auto = models.TextField(default="normal", max_length=20)
    captain_bio = models.TextField(default="No bio available", max_length=100)
    captain_stand = models.CharField(max_length=100, default="No Stand")  # ← Give max_length
    captain_image = models.FileField(upload_to='captains/',default='default.jpg')  # Or set `blank=True`
    captain_number= models.CharField(max_length=15, default="00000000000000")
    captain_level = models.CharField(max_length=15, default="Beginner")
    captain_rating = models.FloatField(default=0.0)
    rides_count = models.IntegerField(default=0)
    created_date = models.CharField(max_length=15, default="0/0/2025")
    captain_aadhar = models.CharField(max_length=40, default="0000000000")
    captain_verified = models.BooleanField(default=False)
    
    
    def __str__(self):
        return self.captain_name
        
class CustomUser(AbstractUser):
  choose_role=(
    ('user', 'User'),
    ('driver', 'driver'),
  )
  role=models.CharField(choices=choose_role, default="user",max_length=15)
    
class RideRequest(models.Model):
  client_name=models.CharField(max_length=20)
  client_number=models.CharField(max_length=15, default="Not given")
  client_stand = models.CharField(max_length=100, default="ppm") 
  # selected stand
  pickup_coords = models.CharField(max_length=100) # pickup location
  drop_coords = models.CharField(max_length=100)   
  ride_distance = models.CharField(default="nil",max_length=15) 
  ride_fare = models.CharField(default="nil",max_length=15) 
  timestamp = models.DateTimeField(auto_now_add=True)  # when request was made
  accepted_by = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    null=True, blank=True,
    on_delete=models.SET_NULL,
    related_name='accepted_rides')
  is_active = models.BooleanField(default=False)
  
  def __str__(self):
    return f"{self.client_name} - {self.client_stand}"
  
  
# models.py

