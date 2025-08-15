import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
  profileForm: FormGroup;
  imageUrl: string | ArrayBuffer | null = null;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.profileForm = this.fb.group({
      username: ['', Validators.required], // lowercase to match HTML
      email: ['', [Validators.required, Validators.email]],
      currentPassword: [''],
      newPassword: ['']
    });
  }

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found, please log in');
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any>('http://localhost:4000/api/user/me', { headers }).subscribe({
      next: (data) => {
        this.profileForm.patchValue({
          username: data.username,
          email: data.email
        });
      },
      error: (err) => console.error(err)
    });
  }

  changeEmail() {
    if (this.profileForm.get('email')?.valid) {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found, please log in');
        return;
      }

      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      const body = { email: this.profileForm.get('email')?.value };

      this.http.put('http://localhost:4000/api/user/change-email', body, { headers }).subscribe({
        next: (res) => console.log('Email updated successfully:', res),
        error: (err) => console.error('Error updating email:', err)
      });
    } else {
      console.error('Invalid email entered');
    }
  }

  saveProfile() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const body = {
      username: this.profileForm.value.username,
      email: this.profileForm.value.email,
      newPassword: this.profileForm.value.newPassword || null
    };

    this.http.put('http://localhost:4000/api/user/update', body, { headers }).subscribe({
      next: (res) => console.log('Profile updated:', res),
      error: (err) => console.error(err)
    });
  }

  logout() {
    localStorage.removeItem('token');
    console.log('Logged out');
    // You can also navigate to login page here
  }

  deleteAccount() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.delete('http://localhost:4000/api/user/delete', { headers }).subscribe({
      next: (res) => {
        console.log('Account deleted:', res);
        localStorage.removeItem('token');
      },
      error: (err) => console.error(err)
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => { this.imageUrl = reader.result; };
      reader.readAsDataURL(file);
    }
  }
}
