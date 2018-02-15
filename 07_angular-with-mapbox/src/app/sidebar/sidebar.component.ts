import { Component, OnInit } from '@angular/core';
import {ShopService} from "../services/shop.service";
import {MapService} from "../services/map.service";

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  constructor(
    private mapService:MapService,
    private shopService:ShopService) {
  }

  ngOnInit() {
  }

  flyToStore(feature) {
    this.mapService.flyTo(feature.geometry.coordinates);
    this.mapService.createPopUp(feature);
    this.shopService.activateShop(feature.properties.id);
  }
}
