import { Component, ViewChild, inject } from '@angular/core';
import { MatTable, MatTableModule } from '@angular/material/table';
import {
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { ProviderService } from '../../services/provider.service';
import { DialogComponent } from '../dialog/dialog.component';
import { WebSocketsService } from '../../services/web-sockets.service';
import { LocalstorageService } from '../../services/localstorage.service';
import { OrderDetailComponent } from '../order-detail/order-detail.component';

@Component({
  selector: 'app-chef-order-view',
  standalone: true,
  imports: [MatTableModule, MatDialogModule],
  templateUrl: './chef-order-view.component.html',
  styleUrl: './chef-order-view.component.scss',
})
export class ChefOrderViewComponent {
  private _provider: ProviderService = inject(ProviderService);
  private dialog: MatDialog = inject(MatDialog);
  private _wsService: WebSocketsService = inject(WebSocketsService);
  private _localStorage: LocalstorageService = inject(LocalstorageService);

  @ViewChild('chefTable') chefTable!: MatTable<any>;

  displayedColumns: string[] = ['client', 'comments', 'function'];
  order: any[] = [];
  orderExist: any[] = [];

  async ngOnInit() {
    this.listenSocket();

    // Cargar órdenes de cocina
    const respOrders: any = await this._provider.request('GET', 'order/viewOrders');
    if (Array.isArray(respOrders)) {
      this.order = respOrders;
    } else if (Array.isArray(respOrders?.msg)) {
      this.order = respOrders.msg;
    } else if (respOrders?.data && Array.isArray(respOrders.data)) {
      this.order = respOrders.data;
    } else {
      this.order = [];
    }

    // Última orden del usuario logueado
    const user = this._localStorage.getItem('user');
    const idusers = user?.idusers;

    if (!idusers) {
      console.warn('No se encontró usuario en sesión para lastOrder');
      return;
    }

    const respLast: any = await this._provider.request(
      'GET',
      'order/lastOrder',
      { iduser: idusers },
    );

    if (Array.isArray(respLast)) {
      this.orderExist = respLast;
    } else if (Array.isArray(respLast?.msg)) {
      this.orderExist = respLast.msg;
    } else if (respLast?.data && Array.isArray(respLast.data)) {
      this.orderExist = respLast.data;
    } else {
      this.orderExist = [];
    }

    if (this.orderExist?.[0]) {
      this._localStorage.setItem('lastOrder', this.orderExist[0]);
      console.log('lastOrder =>', this.orderExist[0]);

      if (this.orderExist[0].idorder) {
        this.dialog.open(OrderDetailComponent, {
          data: this._localStorage.getItem('lastOrder'),
        });
      }
    }
  }

  filterByStatus(): any[] {
    if (!Array.isArray(this.order)) {
      return [];
    }
    return this.order.filter((eachOrder: any) => eachOrder.status == 0);
  }

  openConfirmDialog(order: any) {
    this.dialog.open(DialogComponent, { data: order });
  }

  listenSocket() {
    this._wsService.listen('comanda').subscribe((data: any) => {
      console.log('SOCKET cocina =>', data);

      if (!Array.isArray(this.order)) {
        this.order = [];
      }

      this.order = this.order.filter((item) => item.idorder != data.idorder);
      this.order.unshift(data);

      if (this.chefTable) {
        this.chefTable.renderRows();
      }
    });
  }
}
