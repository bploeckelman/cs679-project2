// Tween.js - http://github.com/sole/tween.js
var TWEEN=TWEEN||function(){var a=[];return{REVISION:"6",getAll:function(){return a},removeAll:function(){a=[]},add:function(c){a.push(c)},remove:function(c){c=a.indexOf(c);-1!==c&&a.splice(c,1)},update:function(c){for(var b=0,e=a.length,c=void 0!==c?c:Date.now();b<e;)a[b].update(c)?b++:(a.splice(b,1),e--)}}}();
TWEEN.Tween=function(a){var c={},b={},e=1E3,d=0,f=null,h=TWEEN.Easing.Linear.None,n=TWEEN.Interpolation.Linear,j=null,k=null,l=null;this.to=function(a,c){null!==c&&(e=c);b=a;return this};this.start=function(e){TWEEN.add(this);f=void 0!==e?e:Date.now();f+=d;for(var g in b)if(null!==a[g]){if(b[g]instanceof Array){if(0===b[g].length)continue;b[g]=[a[g]].concat(b[g])}c[g]=a[g]}return this};this.stop=function(){TWEEN.remove(this);return this};this.delay=function(a){d=a;return this};this.easing=function(a){h=
a;return this};this.interpolation=function(a){n=a;return this};this.chain=function(a){j=a;return this};this.onUpdate=function(a){k=a;return this};this.onComplete=function(a){l=a;return this};this.update=function(d){if(d<f)return!0;var d=(d-f)/e,d=1<d?1:d,g=h(d),i;for(i in c){var o=c[i],m=b[i];a[i]=m instanceof Array?n(m,g):o+(m-o)*g}null!==k&&k.call(a,g);return 1==d?(null!==l&&l.call(a),null!==j&&j.start(),!1):!0}};
TWEEN.Easing={Linear:{None:function(a){return a}},Quadratic:{In:function(a){return a*a},Out:function(a){return a*(2-a)},InOut:function(a){return 1>(a*=2)?0.5*a*a:-0.5*(--a*(a-2)-1)}},Cubic:{In:function(a){return a*a*a},Out:function(a){return--a*a*a+1},InOut:function(a){return 1>(a*=2)?0.5*a*a*a:0.5*((a-=2)*a*a+2)}},Quartic:{In:function(a){return a*a*a*a},Out:function(a){return 1- --a*a*a*a},InOut:function(a){return 1>(a*=2)?0.5*a*a*a*a:-0.5*((a-=2)*a*a*a-2)}},Quintic:{In:function(a){return a*a*a*
a*a},Out:function(a){return--a*a*a*a*a+1},InOut:function(a){return 1>(a*=2)?0.5*a*a*a*a*a:0.5*((a-=2)*a*a*a*a+2)}},Sinusoidal:{In:function(a){return 1-Math.cos(a*Math.PI/2)},Out:function(a){return Math.sin(a*Math.PI/2)},InOut:function(a){return 0.5*(1-Math.cos(Math.PI*a))}},Exponential:{In:function(a){return 0===a?0:Math.pow(1024,a-1)},Out:function(a){return 1===a?1:1-Math.pow(2,-10*a)},InOut:function(a){return 0===a?0:1===a?1:1>(a*=2)?0.5*Math.pow(1024,a-1):0.5*(-Math.pow(2,-10*(a-1))+2)}},Circular:{In:function(a){return 1-
Math.sqrt(1-a*a)},Out:function(a){return Math.sqrt(1- --a*a)},InOut:function(a){return 1>(a*=2)?-0.5*(Math.sqrt(1-a*a)-1):0.5*(Math.sqrt(1-(a-=2)*a)+1)}},Elastic:{In:function(a){var c,b=0.1;if(0===a)return 0;if(1===a)return 1;!b||1>b?(b=1,c=0.1):c=0.4*Math.asin(1/b)/(2*Math.PI);return-(b*Math.pow(2,10*(a-=1))*Math.sin((a-c)*2*Math.PI/0.4))},Out:function(a){var c,b=0.1;if(0===a)return 0;if(1===a)return 1;!b||1>b?(b=1,c=0.1):c=0.4*Math.asin(1/b)/(2*Math.PI);return b*Math.pow(2,-10*a)*Math.sin((a-c)*
2*Math.PI/0.4)+1},InOut:function(a){var c,b=0.1;if(0===a)return 0;if(1===a)return 1;!b||1>b?(b=1,c=0.1):c=0.4*Math.asin(1/b)/(2*Math.PI);return 1>(a*=2)?-0.5*b*Math.pow(2,10*(a-=1))*Math.sin((a-c)*2*Math.PI/0.4):0.5*b*Math.pow(2,-10*(a-=1))*Math.sin((a-c)*2*Math.PI/0.4)+1}},Back:{In:function(a){return a*a*(2.70158*a-1.70158)},Out:function(a){return--a*a*(2.70158*a+1.70158)+1},InOut:function(a){return 1>(a*=2)?0.5*a*a*(3.5949095*a-2.5949095):0.5*((a-=2)*a*(3.5949095*a+2.5949095)+2)}},Bounce:{In:function(a){return 1-
TWEEN.Easing.Bounce.Out(1-a)},Out:function(a){return a<1/2.75?7.5625*a*a:a<2/2.75?7.5625*(a-=1.5/2.75)*a+0.75:a<2.5/2.75?7.5625*(a-=2.25/2.75)*a+0.9375:7.5625*(a-=2.625/2.75)*a+0.984375},InOut:function(a){return 0.5>a?0.5*TWEEN.Easing.Bounce.In(2*a):0.5*TWEEN.Easing.Bounce.Out(2*a-1)+0.5}}};
TWEEN.Interpolation={Linear:function(a,c){var b=a.length-1,e=b*c,d=Math.floor(e),f=TWEEN.Interpolation.Utils.Linear;return 0>c?f(a[0],a[1],e):1<c?f(a[b],a[b-1],b-e):f(a[d],a[d+1>b?b:d+1],e-d)},Bezier:function(a,c){var b=0,e=a.length-1,d=Math.pow,f=TWEEN.Interpolation.Utils.Bernstein,h;for(h=0;h<=e;h++)b+=d(1-c,e-h)*d(c,h)*a[h]*f(e,h);return b},CatmullRom:function(a,c){var b=a.length-1,e=b*c,d=Math.floor(e),f=TWEEN.Interpolation.Utils.CatmullRom;return a[0]===a[b]?(0>c&&(d=Math.floor(e=b*(1+c))),f(a[(d-
1+b)%b],a[d],a[(d+1)%b],a[(d+2)%b],e-d)):0>c?a[0]-(f(a[0],a[0],a[1],a[1],-e)-a[0]):1<c?a[b]-(f(a[b],a[b],a[b-1],a[b-1],e-b)-a[b]):f(a[d?d-1:0],a[d],a[b<d+1?b:d+1],a[b<d+2?b:d+2],e-d)},Utils:{Linear:function(a,c,b){return(c-a)*b+a},Bernstein:function(a,c){var b=TWEEN.Interpolation.Utils.Factorial;return b(a)/b(c)/b(a-c)},Factorial:function(){var a=[1];return function(c){var b=1,e;if(a[c])return a[c];for(e=c;1<e;e--)b*=e;return a[c]=b}}(),CatmullRom:function(a,c,b,e,d){var a=0.5*(b-a),e=0.5*(e-c),f=
d*d;return(2*c-2*b+a+e)*d*f+(-3*c+3*b-2*a-e)*f+a*d+c}}};
