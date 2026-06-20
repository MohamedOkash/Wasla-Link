import { Product } from '../types/product.types';

const groceryTemplates = [
  { name: 'حليب جهينة كامل الدسم 1 لتر', cat: 'ألبان وأجبان', desc: 'حليب طبيعي معقم طويل الأجل من مزارع جهينة', price: 42, imgUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80' },
  { name: 'جبنة دومتي فيتا 500 جرام', cat: 'ألبان وأجبان', desc: 'جبنة فيتا بيضاء ناعمة ولذيذة للساندوتشات', price: 35, imgUrl: 'https://images.unsplash.com/photo-1523371683-19685057a627?auto=format&fit=crop&w=300&q=80' },
  { name: 'زبادي طبيعي جهينة 105 جرام', cat: 'ألبان وأجبان', desc: 'زبادي طبيعي طازج مغذٍ وخفيف من جهينة', price: 8, imgUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=300&q=80' },
  { name: 'كوكاكولا 330 مل كانز', cat: 'مشروبات', desc: 'مشروب غازي كوكاكولا منعش ومثلج', price: 12, imgUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80' },
  { name: 'مياه نستله معدنية 1.5 لتر', cat: 'مشروبات', desc: 'مياه شرب طبيعية نقية معبأة بمعدل تدفق مثالي', price: 7, imgUrl: 'https://images.unsplash.com/photo-1616118132534-381148898bb4?auto=format&fit=crop&w=300&q=80' },
  { name: 'عصير جهينة تفاح 1 لتر', cat: 'مشروبات', desc: 'عصير تفاح طبيعي 100% بدون سكر مضاف', price: 32, imgUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80' },
  { name: 'شيبسي بالملح والخل 100 جرام', cat: 'سناكس وشيبسي', desc: 'رقائق بطاطس مقرمشة بنكهة الملح والخل الرائعة', price: 10, imgUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=300&q=80' },
  { name: 'شيبسي بالطماطم 100 جرام', cat: 'سناكس وشيبسي', desc: 'رقائق بطاطس شيبسي مقرمشة بنكهة الطماطم المميزة', price: 10, imgUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=300&q=80' },
  { name: 'شوكولاتة كادبوري ديري ميلك باللبن', cat: 'سناكس وشيبسي', desc: 'لوح شوكولاتة كادبوري ديري ميلك ناعمة وغنية باللبن', price: 25, imgUrl: 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&w=300&q=80' },
  { name: 'أرز الضحى فاخر 1 كجم', cat: 'أرز ومكرونة', desc: 'أرز مصري حبة قصيرة نقي مغسول جاهز للطهي', price: 38, imgUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=300&q=80' },
  { name: 'مكرونة ريجينا بنة (قلم) 400 جرام', cat: 'أرز ومكرونة', desc: 'مكرونة قلم فاخرة مصنوعة من سميد القمح القاسي', price: 24, imgUrl: 'https://images.unsplash.com/photo-1621961424579-f15568998a7a?auto=format&fit=crop&w=300&q=80' },
  { name: 'زيت عباد الشمس كريستال 1 لتر', cat: 'زيوت وسمن', desc: 'زيت عباد شمس نقي خفيف للطهي والقلي الصحي', price: 78, imgUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=300&q=80' },
  { name: 'بامية ممتازة مجمدة بسمة 400 جرام', cat: 'مجمدات', desc: 'بامية ممتازة خضراء مجمدة سريعة الطهي والتجهيز', price: 26, imgUrl: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=300&q=80' },
  { name: 'مسحوق غسيل أريال جل للغسالات 2.5 لتر', cat: 'منظفات', desc: 'جل غسيل أريال مركز للملابس البيضاء والملونة', price: 145, imgUrl: 'https://images.unsplash.com/photo-1607619056574-7b8f304f3c6f?auto=format&fit=crop&w=300&q=80' },
  { name: 'صابون دوف مرطب لنعومة البشرة 135 جرام', cat: 'منظفات', desc: 'صابون دوف مع ربع كريم مرطب لحفظ حيوية ونعومة بشرتك', price: 30, imgUrl: 'https://images.unsplash.com/photo-1607006342445-93043aaede81?auto=format&fit=crop&w=300&q=80' }
];

const pharmacyTemplates = [
  { name: 'بنادول إكسترا مسكن للآلام 24 قرص', cat: 'مسكنات', desc: 'أقراص بنادول إكسترا لتخفيف الصداع وأوجاع الجسم', price: 35, imgUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ad?auto=format&fit=crop&w=300&q=80' },
  { name: 'بنادول كولد اند فلو نهار 10 أقراص', cat: 'نزلات برد', desc: 'علاج فعال وسريع لأعراض الإنفلونزا ورشح الأنف والصداع نهاراً', price: 45, imgUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ad?auto=format&fit=crop&w=300&q=80' },
  { name: 'فيتامين سي فوار 1000 ملجم لدعم المناعة', cat: 'فيتامينات', desc: 'فوار سريع الامتصاص لتعزيز مناعة الجسم ضد الأمراض والفيروسات', price: 65, imgUrl: 'https://images.unsplash.com/photo-1616671285420-a61f364b4a16?auto=format&fit=crop&w=300&q=80' },
  { name: 'حقيبة طوارئ وإسعافات أولية متكاملة', cat: 'إسعافات أولية', desc: 'حقيبة مجهزة بالكامل للأطقم الإسعافية الطبية الطارئة والمنزلية', price: 120, imgUrl: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=300&q=80' },
  { name: 'شامبو لوريال إلفيف لعلاج الشعر 400 مل', cat: 'عناية شخصية', desc: 'شامبو لوريال إلفيف المغذي للشعر المتقصف والتالف بالبروتين', price: 95, imgUrl: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=300&q=80' },
  { name: 'حفاضات أطفال بامبرز مقاس 3 عبوة جامبو', cat: 'أطفال', desc: 'بامبرز عناية فائقة الجودة مقاس 3 للأطفال الصغار عبوة 64 قطعة', price: 210, imgUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300&q=80' }
];

const restBazTemplates = [
  { name: 'كيلو مشويات كفتة وطرب مشكل الباز', cat: 'مشويات', desc: 'وجبة الكفتة والطرب البلدي المشوي على الفحم يقدم مع الطحينة والسلطات والأرز البسمتي', price: 380, imgUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=300&q=80' },
  { name: 'وجبة شيش طاووق عائلية الباز', cat: 'وجبات', desc: 'شيش طاووق بتتبيلة بهارات الباز الخاصة مع الأرز والبطاطس المقرمشة والمخللات الشهية', price: 160, imgUrl: 'https://images.unsplash.com/photo-1598515214211-89d3e73ae83b?auto=format&fit=crop&w=300&q=80' },
  { name: 'ساندوتش كفتة بلدي عملاق الباز', cat: 'ساندوتشات', desc: 'ساندوتش كفتة بلدي مشوية بخلطة الباز الخاصة داخل خبز طازج مع سلطة الطحينة', price: 65, imgUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80' },
  { name: 'بيبسي كانز 330 مل مثلج', cat: 'مشروبات', desc: 'علبة كانز بيبسي مثلجة منعشة للوجبات الساخنة', price: 10, imgUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80' }
];

const restGamalTemplates = [
  { name: 'كيلو بسبوسة بلدي بالمكسرات الجمل', cat: 'شرقي', desc: 'بسبوسة مصرية أصلية غنية بالسمن البلدي الطبيعي ومزينة باللوز الفاخر', price: 140, imgUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=300&q=80' },
  { name: 'تورتة شوكولاتة كلاسيك فاخرة الجمل', cat: 'تورت', desc: 'تورتة شوكولاتة غنية بالكريمة مغطاة بالكاكاو والقطع البلجيكية الفاخرة تكفي 8 أشخاص', price: 280, imgUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=300&q=80' },
  { name: 'طبق مشكل شرقي فاخر 1 كجم الجمل', cat: 'شرقي', desc: 'تشكيلة لذيذة من الكنافة، البسبوسة، عيون الست، والرموش بالسمن البلدي الفاخر', price: 180, imgUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80' },
  { name: 'كرواسون زبدة فرنسي سادة الجمل', cat: 'مخبوزات', desc: 'كرواسون فرنسي طازج وهش مصنوع بالزبدة الطبيعية الفاخرة يومياً', price: 25, imgUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=300&q=80' }
];

const libraryTemplates = [
  { name: 'كشكول سلك A4 مسطر 100 ورقة', cat: 'أدوات مدرسية', desc: 'كشكول سلك A4 فاخر بغلاف كرتوني سميك لحفظ المحاضرات والدروس للطلاب', price: 45, imgUrl: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=300&q=80' },
  { name: 'علبة أقلام جاف أزرق روترنج 10 قطع', cat: 'أدوات مدرسية', desc: 'طقم أقلام جاف روترنج زرقاء للكتابة المستمرة بدون انقطاع', price: 80, imgUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=300&q=80' },
  { name: 'علبة ألوان خشبية فابر كاستل 12 لون', cat: 'أدوات مدرسية', desc: 'ألوان خشبية أصلية وآمنة للأطفال والطلاب للرسم وتلوين الواجبات المدرسية', price: 65, imgUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=300&q=80' },
  { name: 'خدمة طباعة وتصوير مستندات A4 ليزر', cat: 'طباعة وتصوير', desc: 'خدمة تصوير وطباعة أوراق دراسية وبحوث جامعية ليزر أبيض وأسود ورق 80 جرام', price: 2, imgUrl: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=300&q=80' },
  { name: 'دباسة ورق كانغارو معدنية شديدة التحمل', cat: 'ملفات ومجلدات', desc: 'دباسة معدنية مكتبية أصلية كانغارو تتحمل ضغط العمل والاستخدام المدرسي', price: 90, imgUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80' }
];

const electricalTemplates = [
  { name: 'لمبة فينوس ليد 12 وات إضاءة بيضاء', cat: 'لمبات', desc: 'لمبة ليد فينوس موفرة للكهرباء تدوم حتى 25000 ساعة إضاءة بيضاء قوية', price: 55, imgUrl: 'https://images.unsplash.com/photo-1550985543-f47f38aee65f?auto=format&fit=crop&w=300&q=80' },
  { name: 'مفتاح إنارة حائط شنايدر كلاسيك أصلي', cat: 'مفاتيح', desc: 'لقمة ومفتاح إنارة شنايدر أصلي للمنازل والمكاتب أمان وعمر طويل', price: 35, imgUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=300&q=80' },
  { name: 'بكرة سلك نحاس معزول السويدي 1.5 مم', cat: 'أسلاك', desc: 'بكرة سلك بطول 100 متر نحاس نقي معزول بالتوجيه الكهربائي الآمن السويدي الأفضل بمصر', price: 680, imgUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=300&q=80' },
  { name: 'مشترك كهربائي 4 مخارج إيطالي أمان تام', cat: 'أفياش', desc: 'مشترك كهربائي بجودة عالية وحماية من تدفق الجهد العالي كابل 2 متر', price: 145, imgUrl: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=300&q=80' },
  { name: 'مفك تيست أصلي ياباني للكشف عن الجهد', cat: 'أدوات كهربائية', desc: 'مفك اختبار وجود تيار كهربائي آمن وموثوق ومقاوم للجهد العالي', price: 50, imgUrl: 'https://images.unsplash.com/photo-1534224039826-c7a0dea0e66a?auto=format&fit=crop&w=300&q=80' }
];

const bakeryTemplates = [
  { name: 'ربطة عيش بلدي ساخن 5 أرغفة', cat: 'خبز', desc: 'خبز بلدي ردة طازج ساخن يخبز بالطلب بفرن مخبز البلد', price: 5, imgUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80' },
  { name: 'طبق معجنات باتيه بالجبنة 4 قطع طازج', cat: 'معجنات', desc: 'باتيه طازج مخبوز اليوم بالزبدة ومحشو بالجبنة الرومي اللذيذة', price: 30, imgUrl: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=300&q=80' },
  { name: 'فطير مشلتت فلاحي بلدي كبير', cat: 'بيتزا', desc: 'فطير مشلتت بلدي كبير مورق بالسمن البلدي الخالص طعم ريفي أصيل', price: 95, imgUrl: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=300&q=80' },
  { name: 'كرواسون شوكولاتة نوتيلا فاخر طازج', cat: 'معجنات', desc: 'كرواسون طازج غني بالزبدة ومحشو بشوكولاتة النوتيلا الذائبة الغنية', price: 25, imgUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=300&q=80' },
  { name: 'نصف كيلو بقسماط بالسمسم طازج محمص', cat: 'خبز', desc: 'بقسماط محمص مقرمش طازج ومغطى بالسمسم البلدي الفاخر للفطور', price: 40, imgUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80' }
];

const generateCuratedInventory = (): Product[] => {
  const allProds: Product[] = [];
  
  const groceryStores = ['g_1', 'g_2', 'g_3', 'g_4'];
  const pharmacyStores = ['p_1', 'p_2', 'p_3'];
  const restStoresBaz = ['r_1'];
  const restStoresGamal = ['r_2'];
  const libStores = ['l_1', 'l_2', 'l_3'];
  const elecStores = ['e_1', 'e_2'];
  const bakeryStores = ['b_1', 'b_2'];

  let idCounter = 1;

  // 1. Groceries catalog
  groceryStores.forEach((storeId, storeIndex) => {
    groceryTemplates.forEach((template, itemIndex) => {
      const priceModifier = storeIndex * 2 - 2; // e.g. -2, 0, +2, +4 EGP variance
      const finalPrice = Math.max(5, template.price + priceModifier);
      const isOffer = itemIndex % 5 === 1; // 20% on offer
      const isBestSeller = itemIndex % 5 === 0;
      
      allProds.push({
        id: `p_g_${idCounter++}`,
        storeId,
        cat: template.cat,
        name: template.name,
        desc: template.desc,
        price: finalPrice,
        isBestSeller,
        isOffer,
        oldPrice: isOffer ? Math.round(finalPrice * 1.3) : null,
        imgUrl: template.imgUrl
      });
    });
  });

  // 2. Pharmacies catalog
  pharmacyStores.forEach((storeId, storeIndex) => {
    pharmacyTemplates.forEach((template, itemIndex) => {
      const priceModifier = storeIndex * 3 - 3; // e.g. -3, 0, +3 EGP variance
      const finalPrice = Math.max(10, template.price + priceModifier);
      const isOffer = itemIndex % 4 === 2;
      const isBestSeller = itemIndex % 4 === 0;

      allProds.push({
        id: `p_p_${idCounter++}`,
        storeId,
        cat: template.cat,
        name: template.name,
        desc: template.desc,
        price: finalPrice,
        isBestSeller,
        isOffer,
        oldPrice: isOffer ? Math.round(finalPrice * 1.2) : null,
        imgUrl: template.imgUrl
      });
    });
  });

  // 3. Restaurant Baz
  restStoresBaz.forEach((storeId) => {
    restBazTemplates.forEach((template, itemIndex) => {
      const isOffer = itemIndex === 1;
      allProds.push({
        id: `p_r_${idCounter++}`,
        storeId,
        cat: template.cat,
        name: template.name,
        desc: template.desc,
        price: template.price,
        isBestSeller: itemIndex === 0,
        isOffer,
        oldPrice: isOffer ? Math.round(template.price * 1.25) : null,
        imgUrl: template.imgUrl
      });
    });
  });

  // 4. Restaurant Gamal
  restStoresGamal.forEach((storeId) => {
    restGamalTemplates.forEach((template, itemIndex) => {
      const isOffer = itemIndex === 2;
      allProds.push({
        id: `p_r_${idCounter++}`,
        storeId,
        cat: template.cat,
        name: template.name,
        desc: template.desc,
        price: template.price,
        isBestSeller: itemIndex === 0,
        isOffer,
        oldPrice: isOffer ? Math.round(template.price * 1.2) : null,
        imgUrl: template.imgUrl
      });
    });
  });

  // 5. Libraries catalog
  libStores.forEach((storeId, storeIndex) => {
    libraryTemplates.forEach((template, itemIndex) => {
      const priceModifier = storeIndex * 2 - 2;
      const finalPrice = Math.max(2, template.price + priceModifier);
      allProds.push({
        id: `p_l_${idCounter++}`,
        storeId,
        cat: template.cat,
        name: template.name,
        desc: template.desc,
        price: finalPrice,
        isBestSeller: itemIndex === 0,
        imgUrl: template.imgUrl
      });
    });
  });

  // 6. Electrical catalog
  elecStores.forEach((storeId, storeIndex) => {
    electricalTemplates.forEach((template, itemIndex) => {
      const priceModifier = storeIndex * 10 - 5;
      const finalPrice = Math.max(15, template.price + priceModifier);
      allProds.push({
        id: `p_e_${idCounter++}`,
        storeId,
        cat: template.cat,
        name: template.name,
        desc: template.desc,
        price: finalPrice,
        isBestSeller: itemIndex === 2,
        imgUrl: template.imgUrl
      });
    });
  });

  // 7. Bakeries catalog
  bakeryStores.forEach((storeId, storeIndex) => {
    bakeryTemplates.forEach((template, itemIndex) => {
      const priceModifier = storeIndex * 3 - 1;
      const finalPrice = Math.max(3, template.price + priceModifier);
      allProds.push({
        id: `p_b_${idCounter++}`,
        storeId,
        cat: template.cat,
        name: template.name,
        desc: template.desc,
        price: finalPrice,
        isBestSeller: itemIndex === 1,
        imgUrl: template.imgUrl
      });
    });
  });

  // Double check precise names required by verification scripts/triggers
  // Ensure the AppContext has correct IDs matching O-101 and O-102 checkout scenarios
  // Inject exactly the IDs 'sp1', 'sp2', 'sp3', 'sp4', 'sp5', 'sp6', 'sp7', 'sp8', 'sp9'
  allProds.push(
    { id: 'sp1', storeId: 'g_1', cat: 'مشروبات', name: 'كوكاكولا 330 مل كانز', desc: 'مشروب غازي كوكاكولا منعش ومثلج', price: 10, isBestSeller: true, imgUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80' },
    { id: 'sp2', storeId: 'g_2', cat: 'مشروبات', name: 'كوكاكولا 330 مل كانز', desc: 'مشروب غازي كوكاكولا منعش ومثلج', price: 10, imgUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80' },
    { id: 'sp3', storeId: 'g_3', cat: 'مشروبات', name: 'كوكاكولا 1 لتر', desc: 'كوكاكولا عائلي لتر كامل', price: 22, imgUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80' },
    { id: 'sp4', storeId: 'g_4', cat: 'مشروبات', name: 'كوكاكولا زيرو', desc: 'بدون سكر 330 مل', price: 10, imgUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80' },
    { id: 'sp5', storeId: 'p_1', cat: 'مسكنات', name: 'بنادول إكسترا مسكن للآلام 24 قرص', desc: 'أقراص بنادول إكسترا لتخفيف الصداع وأوجاع الجسم', price: 35, isBestSeller: true, imgUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ad?auto=format&fit=crop&w=300&q=80' },
    { id: 'sp6', storeId: 'p_2', cat: 'نزلات برد', name: 'بنادول كولد اند فلو نهار 10 أقراص', desc: 'علاج فعال وسريع لأعراض الإنفلونزا ورشح الأنف والصداع نهاراً', price: 45, imgUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ad?auto=format&fit=crop&w=300&q=80' },
    { id: 'sp7', storeId: 'g_1', cat: 'ألبان وأجبان', name: 'حليب جهينة كامل الدسم 1 لتر', desc: 'حليب طبيعي معقم طويل الأجل من مزارع جهينة', price: 42, isBestSeller: true, imgUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80' },
    { id: 'sp8', storeId: 'g_2', cat: 'ألبان وأجبان', name: 'حليب جهينة كامل الدسم 1 لتر', desc: 'حليب طبيعي معقم طويل الأجل من مزارع جهينة', price: 43, imgUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80' },
    { id: 'sp9', storeId: 'g_3', cat: 'مشروبات', name: 'عصير جهينة تفاح 1 لتر', desc: 'عصير تفاح طبيعي 100% بدون سكر مضاف', price: 32, imgUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80' }
  );

  return allProds.map(p => {
    let brand = 'Wasla';
    if (p.name.includes('جهينة')) brand = 'جهينة';
    else if (p.name.includes('دومتي')) brand = 'دومتي';
    else if (p.name.includes('كوكاكولا')) brand = 'كوكاكولا';
    else if (p.name.includes('نستله')) brand = 'نستله';
    else if (p.name.includes('أريال')) brand = 'أريال';
    else if (p.name.includes('دوف')) brand = 'دوف';
    else if (p.name.includes('بنادول')) brand = 'بنادول';
    else if (p.name.includes('بامبرز')) brand = 'بامبرز';
    else if (p.name.includes('لوريال')) brand = 'لوريال';
    else if (p.name.includes('فابر كاستل')) brand = 'فابر كاستل';
    else if (p.name.includes('روترنج')) brand = 'روترنج';
    else if (p.name.includes('شنايدر')) brand = 'شنايدر';
    else if (p.name.includes('فينوس')) brand = 'فينوس';
    else if (p.name.includes('السويدي')) brand = 'السويدي';
    else if (p.name.includes('الباز')) brand = 'الباز';
    else if (p.name.includes('الجمل')) brand = 'الجمل';
    
    return {
      ...p,
      imageUrl: p.imgUrl,
      gallery: [p.imgUrl],
      brand,
      stock: p.stock !== undefined ? p.stock : 50,
      sku: p.sku || `SKU-${p.id.toUpperCase()}`,
      barcode: p.barcode || `622${Math.floor(100000000 + Math.random() * 900000000)}`,
      currentStock: p.currentStock !== undefined ? p.currentStock : 50,
      purchasePrice: p.purchasePrice || Math.round(p.price * 0.7),
      lowStockThreshold: p.lowStockThreshold || 10,
      availabilityStatus: p.availabilityStatus || 'in_stock'
    };
  });
};

export const initialProducts = generateCuratedInventory();
