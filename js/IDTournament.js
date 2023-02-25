$(document).ready(function () {
	var data = GetProData();

	for (let key in data) {
		let option = document.createElement("option");
		option.setAttribute('value', key);
	  
		let optionText = document.createTextNode(key);
		option.appendChild(optionText);
	  
		$('#dateselect').append(option);
	}

	$('#table_tournament').DataTable({
		data: data["2023-02-22"],
		pageLength: 25,
		autoWidth: false,
		columns: [
			{ "data": 'rank', title: "Rank" },
			{ "data": 'place', title: "Place" },
			{ "data": 'name', title: "Name" },
			{ "data": 'level', title: "Level" },
		],
	});
});

function handleDateChange(event) {
	var element = event.target;
	var value = element.value;
	
	var data = GetProData();
	$('#table_tournament').DataTable().destroy();
	$('#table_tournament').DataTable({
		data: data[value],
		pageLength: 25,
		autoWidth: false,
		columns: [
			{ "data": 'rank', title: "Rank" },
			{ "data": 'place', title: "Place" },
			{ "data": 'name', title: "Name" },
			{ "data": 'level', title: "Level" },
		],
	});
}