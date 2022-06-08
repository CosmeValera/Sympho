function pug_escape(e){var a=""+e,t=pug_match_html.exec(a);if(!t)return e;var r,c,n,s="";for(r=t.index,c=0;r<a.length;r++){switch(a.charCodeAt(r)){case 34:n="&quot;";break;case 38:n="&amp;";break;case 60:n="&lt;";break;case 62:n="&gt;";break;default:continue}c!==r&&(s+=a.substring(c,r)),c=r+1,s+=n}return c!==r?s+a.substring(c,r):s}
var pug_match_html=/["&<>]/;function insertSheets(locals) {var pug_html = "", pug_mixins = {}, pug_interp;;var locals_for_with = (locals || {});(function (sheets) {// iterate sheets
;(function(){
  var $$obj = sheets;
  if ('number' == typeof $$obj.length) {
      for (var pug_index0 = 0, $$l = $$obj.length; pug_index0 < $$l; pug_index0++) {
        var sheet = $$obj[pug_index0];
pug_html = pug_html + "\u003Cdiv class=\"card col-md-6 my-2 mb-50 shadow-sm\"\u003E\u003Cdiv class=\"card-body\"\u003E\u003Cp class=\"d-none this-is-id\"\u003E" + (pug_escape(null == (pug_interp = `${sheet._id}`) ? "" : pug_interp)) + "\u003C\u002Fp\u003E\u003Ch4 class=\"card-title\"\u003E" + (pug_escape(null == (pug_interp = `Score name: ${sheet.nombre}`) ? "" : pug_interp)) + "\u003C\u002Fh4\u003E\u003Cp class=\"card-text\"\u003E" + (pug_escape(null == (pug_interp = `Score author: ${sheet.compositor}`) ? "" : pug_interp)) + "\u003C\u002Fp\u003E\u003Cp class=\"card-text\"\u003E" + (pug_escape(null == (pug_interp = `Instrument: ${sheet.instrumento}`) ? "" : pug_interp)) + "\u003C\u002Fp\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"card-footer d-flex justify-content-between\"\u003E\u003Ca class=\"btn btn-primary btn-remove-sheet\" href=\"#\" data-type=\"details\"\u003E" + (pug_escape(null == (pug_interp = "Details") ? "" : pug_interp)) + "\u003C\u002Fa\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index0 in $$obj) {
      $$l++;
      var sheet = $$obj[pug_index0];
pug_html = pug_html + "\u003Cdiv class=\"card col-md-6 my-2 mb-50 shadow-sm\"\u003E\u003Cdiv class=\"card-body\"\u003E\u003Cp class=\"d-none this-is-id\"\u003E" + (pug_escape(null == (pug_interp = `${sheet._id}`) ? "" : pug_interp)) + "\u003C\u002Fp\u003E\u003Ch4 class=\"card-title\"\u003E" + (pug_escape(null == (pug_interp = `Score name: ${sheet.nombre}`) ? "" : pug_interp)) + "\u003C\u002Fh4\u003E\u003Cp class=\"card-text\"\u003E" + (pug_escape(null == (pug_interp = `Score author: ${sheet.compositor}`) ? "" : pug_interp)) + "\u003C\u002Fp\u003E\u003Cp class=\"card-text\"\u003E" + (pug_escape(null == (pug_interp = `Instrument: ${sheet.instrumento}`) ? "" : pug_interp)) + "\u003C\u002Fp\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"card-footer d-flex justify-content-between\"\u003E\u003Ca class=\"btn btn-primary btn-remove-sheet\" href=\"#\" data-type=\"details\"\u003E" + (pug_escape(null == (pug_interp = "Details") ? "" : pug_interp)) + "\u003C\u002Fa\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E";
    }
  }
}).call(this);
}.call(this,"sheets" in locals_for_with?locals_for_with.sheets:typeof sheets!=="undefined"?sheets:undefined));;return pug_html;}