from django.shortcuts import render, redirect
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponseForbidden
from django.contrib.auth.decorators import login_required

from django.views.decorators.http import require_POST
from django.shortcuts import get_object_or_404

from .forms import CustomUserCreationForm
from .models import Profiles, RideRequest


# ------------------- Homepage -------------------
allStands = [
  "anchamile",
  "pookkottumpadam",
  "wandoor",
  ]

def index(request):
    user_role = None
    logged = False
    verified = False

    if request.user.is_authenticated:
        logged = True
        user_role = request.user.role

        if user_role == 'driver':
            profile = get_object_or_404(Profiles, captain_name=request.user.username)  
            if profile.captain_verified:
                verified = True
      
    context = {
        'role': user_role,
        'logged': logged,
        'username': request.user.username if logged else None,
        'verified':verified,
    }
    return render(request, 'index.html', context)


# ------------------- Booking Page -------------------

def booking(request):
    user = request.user
    user_ride = None

    if user.is_authenticated:
        user_ride = RideRequest.objects.filter(client_name=user.username).order_by('-timestamp').first()

    if user_ride and user_ride.is_active and user_ride.accepted_by:
        profile = get_object_or_404(Profiles, captain_name=user_ride.accepted_by.username)
        return render(request, 'c_rideActive.html', {
            'ride': user_ride,
            'profile': profile
        })

    return render(request, 'bookingPage.html', {
        'ride': user_ride
    })

# ------------------- Profile List -------------------
def profiles(request):
    selected_stand = request.GET.get("stand")
    nearby_captains = Profiles.objects.all()

    if selected_stand:
        nearby_captains = nearby_captains.filter(captain_stand=selected_stand)

    return render(request, 'profiles.html', {'profile': nearby_captains})


# ------------------- Register View -------------------
def register(request, role):  
    if request.method == 'POST':  
        form = CustomUserCreationForm(request.POST)  
        if form.is_valid():  
            user = form.save(commit=False)  
            user.role = role  # Assign role from URL  
            user.save()  
            login(request, user)  
  
            if user.role == "driver":  
                Profiles.objects.create(  
                    captain_name=user.username  # since captain_name is a CharField  
                )  
                return redirect('view_profile', captain_name=user.username)#view_profile is the name of url   
  
            return redirect('home')  
  
    form = CustomUserCreationForm()  
    return render(request, 'registerPage.html', {'form': form, 'role': role.capitalize()}) 

def view_profile(request, captain_name):  
    profile = get_object_or_404(Profiles, captain_name=captain_name)  
    return render(request, 'profileDetails.html', {
        'profile': profile,
        'username': request.user.username  # ← add this line
    })
        
        
# ------------------- Login View -------------------
def user_login(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('home')
        else:
            print(form.errors)  # Debug only

    form = AuthenticationForm()
    return render(request, 'loginPage.html', {'form': form})


# ------------------- Book Ride (User → Database) -------------------
@csrf_exempt
def bookride(request):
    if request.method == 'POST':
        data = request.POST

        # Save to DB
        RideRequest.objects.create(
            client_name=data.get('full_name'),
            client_number=data.get('ph_num'),
            client_stand=data.get('stand'),
            pickup_coords=data.get('pickup'),
            drop_coords=data.get('drop'),
            ride_distance=data.get('distance'),
            ride_fare=data.get('fare')
        )

        return JsonResponse({'status': 'ok'})
    
    return JsonResponse({'error': 'Only POST allowed'}, status=400)


# ------------------- Driver Receives New Rides -------------------
def get_new_rides(request):
    rides=RideRequest.objects.filter(is_active=False)
    return JsonResponse({
        'rides': [
            {
                'id': r.id,
                'full_name': r.client_name,
                'ph_number': r.client_number,
                'pickup': r.pickup_coords,
                'drop': r.drop_coords,
                'stand': r.client_stand,
                'distance': r.ride_distance,
                'fare': r.ride_fare,
                'time': r.timestamp
            } for r in rides
        ]
    })




@login_required(login_url='/register')
def requests(request):
  if(request.user.role!="driver"):
    return HttpResponseForbidden("You are not even a driver")
  
  accepted_ride=RideRequest.objects.filter(accepted_by=request.user,is_active=True).first()
  
  if accepted_ride:
    return render(request, 'rideActive.html', {'ride': accepted_ride})
  return render(request, 'requestsPage.html')
    
    
@require_POST
def accept_ride(request):
    ride_id = request.POST.get('ride_id')  # get ride ID from form/JS
    
    
    #if driver not loggedin or not driver
    if not request.user.is_authenticated or request.user.role != 'driver':
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    ride = get_object_or_404(RideRequest, id=ride_id)  # model's id is same as ride_id frm js
    #now ride is an instance with a particular id
    
    
    
    # Set this ride as accepted by this driver
    ride.accepted_by = request.user
    ride.is_active = True
    ride.save()

    return JsonResponse({
    'status': 'accepted',
    'redirect_url': f'/driver/{ride.id}/'
    })
    #redirect driver to activeride page
    
@login_required(login_url='/register')
def ride_active(request, ride_id):
    ride = get_object_or_404(RideRequest, id=ride_id)
    
    if(request.user.role != 'driver'):
        return JsonResponse({'error': 'Only drivers have access to this page'}, status=403)
    
    
    if ride.accepted_by == request.user:
        return render(request, 'rideActive.html', {'ride': ride})
    else:
        return HttpResponseForbidden("You are not allowed to view this ride.")
        
        
import json

@csrf_exempt
@login_required(login_url='/register')
def cancel_ride(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            ride_id = data.get('ride_id')
            reason = data.get('reason')
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        ride = get_object_or_404(RideRequest, id=ride_id)

        if request.user.role != 'driver':
            return HttpResponseForbidden("Only drivers have access to this page.")

        if ride.accepted_by == request.user:
            
            if reason == "reached":
              profile = get_object_or_404(Profiles, captain_name=request.user.username)
              profile.rides_count+=1
              profile.save()
            ride.delete()
            return JsonResponse({'status': 'cancelled'})
        else:
            return HttpResponseForbidden("You are not allowed to cancel this ride.")

    return JsonResponse({'error': 'Only POST allowed'}, status=400)
    
@csrf_exempt
@login_required(login_url='/register')
def c_cancel_ride(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            ride_id = data.get('ride_id')
            reason = data.get('reason')
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        ride = get_object_or_404(RideRequest, id=ride_id)

        
        if ride.client_name == request.user:
            ride.delete()
            return JsonResponse({'status': 'cancelled'})
        else:
            return HttpResponseForbidden("You are not allowed to cancel this ride.")

    return JsonResponse({'error': 'Only POST allowed'}, status=400)
   
 
@login_required
def edit_profile(request):
    profile = get_object_or_404(Profiles, captain_name=request.user.username)

    if request.method == 'POST':
        captain_number = request.POST.get('captain_number')
        captain_auto = request.POST.get('captain_auto')
        captain_stand = request.POST.get('captain_stand')
        captain_bio = request.POST.get('captain_bio')
        captain_aadhar = request.POST.get('captain_aadhar')

        # Update only if non-empty
        if captain_number:
            profile.captain_number = captain_number
        if captain_auto:
            profile.captain_auto = captain_auto
        if captain_stand:
            profile.captain_stand = captain_stand
        if captain_bio:
            profile.captain_bio = captain_bio
        if captain_aadhar:
            profile.captain_aadhar = captain_aadhar

        if 'captain_image' in request.FILES:
            profile.captain_image = request.FILES['captain_image']
        profile.captain_verified = True
        profile.save()
        return redirect('view_profile', captain_name=profile.captain_name)
        
    context= {
      'profile': profile,
      'stands':allStands
    }
    return render(request, 'editProfile.html',context)
    
from django.views.decorators.http import require_GET

@require_GET
@login_required
def check_ride_status(request, rideId):
    try:
        ride = RideRequest.objects.get(id=rideId)
    except RideRequest.DoesNotExist:
        return JsonResponse({'status': 'not_found'})

    if ride.is_active and ride.accepted_by:
        return JsonResponse({
            'status': 'accepted',
            'redirect_url': f'/client/ride/{ride.id}/'
        })
    
    return JsonResponse({'status': 'waiting'})
        
@login_required
def c_active_client_page(request, ride_id):
    ride = get_object_or_404(RideRequest, id=ride_id)

    if ride.client_name != request.user.username:
        return HttpResponseForbidden("You're not the rider for this trip.")

    profile = get_object_or_404(Profiles, captain_name=ride.accepted_by.username)

    return render(request, 'c_rideActive.html', {
        'ride': ride,
        'profile': profile
    })
    
    
    
    
@csrf_exempt
def sendCoords(request):
    print("sended")
    if request.method == 'POST':
        data = json.loads(request.body)
        ride_id = data.get('ride_id')
        d_pos = data.get('d_pos')  # should be a list [lat, lon]

        ride = get_object_or_404(RideRequest, id=ride_id)
        ride.ride_distance = str(d_pos)  # Store as string or JSONField
        ride.save()

        return JsonResponse({'status': 'success'})
    return JsonResponse({'error': 'Invalid method'}, status=405)


def getDistance(request):
    print("hu")
    ride=get_object_or_404(RideRequest, client_name=request.user.username);
    d_pos=ride.ride_distance;
    JsonResponse({
      'd_pos':d_pos,
    })