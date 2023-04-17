

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

function getScreenShot(){
    let src = document.getElementById('table_tournament');
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

function GetGroupedData() {
	//console.time('getdata');
	var expert = GetExpertData();
	var pro = GetProData();
	var rookie = GetRookieData();
	//console.timeEnd('getdata');
	
	var idnames = {
		'D75XXNG61KGMNYRJ8S': ['Xorn'],
	};
	
	var wrongid = {};
	
	//console.time('CollectAllNames');
	CollectAllNames(idnames, wrongid, expert);
	CollectAllNames(idnames, wrongid, pro);
	CollectAllNames(idnames, wrongid, rookie);
	//console.timeEnd('CollectAllNames');
	
	//console.time('CombineAllScores');
	var allscores = [];
	CombineAllScores(allscores, idnames, expert, 'Expert');
	CombineAllScores(allscores, idnames, pro, 'Pro');
	CombineAllScores(allscores, idnames, rookie, 'Rookie');
	//console.timeEnd('CombineAllScores');
	
	//console.time('wrongid');
	for (var name in wrongid) {
		if (wrongid[name].length > 1 && wrongid[name].find(r => r.id.startsWith('ID'))) {
			console.log(wrongid[name]);
		}
	}
	//console.timeEnd('wrongid');
	
	return allscores;
}

function CollectAllNames(idnames, wrongid, data) {
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
}

function CombineAllScores(allscores, idnames, data, tier) {
	for (var tour in data) {
		for (var row of data[tour]) {
			var names = idnames[row.id]
			if (names.length > 1) {
				row.name = names[0] + ' (' + names.slice(1).join('; ') + ')';
			}
			
			row.date = tour;
			row.tier = tier;			
			allscores.push(row);
		}
	}
}

$(document).ready(function () {
	var data = GetGroupedData();
	TournamentTable(data);
});

function TournamentTable(data) {
	console.time('Table generation took');
	$('#table_tournament').DataTable({
		data: data,
		info: false,
		autoWidth: false,
		pageLength: 25,
		lengthMenu: [ [10, 25, 50, 100, -1], [10, 25, 50, 100, "All"] ],
		order: [[0, 'asc'], [5, 'desc']],
		search: { search: 'Jimmybald' },
		deferRender: true,
		columns: [
			{ data: 'name', title: "Name", width: 170 },
			{ data: 'tier', title: "Tier" },
			{ data: 'rank', title: "Rank" },
			{ data: 'place', title: "Place" },
			{ data: (row, type, val, meta) => FormatTableNumber(row.level, type, val, meta), title: "Level", width: 30, className: 'dt-body-right dt-head-center' },
			{ data: 'date', title: "Date", className: 'dt-center' },
		],
	});
	console.timeEnd('Table generation took');
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