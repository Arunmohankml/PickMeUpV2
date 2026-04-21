from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import CustomUser

class CustomUserCreationForm(UserCreationForm):
    class Meta:
        model = CustomUser
        fields = ['username', 'password1', 'password2']

    def clean_username(self):
        username = self.cleaned_data.get('username', '')
        cleaned_username = username.replace(' ', '_').lower()

        # Check if the modified username already exists
        if CustomUser.objects.filter(username=cleaned_username).exists():
            raise forms.ValidationError("This username (after formatting) is already taken.")

        return cleaned_username

    def save(self, commit=True):
        user = super().save(commit=False)
        user.username = self.cleaned_data["username"]  # already cleaned above
        if commit:
            user.save()
        return user