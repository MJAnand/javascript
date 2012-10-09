﻿#target "InDesign"#strict on/*  Personaliza caja de texto a partir de líneas en otra caja de texto.		Los datos se toman desde la caja de texto seleccionada y se insertan,	consecutivamente en la caja de texto con la ETIQUETA indicada desde	la interface del script.*/ function findTextFrameByLabel(root, label){	return root.textFrames.itemByName(label);}function personalizeTextFrame(labeledTextFrame, dataTextFrame){	for (var i=0; i<dataTextFrame.paragraphs.length; ++i)	{		labeledTextFrame.contents = dataTextFrame.paragraphs[i].contents;		labeledTextFrame.recompose();		if ( !confirm("¿Seguir?", false, 'más datos') )			break;	}}function createDialog(customRC)/*  customRC.title	customRC.rcMainPanel	customRC.rcButtonPanel	customRC.defaultElement	customRC.cancelElement	*/{		// Default title	if (customRC == undefined || customRC.title == undefined)		customRC.title = "Dialogo";			// Default Main Panel	if (customRC == undefined || customRC.rcMainPanel == undefined)		customRC.rcMainPanel = 'mainPanel : Panel {},';			// Default Button Panel	if (customRC == undefined || customRC.rcButtonPanel == undefined)		customRC.rcButtonPanel = 		 """buttons : Group {			btOk : Button { text:'Aceptar' },			btCancel : Button { text:'Cancelar' },		},"""		var w = """dialog {		text:'""" + customRC.title + """',		""" + customRC.rcMainPanel + customRC.rcButtonPanel + """	}	""";		var wnd = new Window(w);		// Default action: defaultElement	if (customRC.defaultElement != undefined)		wnd.defaultElement = customRC.defaultElement;	else if (wnd.buttons != undefined && wnd.buttons.btOk != undefined)		wnd.defaultElement = wnd.buttons.btOk;	// Default action: cancelElement	if (customRC.cancelElement != undefined)		wnd.cancelElement = customRC.cancelElement;	else if (wnd.buttons != undefined && wnd.buttons.btCancel != undefined)		wnd.cancelElement = wnd.buttons.btCancel;				return wnd;}function UI(){	var customRC = { title:"Personalizar Documento", 					rcMainPanel:"""mainPanel : Panel { 							     lb1 : StaticText { text:'Etiqueta caja de texto Destino:' },   						      ed1 : EditText { text:'NOMBRE', preferredSize:[350,20], }, 							   }, """ };						   	var wnd = createDialog(customRC);						  	return (wnd.show() == 1) ? wnd.mainPanel.ed1.text : "";}function main(){	var eti = UI();	if (eti !== "")	{		var dataTextFrame = app.selection[0];				if (dataTextFrame != undefined && dataTextFrame.constructor.name == 'TextFrame')		{			var labeledTextFrame = findTextFrameByLabel(app.activeWindow.activePage, eti);						personalizeTextFrame(labeledTextFrame, dataTextFrame);		}	}}main();