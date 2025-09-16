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
  selectedFile: File | null = null; // ✅ hold new image file

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.profileForm = this.fb.group({
      username: [{ value: '', disabled: true }, Validators.required],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      role: [{ value: '', disabled: true }],
      password: [{ value: '', disabled: true }],
      newPassword: ['']
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
      this.imageUrl = user.image ? `http://localhost:4000/${user.image}` : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      this.router.navigate(['/login']);
    }
  }

  toggleEdit() {
    this.editMode = !this.editMode;
    ['username', 'email'].forEach(control => {
      const formControl = this.profileForm.get(control);
      if (this.editMode) formControl?.enable();
      else formControl?.disable();
    });

    if (this.editMode) {
      this.profileForm.get('newPassword')?.enable();
    } else {
      this.profileForm.get('newPassword')?.disable();
    }
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
      this.selectedFile = file;
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
    const formData = new FormData();

    formData.append('username', this.profileForm.get('username')?.value);
    formData.append('email', this.profileForm.get('email')?.value);

    if (this.profileForm.get('newPassword')?.value) {
      formData.append('newPassword', this.profileForm.get('newPassword')?.value);
    }

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.http.put('http://localhost:4000/api/auth/update', formData, { headers }).subscribe({
      next: (res: any) => {
        alert('Profile updated successfully!');

        if (res.user) {
          localStorage.setItem('user', JSON.stringify(res.user));
        }

        this.editMode = false;
        this.loadUserInfo();
      },
      error: (err) => {
        console.error('Failed to update profile:', err);
        alert('Failed to update profile.');
      }
    });
  }

  cancelEdit() {
    this.editMode = false;
    this.loadUserInfo();
  }

  deleteAccount() {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No active session found. Please log in again.');
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.delete('http://localhost:4000/api/user/delete', { headers }).subscribe({
      next: () => {
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
