/**
 * Turf.jsで緯度経度からGeoJSONへ変換する。
 * 空のデータソースを用意して、後から動的にポイントをマップに表示する。
 * Optimization APIでスタート、ピックアップ、ドロップオフのポイントを指定した、経路探索APIでルートを表示する。
 */


import './style.css';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl.js';
import * as turf from '@turf/turf';
import $ from 'jquery';

// let truckLocation = [-83.093, 42.376];
let truckLocation = [139.7369922874633, 35.679585420543944];
// let warehouseLocation = [-83.083, 42.363];
let warehouseLocation = [139.76457759207517, 35.6858465902274];
let lastAtRestaurant = 0;
let truckMarker = null;
let dropoffs = turf.featureCollection([]); // FeatureCollection
let nothing = turf.featureCollection([]);

const MAXIMUM_NUMBER_OF_POINTS = 12;

// Add your access token
mapboxgl.accessToken = process.env.MAPBOX_TOKEN;

// Initialize a map
const map = new mapboxgl.Map({
    container: 'map', // container id
    // style: 'mapbox://styles/mapbox/light-v9', // stylesheet location
    style: 'mapbox://styles/yhidai/cjdb75z5y1ekt2smtkd63o61p', // stylesheet location
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

    // ルートラインのレイヤー
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
    // }, 'waterway-label');
    });



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
    // }, 'waterway-label');
    });


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

    // Make a request to the Optimization API
    $.ajax({
        method: 'GET',
        url: assembleQueryURL(),
    }).done(function(data) {
        console.log('API RESULT', data);
        if (data.waypoints.length === MAXIMUM_NUMBER_OF_POINTS) {
            window.alert('Maximum number of points reached. Read more at mapbox.com/api-documentation/#optimization.');
            return;
        }

        // If there is no route provided, reset
        // Create a GeoJSON feature collection
        let routeGeoJSON = !data.trips[0] ?
            nothing :
            turf.featureCollection([turf.feature(data.trips[0].geometry)]);
        console.log('routeGeoJSON', routeGeoJSON);
        console.log('routeGeoJSON', JSON.stringify(routeGeoJSON));

        // Update the `route` source by getting the route source
        // and setting the data equal to routeGeoJSON
        map.getSource('route').setData(routeGeoJSON);
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
    let restaurantIndex = coordinates.length;
    // Add the restaurant as a coordinate
    coordinates.push(warehouseLocation);

    dropoffs.features.forEach(function(d, i) {
        // Add dropoff to list
        coordinates.push(d.geometry.coordinates);
        // [coodinatesのピックアップの要素番号, ドロップオフの番号]
        distributions.push(restaurantIndex + ',' + (coordinates.length - 1));
    });

    console.log('distributions',distributions);

    // APIドキュメント
    // https://www.mapbox.com/api-documentation/#optimization

    // 元の場所に戻る
    let url = 'https://api.mapbox.com/optimized-trips/v1/mapbox/driving/' + coordinates.join(';') + '?distributions=' + distributions.join(';') + '&overview=full&steps=true&geometries=geojson&source=first&access_token=' + mapboxgl.accessToken;
    // 片道
    // let url = 'https://api.mapbox.com/optimized-trips/v1/mapbox/driving/' + coordinates.join(';') + '?roundtrip=false&destination=last&distributions=' + distributions.join(';') + '&overview=full&steps=true&geometries=geojson&source=first&access_token=' + mapboxgl.accessToken;
    return url;
}

