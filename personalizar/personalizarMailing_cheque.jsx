﻿#target indesign/*	 *	ProcesadorMAILING *	Implementa un objeto delegado para PersonalizarMailing.procesarDato.  *	Para ello ha de implementar la función procesar(columnas, datos) que es la forma *	de comunicación entre delegado y delegador. *	 *	Particularmente este delegado inserta los datos indicados en una caja dentro de la página *	de indesign. */function ProcesadorMAILING(command, columnas) {	// Relaciona las etiquetas de script con TextFrames de indesign	this.mapper = 	{		'DIRECCION':'', 		'ESTIMADO':'', 		'BARCODE':'', 		'CHEQUE_IMPORTE':'', 		'CHEQUE_NOMBRE':'', 		'CHEQUE_NUMERO':'', 		'CHEQUE_MES':'',		'CHEQUE_VALOR':'',		'CHEQUE_BARCODE':'',	};		this.carets   = new Array(		"§","º",		"#","Ñ",		"¦","º",	);	this.postProceso = command;}/*  Asigna a cada etiqueta el objeto en página que lo poseee */ProcesadorMAILING.prototype.buscarEtiqueta = function(obj) {	for (var i=0; i<obj.allPageItems.length; i++) 	{		if (obj.allPageItems[i].label in this.mapper)			this.mapper[obj.allPageItems[i].label] = obj.allPageItems[i];	}}ProcesadorMAILING.prototype.trim = function(str) {	if (str == undefined || str == null)		return null;		if (str[0] == '"' && str.slice(-1) == '"')		str = str.slice(1,-1);			while (str.slice(-1) === ' ') 		str = str.substring(0, str.length - 1);	while (str[0] === ' ') 		str = str.substring(1, str.length);		return str;}ProcesadorMAILING.prototype.procesar = function(col, datos) {	var p = function(i) { return ProcesadorMAILING.prototype.trim(datos[col[i]]); }			// Genera un objeto con los datos del cliente y los envía a insertar	this.insertar({"nombre" : p(0),				  "apellidos" : p(1), 				  "direccion" : p(2), 				  "barrio" : p(3),				  "cp" : p(4), 				  "provincia" : p(5),				  "sexo" : p(6), 				  "barcode" : p(7), 				  "cheque_valor" : p(8), 				  "cheque_numero" : p(9), 				  "cheque_mes" : p(10),				 }); 				 	app.activeDocument.recompose();		this.postProceso.run();}ProcesadorMAILING.prototype.cambiarCarets = function(cadena) {	for (var i=0; i<this.carets.length/2; i+=2) 		cadena = cadena.replace(this.carets[i], this.carets[i+1]);		cadena = cadena.replace("\u0090", "E");		return cadena;}ProcesadorMAILING.prototype.insertar = function(Cliente) {	this.mapper["DIRECCION"].contents = this.cambiarCarets(Cliente["apellidos"] + ', ' 							 + Cliente["nombre"]) + "\n" 						 	+ this.cambiarCarets(Cliente["direccion"]) + "\n" 						 	+ Cliente["cp"] + " - " + Cliente["barrio"] 							 + " (" + this.cambiarCarets(Cliente["provincia"]) + ')';			if (this.mapper["ESTIMADO"] !== "")	{		var tileCase = function(nombre)			{				var d = nombre.split(' ');				for (var i=0; i<d.length; i++)					if (d[i] != 'DEL')						d[i] = d[i][0].toUpperCase() + d[i].slice(1).toLowerCase();					else						d[i] = d[i].toLowerCase();				return d.join(' ');			}				if (Cliente["sexo"].toUpperCase() === 'V')			this.mapper["ESTIMADO"].contents = 'Estimado ' + tileCase(Cliente["nombre"])		else			this.mapper["ESTIMADO"].contents = 'Estimada ' + tileCase(Cliente["nombre"]);	}	if (this.mapper["BARCODE"] !== '')		this.mapper["BARCODE"].contents = Cliente["barcode"];			if (this.mapper["CHEQUE_IMPORTE"] !== '')	{		this.mapper["CHEQUE_IMPORTE"].contents = Cliente["cheque_valor"];		if (this.mapper["CHEQUE_IMPORTE"].contents.slice(-1) != '€')			this.mapper["CHEQUE_IMPORTE"].contents += '€';	}	if (this.mapper["CHEQUE_MES"] !== '')	{		this.mapper["CHEQUE_MES"].contents = Cliente["cheque_mes"];	}	if (this.mapper["CHEQUE_NOMBRE"] !== '')	{		this.mapper["CHEQUE_NOMBRE"].contents = Cliente["apellidos"] + ', ' + Cliente["nombre"];				if (this.mapper["CHEQUE_NOMBRE"].overflows)		{			this.mapper["CHEQUE_NOMBRE"].parentStory.contents = '';			this.mapper["CHEQUE_NOMBRE"].contents = Cliente["apellidos"].split(' ')[0] + ', ' + 				Cliente["nombre"];		}						if (this.mapper["CHEQUE_NOMBRE"].overflows)		{   			this.mapper["CHEQUE_NOMBRE"].parentStory.contents = '';			this.mapper["CHEQUE_NOMBRE"].contents = Cliente["nombre"];			}	}	if (this.mapper["CHEQUE_NUMERO"] !== '')		this.mapper["CHEQUE_NUMERO"].contents = Cliente["cheque_numero"];			if (this.mapper["CHEQUE_BARCODE"] !== '')		this.mapper["CHEQUE_BARCODE"].contents = Cliente["cheque_numero"];			if (this.mapper["CHEQUE_VALOR"] !== '')	{		this.mapper["CHEQUE_VALOR"].contents = Cliente["cheque_valor"];		if (this.mapper["CHEQUE_VALOR"].contents.slice(-1) != '€')			this.mapper["CHEQUE_VALOR"].contents += '€';					for (var k=0; k<this.mapper["CHEQUE_VALOR"].characters.length-1; ++k)			this.mapper["CHEQUE_VALOR"].parentStory.characters[k].appliedCharacterStyle = "valor_%";					this.mapper["CHEQUE_VALOR"].parentStory.characters[-1].appliedCharacterStyle = "euro_%";		// this.mapper["CHEQUE_VALOR"].parentStory.clearOverrides();	}	}/* ******************************************************************************************* *//*	PersonalizarMailing		*/function PersonalizarMailing(separador, cols) {	this.columnas = cols;		if (this.columnas == undefined)		this.columnas = new Array(7, 8, 2, 4, 5, 6, 9); // secuencia de columnas por defecto			this.datos = null;	this.fichero = null;	this.sep = separador;		this.toString = function() { return "OBJETO: PERSONALIZAR MAILING"; };		return this;}PersonalizarMailing.prototype.abrirDatos = function (archivo, cabeceras) {	this.fichero = File(archivo);	this.fichero.open("r");		// Lee las cabeceras de las columnas	if (cabeceras)		this.fichero.readln();		// this.columnas = (this.fichero.readln()).split(this.sep);}	PersonalizarMailing.prototype.cerrarDatos = function() {	this.fichero.close();}PersonalizarMailing.prototype.siguienteDato = function() {	if (!this.fichero.eof) {		this.datos = this.fichero.readln().split(this.sep);		return true;	} else		return false;}/*  Procesa el útlimo dado leido. El proceso real sobre el dato es cosa del objeto	argumento delegator. Esto se, se delega en dicho objeto la acción a ejecutar. */PersonalizarMailing.prototype.procesarDato = function(delegator) {	delegator.procesar(this.columnas, this.datos);}/* ******************************************************************************************* *//*	ExportadorPDF		*/function ExportadorPDF(document, destino, nombre, opcionExportacionIndex) {	this.carpetaDestino = destino;	this.nombreBase = nombre;	this.documento = document;		this.contador = 0;	this.exportPDF_prefExportacion = app.pdfExportPresets[opcionExportacionIndex];	app.pdfExportPreferences.viewPDF = false;	this.contador000 = function() {		var str = this.contador.toString();		while (str.length < 3)			str = '0' + str;					return str;	}		return this;}ExportadorPDF.prototype.exportarPagina = function(pagina) {	if (pagina !== undefined) {		var pagNum = pagina.name;		app.pdfExportPreferences.pageRange = pagNum;				pagNum = pagNum.replace(new RegExp(":","gi"), "_");	}	this.contador++;	var path = this.carpetaDestino + this.nombreBase + this.contador000() + ".pdf";	this.documento.exportFile(ExportFormat.pdfType, new File(path), (this.contador == 1));}ExportadorPDF.prototype.run = function() { 	this.exportarPagina(); }/* ******************************************************************************************* */function ExportadorImpresora(document, impresoraIndex) {	this.documento = document;	this.documento.printPreferences.copies = 1;		this.impresoraIndex = impresoraIndex;	this.contador = 0;		return this;}ExportadorImpresora.prototype.run = function() {//	this.documento.printPreferences.pageRange = "1";	this.documento.print(!this.contador);	this.contador++;}/* ******************************************************************************************* */function JSProgressBar(iter, title, parent){	var wndResource =		"window \		 { \			orientation:'row', \			alignChildren:'bottom', \			text: 'PROGRESO', \			mainPanel: Panel \			{ \				label1: StaticText { text: 'Progreso total', preferredSize:[275, 20], }, \				pgBar1: Progressbar { text: '', preferredSize:[275, 10], }, \				labelLog: StaticText { text: '', preferredSize:[275,20], }, \			}, \		 }"	this.wnd = new Window(wndResource);	this.wnd.mainPanel.pgBar1.maxvalue = iter;		if (parent instanceof Window) 		this.PARENT = parent;		if (title != undefined)		this.wnd.text = title;	this.increment = function(msg)	{		this.wnd.mainPanel.pgBar1.value++;		if (msg != undefined)			this.wnd.mainPanel.label1.text = msg;	}	this.show = function() 	{ 		this.wnd.show(); 		if (this.PARENT != undefined && this.PARENT.visible)			this.wnd.frameLocation.y = this.PARENT.frameLocation.y - Math.round(this.wnd.size.height * 1.5);	}		this.close = function() { this.wnd.close(); }	this.hide = function() { this.wnd.hide(); }		return this;}/* ******************************************************************************************* */function main() {	var dataFile = File.openDialog( "Indicar origen de archivo de datos CSV", 								function(file) // lambda predicate ≈ is extension == csv? 								{ 									return (file.name.lastIndexOf('.') == -1) 										|| (file.name.substring(										    file.name.lastIndexOf('.') + 											1).toLowerCase() == 'csv'); 								}, 								false);	if (dataFile) {		var dst = new ExportadorPDF(app.activeDocument, "/Users/javi/tmp/", "fid_", 6);	//	var dst = new ExportadorImpresora(app.activeDocument, 0);		var pd = new ProcesadorMAILING(dst);		var pm = new PersonalizarMailing(';', [7, 8, 2, 3, 4, 5, 6, 11, 9, 10, 12]);				pd.buscarEtiqueta(app.activeWindow.activePage);		pm.abrirDatos(dataFile, /* Cabeceras */ true);		var pb = new JSProgressBar(9, "Personalizando Mailing");		pb.show();		while (pm.siguienteDato()) {				pm.procesarDato(pd);			pb.increment('Elemento ' + dst.contador + ' --> ' + pm.datos[pm.columnas[0]]);		}		pm.cerrarDatos();				pb.close();	}}main();