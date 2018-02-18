import {Component, OnInit} from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import {environment} from '../environments/environment'
import {MapService} from './services/map.service';
import {ShopService} from './services/shop.service';
import {Feature, FeatureCollection, GeoJsonProperties, Point} from 'geojson';
import GeoJSONSource = mapboxgl.GeoJSONSource;
import GeoJSONGeometry = mapboxgl.GeoJSONGeometry;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

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


      this.mapService.map.addLayer({
        id: 'shop-label',
        type: 'symbol',
        source: 'places',
        layout: {
          // 'icon-image': 'restaurant-15',
          'text-field': '{address}', // property.addressを参照する
          'text-size': 13,
        }
      });

      this.buildStoreMarkers(this.shopService.shops);
      // this.buildPopup(this.shopService.shops);
    });

    this.mapService.on('click', (e) => {
      console.log(e);

      const features: GeoJSON.Feature<GeoJSONGeometry>[] = this.mapService.map.queryRenderedFeatures(e.point, {layers: ['shop-label']});
      if (features.length === 0) {
        return;
      }
      const feature = features[0];
      console.log(feature);

      const popup = new mapboxgl.Popup({closeOnClick: true, offset: [0, 40]})
        .setLngLat(e.lngLat)
        .setHTML(`<p>${e.lngLat}</p><p>${feature.properties.phoneFormatted}</p>`)
        .addTo(this.mapService.map);
    });
  }

  private buildPopup(shops) {
    shops.features.forEach((marker) => {
      const m = new mapboxgl.Popup({offset: [0, 0]})
        .setLngLat(marker.geometry.coordinates)
        .setHTML(`<p>${marker.properties.address}</p>`)
        .addTo(this.mapService.map);
    });
  }

  private buildStoreMarkers(shops: FeatureCollection<Point, GeoJsonProperties>) {
    shops.features.forEach((feature: Feature<Point, GeoJsonProperties>) => {
      // Create a div element for the marker
      const el = document.createElement('div');
      // Add a class called 'marker' to each div
      el.className = 'marker';
      // By default the image for your custom marker will be anchored
      // by its center. Adjust the position accordingly
      // Create the custom markers, set their position, and add to map
      const marker = new mapboxgl.Marker(el, {offset: [0, -23]})
        .setLngLat(feature.geometry.coordinates)
        .addTo(this.mapService.map);

      // this.mapService.map.addLayer({
      //   id: marker.properties.address,
      //   type: 'symbol',
      //   source: marker.geometry,
      //   layout: {
      //     'text-field': marker.properties.address,
      //     'text-size': 10,
      //   }
      // });

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        // 選択したポイントを中央に表示
        this.mapService.flyTo(feature.geometry.coordinates);
        // ポップアップの作成
        this.mapService.createPopUp(feature);
        // サイドバーのショップをアクティブに
        this.shopService.activateShop(feature.properties.id);
      });
    });
  }
}
