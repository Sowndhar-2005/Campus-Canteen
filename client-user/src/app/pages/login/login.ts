import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  userService = inject(UserService);
  cartService = inject(CartService);
  orderService = inject(OrderService);
  router = inject(Router);
  fb = inject(FormBuilder);

  errorMessage = signal('');

  // Login Form
  loginForm = this.fb.group({
    identifier: ['', Validators.required],
    registrationNumber: ['', Validators.required]
  });

  onSubmit() {
    this.errorMessage.set('');

    if (this.loginForm.invalid) return;

    this.userService.login(this.loginForm.value).subscribe({
      next: (response) => {
        if (response.user?.isAdmin) {
          this.errorMessage.set('Admins must use the Admin Login portal.');
          this.userService.logout(false);
        } else {
          // Clear old user's localStorage data before navigating
          this.clearOldUserData(response.user.id);

          // Refresh cart and order data for the new user
          this.cartService.refreshUserData();
          this.orderService.refreshUserData();

          this.router.navigate(['/menu']);
        }
      },
      error: (err) => {
        console.error('Login error:', err);
        const errorMsg = err.error?.error || err.error?.message || 'Login failed';
        this.errorMessage.set(typeof errorMsg === 'string' ? errorMsg : 'Login failed. Please check your credentials.');
      }
    });
  }

  // Clear localStorage data from other users
  private clearOldUserData(currentUserId: string) {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('temp_order_items_') && !key.endsWith(currentUserId)) {
        localStorage.removeItem(key);
      }
    });
  }
}
