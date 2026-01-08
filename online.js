(function () {
    'use strict';

    function StartPlugin() {
        // Добавляем обработчик для карточки фильма
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var movie = e.data.movie;
                var container = e.object.container.find('.full-start__buttons');

                // Если кнопка уже есть — не добавляем
                if (container.find('.view--my-online').length > 0) return;

                // Создаем кнопку "Смотреть"
                var btn = $(`
                    <div class="full-start__button selector view--my-online">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 12L7 21V3L21 12Z" fill="white"/>
                        </svg>
                        <span>Онлайн</span>
                    </div>
                `);

                btn.on('hover:enter', function () {
                    // Используем универсальный компонент онлайн-просмотра Lampa
                    // Он сам подхватит доступные API, если они есть в системе,
                    // либо мы отправим запрос на публичный агрегатор
                    Lampa.Component.add('my_online_component', function(object){
                        var network = new Lampa.Reguest();
                        var scroll  = new Lampa.Scroll({mask:true,over:true});
                        var files   = new Lampa.Explorer(object);
                        
                        this.create = function(){
                            return files.render();
                        }

                        this.prepare = function(){
                            // Ссылка на публичный бесплатный API балансеров
                            var url = 'https://online.api.kinosvit.life/api/v1/video?id=' + (movie.imdb_id || '') + '&tmdb_id=' + (movie.id || '');
                            
                            network.silent(url, function(json){
                                if(json && json.length > 0){
                                    // Отрисовываем список найденных файлов/озвучек
                                    json.forEach(function(item){
                                        var file = Lampa.Template.get('button', {title: item.title || 'Видео'});
                                        file.on('hover:enter', function(){
                                            // Запуск плеера
                                            Lampa.Player.play({
                                                url: item.url,
                                                title: movie.title
                                            });
                                        });
                                        files.append(file);
                                    });
                                    Lampa.Loading.stop();
                                } else {
                                    Lampa.Noty.show('Ничего не найдено');
                                    Lampa.Loading.stop();
                                }
                            }, function(){
                                Lampa.Noty.show('Ошибка сервера');
                                Lampa.Loading.stop();
                            });
                        }
                    });

                    // Запускаем поиск
                    Lampa.Activity.push({
                        title: 'Поиск видео',
                        component: 'my_online_component',
                        movie: movie
                    });
                });

                container.append(btn);
            }
        });
    }

    // Регистрация плагина
    if (window.Lampa) StartPlugin();
    else {
        var timer = setInterval(function() {
            if (window.Lampa) {
                clearInterval(timer);
                StartPlugin();
            }
        }, 100);
    }
})();
