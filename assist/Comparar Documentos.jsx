﻿#target "indesign"#strict on// http://extendables.org/#include "~/_scripts/frameworks/Extendables/extendables.jsx"#include "~/_scripts/lib/indesign.jsx"var ui = require("ui");function UI_GetDocuments(){    var mixins = {    	'inputBox': {    		'size': [480, 20],    		'justify': 'left'    	},    	'inputBox_Short': {    		'size': [40, 20],    		'justify': 'left'    	},        'fastButton': {    		'size': [20, 20],    		'justify': 'center'        }    };           var dialog = new ui.Dialog('Seleccionar documentos a comparar').with(mixins);    dialog.column('col1');    dialog.col1.row('row1');    dialog.col1.row1.text('LIndd1', 'Documento 1:');    dialog.col1.row1.input('Indd1').using('inputBox');    dialog.col1.row1.button('Choose', '..').using('fastButton');    dialog.col1.row1.input('PagIni').using('inputBox_Short');    dialog.col1.row1.input('PagFin').using('inputBox_Short');    dialog.col1.row('row2');    dialog.col1.row2.text('LIndd2', 'Documento 2:');    dialog.col1.row2.input('Indd2').using('inputBox');    dialog.col1.row2.button('Choose', '..').using('fastButton');    dialog.col1.row2.input('PagIni').using('inputBox_Short');    dialog.col1.row2.input('PagFin').using('inputBox_Short');    dialog.col1.row('row3');    dialog.col1.row3.button('ok', 'Comenzar');    dialog.col1.row3.button('cancel', 'Cancelar');    dialog.result = false;    dialog.docs = [];        if (app.documents.length == 2)    {        dialog.col1.row1.Indd1.text = app.documents[0].fullName;        dialog.col1.row2.Indd2.text = app.documents[1].fullName;        dialog.docs = [File(app.documents[0].fullName), File(app.documents[1].fullName)];    }        dialog.col1.row1.Choose.on('click').do(function() {        var file = File.openDialog ('Seleccione un archivo Indesign', function(f) { return f.name.toLowerCase().indexOf('.indd') >= 0; });        if (file) {            dialog.col1.row1.Indd1.text = file.fullName;            dialog.docs.push(file);        }    });    dialog.col1.row2.Choose.on('click').do(function() {        var file = File.openDialog ('Seleccione un archivo Indesign', function(f) { return f.name.toLowerCase().indexOf('.indd') >= 0; });        if (file) {            dialog.col1.row2.Indd2.text = file.fullName;            dialog.docs.push(file);        }    });    dialog.col1.row3.ok.on('click').do(function() {        dialog.result = true;        dialog.Doc1Range = {pagIni:null, pagFin:null};        if (dialog.col1.row1.PagIni.text != '')            dialog.Doc1Range.pagIni = parseInt(dialog.col1.row1.PagIni.text) - 1;        if (dialog.col1.row1.PagFin.text != '')            dialog.Doc1Range.pagFin = parseInt(dialog.col1.row1.PagFin.text) - 1;                    dialog.Doc2Range = {pagIni:null, pagFin:null};        if (dialog.col1.row2.PagIni.text != '')            dialog.Doc2Range.pagIni = parseInt(dialog.col1.row2.PagIni.text) - 1;        if (dialog.col1.row2.PagFin.text != '')            dialog.Doc2Range.pagFin = parseInt(dialog.col1.row2.PagFin.text) - 1;                    this.window.close();    });    dialog.col1.row3.cancel.on('click').do(function() {        this.window.close();        }    );        dialog.window.defaultElement = dialog.col1.row3.ok;    dialog.window.show();        return [dialog.result, dialog.docs, dialog.Doc1Range, dialog.Doc2Range];}function swap(a, b) { t = a; a = b; b = t; }function CompareDocuments(doc1, doc2){    this.doc1 = doc1;    this.doc2 = doc2;    this.log = [];    this.ids_visited = {}    this.page = null;    this.compareRange = function(pageRange1, pageRange2)    {        this.log = [];        this.ids_visited = {};                var pages = Math.min(pageRange1.pagFin-pageRange1.pagIni+1, pageRange2.pagFin-pageRange2.pagIni+1);                for (var i=0, e=pages; i<e; ++i)            this.comparePages(doc1.pages[i+pageRange1.pagIni], doc2.pages[i+pageRange2.pagIni]);                return this.log;    }    this.comparePages = function(page1, page2)    {        // page1 always is the one with less elements        if (page1.allPageItems.length > page2.allPageItems.length) swap(page1, page2);        this.page = page1;        var filterGroups = function(page) { return page.allPageItems.filter(function(item) { return item.constructor.name != 'group'; }); }        var pageItems1 = filterGroups(page1);        var pageItems2 = filterGroups(page2);        for (var i=0, e=pageItems1.length; i<e; ++i)        {            var pi = pageItems1[i];            var id1 = pi.id;            var pi2 = pageItems2.filter(function(item) { return item.id == id1; });            if (pi2.length == 1)            {                pi2 = pi2[0];                this.comparePageItems(pi, pi2);            }           }    }    this.comparePageItems = function(pageItem1, pageItem2)    {        if (pageItem1.constructor.name != pageItem2.constructor.name)             this.writeLog([this.page.name, pageItem1.id, "Son objetos diferentes", pageItem1.contents]);        else if (pageItem1.constructor.name == 'TextFrame')         {            if (pageItem1.contents != pageItem2.contents)                this.writeLog([this.page.name, pageItem1.id, "Texto diferente", pageItem1.contents]);                            if (pageItem1.tables.length > 0 || pageItem2.tables.length > 0)                this.compareTables(pageItem1.tables, pageItem2.tables);        }    }    this.compareTables = function(tables1, tables2)    {        if (tables1.length != tables2.length)            writeLog([this.page.name, tables1.parent.id, "El número de tablas es diferente", ""]);        for (var i=0, e=tables1.length; i<e; ++i)        {            var t1 = tables1[i];            var t2 = tables2[i];            for (var j=0, ej=t1.rows.length; j<ej; ++j)            {                var r1 = t1.rows[j];                var r2 = t2.rows[j];                if (r1.contents.toString() != r2.contents.toString())                    this.writeLog([this.page.name, t1.parent.id, "Fila " +  r1.name + " diferente", r1.contents.toString()]);            };        }    }    this.writeLog = function(changes) { return this.log.push(changes.join(';')); }    return this;}function main(){    app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT;    app.scriptPreferences.enableRedraw = false;        try     {        var res = UI_GetDocuments();        if (res && res[0] == true)         {            var indds = res[1];            if (!File(indds[0]).exists) { alert("El documento '" + indds[0] + "' no existe"); }            else if (!File(indds[1]).exists) { alert("El documento '" + indds[1] + "' no existe"); }            else if (indds[0] == indds[1]) { alert("Son el mismo documento, no se hará ninguna comparación"); }            else {                var doc1 = app.open(indds[0]);                var doc2 = app.open(indds[1]);                                var fitRange = function(r, doc) {                     if (r.pagIni == null) r.pagIni = 0;                     if (r.pagFin == null) r.pagFin = doc.pages.length-1;                     return r;                 }                                var rango1 = fitRange(res[2], doc1);                 var rango2 = fitRange(res[3], doc2);                     var cmpDoc = new CompareDocuments(doc1, doc2);                var cambios = cmpDoc.compareRange(rango1, rango2);                                if (cambios.length > 0)                {                    var ftxt = File('~/Desktop/cambios.csv');                    ftxt.open('w');                    cambios.forEach(function(c) { ftxt.writeln(c); } );                     ftxt.close();                    ftxt.execute();                }            }        }    } finally     {        app.scriptPreferences.userInteractionLevel = UserInteractionLevels.INTERACT_WITH_ALL;        app.scriptPreferences.enableRedraw = true;    }}app.doScript(main,    ScriptLanguage.JAVASCRIPT   , null  , UndoModes.ENTIRE_SCRIPT  , '');