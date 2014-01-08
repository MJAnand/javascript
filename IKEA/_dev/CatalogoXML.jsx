﻿/** IKEA Catalogo XML
    Author: Javier Ramos
    
    Dependencies: extentables, Lib_IKEAProducts, indesign
    */

#target "indesign"
#targetengine "medianis"
#strict on

#include "~/_scripts/frameworks/Extendables/extendables.jsx"
#include "~/_scripts/lib/indesign.jsx"
#include "Lib_IKEAProducts.jsx"
#include "Lib_IKEAStyles.jsx"

var ui = require("ui");

// * --------------------------------------------------------------------------------------------------------

function main() {
    ui_mainForm();
//    process_all_textframes(app.activeDocument, IKEA.TENERIFE);
}

// * --------------------------------------------------------------------------------------------------------

function ui_mainForm(){
    var mixins, dialog, origins, orcodes, fields;
    var docname, container ,pn;
    const WINDOW_NAME = 'XMLCatalogo';
    
    mixins = {
        'inputLine': { 'size': [120, 24], },
        'button': [ 'inputLine' ],
        'left': { 'alignChildren':'left' }
    };

    origins = IKEA.ORIGENES.pluck('name');
    orcodes = IKEA.ORIGENES.pluck('code');

    /* structure */
    dialog = new ui.Palette('Insertar Producto').with(mixins);
    dialog.window.location = [52,125];
    dialog.window.name = WINDOW_NAME;
    dialog.column('pinput')
          .dropdown('origin', origins).using('inputLine')
          .text('label1', 'Código de producto')
          .input('partNumber').using('inputLine')
          .button('insert', 'Insertar').using('button')
          .button('update', 'Actualizar Todo').using('button');
    dialog.panel('pfield').using('left');

    dialog.pinput.insert.helpTip = 'Insertar el artículo de código indicado en el contenedor seleccionado';
    dialog.pinput.update.helpTip = 'Actualizar todos los contenedores con un código de producto.';

    dialog.pfield.window.enabled = false;

    IKEA.defaultFieldNames.forEach(function(field){
        dialog.pfield.checkbox(field.name, field.text);
    });

    // try to infer the origin from the active document name
    if (app.documents.length > 0){
        docname = app.activeDocument.name;
        if (docname.toLowerCase().indexOf('canarias') >= 0){
            dialog.pinput.origin.selection = dialog.pinput.origin.items[4];
        } else if (docname.toLowerCase().indexOf('lanzarote') >= 0){
            dialog.pinput.origin.selection = dialog.pinput.origin.items[0];
        }
    }

    var getOrigin = function() {
        var fromOrigin = dialog.pinput.origin.selection;
        if (!fromOrigin){
            throw build_error(ValidationError, 'No se ha especificado un origen');
        }
        return orcodes[origins.indexOf(fromOrigin.toString())];
    };

    /* event handlers */   
    dialog.pinput.insert.on('click').do(function () {
        var tframe = resolveTextFrame(app.selection[0]);
        var partNumber;
        if (tframe){
            partNumber = dialog.pinput.partNumber.text.trim();
            
            var fun = function() { process_codes(partNumber, tframe, getOrigin()); };
            
            app.doScript(fun, ScriptLanguage.JAVASCRIPT, null, UndoModes.ENTIRE_SCRIPT, partNumber);
        } else { alert('Ha de selecionar una caja de texto'); }
    });

    dialog.pinput.update.on('click').do(function () {
        process_all_textframes(app.activeDocument, getOrigin());
    });

    dialog.window.show();    
}

// * --------------------------------------------------------------------------------------------------------

function process_codes(codes, tframe, origen){
    var doc, first, price_symbol;

    doc = tframe ? document(tframe) : app.activeDocument;
    tframe = IKEA.getTextFrame(tframe ? tframe : app.selection.first());
    first = true;    
    
    if (!codes.is(Array)){
        codes = [codes];
    }

    if (tframe.associatedXMLElement){
        // TODO: if the textframe already contains xml labels
        //       use update mode
        alert("Este textframe ya está etiquetado");
        return ;
    }

    // We loose all previous contents
    tframe.contents = '';

    codes.forEach(function(code){
        var Product, elem, dst, nparag;
        try {
            // TODO: maybe use a cache!!
            Product = new IKEA.IKEAProduct(code, origen);
            
            if (!Product){
                return ;
            }
        
            if (!price_symbol) {
                price_symbol = Product.get('currency');
            }
        
            nparag = tframe.paragraphs.length
            dst =  nparag > 0 ? tframe.paragraphs.item(nparag-1) : tframe;
            elem = IKEA.productToXML(Product, doc, dst);
        }
        catch(e) { 
            if (elem) elem.remove()
            $.writeln(e.message);
            alert(e.message); 
        }
    });

    alert(IKEA.Styles.name);
    
    IKEA.Styles.applyStyles(tframe.associatedXMLElement)
    
    app.scriptPreferences.enableRedraw = true;
    tframe.contents;
    app.scriptPreferences.enableRedraw = false;
}

// * --------------------------------------------------------------------------------------------------------

function pbar(title, message, max) {
    var wnd = new Window('palette', title);
    wnd.message = wnd.add('statictext', undefined, message);
    wnd.message.preferredSize = [300, 30];
    wnd.pgBar = wnd.add('progressbar');
    wnd.pgBar.preferredSize = [300, 30];
    wnd.pgBar.maxvalue = max;
    
    wnd.pgBar.step = function(msg) {
        var f = false;
        if (!app.scriptPreferences.enableRedraw)
            { app.scriptPreferences.enableRedraw = true; f = true; }
            
        this.value++;
        if (msg) this.window.message.text = msg;
        wnd.hide(); wnd.show();
        
        if (f) app.scriptPreferences.enableRedraw = false;
	}
        
    return wnd;
}

// * --------------------------------------------------------------------------------------------------------

function process_all_textframes(doc, origin){
    app.scriptPreferences.enableRedraw = false;
    
    var tframes = doc.allPageItems.filter(function(tf){ return tf.is(TextFrame); });
    var pb = pbar("Importación de datos", "Generando Artículos", tframes.length);
    
    pb.show();
    
    try {
        tframes.forEach(function(tf){
            var re = tf.contents.toString().match(IKEA.RE_LARGECODE);
            pb.pgBar.step(re ? re.toString() : tf.id);
            if (re){
                process_codes(re, tf, origin);
            }
        });
    }
    catch(e) { $.writeln(e); }
    finally {
        app.scriptPreferences.enableRedraw = true;
        pb.close();
    }
}

main();