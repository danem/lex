(function(){
    var p = this.parsec;
    
    var l = p.logging = {
        level: 0,
        indentString: "  |",
    };

    function format( template /* args */ ) {
        var params = p.tail(arguments);
        return template.replace(/{(\d+)}/g, function (match, number) {
            return params[number];
        });
    }

    l.up = function ( /*[template],str*/) {
        var str;
        if ( arguments.length >= 2 ) str = format.apply( this, arguments );
        else str = arguments[0];
        this.level -= 1;
        this.log(str);
    };

    l.down = function ( str ) {
        var str;
        if ( arguments.length >= 2 ) str = format.apply( this, arguments );
        else str = arguments[0];
        this.log( str );
        this.level +=1;
    };

    l.log = function ( str, amount, idtString ) {
        amount = typeof ( amount ) === "number" ? amount : this.level;
        idtString = idtString || this.indentString;
        var s = '';
        for ( var i = 0; i < amount; i++ ) s += idtString;
        console.log( s + str );
    }


}).call(this);
