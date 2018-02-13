import {Injectable} from '@angular/core';

@Injectable()
export class ShopService {

  shops: any;

  constructor() {
  }

  // load(path) {
  //   this.shops = require(path);
  //   this.shops.features.forEach((m, i) => {
  //     m.properties.id = i;
  //   });
  // }

  activateShop(id) {
    this.deactivateAll();
    const shop = this.shops.features.find(s => s.properties.id == id);
    shop.properties.active = true;
  }

  deactivateAll() {
    this.shops.features.forEach(s => {
      if (s.properties.active) {
        s.properties.active = false;
      }
    });
  }

}
