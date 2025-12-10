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
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CurrencyPipe,
    RouterLink,
    MatSnackBarModule,
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
})
export class MenuComponent implements OnInit {
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

  showCart = false;

  async ngOnInit() {
    this.loading = true;
    try {
      const userStr = localStorage.getItem('user');

      if (userStr) {
        try {
          const user = JSON.parse(userStr);

          this.idusers = user.idusers || '';
          const rawRol = user.rol ?? 3;
          this.rol = Number(rawRol);
          console.log('ROL CARGADO =>', this.rol);
          console.log('USER CARGADO =>', user);
        } catch (parseError) {
          console.error('Error parseando usuario:', parseError);
        }
      }
      const response: any = await this.provider.request(
        'GET',
        'menu/viewIngredients',
      );

      if (Array.isArray(response)) {
        this.menu = response;
      } else if (Array.isArray(response?.msg)) {
        this.menu = response.msg as Product[];
      } else {
        this.menu = [];
      }

      if (this.rol === 3 && this.idusers) {
        await this.loadFavorites();
      }
      this.updateCartVisibility();
    } catch (e) {
      console.error(e);
      this.error = 'Error al cargar menú';
    } finally {
      this.loading = false;
    }
  }

  async loadFavorites(): Promise<void> {
    if (this.loadingFavorites) return;
    if (!this.idusers) return;

    this.loadingFavorites = true;
    console.log('[MENU] Cargando favoritos...');

    try {
      const favoritesList: FavoriteProduct[] =
        await this.provider.getFavorites(this.idusers);

      console.log('[MENU] favoritesList recibido:', favoritesList);

      this.favorites = favoritesList
        .map((fav) => {
          const id = String(fav.products_idproducts || fav.idproducts);
          return id;
        })
        .filter((id) => id && id !== 'undefined');

      console.log('[MENU] Favoritos cargados (IDs):', this.favorites);
    } catch (e) {
      console.error('[MENU] Error al cargar favoritos:', e);
      this.favorites = [];
    } finally {
      this.loadingFavorites = false;
    }
  }

  isFavorite(idProduct: string): boolean {
    const isFav = this.favorites.includes(String(idProduct));
    if (isFav) {
      console.log('[MENU] Es favorito:', idProduct);
    }
    return isFav;
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

    const id = String(idProduct);
    const wasFavorite = this.isFavorite(id);

    console.log('[MENU] Toggle favorito:', id, 'Era favorito:', wasFavorite);

    // Optimista
    if (!wasFavorite) {
      this.favorites.push(id);
    } else {
      this.favorites = this.favorites.filter((pId) => pId !== id);
    }

    const expectedAction: 'added' | 'removed' = wasFavorite
      ? 'removed'
      : 'added';

    try {
      const res: ToggleFavoriteResponse = await this.provider.toggleFavorite(
        this.idusers,
        id,
      );

      console.log('[MENU] Respuesta del servidor:', res);

      const actualAction = res.action;

      if (actualAction !== expectedAction) {
        console.warn(
          '[MENU] Acción no coincide. Esperada:',
          expectedAction,
          'Real:',
          actualAction,
        );

        if (actualAction === 'added' && !this.favorites.includes(id)) {
          this.favorites.push(id);
        } else if (actualAction === 'removed' && this.favorites.includes(id)) {
          this.favorites = this.favorites.filter((pId) => pId !== id);
        }
      }

      if (res.msg) {
        this.snackBar.open(res.msg, 'Cerrar', { duration: 2000 });
      }

      console.log('[MENU] Favoritos actualizados:', this.favorites);
    } catch (error) {
      console.error('[MENU] Error en toggleFavorite:', error);

      // Rollback
      if (!wasFavorite) {
        this.favorites = this.favorites.filter((pId) => pId !== id);
      } else {
        this.favorites.push(id);
      }

      this.snackBar.open('Error al actualizar favoritos', 'Cerrar', {
        duration: 3000,
      });
    } finally {
      this.loadingFavorites = false;
    }
  }

  updateCartVisibility() {
    this.showCart =
      this.orderDetailsArray().controls.length > 0 && !this.orderEmpty();
  }

  filterByCategory(id: number): Product[] {
    return this.menu.filter((p) => p.category_idcategory === id);
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

  orderDetailsArray(): FormArray {
    return this.order.formOrder.get('order_details') as FormArray;
  }

  addProduct(id: string, price: number, name: string, cat: string) {
    this.orderDetailsArray().push(this.order.orderDetails(id, price, name, cat));
    this.updateCartVisibility();
  }

  removeProduct(id: string) {
    const fa = this.orderDetailsArray();
    const idx = fa.value.findIndex((p: any) => p.products_idproducts === id);
    if (idx !== -1) {
      fa.removeAt(idx);
      this.updateCartVisibility();
    }
  }

  amount(id: string): number {
    const fa = this.orderDetailsArray();
    return fa.value.filter((p: any) => p.products_idproducts === id).length;
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
    const fa = this.orderDetailsArray();
    const index = fa.value.findIndex(
      (p: any) => p.products_idproducts === idproduct && p.amount === amount,
    );
    if (index === -1) return;

    const group = fa.at(index) as FormGroup;
    const notIng = group.get('not_ingredient') as FormArray;

    if (checked) {
      notIng.push(this.order.notIngredients(idingredient, type, name, price));
    } else {
      const idx = notIng.value.findIndex(
        (i: any) =>
          i.ingredients_idingredients === idingredient && i.type === type,
      );
      if (idx !== -1) notIng.removeAt(idx);
    }
  }

  filterExtraExceptions(idproduct: string, amount: number, type: 0 | 1): string[] {
    const fa = this.orderDetailsArray();
    const index = fa.value.findIndex(
      (p: any) => p.products_idproducts === idproduct && p.amount === amount,
    );
    if (index === -1) return [];
    const group = fa.at(index) as FormGroup;
    return (group.get('not_ingredient') as FormArray).value
      .filter((i: any) => i.type === type)
      .map((i: any) => i.ingredients_idingredients);
  }

  ingredientsSelected(index: number, type: 0 | 1, name: string): boolean {
    const fa = this.orderDetailsArray();
    const group = fa.at(index) as FormGroup;
    const arr = (group.get('not_ingredient') as FormArray).value;
    return arr
      .filter((i: any) => i.type === type)
      .map((i: any) => i.name)
      .includes(name);
  }

  orderEmpty(): boolean {
    return this.orderDetailsArray().controls.length === 0;
  }
}
