let myTable;
let selezionata = "1"; //crea variabile per che fiume mostrare   
let riga;                  

let continenti = ["Asia", "Europe", "South America", "North America", "Africa", "Oceania"];
let nomiContinenti = ["Asia", "Europa", "Sud America", "Nord America", "Africa", "Oceania"]; //per tradurre nomi continenti

let margine = 55;
let larghezzaTesto; //larghezza di una colonna, dipende dalla finestra
let colonna2; //dove inizia la seconda colonna

let colFreddo;
let colCaldo;

let colMinChiaro;   //scala azzurro ghiaccio, per la temperatura minima
let colMinScuro;
let colMaxChiaro;   //scala rossa, per la temperatura massima
let colMaxScuro;

async function setup() {
  myTable = await loadTable("assets/rivers_world.csv", ",", "header");

  createCanvas(windowWidth, windowHeight);
  textFont("Futura, 'Century Gothic', 'Trebuchet MS', sans-serif");

  colFreddo = color("#0e38e0"); //assegno colori a variabili, poi richiamati nelle funzioni
  colCaldo = color("#1aeeee");

  colMinChiaro = color("#effafd");   
  colMinScuro = color("#bce6ff");    
  colMaxChiaro = color("#ff8f76");   
  colMaxScuro = color("#c60f1e");   

  let parametri = getURLParams(); //legge parametri nell'indirizzo
  if (parametri.id) {
    selezionata = parametri.id; //se l'indirizzo contiene un id, sostituisce il valore di partenza
  }
}

//colore in base alla temperatura media
function coloreTemperatura(temperatura) {
  let quantita = map(temperatura, -7.5, 27.5, 0, 1);
  return lerpColor(colFreddo, colCaldo, quantita);
}

//scala per la temperatura minima
function coloreMinima(temperatura) {
  let quantita = map(temperatura, -20, 25, 0, 1, true); //true blocca risultato tra 0 e 1
  return lerpColor(colMinChiaro, colMinScuro, quantita); //mescola colore temp minima
}

//scala per la temperatura massima 
function coloreMassima(temperatura) {
  let quantita = map(temperatura, 5, 30, 0, 1, true); 
  return lerpColor(colMaxChiaro, colMaxScuro, quantita);
}

// bottone: rettangolo con il testo, più chiaro se il mouse è sopra
function drawBottone(testo, x, y) {
  if (sopraBottone(x, y)) {
    fill("#1f2743");
  } else {
    fill("#081b31");
  }
  stroke("#defbff");
  strokeWeight(1.5);
  rect(x, y, 130, 34, 6);
  noStroke();
  fill("#defbff");
  textSize(15);
  textAlign(CENTER, CENTER);
  text(testo, x + 65, y + 17);
  textAlign(LEFT, TOP);
}

//true se il mouse è sopra il bottone che parte in (x, y)
function sopraBottone(x, y) {
  return mouseX > x && mouseX < x + 130 && mouseY > y && mouseY < y + 34;
}

function drawNavigazione() {
  drawBottone("← Tutti i fiumi", margine, 30);
}

//continente e nome del fiume
function drawIntestazione() {
  let continente = nomiContinenti[continenti.indexOf(riga.getString("continent"))]; //legge continente in inglese, cerca sua posizione e gli fa prendere nome italiano
  noStroke();
  fill("#defbff");
  textSize(30);
  text(continente, margine, 95);
  fill("#defbff");
  textSize(40);
  text(riga.getString("name"), margine, 140, larghezzaTesto, 100);
}

//il fiume come una linea: lunghezza, spessore e colore come nella pagina 1
function drawFiume() {
  let lunghezza = riga.getNum("length");
  let portata = riga.getNum("discharge");
  let lunghezzaLinea = map(lunghezza, 0, 6650, 6, larghezzaTesto); //0 km sono 6 px, 6650 km sono tutta la larghezza della colonna
  let spessore = map(log(portata), log(100), log(209000), 3, 16); //scala logaritmica più spessa della pagina generale (da 3 a 16px)
  let colore = coloreTemperatura(riga.getNum("avg_temp")); //colore temperatura media, come nella generale

  //linea tenue lunga quanto il fiume più lungo (6650 km): serve da confronto
  stroke(red(colore), green(colore), blue(colore), 50); //tre componenti del colore, in trasparenza
  strokeWeight(spessore); //ha lo spessore del fiume preso in esame
  line(margine, 230, margine + larghezzaTesto, 230);

  //fiume preso in esame in ogni pagina
  stroke(colore);
  strokeWeight(spessore);
  line(margine, 230, margine + lunghezzaLinea, 230); //lunghezza mantiene la proporzione con il nilo, il fiume in trasparenza
  noStroke();
  fill(colore);
  circle(margine + lunghezzaLinea, 230, spessore + 4);

  fill("#defbff");
  textSize(14);
  text(lunghezza + " km di lunghezza (in scala con il fiume più lungo) \nPortata " + portata + " m³/s", margine, 255);

  fill("#c0c2ca");
  textSize(14);
  text("La linea in trasparenza rappresenta il Nilo (6650 km)", margine, 295);
}

function drawDati() {
  let paesi = riga.getString("countries").split(", "); //split taglia il testo a ogni virgola, producendo una lista
  noStroke();

  //paesi attraversati
  fill("#c0c2ca");
  textSize(16);
  text("Paesi attraversati (" + paesi.length + ")", margine, 350);
  fill("#defbff");
  textSize(18);
  text(paesi.join(", "), margine, 375, larghezzaTesto, 100); //join mette insieme la lista in un solo testo; indicando altezza e larghezza, testo va a capo nel riquadro

  //seconda colonna, a destra (solo i tre quadrati delle temperature)
  fill("#c0c2ca");
  textSize(14);
  text("Temperatura", colonna2, 230); //altezza del fiume
  drawTemperatura(colonna2, 260, riga.getNum("max_temp"), "massima", coloreMassima(riga.getNum("max_temp"))); //valore, etichetta e colore preso da scala
  drawTemperatura(colonna2, 335, riga.getNum("avg_temp"), "media", coloreTemperatura(riga.getNum("avg_temp")));
  drawTemperatura(colonna2, 410, riga.getNum("min_temp"), "minima", coloreMinima(riga.getNum("min_temp")));

  //barra min-max e bacino, sempre nella prima colonna
  fill("#c0c2ca");
  textSize(16);
  text("Escursione termica", margine, 450);
  drawBarraTemperature(margine, 495, larghezzaTesto);

  //area bacino
  fill("#c0c2ca");
  textSize(16);
  text("Bacino", margine, 560);
  fill("#defbff");
  textSize(30);
  text(riga.getNum("area") + " km²", margine, 585);
}

function drawTemperatura(x, y, valore, etichetta, colore) { 
  noStroke();
  fill(colore);
  rect(x, y, 56, 56, 6);
  fill("#defbff");
  textSize(34);
  text(valore + " °C", x + 72, y + 2);
  fill("#c0c2ca");
  textSize(14);
  text(etichetta, x + 72, y + 42);
}

//barra da -20 a 30 °C: il tratto colorato va dalla minima alla massima, il pallino è la media
function drawBarraTemperature(x, y, larghezza) {
  let tMin = riga.getNum("min_temp");
  let tMedia = riga.getNum("avg_temp");
  let tMax = riga.getNum("max_temp");
  let xMin = map(tMin, -20, 30, x, x + larghezza); //trasformo temperatura in posizione, -20 inizio barra e 30 fine barra
  let xMedia = map(tMedia, -20, 30, x, x + larghezza);
  let xMax = map(tMax, -20, 30, x, x + larghezza);

  //barra grigio-blu di sfondo
  stroke("#27415e");
  strokeWeight(6);
  line(x, y, x + larghezza, y);

  //tratto colorato
  strokeWeight(6);
  for (let px = xMin; px <= xMax; px++) { //disegnato px alla volta da min a max
    let quantita = map(px, xMin, xMax, 0, 1); //0 inizio, 1 fine: a che punto sono del tratto
    stroke(lerpColor(coloreMinima(tMin), coloreMassima(tMax), quantita)); //sfuma colore da min a max
    line(px, y, px + 1, y);
  }

  //pallino sulla temperatura media
  stroke("#081b31");
  strokeWeight(3);
  fill(coloreTemperatura(tMedia));
  circle(xMedia, y, 16);

  //estremi della scala
  noStroke();
  fill("#6b819b");
  textSize(12);
  textAlign(LEFT, TOP);
  text("-20 °C", x, y + 14);
  textAlign(RIGHT, TOP);
  text("30 °C", x + larghezza, y + 14);
  textAlign(LEFT, TOP);
}

function draw() {
  background("#081b31");
  textAlign(LEFT, TOP);
  larghezzaTesto = min((windowWidth - margine * 2 - 200) / 2, 650);   //due colonne con 200 pixel in mezzo
  colonna2 = margine + larghezzaTesto + 200;

  //cerca nella tabella la riga con l'id selezionato
  riga = myTable.findRow(selezionata, "id");

  drawNavigazione();
  drawIntestazione();
  drawFiume();
  drawDati();
}

//click per tornare a generale
function mousePressed() {
  if (sopraBottone(margine, 30)) {
    window.location.href = "index.html";
  }
}

