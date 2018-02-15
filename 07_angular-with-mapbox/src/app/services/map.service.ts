import { Injectable } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';

@Injectable()
export class MapService {
  map:mapboxgl.Map = null;

  constructor() {
  }

  initializeMap(token, option) {
    (mapboxgl as any).accessToken = token;
    this.map = new mapboxgl.Map(option);

  }

  flyTo(coordinates) {
    this.map.flyTo({
      center: coordinates,
      zoom: 15
    });
  }

  createPopUp(feature) {
    const popUps = document.getElementsByClassName('mapboxgl-popup');
    // Check if there is already a popup on the map and if so, remove it
    if (popUps[0]) {
      popUps[0].remove();
    }

    const popup = new mapboxgl.Popup({closeOnClick: false})
      .setLngLat(feature.geometry.coordinates)
      .setHTML(`<h3>Sweetgreen</h3><h4>${feature.properties.address}</h4>`)
      .addTo(this.map);
  }
}
