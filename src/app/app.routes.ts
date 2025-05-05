import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { MapComponent } from './pages/map/map.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AuthGuard } from '../app/guards/auth.guard';
import { UsersComponent } from './components/users/users.component';
import { MarkersComponent } from './components/markers/markers.component';
import { LandingComponent } from './pages/landing/landing.component';
export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'inicio', component: LandingComponent },
  { path: 'map', component: MapComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'map', component: MapComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'users', component: UsersComponent },
  { path: 'markers', component: MarkersComponent }

];

