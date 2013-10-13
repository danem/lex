(function () {

    var p = this.parsec;
    
    function charfn ( fn ) {
        return p.parser(function ( str ) {
            if ( fn(str[0]) ) return [str[0],str.slice(1),1, 0 ];
            else return false;
        });
    }

    var char = function char ( c ) {
        return charfn(function (ltr){
            return c === ltr;
        });
    };

    var string = function ( str ) {
        return p.parser(function (b) {
            if ( b.slice(0,str.length) === str ) {
                return [str,b.slice(str.length)];
            }
            else return false;
        });
    };

    var any = charfn( p.const( true ) );

    var oneOf = function ( chars ) {
        chars = Array.isArray(chars) ? chars : typeof(chars) === 'string' && arguments.length === 1 ? chars.split('') : p.toArray(arguments);
        return charfn(function(c){
            return chars.indexOf(c) !== -1;
        });
    };

    var noneOf = function (chars){
        chars = Array.isArray(chars) ? chars : typeof(chars) === 'string' && arguments.length === 1 ? chars.split('') : p.toArray(arguments);
        return charfn(function (c) {
            return chars.indexOf(c) === -1;
        });
    };

    var space  = char( " " );
    var spaces = p.many( space );

    var newline       = charfn( function ( c ) { return ['\n','\r','\c'].indexOf(c) !== -1; } );
    var whitestuff    = charfn( function ( c ) { return c === "\n" || c === "\r" || c === "\t"; });
    var whitespace    = charfn( function ( c ) { return c === "\n" || c === "\r" || c === "\t" || c === " "; });
    var whitestuffs   = p.many(whitestuff);
    var whitespaces   = p.many(whitespace);

    var digit = charfn( function ( c ) { return c >= '0' && c <= '9'; });
    var alpha = charfn( function ( c ) { 
        return ( c >= 'a' && c <= 'z' ) || ( c >= 'A' && c <= 'Z' );
    });
 
    var alphanum    = p.or(alpha,digit);

    var int = p.many1( digit );
    var float = p.parser( 
        p.optional(char('-')), 
        p.many(digit), 
        char('.'), 
        p.many1(digit) 
    );
    var number = p.or( float, int );
    var bool = p.choice( string('true'), string('True'), string('false'), string('False') );

    var singleQuoted = p.surrounded(char("'"),char("'"),p.many(noneOf("'")));
    var doubleQuoted = p.surrounded(char('"'),char('"'),p.many(noneOf('"')));

    var parens = function ( fn ) {
        return p.surrounded(char("("), char(")"),p.parser( p.pass(spaces), fn, p.pass(spaces) )); 
    };

    var optionalParens = function ( fn ) {
        return p.or(
            parens( fn ),
            fn
        );
    };

    p.char         = char;
    p.string       = string;
    p.any          = any;
    p.oneOf        = oneOf;
    p.noneOf       = noneOf;
    p.space        = space;
    p.spaces       = spaces;
    p.newline      = newline;
    p.whitespace   = whitespace;
    p.whitespaces  = whitespaces;
    p.whitestuff   = whitestuff;
    p.whitestuffs  = whitestuffs;
    p.alpha        = alpha;
    p.alphanum     = alphanum;
    p.digit        = digit;
    p.int          = int;
    p.float        = float;
    p.number       = number;
    p.bool         = bool;
    p.singleQuoted = singleQuoted;
    p.doubleQuoted = doubleQuoted;
    p.parens       = parens;
    p.optionalParens = optionalParens;

}).call(this);
