import { Component, inject } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { ProviderService } from '../../services/provider.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { OrderDetailComponent } from '../order-detail/order-detail.component';
import { DialogCompleteComponent } from '../dialog-complete/dialog-complete.component';
import { DialogCancelComponent } from '../dialog-cancel/dialog-cancel.component';
import { WebSocketsService } from '../../services/web-sockets.service';

@Component({
  selector: 'app-orders-view',
  standalone: true,
  imports: [MatTabsModule, MatDialogModule, MatTableModule],
  templateUrl: './orders-view.component.html',
  styleUrl: './orders-view.component.scss'
})
export class OrdersViewComponent {

  private _provider: ProviderService = inject(ProviderService);
  private dialog: MatDialog = inject(MatDialog);
  private _wsService: WebSocketsService = inject(WebSocketsService);

  order: any[] = [];

  status = [
    { name: 'Activas', value: 0 },
    { name: 'En proceso', value: 1 },
    { name: 'Ordenes Listas', value: 2 },
    { name: 'Completadas', value: 3 },
    { name: 'Canceladas', value: 4 },
  ];

  displayedColumns = ['client', 'total', 'comments', 'function'];

  async ngOnInit() {
    const resp: any = await this._provider.request('GET', 'order/viewOrders');

    if (Array.isArray(resp)) {
      this.order = resp;
    } else if (Array.isArray(resp?.msg)) {
      this.order = resp.msg;
    } else if (resp?.data && Array.isArray(resp.data)) {
      this.order = resp.data;
    } else {
      this.order = [];
    }

    this.listenSocket();
  }

  filterByStatus(status: number) {
    if (!Array.isArray(this.order)) {
      return [];
    }
    return this.order.filter((eachOrder: any) => eachOrder.status == status);
  }

  openOrderDetailDialog(order: any) {
    this.dialog.open(OrderDetailComponent, { data: order });
  }

  openConfirmDialog(order: any) {
    this.dialog.open(DialogCompleteComponent, { data: order });
    console.log(order);
  }

  openCancelDialog(order: any) {
    this.dialog.open(DialogCancelComponent, { data: order });
  }

  listenSocket() {
    this._wsService.listen('comanda').subscribe((data: any) => {
      console.log('SOCKET comanda =>', data);

      // Asegurar array antes de operar
      if (!Array.isArray(this.order)) {
        this.order = [];
      }

      this.order = this.order.filter((item) => item.idorder != data.idorder);
      this.order.unshift(data);
    });
  }
}
