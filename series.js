(function() { // kell, hogy a változókat (pl. subPage) ne vigye át másik subJS, de mégis hiatkozhassak a webpage.js változókra (pl. bodybgcolor)


// –––––––––––––––  Jobb oszlop funkciók betöltése BEGINS   –––––––––––––––
let subPage = "Series"
let activeElement // amelyiket épp szerkesztem, tehát focusban van (betűket adok/törlök stb.)
let savedRange // kurzor vagy kijelölés helye
let objData = {} // id(szám) és hozzátartozó text (betöltéstől az aktuális)
let objLS = {} // csak a változásokat menti (LS-el szinkron)
let editText // ha ráklikkelek valamelyik td lekéri.. amikor leklikkelek megnézi változott-e (csak akkor mentse el)


// táblázat alapját megrajzolja
let mainTable = document.createElement("table");
function createTable() {
	mainTable.id = subPage+"_table";

	// Első sor (fejléc 1)
	const tr1 = document.createElement("tr");
	tr1.dataset.title = "mainColumn";

	const thCim = document.createElement("th");
	thCim.colSpan = 2;
	thCim.textContent = "cím";
	tr1.appendChild(thCim);

	const thEv = document.createElement("th");
	thEv.rowSpan = 2;
	thEv.dataset.arrange = "number";
	thEv.textContent = "év";
	tr1.appendChild(thEv);

	const thStars = document.createElement("th");
	thStars.rowSpan = 2;
	thStars.dataset.arrange = "number";
	thStars.textContent = "*****";
	tr1.appendChild(thStars);

	const thLastSeen = document.createElement("th");
	thLastSeen.id = "thLastSeen";
	thLastSeen.rowSpan = 2;
	thLastSeen.dataset.arrange = "number";
	thLastSeen.textContent = "last seen";
	tr1.appendChild(thLastSeen);

	const thTimesSeen = document.createElement("th");
	thTimesSeen.rowSpan = 2;
	thTimesSeen.dataset.arrange = "number";
	thTimesSeen.title = "how many times seen";
	thTimesSeen.textContent = "×";
	tr1.appendChild(thTimesSeen);

	mainTable.appendChild(tr1);

	// Második sor (fejléc 2)
	const tr2 = document.createElement("tr");
	tr2.dataset.title = "mainColumn";

	const thMagyar = document.createElement("th");
	thMagyar.dataset.arrange = "text";
	thMagyar.textContent = "magyar";
	tr2.appendChild(thMagyar);

	const thAngol = document.createElement("th");
	thAngol.dataset.arrange = "text";
	thAngol.textContent = "angol";
	tr2.appendChild(thAngol);

	mainTable.appendChild(tr2);

	// Táblázat hozzáadása a DOM-hoz
	document.getElementById("centerDiv").appendChild(mainTable);
}
createTable()



/* Betöltés MENETE...
1. betöltöm a html adatot:
+ van egy empty string: amikor elindítom az oldalt, akkor ebbe betölti a Filmek.html
+ utána ebből kiolvassa object-be (objData) az adatokat
2. betöltöm az LS adatot: ha van LS -> hozzáadja +/ felülírja vele az objectet
+ megnézem van-e törlendő -> update(kiveszi) object(objData)
+ utána megnézi van-e olyan, aminek a text-je LS-ben (subPage+".idText."+id) ott van és új/módosult -> update(átírja) object(objData)
3. megírja a táblázatot (object alapján)
4. ha szerkesztem táblázat -> object(objData)-be és LS-ben (subPage+".Ids") is átírja az adatokat
	+ ha újat adok hozzá, az semmi extra
	+ ha régit írok át, akkor sincs gond, mivel a html-st majd felülírja betöltésnél
	+ ha törlök régit ➜ hozzáadja LS(deletedIDs:id) + kiveszi object(id+text)
  --ls két tömbbe tárolok (+ id-text combok külön)
	newids -> újak/editedek id-je
	deletedids -> deletedek id-je -> kell, akkoris ha nincs new-ba se... ugyanis html-ben még lehet
5. (LS➜)HTML letöltés
+ objectet újraszámozza (1től növekvőbe) lementi subPage.html + törli LS
- legyen automatikus: 1klikkre oldjon meg mindent (tegye egyből a mappába és írja felül a régit)

- piros legyen a letöltés, ha van új / átírtam / töröltem: sőt számot mutasson
*/
// betöltés HTML-ből: 'html felülírása az objectben'
function htmlConvObject(text) {
	text.split(/\r?\n/).forEach(phaseText => {
		let delimiterIndex = phaseText.indexOf(" == ")
		if ( delimiterIndex == -1 ) { return }
		
		let id = phaseText.slice(0,delimiterIndex);
		let rowText = phaseText.slice(delimiterIndex +4);
		//console.log(id+" : "+rowText)
		objData[id] = rowText
	});
}
function loadHTML() {
	// ebbe tölti be a webpage-ket, majd innen másolja ki innerhtml-üket
	let iframe
	if ( document.getElementById("iframe_savedLS") ) {
		iframe = document.getElementById("iframe_savedLS")
	} else {
		iframe = document.createElement("iframe") 
		document.body.appendChild(iframe)
		iframe.style.display = "none"
		iframe.id = "iframe_savedLS"
	}
	iframe.src = subPage+".html"
	
	let handler = function(e) { // #1 amikor betölti az oldalt, akkor indul meg ez
		//console.log("loadHTML --> handler")
		removeEventListener('message', handler, false)
		let text = e.data[1]
		//console.log(text)
		htmlConvObject(text)
		loadRows()
		document.getElementById("thLastSeen").style.backgroundColor = "limegreen"
		arrangeScript(true)
	}
	window.addEventListener('message', handler, false)
}
// betöltés LS-ből: 'html felülírása az objectben'


// Betöltött és összesített adatok alapján elkészíti a sorokat
function loadRows() {
	//console.log("loadRows")
	for ( let id in objData ) {
		let text = objData[id]
		let tr = document.createElement("TR")
		tr.id = "tr."+id
		tr.innerHTML = text
		
		mainTable.insertBefore(tr,mainTable.children[2])
		//console.log(id+" - "+text)
	}
	
	setTimeout(() => {
		let TRs = mainTable.childNodes
		//console.log(TRs.length)
		for ( let i=2; i<TRs.length; i++ ) { setScript(TRs[i]) }
	}, 0);
}

// Sorbarendezés
function arrangeScript(runArrange = false) {
	function F_arrange() {
		const table = mainTable
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

function findHighestId() {
	let maxKey = 0;
	
	// 1. Lekérjük az összes kulcsot stringként
	let keys = Object.keys(objData);

	// 2. Végigmegyünk a kulcsokon
	keys.forEach(keyStr => {
		// 3. Minden string kulcsot számmá konvertálunk
		let keyNum = parseInt(keyStr,10);

		// 4. Megkeressük a legnagyobb értéket
		if ( keyNum > maxKey ) { maxKey = keyNum }
	});

	let idStr = String(maxKey)
	return idStr
}



// tdClick, ctrl-d, ctrl-del
function F_saveSelection() {
	const selection = window.getSelection();
	if (selection.rangeCount > 0) {
		savedRange = selection.getRangeAt(0); // Elmentjük a kurzor vagy kijelölés helyét
	}
}
function F_saveText() {
	//console.log("F_saveText()")
	// webpage.js - nemtom micsinál
	F_unLoadElem(activeElement.parentElement)
	
	let text = activeElement.parentElement.innerHTML
	let id = activeElement.parentElement.id
	id = id.slice(3)
	//console.log(id+": "+text)
	
	// objData frissíti (felveszi/módosít)
	objData[id] = text
				
	// LS-be ha még nincs [newIDs] közt ➜ felveszi 
	if (!objLS.newIDs.includes(id)) { objLS.newIDs.push(id) }

	// LS-ben ha már van [deletedID] közt ➜ letörli
	let index = objLS.deletedIDs.indexOf(id)
	if ( index !== -1 ) { objLS.deletedIDs.splice(index, 1) }
	
	// LS-be felveszi [id-text]
	objLS[id] = text
	
	// LS-be elmenti
	localStorage.setItem(subPage, JSON.stringify(objLS));
}
function setScript(tr) {
	let TDs = tr.childNodes
	let childCount = TDs.length;
	//console.log(TDs.length)
	for ( let i=0; i<childCount; i++ ) {
		//if ( i==1 ) { TDs[i].innerHTML = tr.id }

		TDs[i].contentEditable = true; // Szerkeszthetővé teszi
		TDs[i].onclick = function() {
			this.focus(); // Fókuszt állít az elemre
			//document.getElementById("span_toolbar").style.visibility = "visible"
			activeElement = this
			
			// csak akkor mentse majd, ha változott
			editText = this.innerHTML

			// Ha elhagyja a fókuszt, visszaállítja a contentEditable értéket
			this.onblur = function () { 
				//console.log("onblur")
				F_saveSelection()
				//document.getElementById("span_toolbar").style.visibility = "hidden"
				//this.contentEditable = false // ez elvileg fölös sztem
				
				//console.log(editText +" - "+ this.innerHTML)
				// csak akkor menti, ha változott
				if ( editText != this.innerHTML ) { F_saveText() }
			};
		}
		
		// keywatch a TD elem szerkesztése közben
		TDs[i].addEventListener('keydown', function(event) {
			// Ctrl + DELETE: Delete line
			if (event.ctrlKey && event.key === 'Delete') {
				event.preventDefault(); // Megakadályozza az alapértelmezett viselkedést (keycombo alapból is csinálna valamit)
				
				let filmName = TDs[1].innerHTML
				let confirmed = confirm("Biztosan törlöd? - "+filmName);
				if (confirmed) {
					let id = this.parentElement.id
					id = id.slice(3)
					//console.log("Deleted ID: "+id)
					
					// objData
					delete objData[id]
					
					// LS-ben ha már van [newID] közt ➜ letörli
					let index = objLS.newIDs.indexOf(id)
					if ( index !== -1 ) { objLS.newIDs.splice(index, 1) }

					// LS-ben ha még nincs [deletedID] közt ➜ felveszi
					if (!objLS.deletedIDs.includes(id)) { objLS.deletedIDs.push(id) }
					
					// LS-ben ha van [id-text] ➜ letörli
					if ( objLS[id] ) { delete objLS[id] }
					
					// LS-be elmenti
					localStorage.setItem(subPage, JSON.stringify(objLS))

					// kiveszem az onblur eventet, különben még1x lefutna a törlés előtt valamiért.. (és elmentené az id + text LS-be)
					this.onblur = null
					
					// delete Line = <tr> elem
					this.parentElement.remove()
				}
			}
			// Ctrl + D: Duplikálja a sort
			if (event.ctrlKey && event.key === 'd') {
				event.preventDefault();
				let trParent = this.parentElement;
				let trNew = trParent.cloneNode(true); // Klónozza az egész <tr> elemet
				trParent.parentElement.insertBefore(trNew, trParent); // Beszúrja a klónt az eredeti elé
				//trParent.parentElement.insertBefore(trNew,trParent.nextSibling); // Beszúrja a klónt az eredeti után
				
				// megkeresi a legnagyobb számot object(id), majd ahhoz ad +1et
				let newId = findHighestId() +1
				console.log(newId+": "+trNew.innerHTML)
				
				// elementnek beállítja
				trNew.id = "tr."+newId
				
				// objData felveszi
				objData[newId] = trNew.innerHTML
				
				// LS-be ha még nincs [newIDs] közt ➜ felveszi 
				if (!objLS.newIDs.includes(newId)) { objLS.newIDs.push(newId) }

				// LS-ben ha már van [deletedID] közt ➜ letörli
				index = objLS.deletedIDs.indexOf(newId)
				if ( index !== -1 ) { objLS.deletedIDs.splice(index, 1) }
				
				// LS-be felveszi [id-text]
				objLS[newId] = trNew.innerHTML
				
				// LS-be elmenti
				localStorage.setItem(subPage, JSON.stringify(objLS))

				setScript(trNew)
				
				// Fókuszt állít az új td-re (egy sort felugrik)
				let columnIndex = this.cellIndex;
				let newTdToFocus = trNew.cells[columnIndex];
				newTdToFocus.focus() 
			}
		});
	}
}


// címsorokkal valamit csinál
function mainColumn_doSth(func) {
	const table = mainTable
	let TRs = table.getElementsByTagName("tr")
	for ( let i=0; i<TRs.length; i++ ) {
		if ( TRs[i].getAttribute("data-title") != "mainColumn" ) { continue }
		func(TRs[i])
	}
}


loadHTML()

})();
