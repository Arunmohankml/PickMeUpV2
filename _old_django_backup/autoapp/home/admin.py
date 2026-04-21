from django.contrib import admin

# Register your models here.
from .models import Profiles, RideRequest

admin.site.register(Profiles)


from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

admin.site.register(CustomUser, UserAdmin)
admin.site.register(RideRequest)
