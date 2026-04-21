from django.shortcuts import get_object_or_404
from .models import Profiles

def user_info(request):
    verified = False
    profile = None
    user_role = getattr(request.user, 'role', None)

    if request.user.is_authenticated:
        if user_role == 'driver':
            profile = get_object_or_404(Profiles, captain_name=request.user.username)
            if profile.captain_verified:
                verified = True

        return {
            'logged': True,
            'role': user_role,
            'username': request.user.username,
            'verified': verified  # Use the boolean, not profile.is_verified
        }

    return { 
        'logged': False,
        'role': None,
        'username': None,
        'verified': False  # fixed typo: 'verfied'
    }