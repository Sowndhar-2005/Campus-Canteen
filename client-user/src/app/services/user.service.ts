import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  registrationNumber: string;
  userType: 'dayscholar' | 'hosteller';
  isAdmin?: boolean;
  department?: string;
  year?: number;
  walletBalance: number;
  totalSpent: number;
  totalOrders: number;
  avatar?: string;
  notifications?: Array<{
    message: string;
    type: 'info' | 'success' | 'warning';
    read: boolean;
    createdAt: Date | string;
  }>;
  walletTransactions?: Array<{
    type: 'credit' | 'debit' | 'order';
    amount: number;
    balance: number;
    reason?: string;
    orderId?: string;
    createdAt: Date | string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  http = inject(HttpClient);
  router = inject(Router);

  // User Profile Data
  currentUser = signal<User | null>(null);

  // Stats (Derived from user or defaulted)
  walletBalance = signal(0);
  totalSpent = signal(0);
  totalOrders = signal(0);

  constructor() {
    const token = localStorage.getItem('token');
    if (token) {
      this.getProfile().subscribe({
        next: (user) => {
          this.currentUser.set(user);
          this.walletBalance.set(user.walletBalance);
          this.totalSpent.set(user.totalSpent || 0);
          this.totalOrders.set(user.totalOrders || 0);
        },
        error: () => {
          this.logout();
        }
      });
    }
  }

  getProfile() {
    return this.http.get<any>('/api/auth/me');
  }

  login(credentials: any) {
    return this.http.post<any>('/api/auth/login', credentials).pipe(
      tap(response => {
        this.setSession(response);
      })
    );
  }

  adminLogin(credentials: any) {
    return this.http.post<any>('/api/auth/admin-login', credentials).pipe(
      tap(response => {
        this.setSession(response);
      })
    );
  }

  logout(navigate: boolean = true) {
    const userId = this.currentUser()?.id;

    // Clear user data
    this.currentUser.set(null);
    this.walletBalance.set(0);
    this.totalSpent.set(0);
    this.totalOrders.set(0);

    // Clear auth tokens
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');

    // Clear user-specific localStorage data
    if (userId) {
      localStorage.removeItem(`temp_order_items_${userId}`);
    }

    // Clear all localStorage with temp_order_items prefix (fallback)
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('temp_order_items_')) {
        localStorage.removeItem(key);
      }
    });

    if (navigate) {
      this.router.navigate(['/login']);
    }
  }

  private setSession(response: any) {
    localStorage.setItem('token', response.token);
    localStorage.setItem('isAdmin', String(!!response.user.isAdmin));
    const user = response.user;

    // Normalize data if needed
    user.totalSpent = user.totalSpent || 0;
    user.totalOrders = user.totalOrders || 0;

    this.currentUser.set(user);
    this.walletBalance.set(user.walletBalance);
    this.totalSpent.set(user.totalSpent);
    this.totalOrders.set(user.totalOrders);
  }

  // Process a payment (Optimistic update, real logic should sync with backend)
  processPayment(amount: number): boolean {
    if (this.walletBalance() >= amount) {
      this.walletBalance.update(v => v - amount);
      this.totalSpent.update(v => v + amount);
      this.totalOrders.update(v => v + 1);
      return true;
    }
    return false;
  }

  // Update user profile
  updateProfile(data: { name: string; department: string; year: number }) {
    return this.http.put<any>('/api/auth/profile', data);
  }

  // Submit profile change request (for email, registration number, name, and user type)
  submitProfileChangeRequest(requestType: 'email' | 'registrationNumber' | 'userType' | 'name', requestedValue: string) {
    return this.http.post<any>('/api/profile-changes/submit', {
      requestType,
      requestedValue
    });
  }

  // Mark notification as read/dismissed
  // Mark notification as read/dismissed
  markNotificationAsRead(notification: any) {
    // Optimistically update local state
    const currentUser = this.currentUser();
    if (currentUser && currentUser.notifications) {
      const updatedNotifications = currentUser.notifications.map(n => {
        if (n === notification || (n as any)._id === notification._id || n.createdAt === notification.createdAt) {
          return { ...n, read: true };
        }
        return n;
      });

      this.currentUser.set({
        ...currentUser,
        notifications: updatedNotifications
      });
    }

    return this.http.put<any>('/api/auth/notifications/read', {
      notificationId: notification._id || notification.createdAt
    });
  }
}
