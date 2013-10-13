(function () {
    var p = this.parsec;

    p.identity = function identity ( x ) { return x; };
    p.const    = function ( v ) { return function () { return v; }; };
    p.toArray  = function toArray( l ) { 
        return Array.isArray(l) ? l : Array.prototype.slice.call(l);
    };

    p.trampoline = function trampoline ( fn ) {
        return function (/* arg1 [, arg2 [, ... ] ]*/ ) {
            var result = fn.apply(this,arguments);

            while( result instanceof Function ) {
                result = result();
            }

            return result;
        };
    };

    p.partial = function ( /*nArgs, fn , args */ ) {
        var args = [].slice.call(arguments);
        var nArgs = args[0],
            fn    = args[1];
        if ( args.slice(2).length >= nArgs ) {
            return fn.apply( this, args.slice(2) );
        }
        else {
            return function () {
                var _args = [].slice.call(arguments);
                _args.splice( 0, 0, fn );
                _args.splice( 0, 0, nArgs );
                return p.partial.apply( this, _args );
            };
        }
    };

    p.compose = function ( /*args*/ ){
        var args = [].slice.call(arguments);
        if ( typeof(args[0]) === "function" ) {
            return function ( /*args*/ ) {
                var argus = [].slice.call(arguments);
                var fn = p.compose.apply( this, args.slice(1) );
                return fn(args[0].apply( this, argus ));
            };
        }
        else return p.identity;
    };
    

    p.flatten = function ( l ) {
        return [].prototype.concat.apply([],l);
    };

    p.zip = function ( a, b ) {
        return a.map( function ( e, i ) {
            return [e, b[i]];
        });
    };

    p.zipWith = function ( fn, a, b ) {
        return a.map(function(x,i){
            return fn( x, b[i] );
        });
    };

    p.head = function (l)     { return p.toArray(l)[0]; }; 
    p.init = function (l)     { return p.toArray(l).slice(0,l.length-1); };
    p.tail = function (l)     { return p.toArray(l).slice(1,l.length); };
    p.last = function (l)     { return p.toArray(l)[l.length-1]; };
    p.take = function (l,n,s) { s = s||0; return p.toArray(l).slice(s,s+(n||l.length)); };

    p.get = function ( attr ) {
        return function ( obj ) { return obj[attr]; };
    };
    p.set = function ( attr, fn ) {
        return function ( obj ) {
            obj[attr] = fn(obj[attr]);
            return obj;
        };
    };
    p.join = function (l) { return l.join(''); };

    p.foldl = function ( fn, x, xs ) {
        var acc = x;
        for ( var i = 0; i < xs.length; i++ ) {
            acc = fn( acc, xs[i] );
        }
        return acc;
    };

    p.foldr = function ( fn, x, xs ) {
        return p.foldl( fn, x, xs.reverse() );
    };


}).call(this);
