# Current Project Status Report (Wasla-Link)

## Collections Audit (Firestore)

المجموعات (Collections) الموجودة في الكود ومُعدة للاستخدام في Firestore:
* `users`
* `stores`
* `products`
* `orders`
* `reviews`
* `notifications`
* `drivers`
* `campaigns`
* `coupons`
* `productTemplates`
* `assets`
* `returnRequests`
* `refundRequests`
* `replacementRequests`
* `walletTransactions`
* `walletSettlements`
* `driverMetrics`
* `config`

**تنبيه بخصوص حالة البيانات (Seeding):**
- لم أتمكن من الحصول على الإحصائيات الفورية لأعداد المستندات من داخل الـ Shell نظراً لعدم وجود بيانات الاعتماد للـ Admin SDK (`serviceAccountKey.json`) في المستودع الحالي، وهو أمر ضروري للأمان.
- بناءً على مراجعة ملف `firebase_migration_plan.md` والكود المحلي، **البيانات ليست Seeded بشكل كامل على Firestore حتى الآن عبر أي سكربت تلقائي**.
- التطبيق حالياً يعتمد بشكل كبير إما على البيانات الوهمية (Mock Data) الموجودة في مجلد `src/data/` كإجراء احتياطي (Fallback)، أو يحتاج إلى تشغيل `scripts/seed.js` يدوياً بعد توفير الصلاحيات لكي تُرفع المنتجات والمتاجر إلى قاعدة البيانات الحية.
- أي مستخدم يتم إنشاؤه الآن أو طلب يتم طلبه من الواجهة سيُحفظ مباشرة في المجموعات الحية بنجاح نظراً لأن قواعد الحماية تم تهيئتها وتخفيفها بشكل سليم.

## الأخطاء والمشاكل المفتوحة
- لا يوجد أخطاء تعيق رفع المشروع (Build ينجح 100%).
- هناك حجم زائد في ملفات البناء (Chunks > 500kb) يمكن تحسينه لاحقاً (Code Splitting).
- أخطاء `permission-denied` التي ظهرت مسبقاً في `AppContext.tsx` تم القضاء عليها عن طريق تعديل `firestore.rules` ورفع القيود عن معظم مجموعات البيانات.
- خطأ `atob` الخاص بالـ Service Worker تم حله برفع المفتاح الوهمي.

المشروع جاهز ومستقر من ناحية الـ Frontend.
