import './style.css';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl.js';
import turf from 'turf';

mapboxgl.accessToken = process.env.MAPBOX_TOKEN;
let map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/light-v9', // stylesheet location
    center: [-84.5, 38.05], // starting position
    zoom: 12 // starting zoom
});


let hospitals = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            properties: {Name: 'VA Medical Center -- Leestown Division', Address: '2250 Leestown Rd'},
            geometry: {type: 'Point', coordinates: [-84.539487, 38.072916]}
        },
        {
            type: 'Feature',
            properties: {Name: 'St. Joseph East', Address: '150 N Eagle Creek Dr'},
            geometry: {type: 'Point', coordinates: [-84.440434, 37.998757]}
        },
        {
            type: 'Feature',
            properties: {Name: 'Central Baptist Hospital', Address: '1740 Nicholasville Rd'},
            geometry: {type: 'Point', coordinates: [-84.512283, 38.018918]}
        },
        {
            type: 'Feature',
            properties: {Name: 'VA Medical Center -- Cooper Dr Division', Address: '1101 Veterans Dr'},
            geometry: {type: 'Point', coordinates: [-84.506483, 38.02972]}
        },
        {
            type: 'Feature',
            properties: {Name: 'Shriners Hospital for Children', Address: '1900 Richmond Rd'},
            geometry: {type: 'Point', coordinates: [-84.472941, 38.022564]}
        },
        {
            type: 'Feature',
            properties: {Name: 'Eastern State Hospital', Address: '627 W Fourth St'},
            geometry: {type: 'Point', coordinates: [-84.498816, 38.060791]}
        },
        {
            type: 'Feature',
            properties: {Name: 'Cardinal Hill Rehabilitation Hospital', Address: '2050 Versailles Rd'},
            geometry: {type: 'Point', coordinates: [-84.54212, 38.046568]}
        },
        {
            type: 'Feature',
            properties: {Name: 'St. Joseph Hospital', ADDRESS: '1 St Joseph Dr'},
            geometry: {type: 'Point', coordinates: [-84.523636, 38.032475]}
        },
        {
            type: 'Feature',
            properties: {Name: 'UK Healthcare Good Samaritan Hospital', Address: '310 S Limestone'},
            geometry: {type: 'Point', coordinates: [-84.501222, 38.042123]}
        },
        {
            type: 'Feature',
            properties: {Name: 'UK Medical Center', Address: '800 Rose St'},
            geometry: {type: 'Point', coordinates: [-84.508205, 38.031254]}
        }
    ]
};
let libraries = {
    type: 'FeatureCollection',
    features: [
        {
            type: 'Feature',
            properties: {Name: 'Village Branch', Address: '2185 Versailles Rd'},
            geometry: {type: 'Point', coordinates: [-84.548369, 38.047876]}
        },
        {
            type: 'Feature',
            properties: {Name: 'Northside Branch', ADDRESS: '1733 Russell Cave Rd'},
            geometry: {type: 'Point', coordinates: [-84.47135, 38.079734]}
        },
        {
            type: 'Feature',
            properties: {Name: 'Central Library', ADDRESS: '140 E Main St'},
            geometry: {type: 'Point', coordinates: [-84.496894, 38.045459]}
        },
        {
            type: 'Feature',
            properties: {Name: 'Beaumont Branch', Address: '3080 Fieldstone Way'},
            geometry: {type: 'Point', coordinates: [-84.557948, 38.012502]}
        },
        {
            type: 'Feature',
            properties: {Name: 'Tates Creek Branch', Address: '3628 Walden Dr'},
            geometry: {type: 'Point', coordinates: [-84.498679, 37.979598]}
        },
        {
            type: 'Feature',
            properties: {Name: 'Eagle Creek Branch', Address: '101 N Eagle Creek Dr'},
            geometry: {type: 'Point', coordinates: [-84.442219, 37.999437]}
        }
    ]
};

// 初回読み込み時にマップにポイントする。
map.on('load', function () {
    map.addLayer({
        id: 'hospitals',
        type: 'symbol',
        source: {
            type: 'geojson',
            data: hospitals
        },
        layout: {
            'icon-image': 'hospital-15'
        },
        paint: {}
    });
    map.addLayer({
        id: 'libraries',
        type: 'symbol',
        source: {
            type: 'geojson',
            data: libraries
        },
        layout: {
            'icon-image': 'library-15'
        },
        paint: {}
    });

    map.addSource('nearest-hospital', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: []
        }
    });
});


let popup = new mapboxgl.Popup();

map.on('mousemove', function (e) {
    // console.log(e);
    let features = map.queryRenderedFeatures(e.point, {layers: ['hospitals', 'libraries']});
    if (!features.length) {
        popup.remove();
        return;
    }
    let feature = features[0];

    popup.setLngLat(feature.geometry.coordinates)
        .setHTML(feature.properties.Name)
        .addTo(map);

    map.getCanvas().style.cursor = features.length ? 'pointer' : '';
});

map.on('click', function (e) {
    // Return any features from the 'libraries' layer whenever the map is clicked
    let libraryFeatures = map.queryRenderedFeatures(e.point, {layers: ['libraries']});
    if (!libraryFeatures.length) {
        return;
    }
    let libraryFeature = libraryFeatures[0];

    // Using Turf, find the nearest hospital to library clicked
    let nearestHospital = turf.nearest(libraryFeature, hospitals);

    // If a nearest library is found
    if (nearestHospital !== null) {
        // Update the 'nearest-library' data source to include
        // the nearest library
        map.getSource('nearest-hospital').setData({
                type: 'FeatureCollection',
                features: [
                    nearestHospital
                ]
            }
        );
        // Create a new circle layer from the 'nearest-library' data source
        map.addLayer({
            id: 'nearest-hospital',
            type: 'circle',
            source: 'nearest-hospital',
            paint: {
                'circle-radius': 12,
                'circle-color': '#486DE0'
            }
        }, 'hospitals');
    }
});
