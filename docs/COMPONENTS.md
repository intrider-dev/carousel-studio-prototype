# Interface components / Компоненты интерфейса

This is a prototype. The main application uses the free, MIT-licensed [Untitled UI React](https://github.com/untitleduico/react) source at commit `4702dc0ea8d140c3491a85670c7b4fab47b722da`. The full upstream notice is retained in [`src/components/LICENSE`](../src/components/LICENSE).

Это прототип. Основное приложение использует свободные компоненты [Untitled UI React](https://github.com/untitleduico/react) по лицензии MIT, версия исходников `4702dc0ea8d140c3491a85670c7b4fab47b722da`. Полный текст лицензии сохранён в [`src/components/LICENSE`](../src/components/LICENSE).

| Building block / Элемент | Source / Источник |
| --- | --- |
| Buttons, links / Кнопки, ссылки | `src/components/base/buttons/` |
| Inputs and uploads / Поля и загрузка файлов | `src/components/base/input/` |
| Text areas / Многострочные поля | `src/components/base/textarea/` |
| Native selects / Списки | `src/components/base/select/` |
| Checkboxes, badges, tooltips / Чекбоксы, метки, подсказки | `src/components/base/` |
| Tabs, modals, loading / Вкладки, окна, ожидание | `src/components/application/` |
| Theme / Тема | `src/styles/theme.css`, `src/styles/globals.css` |
| Icons and type / Иконки и шрифт | `@untitledui/icons`, `@fontsource-variable/inter` |

The kit's colors, spacing inside controls, typography, shadows and radii remain unchanged. App compositions in `navigation/`, `panel/`, `confirmation/` and `fields/` assemble these parts. `workspace.css` controls responsive layout and motion preferences. Canvas typography and slide artwork remain document properties, independent of the interface theme. The optional embedded chat is served by a separate application and retains its own interface.

Цвета, внутренние отступы элементов, типографика, тени и скругления набора сохранены. Композиции в `navigation/`, `panel/`, `confirmation/` и `fields/` собирают эти части. `workspace.css` задаёт адаптивную сетку и настройки движения. Шрифты и графика слайдов остаются свойствами документа и не зависят от темы интерфейса. Дополнительный встроенный чат обслуживается отдельным приложением и сохраняет своё оформление.

## Integration changes / Особенности подключения

- Native select preserves an explicit input ID, uses a separate label ID, references hints only when present, and respects disabled options. Minimum width and trailing icon space keep long options inside narrow panels. This keeps external labels and keyboard tests correct.
- The label renders a required marker only when explicitly required. Hidden markers no longer alter accessible names of external editor labels.
- File input accepts native attributes and change events so the app can validate images, fonts and project files and clear the upload input for repeat selection. Its read-only filename field has a separate accessible name; visible upload text is localized in the app.
- Button and badge lint directives retain the upstream public style exports. The unused prose typography plugin is omitted.
- React Aria disclosure composes the kit button; each tab set has a named panel and preserves mounted content during workspace changes.
- Color fields compose two kit inputs: a native picker and a read-only HEX value. The picker remains the externally labelled control.

- Список сохраняет заданный ID поля, использует отдельный ID подписи, ссылается на подсказку только при её наличии и учитывает недоступные варианты. Ограничение ширины и место для иконки удерживают длинные варианты внутри узкой панели. Внешние подписи и управление с клавиатуры сохраняют связь с полем.
- Маркер обязательного поля появляется только при явном указании. Скрытая звёздочка не меняет доступное имя подписи редактора.
- Загрузка файлов принимает нативные атрибуты и события: приложение проверяет фотографии, шрифты и JSON, очищает поле для повторного выбора файла. Поле имени файла имеет отдельную доступную подпись, текст загрузки переведён в приложении.
- Исключения проверки экспорта сохраняют публичные константы исходного набора. Неиспользуемый плагин оформления статей не подключён.
- Раскрывающаяся секция React Aria использует кнопку набора. Вкладки связаны с подписанной панелью и сохраняют содержимое при переключении.
- Поле цвета собирается из двух полей набора: нативной палитры и значения HEX для чтения. Внешняя подпись связана с палитрой.

## Composition rule / Правило сборки

Import controls directly from their kit folders. Use the provided size, color, icon and state props. Add only layout classes to app compositions. Keep document state, generation contracts, image validation and drawing outside the component kit.

Импортируйте элементы из папок набора. Используйте готовые свойства размера, цвета, иконок и состояния. В композициях приложения добавляйте только классы раскладки. Хранение документов, контракты генерации, проверка изображений и отрисовка остаются вне набора компонентов.
