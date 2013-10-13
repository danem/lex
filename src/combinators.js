(function(){
    var p = this.parsec;
    var l = p.logging,
        downstr = "{0}: ({1}) ({2})",
        upstr   = "|=> {0} ({2})";

    function toArray( l ) { return Array.prototype.slice.call(l); };
    function falsy ( v ) { return typeof v === "undefined" || v === false; }
    
    /*
     * The State type
     * @typedef [[{*}], {string|boolean}, {number}, {number}];
     */
    var state;

    /*
     * ParserT type
     * @typedef function({string}): state
     *
     */
    var parserT;



    /*
     * A key value store for looking up parsers that have been defined recursively.
     *
     * @dict
     * @private
     */
    var parsers = {};


    // Applies a function to a parserState
    function parse ( state, fn ) {
            state = Array.isArray(state) ? state : [[],state];
            var val = fn.call(this,state[1]);
            return falsy(val) ? false : [state[0].concat(val[0]), val[1]];
    }

    // Creates a parser from the given parsers. 
    // A parser can be named by providing a string as the first argument.
    // This allows for recursive definitions of parsers.
    //    //     EXPR  = T { B T }
    //     T     = v | "(" EXPR ")" | U T
    //     V     = {num}{alpha} | {num} | {alpha}
    //     B     = '+' | '-' | '*' | '/'
    //     U     = '-'
    //     num   = 0-9
    //     alpha = a-zA-Z
    //
    // In practice, this would look like:
    //     var term = parser( 'term', 
    //         choice( 
    //             Id,
    //             parens( parser('expr') ),
    //             parser( char('-'), parser('term') )
    //          )
    //      ),
    //      expr = parser( 'expr', term, many( oneOf("+-*/"), term ) );
    //
    
    function parser (/* [name], parser1 [, parser2 [, ... ] ] */) {
        var self  = this,
            _args = toArray(arguments), // save the original parameters so we can clone the parser later
            args,
            len,
            i,
            name,
            firstFn,
            returnFn,
            column,
            line,
            logVal, 
            appliedLog; // prevent calling the 'log' function with each call of a recursively defined parser.
        


        if ( typeof _args[0] === "string" ) {
            name    = _args[0];
            args    = _args.slice(1);
        }
        else { 
            args = _args.slice();
        }

        len = args.length;

        if ( len ) {
            returnFn = function (state){
                if ( typeof state === "string" ) state = [[],state,0,0];
                column = state[2];
                line   = state[3];
                for ( var i = 0; i < len; i++ ) {
                    if ( falsy(state) || falsy(state[1]) ) return state;
                    //if ( falsy(state) ) return state;

                    if ( logVal ) l.down( downstr, logVal, state[0], state[1] );

                    var result = args[i].call(this,state[1],state);

                    if ( logVal ) l.up( upstr, result[0], result[1] );

                    column += result[2];
                    line   += result[3];
                    state = result 
                        ? [state[0].concat(result[0]), result[1], column, line ] 
                        : false;
                    
                    if (falsy(state)) return false;
                }
                return state;
            };
            if ( name ) parsers[name] = returnFn;
        }
        else if ( name ) { 
            returnFn = function () {
                var p = parsers[name];
                if ( appliedLog !== logVal ){
                    //p = p.log( logVal );
                    appliedLog  = logVal;
                }
                return p.apply( this, arguments );
            };
        }
        // If there are no parsers, the parser function is simply the Identity function.
        else returnFn = function (s){
            return s;
        };
        returnFn.log = function (v){
            logVal = v;
            return returnFn;
        };

        returnFn.named = function (v) {
            if ( !arguments.length ) return name;
            name = v;
            parsers[v] = returnFn;
            return returnFn;
        };

        return returnFn;
    }

    // Creates a token parser with a given name and 'unit' function. 
    // For instance, an integer token may be written as follows:
    //
    //     var int = token("INTEGER", compose( join, parseInt ))( many1(digit) );
    //     parse( int, '', "34" ) => ["INTEGER", 34]
    // 
    // @param {string} name Name of parser
    // @param {state}  fn   Transforms resultant state. This is equivalent to lift( fn, token );
    //
    var token = function token ( name, fn ) {
        return function tokenParser ( /*fn1,fn2,...*/) {
            var tokParser = parser.apply(this,arguments);
            var tok = parser( function (str) {
                var state = tokParser.apply(this,arguments);
                if ( falsy(state) ) return false;
                var val = fn ? fn.call(this,state[0]) : state[0];
                return [[[name,val]], state[1]];
            });
            return tok.log(name);
            //return tok;
        };
    };
    
    // Creates an optional parser. For instance:
    //     var number = parser(
    //         optional( oneOf("+-") ),
    //         many( digit ),
    //         optional(
    //            parser( char('.'), many1(digit) )
    //         )
    //     );
    //
    //     parse(number,'',"1")   => "1"
    //     parse(number,'',"-2")  => "-2"
    //     parse(number,'',"-.4") => "-.4"
    //     parse(number,'',"1.")  => false
    // 
    // If a parser does not match, no values are consumed.
    //
    // @param parserT
    var optional = function optional ( fn ) {
        return parser(function optional (s) {
            var val = fn.call(this,s);
            return val ? val : [[],s];
        });
    };
    
    // Creates a parser in which matched sequences are discarded
    //     var noSpaces = many( parser( alpha, pass(char(" ")) ) );
    //     parse( noSpaces, '', "h e l l o" ) => "hello"
    //
    var pass = function pass ( fn ) {
        return parser(function pass (s){
            var val = fn.call(this,s);
            return val ? [[],val[1]] : val;
        });
    };
    
    // Creates a parser the matches 0 or more occurances of the provided parser
    //     var number = many( oneOf("1234567890") );
    //     parse( number, '', "" ) >= [] // notice, no error
    //     parse( number, '', "1") >= ["1"]
    //     parse( number, '', "12") >= ["1","2"]
    var many = function many ( fn ) {
        return parser(function many (str) {
            var cont = true,
                state=[[],str],
                last = str;

            while ( cont ) {
                var s = fn(state[1]);
                if ( !s || s[1] === last ) cont = false;
                else {
                    last  = s[1];
                    state = [state[0].concat(s[0]),s[1]];
                }
            }
            return state;
        });
    };
    
    // Same as many, but matches 1 or more
    var many1 = function many1 (fn){
        return parser(function many1 (str){
            var s = many(fn).call(this,str);
            return (s[0].length === 0) ? false : s;
        });
    };
    
    // Creates a parser that matches one of two supplied parsers
    //     var catmat = parser( or( char('m'), char('c') ), string('at') );
    //     parse( catmat, '', 'cat') >= 'cat'
    //     parse( catmat, '', 'mat') >= 'mat'
    //
    var or = function or ( fn1, fn2 ) {
        if (!(fn1 || fn2) ) debugger;
        return parser(function or ( str ) {
            "or";
            var val = fn1(str);
            return val ? val : fn2(str);
        });
    };

    // Creates a parser that matches one of the supplied parsers. 
    var choice = function choice ( /* fn1, fn2, ... */ ) {
        var fns = Array.isArray(arguments[0]) ? arguments[0] : toArray(arguments);
        return parser(function choice (str) {
            for ( var i = 0; i < fns.length; i++ ) {
                var v = fns[i].call(this,str);
                if ( v ) return v;
            }
            return false;
        });
    };


    // ugly. this is practically "surrounded" except we return
    // the outside instead of the contents.
    var sepby = function sepby ( fn, by ) {
        var sep = pass(by);
        return parser(many(function(str) {
            var z = fn.call(this,str);
            if (!z) return false;
            var s = sep(z);
            if (!s) return false;
            var x = fn.call(this,s[1]);
            return x ? [z[0].concat(x[0]),x[1]] : false;
        }));
    };

    // Creates a parser that matches a parser that is between two other parsers.
    //      var quoted = surrounded( char('"'), char('"'), many(any) );
    //      parse( quoted, '', '"a quote", said jane') => 'a quote'
    //
    var surrounded = p.partial( 3, function ( open, close, inner ) {
        return parser(function surrounded ( str ) {
            var o = open(str);
            if (o===false) return false;
            var i = inner(o[1]);
            if (i===false) return false;
            var c = close(i[1]);
            return c ? [i[0],c[1]] : false;
        });
    });

    var chainl1 = function ( pp, op ) {
        var x;
        var rest = choice(
            parser( function (str) {
                if (str===false || str === '') return false;
                var f = op.call(this,str);
                if ( !f ) return false;
                var fn = f[0] || f;
                var y = pp.call(this,[[],f[1]]);
                if (!y || !x ) return false;
                //console.log( x[0], y[0] );
                return rest([fn.call(this, x[0], y[0]), y[1]]);
            }),
            //p.char('asfasfasf')
            p.identity
        );
        var init = parser( function (str) {
            var val = pp.call(this,str);
            x = val[0];
            return val ? rest( val ) : false;
        });
        return init;
    };

    var lookAhead = function ( fn ) {
        return function (str,state) {
            var val = fn.call(this, state[1]);
            return val ? [val[0],state[1]] : val;
        };
    };


    

    var parseN =  function ( fn, n ) {
        return function parseN ( str ) {
            var ret = fn(str);
            for ( var i = 1; i < n; i++ ) {
                var z = fn(ret[1]);
                if ( !z ) return false;
                ret = [ret[0]+z[0], z[1]];
            }
            return ret;
        };
    };
    
    p.parser     = parser;
    p.token      = token;
    p.optional   = optional;
    p.many       = many;
    p.many1      = many1;
    p.pass       = pass;
    p.or         = or;
    p.choice     = choice;
    p.sepby      = sepby;
    p.surrounded = surrounded;
    p.lookAhead  = lookAhead;
    p.chainl1    = chainl1;

}).call(this);
