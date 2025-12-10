import { Component, ViewChild, inject } from '@angular/core';
import { ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ProviderService } from '../../services/provider.service';
import { WebSocketsService } from '../../services/web-sockets.service';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-dash-admin',
  standalone: true,
  imports: [BaseChartDirective, CurrencyPipe],
  templateUrl: './dash-admin.component.html',
  styleUrl: './dash-admin.component.scss',
})
export class DashAdminComponent {
  private _provider: ProviderService = inject(ProviderService);
  private _wsService: WebSocketsService = inject(WebSocketsService);

  products: any = null;
  clients: any = null;
  avg: any = null;  
  total: any = null; 
  sales: any = null;

  dataSales: ChartData<'bar'> = { labels: [], datasets: [] };
  dataProduct: ChartData<'bar'> = { labels: [], datasets: [] };
  dataClient: ChartData<'bar'> = { labels: [], datasets: [] };

  mesActual = new Date().getMonth() + 1;

  @ViewChild(BaseChartDirective) chartSales!: BaseChartDirective;

  async ngOnInit() {
    await this.Sales();
    await this.bestSeller();
    await this.bestClient();

    const totalResp: any = await this._provider.request('GET', 'graphics/totalSales');
    this.total = totalResp.msg ?? totalResp;

    const avgResp: any = await this._provider.request('GET', 'graphics/avgTime');
    this.avg = avgResp.msg ?? avgResp;

    this.listenGraphics();
  }

  async listenGraphics() {
    this._wsService.listen('grafica').subscribe((data: any) => {
      // Proteger accesos
      if (!this.dataSales?.datasets?.[0]?.data) return;
      if (!this.total) return;

      const index = (data.mes ?? 1) - 1;

      const btotal = parseInt(String(data.total ?? 0), 10);
      const atotal = Number(this.dataSales.datasets[0].data[index] ?? 0);

      this.dataSales.datasets[0].data[index] = btotal + atotal;
      this.total.total = Number(this.total.total ?? 0) + Number(data.total ?? 0);

      if (this.chartSales) {
        this.chartSales.update();
      }
    });
  }

  async Sales() {
    const resp: any = await this._provider.request('GET', 'graphics/sales');
    this.sales = resp.msg ?? resp;

    this.dataSales = {
      labels: this.sales.labels,
      datasets: [
        {
          data: this.sales.data,
          label: 'Total',
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(255, 159, 64, 0.2)',
            'rgba(255, 205, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(201, 203, 207, 0.2)',
          ],
        },
      ],
    };
  }

  async bestSeller() {
    const resp: any = await this._provider.request(
      'GET',
      'graphics/bestSeller',
      { mes: this.mesActual },
    );
    this.products = resp.msg ?? resp;

    this.dataProduct = {
      labels: this.products.labels,
      datasets: [
        {
          data: this.products.data,
          label: 'Cantidad',
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(255, 159, 64, 0.2)',
            'rgba(255, 205, 86, 0.2)',
          ],
        },
      ],
    };
  }

  async bestClient() {
    const resp: any = await this._provider.request('GET', 'graphics/bestClient');
    this.clients = resp.msg ?? resp;

    this.dataClient = {
      labels: this.clients.labels,
      datasets: [
        {
          data: this.clients.data,
          label: 'No. de compras',
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(255, 159, 64, 0.2)',
            'rgba(255, 205, 86, 0.2)',
          ],
        },
      ],
    };
  }
}
