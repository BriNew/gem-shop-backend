$(document).ready(function() {
  
function getRocks(){
	$.getJSON("/rocks",
	function(data) {
	  console.log(data);
	  rocks = data.rocks.map((rock, index) => showTerms(rock));
		$('#results').html(rocks);
		console.log(rocks.length);
	});	
};
	

function showTerms(rock) {
return `

          <li>
          	<p>${rock.type}</p>
          	<p>${rock.origin}</p>
          	<p>${rock.size}</p>
          	<p>${rock.color}</p>
          </li>


`;
};

$('#form').submit(function(){
	event.preventDefault();
	$('#greeting').hide();
	getRocks();
});
  
});