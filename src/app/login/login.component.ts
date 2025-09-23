import { Component, HostListener } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword: boolean = false;
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    // Initialize form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    // Redirect if already logged in
    if (localStorage.getItem('token')) {
      this.router.navigate(['/']);
    }
  }

  // Form getters for template convenience
  public get email() {
    return this.loginForm.get('email');
  }

  public get password() {
    return this.loginForm.get('password');
  }

  // Toggle password visibility
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // Login submission
  onSubmit(): void {
    if (!this.loginForm.valid) {
      alert('Please enter valid email and password.');
      return;
    }

    this.loading = true;

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        console.log('Login successful:', res);

        // Store token and user info in localStorage for persistent login
        if (res.token) localStorage.setItem('token', res.token);
        if (res.user) localStorage.setItem('user', JSON.stringify(res.user));

        alert(res.message || 'Login successful!');
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Login failed:', err);
        alert(err.message || 'Wrong email or password.');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  // Parallax effect for background
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    const navBg = document.querySelector('.login-bg') as HTMLElement | null;
    if (navBg) {
      const x = (event.clientX / window.innerWidth - 0.5) * 20;
      const y = (event.clientY / window.innerHeight - 0.5) * 20;
      navBg.style.backgroundPosition = `${50 + x}% ${50 + y}%`;
    }
  }

  // Navigate to register page
  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  // Navigate to reset-password page
  goToForgotPassword(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/reset-password']);
  }
}
