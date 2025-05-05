import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MarkersComponent } from '../../components/markers/markers.component';
import { UsersComponent } from '../../components/users/users.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MarkersComponent, UsersComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  darkMode = false;
  isGuest = true;
  activeView = 'dashboard';

  constructor(private router: Router) {}

  ngOnInit(): void {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    this.darkMode = savedDarkMode;

    if (this.darkMode) {
      document.documentElement.classList.add('dark');
    }
    const userData = localStorage.getItem('currentUser');
    this.isGuest = !userData;
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam) {
      this.setActiveView(viewParam);
    }
  }

  // setActiveView(view: string): void {
  //   this.activeView = view;
  // }

  setActiveView(view: string) {
    this.activeView = view;
    // Update URL without reloading page
    window.history.pushState({}, '', `/dashboard?view=${view}`);
  }


  toggleDarkMode() {
    this.darkMode = !this.darkMode;

    // Aplicar clases al elemento HTML para el modo oscuro
    if (this.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Guardar preferencia en localStorage
    localStorage.setItem('darkMode', this.darkMode ? 'true' : 'false');
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/login']);
  }
}
