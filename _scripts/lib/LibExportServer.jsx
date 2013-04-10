﻿#strict onvar TMP_FOLDER = Folder.temp;var task;var W;var pdf_preset = undefined;function loadServerConfig(configFile) {    var cfg = File(configFile);    if (!cfg.exists) return null;        trim = function (s) { return s.replace(/^\s+/, '').replace(/\s+$/, ''); }        cfg.open("r");    var data = {};    while (! cfg.eof ) {        var rd = cfg.readln().split('=');        if (rd.length > 1) {            data[trim(rd[0])] = trim(rd[1]);        }    }    cfg.close();    return data;}function save_pdf_export_pref(fileName, options) {""" Crea archivo de preferencias exportación PDF para el documento.    Dado un archivo de indesign, crea en la misma carpeta otro    archivo con el mismo nombre y terminación .pref que contiene las     preferencias de exportación indicadas en options.        """    var fp = File(fileName.toLowerCase().split('.indd')[0] + '.pref');    fp.open("w");    if (options.preset !== undefined)        fp.writeln("pdf_preset = app.pdfExportPresets.itemByName('" + options.preset + "');");    if (options.pliegos !== undefined)        fp.writeln("app.pdfExportPreferences.exportReaderSpreads = " + options.pliegos + ";");        fp.close();}function load_pdf_export_pref(fileName) {""" Preferencias exportación PDF por fichero.    Dado un archivo de indesign, busca en la misma carpeta otro    archivo con el mismo nombre y terminación .pref que contiene las     preferencias de exportación aplicables        Devuelve una función que modifica las preferencias de exporatación a pdf    """        var pref_file = fileName.toLowerCase().split('.indd')[0] + '.pref';    var fp = File(pref_file);    if (fp.exists) {        fp.open("r");                var lines = (function() {             var r = [];            while(!fp.eof)                r.push(fp.readln());            return r;        }).call(this);                return function() {             for (var i=0; i<lines.length; ++i)                 eval(lines[i]);         };                fp.close();    }        return function() { ; };}function do_export(fileName, originFolder, tmpFolder, dstFolder, doneFolder, isBook, showPref) {      var N = originFolder + fileName;        var userInteractionLevel_OFF = function() {        if (app.version === 3) app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;        else app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;    }    var userInteractionLevel_ON = function() {        if (app.version === 3) app.userInteractionLevel = UserInteractionLevels.INTERACT_WITH_ALL;        else app.scriptPreferences.userInteractionLevel = UserInteractionLevels.INTERACT_WITH_ALL;    }        userInteractionLevel_OFF();        var D = app.open(File(N));           if (D) {        var pdfName = D.name.split('.indd')[0]+'.pdf';                   load_pdf_export_pref(N).call(this);            // export pdf to temp folder        D.exportFile(ExportFormat.PDF_TYPE, File(tmpFolder + pdfName), false, pdf_preset);                 D.close(SaveOptions.NO);        // move pdf to dstFolder        File(tmpFolder + pdfName).copy(dstFolder + pdfName);        File(tmpFolder + pdfName).remove();        // move indesign to doneFolder        File(N).copy(File(doneFolder + fileName));        File(N).remove();          File(N.split('.indd')[0]+'.pref').remove();    }    userInteractionLevel_ON();}function mainWindow(spyFolder, dstFolder, moveFolder) {    var R = """palette {        orientation:'row', alignChildren:'fill',         borderless:true,        text: 'DOCUMENTOS',         preferredSize:[380,300],        left:20,        top:50,        mainPanel: Panel {            lbSvr : StaticText { },            docs : ListBox { preferredSize:[370,290], numberOfColumns:1, showHeaders:true, columnTitles:["Documento"], },            close : Button { text:'Cerrar servidor', },        },    }""";    var W = new Window(R);    W.dstFolder = dstFolder + '/';    W.moveFolder = moveFolder + '/';    W.spyFolder = spyFolder + '/';    W.tmpFolder = TMP_FOLDER;        if (!Folder(W.tmpFolder).exists)        Folder(W.tmpFolder).create();        W.mainPanel.lbSvr.text = spyFolder;        W.cerrar = false;        W.onShow = function() { W.location = {x:16, y:124 }; };        W.onClose = function() {         task.removeEventListener(IdleEvent.ON_IDLE, do_task);        task.sleep = 0;                return true;    }        W.mainPanel.close.onClick = function() {         task.removeEventListener(IdleEvent.ON_IDLE, do_task);        task.sleep = 0;        this.window.cerrar = true;         this.window.close();     } ;        W.updateDocs = function() {        var docs = this.window.mainPanel.docs;        docs.removeAll();                var D = Folder(this.window.spyFolder);        var F = D.getFiles("*.indd");                for (var i=0, e=F.length; i<e; ++i) {            docs.add('item', F[i].displayName);         }            var B = D.getFiles("*.indb");        for (var i=0, e=B.length; i<e; ++i) {            docs.add('item', B[i].displayName);         }    };        W.exportDocs = function() {        var docs = this.window.mainPanel.docs;        if (docs.items.length > 0) {            var N = docs.items[0].text;            do_export( N                     , this.window.spyFolder                     , this.window.tmpFolder                     , this.window.dstFolder                     , this.window.moveFolder                     , (N.split('.')[1].toLowerCase() == 'indb')                     , false                     );                    docs.remove(0);        }    };        return W;}function do_task(idleEvent) {       W.updateDocs();    try {        W.exportDocs();    } catch(e) { } ; // ignore partial file errors    }