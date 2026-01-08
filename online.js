(function () {
    'use strict';

    // Конфигурация: используем открытый API (например, Kinosvit)
    // Эти API не требуют сложной настройки сервера
    var api_url = 'https://online.api.kinosvit.life/api/v1/video';

    function StartPlugin() {
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var movie = e.data.movie;
                var container = e.object.container.find('.full-start__buttons');

                // Проверяем, не добавлена ли уже кнопка
                if (container.find('.view--my-online').length > 0) return;

                // Создаем кнопку
                var btn = $(`
                    <div class="full-start__button selector view--my-online">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                        <span>Смотреть</span>
                    </div>
                `);

                btn.on('hover:enter', function () {
                    // Формируем запрос к API
                    var url = api_url + '?id=' + (movie.imdb_id || '') + 
                              '&tmdb_id=' + (movie.id || '') + 
                              '&title=' + encodeURIComponent(movie.title || movie.name);

                    // Открываем стандартное окно поиска Lampa
                    Lampa.Loading.start();
                    
                    $.ajax({
                        url: url,
                        method: 'GET',
                        dataType: 'json',
                        success: function (json) {
                            Lampa.Loading.stop();
                            if (json && json.length > 0) {
                                // Вызываем компонент просмотра онлайн
                                Lampa.Component.add('online_view', {}); // Заглушка если нужно
                                Lampa.Activity.push({
                                    url: url,
                                    title: 'Онлайн',
                                    component: 'online_view', // Используем встроенный или кастомный плеер
                                    search: movie.title,
                                    movie: movie,
                                    page: 1
                                });
                            } else {
                                Lampa.Noty.show('Видео не найдено');
                            }
                        },
                        error: function () {
                            Lampa.Loading.stop();
                            Lampa.Noty.show('Ошибка поиска источников');
                        }
                    });
                });

                container.append(btn);
            }
        });
    }

    // Запуск плагина после готовности Lampa
    if (window.Lampa) {
        StartPlugin();
    } else {
        var timer = setInterval(function() {
            if (window.Lampa) {
                clearInterval(timer);
                StartPlugin();
            }
        }, 100);
    }
})();
