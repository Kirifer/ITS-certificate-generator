import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router, NavigationEnd } from '@angular/router';
import { NgIf, NgClass } from '@angular/common';
import { filter } from 'rxjs/operators';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms'; // ✅ ADD THIS LINE

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
    NgIf,
    NgClass,
    ReactiveFormsModule, // ✅ ADD THIS LINE
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'Certificate_Generator';
  showSidebar = true;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Hide sidebar on login and register pages
        this.showSidebar = !event.urlAfterRedirects.includes('/login') && !event.urlAfterRedirects.includes('/register');
      });
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    this.updateBackgroundPosition('.nav-bg', event);
    this.updateBackgroundPosition('.login-bg', event);
  }

  private updateBackgroundPosition(selector: string, event: MouseEvent): void {
    const element = document.querySelector(selector) as HTMLElement | null;
    if (element) {
      const x = (event.clientX / window.innerWidth - 0.5) * 20; 
      const y = (event.clientY / window.innerHeight - 0.5) * 20; 
      element.style.backgroundPosition = `${50 + x}% ${50 + y}%`;
    }
  }
}
