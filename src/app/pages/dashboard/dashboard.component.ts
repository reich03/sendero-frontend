import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MarkersComponent } from '../../components/markers/markers.component';
import { UsersComponent } from '../../components/users/users.component';
import { AuditComponent } from "../../components/audit/audit.component";
import { UserViewComponent } from "../../components/user-view/user-view.component";
import { ReportComponent } from "../../components/report/report.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MarkersComponent, UsersComponent, AuditComponent, UserViewComponent, ReportComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  currentUser: any = null;
  darkMode = false;
  isGuest = true;
  activeView = 'dashboard';

  constructor(private router: Router) {}

  ngOnInit(): void {

    const cookieData = this.getCookie('current_user');
    this.isGuest = !cookieData;

    if (cookieData) {
      try {
        this.currentUser = JSON.parse(cookieData);
      } catch (e) {
        console.error('Error al parsear la cookie currentUser', e);
      }
    }
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    this.darkMode = savedDarkMode;

    if (this.darkMode) {
      document.documentElement.classList.add('dark');
    }
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
    window.history.pushState({}, '', `/dashboard?view=${view}`);
  }

  getCookie(name: string): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === name) {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;

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
