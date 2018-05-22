import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CreateComponent } from './create/create.component';
import { ListComponent } from './list/list.component';
import { PreviewComponent } from './preview/preview.component';
import { ColumnAddComponent } from './column-add/column-add.component';

const routes: Routes = [
  {
    path: 'create',
    component: CreateComponent,
    data: {
      title: '创建表格',
    },
  },
  {
    path: 'edit/:id',
    component: CreateComponent,
    data: {
      title: '创建表格',
    },
  },
  {
    path: 'list',
    component: ListComponent,
    data: {
      title: '所有表格',
    },
  },
  {
    path: 'preview/:id',
    component: PreviewComponent,
    data: {
      title: '预览表格',
    },
  },
  {
    path: 'column-add/:id',
    component: ColumnAddComponent,
    data: {
      title: '添加列',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TableBuilderRoutingModule {}
