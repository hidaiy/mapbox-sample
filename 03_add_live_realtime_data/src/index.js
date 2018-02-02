import './style.css';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl.js';

mapboxgl.accessToken = process.env.MAPBOX_TOKEN;
let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v9',
    zoom: 1
});

let url = 'https://wanderdrone.appspot.com/';

let geojson = {"geometry": {"type": "Point", "coordinates": [-140.41563425490659, -37.629112636478652]}, "type": "Feature", "properties": {}};

map.on('load', function () {
    window.setInterval(function() {
        // jmap.getSource('drone').setData(url);
        // map.getSource('drone').setData(geojson);
        let result = map.getSource('drone-2').setData(url);
        console.log(result);
    }, 2000);

    map.addSource('drone', { type: 'geojson', data: geojson });

    map.addLayer({
        "id": "drone",
        "type": "symbol",
        "source": "drone",
        "layout": {
            "icon-image": "rocket-15"
        }
    });

    map.addSource('drone-2', { type: 'geojson', data: url });
    map.addLayer({
        "id": "drone-2",
        "type": "symbol",
        "source": "drone-2",
        "layout": {
            "icon-image": "rocket-15"
        }
    });
});
