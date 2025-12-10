import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProviderService } from '../../services/provider.service';
import { LocalstorageService } from '../../services/localstorage.service';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.scss'
})
export class MyProfileComponent implements OnInit {
  private _formBuilder: FormBuilder = inject(FormBuilder);
  private _provider: ProviderService = inject(ProviderService);
  private _localStorage: LocalstorageService = inject(LocalstorageService);
  private _snackBar: MatSnackBar = inject(MatSnackBar);

  user: any;

  profileForm: FormGroup = this._formBuilder.group({
    name: [null, [Validators.required, Validators.minLength(3)]],
    phone: [null, [Validators.required, Validators.minLength(10)]],
    password: [null, [Validators.minLength(6)]] 
  });

  ngOnInit() {
    this.user = this._localStorage.getItem('user');
    
    this.profileForm.patchValue({
      name: this.user.name,
      phone: this.user.phone
    });
  }

  async saveProfile() {
    if (this.profileForm.valid) {
      try {
        const password = this.profileForm.value.password;
        
        if (password && password.trim() !== '') {
          const data = {
            idusers: this.user.idusers,
            name: this.profileForm.value.name,
            phone: this.profileForm.value.phone,
            password: password,
            rol: this.user.rol 
          };
          await this._provider.request('PUT', 'user/updateUser', data);
        } else {
          const data = {
            idusers: this.user.idusers,
            name: this.profileForm.value.name,
            phone: this.profileForm.value.phone
          };
          await this._provider.request('PUT', 'user/updateProfile', data);
        }

        this.user.name = this.profileForm.value.name;
        this.user.phone = this.profileForm.value.phone;
        await this._localStorage.setItem('user', this.user);
        this.profileForm.patchValue({ password: null });

        this._snackBar.open('Perfil actualizado correctamente', '', { duration: 3000 });
      } catch (error) {
        this._snackBar.open('Error al actualizar el perfil', '', { duration: 3000 });
      }
    } else {
      this._snackBar.open('Completa todos los campos correctamente', '', { duration: 3000 });
    }
  }
}