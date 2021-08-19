// getWeather retrieves weather data and displays it within html when called.
var coords = [29.4241, -98.4936];
function getWeather() {
    $.ajax('https://api.openweathermap.org/data/2.5/onecall?units=imperial&lat=' + coords[0] + '&lon=' + coords[1] + '&exclude=current,hourly,minutely&appid=' + WEATHER_MAP_TOKEN)
        .done(function (resp) {

            // Takes in the index for resp.daily object and returns the chance of rain for that index/day.
            function chanceOfRain(index) {
                var rainChanceDecimal = resp.daily[index].pop;
                var rainChancePercentage = Math.round(rainChanceDecimal * 100) + '% Chance of precipitation';
                return rainChancePercentage;
            }
            // Takes in the index for resp.daily object and returns the humidity level for that index/day.
            function humidityLevel(index) {
                var humidity = 'Humidity: ' + resp.daily[index].humidity + '%';
                return humidity;
            }
            // Takes in the index for resp.daily object and returns the weather description for that index/day.
            function weatherDescription(index) {
                var description = resp.daily[index].weather[0].description;
                return description[0].toUpperCase() + description.substring(1);
            }
            // Takes in the index for resp.daily object and returns the date for that index/day.
            function dailyDate(index) {
                var today = resp.daily[index];
                var todayDate = new Date(today.dt * 1000).toString();
                todayDate = todayDate.split(' ');
                var date = [todayDate[0], todayDate[1], todayDate[2]].join(' ');
                return date;
            }
            // Takes in the index for resp.daily object and returns the weather icon for that index/day.
            function weatherIcon(index) {
                var img = resp.daily[index].weather[0].icon;
                var imgSrc = '<img src="http://openweathermap.org/img/w/'+ img +'.png">'
                return imgSrc;
            }
            // Takes in the index for resp.daily object and returns the high and low temperatures for that index/day.
            function highAndLowTemp(index) {
                var highTemp = Math.round(resp.daily[index].temp.max);
                var lowTemp = Math.round(resp.daily[index].temp.min);
                var highAndLowTemps = highTemp + `\xB0F / ` + lowTemp + '\xB0F';
                return 'High/Low: ' + highAndLowTemps;
            }
            // This loop creates the on page html for weather display and adds the weather info to it.
            $('#weather-container').html('');
            for (var i = 0; i <= daysOfWeather; ++i) {
                $('#weather-container').append('<div id="day-' + i + '" class="grow flex-xl-grow-1 weather-daily"></div>');
                $('#day-' + i + '').html(
                    '<div class="card weather-card">' +
                    '<div class="card-header font-weight-bold">' + dailyDate(i) + '</div>' +
                    '<ul class="list-group">' +
                    '<li class="list-group-item">' + weatherIcon(i) + '</li>' +
                    '<li class="list-group-item font-weight-bold">' + highAndLowTemp(i) + '</li>' +
                    '<li class="list-group-item">' + chanceOfRain(i) + '</li>' +
                    '<li class="weather-disc list-group-item">' + weatherDescription(i) + '</li>' +
                    '<li class="list-group-item">' + humidityLevel(i) + '</li>' +
                    '</ul>' +
                    '</div>');
            }
        });
};
getWeather();

// Select drop down allows user to select how many days of weather forecast are displayed, 0 indexed.
var daysOfWeather = 2;
$('#select-options').change(function (){
    var selectVal = $('#select-options').val();
    daysOfWeather = selectVal;
    $('#weather-container').fadeOut(1000, function () {
        getWeather();
        $('#weather-container').fadeIn(1200);
    });
});

// Map box map
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
var map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/dark-v10', // style URL
    center: [-98.49272, 29.42527], // starting position [lng, lat]
    zoom: 8.7 // starting zoom
});
// Map zoom and orientation controller.
map.addControl(new mapboxgl.NavigationControl());


var popup = new mapboxgl.Popup()
    .setHTML("<h5>San Antonio, Texas, United States</h5>")
    .setMaxWidth("200px");

var marker = new mapboxgl.Marker({
    color: '#1795d4'
})
    .setLngLat([-98.49272, 29.42527])
    .setDraggable(true)
    .setPopup(popup)
    .addTo(map);

// Updates weather and popup info on marker drag end.
marker.on('dragend', function (){
    coords = marker.getLngLat().toArray().reverse();
    getWeather();
    updateMarkerPopUpInfo();
});

function updateMarkerPopUpInfo() {
    var lngLat = marker.getLngLat();
    var latLngObj = {lat: lngLat.lat, lng: lngLat.lng};
    reverseGeocode(latLngObj, MAPBOX_ACCESS_TOKEN).then(function (results) {
        var arr = results.features;
        var place = arr.find(x => x.id.includes('place') === true);
        marker._popup._content.innerHTML = '<h5>' + place.place_name + '</h5>';
        $('#current-city').html(place.place_name);
    })
}

var textInput = '';

// On click of button "go" searches for the input locations weather
$('#go').click(function (){
    textInput = $('#text-input').val();
    moveMarkerToSearched();
})

$('#text-input').keypress(function (event){
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if(keycode == '13'){
        textInput = $('#text-input').val();
        moveMarkerToSearched();
    }
    //Stop the event from propagation to other handlers
    //If this line is removed, then keypress event handler attached
    //at document level will also be triggered
    event.stopPropagation();
});

function moveMarkerToSearched() {
    geocode(textInput, MAPBOX_ACCESS_TOKEN).then(function (results){
        marker.setLngLat(results);
        coords = marker.getLngLat().toArray().reverse();
        updateMarkerPopUpInfo();
        getWeather();
        map.flyTo({
            center: results,
            zoom: 8.7,
            speed: 0.5
        });
    });
}