/**
 * Turf.jsで緯度経度からGeoJSONへ変換する。
 * 空のデータソースを用意して、後から動的にポイントをマップに表示する。
 */


import './style.css';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl.js';
import * as turf from '@turf/turf';
import $ from 'jquery';

// let truckLocation = [-83.093, 42.376];
let truckLocation = [139.7369922874633, 35.679585420543944];
// let warehouseLocation = [-83.083, 42.363];
let warehouseLocation = [139.76457759207517, 35.6858465902274];
let lastQueryTime = 0;
let lastAtRestaurant = 0;
let keepTrack = [];
let currentSchedule = [];
let currentRoute = null;
let pointHopper = {};
let pause = true;
let speedFactor = 50;
let truckMarker = null;
let dropoffs = turf.featureCollection([]); // FeatureCollection
let nothing = turf.featureCollection([]);

const MAXIMUM_NUMBER_OF_POINTS = 12;

// Add your access token
mapboxgl.accessToken = process.env.MAPBOX_TOKEN;

// Initialize a map
const map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/light-v9', // stylesheet location
    center: truckLocation, // starting position
    zoom: 13 // starting zoom
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




    // 通過点のレイヤー
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



    // ルートのレイヤー
    map.addSource('route', {
        type: 'geojson',
        data: nothing
    });

    map.addLayer({
        id: 'routeline-active',
        type: 'line',
        source: 'route',
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#3887be',
            'line-width': {
                base: 1,
                stops: [[12, 3], [22, 12]]
            }
        }
    }, 'waterway-label');



    // ルートの方向を示す
    map.addLayer({
        id: 'routearrows',
        type: 'symbol',
        source: 'route',
        layout: {
            'symbol-placement': 'line',
            'text-field': '▶',
            'text-size': {
                base: 1,
                stops: [[12, 24], [22, 60]]
            },
            'symbol-spacing': {
                base: 1,
                stops: [[12, 30], [22, 160]]
            },
            'text-keep-upright': false
        },
        paint: {
            'text-color': '#3887be',
            'text-halo-color': 'hsl(55, 11%, 96%)',
            'text-halo-width': 3
        }
    }, 'waterway-label');


    // Listen for a click on the map
    map.on('click', function(e) {
        // When the map is clicked, add a new drop-off point
        // and update the `dropoffs-symbol` layer
        console.log(map.unproject(e.point)); // Point {x:542, y:233}
        newDropoff(map.unproject(e.point)); //LngLat {lng: -83.11385685730292, lat: 42.37276619200392}
        updateDropoffs(dropoffs);
    });
});

function newDropoff(coords) {
    // Store the clicked point as a new GeoJSON feature with
    // two properties: `orderTime` and `key`
    // console.log(coords);

    // 緯度経度からGeoJSONを作成
    let feature = turf.point(
        [coords.lng, coords.lat],
        {
            orderTime: Date.now(),
            key: Math.random()
        }
    );


    dropoffs.features.push(feature);
    console.log('dropoffs', dropoffs);
    pointHopper[feature.properties.key] = feature;

    // Make a request to the Optimization API
    $.ajax({
        method: 'GET',
        url: assembleQueryURL(),
    }).done(function(data) {

        console.log('API RESULT', data);
        // Create a GeoJSON feature collection
        let routeGeoJSON = turf.featureCollection([turf.feature(data.trips[0].geometry)]);
        console.log(routeGeoJSON);

        // If there is no route provided, reset
        if (!data.trips[0]) {
            routeGeoJSON = nothing;
        } else {
            // Update the `route` source by getting the route source
            // and setting the data equal to routeGeoJSON
            map.getSource('route')
                .setData(routeGeoJSON);
        }

        if (data.waypoints.length === MAXIMUM_NUMBER_OF_POINTS) {
            window.alert('Maximum number of points reached. Read more at mapbox.com/api-documentation/#optimization.');
        }
    });
}



function updateDropoffs(geojson) {
    map.getSource('dropoffs-symbol')
        .setData(geojson);
}

function assembleQueryURL() {


    console.log('lastAtRestaurant', lastAtRestaurant);

    // Store the location of the truck in a variable called coordinates
    let coordinates = [truckLocation]; // 緯度経度配列
    let distributions = [];
    keepTrack = [truckLocation];

    // Create an array of GeoJSON feature collections for each point
    let restJobs = objectToArray(pointHopper); // クリックした場所を持つGeoJSON配列
    console.log('restJobs', restJobs);

    // If there are actually orders from this restaurant
    if (restJobs.length > 0) {

        // Check to see if the request was made after visiting the restaurant
        let needToPickUp = restJobs.filter(function(d, i) {
            return d.properties.orderTime > lastAtRestaurant;
        }).length > 0;



        // If the request was made after picking up from the restaurant,
        // Add the restaurant as an additional stop
        let restaurantIndex = 0;
        if (needToPickUp) {
            restaurantIndex = coordinates.length;
            // Add the restaurant as a coordinate
            coordinates.push(warehouseLocation);
            // push the restaurant itself into the array
            keepTrack.push(pointHopper.warehouse);
        }

        restJobs.forEach(function(d, i) {
            // Add dropoff to list
            keepTrack.push(d);
            coordinates.push(d.geometry.coordinates);
            // if order not yet picked up, add a reroute
            if (needToPickUp && d.properties.orderTime > lastAtRestaurant) {
                distributions.push(restaurantIndex + ',' + (coordinates.length - 1));
            }
        });
    }

    // Set the profile to `driving`
    // Coordinates will include the current location of the truck,
    return 'https://api.mapbox.com/optimized-trips/v1/mapbox/driving/' + coordinates.join(';') + '?distributions=' + distributions.join(';') + '&overview=full&steps=true&geometries=geojson&source=first&access_token=' + mapboxgl.accessToken;
}

function objectToArray(obj) {
    let keys = Object.keys(obj);
    let routeGeoJSON = keys.map(function(key) {
        return obj[key];
    });
    return routeGeoJSON;
}



