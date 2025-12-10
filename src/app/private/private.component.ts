import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LocalstorageService } from '../services/localstorage.service';
import { MatSidenavModule } from '@angular/material/sidenav';

@Component({
  selector: 'app-private',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,MatSidenavModule
  ],
  templateUrl: './private.component.html',
  styleUrl: './private.component.scss'
})
export class PrivateComponent {
  private _localstorage = inject(LocalstorageService);
  private _router = inject(Router);

  user = '';
  rol = 0;

  ngOnInit() {
    const u = this._localstorage.getItem('user');
    this.user = u?.name ?? '';
    this.rol = u?.rol ?? 0;
  }

  logOut() {
    this._localstorage.clear();
    this._router.navigate(['/auth/sign-in']);
  }
}
