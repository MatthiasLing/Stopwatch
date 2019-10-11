//matching document entities to javascript variables 
var currentTime = document.getElementById("time");
var timeZone = document.getElementById("timeZone");
var startButton = document.getElementById("startButton");
var resetButton = document.getElementById("resetButton");
var elapsedTime = document.getElementById("elapsed")
var coordButton = document.getElementById("coordButton")
var latLong = document.getElementById("coords")
var table = document.getElementById("locationTable");
var startText = document.getElementById("startText");
var resetText = document.getElementById("resetText");

//count - the ticks used to measure elapsed time
var count = 0;

var running;

//coordinate fields
var lat;
var long;

//used to determine state of stopwatch
//paused if 0, running if 1
var state = 0;

//I split the elapsed time up in order to improve speed
var days = 0;
var hours = 0;
var minutes = 0;
var seconds = 0;

//The string displaying the elapsed time 
var elapsedString;


//geolocation client
var watchID;


//array storing the history table
var events;

//Measures the duration of holding click (for reset button)
var timeout = 0;

//loads the history table
if (localStorage.getItem('events')) {
    events = JSON.parse(localStorage.getItem('events'));
    for (i = events.length - 1; i >= 0; i--) {
        addToTable(events[i]);
    }
} else {
    //if there is no table stored, initializes a new one 
    events = [];
}

//loads the elapsed time or initializes a new one
if (localStorage.getItem('elapsed')) {
    elapsedString = localStorage.getItem('elapsed');

    //load the count and day/hours/minutes
    var arr = elapsedString.split(":");
    days = parseInt(arr[0]);
    hours = parseInt(arr[1]);
    minutes = parseInt(arr[2]);
    seconds = parseInt(arr[3]);

} else {
    elapsedString = "0:00:00:00";
}

elapsedTime.innerHTML = elapsedString;

//stores the array using localStorage
localStorage.setItem('events', JSON.stringify(events));

//standard object to record the start/stop instances
class event {
    constructor(time, lat, long) {
        this.time = time;
        this.lat = lat;
        this.long = long;
    }
}

//updates the current time and timezone location
updateTime();
updateTimeZone();

//loads the table
if (localStorage.getItem('entryList')) {

    //set table to reflect saved values
    table.innerHTML = localStorage.getItem('entryList');
}

//Checks and initializes geolocator 
if ("geolocation" in navigator) {
    getCoords();
} else {
    console.log("Geolocation unavailable")
}

//support for geolocator
var geo_options = {
    enableHighAccuracy: true,
    maximumAge: 30000,
    timeout: 27000
};

function geo_error() {
    console.log("Sorry, no position available.");
}

//increments and displays the elapsed time
function incrementCounter() {
    count++;
    elapsedTime.innerHTML = parseIntoReadableTime(count);
}

//Adds a new entry to the table
function addToTable(event) {
    var eventItem = document.createElement("LI");
    var eventText = document.createTextNode(event.time + " | " + event.lat + "°" + " | " + event.long + "°");
    eventItem.prepend(eventText);
    document.getElementById("eventList").prepend(eventItem);
}

//starts and stops the timer
startButton.onclick = function () {

    //updates the coordinates and timezone
    getCoords();
    updateTimeZone();

    //if currently paused, begins to run (and vice versa)
    if (state == 0) {

        //increments the count every 10ms
        running = setInterval(incrementCounter, 10);
        startText.innerHTML = "stop";
        //creates new event object
        var newEvent = new event(parseIntoReadableTime(count), lat != null ? lat.toFixed(8) : "null ",
            long != null ? long.toFixed(8) : "null");

        //testing
        addToTable(newEvent);

        //saves list to local storage
        events.unshift(newEvent);
        localStorage.setItem('events', JSON.stringify(events))

        state = 1;

    } else {
        clearInterval(running);
        startText.innerHTML = "start";
        state = 0;
    }
}

resetButton.onmousedown = function () {
    //changes color when pressed to alert user
    resetButton.style.backgroundColor = "red";

    //I have implemented a 2 second delay to avoid accidental deletion
    timeout = setTimeout(
        function () {
            //clears the table
            document.getElementById("eventList").innerHTML = "";

            count = days = hours = minutes = seconds = 0;

            //clears storage (localStorage and array)
            localStorage.clear();
            events = [];

            //clears location settings
            navigator.geolocation.clearWatch(watchID);

            //stops count from incrementing
            clearInterval(running);

            //resets coordinate and time display
            latLong.innerHTML = "Latitude: " + 0 + "°" + "  |  Longitude: " + 0 + "°";
            elapsedTime.innerHTML = "0:00:00:00";

            //resets the start.stop button
            startText.innerHTML = "start";
            state = 0;
        }
        , 2000);

}

resetButton.onmouseup = function () {
    //if lifted before 2s delay, doesn't perform reset
    clearTimeout(timeout);
    resetButton.style.backgroundColor = "maroon";


}


//converts time into string 
function parseIntoReadableTime(time) {

    if (time % 100 == 0 && time != 0) {
        seconds++;

        if (seconds == 60) {
            seconds = 0;
            minutes++;
        }
        if (minutes == 60) {
            minutes = 0;
            hours++;
        } if (hours == 24) {
            seconhoursds = 0;
            days++;
        }
    }

    var str = days + ":" + (hours >= 10 ? hours : "0" + hours) + ":" + (minutes >= 10 ? minutes : "0" + minutes) + ":" + (seconds >= 10 ? seconds : "0" + seconds);
    localStorage.setItem("elapsed", str);
    return str;

}

//adds leading 0 for time elements below 10 (appearance only)
function timeAdjust(time) {
    return (time < 10) ? "0" + time : time;
}

//keeps present time
function updateTime() {
    var today = new Date();

    //Displays the time in military time
    var timeString = timeAdjust(today.getHours()) + ":" + timeAdjust(today.getMinutes());
    currentTime.innerHTML = timeString;

    //updates time every 10s
    setInterval(updateTime, 10000);
}

//gets current timezone
function updateTimeZone() {
    timeZone.innerHTML = Intl.DateTimeFormat().resolvedOptions().timeZone;
}

//retrieves pushes current coordinates to display
function getCoords() {
    watchID = navigator.geolocation.watchPosition(position => {
        lat = position.coords.latitude;
        long = position.coords.longitude;
        latLong.innerHTML = "Latitude: " + lat.toFixed(6) + "°" + " |  Longitude: " + long.toFixed(6) + "°";
    }, geo_error, geo_options);
}

//separate coordinate button so location can be viewed without starting/stopping the timing
coordButton.onclick = function () {
    getCoords();

}