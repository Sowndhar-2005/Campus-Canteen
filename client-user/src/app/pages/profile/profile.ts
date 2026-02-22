import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TopNavbar } from '../../shared/top-navbar/top-navbar';
import { OrderService, ConfirmedOrder } from '../../services/order.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, TopNavbar, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  orderService = inject(OrderService);
  userService = inject(UserService);
  router = inject(Router);

  viewingOrder = signal<ConfirmedOrder | null>(null);
  showSettingsModal = signal(false);
  isUpdating = signal(false);

  // Combined History (Orders + Wallet Transactions)
  historyItems = computed(() => {
    const orders = this.orderService.activeOrders().map(o => ({
      id: o.id,
      type: 'order',
      date: o.date,
      title: o.items.map(i => i.food.name).join(', '),
      amount: o.total,
      badge: `${o.items.length} Items`,
      status: o.status,
      isTransaction: false,
      raw: o
    }));

    const transactions = (this.userService.currentUser()?.walletTransactions || []).map(t => ({
      id: t.orderId || Math.random().toString(),
      type: t.type, // 'credit', 'debit', 'order'
      date: new Date(t.createdAt),
      title: t.reason || (t.type === 'credit' ? 'Balance Added' : 'Balance Deducted'),
      amount: t.amount,
      badge: t.type === 'credit' ? 'Credit' : 'Debit',
      status: 'Completed',
      isTransaction: true,
      raw: t
    }));

    // Filter out 'order' transactions as they are covered by 'orders' array
    const filteredTransactions = transactions.filter(t => t.type !== 'order');

    return [...orders, ...filteredTransactions].sort((a, b) => b.date.getTime() - a.date.getTime());
  });

  // Form data signals
  editForm = signal({
    name: '',
    department: '',
    year: 1
  });

  // Change request form (for email, registration number, and user type)
  changeRequestForm = signal({
    email: '',
    registrationNumber: '',
    userType: '',
    name: ''
  });

  isSubmittingRequest = signal(false);

  // Toast signals
  toastMessage = signal('');
  toastType = signal<'success' | 'error'>('success');
  showToast = signal(false);

  viewOrder(order: any) {
    this.viewingOrder.set(order);
  }

  closeView() {
    this.viewingOrder.set(null);
  }

  reorder(order: ConfirmedOrder) {
    this.orderService.addItems(order.items);
    this.closeView();
    this.router.navigate(['/cart']);
  }

  openSettings() {
    const user = this.userService.currentUser();
    if (user) {
      this.editForm.set({
        name: user.name,
        department: user.department || '',
        year: user.year || 1
      });
    }
    this.showSettingsModal.set(true);
  }

  closeSettings() {
    this.showSettingsModal.set(false);
  }

  updateFormField(field: 'name' | 'department' | 'year', event: any) {
    const value = field === 'year' ? parseInt(event.target.value, 10) : event.target.value;
    const currentForm = this.editForm();
    this.editForm.set({
      ...currentForm,
      [field]: value
    });
  }

  updateChangeRequestField(field: 'email' | 'registrationNumber' | 'userType' | 'name', event: any) {
    const value = event.target.value;
    const currentForm = this.changeRequestForm();
    this.changeRequestForm.set({
      ...currentForm,
      [field]: value
    });
  }

  submitChangeRequest(type: 'email' | 'registrationNumber' | 'userType' | 'name') {
    this.isSubmittingRequest.set(true);
    const requestedValue = this.changeRequestForm()[type];

    if (!requestedValue) {
      this.showToastMessage('Please enter a value', 'error');
      this.isSubmittingRequest.set(false);
      return;
    }

    this.userService.submitProfileChangeRequest(type, requestedValue).subscribe({
      next: (response) => {
        this.showToastMessage(response.message || 'Change request submitted successfully!', 'success');
        // Reset the specific field
        const currentForm = this.changeRequestForm();
        this.changeRequestForm.set({
          ...currentForm,
          [type]: ''
        });
        this.isSubmittingRequest.set(false);
      },
      error: (err) => {
        console.error('Change request error:', err);
        const errorMsg = err.error?.error || 'Failed to submit change request';
        this.showToastMessage(errorMsg, 'error');
        this.isSubmittingRequest.set(false);
      }
    });
  }

  updateProfile() {
    this.isUpdating.set(true);
    const formData = this.editForm();

    this.userService.updateProfile(formData).subscribe({
      next: (response) => {
        // Update local user data
        const currentUser = this.userService.currentUser();
        if (currentUser) {
          this.userService.currentUser.set({
            ...currentUser,
            name: response.user.name,
            department: response.user.department,
            year: response.user.year
          });
        }

        this.showToastMessage('Profile updated successfully!', 'success');
        this.isUpdating.set(false);
        this.closeSettings();
      },
      error: (err) => {
        console.error('Update error:', err);
        const errorMsg = err.error?.error || 'Failed to update profile';
        this.showToastMessage(errorMsg, 'error');
        this.isUpdating.set(false);
      }
    });
  }

  showToastMessage(message: string, type: 'success' | 'error') {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }

  logout() {
    this.userService.logout();
  }
}
