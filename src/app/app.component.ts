import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router, NavigationEnd } from '@angular/router';
import { NgIf, NgClass } from '@angular/common';
import { filter } from 'rxjs/operators';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms'; 
import { provideHttpClient } from '@angular/common/http';

export const appConfig = {
  providers: [
    provideHttpClient()
  ]
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
    NgIf,
    NgClass,
    ReactiveFormsModule, 
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'Certificate_Generator';
  showSidebar = true;
  isLoggedIn = false;

  constructor(private router: Router) {
    this.checkLogin();

    // Hide sidebar on auth routes & update login status
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const authRoutes = ['/login', '/register', '/reset-password'];
        this.showSidebar = !authRoutes.some(route => event.urlAfterRedirects.includes(route));
        this.isLoggedIn = !!localStorage.getItem('token');
      });
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    this.updateBackgroundPosition('.nav-bg', event);
    this.updateBackgroundPosition('.login-bg', event);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }

  private updateBackgroundPosition(selector: string, event: MouseEvent): void {
    const element = document.querySelector(selector) as HTMLElement | null;
    if (!element) return;

    const x = (event.clientX / window.innerWidth - 0.5) * 20; 
    const y = (event.clientY / window.innerHeight - 0.5) * 20; 
    element.style.backgroundPosition = `${50 + x}% ${50 + y}%`;
  }

  private checkLogin(): void {
    const token = localStorage.getItem('token');
    this.isLoggedIn = !!token;

    // Redirect to login if not logged in and not on an auth route
    const authRoutes = ['/login', '/register', '/reset-password'];
    if (!this.isLoggedIn && !authRoutes.includes(this.router.url)) {
      this.router.navigate(['/login']);
    }
  }
}
