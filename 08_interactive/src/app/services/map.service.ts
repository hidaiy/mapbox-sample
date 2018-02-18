import {Injectable} from '@angular/core';
import * as mapboxgl from 'mapbox-gl';

@Injectable()
export class MapService {
  map: mapboxgl.Map = null;

  constructor() {
  }


  on(type: string, listener: Function): mapboxgl.Map {
    return this.map.on(type, listener);
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
    if (popUps.length > 0) {
      for (let i = 0; i < popUps.length; i++) {
        popUps[i].remove();
      }
    }

    const popup = new mapboxgl.Popup({closeOnClick: true})
      .setLngLat(feature.geometry.coordinates)
      .setHTML(`<h3>Sweetgreen</h3><h4>${feature.properties.address}</h4>`)
      .addTo(this.map);
  }
}
