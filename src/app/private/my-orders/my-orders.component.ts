import { Component, inject, OnInit } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProviderService } from '../../services/provider.service';
import { LocalstorageService } from '../../services/localstorage.service';
import { OrderDetailComponent } from '../order-detail/order-detail.component';
import { CurrencyPipe } from '@angular/common';
import { WebSocketsService } from '../../services/web-sockets.service';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [MatTabsModule, MatDialogModule, MatTableModule, CurrencyPipe],
  templateUrl: './my-orders.component.html',
  styleUrl: './my-orders.component.scss',
})
export class MyOrdersComponent implements OnInit {
  private _provider: ProviderService = inject(ProviderService);
  private _localStorage: LocalstorageService = inject(LocalstorageService);
  private dialog: MatDialog = inject(MatDialog);
  private _wsService: WebSocketsService = inject(WebSocketsService);

  orders: any[] = [];
  userId: string = '';

  status = [
    { name: 'Pendientes', value: 0 },
    { name: 'En Proceso', value: 1 },
    { name: 'Listas', value: 2 },
    { name: 'Entregadas', value: 3 },
    { name: 'Canceladas', value: 4 },
  ];

  displayedColumns: string[] = ['total', 'comments', 'function'];

  async ngOnInit() {
    try {
      const user = this._localStorage.getItem('user');
      this.userId = user?.idusers || '';

      if (!this.userId) {
        console.warn('No se encontró userId en localStorage');
        return;
      }

      console.log('Cargando órdenes para userId:', this.userId);

      const resp: any = await this._provider.request(
        'GET',
        'order/myOrders',
        { iduser: this.userId },
      );
      console.log('RESP myOrders =>', resp);

      if (Array.isArray(resp)) {
        this.orders = resp;
      } else if (Array.isArray(resp?.msg)) {
        this.orders = resp.msg;
      } else if (resp?.data && Array.isArray(resp.data)) {
        this.orders = resp.data;
      } else {
        this.orders = [];
      }

      console.log('Órdenes cargadas normalizadas:', this.orders);

      this.orders = this.orders.map((order) => ({
        ...order,
        comments: order.comments || '',
      }));
    } catch (error) {
      console.error('Error cargando órdenes:', error);
      this.orders = [];
    }

    this.listenSocket();
  }

  filterByStatus(status: number): any[] {
    if (!Array.isArray(this.orders)) {
      return [];
    }
    return this.orders.filter((order: any) => order.status == status);
  }

  openOrderDetailDialog(order: any): void {
    console.log('Abriendo detalles de orden:', order);
    this.dialog.open(OrderDetailComponent, {
      data: order,
      width: '600px',
      maxHeight: '90vh',
    });
  }

  private listenSocket(): void {
    this._wsService.listen('comanda').subscribe((data: any) => {
      console.log('Socket comanda recibido:', data);

      if (!Array.isArray(this.orders)) {
        this.orders = [];
      }

      const existingOrder = this.orders.find(
        (item) => item.idorder === data.idorder,
      );

      if (existingOrder) {
        this.orders = this.orders.filter(
          (item) => item.idorder != data.idorder,
        );

        const updatedOrder = {
          ...existingOrder,
          ...data,
          comments: data.comments || existingOrder.comments || '',
          client: existingOrder.client,
        };

        this.orders.unshift(updatedOrder);

        console.log('Orden actualizada en lista:', updatedOrder);
      }
    });
  }
}
