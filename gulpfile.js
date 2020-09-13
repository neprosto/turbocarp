	// Определяем переменную "preprocessor"
	let preprocessor = 'less';

	// Определяем константы Gulp
	const {
		src,
		dest,
		parallel,
		series,
		watch
	} = require('gulp');

	// Подключаем Browsersync
	const browserSync = require('browser-sync').create();
	const concat = require('gulp-concat');
	const uglify = require('gulp-uglify-es').default;
	const less = require('gulp-less');
	const autoprefixer = require('gulp-autoprefixer');
	const cleancss = require('gulp-clean-css');
	const imagemin = require('gulp-imagemin');
	const newer = require('gulp-newer');
	const del = require('del');

	// Определяем логику работы Browsersync
	function browsersync() {
		browserSync.init({ // Инициализация Browsersync
			server: {
				baseDir: 'app/'
			}, // Указываем папку сервера
			notify: false, // Отключаем уведомления
			online: true // Режим работы: true или false
		})
	}

	function scripts() {
		return src([ // Берём файлы из источников
				'node_modules/jquery/dist/jquery.min.js', // Пример подключения библиотеки
				'app/js/app.js', // Пользовательские скрипты, использующие библиотеку, должны быть подключены в конце
			])
			.pipe(concat('app.min.js')) // Конкатенируем в один файл
			.pipe(uglify()) // Сжимаем JavaScript
			.pipe(dest('app/js/')) // Выгружаем готовый файл в папку назначения
			.pipe(browserSync.stream()) // Триггерим Browsersync для обновления страницы
	}

	function styles() {
		return src('app/' + preprocessor + '/main.' + preprocessor + '') // Выбираем источник: "app/sass/main.sass" или "app/less/main.less"
			.pipe(eval(preprocessor)()) // Преобразуем значение переменной "preprocessor" в функцию
			.pipe(concat('app.min.css')) // Конкатенируем в файл app.min.js
			.pipe(autoprefixer({
				overrideBrowserslist: ['last 10 versions'],
				grid: true
			})) // Создадим префиксы с помощью Autoprefixer
			.pipe(cleancss({
				level: {
					1: {
						specialComments: 0
					}
				} /* , format: 'beautify' */
			})) // Минифицируем стили
			.pipe(dest('app/css/')) // Выгрузим результат в папку "app/css/"
			.pipe(browserSync.stream()) // Сделаем инъекцию в браузер
	}

	function images() {
		return src('app/images/dirty/**/*') // Берём все изображения из папки источника
			.pipe(newer('app/images/src/')) // Проверяем, было ли изменено (сжато) изображение ранее
			.pipe(imagemin()) // Сжимаем и оптимизируем изображеня
			.pipe(dest('app/images/src/')) // Выгружаем оптимизированные изображения в папку назначения
	}

	function cleanimg() {
		return del('app/images/src/**/*', {
			force: true
		}) // Удаляем всё содержимое папки "app/images/src/"
	}

	function buildcopy() {
		return src([ // Выбираем нужные файлы
				'app/css/**/*.min.css',
				'app/js/**/*.min.js',
				'app/images/src/**/*',
				'app/**/*.html',
			], {
				base: 'app'
			}) // Параметр "base" сохраняет структуру проекта при копировании
			.pipe(dest('dist')) // Выгружаем в папку с финальной сборкой
	}

	function cleandist() {
		return del('dist/**/*', {
			force: true
		}) // Удаляем всё содержимое папки "dist/"
	}

	function startwatch() {

		// Выбираем все файлы JS в проекте, а затем исключим с суффиксом .min.js
		watch(['app/**/*.js', '!app/**/*.min.js'], scripts);

		// Мониторим файлы препроцессора на изменения
		watch('app/**/' + preprocessor + '/**/*', styles);

		// Мониторим файлы HTML на изменения
		watch('app/**/*.html').on('change', browserSync.reload);

		// Мониторим папку-источник изображений и выполняем images(), если есть изменения
		watch('app/images/dirty/**/*', images);

	}

	// Экспортируем функции
	exports.scripts = scripts;
	exports.styles = styles;
	exports.images = images;
	exports.cleanimg = cleanimg;
	exports.cleandist = cleandist;

	// Создаём новый таск "build", который последовательно выполняет нужные операции
	exports.build = series(cleandist, styles, scripts, images, buildcopy);

	// Экспортируем дефолтный таск с нужным набором функций
	exports.default = parallel(styles, scripts, browsersync, images, startwatch);