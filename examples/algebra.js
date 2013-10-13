(function(){
    var root = this,
        p    = root.parsec,
        algebra = root.algebra = {},
        parsers = {};

    /*
     * BNF For algebraic expressions
     * EXPR = OP | TERM | '(' EXPR ')'
     * OP   = ( TERM | '(' TERM ')' | '(' EXPR ')' ) OpChar EXPR
     * TVAR = 
     */ 
     
    var toFloat     = p.compose( p.join, parseFloat );

    var _op   = p.parser( 'op' ),
        _term = p.parser('term'),
        _ex   = p.parser('expr');

    var number      = p.token( "NUMBER", toFloat)(p.or( p.float, p.int )),
        variable    = p.token( "VARIABLE", p.head )( p.alpha ),
        opChar      = p.token( 'OPCHAR', p.head )(p.surrounded( p.spaces, p.spaces, p.oneOf("*/+-"))),
        factor      = p.token( 'FACTOR' )(p.or(
            p.parser(p.optional(number),p.many1(variable)),
            p.parser( number, p.many(variable) )
        ));


    var expr = p.parser( 'expr', p.token( "EXPR", p.head )( p.choice( _op, _term, p.parens( _ex ) ) ) ),
        op   = p.parser( 'op', p.token('OP', function (l){ return [l[1],l[0],l[2]]; })( 
            p.choice( _term, p.parens(_term), p.parens( expr )),
            opChar,
            expr
        )),
        tvar = p.or(  op, variable ),
        term = p.parser( 'term', p.token('TERM')( 
                p.choice(
                    p.parser( p.optional(number), p.many1( variable ) ),
                    p.parser( number, p.many(variable) )
                    //number,
                    
                    //variable
                )
            )
        );
    



    
    algebra.expr = expr;
    algebra.term = p.bind(term);
    algebra.op   = p.bind(op);
    algebra.tvar = p.bind(tvar);
    algebra.fact = p.bind(factor);
 
})();
