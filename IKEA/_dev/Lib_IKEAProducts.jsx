﻿/** IKEA Products API
    Author: Javier Ramos
    
    Dependencies: extentables
    
    Retrieve information about products from an external web API.
    */

#target "indesign"
#strict on

#include "~/_scripts/frameworks/Extendables/extendables.jsx"

var IKEA = IKEA || (function(){
    const IKEA_URL = "http://ibiza.ikea.es/esi/es/catalog/products/";
    
    var nullify = function(v){ 
        return !v || v === 'null'; 
    };
    
    var build_error = function(ErrorType, message){
        var res = new ErrorType();
        res.message = message;
        return res;
    };

    var null_object = function(obj){
        for (key in obj){
            if (obj[key] === 'null'){
                obj[key] = null;
            }
            else if (obj[key] && obj[key].is(Object) && !obj[key].is(Function)){
                null_object(obj[key]);
            }
        }
    };
    
    var eval_safe = function(obj_str){
        // Use a more safe eval, that, for example, change al the "null" by actual null values.
        var obj = eval(obj_str);
        if (obj.is(Array)){
            obj = obj.first();
        }

        null_object(obj);
            
        return obj;
    };

    /** _GET :: string -> [{name: ..., value: ...}] -> string
        
        Do a HTML GET request to 'url' with 'params' being an 
        array of {key:value} parameters to send.
        */
    var _GET = function (url, params){
        var http, response;
        var par = '';

        if (!nullify(params)){
            par = '?';
            params.forEach(function(param){ 
                par += param.name + '=' + param.value + '&';
            });
            par = par.slice(0, -1);
        }

        http = require("http");
        response = http.get(url + par);
        
        if (response.status == 200){
            return response.body;
        }
            
        throw new ImportError('Error al conectar con la Base de Datos');
    };

    /** getProductInfoXML :: product_id -> string
        
        Given a IKEA Product PartNumber
        */
    var getProductInfoXML = function(product_id){
        return _GET(IKEA_URL + product_id, 
                   [{name:'type', value:'xml'},
                    {name:'dataset', value:'prices'}]);
    };

    /** getProductInfoJSON :: product_id -> string
        
        Given an IKEA product partNumber return json string representing it.
        */
    var getProductInfoJSON = function(partNumber, island, date){
        const data = "type=json&dataset=ptagPOST" +
                     "&island=" + (island || IKEA.TENERIFE) +
                     "&date=" + (date || '') +
                     "&products[]=" + partNumber;
        
        var http = require("http");
        var response = http.post(IKEA_URL, data);
        
        if (response.status === 200){
            return response.body;
        }
            
        throw build_error(ImportError, 'Error al conectar con la Base de Datos');
    };

    var KEYS = ["lanzarote","puertorico","palma","tenerife"];

    return {
        LANZAROTE: KEYS[0],
        PUERTO_RICO: KEYS[1],
        PALMA: KEYS[2],
        TENERIFE: KEYS[3],
        ORIGENES: [ 
             { name: 'LANZAROTE',    code: KEYS[0] }, 
             { name: 'PUERTO RICO',  code: KEYS[1] }, 
             { name: 'MALLORCA',     code: KEYS[2] }, 
             { name: 'GRAN CANARIA', code: KEYS[3] }, 
             { name: 'TENERIFE',     code: KEYS[3] }
        ],
        field_alias: { 
            description: 'facts', 
            price: 'priceNormal', 
            large_code: 'formatNumber', 
            sort_code: 'almcod' 
        },
        defaultFieldNames: [
           { name: 'name'        , text: 'Nombre'       },
           { name: 'description' , text: 'Descripción'  },
           { name: 'price'       , text: 'Precio'       },
           { name: 'size'        , text: 'Medidas'      },
           { name: 'color'       , text: 'Color'        },
           { name: 'large_code'  , text: 'Código'       },
           { name: 'sort_code'   , text: 'Código Corto' }
        ],
        
        PS_ARTICULO: { fontName: 'Verdana IKEA', pointSize: 7.25, fontStyle: 'Normal', tracking:-40, kerningValue: 9.5 },
        
        RE_LARGECODE: /\d\d\d\.\d\d\d\.\d\d/mg,
                   
        IKEAProduct: function(partNumber, island, date){
            var self = this;
            var pinfo, pn, product;

            // remove points in partNumber XXX.XXX.XX to XXXXXXXX
            pn = Number(partNumber.replace(/\./g, ''));
            
            pinfo = getProductInfoJSON(pn, island, date);
            
            if (nullify(pinfo)) {
                var error = new ValidationError();
                error.message = 'No se han encontrado datos para la referencia "{}".'.format(partNumber);
                throw error;
            }
            
            $.writeln(pinfo);
            
            product = eval_safe(pinfo);
            if (product.is(Array)){
                product = product.first();
            }

            return {
                attributes: product,

                get: function(field, cutText) { 
                    var v;
                    // maps field names with alias
                    if (IKEA.field_alias[field]){
                        field = IKEA.field_alias[field];
                    }
                        
                    v = this.attributes[field] || "";
                    if (nullify(v)){
                        return null;
                    }
                        
                    // remove duplicate substring
                    if (cutText && v.indexOf(cutText) >= 0){
                        return v.replace(cutText, '').trim().replace(/,$/,''); 
                    }
                
                    return v.trim();
                },
            
                set: function(field, value) { this.attributes[field] = value; return this; },
                
                toString: function() { return pinfo[0]; },
                
                defaultFields: function(){
                    return { name: this.get('name'),
                             description: this.get('facts', this.get('color')),
                             price: this.get('priceNormal'),
                             size: this.get('size'),
                             color: this.get('color'),
                             large_code: this.get('formatNumber'),
                             sort_code: this.get('almcod')
                           };                    
                },
            
                format: function(args) {
                    var r;
                    
                    if (!args) { args = {}; }
                    if (!args.sep) { args.sep = '|'; }
                    if (!args.fields){
                        r = this.defaultFields();
                    }else{
                        var self = this;
                        r = {};
                        this.attributes.keys().forEach(function(k){
                            if (args.fields.contains(k)){
                                r[k] = self.attributes[k];
                            }
                        });
                    }
                    
                    return r.values().compact().join(args.sep).trim();
                },
            
                fields: function( field_names ){
                    if (!field_names){
                        return this.defaultFields();
                    }
                    
                    var res = {};
                    
                    var self = this;
                    field_names.forEach(function(field){
                        res[field] = self.get(field);
                    });
                
                    return res;
                }
            };
        },

        xmlRoot: function(doc){
            return (!doc) ? app.activeDocument.xmlElements.item(0) :
                            doc.xmlElements.item(0);
        },
        
        addXMLElement: function(root, name, attrs, dest) {
            if (root === undefined || root === null){
                root = this.xmlRoot(); // document root
            } else if (!root.is(XMLElement)) {
                build_error(ImportError, 'Elemento XML no válido como raíz');
            }
        
            var element = root.xmlElements.add(name, dest);
            for(name in attrs) {
                if (attrs[name] && attrs[name].is(String)){
                    var inner = element.xmlElements.add(name);
                    inner.contents = attrs[name] + ' ';
                }
            }
        
            return element;
        },
    
        removeXMLElementsByAttr: function(attr, value){
            var rootElem = app.activeDocument.xmlElements.item(0);
            var leaf = rootElem.children().filter(function(el){ 
                    return (el.xmlAttributes.everyItem().value).contains(value);
                });

            leaf.forEach(function(el) { el.remove(); });
        },
    
        productToXML: function(product, doc, dest){
            var code, data, elem, attr;
            
            if (!doc) {
                doc = app.activeDocument;
            }
            
            code = product.get('partNumber');
            
            IKEA.removeXMLElementsByAttr('partNumber', code);
            
            // insert new xmlElement in document root
            data = product.fields(['name', 'description', 'price', 'size', 'color', 'large_code']);
            elem = IKEA.addXMLElement(IKEA.xmlRoot(doc), "Article", data, dest);
            elem.xmlAttributes.add('partNumber', code);
            elem.xmlAttributes.add('timeStamp', Date(Date.now()));
            
            return elem;
        },
    
        paragraphStyle: function(name, defaultDef, doc_){
            var doc, styles, new_style;
            doc = (doc_ === undefined) ? (app.documents.length === 0 ? app : app.activeDocument) : doc_;
            
            styles = doc.paragraphStyles.everyItem().name;
            if (styles.some(function(e){ return e === name; })){
                return doc.paragraphStyles.item(name);
            }
        
            if (defaultDef === undefined){
                throw build_error(ValidationError, 'No existe el estilo de párrafo ' + name);
            }
        
            new_style = doc.paragraphStyles.add({ name: name, 
                                                  appliedFont: defaultDef.fontName || 'Verdana IKEA',
                                                  fontStyle: defaultDef.fontStyle || 'Normal', 
                                                  pointSize: defaultDef.pointSize || 9,
                                                  tracking: defaultDef.tracking || 0,
                                                  kerningValue: defaultDef.kerningValue || 11.1 });
            return new_style;
        },
    
        getTextFrame: function(sel){
            if (!sel) {
                return undefined;
            } else if (sel.is(TextFrame)){
                return sel;
            }
            else if (sel.is(InsertionPoint) || sel.has_own('parentTextFrames')){
                return sel.parentTextFrames[0];
            }
                
            throw build_error(ValidationError, "El objeto no contiene texto.");
        }
    };
})();