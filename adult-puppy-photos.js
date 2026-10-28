/* Presentation only: exact stable IDs; original photos and matching data stay intact. */
(function () {
  'use strict';
  const ids = ["poodle-miniature", "labrador-retriever", "greyhound", "bichon-frise", "siberian-husky", "cavalier-pdsa", "golden-retriever", "german-shepherd", "australian-shepherd", "mas-akc", "border-collie", "shetland-sheepdog", "collie-rough", "welsh-corgi-pembroke", "welsh-corgi-cardigan", "beagle", "basset-hound", "dachshund-smooth-haired", "whippet", "italian-greyhound", "papillon", "chihuahua-smooth-coat", "pomeranian", "maltese", "havanese", "coton-de-tulear", "yorkshire-terrier", "shih-tzu", "lhasa-apso", "pekingese", "pug", "french-bulldog", "boston-terrier", "english-cocker-spaniel", "english-springer-spaniel", "miniature-schnauzer", "west-highland-white-terrier", "jack-russell-terrier", "boxer", "dalmatian", "hungarian-vizsla", "german-shorthaired-pointer", "bernese-mountain-dog", "newfoundland", "great-dane", "samoyed", "shiba-inu", "bolognese", "lowchen-little-lion", "poodle-toy", "tibetan-spaniel", "norfolk-terrier", "norwich-terrier", "border-terrier", "cairn-terrier", "american-cocker-spaniel", "tibetan-terrier", "bedlington-terrier", "keeshond", "lagotto-romagnolo", "brittany", "welsh-springer-spaniel", "japanese-chin", "chinese-crested", "japanese-spitz", "manchester-terrier", "german-spitz-mittel", "pomsky", "labradoodle", "goldendoodle", "bernedoodle", "cavapoo", "cockapoo", "maltipoo", "aussiedoodle", "alaskan-malamute", "great-pyrenees", "central-asian-shepherd-dog", "caucasian-shepherd-dog", "anatolian-shepherd-dog", "saint-bernard", "leonberger", "irish-wolfhound", "english-mastiff", "rottweiler", "doberman-pinscher", "belgian-malinois", "cane-corso", "akita", "weimaraner", "australian-cattle-dog", "standard-poodle", "mixed-breed-small", "mixed-breed-medium", "mixed-breed-large", "english-bulldog", "basenji", "chow-chow", "shar-pei", "bull-terrier", "staffordshire-bull-terrier", "portuguese-water-dog", "bullmastiff", "dogue-de-bordeaux", "tibetan-mastiff", "black-russian-terrier", "boerboel", "kuvasz", "maremma-sheepdog", "west-siberian-laika", "norwegian-elkhound", "mixed-labrador", "mixed-shepherd", "mixed-hound", "mixed-chihuahua", "mixed-bully", "rhodesian-ridgeback", "wirehaired-pointing-griffon", "giant-schnauzer", "chesapeake-bay-retriever", "scottish-terrier", "german-wirehaired-pointer", "bloodhound", "american-akita", "boykin-spaniel", "miniature-pinscher", "nova-scotia-duck-tolling-retriever", "airedale-terrier", "greater-swiss-mountain-dog", "irish-setter", "biewer-terrier", "soft-coated-wheaten-terrier", "brussels-griffon", "rat-terrier", "old-english-sheepdog", "english-setter", "standard-schnauzer", "american-staffordshire-terrier", "flat-coated-retriever", "borzoi", "bouvier-des-flandres", "chinese-village-dog"];
  const expected = new Set(ids);
  const legacy = window.pawdayPhotos;
  const legacyEntries = Object.entries(legacy);
  const rows = window.pawdayV6Rows;
  if (expected.size !== 142 || rows.length !== 142 || legacyEntries.length !== 142 ||
      rows.some(row => !expected.has(row.id)) ||
      new Set(rows.map(row => row.id)).size !== 142 ||
      new Set(legacyEntries.map(([, photo]) => photo.id)).size !== 142 ||
      legacyEntries.some(([, photo]) => !expected.has(photo.id))) {
    throw new Error('Pawday image manifest does not match the 142 stable profile IDs.');
  }
  const byId = Object.create(null);
  const next = Object.create(null);
  legacyEntries.forEach(([name, photo]) => {
    const src = 'photos/adult-puppy/' + photo.id + '-adult-puppy.webp';
    const item = Object.freeze({
      id: photo.id, name: name, src: src, sourcePage: '#pawday-photo-credits',
      sourceTitle: 'Pawday', credit: 'Pawday', license: '', licenseUrl: '',
      kind: photo.kind, generated: true, dimensions: Object.freeze([1024, 1024]),
      format: 'WebP'
    });
    byId[photo.id] = item;
    next[name] = item;
  });
  window.pawdayLegacyPhotos = legacy;
  window.pawdayPhotos = Object.freeze(next);
  window.pawdayGeneratedPhotosById = Object.freeze(byId);
  const tr = (ru, en, zh) => t(L(ru, en, zh));
  const caption = () => tr('Иллюстрация, созданная ИИ: взрослая собака и щенок.',
    'AI-generated illustration: adult dog and puppy.', 'AI 生成插图：成年犬和幼犬。');
  const alt = name => name + tr(': взрослая собака и щенок — иллюстрация, созданная ИИ',
    ': adult dog and puppy — AI-generated illustration', '：成年犬和幼犬（AI 生成插图）');
  window.pawdayImagePresentation = Object.freeze({caption, alt, version: '2026-10-27'});
  const previousBreedPhoto = breedPhoto;
  breedPhoto = function (breed) {
    const id = breed.evidence?.id || breed.ratings?.id;
    const photo = byId[id];
    if (!photo) return previousBreedPhoto(breed);
    const variable = breed.isMixed || breed.evidence?.kind || photo.kind === 'mixed-example';
    const note = variable ? tr(' Внешность метисов и типов собак различается; изображение не предсказывает, каким вырастет конкретный щенок.',
      ' Mixed-breed and type profiles vary; this image does not predict how an individual puppy will look as an adult.',
      ' 混种犬及类型档案的外观存在差异；插图不能预测某只幼犬长大后的外观。') : '';
    return '<figure class="breed-photo" data-profile-id="' + photoEscape(id) + '"><img src="' + photoEscape(photo.src) +
      '" alt="' + photoEscape(alt(t(breed.name))) + '" width="1024" height="1024" loading="lazy" decoding="async">' +
      '<figcaption class="generated-image-caption">' + photoEscape(caption() + note) + '</figcaption></figure>';
  };
})();
