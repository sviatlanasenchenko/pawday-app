/* Current illustrations and archived photographic attribution remain distinct. */
(function () {
  'use strict';
  const esc = v => String(v || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const tr = (ru, en, zh) => t(L(ru, en, zh));
  function originalCredits(photos) {
    return Object.entries(photos).map(([name, photo]) => {
      const breed = breeds.find(b => b.evidence?.id === photo.id);
      const label = breed ? t(breed.name) : name;
      return `<li data-search="${esc((label + ' ' + name + ' ' + photo.id + ' ' + photo.credit).toLowerCase())}"><strong>${esc(label)}</strong><span>${esc(photo.credit)}</span><a href="${esc(photo.sourcePage)}" target="_blank" rel="noopener noreferrer">${esc(photo.sourceTitle || name)}</a><a href="${esc(photo.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(photo.license)}</a><small>${tr('Сведения относятся к сохранённой исходной фотографии.','These details apply to the preserved original photograph.','这些信息适用于保留的原始照片。')}</small></li>`;
    }).join('');
  }
  function update() {
    const generated = !!window.pawdayImagePresentation;
    let footer = document.getElementById('pawday-photo-credits');
    if (!footer) {
      footer = document.createElement('footer');
      footer.id = 'pawday-photo-credits';
      footer.className = 'pawday-photo-credits';
      document.getElementById('app').after(footer);
    }
    const key = lang + ':' + (window.pawdayImagePresentation?.version || 'original');
    if (footer.dataset.version !== key) {
      const open = footer.querySelector('details')?.open;
      footer.dataset.version = key;
      const intro = generated
        ? `<p>${tr('Новые изображения — иллюстрации, созданные ИИ для Pawday. На каждом показаны взрослая собака и щенок. Это примеры внешности, а не фотографии конкретных собак.','The new images are AI-generated illustrations for Pawday. Each shows an adult dog and a puppy. They illustrate appearance and are not photographs of real individual dogs.','新图像是为 Pawday 制作的 AI 生成插图，每幅展示成年犬和幼犬。这些图像仅用于说明外观，并非真实个体的照片。')}</p><p>${tr('Окрас и внешность отдельных собак могут отличаться. Для метисов и типов собак изображение не предсказывает, каким вырастет конкретный щенок.','Coat colors and individual appearance vary. For mixed-breed and type profiles, an illustration does not predict how an individual puppy will look as an adult.','毛色和个体外观可能不同。对于混种犬和类型档案，插图不能预测某只幼犬长大后的外观。')}</p>`
        : `<p>${tr('Фотографии отдельных собак иллюстрируют породы и типы. Внешность других собак может отличаться.','Photographs show individual examples of breeds and types. Other dogs may look different.','照片展示犬种和类型的个体示例，其他狗狗的外观可能不同。')}</p>`;
      const archiveHeading = generated
        ? `<summary>${tr('Архив исходных фотографий: авторы и лицензии','Original photograph archive: authors and licenses','原始照片存档：作者和许可')}</summary><p>${tr('Исходные фотографии сохранены. Указанные ниже авторы и лицензии относятся только к ним, а не к новым ИИ-иллюстрациям.','The original photographs are preserved. The authors and licenses below apply only to those photographs, not to the new AI illustrations.','原始照片已保留。以下作者和许可仅适用于原始照片，不适用于新的 AI 插图。')}</p>` : '';
      footer.innerHTML = `<details${open ? ' open' : ''}><summary>${generated ? tr('Об иллюстрациях','About the illustrations','关于插图') : tr('Фотографии и авторы','Photos & credits','照片与署名')}</summary>${intro}${generated ? '<details class="legacy-photo-credits">' + archiveHeading : ''}<label for="photo-credit-search">${tr('Найти породу или автора','Find a breed or photographer','搜索犬种或摄影师')}</label><input id="photo-credit-search" type="search" autocomplete="off"><ul>${originalCredits(window.pawdayLegacyPhotos || window.pawdayPhotos)}</ul><p class="photo-credit-empty" hidden>${tr('Совпадений нет.','No matching credits.','未找到匹配项。')}</p>${generated ? '</details>' : ''}</details>`;
      footer.querySelector('input').oninput = event => {
        const query = event.target.value.trim().toLowerCase();
        let count = 0;
        footer.querySelectorAll('li').forEach(li => { li.hidden = !li.dataset.search.includes(query); if (!li.hidden) count++; });
        footer.querySelector('.photo-credit-empty').hidden = count > 0;
      };
    }
    const homeCredit = document.querySelector('.pawday-photo-credit');
    if (generated) {
      if (homeCredit) {
        const label = document.createElement('span');
        label.className = 'pawday-photo-credit generated-image-caption';
        label.textContent = window.pawdayImagePresentation.caption();
        homeCredit.replaceWith(label);
      }
      const byPath = new Map(Object.values(window.pawdayGeneratedPhotosById).map(photo => [photo.src, photo]));
      const byId = new Map(breeds.map(breed => [breed.evidence.id, breed]));
      document.querySelectorAll('#app img').forEach(img => {
        const photo = byPath.get(img.getAttribute('src'));
        const breed = photo && byId.get(photo.id);
        if (!breed) return;
        img.alt = window.pawdayImagePresentation.alt(t(breed.name));
        img.classList.add('pawday-generated-image');
        img.dataset.profileId = photo.id;
      });
      document.querySelectorAll('.gallery-credits summary').forEach(summary => {
        summary.textContent = tr('Об иллюстрациях','About the illustrations','关于插图');
      });
    } else if (homeCredit) {
      const photo = window.pawdayPhotos['Miniature Poodle'];
      if (photo) {
        homeCredit.textContent = tr('Фото: ','Photo: ','照片：') + photo.credit + ' · ' + photo.license + ' ↗';
        homeCredit.href = photo.sourcePage;
      }
    }
  }
  const style = document.createElement('style');
  style.textContent = `.pawday-photo-credits{max-width:1100px;margin:28px auto;padding:18px 24px;border-top:1px solid #dce4d7;color:#36564b;font:13px/1.65 Arial,sans-serif}.pawday-photo-credits summary{cursor:pointer;font-weight:700}.pawday-photo-credits input{display:block;width:100%;max-width:450px;margin:8px 0 20px;padding:10px 12px;border:1px solid #9aafa1;border-radius:10px;background:#fffdf8;color:#123b32;font:inherit}.pawday-photo-credits ul{list-style:none;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.pawday-photo-credits li{display:flex;flex-direction:column;padding:15px;border:1px solid #dce4d5;border-radius:12px;overflow-wrap:anywhere}.pawday-photo-credits li[hidden]{display:none}.pawday-photo-credits a{color:#285e49;text-decoration:underline}.pawday-photo-credits strong{font-size:15px}.pawday-photo-credits small{margin-top:8px;color:#52685d}.legacy-photo-credits{margin-top:20px}.pawday-generated-image{object-fit:contain;background:#fff}.pawday-photo-credit.generated-image-caption{text-decoration:none}@media(max-width:650px){.pawday-photo-credits ul{grid-template-columns:1fr}.pawday-photo-credits{padding:16px}}`;
  document.head.append(style);
  const previous = render;
  render = function () { const result = previous.apply(this, arguments); update(); return result; };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', update, {once:true}); else update();
})();
