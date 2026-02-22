import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TopNavbar } from '../../shared/top-navbar/top-navbar';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-invite',
  imports: [TopNavbar, FormsModule],
  templateUrl: './invite.html',
  styleUrl: './invite.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Invite {
  private readonly userService = inject(UserService);

  searchQuery = signal('');
  activeFilter = signal<'all' | 'unread' | 'groups'>('all');

  getUserInitials(): string {
    const name = this.userService.currentUser()?.name;
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }
}
