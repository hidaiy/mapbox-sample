import {Component, OnInit} from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import {environment} from '../environments/environment'
import {MapService} from "./services/map.service";
import {ShopService} from "./services/shop.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';

  constructor(private mapService: MapService,
              private shopService: ShopService) {
  }

  ngOnInit() {
    this.mapService.initializeMap(
      environment.mapbox.token,
      {
        container: 'map', // container id
        style: 'mapbox://styles/yhidai/cjdb75z5y1ekt2smtkd63o61p', // stylesheet location
        center: [-77.034084, 38.909671],
        zoom: 13 // starting zoom
      });


    const shops = require('./sweetgreen.json');
    shops.features.forEach((m, i) => {
      m.properties.id = i;
    });
    this.shopService.shops = shops;


    this.mapService.map.on('load', (e) => {
      this.mapService.map.addSource('places', {
        type: 'geojson',
        data: this.shopService.shops
      });

      this.buildStoreMarkers(this.shopService.shops);
    });
  }


  private buildStoreMarkers(shops) {
    shops.features.forEach((marker) => {
      // Create a div element for the marker
      const el = document.createElement('div');
      // Add a class called 'marker' to each div
      el.className = 'marker';
      // By default the image for your custom marker will be anchored
      // by its center. Adjust the position accordingly
      // Create the custom markers, set their position, and add to map
      new mapboxgl.Marker(el, {offset: [0, -23]})
        .setLngLat(marker.geometry.coordinates)
        .addTo(this.mapService.map);


      el.addEventListener('click', (e) => {
        e.stopPropagation();
        // 選択したポイントを中央に表示
        this.mapService.flyTo(marker.geometry.coordinates);
        // ポップアップの作成
        this.mapService.createPopUp(marker);
        // サイドバーのショップをアクティブに
        this.shopService.activateShop(marker.properties.id);
      });
    });
  }
}
