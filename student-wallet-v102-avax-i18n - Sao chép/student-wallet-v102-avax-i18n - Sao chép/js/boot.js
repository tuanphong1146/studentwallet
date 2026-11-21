addEventListener('hashchange',render);
syncLiveFxRates();
boot().then(()=>{xl(document.body);mark()});
if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js').catch(()=>{});}
