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
      col=routeColors[bus.wmataid]
      if(col == undefined){
        col=get_random_color();
        routeColors[bus.wmataid]=col;
      }
      drawBus(col, bus);
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
    var myLatlng = new google.maps.LatLng(bus.lat, bus.lon);
   busTime=parseISO8601(bus.last_update);
   //Update marker position if it already exists...
    if(markers[bus.busid] != null){
      if(!markers[bus.busid].getPosition().equals(myLatlng)){
        markers[bus.busid].setPosition(myLatlng);
        markers[bus.busid].setAnimation(google.maps.Animation.BOUNCE);
        //Turn off the bouncing in 3 seconds...
        setTimeout(function(){
          var myMarker = markers[bus.busid];
          myMarker.setAnimation(null);
        }, 3000);
      }else if (isStale(busTime)){
        
        markers[bus.busid].setMap(null);
        markers[bus.busid] = null;
      }
    }else if(!isStale(busTime)){
      //Or create a new marker if it doesnt
       var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor,
      new google.maps.Size(21, 34),
      new google.maps.Point(0,0),
      new google.maps.Point(10, 34));

      var marker = new google.maps.Marker({
         position: myLatlng,
         map: map,
         title:bus.wmataid+": "+bus.headsign+" ("+bus.busid+")",
         icon: pinImage,
         optimized: false // http://stackoverflow.com/questions/8721327/effects-and-animations-with-google-maps-markers/8722970#8722970
      });
      markers[bus.busid] = marker;
      marker.setMap(map);
          var content = "<h3>"+bus.wmataid+": "+bus.headsign+"</h3><br/><div>Schedule deviation: "+bus.dev+"</div><br/>"
    +"<div>Direction: "+bus.direction+"</div><br/>"
    +"<div>Vehicle: "+bus.busid+"</div><br/>"

    if(bus.last_update != null){
      content = content+"<div>Last update: "+busTime.toLocaleString()+"</div><br/>"
    }
    content = content+"<a href='#' class='btn btn-large'>Watch</a>"

      var infowindow = new google.maps.InfoWindow({
         content: content
      });
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
    var mapOptions = {
      center: new google.maps.LatLng(38.89, -77.03),
      zoom: 12,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map_canvas"),
        mapOptions);

//We'd like this to be toggleable, it's too much with everything else
//    var trafficLayer = new google.maps.TrafficLayer();
//    trafficLayer.setMap(map);

    var transitLayer = new google.maps.TransitLayer();
    transitLayer.setMap(map);


    for(var rIdx=0; rIdx < routes.length; rIdx++)
    {
      $.getScript("routes/busroute"+routes[rIdx]+".json", drawRoute);
    }
    //Starts a cycle of polling for bus positions
    poll();
  }
  window.onload = initialize;