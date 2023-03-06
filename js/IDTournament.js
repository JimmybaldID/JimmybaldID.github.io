var defaultactivetab = {
	"rookietournament": "tab_tournament_trigger",
	"protournament": "tab_tournament_trigger",
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

function GetScriptAttribute(key) {
	var script = document.getElementsByTagName('script');
	return script[script.length - 1].getAttribute(key);
}

function GetData(tier) {
	switch (tier) {
		case 'pro':
			return GetProData();
		case 'rookie':
			return GetRookieData();
		default:
			return GetProData();
	}
}

function OnLoad() {
	var tier = GetScriptAttribute('tier');
	var activeTab = GetItem("activeTab", defaultactivetab);
	$('#' + activeTab[tier + 'tournament']).tab('show');
}

$(document).ready(function () {
	var tier = GetScriptAttribute('tier');
	var data = GetData(tier);

	TournamentTable(data);
	var highscores = HighscoresTable(data);
	var personalbests = PersonalBestsTable(data, highscores);
	var grouped = ImprovementsTable(data, highscores, personalbests);
	NewcomersTable(data, grouped);
	ParticipationsTable(data, grouped);
});

function handleDateChange(event) {
	var element = event.target;
	var value = element.value;
	
	var tier = GetScriptAttribute('tier');
	var data = GetData(tier);
	$('#table_tournament').DataTable().destroy();
	$('#table_tournament').DataTable({
		data: data[$('#dateselect').val()],
		info: false,
		pageLength: -1,
		lengthMenu: [ [10, 25, 50, 100, -1], [10, 25, 50, 100, "All"] ],
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
	var tier = GetScriptAttribute('tier');
	activeTab[tier + 'tournament'] = key;
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

function TournamentTable(data) {	
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
		lengthMenu: [ [10, 25, 50, 100, -1], [10, 25, 50, 100, "All"] ],
		autoWidth: false,
		columns: [
			{ data: 'rank', title: "Rank" },
			{ data: 'place', title: "Place" },
			{ data: 'name', title: "Name", width: 170 },
			{ data: (row, a, b, c) => row.level.toLocaleString(undefined), title: "Level", width: 30, className: 'dt-body-right dt-head-center' },
		],
	});
}

function HighscoresTable(data) {	
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
		lengthMenu: [ [10, 25, 50, 100, -1], [10, 25, 50, 100, "All"] ],
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
	
	return highscores;
}

function PersonalBestsTable(data, highscores) {
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
		lengthMenu: [ [10, 25, 50, 100, -1], [10, 25, 50, 100, "All"] ],
		pagingType: 'simple',
		order: [[2, 'desc']],
		columns: [
			{ data: 'index', title: "Rank" },
			{ data: 'name', title: "Name", width: 170 },
			{ data: (row, a, b, c) => row.level.toLocaleString(undefined), title: "Level", width: 30, className: 'dt-body-right dt-head-center' },
			{ data: 'date', title: "Date", className: 'dt-center' },
		],
	});
	
	return personalbests;
}

function ImprovementsTable(data, highscores, personalbests) {
	// Group by id
	var grouped = GroupBy(highscores, 'id');
	
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
			{ data: (row, a, b, c) => row.previous.toLocaleString(undefined), title: "Prev.", className: 'dt-body-right dt-head-center grey' },
			{ data: 'previousdate', title: "Prev. Date", className: 'dt-center grey' },
			{ data: (row, a, b, c) => '+' + row.improvement.toLocaleString(undefined), title: "Incr.", className: 'dt-body-right dt-head-center' },
		],
	});
	
	return grouped;
}

function NewcomersTable(data, grouped) {
	// Get the first Pro result for each id.
	var newcomers = [];
	for (var id in grouped) {
		var firstscore = grouped[id].reduce((a, b) => a.date < b.date ? a : b);
		newcomers.push(firstscore);
	}
	
	newcomers.sort((a, b) => b.level - a.level)
	
	// Update the new rank in the array
	var n = 1;
	newcomers.forEach(function (r) {
		r.index = n++;
	});
		
	// Fill table
	$('#table_newcomers').DataTable({
		data: newcomers,
		autoWidth: false,
		info: false,
		pageLength: 25,
		lengthMenu: [ [10, 25, 50, 100, -1], [10, 25, 50, 100, "All"] ],
		order: [[2, 'desc']],
		columns: [
			{ data: 'index', title: "Rank" },
			{ data: 'name', title: "Name", width: 170 },
			{ data: (row, a, b, c) => row.level.toLocaleString(undefined), title: "Level", width: 30, className: 'dt-body-right dt-head-center' },
			{ data: 'date', title: "Date", className: 'dt-center' },
		],
	});
}

function ParticipationsTable(data, grouped) {
	// Get the total participations for each id.
	var participations = [];
	for (var id in grouped) {
		var firstscore = grouped[id].reduce((a, b) => a.date < b.date ? a : b);
		var amount = grouped[id].length;
		firstscore.participations = amount;
		participations.push(firstscore);
	}
		
	// Fill table
	$('#table_participations').DataTable({
		data: participations,
		autoWidth: false,
		info: false,
		pageLength: 25,
		lengthMenu: [ [10, 25, 50, 100, -1], [10, 25, 50, 100, "All"] ],
		order: [[1, 'desc'], [0, 'asc']],
		columns: [
			{ data: 'name', title: "Name", width: 170 },
			{ data: (row, a, b, c) => row.participations.toLocaleString(undefined), title: "Amount", className: 'dt-body-right dt-head-center' },
			{ data: 'date', title: "Since", className: 'dt-center' },
		],
	});
}

