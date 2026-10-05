// oxlint-disable-next-line no-unused-expressions -- Evaluated by the browser CLI.
async (page) => {
 await page.setViewportSize({width:1600,height:1100})
 await page.getByLabel('Соотношение сторон',{exact:true}).selectOption('1:1')
 await page.getByLabel('Тема *',{exact:true}).fill('Смысл жизни: найти своё направление')
 await page.getByLabel('Стиль',{exact:true}).fill('Современные выразительные баннеры: чернильный фон, фиолетовый и голубой свет, один крупный объёмный предмет. Единая типографика Manrope. Без людей, белых рамок, устройств, надписей внутри изображений. Не используй психологические обещания.')
 await page.getByRole('button',{name:/^Смелый/}).click()
 await page.getByRole('button',{name:'Создать проект',exact:true}).click()
 await page.getByRole('link',{name:'Диалог',exact:true}).click()
 await page.getByText('Настройки',{exact:false}).first().click()
 await page.waitForFunction(()=>document.querySelector('#model')?.options.length>2)
 await page.locator('#model').selectOption('openai/gpt-4.1')
 await page.getByLabel('Изображения',{exact:true}).selectOption('object')
 await page.getByLabel('Запрос',{exact:true}).fill('Создай 6 слайдов на тему поиска смысла жизни. Структура: 1) Где ваш ориентир? poster, крупный стеклянный компас; 2) Заметьте, что вас заряжает, split, светящаяся сфера внутри прозрачного стеклянного куба; 3) Ваши ценности: точка опоры, editorial, балансирующие камни с фиолетовыми отражениями; 4) Попробуйте маленький шаг, quote, объёмная лестница из светящихся ступеней; 5) Смысл меняется вместе с вами, cards, скульптура из двух переплетающихся лент; 6) Начните с одного вопроса, finale, большой глянцевый знак вопроса с голубыми и пурпурными отражениями. На каждом слайде основной текст до 80 символов. Заголовок до 45. Короткие конкретные вопросы и действия без мотивационных лозунгов. Одна палитра, один шрифт. Все изображения на чернильном фоне, один крупный объект, студийный свет. Не рисуй текст внутри изображений. Не давай медицинские рекомендации.')
 await page.getByRole('button',{name:'Отправить запрос',exact:true}).click()
 return {started:true,slides:6}
}
