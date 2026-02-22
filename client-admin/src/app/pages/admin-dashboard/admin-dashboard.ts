import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService, AdminUser, DashboardStats } from '../../services/admin.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard implements OnInit {
  private adminService = inject(AdminService);
  private userService = inject(UserService);
  private router = inject(Router);

  // Expose Math to template
  Math = Math;

  // State signals
  users = signal<AdminUser[]>([]);
  filteredUsers = signal<AdminUser[]>([]);
  dashboardStats = signal<DashboardStats | null>(null);
  loading = signal<boolean>(true);
  error = signal<string>('');
  searchQuery = signal<string>('');

  // User Detail Modal state
  showUserDetailModal = signal<boolean>(false);
  selectedDetailUser = signal<AdminUser | null>(null);

  // Wallet Modal state
  showWalletModal = signal<boolean>(false);
  selectedUser = signal<AdminUser | null>(null);
  walletAmount = signal<number>(0);
  walletReason = signal<string>('');
  isAddingWallet = signal<boolean>(true);
  processingWallet = signal<boolean>(false);

  // Toast state
  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error'>('success');
  showToast = signal<boolean>(false);

  // Active tab
  activeTab = signal<'users' | 'stats' | 'requests'>('users');

  // Filter state
  filterType = signal<'all' | 'dayscholar' | 'hosteller'>('all');
  filterDept = signal<string>('all');
  filterYear = signal<string>('all');

  // Filter options
  departments = [
    'Aeronautical Engineering',
    'Agriculture Engineering',
    'Artificial Intelligence and Data Science',
    'Biomedical Engineering',
    'Biotechnology',
    'Computer Science & Engineering',
    'Computer Science and Engineering (AIML)',
    'Computer Science and Business Systems',
    'Electronics & Communication Engineering',
    'Electrical & Electronics Engineering',
    'VLSI',
    'Mechanical Engineering'
  ];
  years = [1, 2, 3, 4];

  // Create User Modal state
  showCreateUserModal = signal<boolean>(false);
  newUser = signal<{ name: string, email: string, registrationNumber: string, userType: 'dayscholar' | 'hosteller', department?: string, year?: number }>({
    name: '',
    email: '',
    registrationNumber: '',
    userType: 'dayscholar',
    department: '',
    year: undefined
  });
  creatingUser = signal<boolean>(false);

  // Profile Change Requests state
  changeRequests = signal<any[]>([]);
  loadingRequests = signal<boolean>(false);
  processingRequest = signal<boolean>(false);

  // Polling subscription
  private pollSubscription: any;

  ngOnInit(): void {
    this.loadDashboard();
    this.loadChangeRequests();

    // Auto-refresh every 5 seconds to keep data in sync with user actions
    // Using setInterval instead of RxJS interval for simplicity in this context
    this.pollSubscription = setInterval(() => {
      // Silent refresh - don't show loading spinner
      this.refreshDataSilent();
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.pollSubscription) {
      clearInterval(this.pollSubscription);
    }
  }

  // Silent refresh without toggling loading state
  refreshDataSilent(): void {
    this.adminService.getDashboardStats().subscribe({
      next: (stats) => this.dashboardStats.set(stats),
      error: (err) => console.error('Silent stats refresh failed', err)
    });

    this.adminService.getAllUsers().subscribe({
      next: (response) => {
        // Only update if we have data to avoid flickering if request fails
        if (response.users) {
          // efficient update could be done here, but replacing is fine for this scale
          this.users.set(response.users);
          this.applyFilters();

          // Update detail modal if open and user exists
          if (this.selectedDetailUser()) {
            const updatedUser = response.users.find(u => u.id === this.selectedDetailUser()!.id);
            if (updatedUser) {
              this.selectedDetailUser.set(updatedUser);
            }
          }
        }
      },
      error: (err) => console.error('Silent users refresh failed', err)
    });

    // Also refresh change requests
    if (this.activeTab() === 'requests') {
      this.loadChangeRequestsSilent();
    }
  }

  loadChangeRequests(): void {
    this.loadingRequests.set(true);
    this.adminService.getPendingChangeRequests().subscribe({
      next: (requests: any) => {
        this.changeRequests.set(requests);
        this.loadingRequests.set(false);
      },
      error: (err: any) => {
        console.error('Error loading change requests:', err);
        this.loadingRequests.set(false);
      }
    });
  }

  loadChangeRequestsSilent(): void {
    this.adminService.getPendingChangeRequests().subscribe({
      next: (requests: any) => {
        this.changeRequests.set(requests);
      },
      error: (err: any) => console.error('Silent change requests refresh failed', err)
    });
  }

  approveChangeRequest(requestId: string): void {
    this.processingRequest.set(true);
    this.adminService.reviewChangeRequest(requestId, 'approve').subscribe({
      next: (response: any) => {
        this.showToastMessage('Change request approved successfully', 'success');
        this.processingRequest.set(false);
        this.loadChangeRequests();
        this.loadDashboard(); // Refresh user data
      },
      error: (err: any) => {
        this.showToastMessage(err.error?.error || 'Failed to approve request', 'error');
        this.processingRequest.set(false);
      }
    });
  }

  rejectChangeRequest(requestId: string, reason: string = 'Invalid request'): void {
    this.processingRequest.set(true);
    this.adminService.reviewChangeRequest(requestId, 'reject', reason).subscribe({
      next: (response: any) => {
        this.showToastMessage('Change request rejected', 'success');
        this.processingRequest.set(false);
        this.loadChangeRequests();
      },
      error: (err: any) => {
        this.showToastMessage(err.error?.error || 'Failed to reject request', 'error');
        this.processingRequest.set(false);
      }
    });
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set('');

    // Load dashboard stats
    this.adminService.getDashboardStats().subscribe({
      next: (stats) => {
        this.dashboardStats.set(stats);
      },
      error: (err) => console.error('Error loading stats:', err),
    });

    // Load all users
    this.adminService.getAllUsers().subscribe({
      next: (response) => {
        this.users.set(response.users);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.error.set('Failed to load users');
        this.loading.set(false);
      },
    });
  }

  applyFilters(): void {
    const query = this.searchQuery().toLowerCase().trim();
    const type = this.filterType();
    const dept = this.filterDept();
    const year = this.filterYear();

    let filtered = this.users();

    // Apply type filter
    if (type !== 'all') {
      filtered = filtered.filter((user) => user.userType === type);
    }

    // Apply department filter
    if (dept !== 'all') {
      filtered = filtered.filter((user) => user.department === dept);
    }

    // Apply year filter
    if (year !== 'all') {
      const yearNum = parseInt(year);
      filtered = filtered.filter((user) => user.year === yearNum);
    }

    // Apply search filter
    if (query) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.registrationNumber.toLowerCase().includes(query) ||
          (user.department && user.department.toLowerCase().includes(query))
      );
    }

    this.filteredUsers.set(filtered);
  }

  onSearch(): void {
    this.applyFilters();
  }

  onFilterChange(type: 'all' | 'dayscholar' | 'hosteller'): void {
    this.filterType.set(type);
    this.applyFilters();
  }

  setActiveTab(tab: 'users' | 'stats' | 'requests'): void {
    this.activeTab.set(tab);
    if (tab === 'requests') {
      this.loadChangeRequests();
    }
  }

  // User Detail Modal functions
  openUserDetailModal(user: AdminUser): void {
    this.selectedDetailUser.set(user);
    this.showUserDetailModal.set(true);
  }

  closeUserDetailModal(): void {
    this.showUserDetailModal.set(false);
    this.selectedDetailUser.set(null);
  }

  // Wallet Modal functions
  openAddWalletModal(user: AdminUser): void {
    this.selectedUser.set(user);
    this.walletAmount.set(0);
    this.walletReason.set('');
    this.isAddingWallet.set(true);
    this.showWalletModal.set(true);
  }

  openReduceWalletModal(user: AdminUser): void {
    this.selectedUser.set(user);
    this.walletAmount.set(0);
    this.walletReason.set('');
    this.isAddingWallet.set(false);
    this.showWalletModal.set(true);
  }

  closeWalletModal(): void {
    this.showWalletModal.set(false);
    this.selectedUser.set(null);
    this.walletAmount.set(0);
    this.walletReason.set('');
  }

  submitWallet(): void {
    const user = this.selectedUser();
    const amount = this.walletAmount();
    const reason = this.walletReason();

    if (!user || amount <= 0) {
      this.showToastMessage('Please enter a valid amount', 'error');
      return;
    }

    // Check if reducing more than available
    if (!this.isAddingWallet() && amount > user.walletBalance) {
      this.showToastMessage('Cannot reduce more than available balance', 'error');
      return;
    }

    this.processingWallet.set(true);

    const request = this.isAddingWallet()
      ? this.adminService.addWalletBalance(user.id, amount, reason)
      : this.adminService.reduceWalletBalance(user.id, amount, reason);

    request.subscribe({
      next: (response) => {
        // Update local user data
        const updatedUsers = this.users().map((u) =>
          u.id === user.id ? { ...u, walletBalance: response.user.walletBalance } : u
        );
        this.users.set(updatedUsers);
        this.applyFilters();

        // Update detail modal if open
        if (this.selectedDetailUser()?.id === user.id) {
          this.selectedDetailUser.set({ ...user, walletBalance: response.user.walletBalance });
        }

        const action = this.isAddingWallet() ? 'added to' : 'reduced from';
        this.showToastMessage(`₹${amount} ${action} ${user.name}'s wallet`, 'success');
        this.closeWalletModal();
        this.processingWallet.set(false);

        // Refresh stats
        this.adminService.getDashboardStats().subscribe({
          next: (stats) => this.dashboardStats.set(stats),
        });
      },
      error: (err) => {
        this.showToastMessage(err.error?.error || 'Failed to update wallet', 'error');
        this.processingWallet.set(false);
      },
    });
  }

  // Delete User
  deleteUser(user: AdminUser, event: Event): void {
    event.stopPropagation();

    if (!confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
      return;
    }

    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        this.showToastMessage(`User "${user.name}" deleted successfully`, 'success');
        // Remove from local list
        this.users.update(users => users.filter(u => u.id !== user.id));
        this.applyFilters();
        // Refresh dashboard stats
        this.loadDashboard();
      },
      error: (err) => {
        this.showToastMessage(err.error?.error || 'Failed to delete user', 'error');
      },
    });
  }

  // Quick wallet action from user card
  quickAddWallet(user: AdminUser, event: Event): void {
    event.stopPropagation();
    this.openAddWalletModal(user);
  }

  quickReduceWallet(user: AdminUser, event: Event): void {
    event.stopPropagation();
    this.openReduceWalletModal(user);
  }

  // Toast function
  showToastMessage(message: string, type: 'success' | 'error'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.showToast.set(true);

    setTimeout(() => this.showToast.set(false), 3000);
  }

  // Create User Functions
  openCreateUserModal(): void {
    this.newUser.set({
      name: '',
      email: '',
      registrationNumber: '',
      userType: 'dayscholar',
      department: '',
      year: undefined
    });
    this.showCreateUserModal.set(true);
  }

  closeCreateUserModal(): void {
    this.showCreateUserModal.set(false);
  }

  submitCreateUser(): void {
    const user = this.newUser();
    if (!user.name || !user.email || !user.registrationNumber) {
      this.showToastMessage('Please fill all required fields', 'error');
      return;
    }

    this.creatingUser.set(true);
    this.adminService.createUser(user).subscribe({
      next: (response) => {
        this.showToastMessage('User created successfully', 'success');
        // Refresh list - prepend new user
        const newUserFormatted: AdminUser = {
          ...response.user,
          collegePoints: 0,
          totalSpent: 0,
          totalOrders: 0,
          createdAt: new Date().toISOString()
        };
        this.users.update(users => [newUserFormatted, ...users]);
        this.applyFilters();
        this.closeCreateUserModal();
        this.creatingUser.set(false);
      },
      error: (err) => {
        this.showToastMessage(err.error?.error || 'Failed to create user', 'error');
        this.creatingUser.set(false);
      }
    });
  }

  logout(): void {
    this.userService.logout();
    this.router.navigate(['/admin-login']);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getUserInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getRandomGradient(id: string): string {
    const gradients = [
      'linear-gradient(135deg, #667eea, #764ba2)',
      'linear-gradient(135deg, #f093fb, #f5576c)',
      'linear-gradient(135deg, #4facfe, #00f2fe)',
      'linear-gradient(135deg, #43e97b, #38f9d7)',
      'linear-gradient(135deg, #fa709a, #fee140)',
      'linear-gradient(135deg, #a8edea, #fed6e3)',
      'linear-gradient(135deg, #ff9a9e, #fecfef)',
      'linear-gradient(135deg, #667eea, #764ba2)',
    ];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  }
}
