var fs = require('fs');
var through = require('through2');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

const PLUGIN_NAME = 'gulp-gendoc';

var reg = {
    method( doc ) {
        var result = /(?:(?:^|\n)@method +)(.+)/.exec( doc );
        if ( result ) {
            return result[1];
        }
    },
    description( doc ) {
        var result = /(?:(?:^|\n)@description +)([\s\S]*?)(?=$|\n@)/.exec( doc );
        if ( result ) {
            return result[1];
        }
    },
    param( doc ) {
        var params = [];

        doc.replace(/(?:(?:^|\n)@param +)\{(.*)\} +([^ ]+) +(.*)/g, function( m, type, name, description ) {
            params.push({
                name: name,
                type: type,
                description: description
            });
        });
        return params;
    },
    return( doc ) {
        var result = /(?:(?:^|\n)@return +)\{(.*)\} +(.*)/.exec( doc );
        if ( result ) {
            return {
                type: result[1],
                description: result[2]
            };
        }
    },
    property( doc ) {
        var result  = /(?:(?:^|\n)@property +)(.*)/.exec( doc );
        if ( result ) {
            return result[1];
        }
    },
    type( doc ) {
        var result  = /(?:(?:^|\n)@type +)\{(.*)\}/.exec( doc );
        if ( result ) {
            return result[1];
        }
    }
};

function toObject( doc ) {
    doc = doc.replace(/(?<=\n|^) *(\* |\/\*\*.*\n|\*\/.*)/g, '');
    var obj = {};
    for ( var i in reg ) {
        obj[ i ] = reg[i]( doc );
    }
    return obj;
}

function gendoc( path ) {
    // encode : 编码方式（utf8）
    var stream = through.obj(function( file, encode, cb ) {
        var str = file.contents.toString();

        var docs = str.match(/\/\*\*@doc[\s\S]*?\*\//g) || [];

        docs = docs.map(function( doc ) {
            return toObject( doc );
        });

        fs.writeFile( path, JSON.stringify( docs ), function( err ) {
            if ( err ) {
                return console.error( err );
            }
        });

        // 确保文件进入下一个插件
        this.push( file );
    });

    return stream;
}

module.exports = gendoc;