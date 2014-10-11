var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var colors = require('colors');


// **********
var baseUrl = "http://elpais.com/especiales/2014/tarjetas-opacas-caja-madrid/";
var people = [];
var currentPersonIndex = 0;
// **********

var startTime = new Date().getTime();

function getPeopleList()
{
	var url = baseUrl;
	request(url, function(error, response, html){
		if(!error){
			var $ = cheerio.load(html);
			var persons =  $("ul.listado_nombres li a");
			for (var i = 0; i < persons.length; i++) {
				var person = $( persons[i] );
				var personUrl = baseUrl + person.attr("href");
				var name = person.text();
				var personObj = { name:name, url:personUrl, entries:[] };
				people.push( personObj );
				//console.log( name, ": ", personUrl );
			};
			currentPersonIndex = 0;
			getNextPerson();
		}
	})

}


function saveJson(){
	console.log( "saving..." );

	fs.writeFile('data/output.json', JSON.stringify( { people: people }, null, 4), function(err){
		var endTime = new Date().getTime();
		var diff = (endTime - startTime)/1000;
    	console.log('\nFile successfully written! - Check your project directory for the output.json file');
    	console.log('Alltogether it took ' + diff + " seconds to complete");
	});
}



function getNextPerson()
{
	var currentPerson = people[currentPersonIndex];
	var url = currentPerson.url;
	request(url, function(error, response, html){
		if(!error){
			var $ = cheerio.load(html);
			var rows = $("#tabla_datos tbody tr");
			for (var i = 0; i < rows.length; i++) {
				var row = $( rows[i] );
				var cells = row.find("td");
				var date = $( cells[0] ).text();
				var time = $( cells[1] ).text();
				var commerce = $( cells[2] ).text().trim();
				var activity = $( cells[3] ).text();
				var amount = parseFloat( $( cells[4] ).text() );
				var operation = $( cells[5] ).text();

				var jsonRow = { date:date, time:time, commerce: commerce, activity: activity, amount:amount, operation: operation };
				currentPerson.entries.push( jsonRow )
			};

			console.log( "parsed " + (currentPersonIndex) + " of " + people.length + " (" + currentPerson.name + ") " + currentPerson.entries.length + " entries" )
			currentPersonIndex++;
			if( currentPersonIndex < people.length )
			{
				getNextPerson();
			}else{
				console.log( "FINISHED info of all people: " + people.length );
				saveJson();
			} 
		}
	})
}




console.log( "----------------------------------------------------------------------\n" );
getPeopleList();

