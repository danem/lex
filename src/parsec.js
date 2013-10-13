(function () {
    var root   = this,
        p = root.parsec = {};
    

    // Bind acts like haskells >>= operator
    // It takes two functions that both return a 
    // STATE, and chains their operations.
    p.bind = function bind ( parser, cont ) {
        return function (state) {
            // State is an array of the form:
            // [ [match], remaining, column, line ]
            if (typeof state === "string" ) state = [[],state,0,0];
            var res = parser.call(this,state[1],state);
            var nstate = res ? [state[0].concat(res[0]), res[1], state[2]+res[2], state[3] + res[3]] : false;
            return cont ? cont(nstate) : nstate;
        };
    };

    p.lift = function ( fn, parser ) {
        return function () {
            var val = parser.apply(this,arguments);
            return val ? [fn.call(this,val[0]),val[1]] : val;
        };
    };

    p.unit = function unit ( fn ) {
        return function ( state ) {
            return fn(state);
        };
    };

    // user passes an object with tokenname and its parser, and returns a parser for all of those tokens.
    // eg: { comment: enclosing( "/*", "*/", any ) }
    p.tokens = function tokens ( obj ) {
        if ( !Array.isArray(obj) ) obj = Object.keys(obj).map(function(k){ return [k,obj[k]]; });
        function token ( l ) {
            return bind( l[1], unit(function(state) { return [l[0],state[0],state[2],state[3]]; }));
        }
        return p.bind(choice(obj.map(token)), unit(identity));
    };
    
    p.parse = function parse ( parsers, init, string ) {
        return parsers.call(this,[init,string,0,0]);
    };


    p.export = function ( names, namespace ) {

        namespace = namespace || root;
        for ( var i = 0; i < names.length; i++ ) {
            var n = names[i];
            namespace[n] = p[n];
        }
    };
}).call(this);
