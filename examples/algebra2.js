
    /*
     * Algebra BNF
     * aexpr  = op | term | '(' expr ')'
     * term  = num | var | '(' term ')'
     * op    = ( term | expr ) ( var { op } | opChar expr )
     */
    var p = parsec;

    with (parsec){
        var toFloat     = compose( join, parseFloat );
        var number      = token( "NUMBER", toFloat)( or( float, int ) ),
            variable    = parser( token( "VARIABLE" )( alpha ) ),
            opchar      = parser(surrounded( spaces, spaces, oneOf("^*/+-") )).log("OP CHAR"),
            powchar     = parser(surrounded( spaces, spaces, char('^') )),
            opFns       = function ( op ) {
                function opfn ( name ) {
                    return function ( a, b ) { 
                        return [ name, a, b ];
                    };
                }
                var name = "+-*/^".indexOf( op[0] ) === -1 ? "*" : op[0];
                return opfn(name);
            };

        var _e = parser( 'expr' ),
            _a = parser( 'addop'),
            _t = parser( 'term' ),
            _f = parser( 'factor' ),
            _s = parser( 'sexpr' ),
            _n = parser( 'number' ),
            _v = parser( 'variable' );
        
        var mulop = surrounded( spaces, spaces, oneOf("*/") ).log("MULOP"),
            addop = surrounded( spaces, spaces, oneOf("+-") ).log("ADDOP");

        var expr  = token("EXPR")(chainl1( _t.log("EXPR TERM"), lift( opFns, addop.log("ADDOP") ) )),
            term  = token("TERM")( chainl1( _f.log('TERM FACTOR'), lift( opFns, mulop  )).log("TERM CHAIN")).named("term"),
            fact  = token("FACTOR")( chainl1( _s.log('FACT SEXPR'), lift( opFns, powchar ) ).log("FACT CHAIN") ).named("factor"),
            sexpr = token("SEXPR")( choice(
                parens( expr ).log("SEXPR EXPR"),
                number,
                variable
            )).named("sexpr");
        
        var x = bind(expr);
            
    }

