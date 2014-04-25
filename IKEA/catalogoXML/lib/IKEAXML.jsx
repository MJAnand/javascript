﻿/** IKEA Catalogo XML    Author: Javier Ramos        */#strict on// Extends IKEA module with a submodule for styling capabilitiesIKEA.XML = (function() {    var self = this;        var exported = { name:'IKEA submodule: XML' };    /* ------------------------------------------------------------------------------ */    exported.getRoot = function(doc){        return ((!doc) ? app.activeDocument.xmlElements : doc.xmlElements).item(0);    };        /* ------------------------------------------------------------------------------ */    exported.add = function(root, name, attrs, fields, dest) {        /*  root -> xmlElement root of this one            name -> tag name of the xmlElement            attrs -> object with named properties to put in the xmlElement            fields -> field names            */        if (root === undefined || root === null){            root = self.getRoot(); // document root        } else if (!root.is(XMLElement)) {            throw build_error(ImportError, 'Elemento XML no válido como raíz');        }            var element = root.xmlElements.add(name, dest);        IKEA.Config.fieldsByPrecedence(fields).each(function(key){            var value = attrs.get(key);            if (!!key && !!value) {                element.xmlElements.add(key).contents = value + ' ';            }        });            return element;    };    /* ------------------------------------------------------------------------------ */    exported.removeXMLElementsByAttr = function(attr, value){        var rootElem = app.activeDocument.xmlElements.item(0);        var leaf = rootElem.children().filter(function(el){                 return (el.xmlAttributes.everyItem().value).contains(value);            });        leaf.forEach(function(el) { el.remove(); });    };    /* ------------------------------------------------------------------------------ */    exported.stringifyObject = function(obj, sep) {        var serialize = [];        for (key in obj) {            if (!obj[key].is(Function)){                serialize.push(obj[key]);            }        }        return serialize.join(sep);    };    /** ------------------------------------------------------------------------------         Append a product as XML Element in the 'dest' textframe.        Every textframe have only one 'container' that is the root of every 'Article'        This if to have a topology as:                        C1              Where C1 is the container and                |               A1 thru An are the articles.                 ^               / \              /   \             A1 .. An        */    exported.append = function(product, dest){        var partNumber, data, elem, attr, doc;                doc = document(dest);        partNumber = product.get(IKEA.CF_PARTNUMBER);                // before insert the new product, and only if there is another        // product in the same textFrame, use a emtpy article as envelop.        var tfXML = resolveTextFrame(dest).associatedXMLElement;        if ( !tfXML ) {            IKEA.XML.getRoot(doc).xmlElements.add("Container", dest);        }                if (! IKEA.Config.current_config) {            // Artículo descripción Precio información medidas color formatNumber            data = IKEA.XML.formatProductData(product.defaultFields(IKEA.CF_MEASURE)); // TODO: pass the field_names param!!!        } else {            var field_names = IKEA.Config.activeFields();            data = IKEA.XML.formatProductData(product.fields(field_names), field_names);        }        elem = IKEA.XML.add(IKEA.XML.getRoot(doc), "Article", data, field_names, dest);                elem.xmlAttributes.add(IKEA.CF_PARTNUMBER, partNumber);        elem.xmlAttributes.add('timeStamp', Date(Date.now()));                return elem;    };    /* ------------------------------------------------------------------------------ */        var _search_ = function(root, attrs) {        var found = [];                if ('xml' in root) {            root = root.xml();        }                var matchs = attrs.keys().every(function(k) {            $.writeln("ROOT: ", root.tag(), " | Attr: ", root.attr(k));            return root.attr(k) == attrs[k];        });        if (matchs) {            found.push( root.repr() );        }                if (root.tag().in_('article', 'root')) {            root.children().filter(function(children) {                 return children.tag().toLowerCase() === 'article';            }).each(function(children) {                found = found.concat( search_(children, attrs) );            });        }             return found;    };        var search_ = function(root, attrs) {        var found = [];                if ('xml' in root) {            root = root.xml();        }                var matchs = attrs.keys().every(function(k) {            $.writeln("ROOT: ", root.tag(), " | ", root.val().toString().replace(/\./g, ''));            var v = root.attr(k) == attrs[k] || root.val().toString().replace(/\./g, '') == attrs[k];            if (v) { $.writeln(root.val().toString().replace(/\./g, '') ) }            return v;        });        if (matchs) {            $.writeln("> ROOT: ", root.tag());            found.push( root.repr() );        }                if (root.tag().in_('article', 'root')) {            root.children().each(function(children) {                found = found.concat( search_(children, attrs) );            });        }             return found;    };    exported.search = function(root, attrs) {        var found = search_(root, attrs);        alert('FOUNDS: ' + found);        return found;    };        /* ------------------------------------------------------------------------------ */    exported.formatProductData = function(data, fields) {        /* Apply transformations and convert the object in an array of properties            indexed by fields */               if (!fields) {            fields = [IKEA.CF_NAME, IKEA.CF_FATCS, IKEA.CF_PRICENORMAL, IKEA.CF_CUSTBENEFITS,  IKEA.CF_MEASURE, IKEA.CF_COLOR, IKEA.CF_FORMATNUMBER, IKEA.CF_ALMCOD];        }            data = this.format_name(data, fields);        data = this.format_description(data, fields);        data = this.format_color(data, fields);        data = this.format_price(data, fields);        data = this.format_measure(data, fields);                data = this.format_others(data, fields);        return data;    };    exported.format_name = function(data, fields) {        if (fields.contains("CF_NAME") && data[IKEA.CF_NAME]) {            data[IKEA.CF_NAME] = data[IKEA.CF_NAME].replace(/\d+x\d+(x\d+)?/g, ''); // removes sizes if in name        }        return data;    };            exported.format_description = function(data, fields) {        if (fields.contains("CF_FACTS") && data[IKEA.CF_FACTS]) {            data[IKEA.CF_FACTS] = data[IKEA.CF_FACTS].toLowerCase()                                                     .replace(/\d+x\d+(x\d+)?/g, '')                                                     .replace(/\s\s+/g, ' ')                                                     .replace(/\s+$/, '');            if (fields.contains("CF_COLOR") && data[IKEA.CF_COLOR]) {                data[IKEA.CF_FACTS] = data[IKEA.CF_FACTS].replace(data.color.toLowerCase(), '')            }        }        return data;    };    exported.format_color = function(data, fields) {        if (fields.contains("CF_COLOR") && !data[IKEA.CF_COLOR]) {            data[IKEA.CF_COLOR] = '';        }        return data;    };        exported.format_price = function(data, fields) {        if (fields.contains("CF_PRICENORMAL")) {            var S = IKEA.price_symbol();            if (!data[IKEA.CF_PRICENORMAL]) {                data[IKEA.CF_PRICENORMAL] = S+'0.0';            } else if (data[IKEA.CF_PRICENORMAL].indexOf(S) > 0) {                data[IKEA.CF_PRICENORMAL] = S + data[IKEA.CF_PRICENORMAL].replace(S, '');            }        }        return data;    };    exported.format_measure = function(data, fields) {        if (fields.contains("CF_MEASURE")) {            var dm = data[IKEA.CF_MEASURE];            if (!dm || (dm.constructor.name === 'Array' && dm.lenght === 0)) {                return data;            }                     var res;            var val = dm.values();            if (val.length === 0) {                return data;            }            var sb = dm.values()[0].indexOf('cm') >= 0 ? 'cm' : '"';                 if (IKEA.DEBUG) {                dm.values().to_console(true);            }                        String.prototype._tr = function() { return this.replace(sb, '').trim(); };            String.prototype._cm = function() { return this.replace(/\s\s+/g, ' ') + sb + '.'; };                            $.writeln(dm.keys());                            // TODO: reestructurar para que se añada ,alto si aparece Altura, etc.            if (dm.has('ancho') && dm.has('fondo') && dm.has('altura')) {                res = dm['ancho']._tr() + 'x' + dm['fondo']._tr() + ', alto ' + dm['altura']._tr()._cm();            } else if (dm.has('ancho') && dm.has('longitud')) {                res = dm['longitud']._tr() + 'x' + dm['ancho']._tr()._cm();                if (dm.has('ancho de cama') && dm.has('largo de cama')){                    res += ' Cama: ' + dm['ancho de cama']._tr() + 'x' + dm['largo de cama']._tr()._cm();                }            } else if (dm.has('ancho') && dm.has('fondo')) {                res = dm['ancho']._tr() + 'x' + dm['fondo']._tr()._cm();                if (dm.has('ancho de cama') && dm.has('largo de cama')){                    res += ' Cama: ' + dm['ancho de cama']._tr() + 'x' + dm['largo de cama']._tr()._cm();                }            } else if (dm.has('diámetro')) {                res = 'Ø' + dm['diámetro']._tr()._cm();                if (dm.has('altura')) {                    res += ', alto ' + dm['altura']._tr()._cm();                }            } else if (dm.has('diámetro de la pantalla')) {                res = 'Ø' + dm['diámetro de la pantalla']._tr()._cm();            } else if (data.size) {                res = data.size._tr()._cm();            }                    delete String.prototype._cm;            delete String.prototype._tr;                        data[IKEA.CF_MEASURE] = res;        }            return data;    };        exported.format_info = function(data, fields) {        if (fields.contains("CF_CUSTBENEFIT")) {            if (data[IKEA.CF_CUSTBENEFIT] && data[IKEA.CF_CUSTBENEFIT].is(Array)) {                data[IKEA.CF_CUSTBENEFIT] = data[IKEA.CF_CUSTBENEFIT].join(' ');            }        }        return data;    };    exported.format_others = function(data, fields) {        var non_string_keys;        non_string_keys = data.keys().filter(function(k) { return data[k] && !data[k].is(String); });        non_string_keys.forEach(function(k){            if (data[k].is(Array)) {                data[k] = data[k].join('. ').replace(/\.\./g, '.');            } else {                data[k] = data[k].keys().map(function(q) { return data[k][q]; }).join('. ');            }        });            return data;    };    return exported;})();/* CASOS PARA MEASURE    Altura,diámetro del pie,diámetro de la pantalla,longitud del cable      Ancho,Altura                                                            Ancho,fondo máximo,Altura                                               Ancho,fondo,Altura                                                      Ancho,fondo,Altura,Pantalla plana TV máx                                Ancho,fondo,Altura,Peso máximo,Pantalla plana TV máx                    Ancho,fondo,Altura,Peso máximo/balda                                    Ancho,fondo,Altura,Tamaño de la pantalla                                Ancho,fondo,altura mínima                                               Ancho,fondo,altura mínima,altura máxima,Peso máximo                     Ancho,fondo,fondo máximo,Altura                                         Ancho,profundidad máxima,fondo máximo,Altura                            ancho,profundidad,alto,carga máxima/estante                             diámetro,Altura                                                         diámetro,Altura,longitud del cable                                      longitud,Ancho                                                          longitud,Ancho,Altura                                                   longitud,Ancho,Altura,Peso máximo                                       longitud,Ancho,densidad de la superficie                                longitud,Ancho,densidad de la superficie,Densidad (g/m2),Largo del pelo longitud,fondo,grosor                                                   AlturaAnchoDensidad (g/m2)Largo del pelo Pantalla plana TV máx                                Peso máximo                                       Peso máximo/balda                                    Tamaño de la pantalla                                altoaltura máximaaltura mínima                                               anchocarga máxima/estante                             densidad de la superficie                                diámetrodiámetro de la pantalladiámetro del piefondofondo máximogrosor                                                   longitudlongitud del cable                                      profundidadprofundidad máxima*/