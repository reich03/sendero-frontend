// src/app/pages/register/register.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  errorMessage = '';
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  currentYear: number;
  focusedFields: { [key: string]: boolean } = {};

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });

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

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { 'notSame': true };
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onInputFocus(fieldName: string): void {
    this.focusedFields[fieldName] = true;
  }

  onInputBlur(fieldName: string): void {
    this.focusedFields[fieldName] = false;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      // Mark all fields as touched to show errors
      Object.keys(this.registerForm.controls).forEach(key => {
        const control = this.registerForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    const { username, email, password } = this.registerForm.value;

    this.authService.register(username, email, password).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Error al registrar. El correo electrónico ya está en uso.';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}
