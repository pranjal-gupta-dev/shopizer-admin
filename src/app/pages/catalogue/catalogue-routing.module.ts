import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CatalogueComponent } from './catalogue.component';
import { MarketplaceGuard } from '../shared/guards/marketplace.guard';

const routes: Routes = [{
  path: '',
  component: CatalogueComponent,
  children: [
    {
      path: 'categories',
      canActivate: [MarketplaceGuard],
      loadChildren: () => import('./categories/categories.module').then(m => m.CategoriesModule)
    },
    {
      path: 'products',
      loadChildren: () => import('./products/products.module').then(m => m.ProductsModule)
    },
    {
      path: 'brands',
      loadChildren: () => import('./brands/brands.module').then(m => m.BrandsModule)
    },
    {
      path: 'catalogues',
      loadChildren: () => import('./catalogues/catalogues.module').then(m => m.CataloguesModule)
    },
    {
      path: 'products-groups',
      loadChildren: () => import('./products-groups/products-groups.module').then(m => m.ProductsGroupsModule)
    },
    {
      path: 'options',
      loadChildren: () => import('./options/options.module').then(m => m.OptionsModule)
    },
    {
      path: 'types',
      loadChildren: () => import('./types/types.module').then(m => m.TypesModule)
    },
  ]
}];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CatalogueRoutingModule {
}
