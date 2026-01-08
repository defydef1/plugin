(function () {
    'use strict';

    function StartPlugin() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var movie = e.data.movie;
                var container = e.object.container.find('.full-start__buttons');

                if (container.find('.view--my-online').length > 0) return;

                var btn = $(`
                    <div class="full-start__button selector view--my-online">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 12L7 21V3L21 12Z" fill="white"/>
                        </svg>
                        <span>Онлайн</span>
                    </div>
                `);

                btn.on('hover:enter', function () {
                    // Используем стандартный поиск Lampa по всем доступным онлайн-источникам
                    Lampa.Component.add('my_online_search', function(object){
                        var network = new Lampa.Reguest();
                        var scroll  = new Lampa.Scroll({mask:true,over:true});
                        var files   = new Lampa.Explorer(object);
                        
                        this.create = function(){ return files.render(); }

                        this.prepare = function(){
                            // Прямой запрос к балансеру VideoCDN (один из самых мощных)
                            var url = 'https://vidsrc.me/api/search?tmdb=' + movie.id;
                            
                            // Если vidsrc не подходит, можно использовать агрегатор:
                            var proxy_url = 'https://api.vavada.workers.dev/?url=' + encodeURIComponent('https://kinosvit.life/api/v1/video?id=' + (movie.imdb_id || ''));

                            network.silent(proxy_url, function(json){
                                Lampa.Loading.stop();
                                if(json && json.length > 0){
                                    json.forEach(function(item){
                                        var file = Lampa.Template.get('button', {title: item.title || 'Источник'});
                                        file.on('hover:enter', function(){
                                            Lampa.Player.play({
                                                url: item.url,
                                                title: movie.title
                                            });
                                        });
                                        files.append(file);
                                    });
                                } else {
                                    Lampa.Noty.show('Видео не найдено. Попробуйте другой фильм.');
                                }
                            }, function(){
                                Lampa.Loading.stop();
                                Lampa.Noty.show('Ошибка доступа к сети');
                            });
                        }
                    });

                    Lampa.Activity.push({
                        title: 'Онлайн: ' + (movie.title || movie.name),
                        component: 'my_online_search',
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
