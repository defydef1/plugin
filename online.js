(function () {
    'use strict';

    // Публічні API токени (можуть змінюватися, але зараз робочі)
    var apis = {
        videocdn: '3i40G5TSECmLF77oAqnEgbx61ZWaOYaE', // Публічний токен VideoCDN
        kodik: '4cf1231e7c53d4554256722883444458'    // Публічний токен Kodik
    };

    function StartPlugin() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var movie = e.data.movie;
                var container = e.object.container.find('.full-start__buttons');

                if (container.find('.view--github-online').length > 0) return;

                var btn = $(`
                    <div class="full-start__button selector view--github-online">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path d="M10 9v6l5-3-5-3z"/>
                            <circle cx="12" cy="12" r="10" />
                        </svg>
                        <span>GitHub Stream</span>
                    </div>
                `);

                btn.on('hover:enter', function () {
                    Lampa.Component.add('github_online_search', function(object){
                        var network = new Lampa.Reguest();
                        var scroll  = new Lampa.Scroll({mask:true,over:true});
                        var files   = new Lampa.Explorer(object);
                        var results = [];

                        this.create = function(){ return files.render(); }

                        this.prepare = function(){
                            Lampa.Loading.start();
                            
                            // 1. Пошук по VideoCDN
                            var url_vcdn = 'https://videocdn.tv/api/short?api_token=' + apis.videocdn + '&title=' + encodeURIComponent(movie.title);
                            
                            // 2. Пошук по Kodik
                            var url_kodik = 'https://kodikapi.com/search?token=' + apis.kodik + '&title=' + encodeURIComponent(movie.title) + '&types=anime,serial,kino';

                            // Функція для додавання знайденого
                            var appendResult = function(item, sourceName){
                                var btn = Lampa.Template.get('button', {
                                    title: (item.title || movie.title) + ' (' + sourceName + ')',
                                    description: item.quality || 'Дивитися'
                                });
                                btn.on('hover:enter', function(){
                                    Lampa.Player.play({
                                        url: item.iframe_src || item.iframe || item.link,
                                        title: movie.title,
                                        movie: movie,
                                        is_iframe: true // Важливо для плеєра
                                    });
                                });
                                files.append(btn);
                            };

                            // Виконуємо запити паралельно
                            var promises = [];

                            // Запит VideoCDN
                            promises.push(new Promise(function(resolve){
                                network.silent(url_vcdn, function(json){
                                    if(json && json.data && json.data.length){
                                        json.data.forEach(function(i){
                                            appendResult({
                                                title: i.title,
                                                iframe: i.iframe_src,
                                                quality: i.resolution + 'p'
                                            }, 'VideoCDN');
                                        });
                                    }
                                    resolve();
                                }, resolve);
                            }));

                            // Запит Kodik
                            promises.push(new Promise(function(resolve){
                                network.silent(url_kodik, function(json){
                                    if(json && json.results && json.results.length){
                                        json.results.forEach(function(i){
                                            appendResult({
                                                title: i.title,
                                                iframe: i.link,
                                                quality: i.quality || 'HD'
                                            }, 'Kodik');
                                        });
                                    }
                                    resolve();
                                }, resolve);
                            }));

                            Promise.all(promises).then(function(){
                                Lampa.Loading.stop();
                                Lampa.Controller.enable('content');
                                if(files.render().find('.selector').length === 0){
                                    Lampa.Noty.show('Нічого не знайдено в безкоштовних джерелах');
                                }
                            });
                        }
                    });

                    Lampa.Activity.push({
                        title: 'Пошук: ' + movie.title,
                        component: 'github_online_search',
                        movie: movie
                    });
                });

                container.append(btn);
            }
        });
    }

    if (window.Lampa) StartPlugin();
    else {
        var timer = setInterval(function() {
            if (window.Lampa) { clearInterval(timer); StartPlugin(); }
        }, 100);
    }
})();
