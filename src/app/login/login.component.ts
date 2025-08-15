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
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      remember: [false]
    });
  }

  public get email() {
    return this.loginForm.get('email');
  }

  public get password() {
    return this.loginForm.get('password');
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.loginForm.valid) {
      alert('Please enter valid email and password.');
      return;
    }

    this.loading = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        console.log('Login successful:', res);
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

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    const navBg = document.querySelector('.login-bg') as HTMLElement | null;
    if (navBg) {
      const x = (event.clientX / window.innerWidth - 0.5) * 20;
      const y = (event.clientY / window.innerHeight - 0.5) * 20;
      navBg.style.backgroundPosition = `${50 + x}% ${50 + y}%`;
    }
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
