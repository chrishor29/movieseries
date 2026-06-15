(function() { // kell, hogy a változókat (pl. subPage) ne vigye át másik subJS, de mégis hivatkozhassak a webpage.js változókra (pl. bodybgcolor)

function loadHTML() {
	// ebbe tölti be a webpage-ket, majd innen másolja ki innerhtml-üket
	let iframe = document.createElement("iframe") 
	document.body.appendChild(iframe)
	iframe.style.display = "none"
	iframe.src = dataFile
	
	let handler = function(e) { // #1 amikor betölti az oldalt, akkor indul meg ez
		//console.log("loadHTML --> handler")
		removeEventListener('message', handler, false)
		document.getElementById("centerDiv").innerHTML = e.data[1]
		
		let table = document.getElementById("mainTable")
		document.getElementById("thCim").innerHTML = "cím (" + table.rows.length + ")"
		
		document.getElementById("thLastSeen").style.backgroundColor = "limegreen"
		arrangeScript(true)
	}
	window.addEventListener('message', handler, false)
}

// Sorbarendezés
function arrangeScript(runArrange = false) {
	function F_arrange() {
		const table = document.getElementById("mainTable")
		const rows = Array.from(table.rows); // Sorokat tömbbé alakítjuk
//  console.log(table.innerHTML) 

		// Különválasztjuk az első 2 sort, amit nem kell rendezni
		const headerRows = rows.slice(0, 2); // Az első 2 sor
		const sortableRows = rows.slice(2);  // A többi sor, amit rendezünk
/*
sortableRows.forEach((r, i) => {
  console.log("Row", i, 
              "cells.length =", r.cells.length, 
              "innerHTML =", r.innerHTML);
});
*/
		
		// megnézem melyik oszlopot kell rendezni, és hogy
		let rowNum, color, arrangeType
		function F_checkRow(tr) {
			let columnIndex = -1
			let THs = tr.getElementsByTagName("th")
			for ( let i=0; i<THs.length; i++ ) { 
				// colspan miatt kell
				let colspan = parseInt(THs[i].getAttribute("colspan")) || 1;
				columnIndex += colspan;

				//console.log("TH:", THs[i].innerText, "colspan:", colspan, "columnIndex:", columnIndex);

				if ( !THs[i].getAttribute("data-arrange") ) { continue }
				if ( THs[i].style.backgroundColor != "" ) { 
					rowNum = columnIndex
					color = THs[i].style.backgroundColor
					arrangeType = THs[i].getAttribute("data-arrange")
				}
			}
		}
		mainColumn_doSth(F_checkRow)
		//console.log(rowNum+" - "+color+" - "+arrangeType)
		
		function F_cellText(tr) {
			if ( !tr.cells[rowNum] ) { return "" }
			return tr.cells[rowNum].innerText
		}

		// Sorok rendezése az rowNum-edik oszlop értéke szerint
		const sortedRows = sortableRows.sort((a, b) => {
			let valueA
			let valueB
			if ( arrangeType == "text" ) { // ABC sorrend
				const textA = F_cellText(a).toLowerCase()
				const textB = F_cellText(b).toLowerCase()
				//alert(textA+" - "+textB)
				
				if ( color == "limegreen" ) {
					return textA.localeCompare(textB) // Csökkenő sorrend
				} else { // goldenrod
					return textB.localeCompare(textA) // Növekvő sorrend
				}
			} else if ( arrangeType == "number" ) { { // számtani sorrend
			//	if ( rowNum == 3 ) { // film értékelés esetén a szám utáni +/- is játszik
					function F_calc(text) {
						// ha üres, 0-nak vesszük
						if ( text == "" ) { text = "0" }
						
						let plus = 0
						if ( text.indexOf("-") != -1 ) { plus = -1 }
						if ( text.indexOf("+") != -1 ) { plus = 1 }
						
						// ha évszám, kihagyjuk a pontot(.)
						if ( rowNum == 4 ) { text = text.replace('.','') }
						
						let num = parseInt(text) * 3 + plus 
						return num
					}
					valueA = F_calc(F_cellText(a))
					//console.log(a.cells[1].innerText+": "+valueA)
					valueB = F_calc(F_cellText(b))
					//console.log(b.cells[1].innerText+": "+valueB)
			//	} else {
			//		valueA = a.cells[rowNum].innerText
			//		valueB = b.cells[rowNum].innerText
				}
				
				if ( color == "limegreen" ) {
					return valueB - valueA // Csökkenő sorrend
				} else { // goldenrod
					return valueA - valueB // Növekvő sorrend
				}
			}
		});

		// A rendezett sorokat újra hozzáadjuk a táblázathoz
		table.innerHTML = ""; // Töröljük az eredeti tartalmat
		headerRows.forEach(row => table.appendChild(row));
		sortedRows.forEach(row => table.appendChild(row));
	}
	
	function F_bgColorDefault(tr) {
		let THs = tr.getElementsByTagName("th")
		for ( let i=0; i<THs.length; i++ ) {
			if ( THs[i].getAttribute("data-arrange") ) { THs[i].style.backgroundColor = '' }
		}
	}
	
	function F_thClick(tr) {
		let THs = tr.getElementsByTagName("th")
		for ( let i=0; i<THs.length; i++ ) {
			if ( !THs[i].getAttribute("data-arrange") ) { continue }
			THs[i].style.cursor = "pointer"
			THs[i].onclick = function() {
				let newColor
				if ( this.style.backgroundColor == "limegreen" ) {
					newColor = "goldenrod"
				} else {
					newColor = "limegreen"
				}
				mainColumn_doSth(F_bgColorDefault)
				this.style.backgroundColor = newColor
				F_arrange()
			}
		}
	}
	mainColumn_doSth(F_thClick)
	if ( runArrange ) { F_arrange() }
}

// címsorokkal valamit csinál
function mainColumn_doSth(func) {
	let table = document.getElementById("mainTable")
	let TRs = table.getElementsByTagName("tr")
	for ( let i=0; i<TRs.length; i++ ) {
		if ( TRs[i].getAttribute("data-title") != "mainColumn" ) { continue }
		func(TRs[i])
	}
}

loadHTML()

})();
