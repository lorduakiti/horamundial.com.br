// Google Tag (gtag.js)
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-E3NREMBYG1');
	

// Google Tag Manager 
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','G-E3NREMBYG1');
		

// Navegg Tag 
(function(n,v,g){o='Navegg';if(!n[o]){
a=v.createElement('script');a.src=g;b=document.getElementsByTagName('script')[0];
b.parentNode.insertBefore(a,b);n[o]=n[o]||function(parms){
n[o].q=n[o].q||[];n[o].q.push([this, parms])};} })
(window, document, 'https://tag.navdmp.com/universal.min.js');
window.naveggReady = window.naveggReady||[];
window.nvg65136 = new Navegg({ acc: 65136 });


// Data Dog Traker (horariomundial.lorduakiti.com.br)
(function(h,o,u,n,d) {
h = h[d] = h[d] || { q: [], onReady: function (c) { h.q.push(c) } }
d = o.createElement(u); d.async = 1; d.src = n; d.crossOrigin=''
n = o.getElementsByTagName(u)[0]; n.parentNode.insertBefore(d, n)
})(window, document, 'script', 'https://www.datadoghq-browser-agent.com/us5/v6/datadog-rum.js', 'DD_RUM')

window.DD_RUM.onReady(function () {
window.DD_RUM.init({
  applicationId: 'ec229b15-b245-4181-99e5-adf020c57f63',
  clientToken: 'pub0f4e81422a1f44a3c29a16a4bbce04a7',
  site: 'us5.datadoghq.com',
  service: 'horariomundial',
  env: 'prod',              // e.g. 'prod', 'staging-1', 'dev'
  version: '9.0.0',      // e.g. '1.0.0'
  sessionSampleRate: 100,          // capture 100% of sessions
  sessionReplaySampleRate: 20,     // capture 20% of sessions with replay
  trackResources: true,            // Enable Resource tracking
  trackUserInteractions: true,     // Enable Action tracking
  trackLongTasks: true,            // Enable Long Tasks tracking
});
});


// Countly Traker (horariomundial.lorduakiti.com.br)
//some default pre init
var Countly = Countly || {};
Countly.q = Countly.q || [];

//provide countly initialization parameters
Countly.app_key = 'c3668fd2f021f21d60661d06bd865de892224dca';
Countly.url = 'https://horariomundial-d6a0f78ca9b4d.flex.countly.com';
Countly.debug = true;
Countly.use_session_cookie = true;
Countly.ignore_bots = false;
Countly.ignore_prefetch = false;

Countly.q.push(['track_sessions']);
Countly.q.push(['track_pageview']);
Countly.q.push(['track_clicks']);
Countly.q.push(['track_scrolls']);
Countly.q.push(['track_errors']);
Countly.q.push(['track_links']);
Countly.q.push(['track_forms']);
Countly.q.push(['collect_from_forms']);

//load countly script asynchronously
(function() {
   var cly = document.createElement('script'); cly.type = 'text/javascript';
   cly.async = true;
   // url of the script is here
   cly.src = 'https://cdn.jsdelivr.net/npm/countly-sdk-web@latest/lib/countly.min.js';
   cly.onload = function(){Countly.init()};
   var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(cly, s);
})();



// Matomo Tag
// var _paq = window._paq || [];
// /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
// _paq.push(['trackPageView']);
// _paq.push(['enableLinkTracking']);
// (function() {
// var u="https://lorduakiti.matomo.cloud/";
// _paq.push(['setTrackerUrl', u+'matomo.php']);
// _paq.push(['setSiteId', '1']);
// var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
// g.type='text/javascript'; g.async=true; g.defer=true; g.src='//cdn.matomo.cloud/lorduakiti.matomo.cloud/matomo.js'; s.parentNode.insertBefore(g,s);
// })();


// Lomadee
// var lmdimgpixel=document.createElement('img');
// lmdimgpixel.src='//secure.lomadee.com/pub.png?pid=23024678';
// lmdimgpixel.id='lmd-verification-pixel-23024678';
// lmdimgpixel.style='display:none';

// var elmt = document.getElementsByTagName('body')[0];
// elmt.appendChild(lmdimgpixel);
