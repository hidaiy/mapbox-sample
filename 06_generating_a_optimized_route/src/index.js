/**
 * Turf.jsで緯度経度からGeoJSONへ変換する。
 * 空のデータソースを用意して、後から動的にポイントをマップに表示する。
 */


import './style.css';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl.js';
import * as turf from '@turf/turf';

let truckLocation = [-83.093, 42.376];
let warehouseLocation = [-83.083, 42.363];
let lastQueryTime = 0;
let lastAtRestaurant = 0;
let keepTrack = [];
let currentSchedule = [];
let currentRoute = null;
let pointHopper = {};
let pause = true;
let speedFactor = 50;
let truckMarker = null;
let dropoffs = null;

// Add your access token
mapboxgl.accessToken = process.env.MAPBOX_TOKEN;

// Initialize a map
const map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/light-v9', // stylesheet location
    center: truckLocation, // starting position
    zoom: 12 // starting zoom
});


map.on('load', function () {
    let marker = document.createElement('div');
    marker.classList = 'truck';

    // Create a new marker
    truckMarker = new mapboxgl.Marker(marker)
        .setLngLat(truckLocation)
        .addTo(map);


    // 緯度経度からGeoJSONへ変換
    let warehouse = turf.featureCollection([turf.point(warehouseLocation)]);
    dropoffs = turf.featureCollection([]);


    // Create a circle layer
    map.addLayer({
        id: 'warehouse',
        type: 'circle',
        source: {
            data: warehouse,
            type: 'geojson'
        },
        paint: {
            'circle-radius': 20,
            'circle-color': 'white',
            'circle-stroke-color': '#3887be',
            'circle-stroke-width': 3
        }
    });

    // Create a symbol layer on top of circle layer
    map.addLayer({
        id: 'warehouse-symbol',
        type: 'symbol',
        source: {
            data: warehouse,
            type: 'geojson'
        },
        layout: {
            'icon-image': 'grocery-15',
            'icon-size': 1
        },
        paint: {
            'text-color': '#3887be'
        }
    });

    map.addLayer({
        id: 'dropoffs-symbol',
        type: 'symbol',
        source: {
            data: dropoffs,
            type: 'geojson'
        },
        layout: {
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-image': 'marker-15',
        }
    });

    // Listen for a click on the map
    map.on('click', function(e) {
        // When the map is clicked, add a new drop-off point
        // and update the `dropoffs-symbol` layer
        newDropoff(map.unproject(e.point));
        updateDropoffs(dropoffs);
    });

});


function newDropoff(coords) {
    // Store the clicked point as a new GeoJSON feature with
    // two properties: `orderTime` and `key`
    let pt = turf.point(
        [coords.lng, coords.lat],
        {
            orderTime: Date.now(),
            key: Math.random()
        }
    );
    dropoffs.features.push(pt);
}

function updateDropoffs(geojson) {
    map.getSource('dropoffs-symbol')
        .setData(geojson);
}





