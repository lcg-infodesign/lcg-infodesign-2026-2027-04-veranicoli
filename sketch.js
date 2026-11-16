let myTable;
let continenti = ["Asia", "Europe", "South America", "North America", "Africa", "Oceania"];
let nomiContinenti = ["Asia", "Europa", "Sud America", "Nord America", "Africa", "Oceania"];

//per ogni continente, la lista delle righe della tabella, cioè i fiumi 
let gruppi = [];

let margine = 55;
let yInfo = 215; 
let topZona = 270; //sopra questa altezza ci sono titolo e legenda
let spessoreAnello = 10;

let lunghezzaMaxFiume = 6650; 
let passoX; //larghezza dello spazio di un cerchio
let raggio; 
let lunghezzaMax;  
let centroY; //altezza della linea centrale dell'onda
let ampiezza; //quanto i cerchi salgono e scendono rispetto alla linea centrale

let colFreddo;
let colCaldo;
let fiumeHover = -1; //riga del fiume sotto il mouse, -1 se non ce n'è nessuno 


async function setup() {
  createCanvas(windowWidth, windowHeight);

  textFont("Futura, 'Century Gothic', 'Trebuchet MS', sans-serif");
  angleMode(DEGREES);

  myTable = await loadTable("assets/rivers_world.csv", ",", "header");

  colFreddo = color("#0e38e0");
  colCaldo = color("#1aeeee");

  //lista di righe per ogni continente
  for (let k = 0; k < continenti.length; k++) { //ripetere per k numero di volte
    gruppi.push([]); //aggiunge lista vuota a gruppi (6 in tot)
  }

 //scorre tutte le righe e mette ogni fiume nel gruppo del suo continente
  for (let riga = 0; riga < myTable.getRowCount(); riga++) {
    let k = continenti.indexOf(myTable.getString(riga, "continent")); //legge continente della riga e cerca sua posizione nella lista
    gruppi[k].push(riga); //numero riga nel gruppo del suo continente
  }

  //dentro ogni gruppo, i fiumi vanno dal più freddo al più caldo
  for (let k = 0; k < gruppi.length; k++) {
    gruppi[k].sort((a, b) => myTable.getNum(a, "avg_temp") - myTable.getNum(b, "avg_temp"));
  } //confronto tra a, b: se differenza è negativa a va prima di b. ordine da più freddo a più caldo
}

function calcolaDimensioni() {
  let altezzaZona = windowHeight - topZona - 30;  //altezza per cerchi; variabile dentro la funzione perché esiste solo qui
  passoX = min((windowWidth - margine * 2) / 6.9, altezzaZona / 2.85); //distanza orizzontale tra due cerchi vicini, dipende dalla larghezza e dall'altezza della finestra
  centroY = topZona + altezzaZona / 2;
  ampiezza = passoX * 0.45; //quanto i cerchi salgono e scendono
  raggio = passoX * 0.42; //così cerchi vicini non si toccano           
  lunghezzaMax = passoX * 0.7; 
}

//posizione del centro del cerchio k: in orizzontale uno accanto all'altro, tutti insieme centrati nella finestra
function centroXAnello(k) {
  return (windowWidth - passoX * 5) / 2 + k * passoX; //distanza tra primo e ultimo è di 5 passi
}

//ordine verticale: i cerchi pari in alto, i dispari in basso
function centroYAnello(k) {
  if (k % 2 == 0) { //resto 0: numero pari
    return centroY - ampiezza;
  } else {
    return centroY + ampiezza;
  }
}

//colore in base alla temperatura media: da -7.5 (blu scuro) a 27.5 (verde acqua)
function coloreTemperatura(temperatura) {
  let quantita = map(temperatura, -7.5, 27.5, 0, 1); //map trasforma valore in diversi intervalli
  return lerpColor(colFreddo, colCaldo, quantita); //mescola colori
}

//spessore in base alla portata in scala logaritmica (valori altrimenti troppo sproporzionati)
function spessorePortata(portata) {
  return map(log(portata), log(100), log(209000), 0.8, 3.2);
}

//dove parte e dove finisce la tacca del fiume j del cerchio k
function puntiTacca(k, j) {
  let n = gruppi[k].length; //quanti fiumi ha cerchio
  let rigaFiume = gruppi[k][j]; //fiume j, num riga
  let centro = -90; //arco in alto
  if (k % 2 == 1) {
    centro = 90; //per i cerchi dispari, arco in basso
  }
  let apertura = 220; //ampiezza dell'arco con le tacche
  let angolo = centro; //valore di partenza
  if (n > 1) {
    angolo = centro - apertura / 2 + j * apertura / (n - 1); //per più fiumi, intervallo in cui si posizionano
  }
  let lunghezza = map(myTable.getNum(rigaFiume, "length"), 0, lunghezzaMaxFiume, 3, lunghezzaMax); //lunghezza in px
  let r0 = raggio + spessoreAnello / 2 + 3; //distanza da cui parte tacca
  let punti = {};
  punti.x0 = centroXAnello(k) + cos(angolo) * r0; //ricavo coordinate inizio tacca da angolo e distanza
  punti.y0 = centroYAnello(k) + sin(angolo) * r0;
  punti.x1 = centroXAnello(k) + cos(angolo) * (r0 + lunghezza); //fine tacca
  punti.y1 = centroYAnello(k) + sin(angolo) * (r0 + lunghezza);
  return punti; //mi ridà i 4 punti insieme
}

function trovaFiume() {
  fiumeHover = -1; //nessuno
  for (let k = 0; k < gruppi.length; k++) { //passo in rassegna tutti continenti e tutti fiumi
    for (let j = 0; j < gruppi[k].length; j++) {
      let p = puntiTacca(k, j); //coordinate inzio e fine tacca
      for (let i = 0; i <= 20; i++) { //cliccabile tutta la tacca
        let x = lerp(p.x0, p.x1, i / 20); //21 punti tra inizio e fine tacca
        let y = lerp(p.y0, p.y1, i / 20);
        if (dist(mouseX, mouseY, x, y) < 6) { //mouse a meno di 6 pixel
          fiumeHover = gruppi[k][j];
        }
      }
    }
  }
  if (fiumeHover >= 0) {
    cursor(HAND); //manina sopra fiume cliccabile
  } else {
    cursor(ARROW);
  }
}


//sei cerchi con il nome del continente e il numero di fiumi
function drawAnelli() {
  for (let k = 0; k < continenti.length; k++) {
    let x = centroXAnello(k);
    let y = centroYAnello(k);
    //anello azzurro chiaro
    noFill();
    stroke("#46b1f3");
    strokeWeight(spessoreAnello);
    circle(x, y, raggio * 2);
    //disco al centro
    noStroke();
    fill("#58fcaa");
    //fill("#defbff");
    circle(x, y, raggio * 2 - spessoreAnello - 4);
    //testo al centro
    fill("#1b2559");
    textAlign(CENTER, CENTER);
    textSize(16);
    text(nomiContinenti[k], x, y - 7); //7px sopra il centro
    fill("#384583");
    textSize(12);
    text(gruppi[k].length + " fiumi", x, y + 9); //numero fiumi nel continente, 9px sotto centro
  }
}

//una tacca per ogni fiume
function drawFiumi() {
  for (let k = 0; k < gruppi.length; k++) {
    for (let j = 0; j < gruppi[k].length; j++) {
      let fiume = gruppi[k][j]; 
      let p = puntiTacca(k, j); //inizio e fine tacca
      let colore = coloreTemperatura(myTable.getNum(fiume, "avg_temp"));
      let spessore = spessorePortata(myTable.getNum(fiume, "discharge"));

      if (fiume == fiumeHover) {
        spessore = spessore + 3; //fiume evidenziato più spesso
      }

      stroke(colore);
      strokeWeight(spessore);
      line(p.x0, p.y0, p.x1, p.y1);
      noStroke();
      fill(colore);
      circle(p.x1, p.y1, spessore + 3); //pallino sulla punta
    }
  }
}

// titolo, legenda colori, spiegazione
function drawLegenda() {
  noStroke();
  fill("#defbff");
  textAlign(LEFT, BASELINE);
  textSize(30);
  text("Fiumi del mondo", margine, 50);

  //barra colore temperatura
  for (let i = 0; i < 150; i++) {
    fill(coloreTemperatura(map(i, 0, 149, -7.5, 27.5))); //colore temperatura tra -7,5 e 27,5
    rect(margine + i, 80, 1, 12);
  }

  fill("#defbff");
  textSize(14);
  text("-7,5 °C", margine, 110);
  textAlign(RIGHT, BASELINE);
  text("27,5 °C", margine + 150, 110);
  textAlign(LEFT, BASELINE);
  text("temperatura media", margine + 170, 91);

  fill("#defbff");
  textSize(14);
  text("Ogni cerchio rappresenta un continente, mentre ogni tacca simboleggia un fiume. \nLunghezza della tacca = lunghezza del fiume \nSpessore = portata \nCliccare su un fiume per aprirlo.", margine, 138);
}

//dati fiume sotto il mouse, su una riga
function drawInfo() {
  textSize(15);
  noStroke();
  textAlign(LEFT, BASELINE);
  if (fiumeHover >= 0) {
    fill("#defbff");
    text(myTable.getString(fiumeHover, "name") + ":   " + myTable.getNum(fiumeHover, "length") + " km   portata " + myTable.getNum(fiumeHover, "discharge") + " m³/s   temperatura media " + myTable.getNum(fiumeHover, "avg_temp") + " °C", margine, yInfo);
  } else {
    fill("#c0c2ca");
    text("Passare il mouse su una tacca per leggere i dati del fiume.", margine, yInfo);
  }
}

function draw() {
  background("#081b31");

  calcolaDimensioni();
  trovaFiume();

  drawAnelli();
  drawFiumi();
  drawLegenda();
  drawInfo();
}

function mousePressed() {
  if (fiumeHover >= 0) {
    let id = myTable.getNum(fiumeHover, "id");

    let myUrl = "detail.html?id=" + id;
    window.location.href = myUrl;
  }
}