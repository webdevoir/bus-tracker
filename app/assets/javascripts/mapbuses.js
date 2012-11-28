/*
* Draws using the map with id map_canvas in buses/index.html.erb
* This is the google API key, required to use their maps API
* google api:  AIzaSyAAQDOZpCb33qnlU5xcBmf_n8CQ4p_qg6s
*/
var routeColors = {};
var markers = {};
var openinfo;

function drawRoute() {
//load the given route and plot it....
  var routeCoordinates=[];
  //Sometimes direction0 is null....
  if(RouteDetails.Direction0 == null)
  {
    return;
  }
  var shape = RouteDetails.Direction0.Shape;
  for (var i=0; i<shape.length; i++)
  {
    routeCoordinates[i] = new google.maps.LatLng(shape[i].Lat, shape[i].Lon);
  }
  var color = get_random_color();
  routeColors[RouteDetails.RouteID] = color;
  var routePath = new google.maps.Polyline({
    path: routeCoordinates,
    strokeColor: '#'+color,
    strokeOpacity: 0.5,
    strokeWeight: 2
  });
  routePath.setMap(map);
}

function updateMarkers(buses){
  for(var i=0; i<buses.length; i++)
  {
    bus=buses[i];
    
    if(bus != null){
      
      col=routeColors[bus.wmataid]
      if(col == undefined){
        col=get_random_color();
        routeColors[bus.wmataid]=col;
      }
      show_debug("drawing pin "+i+" for id: "+bus.id+", busid: "+bus.busid+", wmataid: "+bus.wmataid+"...");
      drawBus(col, bus);
      show_debug('(done)');
    }
    
    //Thanks google...
    //https://developers.google.com/maps/documentation/javascript/overlays#MarkerAnimations
    /*
    setTimeout(function(){
      drawBus(col, bus)
    }, i*20);
  */
  }
}

function drawBus(pinColor, bus){
  //show_debug("in draw bus with id "+bus.busid+"...");
  var myLatlng = new google.maps.LatLng(bus.lat, bus.lon);
  busTime=parseISO8601(bus.last_update);
 //Update marker position if it already exists...
  if(markers[bus.busid] != null){
    show_debug("markers["+bus.busid+"] does exist");
    if(!markers[bus.busid].getPosition().equals(myLatlng)){
      show_debug('new position...');
      markers[bus.busid].setPosition(myLatlng);
      markers[bus.busid].setAnimation(google.maps.Animation.BOUNCE);
      //Turn off the bouncing in 3 seconds...
      setTimeout(function(){
        var myMarker = markers[bus.busid];
        myMarker.setAnimation(null);
      }, 3000);
    }
    if (isStale(busTime)){
      show_debug('stale...');
      markers[bus.busid].setIcon(new google.maps.MarkerImage('stale.png'),
        new google.maps.Size(21, 34),
        new google.maps.Point(0,0),
        new google.maps.Point(10, 34)
        );
    }else{
      show_debug('not stale, polling google...');
       markers[bus.busid].setIcon(new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
    new google.maps.Size(21, 34),
    new google.maps.Point(0,0),
    new google.maps.Point(10, 34)));
    }
  }else{
    //Or create a new marker if it doesnt
    show_debug('new marker, polling google...');
    var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
    new google.maps.Size(21, 34),
    new google.maps.Point(0,0),
    new google.maps.Point(10, 34));
    show_debug('done with google poll.');

    if(!isStale(busTime)){ pinImage = new google.maps.MarkerImage('stale.png',
    new google.maps.Size(21, 34),
    new google.maps.Point(0,0),
    new google.maps.Point(10, 34)); }

    var marker = new google.maps.Marker({
       position: myLatlng,
       map: map,
       title:bus.wmataid+": "+bus.headsign+" ("+bus.busid+")",
       icon: pinImage,
       title:bus.headsign,
       optimized: false // http://stackoverflow.com/questions/8721327/effects-and-animations-with-google-maps-markers/8722970#8722970
    });
    markers[bus.busid] = marker;
    show_debug("adding "+bus.busid+" to map");
    marker.setMap(map);
    

        var content = "<h3>"+bus.wmataid+": "+bus.headsign+"</h3><br/><div>Schedule deviation: "+bus.dev+"</div><br/>"
  +"<div>Direction: "+bus.direction+"</div><br/>"
  +"<div>Vehicle: "+bus.busid+"</div><br/>"

  if(bus.last_update != null && busTime != null){
    content = content+"<div>Last update: "+busTime.toLocaleString()+"</div><br/>"
  }
  content = content+"<a href='#' class='btn btn-large'>Watch</a>"
  show_debug("making info window for "+bus.busid);
    var infowindow = new google.maps.InfoWindow({
       content: content
    });
    show_debug("adding maps listener for "+bus.busid);
    google.maps.event.addListener(marker, 'click', function() {
      if(openinfo != null){
        openinfo.close();
      }
      infowindow.open(map,marker);
      openinfo=infowindow;
    });
  }
  
}

function initialize() {
  

  navigator.geolocation.getCurrentPosition(showPosition,showError);
  
  

  // var mapOptions = {
  //   center: new google.maps.LatLng(lat, lon),
  //   zoom: 14,
  //   mapTypeId: google.maps.MapTypeId.ROADMAP
  // };
  // map = new google.maps.Map(document.getElementById("map_canvas"),
  //     mapOptions);

// //We'd like this to be toggleable, it's too much with everything else
// //    var trafficLayer = new google.maps.TrafficLayer();
// //    trafficLayer.setMap(map);
  
  
}

function showPosition(position)
{ 
  lat = position.coords.latitude;
  lon = position.coords.longitude;
  // var latlon=position.coords.latitude+","+position.coords.longitude;
  // var img_url="http://maps.googleapis.com/maps/api/staticmap?center="
  // +latlon+"&zoom=14&size=400x300&sensor=false";
  // document.getElementById("map_canvas").innerHTML="<img src='"+img_url+"'>";
  var mapOptions = {
    center: new google.maps.LatLng(lat, lon),
    zoom: 14,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById("map_canvas"),
      mapOptions);
  var transitLayer = new google.maps.TransitLayer();
  transitLayer.setMap(map);


  for(var rIdx=0; rIdx < routes.length; rIdx++)
  {
    $.getScript("routes/busroute"+routes[rIdx]+".json", drawRoute);
  }
  //Starts a cycle of polling for bus positions
  poll();
}


function showError(error)
  {
    lat = 38.89;
    lon = -77.03; 
  switch(error.code) 
    {
    case error.PERMISSION_DENIED:
      alert("User denied the request for Geolocation.");
      break;
    case error.POSITION_UNAVAILABLE:
      alert("Location information is unavailable.");
      break;
    case error.TIMEOUT:
      alert("The request to get user location timed out.");
      break;
    case error.UNKNOWN_ERROR:
      alert("An unknown error occurred.");
      break;
    }
  } 
window.onload = initialize;




 