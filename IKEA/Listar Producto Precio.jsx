﻿#target "indesign"#targetengine "medianis"#strict on// http://extendables.org/#include "~/_scripts/frameworks/Extendables/extendables.jsx"#include "~/_scripts/lib/timer.jsx"#include "~/_scripts/lib/indesign.jsx"#include "lib/IKEA.jsx"function listarProductoPrecio(doc, re, reC){    var pairsPC = [];    // genera pairsPC: pares de objetos Word (codigo,precio)    doc.allPageItems.filter( function(pi) { return pi instanceof TextFrame && re.test(pi.contents); } )                    .forEach( function(tFrame) {                        IKEA.removeLabelMarks(tFrame);                                                var w;                        var precio=null, codigo=null;                                                // algunas cajas tienen el código ANTES que el precio                        for (var i=0, e=tFrame.words.length; i<e; ++i) {                            w = tFrame.words[i];                            if (DEBUG) var wc = w.contents;                                                     /* DEBUG */                            if (precio == null && codigo == null && re.test(w.contents))                                precio = w;                            else if (codigo == null && precio == null && reC.test(w.contents))                                codigo = w;                                                            if (precio != null && reC.test(w.contents)) {                                pairsPC.push({ wCodigo:w, wPrecio:precio, actualizado:false });                                if (DEBUG) $.writeln(w.contents + ' -> ' + precio.contents);                    /* DEBUG */                                precio = null;                            }                            else if (re.test(w.contents) && codigo!=null) {                                pairsPC.push({ wCodigo:codigo, wPrecio:w, actualizado:false });                                if (DEBUG) $.writeln(codigo.contents + ' -> ' + w.contents);                    /* DEBUG */                                codigo = null;                            }                        }                    });    pairsPC.forEach( function(pc) {        $.writeln(pc.wCodigo.contents + ' = ' + pc.wPrecio.contents);    } );    }listarProductoPrecio(app.activeDocument, IKEA.rePR,  IKEA.reCODE);