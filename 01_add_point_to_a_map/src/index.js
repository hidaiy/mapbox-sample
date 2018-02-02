import './style.css';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl.js';

mapboxgl.accessToken = process.env.MAPBOX_TOKEN;
let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/yhidai/cjd46prjm50b22rpboryo1vpz'
});


map.on('click', function (e) {


    // クリック時の緯度経度を参照する。
    console.log(e);

    let features = map.queryRenderedFeatures(e.point, {
        layers: ['chicago-parks'] // replace this with the name of the layer
    });
    console.log(features);

    if (!features.length) {
        return;
    }

    let feature = features[0];
    console.log(feature);

    let popup = new mapboxgl.Popup({offset: [0, -15]})
        .setLngLat(feature.geometry.coordinates)
        .setHTML(`<h3> ${feature.properties.title}</h3><p>${feature.properties.description}</p>`)
        .addTo(map);
});
