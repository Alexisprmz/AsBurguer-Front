import { Component, inject, ViewChild, AfterViewInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { ProviderService } from '../../services/provider.service';

@Component({
  selector: 'app-user-view',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    RouterLink,
    MatIcon,
  ],
  templateUrl: './user-view.component.html',
  styleUrl: './user-view.component.scss',
})
export class UserViewComponent implements AfterViewInit {
  displayedColumns: string[] = ['name', 'phone', 'rol'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);

  private _provider: ProviderService = inject(ProviderService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  roles = [
    { name: 'admin', value: 0 },
    { name: 'cajero', value: 1 },
    { name: 'cocinero', value: 2 },
    { name: 'cliente', value: 3 },
  ];

  async ngAfterViewInit() {
    const resp: any = await this._provider.request('GET', 'user/viewUsers');
    console.log('RESP USERS =>', resp);

    let users: any[] = [];

    if (Array.isArray(resp)) {
      users = resp;
    } else if (Array.isArray(resp?.msg)) {
      users = resp.msg;
    } else if (resp?.data && Array.isArray(resp.data)) {
      users = resp.data;
    }

    this.dataSource = new MatTableDataSource(users);
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (data, filter) => {
      const term = filter.trim().toLowerCase();
      return (
        (data.name || '').toLowerCase().includes(term) ||
        (data.phone || '').toLowerCase().includes(term) ||
        this.mapRol(data.rol).toLowerCase().includes(term)
      );
    };
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  mapRol(id: number): string {
    const rol = this.roles.find((r) => r.value === id);
    return rol ? rol.name : 'desconocido';
  }
}
