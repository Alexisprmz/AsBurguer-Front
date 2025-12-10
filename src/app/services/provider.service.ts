import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { LocalstorageService } from './localstorage.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface FavoriteProduct {
  idfavorites: string;
  users_idusers: string;
  products_idproducts: string;
  favorite_created_at: string;
  idproducts: string;
  name: string;
  price: number;
  description: string;
  category_idcategory: number;
  active: number;
  product_created_at: string;
  product_updated_at: string;
}

export interface ToggleFavoriteResponse {
  action: 'added' | 'removed';
  msg: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProviderService {
  private _http: HttpClient = inject(HttpClient);
  private _localstorage: LocalstorageService = inject(LocalstorageService);
  private _snackBar: MatSnackBar = inject(MatSnackBar);

  excep: any = {
    '001': 'Método de petición incorrecto',
    '002': 'Clase incorrecta',
    '003': 'Método inexistente',
    '006': 'Token no enviado',
    '007': 'Parámetros vacíos',
    '004': 'El usuario no existe',
    '005': 'Credenciales inválidas',
  };

  async getFavorites(idUser: string): Promise<FavoriteProduct[]> {
    if (!idUser) {
      throw new Error('Falta el ID de usuario');
    }

    try {
      console.log('Solicitando favoritos para:', idUser);

      const response: any = await this.request<any>(
        'GET',
        `favorites/get?idusers=${idUser}`,
      );

      console.log('Respuesta getFavorites:', response);

      if (response?.data && Array.isArray(response.data)) {
        console.log('Favoritos recibidos:', response.data.length);
        return response.data;
      }

      if (Array.isArray(response)) {
        return response;
      }

      console.warn('Formato inesperado en favoritos:', response);
      return [];
    } catch (error) {
      console.error('Error en getFavorites:', error);
      return [];
    }
  }
  async toggleFavorite(
    idUser: string,
    idProduct: string,
  ): Promise<ToggleFavoriteResponse> {
    if (!idUser || !idProduct) {
      throw new Error('Faltan datos (usuario o producto)');
    }

    try {
      const data = { idusers: idUser, idproducts: idProduct };

      const result = await this.request<ToggleFavoriteResponse>(
        'POST',
        'favorites/toggle',
        data,
      );

      console.log('toggleFavorite resultado:', result);
      return result;
    } catch (error) {
      console.error('Error en toggleFavorite:', error);
      throw error;
    }
  }

  async request<T>(method: string, action: string, data?: any) {
    const PROTOCOL =
      typeof window !== 'undefined' ? window.location.protocol : 'http:';
    const DOMINIO =
      typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const ACCESS = '3000';

    const url = `${PROTOCOL}//${DOMINIO}:${ACCESS}/`;

    console.log(' Request:', { method, action, url: url + action, data });

    return new Promise<T>((resolve, reject) =>
      this._http
        .request<any>(method, url + action, {
          body: method !== 'GET' ? data : null,
          headers: this.headers(),
          params: method !== 'POST' && data ? this.params(data) : {},
        })
        .subscribe({
          next: (response: any) => {
            console.log(" Respuesta cruda del backend:", response);

            if (!response.error) {
              resolve(response);
            } else {
              this._snackBar.open(this.excep[response.error_code], '', { duration: 3000 });
              reject(response);
            }
          },
          error: (err: any) => {
            const errorCode = err?.error?.error_code;
            const errorMsg = this.excep[errorCode] || 'Error de conexión';

            this._snackBar.open(errorMsg, '', { duration: 3000 });

            reject(err?.error || err);
          }
        })
    );
  }
headers() {
  const user = this._localstorage.getItem('user');

  // Asegurar string siempre
  const token =
    user && typeof user.token === 'string'
      ? user.token
      : '';

  // Construir objeto limpio
  const headersConfig: Record<string, string> = {
    simple: 'bb1557a2774351913c8557251ec2cbb4',
    'Content-Type': 'application/json',
  };

  if (token) {
    headersConfig['authorization'] = token;
  }

  return new HttpHeaders(headersConfig);
}

  params(params: any) {
    return new HttpParams().set('params', JSON.stringify(params));
  }
}
