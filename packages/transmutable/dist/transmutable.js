!function(t,n){for(var e in n)t[e]=n[e]}(exports,function(t){function n(o){if(e[o])return e[o].exports;var r=e[o]={i:o,l:!1,exports:{}};return t[o].call(r.exports,r,r.exports,n),r.l=!0,r.exports}var e={};return n.m=t,n.c=e,n.d=function(t,e,o){n.o(t,e)||Object.defineProperty(t,e,{configurable:!1,enumerable:!0,get:o})},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,n){return Object.prototype.hasOwnProperty.call(t,n)},n.p="",n(n.s=5)}([function(t,n,e){"use strict";const{cloneAndApplyMutations:o}=e(3),r=e(6),s=Symbol(),i=t=>{if(t[s])return t;const n=(n,...e)=>{const s=r(t,n,...e);return{reify:()=>o(n,s),mutations:s}},e=(...t)=>n(...t).reify();return e[s]=!0,e.run=n,e};n.transform=((t,n)=>{if("function"!=typeof t)throw new Error("\n        API was changed in 0.5.0 version of Transmutable library.\n        Now transform function takes transforming function as a FIRST argument.\n        Original state as a SECOND one.\n    ");return i(t)(n)}),n.Transform=i,n.Reducer=i},function(t,n,e){"use strict";const{createMutation:o}=e(2);t.exports=function(t,n){const e=(t,r=[])=>{const s=()=>"function"==typeof t?t():t;return new Proxy(s(),{get:(t,i)=>{const u=s()[i];return u&&"object"==typeof u?e(u,r.concat(i)):"function"==typeof u?function(...t){const e=Symbol(Math.random());return n.set(o(r,e,i,t)),e}:u},set:(t,e,s)=>{const i=[];for(let t=0;t<r.length+1;t++)i.push(r[t]||e);return n.set(o(i,s)),!0}})};return e(t)}},function(t,n,e){"use strict";t.exports={getMutationPath:function(t){return t.path},getMutationValue:function(t){return t.value},createMutation:function(t,n,e,o){return e?{type:e,path:t,value:n,args:o}:{type:"set",path:t,value:n}},getMutationType:function(t){return t.type},getMutationArgs:function(t){return t.args}}},function(t,n,e){"use strict";function o(t,n){return u(t,f(n))[h(n)](...l(n))}function r(t,n,e){for(let o=e-1;o>=0;o--)if(m(t[o])===n)return t[o]}function s(t,n){for(let e=0;e<n.length;e++){const s=n[e];if(!s)break;const i=h(s),u=m(s),a=f(s);switch(i){case"set":if("symbol"==typeof u){const s=o(t,r(n,u,e));c(t,a,s);break}c(t,a,u);break;default:o(t,s)}}}function i(t,n){const e=(t,o=[])=>{if(!function(t,n,e){for(let e=0;e<t.length;e++){const o=f(t[e]),r=Math.min(o.length,n.length);let s=!0;for(let t=0;t<r;t++)if(o[t]!=n[t]){s=!1;break}if(s)return!0}return!1}(n,o))return t;let r;r=Array.isArray(t)?t.slice():{};for(let n in t)if(t[n]&&"object"==typeof t[n]){const s=new Array(o.length+1);for(let t=0;t<o.length;t++)s[t]=o[t];s[o.length]=n,r[n]=e(t[n],s)}else r[n]=t[n];return r};return e(t)}const{get:u,set:c}=e(4),a=Symbol(),{getMutationPath:f,getMutationValue:m,getMutationType:h,getMutationArgs:l}=e(2);n.cloneAndApplyMutations=function(t,n,e={}){const o=function(t,n){const e=[],o={};for(let r=n.length-1;r>=0;r--){const s=f(n[r]),i=m(n[r]),l=s.concat(a);("set"!=h(n[r])||u(t,s)!==i&&!0!==u(o,l))&&(e.unshift(n[r]),"set"===h(n[r])&&c(o,l,!0))}return e}(t,n);e.onComputeChanges&&e.onComputeChanges(o);const r=i(t,o);return s(r,o),r},n.applyChanges=s},function(t,n,e){"use strict";n.get=function(t,n){if(!n||!n.length)return t;let e,o=t;for(e=0;o&&e<n.length-1;o=o[n[e++]]);return o?o[n[e]]:void 0},n.set=function(t,n,e){let o,r=t;for(o=0;o<n.length-1;o++)r=r[n[o]]||(r[n[o]]={});r[n[o]]=e}},function(t,n,e){"use strict";function o(t,n={}){this.state$=c(),this.target=t,this.commits=[],this.hooks=n,this.lastCommit=new u,this.nextCommit=new u,this.stage=r(()=>this.target,{set:t=>{this.nextCommit.mutations.push(t)}})}const r=e(1),{cloneAndApplyMutations:s}=e(3),{Transform:i}=e(0),u=e(7),{Stream:c}=e(8),a={Transmutable:{commit(t){if(!(t instanceof u))throw new Error("Wrong argument passed to method Transmutable::commit()")}}};o.prototype.run=function(t){const{mutations:n}=i(t).run(this.target);return this.commit(new u(n))},o.prototype.commit=function(t=this.nextCommit){a.Transmutable.commit(t);const n=this.target;return this.target=s(this.target,t.mutations),this.state$.publish(this.target,n),this.commits.push(t),this.lastCommit=t,this.nextCommit=new u,this.hooks.onCommit&&this.hooks.onCommit(this,t),this.target},o.prototype.reify=function(t){return s(this.target,this.nextCommit.mutations)},o.prototype.observe=function(...t){const n="function"==typeof t[0]?t[0]:t[1],e="function"==typeof t[0]?null:t[0];return this.state$.subscribe(n,e)},o.prototype.fork=function(){const t=new o(this.target);return t.commits=this.commits.slice(),t},o.prototype.merge=function(t){for(let n=0;n<t.commits.length;n++)this.nextCommit.mutations=t.commits[n].mutations,this.commits.includes(t.commits[n])||this.commit()},n.Transmutable=o,n.transform=e(0).transform,n.transform=e(0).transform,n.Reducer=e(0).Reducer},function(t,n,e){"use strict";const o=e(1);t.exports=((t,n,...e)=>{const r=[];return t(o(()=>n,{set:t=>{r.push(t)}}),...e),r})},function(t,n,e){"use strict";t.exports=function(t=[],n=[]){this.mutations=t,this.events=n,this.put=(t=>{this.events.push(t)})}},function(t,n,e){"use strict";function o(){const t=[];return{publish(...n){t.forEach(t=>t(...n))},subscribe(n,e){t.push((t,o)=>{r(o,e)!==r(t,e)&&n(r(t,e))})},map(n){const e=o();return t.push(t=>{e.publish(n(t))}),e}}}const{get:r}=e(4);n.Stream=o}]));