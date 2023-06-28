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
	var scripts = document.getElementsByTagName('script');
	for (var script of scripts) {
		var tier = script.getAttribute(key);
		if (tier !== null) {
			return tier;
		}
	}
	
	return null;
}

function GetData(tier) {
	var data = GetTierData(tier);
	
	var idnames = {
		'D75XXNG61KGMNYRJ8S': ['Xorn'],
		'BZC11N0YBT0DZMWCKG': ['-DP exploit-'],
	};
	
	var wrongid = {
		
	};
	
	for (var tour in data) {
		for (var row of data[tour]) {
			if (idnames[row.id] === undefined) {
				idnames[row.id] = [];
			}
			
			if (!idnames[row.id].includes(row.name)) {
				idnames[row.id].push(row.name);
			}
			
			if (location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.hostname === "") {
				if (wrongid[row.name] === undefined) {
					wrongid[row.name] = [];
				}
				
				if (!wrongid[row.name].find(r => r.id === row.id)) {
					wrongid[row.name].push(row);
				}
			}
		}
	}
	
	for (var tour in data) {
		for (var row of data[tour]) {
			var names = idnames[row.id]
			if (names.length > 1) {
				row.name = names[0] + ' (' + names.slice(1).join('; ') + ')';
			}
		}
	}
	
	for (var name in wrongid) {
		if (wrongid[name].length > 1 && wrongid[name].find(r => r.id.startsWith('ID'))) {
			console.log(wrongid[name]);
		}
	}
	
	return data;
}

function GetTierData(tier) {	
	switch (tier) {
		case 'pro':
			return GetProData();
		case 'rookie':
			return GetRookieData();
		case 'expert':
			return GetExpertData();
		default:
			return GetExpertData();
	}
}

function getScreenShot(){
	var tier = GetScriptAttribute('tier');
	var activeTab = GetItem("activeTab", defaultactivetab);
	var table = activeTab[tier + 'tournament'].split('_')[1]
	
    let src = document.getElementById('table_' + table);
    html2canvas(src).then(function(canvas) {
	  canvas.toBlob(function(blob) {
		navigator.clipboard
		  .write([
			new ClipboardItem(
			  Object.defineProperty({}, blob.type, {
				value: blob,
				enumerable: true
			  })
			)
		  ])
		  .then(function() {});
	  });
    });
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
	var personalbests = PersonalBestsTable(highscores);
	var grouped = ImprovementsTable(highscores, personalbests);
	NewcomersTable(grouped);
	ParticipationsTable(grouped);
	BracketWinnersTable(grouped);
	var champions = ChampionsTable(grouped);
	
	PieChart(champions);
	LastTournamentsGraph(data);
	
	var alldata = { 'rookie': GetData('rookie'), 'pro': GetData('pro'), 'expert': GetData('expert') }
	ParticipationGraph(alldata);
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
		deferRender: true,
		columns: [
			{ data: 'rank', title: "Rank" },
			{ data: 'place', title: "Place" },
			{ data: 'name', title: "Name", width: 170 },
			{ data: (row, type, val, meta) => FormatTableNumber(row.level, type, val, meta), title: "Level", width: 30, className: 'dt-body-right dt-head-center' },
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
		deferRender: true,
		columns: [
			{ data: 'rank', title: "Rank" },
			{ data: 'place', title: "Place" },
			{ data: 'name', title: "Name", width: 170 },
			{ data: (row, type, val, meta) => FormatTableNumber(row.level, type, val, meta), title: "Level", width: 30, className: 'dt-body-right dt-head-center' },
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
		deferRender: true,
		columns: [
			{ data: 'index', title: "Rank" },
			{ data: 'personal', title: "#", className: 'grey' },
			{ data: 'name', title: "Name", width: 170 },
			{ data: (row, type, val, meta) => FormatTableNumber(row.level, type, val, meta), title: "Level", width: 30, className: 'dt-body-right dt-head-center' },
			{ data: 'date', title: "Date", className: 'dt-center' },
		],
	});
	
	return highscores;
}

function PersonalBestsTable(highscores) {
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
		deferRender: true,
		columns: [
			{ data: 'index', title: "Rank" },
			{ data: 'name', title: "Name", width: 170 },
			{ data: (row, type, val, meta) => FormatTableNumber(row.level, type, val, meta), title: "Level", width: 30, className: 'dt-body-right dt-head-center' },
			{ data: 'date', title: "Date", className: 'dt-center' },
		],
	});
	
	return personalbests;
}

function ImprovementsTable(highscores, personalbests) {
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
		deferRender: true,
		columns: [
			{ data: 'name', title: "Name" },
			{ data: (row, type, val, meta) => FormatTableNumber(row.level, type, val, meta), title: "Level", className: 'dt-body-right dt-head-center' },
			{ data: (row, type, val, meta) => FormatTableNumber(row.previous, type, val, meta), title: "Prev.", className: 'dt-body-right dt-head-center grey' },
			{ data: 'previousdate', title: "Prev. Date", className: 'dt-center grey' },
			{ data: (row, type, val, meta) => FormatTableNumber(row.improvement, type, val, meta, '+'), title: "Incr.", className: 'dt-body-right dt-head-center' },
		],
	});
	
	return grouped;
}

function NewcomersTable(grouped) {
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
		deferRender: true,
		columns: [
			{ data: 'index', title: "Rank" },
			{ data: 'name', title: "Name", width: 170 },
			{ data: (row, type, val, meta) => FormatTableNumber(row.level, type, val, meta), title: "Level", width: 30, className: 'dt-body-right dt-head-center' },
			{ data: 'date', title: "Date", className: 'dt-center' },
		],
	});
}

function ParticipationsTable(grouped) {
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
		deferRender: true,
		columns: [
			{ data: 'name', title: "Name", width: 170 },
			{ data: (row, type, val, meta) => FormatTableNumber(row.participations, type, val, meta), title: "Amount", className: 'dt-body-right dt-head-center' },
			{ data: 'date', title: "Since", className: 'dt-center' },
		],
	});
}

function BracketWinnersTable(grouped) {
	// Get the amount of wins for each id and some other info
	var winners = [];
	for (var id in grouped) {
		var wins = grouped[id].filter((a) => a.place == 1);
		var amount = wins.length;
		if (amount > 0) {			
			var info = {
				name: wins[0].name,
				amount: amount,
				highestlevel: wins.reduce((a, b) => a.level > b.level ? a : b).level,
				highestdate: wins.reduce((a, b) => a.date > b.date ? a : b).date,
				lowestlevel: ((amount == 1) ? '' : wins.reduce((a, b) => a.level < b.level ? a : b).level),
				lowestdate: ((amount == 1) ? '' : wins.reduce((a, b) => a.date < b.date ? a : b).date),
			}
			winners.push(info);
		}
	}	
		
	// Fill table
	$('#table_bracketwinners').DataTable({
		data: winners,
		autoWidth: false,
		pageLength: 25,
		lengthMenu: [ [10, 25, 50, 100, -1], [10, 25, 50, 100, "All"] ],
		order: [[1, 'desc'], [2, 'desc']],
		deferRender: true,
		columns: [
			{ data: 'name', title: "Name", width: 170 },
			{ data: (row, type, val, meta) => FormatTableNumber(row.amount, type, val, meta), title: "Amount", className: 'dt-body-right dt-head-center' },
			{ data: (row, type, val, meta) => FormatTableNumber(row.highestlevel, type, val, meta), title: "Highest", className: 'dt-body-right dt-head-center' },
			{ data: 'highestdate', title: "Date", className: 'dt-center' },
			{ data: (row, type, val, meta) => FormatTableNumber(row.lowestlevel, type, val, meta), title: "Lowest", className: 'dt-body-right dt-head-center' },
			{ data: 'lowestdate', title: "Date", className: 'dt-center' },
		],
	});
}

function ChampionsTable(grouped) {
	// Get the amount of wins for each id and some other info
	var champions = [];
	for (var id in grouped) {
		var wins = grouped[id].filter((a) => a.rank == 1);
		var amount = wins.length;
		if (amount > 0) {			
			var info = {
				name: wins[0].name,
				amount: amount,
				highestlevel: wins.reduce((a, b) => a.level > b.level ? a : b).level,
				highestdate: wins.reduce((a, b) => a.date > b.date ? a : b).date,
				lowestlevel: ((amount == 1) ? '' : wins.reduce((a, b) => a.level < b.level ? a : b).level),
				lowestdate: ((amount == 1) ? '' : wins.reduce((a, b) => a.date < b.date ? a : b).date),
			}
			champions.push(info);
		}
	}	
		
	// Fill table
	$('#table_champions').DataTable({
		data: champions,
		autoWidth: false,
		pageLength: 25,
		lengthMenu: [ [10, 25, 50, 100, -1], [10, 25, 50, 100, "All"] ],
		order: [[1, 'desc'], [2, 'desc']],
		deferRender: true,
		columns: [
			{ data: 'name', title: "Name", width: 170 },
			{ data: (row, type, val, meta) => FormatTableNumber(row.amount, type, val, meta), title: "Amount", className: 'dt-body-right dt-head-center' },
			{ data: (row, type, val, meta) => FormatTableNumber(row.highestlevel, type, val, meta), title: "Highest", className: 'dt-body-right dt-head-center' },
			{ data: 'highestdate', title: "Date", className: 'dt-center' },
			{ data: (row, type, val, meta) => FormatTableNumber(row.lowestlevel, type, val, meta), title: "Lowest", className: 'dt-body-right dt-head-center' },
			{ data: 'lowestdate', title: "Date", className: 'dt-center' },
		],
	});
	
	return champions;
}

function FormatTableNumber(number, type, val, meta, prefix = null) {
	if (type === "display") {
		if (prefix != null) {
			return prefix + number.toLocaleString();			
		}

		return number.toLocaleString();
	}

	return number;
}

function PieChart(data) {
	const ctx = document.getElementById('chart_champions');
	
	var topchampions = data.sort((a, b) => b.amount - a.amount).slice(0, 10);
	var labels = topchampions.map(d => d.name);
	var dataset = topchampions.map(d => d.amount);

	new Chart(ctx, {
		type: 'pie',
		plugins: [ChartDataLabels],
		data: {
			labels: labels,
			datasets: [{
				data: dataset,
				borderWidth: 0.5,
			}]
		},
		options: {
			color: '#fff',
			plugins: {
				datalabels: {
					color: '#333',
					labels: {
						value: {
							font: {
								weight: 'bold',
							},
						},
					},
					formatter: function(value, context) {
						return context.chart.data.labels[context.dataIndex] + ': ' + value;
					},
				}
			}
		}
	});
}

function LastTournamentsGraph(data) {	
	var lastdates = Object.keys(data).slice(0, 7);
	
	var maxdate = lastdates.reduce((a,b) => data[a].length > data[b].length ? a : b)
	var maxlength = data[maxdate].length;	
	var datasets = lastdates.map(d => ({label: d, data: data[d].map(t => t.level), borderWidth: 0.5}));

	new Chart(document.getElementById('chart_lasttournaments'), {
		type: 'line',
		data: {
			labels: Array(maxlength).fill().map((a,b) => b + 1),
			datasets: datasets,
		},
		options: {
			color: '#fff',
			plugins: {
				title: {
					display: true,
					text: 'Last 7 tournaments',
					color: '#ddd',
					font: {
                        size: 18,
                    },
				}
			},
			scales: {
				y: {
					grid: {
						color: '#777'
					},
					ticks: {
						color: '#ddd'
					}
				},
				x: {
					grid: {
						color: '#777'
					},
					ticks: {
						color: '#ddd'
					}
				}
			}
		}
	});
	
	var maxdate = lastdates.reduce((a,b) => data[a][0].level > data[b][0].level ? a : b)
	var maxlevel = data[maxdate][0].level;
	var factor = Math.pow(10, maxlevel.toString().length-2);
	var distribution = distribute(Math.ceil(maxlevel / factor) * factor, 10);
	
	var labels = distribution.map(d => d.literal);
	var datasets = lastdates.map(d => {
		var buckets = {};
		distribution.map(d => buckets[d.literal] = 0);
		data[d].map(t => {
			var bucket = distribution.find(d => t.level <= d.limit);
			buckets[bucket.literal]++;
		});
		
		return ({label: d, data: buckets, borderWidth: 0.5});
	});
	
	new Chart(document.getElementById('chart_lasttournamentsdistribution'), {
		type: 'bar',
		data: {
			labels: labels,
			datasets: datasets,
		},
		options: {
			color: '#fff',
			plugins: {
				title: {
					display: true,
					text: 'Distribution of scores of the last 7 tournaments',
					color: '#ddd',
					font: {
                        size: 18,
                    },
				}
			},
			scales: {
				y: {
					grid: {
						color: '#777'
					},
					ticks: {
						color: '#ddd'
					}
				},
				x: {
					grid: {
						color: '#777'
					},
					ticks: {
						color: '#ddd'
					}
				}
			}
		}
	});
}

function distribute (max, buckets) {
    var arr = [], rpt = max / buckets, groupLiteral_low;
    for (var i = 0; i < max; i += rpt) {
        if (Math.ceil(i) != i || i==0) {
            groupLiteral_low = Math.ceil(i);
        } else {
            groupLiteral_low = Math.ceil(i)+1;
        }
        arr.push({
            "limit": (Math.floor(rpt+i)),
            "literal": groupLiteral_low + "-" + (Math.floor(rpt+i))
        });
    }
    return arr; 
}

function ParticipationGraph(alldata) {
	console.time('Participation table generation took');
	var labels = Object.keys(alldata['rookie']).sort();
	var datasets = Object.keys(alldata).map(t => {
		var dates = Object.keys(alldata[t]).sort();
		var tour = {};
		dates.map(d => {
			tour[d] = alldata[t][d].length
		});
		return { 
			label: t, 
			data: tour,
		};
	});
		
	new Chart(document.getElementById('chart_participation'), {
		type: 'line',
		data: {
			labels: labels,
			datasets: datasets,
		},
		options: {
			color: '#fff',
			plugins: {
				title: {
					display: true,
					text: 'Participation for each tournament',
					color: '#ddd',
					font: {
                        size: 18,
                    },
				}
			},
			scales: {
				y: {
					grid: {
						color: '#777'
					},
					ticks: {
						color: '#ddd'
					}
				},
				x: {
					grid: {
						color: '#777'
					},
					ticks: {
						color: '#ddd'
					}
				}
			}
		}
	});
	console.timeEnd('Participation table generation took');
}