/**
 * 検索ボックスを配置する。
 * 検索した場所にポイントを表示する。
 * Turf.jsで検索したポイントからストアーへの距離を調べる。
 * ストアーのリストを検索した距離の近い順にソートする。
 * 調べた距離をストアーのリストに表示する。
 */

import './style.css';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from 'mapbox-gl-geocoder';
import stores from './sweetgreen.json';
import * as turf from '@turf/turf';

let id = 0;
stores.features.forEach((m) => {
    m.properties.id = id;
    m.properties.distance = 0;
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


mapboxgl.accessToken = process.env.MAPBOX_TOKEN;
let map = new mapboxgl.Map({
    // container id specified in the HTML
    container: 'map',
    // style URL
    style: 'mapbox://styles/mapbox/light-v9',
    // initial position in [lon, lat] format
    center: [-77.034084, 38.909671],
    // initial zoom
    zoom: 14
});

// console.log(stores);


map.on('load', function (e) {
    map.addSource('places', {
        type: 'geojson',
        data: stores
    });

    buildStoreMarkers(stores);

    buildLocationList(stores);

    buildSearchBox(map);

    map.addSource('single-point', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: [] // Notice that initially there are no features
        }
    });

    map.addLayer({
        id: 'point',
        source: 'single-point',
        type: 'circle',
        paint: {
            'circle-radius': 10,
            'circle-color': '#007cbf',
            'circle-stroke-width': 3,
            'circle-stroke-color': '#fff'
        }
    });



});

let selectedFeatureIndex;

// Add an event listener for when a user clicks on the map
map.on('click', function (e) {
    // Query all the rendered points in the view
    let features = map.queryRenderedFeatures(e.point, {layers: ['locations']});
    if (features.length) {
        let clickedPoint = features[0];
        // 1. Fly to the point
        flyToStore(clickedPoint);
        // 2. Close all other popups and display popup for clicked store
        createPopUp(clickedPoint);
        // 3. Highlight listing in sidebar (and remove highlight for all other listings)
        let activeItem = document.getElementsByClassName('active');
        if (activeItem[0]) {
            activeItem[0].classList.remove('active');
        }
        // Find the index of the store.features that corresponds to the clickedPoint that fired the event listener
        let selectedFeature = clickedPoint.properties.address;

        for (let i = 0; i < stores.features.length; i++) {
            if (stores.features[i].properties.address === selectedFeature) {
                selectedFeatureIndex = i;
            }
        }
        // Select the correct list item using the found index and add the active class
        let listing = document.getElementById('listing-' + selectedFeatureIndex);
        listing.classList.add('active');
    }
});

function buildStoreMarkers(stores) {
    stores.features.forEach((marker) => {
        // Create a div element for the marker
        let el = document.createElement('div');
        // Add a class called 'marker' to each div
        el.className = 'marker';
        // By default the image for your custom marker will be anchored
        // by its center. Adjust the position accordingly
        // Create the custom markers, set their position, and add to map
        new mapboxgl.Marker(el, {offset: [0, -23]})
            .setLngLat(marker.geometry.coordinates)
            .addTo(map);


        el.addEventListener('click', function (e) {
            let activeItem = document.getElementsByClassName('active');
            // 1. Fly to the point
            flyToStore(marker);
            // 2. Close all other popups and display popup for clicked store
            createPopUp(marker);
            // 3. Highlight listing in sidebar (and remove highlight for all other listings)
            e.stopPropagation();
            if (activeItem[0]) {
                activeItem[0].classList.remove('active');
            }
            let listing = document.getElementById('listing-' + marker.properties.id);
            listing.classList.add('active');
        });
    });
}


function buildLocationList(data) {
    // Iterate through the list of stores
    for (let i = 0; i < data.features.length; i++) {
        let currentFeature = data.features[i];
        // Shorten data.feature.properties to just `prop` so we're not
        // writing this long form over and over again.
        let prop = currentFeature.properties;
        // Select the listing container in the HTML and append a div
        // with the class 'item' for each store
        let listings = document.getElementById('listings');
        let listing = listings.appendChild(document.createElement('div'));
        listing.className = 'item';
        listing.id = 'listing-' + prop.id;

        // Create a new link with the class 'title' for each store
        // and fill it with the store address
        let link = listing.appendChild(document.createElement('a'));
        link.href = '#';
        link.className = 'title';
        link.dataPosition = i;
        link.innerHTML = prop.address;

        // Create a new div with the class 'details' for each store
        // and fill it with the city and phone number
        let details = listing.appendChild(document.createElement('div'));
        details.innerHTML = prop.city;
        if (prop.phone) {
            details.innerHTML += ' &middot; ' + prop.phoneFormatted;
        }



        if (prop.distance) {
            let roundedDistance = Math.round(prop.distance * 100) / 100;
            details.innerHTML += '<p><strong>' + roundedDistance + ' miles away</strong></p>';
        }


        // Add an event listener for the links in the sidebar listing
        link.addEventListener('click', function (e) {
            // Update the currentFeature to the store associated with the clicked link
            let clickedListing = data.features[this.dataPosition];
            // 1. Fly to the point associated with the clicked link
            flyToStore(clickedListing);
            // 2. Close all other popups and display popup for clicked store
            createPopUp(clickedListing);
            // 3. Highlight listing in sidebar (and remove highlight for all other listings)
            let activeItem = document.getElementsByClassName('active');
            if (activeItem[0]) {
                activeItem[0].classList.remove('active');
            }
            this.parentNode.classList.add('active');
        });


    }
}

function buildSearchBox(map) {
    const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        bbox: [-77.210763, 38.803367, -76.853675, 39.052643]
    });
    map.addControl(geocoder, 'top-left');


    // 検索入力欄で選択した結果をマップに表示する。
    geocoder.on('result', function(ev) {
        const searchResult = ev.result.geometry;
        map.getSource('single-point').setData(searchResult);


        // 検索結果のポイントからの距離を、ストアーのGeoJSONに追加
        const options = { units: 'miles' };
        stores.features.forEach(function(store) {
            Object.defineProperty(store.properties, 'distance', {
                value: turf.distance(searchResult, store.geometry, options),
                writable: true,
                enumerable: true,
                configurable: true
            });
        });

        // 検索結果からストアーへの距離によって、ストアーのリストをソートする。
        stores.features.sort(function(a, b) {
            // console.log('a:', a.properties);
            // console.log('b:', b.properties);
            if (a.properties.distance > b.properties.distance) {
                return 1;
            }
            if (a.properties.distance < b.properties.distance) {
                return -1;
            }
            // a must be equal to b
            return 0;
        });

        // domからストアーのリストを削除して再作成する。
        let listings = document.getElementById('listings');
        while (listings.firstChild) {
            listings.removeChild(listings.firstChild);
        }

        buildLocationList(stores);
    });
}

/**
 * 選択したストアーをマップの中心に表示する
 * @param currentFeature
 */
function flyToStore(currentFeature) {
    map.flyTo({
        center: currentFeature.geometry.coordinates,
        zoom: 15
    });
}

/**
 * ポップアップを表示する
 * @param currentFeature
 */
function createPopUp(currentFeature) {
    let popUps = document.getElementsByClassName('mapboxgl-popup');
    // Check if there is already a popup on the map and if so, remove it
    if (popUps[0]) popUps[0].remove();

    let popup = new mapboxgl.Popup({closeOnClick: false})
        .setLngLat(currentFeature.geometry.coordinates)
        .setHTML('<h3>Sweetgreen</h3>' +
            '<h4>' + currentFeature.properties.address + '</h4>')
        .addTo(map);
}
