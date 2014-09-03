﻿/** IKEA Catalogo XML    Author: Javier Ramos        Exportar y reimportar medidas para el catálogo        Códigos para fracciones:    fractions = {        "1/2": "\u00BD", // U+00BD        "3/4": "\u00BE", // U+00BE        "5/6": "\u215A", // U+215A        "1/8": "\u215B", // U+215B        "3/8": "\u215C", // U+215C        "5/8": "\u215D", // U+215D        "7/8": "\u215E", // U+215E    }        */#target "indesign"#targetengine "medianis"#script Medidas#strict on/*  --------------------------    Manage all imports    -------------------------- */#include "lib/_imports.jsx"// var log = function(w) { $.writeln(w); }; var log = function() {};var AppExportar = (function(){    var _app = {};        _app.rePN = /\d\d\d\.\d\d\d\.\d\d/mg;    _app.filter = function(ob) { return ob.filter(function(f) { return f !== 'numbered'; }); };    _app.fields = _app.filter(IKEA.Parser.product_fields.concat(['Todo']));        _app.articles = [];    _app.getEveryPartNumberOn = function(container){        """Return a list of partNumbers in the container. Tipically the         container will be the page, the spread or de document, but         can be any item with allPageItems property.        The textFrames with partNumbers are saved in _app.articles for        later use.        """                var pn = [];        if (! container.hasOwnProperty('allPageItems')) { return []; }                container.allPageItems.filter(function(pi) {             return pi.constructor.name === 'TextFrame';         }).each(function(tframe){            var res = tframe.contents.toString().match(_app.rePN);            if (res !== null) {                pn = pn.concat(res);                _app.articles.push(tframe);            }        });            return pn.toSet().keys().sort();    };    _app.parseTextFrames = function() {        _app.products_doc = {};        _app.articles.each(function(tframe){            _app.products_doc.merge(IKEA.Parser.parseTextFrame(tframe));        });    };    _app.pgbar = {        create: function(maxValue, message) {            var wr = """palette {                             alignChildren: 'center',                            preferredSize: [320, 32],                            message: StaticText { preferredSize: [300, 24] },                            pg : Progressbar { preferredSize: [300, 24] },                    }""";            this.pbar = new Window(wr);            this.pbar.pg.maxvalue = maxValue;            this.pbar.pg.value = 0;            this.pbar.message.text = message;        },        show: function() {            this.pbar.show();        },        hide: function() {            this.pbar.hide();        },        step: function(v, message) {            this.pbar.message.text = message || this.pbar.message;            this.pbar.hide();            this.pbar.pg.value += v;            this.pbar.show();        },        set_message: function(message) {            this.pbar.message.text = message;        }       };    _app.ui = function(){        var buttonStyle     = 'preferredSize: [120, 24]';        var buttonStyleMini = 'preferredSize: [24, 24]';        var wr = """dialog {                 alignChildren: 'center',                title: StaticText { text: 'Exportar Artículos' },                mPanel : Panel {                    topGroup: Group {                        orientation: 'column',                        source: DropDownList { helpTip: 'Indicar el origen de los datos' },                        fields: DropDownList { helpTip: 'Información a exportar' },                    },                    doExport: Group {                        orientation: 'column',                        enabled: false,                        lb1: StaticText { text: 'Aplicar a...' },                        bAllPage    : Button { text: 'Página', #buttonStyle# },                        bAllSpread  : Button { text: 'Pliego', #buttonStyle# },                        bAllDocument: Button { text: 'Documento', #buttonStyle# },                    },                },            bottomGroup: Group {                alignment: 'center',                bClose   : Button { text:'Cerrar', #buttonStyle# }            }        }""".replace(/#buttonStyle#/g, buttonStyle).replace(/#buttonStyleMini#/g, buttonStyleMini);        var wnd = new Window(wr);        this.wnd = wnd;        this.field = "Todo";                var topGroup = wnd.mPanel.topGroup;        var doExport = wnd.mPanel.doExport;                IKEA.ORIGENES.forEach(function(source) {            topGroup.source.add('item', source.name);        });        topGroup.source.text = 'Origen';        this.fields.map(function(what){            topGroup.fields.add('item', IKEA.labels[what] || what);        });        topGroup.fields.text = 'Dato';        topGroup.fields.selection = topGroup.fields.items[this.fields.length - 1];        wnd.activePanels = function() {            var enabled = topGroup.source.selection.text !== '';            doExport.enabled = enabled;        };        topGroup.source.onChange = function() {             wnd.activePanels();             wnd.source = IKEA.getSource(topGroup.source.selection.text);        };        topGroup.fields.onChange = function() {             var txt = topGroup.fields.selection.text.toString();            _app.field = IKEA.labels.getKeyByValue(txt) || "Todo";        };            wnd.cancelElement = wnd.bottomGroup.bClose;        wnd.bottomGroup.bClose.onClick = function() {             _app.target = null;             this.window.close();        }        doExport.bAllPage.onClick = function() {             _app.target = 'page';             this.window.close();        }        doExport.bAllSpread.onClick = function() {             _app.target = 'spread';             _app.action = 'export';            this.window.close();        }        doExport.bAllDocument.onClick = function() {             _app.target = 'document';             this.window.close();        }            return wnd;    };    _app.export_field = function(product){        return product.get(IKEA.CF_FORMATNUMBER) + '\t'              + (product.get(this.field) || "")  + '\t'              + (this.products_doc[product.get(IKEA.CF_FORMATNUMBER)].get(this.field) || "")             ;    };    _app.export_all = function(product){        return this.fields.map(function(field){                   return product.get(field);               }).join('\t');    };    _app.export_products = function() {        var self = this;        var error = false;        var pn = this.getEveryPartNumberOn(this.container());        this.pgbar.create(pn.length, "Descargando información de artículos...");        this.pgbar.show();        var cname = app.activeDocument.name.toLowerCase().replace('.indd', '');        var csv = File(Folder.desktop + '/Exported-' + cname + '-' + (new Date()).valueOf().toString() + '.csv');        csv.encoding = 'utf-8';        csv.open("w");                if (this.field !== "Todo") {            var fn = IKEA.labels[this.field];            csv.writeln("Código\t" + fn + ' (Actual)\t' + fn + ' (Actualizar)');            this.parseTextFrames();        } else {            csv.writeln(                self.fields.map(function(field){                     return IKEA.labels[field];                 }).join('\t')            );        }                var count = 0;        var f=0, mt=pn.length;                try {             do {                var products = IKEA.Products(pn.slice(f,f+10), this.wnd.source);                var _fnc = (self.field !== "Todo") ? this.export_field : this.export_all;                                products.keys().map(function(pnum) {                    self.pgbar.step(1, pnum);                    csv.writeln(_fnc.call(self, products[pnum]));                    count++;                });                            f += 10;            } while (f < mt);        } catch(e) {            alert(e);            error = true;        }        this.pgbar.step(1, "Finalizando...");        csv.close();        this.pgbar.hide();        if (!error) {            csv.execute();        }            // Assert count === mt        if (count !== mt) {             alert("ERROR: se esperaban {} registros y se han hecho {}".format(mt, count));         }    };    _app.container = function() {        return {'page': app.activeWindow.activePage,                'spread': app.activeWindow.activeSpread,                'document': app.activeDocument                }[this.target];    };    _app.main = function() {        this.ui().show();        if (this.target !== null) {            this.export_products();        }    };    return _app;})().main();