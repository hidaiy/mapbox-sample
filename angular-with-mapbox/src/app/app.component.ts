import {Component, OnInit} from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import {environment} from '../environments/environment'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';
  map: mapboxgl.Map;

  ngOnInit() {
    (mapboxgl as any).accessToken = environment.mapbox.token;

    this.map = new mapboxgl.Map({
      container: 'map', // container id
      // style: 'mapbox://styles/mapbox/light-v9', // stylesheet location
      style: 'mapbox://styles/yhidai/cjdb75z5y1ekt2smtkd63o61p', // stylesheet location
      center: [-77.034084, 38.909671],
      // center: environment.mapbox.initialLocation, // starting position
      zoom: 13 // starting zoom
    });


    const stores = require('./sweetgreen.json');

    let id = 0;
    stores.features.forEach((m) => {
      m.properties.id = id;
      id++;
    });


    // This will let you use the .remove() function later on
    if (!('remove' in Element.prototype)) {
      Element.prototype.remove = function () {
        if (this.parentNode) {
          this.parentNode.removeChild(this);
        }
      };
    }


    this.map.on('load', (e) => {
      this.map.addSource('places', {
        type: 'geojson',
        data: stores
      });

      this.buildStoreMarkers(stores);

      this.buildLocationList(stores);
    });

    let selectedFeatureIndex;

// Add an event listener for when a user clicks on the map
    this.map.on('click', (e) => {
      // Query all the rendered points in the view
      const features = this.map.queryRenderedFeatures(e.point, {layers: ['locations']});
      if (features.length) {
        const clickedPoint = features[0];
        // 1. Fly to the point
        this.flyToStore(clickedPoint);
        // 2. Close all other popups and display popup for clicked store
        this.createPopUp(clickedPoint);
        // 3. Highlight listing in sidebar (and remove highlight for all other listings)
        const activeItem = document.getElementsByClassName('active');
        if (activeItem[0]) {
          activeItem[0].classList.remove('active');
        }
        // Find the index of the store.features that corresponds to the clickedPoint that fired the event listener
        const selectedFeature = clickedPoint.properties.address;

        for (let i = 0; i < stores.features.length; i++) {
          if (stores.features[i].properties.address === selectedFeature) {
            selectedFeatureIndex = i;
          }
        }
        // Select the correct list item using the found index and add the active class
        const listing = document.getElementById('listing-' + selectedFeatureIndex);
        listing.classList.add('active');
      }
    });
  }

  constructor() {
  }


  buildStoreMarkers(stores) {
    stores.features.forEach((marker) => {
      // Create a div element for the marker
      const el = document.createElement('div');
      // Add a class called 'marker' to each div
      el.className = 'marker';
      // By default the image for your custom marker will be anchored
      // by its center. Adjust the position accordingly
      // Create the custom markers, set their position, and add to map
      new mapboxgl.Marker(el, {offset: [0, -23]})
        .setLngLat(marker.geometry.coordinates)
        .addTo(this.map);


      el.addEventListener('click', (e) => {
        const activeItem = document.getElementsByClassName('active');
        // 1. Fly to the point
        this.flyToStore(marker);
        // 2. Close all other popups and display popup for clicked store
        this.createPopUp(marker);
        // 3. Highlight listing in sidebar (and remove highlight for all other listings)
        e.stopPropagation();
        if (activeItem[0]) {
          activeItem[0].classList.remove('active');
        }
        const listing = document.getElementById('listing-' + marker.properties.id);
        console.log(marker);
        console.log(listing);
        listing.classList.add('active');
      });
    });
  }


  buildLocationList(data) {
    // Iterate through the list of stores
    for (let i = 0; i < data.features.length; i++) {
      const currentFeature = data.features[i];
      // Shorten data.feature.properties to just `prop` so we're not
      // writing this long form over and over again.
      const prop = currentFeature.properties;
      // Select the listing container in the HTML and append a div
      // with the class 'item' for each store
      const listings = document.getElementById('listings');
      const listing = listings.appendChild(document.createElement('div'));
      listing.className = 'item';
      listing.id = 'listing-' + prop.id;

      // Create a new link with the class 'title' for each store
      // and fill it with the store address
      const link = listing.appendChild(document.createElement('a'));
      link.href = '#';
      link.className = 'title';
      link.dataPosition = i;
      link.innerHTML = prop.address;

      // Create a new div with the class 'details' for each store
      // and fill it with the city and phone number
      const details = listing.appendChild(document.createElement('div'));
      details.innerHTML = prop.city;
      if (prop.phone) {
        details.innerHTML += ' &middot; ' + prop.phoneFormatted;
      }

      const _this = this;

      // Add an event listener for the links in the sidebar listing
      link.addEventListener('click', function (e) {
        // Update the currentFeature to the store associated with the clicked link
        const clickedListing = data.features[this.dataPosition];
        // 1. Fly to the point associated with the clicked link
        _this.flyToStore(clickedListing);
        // 2. Close all other popups and display popup for clicked store
        _this.createPopUp(clickedListing);
        // 3. Highlight listing in sidebar (and remove highlight for all other listings)
        const activeItem = document.getElementsByClassName('active');
        if (activeItem[0]) {
          activeItem[0].classList.remove('active');
        }
        this.parentNode.classList.add('active');
      });


    }
  }

  flyToStore(currentFeature) {
    this.map.flyTo({
      center: currentFeature.geometry.coordinates,
      zoom: 15
    });
  }

  createPopUp(currentFeature) {
    const popUps = document.getElementsByClassName('mapboxgl-popup');
    // Check if there is already a popup on the map and if so, remove it
    if (popUps[0]) {
      popUps[0].remove();
    }

    const popup = new mapboxgl.Popup({closeOnClick: false})
      .setLngLat(currentFeature.geometry.coordinates)
      .setHTML('<h3>Sweetgreen</h3>' +
        '<h4>' + currentFeature.properties.address + '</h4>')
      .addTo(this.map);
  }

}
}
