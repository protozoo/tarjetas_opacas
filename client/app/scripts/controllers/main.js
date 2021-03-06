'use strict';

angular.module('clientApp')
  .controller('MainCtrl', function ($scope, $http) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    $scope.massageData = function()
    {
    	// Concatenate all data in a single table
    	pool.bigTable = [];
    	for (var i = 0; i < pool.dataset.people.length; i++) {
    		var person = pool.dataset.people[i];
    		for (var j = 0; j < person.entries.length; j++) {
    			var entry = person.entries[j];
    			// Add the person name to each row for easy filtering/grouping
    			entry.personName = person.name;

    			// Build a real Date object
    			pool.bigTable.push( entry );
    		};
    	};
    	console.log( "there are ", pool.bigTable.length, " entries in big table" );

    	// By activity
    	pool.byActivity = _.groupBy( pool.bigTable, function(entry){
    		return entry.activity;
    	} );
    	var byActivityArray = [];
    	for( var p in pool.byActivity ){
    		var sum = _.reduce( pool.byActivity[p], function(memo, entry){ return memo + entry.amount; }, 0);
    		var newItem = { name:p, numEntries:pool.byActivity[p].length, amount:sum };
    		byActivityArray.push( newItem )
    	}
    	pool.byActivity = byActivityArray;
    	pool.byActivity = _.sortBy( pool.byActivity, function(item){
    		return -item.amount;
    	} );

    	// By commerce
    	pool.byCommerce = _.groupBy( pool.bigTable, function(entry){
    		return entry.commerce;
    	} );
    	var byCommerceArray = [];
    	for( var p in pool.byCommerce ){
    		var sum = _.reduce( pool.byCommerce[p], function(memo, entry){ return memo + entry.amount; }, 0);
    		var newItem = { name:p, numEntries:pool.byCommerce[p].length, amount:sum };
    		byCommerceArray.push( newItem )
    	}
    	pool.byCommerce = byCommerceArray;
    }

    $http.get('/data/output.json').
	  success(function(data, status, headers, config) {
	  	console.log( "data loaded");
	  	pool.dataset = data;
	  	console.log( "there are ", data.people.length, " people in the dataset");
	  	$scope.massageData();
    	$scope.buildScatterPlot( 
    		pool.byActivity, 
    		".jumbotron", 
    		"Actividades", 
    		"amount", 
    		"numEntries", 
    		"Importe", 
    		"# Movimientos", 
    		"sqrt" 
    	);
	    // this callback will be called asynchronously
	    // when the response is available
	  }).
	  error(function(data, status, headers, config) {
	  	console.error( "error laoding data");
	    // called asynchronously if an error occurs
	    // or server returns response with an error status.
	  });


	  /* Scatterplot coded from this example as a quick template:
	  http://bl.ocks.org/weiglemc/6185069
	  */
	$scope.buildScatterPlot = function( data, containerSelector, chartName, xVar, yVar, xLabel, yLabel, scaleType ){
		console.log( "buildScatterPlot()" );
		var margin = {top: 20, right: 20, bottom: 30, left: 40},
		    width = 900 - margin.left - margin.right,
		    height = 500 - margin.top - margin.bottom;

		/* 
		 * value accessor - returns the value to encode for a given data object.
		 * scale - maps value to a visual display encoding, such as a pixel position.
		 * map function - maps from data value to display value
		 * axis - sets up axis
		 */ 

		// setup x 
		var xValue = function(d) { return d[xVar];}, // data -> value
		    xScale = d3.scale[scaleType]().range([0, width]), // value -> display
		    xMap = function(d) { return xScale(xValue(d));}, // data -> display
		    xAxis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(function(d){
		     if( d > 1000000 ){
		     	return (d/1000000) + "M";
		     }else if( d > 1000 ){
		     	return (d/1000) + "K";
		     }
		     return d;
		 	});

		// setup y
		var yValue = function(d) { return d[yVar];}, // data -> value
		    yScale = d3.scale[scaleType]().range([height, 0]), // value -> display
		    yMap = function(d) { return yScale(yValue(d));}, // data -> display
		    yAxis = d3.svg.axis().scale(yScale).orient("left").tickFormat(function(d){
		     if( d > 1000000 ){
		     	return (d/1000000) + "M";
		     }else if( d > 1000 ){
		     	return (d/1000) + "K";
		     }
		     return d;
		 	});

		// setup fill color
		var cValue = function(d) { return d.Manufacturer;},
		    color = d3.scale.category10();

		var container = $( containerSelector );
		container.append("<h2>" + chartName + "</h2>");

		// add the graph canvas to the body of the webpage
		var containerD3 = d3.select( containerSelector );
		var svg = containerD3.append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  .append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		// add the tooltip area to the webpage
		var tooltip = d3.select("body").append("div")
		    .attr("class", "tooltip")
		    .style("opacity", 0);

		  // change string (from CSV) into number format
		  data.forEach(function(d) {
		    d[xVar] = +d[xVar];
		    d[yVar] = +d[yVar];
		//    console.log(d);
		  });

		  // don't want dots overlapping axis, so add in buffer to data domain
		  xScale.domain([d3.min(data, xValue)-1, d3.max(data, xValue)+1]);
		  yScale.domain([d3.min(data, yValue)-1, d3.max(data, yValue)+1]);

		  // x-axis
		  svg.append("g")
		      .attr("class", "x axis")
		      .attr("transform", "translate(0," + height + ")")
		      .call(xAxis)
		    .append("text")
		      .attr("class", "label")
		      .attr("x", width)
		      .attr("y", -6)
		      .style("text-anchor", "end")
		      .text( xLabel );

		  // y-axis
		  svg.append("g")
		      .attr("class", "y axis")
		      .call(yAxis)
		    .append("text")
		      .attr("class", "label")
		      .attr("transform", "rotate(-90)")
		      .attr("y", 6)
		      .attr("dy", ".71em")
		      .style("text-anchor", "end")
		      .text( yLabel);

		  // draw dots
		  svg.selectAll(".dot")
		      .data(data)
		    .enter().append("circle")
		      .attr("class", "dot")
		      .attr("r", 3.5)
		      .attr("cx", xMap)
		      .attr("cy", yMap)
		      .style("fill", function(d) { return color(cValue(d));}) 
		      .on("mouseover", function(d) {
		          tooltip.transition()
		               .duration(200)
		               .style("opacity", .9);
		          tooltip.html( 
		          	'<b style="font-size: 12px">' + d["name"] + "</b><br/> "
		          	 + "<b>" + _.str.numberFormat( yValue(d), 0, ',', '.' ) + "</b> movimientos <br/>"
		          	 + "<b>" + _.str.numberFormat( xValue(d), 2, ',', '.' )+"€</b>"
			        )
		               .style("left", (d3.event.pageX + 5) + "px")
		               .style("top", (d3.event.pageY - 28) + "px");
		      })
		      .on("mouseout", function(d) {
		          tooltip.transition()
		               .duration(500)
		               .style("opacity", 0);
		      });

		  // // draw legend
		  // var legend = svg.selectAll(".legend")
		  //     .data(color.domain())
		  //   .enter().append("g")
		  //     .attr("class", "legend")
		  //     .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

		  // // draw legend colored rectangles
		  // legend.append("rect")
		  //     .attr("x", width - 18)
		  //     .attr("width", 18)
		  //     .attr("height", 18)
		  //     .style("fill", color);

		  // // draw legend text
		  // legend.append("text")
		  //     .attr("x", width - 24)
		  //     .attr("y", 9)
		  //     .attr("dy", ".35em")
		  //     .style("text-anchor", "end")
		  //     .text(function(d) { return d;})
	}
  });
