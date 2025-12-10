import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ProviderService } from '../../services/provider.service';
import { Router } from '@angular/router';
import { WebSocketsService } from '../../services/web-sockets.service';
import { LocalstorageService } from '../../services/localstorage.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface OrderDialogData {
  idorder: string;
  client?: string;
  total?: number;
  comments?: string;
}

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [MatDialogModule],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.scss',
})
export class OrderDetailComponent {
  private _data = inject<OrderDialogData>(MAT_DIALOG_DATA);
  private _provider: ProviderService = inject(ProviderService);
  public _router: Router = inject(Router);
  private _wsService: WebSocketsService = inject(WebSocketsService);
  private _localStorage: LocalstorageService = inject(LocalstorageService);
  private _snackBar: MatSnackBar = inject(MatSnackBar);

  orderDetails: any[] = [];

  async ngOnInit() {
    console.log('DATA DIALOG =>', this._data);

    const resp: any = await this._provider.request(
      'GET',
      'order/viewOrder',
      { idorder: this._data.idorder },
    );

    if (Array.isArray(resp)) {
      this.orderDetails = resp;
    } else if (Array.isArray(resp?.msg)) {
      this.orderDetails = resp.msg;
    } else if (resp?.data && Array.isArray(resp.data)) {
      this.orderDetails = resp.data;
    } else {
      this.orderDetails = [];
    }

    console.log('orderDetails =>', this.orderDetails);
  }

  async updateStatus() {
    const user = this._localStorage.getItem('user');
    const idusers = user?.idusers;

    if (!idusers) {
      this._snackBar.open('No se encontró usuario en sesión', '', {
        duration: 3000,
        verticalPosition: 'top',
      });
      return;
    }

    await this._provider.request('PUT', 'order/updateStatus', {
      status: 2,
      idorder: this._data.idorder,
      users_idusers: idusers,
    });

    this._snackBar.open('Pedido actualizado a orden lista', '', {
      duration: 3000,
      verticalPosition: 'top',
    });

    console.log('DATA para socket =>', this._data);

    const mes = this.orderDetails?.[0]?.mes ?? null;

    const nStatus = {
      idorder: this._data.idorder,
      client: this._data.client ?? this.orderDetails?.[0]?.client ?? '',
      total: this._data.total ?? this.orderDetails?.[0]?.total ?? 0,
      mes,
      comments: this._data.comments ?? this.orderDetails?.[0]?.comments ?? '',
      status: 2,
      users_idusers: idusers,
    };
    console.log('nStatus =>', nStatus);

    await this._wsService.request('comandas', nStatus);
  }
}
