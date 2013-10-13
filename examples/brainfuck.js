(function(){
    if ( typeof require === "function" ) parsec = require("../src/parsec.js"); 
    p = parsec;

    // because the while expr is recursive, we need to cache its parser.
    var whileFn = p.enclosing( "[", "]" );
    var tokens = p.tokens({
         IncPtr: p.char(">")
        ,DecPtr: p.char("<")
        ,Inc:    p.char("+")
        ,Dec:    p.char("-")
        ,Out:    p.char(".")
        ,Inp:    p.char(",")
        ,While:  function(str){
            return whileFn(tokens)(str);
        }
    });

    var program = function ( str ) {
        return p.parse(p.bind( p.many(tokens), p.unit( p.identity ) ), "", str );
    };

    if ( typeof module !== "undefined" ) module.exports = program
    else window.prog = program;

}).call(this);
