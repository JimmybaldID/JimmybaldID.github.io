var defaultactivetab = {
	"idtournament": "tab_tournament_trigger",
}

function GetItem(key, obj) {	
	try {
		var json = window.localStorage.getItem(key);
		if (json === undefined || json === null) {
			StoreItem(key, obj);
		}
		else {
			obj = JSON.parse(json);
		}
	
		return obj;
	}
	catch (e) {
		if (e.name === "NS_ERROR_FILE_CORRUPTED") {
			alert("Somehow your local storage file got corrupted. You will have to manually clear this.")
			return obj;
		}
	}
}

function StoreItem(key, obj) {
	window.localStorage.setItem(key, JSON.stringify(obj));
}

function OnLoad() {
	var activeTab = GetItem("activeTab", defaultactivetab);
	$('#' + activeTab.idtournament).tab('show');
}

$(document).ready(function () {
	var data = GetProData();

	// %%%%%%%%%%%%%%%%%%%%%% Tournament %%%%%%%%%%%%%%%%%%%%%%%%
	// Set dates in select
	for (let key in data) {
		let option = document.createElement("option");
		option.setAttribute('value', key);
	  
		let optionText = document.createTextNode(key);
		option.appendChild(optionText);
	  
		$('#dateselect').append(option);
	}

	// Fill table
	$('#table_tournament').DataTable({
		data: data[$('#dateselect').val()],
		info: false,
		pageLength: -1,
		lengthMenu: [ [25, 50, 100, -1], [25, 50, 100, "All"] ],
		autoWidth: false,
		columns: [
			{ data: 'rank', title: "Rank" },
			{ data: 'place', title: "Place" },
			{ data: 'name', title: "Name", width: 170 },
			{ data: (row, a, b, c) => row.level.toLocaleString(undefined), title: "Level", width: 30, className: 'dt-body-right dt-head-center' },
		],
	});
	// %%%%%%%%%%%%%%%%%%%%%% Tournament %%%%%%%%%%%%%%%%%%%%%%%%

	// %%%%%%%%%%%%%%%%%%%%%% Highscores %%%%%%%%%%%%%%%%%%%%%%%%
	// Get all entries in 1 array
	var highscores = [];
	for (key in data) {
		for (r of data[key]) {
			r.date = key;
			highscores.push(r);
		}
	}
	
	// Sort all entries
	highscores.sort(function (a, b) {
		return b.level - a.level;
	});
	
	// Add a new rank to the array
	var n = 1;
	var personalranks = {};
	highscores.forEach(function (r) {
		r.index = n++;
		personalranks[r.id] = personalranks[r.id] ? personalranks[r.id] + 1 : 1;
		r.personal = personalranks[r.id];
	});

	// Fill table
	$('#table_highscores').DataTable({
		data: highscores,
		info: false,
		pageLength: 25,
		lengthMenu: [ [25, 50, 100, -1], [25, 50, 100, "All"] ],
		autoWidth: false,
		order: [[3, 'desc']],
		columns: [
			{ data: 'index', title: "Rank" },
			{ data: 'personal', title: "#", className: 'grey' },
			{ data: 'name', title: "Name", width: 170 },
			{ data: (row, a, b, c) => row.level.toLocaleString(undefined), title: "Level", width: 30, className: 'dt-body-right dt-head-center' },
			{ data: 'date', title: "Date", className: 'dt-center' },
		],
	});
	// %%%%%%%%%%%%%%%%%%%%%% Highscores %%%%%%%%%%%%%%%%%%%%%%%%
	
	// %%%%%%%%%%%%%%%%%%%%%% Personal Bests %%%%%%%%%%%%%%%%%%%%%%%%
	// Group by id
	var grouped = GroupBy(highscores, 'id');
	
	// Filter highest level for each id
	var personalbests = highscores.filter(PersonalBests);
	
	// Update the new rank in the array
	var n = 1;
	personalbests.forEach(function (r) {
		r.index = n++;
	});

	// Fill table
	$('#table_personalbests').DataTable({
		data: personalbests,
		autoWidth: false,
		info: false,
		pageLength: 25,
		lengthMenu: [ [25, 50, 100, -1], [25, 50, 100, "All"] ],
		pagingType: 'simple',
		order: [[2, 'desc']],
		columns: [
			{ data: 'index', title: "Rank" },
			{ data: 'name', title: "Name", width: 170 },
			{ data: (row, a, b, c) => row.level.toLocaleString(undefined), title: "Level", width: 30, className: 'dt-body-right dt-head-center' },
			{ data: 'date', title: "Date", className: 'dt-center' },
		],
	});
	// %%%%%%%%%%%%%%%%%%%%%% Personal Bests %%%%%%%%%%%%%%%%%%%%%%%%
	
	// %%%%%%%%%%%%%%%%%%%%%% Personal Best Improvements %%%%%%%%%%%%%%%%%%%%%%%%
	// Add the previous info and improvement
	personalbests.forEach(function (r) {
		if (grouped[r.id] !== undefined
			&& grouped[r.id][1] !== undefined) {
				var previousbest = grouped[r.id].find(x => x.date < r.date);
				if (previousbest !== undefined) {
					r.previous = previousbest.level;
					r.previousdate = previousbest.date;
					r.improvement = r.level - previousbest.level;
				}
				else {
					r.previous = '';
					r.previousdate = '';
					r.improvement = r.level;
				}					
		}
		else {
			r.previous = '';
			r.previousdate = '';
			r.improvement = r.level;
		}
	});
	
	// Fill table
	$('#table_personalbestimprovements').DataTable({
		data: personalbests.filter(x => x.date.valueOf() === $('#dateselect').val().valueOf()),
		autoWidth: false,
		info: false,
		paging: false,
		order: [[1, 'desc']],
		columns: [
			{ data: 'name', title: "Name" },
			{ data: (row, a, b, c) => row.level.toLocaleString(undefined), title: "Level", className: 'dt-body-right dt-head-center' },
			//{ data: 'date', title: "Date", className: 'dt-center' },
			{ data: (row, a, b, c) => row.previous.toLocaleString(undefined), title: "Prev.", className: 'dt-body-right dt-head-center grey' },
			{ data: 'previousdate', title: "Prev. Date", className: 'dt-center grey' },
			{ data: (row, a, b, c) => '+' + row.improvement.toLocaleString(undefined), title: "Incr.", className: 'dt-body-right dt-head-center' },
		],
	});
	// %%%%%%%%%%%%%%%%%%%%%% Personal Best Improvements %%%%%%%%%%%%%%%%%%%%%%%%
});

function handleDateChange(event) {
	var element = event.target;
	var value = element.value;
	
	var data = GetProData();
	$('#table_tournament').DataTable().destroy();
	$('#table_tournament').DataTable({
		data: data[$('#dateselect').val()],
		info: false,
		pageLength: -1,
		lengthMenu: [ [25, 50, 100, -1], [25, 50, 100, "All"] ],
		autoWidth: false,
		columns: [
			{ data: 'rank', title: "Rank" },
			{ data: 'place', title: "Place" },
			{ data: 'name', title: "Name", width: 170 },
			{ data: (row, a, b, c) => row.level.toLocaleString(undefined), title: "Level", width: 30, className: 'dt-body-right dt-head-center' },
		],
	});
}

function handleTabChange(key) {
	var activeTab = GetItem("activeTab", defaultactivetab);
	activeTab.idtournament = key;
	StoreItem("activeTab", activeTab);
}

function PersonalBests(value, index, array) {
	return array.findIndex(x => x.id === value.id) === index;
}

function GroupBy(xs, key) {
	return xs.reduce(function(rv, x) {
		(rv[x[key]] = rv[x[key]] || []).push(x);
		return rv;
	}, {});
};