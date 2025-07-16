import { Component, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HomeComponentComponent } from './home-component/home-component.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HomeComponentComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'] 
})
export class AppComponent {
  title = 'Certificate_Generator';

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    const navBg = document.querySelector('.nav-bg') as HTMLElement;
    if (!navBg) return;

    const x = (event.clientX / window.innerWidth - 0.5) * 20;
    const y = (event.clientY / window.innerHeight - 0.5) * 20;

    navBg.style.backgroundPosition = `${50 + x}% ${50 + y}%`;
  }
}
