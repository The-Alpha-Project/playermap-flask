var socket;
var saved_button 
var popup = $('#info_popup');
var draggable='false'
var filterList = [];
var clientID;

window.addEventListener('beforeunload', function() {
  console.log("Disconnecting from server");
  // var clientId = localStorage.getItem('clientId');
  socket.emit('disconnect_event', clientId);
});

$(document).ready(function() {
  socket = io.connect('http://' + document.domain + ':' + location.port + '/playermap');
  console.log("Page Loaded, with no errors");

  socket.on('connected', function(data) {
    console.log("Connected to server");
    clientId = data
   // localStorage.setItem('clientId', data);
  });


  function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
      .then(function() {
        console.log("Text copied to clipboard: " + text);
      })
      .catch(function(error) {
        console.error("Error copying text to clipboard:", error);
      });
  }

  
  $('#world').click(function(e) {
	var posX = e.pageX;
	var posY = e.pageY;

	var polygon = [ [ posX - 10, posY - 10], [posX + 10, posY - 10], [posX + 10, posY + 10], [posX - 10, posY + 10] ]; 
	   
	$('.quest_info').each(function(){
           x = $(this).offset().left;		
           y = $(this).offset().top;		

	   if (inside([x, y], polygon)) {
               console.log("Quest name: " + $(this).data("data-title"));
           }
	});
   }); 

  // Receaving update from server
  socket.on('receaving_update_from_server', function(data) {
    var keys = Object.keys(data);
    spawnSVGElements(data[keys]);
    
    var svgCount = $('#world_objects svg').length;
    console.log("Number of SVGs: " + svgCount); 
  });
   
  // online
  socket.on('players_online', function(online) {
    $("#players_online").text(online + " online");
    console.log("Players online: " + online);
  });

  // player
  $('#get_players_button').on('click', function() {
    socket.emit('request_players_location', 'update');
  });

  socket.on('updated_players_location', function(data) {
    players_location(data);
  });

  $(document).on('mouseenter', ".popups", function(event) {  
  data = {
    'id': $(this).attr('id'),
    'class_name': $(this).attr('data-classname'),
    'popup': 'mouseover',
    'mouseX': event.pageX,
    'mouseY': event.pageY
  }

  socket.emit('mouse_enter_info', data);
});  


$(document).on('mouseleave', ".popups", function(event) {  
  $('#info_popup').hide();
  $(document).off("click", '#info_popup');
  $('#info_popup').attr('data-click_url', "no");
});

  socket.on('show_info_popups', function(data) { 
    mouseX = data['requested_data']['mouseX']
    mouseY = data['requested_data']['mouseY']
  
    $("#info_popup #title").text(data['requested_data']['name']);
    $("#info_popup #subTitle").html(data['requested_data']['subTitle']);
    $("#info_popup #notes").html(data['requested_data']['notes']);
  
    var offsetX = 10; // Adjust the horizontal offset
    var offsetY = 10; // Adjust the vertical offset
    
    // Calculate the maximum allowed positions
    var maxLeft = $(window).width() - $("#info_popup").outerWidth() - offsetX;
    var maxTop = $(window).height() - $("#info_popup").outerHeight() - offsetY;
    
    // Adjust the position if it exceeds the maximum allowed positions
    var left = Math.min(mouseX + offsetX, maxLeft);
    var top = Math.min(mouseY + offsetY, maxTop);
  
    // Check if the popup is too close to the right side of the screen
    if (left > maxLeft - offsetX) {
      left = mouseX - offsetX - popup.outerWidth();
    }
    
    // Check if the popup is too close to the bottom of the screen
    if (top > maxTop - offsetY) {
      top = mouseY - offsetY - popup.outerHeight();
    }
    
    $("#info_popup").css({
      top: top + "px",
      left: left + 'px',
    });
  
    $('#info_popup').attr('data-click_url', data['requested_data']['url']);
  
    $('#info_popup').show();
  });
  



$(document).on('click', ".popups", function(event) {  
  var x = parseFloat($(this).attr('data-x'));
  var y = parseFloat($(this).attr('data-y'));
  var z = parseFloat($(this).attr('data-z'));
  var title = $(this).attr('data-name');
  var class_name = $(this).attr('data-classname');
  var url = $("#info_popup").attr('data-click_url');
  var textToCopy = ""

  if ($(this).attr('data-display_id')) {
    var display_id = $(this).attr('data-display_id');
  }


  if (event.metaKey && event.shiftKey) {
    copyToClipboard(title); 
  }
  else if (event.altKey && event.metaKey) {
      copyToClipboard(display_id); 
  }
  else if (event.altKey) {
    var textToCopy = ".port " + x + " " + y + " " + z + " " + 0;
  }
  else if (event.metaKey && class_name == "worldport") {
    var textToCopy = ".tel " + title.toLowerCase();
  } else if(event.shiftKey && url != "no" && url != undefined ) {
    window.open(url, '_blank');
  } else if(event.shiftKey && class_name == "taxi") {
    url = "https://db.thealphaproject.eu/?action=show_table&table=TaxiNodes&database=alpha_dbc";
    window.open(url, '_blank');
  }

  if (textToCopy.length > 0) {
    copyToClipboard(textToCopy); 
  }
});
$(document).on("click", "#Eastern_Kingdoms_map", function(event) {
  event.preventDefault();

  if (event.altKey) {
    const currentImage = document.querySelector("#Eastern_Kingdoms_map");
    var offsetX = event.offsetX;
    var offsetY = event.offsetY;

    const mapWidth = currentImage.dataset.mapwidth
    const mapHeight = currentImage.dataset.mapheight
    const mapLeft = currentImage.dataset.mapleft
    const mapTop = currentImage.dataset.maptop
  
    const imageWidth = currentImage.dataset.width
    const imageHeight = currentImage.dataset.height
  
    // how far through image is mouse assuming no magnification
    // (image may start offscreen)
    const mouseX = offsetX / magnification
    const mouseY = offsetY / magnification
  
    // distance through map we are (from 0 to 1)
    const xOffset = mouseX / imageWidth
    const yOffset = mouseY / imageHeight
  
    const x = mapLeft - mapWidth  * xOffset
    const y = mapTop  - mapHeight * yOffset

    copyToClipboard(".port " + y + " " + x + " " + 300 + " " + 0);
  }
}); 



$("#add-button").click(function() {
  var selectedFilter = $("#filters").val();
  var query = $("#query-input").val();

  if (selectedFilter || query) {
    filterList.push([selectedFilter, query]);
    console.log(filterList)
    $("#filter-items").append("<span class='filter-item' data-filter='" + selectedFilter + "' data-query='" + query + "'>- " + selectedFilter + ": " + query + "</span>");
    $("#query-input").val("");
  }
});

$("#filter-items").on("click", ".filter-item", function() {
  var selectedFilter = $(this).data("filter");
  var query = $(this).data("query");

  filterList = filterList.filter(function(filter) {
 
    return !(filter[0] === selectedFilter && filter[1] === query);
  });

  $(this).remove();
});


$("#search-button").click(function() {
  const currentImage = document.querySelector("#Eastern_Kingdoms_map");

  var idValue = $("#id").val();
  var mapValue = $("#map").val();
  filterList.push(["map", mapValue]);

  // console.log(currentImage);
  var offsetLeft = currentImage.offsetLeft;
  var offsetTop  = currentImage.offsetTop;
  var offsetHeight = currentImage.offsetHeight;
  var offsetWidth  = currentImage.offsetWidth;

  var screenWidth = $(window).width();
  var screenHeight = $(window).height();

  data = {
    'id': idValue,
    'magnification': magnification,
    'offsetLeft': offsetLeft,
    'offsetTop': offsetTop,
    'offsetHeight': offsetHeight,
    'offsetWidth': offsetWidth,
    'max_x': screenWidth,
    'max_y': screenHeight,
    'filters': filterList
  }
  
  saved_button = idValue
  socket.emit('request_server_update', data);
  console.log(filterList); 
});

$("#clear-button").click(function() {
  filterList = [];
  $("#filter-items").empty();
  $("#world_objects").empty();
});

// Get references to the necessary elements
const toggleButton = document.getElementById('toggle-advanced');
const advancedContainer = document.getElementById('advanced-features');

// Add a click event listener to the toggle button
toggleButton.addEventListener('click', () => {
  // Toggle the visibility of the advanced container by adding/removing the 'hidden' class
  if ($("#toggle-advanced").text() == '[ + ]') {
    $("#toggle-advanced").text('[ - ]');
  } else {
    $("#toggle-advanced").text('[ + ]');
  }
  advancedContainer.classList.toggle('hidden');
});



});
