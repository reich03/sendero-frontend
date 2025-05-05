// src/app/pages/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage = '';
  isLoading = false;
  showPassword = false;
  currentYear: number;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
    this.currentYear = new Date().getFullYear();
  }

  ngOnInit(): void {
    // Verificar si el usuario está autenticado
    this.authService.isAuthenticated.subscribe(isAuth => {
      if (isAuth) {
        this.router.navigate(['/map']);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.loginForm.controls).forEach(key => {
        const control = this.loginForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: () => {
        // Mostrar SweetAlert de éxito
        Swal.fire({
          title: '¡Inicio de sesión exitoso!',
          text: 'Redirigiendo al mapa...',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });

        // Redireccionar al mapa
        setTimeout(() => {
          this.router.navigate(['/map']);
        }, 1500);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Credenciales incorrectas. Por favor, intente de nuevo.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }
}
