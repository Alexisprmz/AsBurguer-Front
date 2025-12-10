import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProviderService } from '../../../services/provider.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [
    FormsModule, 
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent {
  private _form_builder: FormBuilder = inject(FormBuilder);
  private _router: Router = inject(Router);
  private _provider: ProviderService = inject(ProviderService);
  private _snackBar: MatSnackBar = inject(MatSnackBar);

  form_signup: FormGroup = this._form_builder.group({
    name: [null, [Validators.required, Validators.minLength(3)]],
    phone: [null, [Validators.required, Validators.minLength(10)]],
    password: [null, [Validators.required, Validators.minLength(6)]],
    confirmPassword: [null, [Validators.required]]
  });

  async signup(){
    if (this.form_signup.value.password !== this.form_signup.value.confirmPassword) {
      this._snackBar.open('Las contraseñas no coinciden', '', { duration: 3000 });
      return;
    }

    if (this.form_signup.valid) {
      try {
        const dataUser = {
          name: this.form_signup.value.name,
          phone: this.form_signup.value.phone,
          password: this.form_signup.value.password,
          rol: 3
        }
        const result = await this._provider.request('POST', 'auth/signup', dataUser);
        this._snackBar.open('¡Registro exitoso! Ahora puedes iniciar sesión', '', { duration: 3000 });
        this._router.navigate(['/auth/sign-in']);
      } catch (error) {
        this._snackBar.open('Error al registrarse. Intenta de nuevo.', '', { duration: 3000 });
      }
    } else{
      this._snackBar.open('Completa todos los campos correctamente', '', { duration: 3000 });
    }
  }
}
