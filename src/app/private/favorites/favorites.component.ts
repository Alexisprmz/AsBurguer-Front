import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  ProviderService,
  FavoriteProduct,
  ToggleFavoriteResponse,
} from '../../services/provider.service';
import { OrderService } from '../../services/order.service';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

export interface Ingredient {
  idingredients: string;
  name: string;
  extra: number;
  cost: number;
  stock: number;
  required: number;
}

export interface Product {
  idproducts: string;
  name: string;
  price: number;
  description: string;
  category_idcategory: number;
  name_category: string;
  ingredients: Ingredient[];
}

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CurrencyPipe,
    RouterLink,
    MatSidenavModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss',
})
export class FavoritesComponent implements OnInit {
  public provider = inject(ProviderService);
  public order = inject(OrderService);
  public snackBar = inject(MatSnackBar);

  menu: Product[] = [];
  loading = false;
  error = '';

  rol: number = 3;
  idusers: string = '';

  favorites: string[] = [];
  loadingFavorites = false;

  async ngOnInit() {
    this.loading = true;
    try {
      const userStr = localStorage.getItem('user');
      console.log('🔍 userStr:', userStr);

      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          console.log('👤 Usuario parseado:', user);

          this.idusers =
            user.idusers ||
            user.id ||
            user.userId ||
            user.idusuarios ||
            user.user_id ||
            '';

          const rawRol = user.rol ?? user.role ?? this.rol;
          this.rol = Number(rawRol);

          console.log('idusers extraído:', this.idusers);
          console.log('rol extraído:', this.rol);
        } catch (parseError) {
          console.error('Error al parsear usuario:', parseError);
          this.idusers = '';
        }
      }
      const response: any = await this.provider.request(
        'GET',
        'menu/viewIngredients',
      );
      if (Array.isArray(response)) {
        this.menu = response as Product[];
      } else if (Array.isArray(response?.msg)) {
        this.menu = response.msg as Product[];
      } else {
        this.menu = [];
      }
      if (this.rol === 3 && this.idusers) {
        console.log('Cargando favoritos para usuario:', this.idusers);
        await this.loadFavorites();
      }
    } catch (e) {
      console.error('Error al cargar favoritos:', e);
      this.error = 'Error al cargar favoritos';
      this.menu = [];
    } finally {
      this.loading = false;
    }
  }

  // -------- FAVORITOS (BACKEND) --------
  async loadFavorites(): Promise<void> {
    if (this.loadingFavorites || !this.idusers) return;

    this.loadingFavorites = true;
    console.log('Iniciando carga de favoritos...');

    try {
      const favoritesList: FavoriteProduct[] =
        await this.provider.getFavorites(this.idusers);

      console.log('favoritesList completo:', favoritesList);
      console.log('Primer favorito:', favoritesList[0]);

      this.favorites = favoritesList.map((fav) => {
        const id = String(fav.products_idproducts || fav.idproducts);
        console.log('🎯 ID extraído:', id, 'de favorito:', fav);
        return id;
      }).filter(id => id && id !== 'undefined'); 

      console.log('✅ Favoritos cargados (IDs):', this.favorites);
    } catch (e) {
      console.error('❌ Error al cargar favoritos:', e);
      this.favorites = [];
    } finally {
      this.loadingFavorites = false;
    }
  }

  isFavorite(idProduct: string): boolean {
    return this.favorites.includes(String(idProduct));
  }

  async toggleFavorite(idProduct: string) {
    if (!this.idusers) {
      this.snackBar.open(
        'Debes iniciar sesión para agregar favoritos',
        'Cerrar',
        { duration: 3000 },
      );
      return;
    }

    if (this.loadingFavorites) return;

    this.loadingFavorites = true;
    console.log('Alternando favorito para producto:', idProduct);

    const id = String(idProduct);
    const wasFavorite = this.isFavorite(id);

    try {
      const response: ToggleFavoriteResponse =
        await this.provider.toggleFavorite(this.idusers, id);
      console.log('Respuesta toggle:', response);

      let action: 'added' | 'removed' = response.action;

      if (action === 'added') {
        if (!this.favorites.includes(id)) {
          this.favorites.push(id);
        }
        this.snackBar.open(
          'Producto agregado a favoritos',
          'Cerrar',
          { duration: 2000 },
        );
      } else if (action === 'removed') {
        this.favorites = this.favorites.filter((favId) => favId !== id);
        this.snackBar.open(
          'Producto eliminado de favoritos',
          'Cerrar',
          { duration: 2000 },
        );
      }
    } catch (e) {
      console.error('Error al alternar favorito:', e);
      this.snackBar.open(
        'Error al actualizar favoritos',
        'Cerrar',
        { duration: 3000 },
      );
    } finally {
      this.loadingFavorites = false;
    }
  }

  favoriteProducts(): Product[] {
    console.log('Filtrando productos favoritos...');
    console.log('Menu completo:', this.menu.length, 'productos');
    console.log('IDs favoritos:', this.favorites);
    
    const filtered = this.menu.filter((p) => {
      const isFav = this.isFavorite(p.idproducts);
      if (isFav) {
        console.log('Producto favorito encontrado:', p.name, p.idproducts);
      }
      return isFav;
    });
    
    console.log('Total productos filtrados:', filtered.length);
    return filtered;
  }
  getImageByCategory(product: Product): string {
    switch (product.category_idcategory) {
      case 1:
        return '../../../assets/Hamburguesa.png';
      case 2:
        return '../../../assets/Alitas.png';
      case 3:
        return '../../../assets/Snack.png';
      default:
        return '../../../assets/Snack.png';
    }
  }

  filterByProduct(id: string): Product | null {
    return this.menu.find((p) => p.idproducts === id) ?? null;
  }

  filterByIngredient(
    key: 'required' | 'extra',
    value: 0 | 1,
    ingredients: Ingredient[] | undefined,
    idproduct: string,
    amount: number,
  ): Ingredient[] {
    if (!ingredients) return [];
    const type = value === 0 ? 1 : 0;

    return ingredients.filter(
      (ingredient) =>
        (ingredient as any)[key] == value &&
        !this.filterExtraExceptions(idproduct, amount, type).includes(
          ingredient.idingredients,
        ),
    );
  }

  private orderDetailsFA(): FormArray {
    return this.order.formOrder.get('order_details') as FormArray;
  }

  addProduct(id: string, price: number, name: string, cat: string) {
    this.orderDetailsFA().push(
      this.order.orderDetails(id, price, name, cat),
    );
  }

  removeProduct(id: string) {
    const fa = this.orderDetailsFA();
    const idx = fa.value.findIndex(
      (p: any) => p.products_idproducts === id,
    );
    if (idx !== -1) fa.removeAt(idx);
  }

  amount(id: string): number {
    const fa = this.orderDetailsFA();
    return fa.value.filter(
      (p: any) => p.products_idproducts === id,
    ).length;
  }

  addIngredient(
    idproduct: string,
    idingredient: string,
    type: 0 | 1,
    checked: boolean,
    amount: number,
    name: string,
    price: number,
  ) {
    const fa = this.orderDetailsFA();
    const index = fa.value.findIndex(
      (p: any) =>
        p.products_idproducts === idproduct && p.amount === amount,
    );
    if (index === -1) return;

    const group = fa.at(index) as FormGroup;
    const notIng = group.get('not_ingredient') as FormArray;

    if (checked) {
      notIng.push(
        this.order.notIngredients(idingredient, type, name, price),
      );
    } else {
      const idx = notIng.value.findIndex(
        (i: any) =>
          i.ingredients_idingredients === idingredient &&
          i.type === type,
      );
      if (idx !== -1) notIng.removeAt(idx);
    }
  }

  filterExtraExceptions(
    idproduct: string,
    amount: number,
    type: 0 | 1,
  ): string[] {
    const fa = this.orderDetailsFA();
    const index = fa.value.findIndex(
      (p: any) =>
        p.products_idproducts === idproduct && p.amount === amount,
    );
    if (index === -1) return [];
    const group = fa.at(index) as FormGroup;
    return (group.get('not_ingredient') as FormArray).value
      .filter((i: any) => i.type === type)
      .map((i: any) => i.ingredients_idingredients);
  }

  ingredientsSelected(
    index: number,
    type: 0 | 1,
    name: string,
  ): boolean {
    const fa = this.orderDetailsFA();
    const group = fa.at(index) as FormGroup;
    const arr = (group.get('not_ingredient') as FormArray).value;
    return arr
      .filter((i: any) => i.type === type)
      .map((i: any) => i.name)
      .includes(name);
  }

  orderDetailsArray(): FormArray {
    return this.orderDetailsFA();
  }

  orderEmpty(): boolean {
    return this.orderDetailsArray().length === 0;
  }
}