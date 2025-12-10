import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalstorageService {
  // Función para asignar en el localstorage una llave y su valor
  public async setItem(key: string, data: any) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error setting localStorage:', error);
    }
  }

  // Función para tomar valores del localstorage mediante una llave
  public getItem(key: string) {
    try {
      const item = localStorage.getItem(key);
      // Si no existe, retorna null directamente
      if (!item || item === 'null' || item === 'undefined') {
        return null;
      }
      return JSON.parse(item);
    } catch (error) {
      console.error('Error parsing localStorage:', error);
      return null;
    }
  }

  // Función para borrar el localstorage
  public clear() {
    localStorage.clear();
  }
}