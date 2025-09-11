import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
  profileForm: FormGroup;
  editMode = false;
  showPassword = false;
  imageUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.profileForm = this.fb.group({
      username: [{ value: '', disabled: true }, Validators.required],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      role: [{ value: '', disabled: true }],
      password: [{ value: '', disabled: true }]
    });
  }

  ngOnInit() {
    this.loadUserInfo();
  }

  loadUserInfo() {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      this.profileForm.patchValue({
        username: user.username ?? '',
        email: user.email ?? '',
        role: user.role ?? '',
        password: user.password ? '*******' : ''
      });
      this.imageUrl = user.image ?? null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      this.router.navigate(['/login']);
    }
  }

  toggleEdit() {
    this.editMode = !this.editMode;
    ['username', 'email', 'role'].forEach(control => {
      const formControl = this.profileForm.get(control);
      if (this.editMode) formControl?.enable();
      else formControl?.disable();
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;

    const user = JSON.parse(storedUser);
    this.profileForm.get('password')?.setValue(
      this.showPassword ? (user.password ?? '') : '*******'
    );
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imageUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  saveProfile() {
  const token = localStorage.getItem('token');
  if (!token) return;

  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  const body: any = {
    username: this.profileForm.value.username,
    email: this.profileForm.value.email
  };

  if (this.profileForm.value.newPassword) {
    body.newPassword = this.profileForm.value.newPassword;
  }

  this.http.put('http://localhost:4000/api/auth/update', body, { headers }).subscribe({
    next: (res: any) => {
      alert('Profile updated successfully!');
      // Refresh the account info from server
      this.loadUserInfo();
    },
    error: (err) => console.error('Failed to update profile:', err)
  });
}

cancelEdit() {
  this.editMode = false;
  this.loadUserInfo(); // reload the correct info from server
}

  deleteAccount() {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No active session found. Please log in again.');
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.delete('http://localhost:4000/api/user/delete', { headers }).subscribe({
      next: (res) => {
        alert('Your account has been deleted.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Error deleting account:', err);
        alert('Failed to delete account.');
      }
    });
  }
}
