﻿/** IKEA Config API    Author: Javier Ramos        Retrieve configuration information from disk for the current user.    */IKEA.Config = (function() {    var self = this;    var CONFIG_FILE = '~/.catalogoXML.cfg';    var exported = { name:'IKEA submodule: Config' };    var createConfigFile = function(config) {        var conf = config || {            cached : false,             cache_dir : "",            cb_NAME          : true,            cb_FACTS         : true,            cb_PRICENORMAL   : true,            cb_MEASURE       : true,            cb_COLOR         : true,            cb_CAREINST      : false,            cb_CUSTMATERIALS : true,            cb_CUSTBENEFIT   : false,            cb_DESIGNER      : false,            cb_FORMATNUMBER  : true,            cb_GOODTOKNOW    : false,            cb_ALMCOD        : false        };        var ff = File(CONFIG_FILE);        ff.open('w');        conf.keys().forEach(function(k){            ff.writeln(k + ':' + '"' + conf[k] + '"');        });                ff.close();        this.current_config = conf;        return conf;    };    exported.load = function() {        var ff = File(CONFIG_FILE);        if (! ff.exists) {            // create default configuration            return createConfigFile( /* use default config */);        } else {            var line, k, v;            var conf = {};            ff.open('r');            while (! ff.eof) {                line = (ff.readln()).split(':');                k = line[0].trim();                v = line[1].trim().replace(/^"/, '').replace(/"$/,'');                if (v === 'true' || v === 'false') {                    conf[k] = eval(v);                } else {                    conf[k] = v;                }            }            ff.close();            this.current_config = conf;            return conf;        }    };    /** Given a list of field names (with 'CF_...' or not), return        a new list with the same fields but ordered by precedence.        If no list if passed, use FIELDS_ROOT.        */    exported.fieldsByPrecedence = function(fields) {        var boxes = [];        (fields || IKEA.FIELDS_ROOT).each(function(field) {            var fn = field.replace('CF_', '');            var precedence = IKEA['CP_' + fn];            if (precedence >= 0) {                boxes[precedence] = fn;            }        });        return boxes;    };    exported.createCheckboxes = function( parent ) {        """Create an object and fill it with checkboxes, added to a parent window,           and populate the checkboxes with the config fields.        """        var checkboxes = {};        var conf = this.current_config;                this.fieldsByPrecedence().each(function(k) {            checkboxes[k] = parent.add('checkbox', undefined, IKEA['CL_' + k]);            checkboxes[k].value = conf['cb_' + k];        });        return checkboxes;    };    exported.mapToCheckboxes = function( checkboxes ) {        var conf = this.current_config;        checkboxes.keys().forEach(function(k){            var kf = k.slice(0,3) === 'CF_' ? 'cb_' + k.slice(3) : 'cb_' + k;            checkboxes[k].value = conf[kf];        });            return this;    };        exported.mapFromCheckboxes = function( checkboxes ) {        var conf = this.current_config;        checkboxes.keys().forEach(function(k){            conf['cb_' + k] = checkboxes[k].value;        });            return this;    };    exported.options = function(config) {        """Return names for the config fields that correspond to a check option"""        var conf = config || this.current_config;                return conf.keys().filter(function(k) {             return k.slice(0, 3) === 'cb_' && !!conf[k];         }).map(function(k) {            return k.slice(3);        });    };    exported.activeFields = function(config) {        """Return only the active fields in config, and change the           begining cb_ (checkbox) to CF_ (constant field IKEA wrapper)        """        return this.options(config).map(function(k) {            return 'CF_' + k.toUpperCase();        });    }    exported.save = function(conf) {        var config = conf || this.current_config;        this.current_config = createConfigFile(config);                return this;    };    exported.current_config = null;    return exported;   })();