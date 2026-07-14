import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useApp } from '../../contexts/AppContext';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { PremiumCard } from '../../components/premium/PremiumCard';
import { FileText, CheckCircle, LogOut } from 'lucide-react';
import { driverRepository } from '../../services/driver/repository';
import { auth } from '../../services/firebase';

interface DriverAgreementProps {
  driver: any;
  onAccepted: () => void;
}

export const DriverAgreement: React.FC<DriverAgreementProps> = ({ driver, onAccepted }) => {
  const { t } = useTranslation();
  const { isRTL, showToast } = useApp();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!accepted) {
      showToast(isRTL ? 'يرجى تحديد مربع قبول الشروط والأحكام أولاً' : 'Please check the box to agree to terms first', 'warning');
      return;
    }
    setLoading(true);
    try {
      await driverRepository.update(driver.id, {
        agreementAccepted: true
      });
      showToast(isRTL ? 'تم قبول الاتفاقية بنجاح!' : 'Agreement accepted successfully!', 'success');
      onAccepted();
    } catch (e) {
      console.error(e);
      showToast(isRTL ? 'خطأ أثناء حفظ القبول' : 'Error saving agreement state', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-theme-bg h-screen w-full flex flex-col justify-between p-5 z-[100] fixed inset-0 font-sans text-theme-text overflow-hidden">
      {/* Header */}
      <div className="bg-theme-card px-5 py-4 border-b border-theme-border/60 flex items-center justify-between z-20 rounded-2xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-xl text-primary"><FileText size={20} /></div>
          <div>
            <h2 className="text-sm font-black">{isRTL ? 'اتفاقية مندوب التوصيل' : 'Delivery Agent Agreement'}</h2>
            <p className="text-[9px] text-theme-muted font-bold mt-0.5">{isRTL ? 'مراجعة وتوقيع الشروط' : 'Review & Sign Terms'}</p>
          </div>
        </div>
        <button onClick={() => auth.signOut()} className="p-2.5 text-red-500 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition flex items-center justify-center">
          <LogOut size={16} />
        </button>
      </div>

      {/* Body scrollable content */}
      <div className="flex-1 overflow-y-auto my-5 space-y-4 pr-1 no-scrollbar">
        <PremiumCard className="p-5 space-y-4">
          <h3 className="font-black text-xs text-primary">{isRTL ? 'الشروط والأحكام العامة لمندوب التوصيل' : 'Terms & General Conditions'}</h3>
          <div className="text-xs text-theme-muted font-bold leading-relaxed space-y-3">
            <p>
              {isRTL 
                ? '1. يلتزم مندوب التوصيل بتقديم الخدمة بأعلى درجات الأمانة والاحترافية وحسن معاملة العملاء والمتاجر.'
                : '1. The delivery agent is committed to performing services with the highest levels of honesty, professionalism, and respect to customers and store partners.'}
            </p>
            <p>
              {isRTL 
                ? '2. يقر المندوب بأن استخدام الـ GPS لتتبع الموقع في الخلفية إلزامي لتحديد مسافة التوصيل وتوزيع الطلبات بشكل عادل.'
                : '2. The agent acknowledges that background GPS tracking is mandatory to calculate delivery distances and distribute orders fairly.'}
            </p>
            <p>
              {isRTL 
                ? '3. يُمنع منعاً باتاً التلاعب بإثباتات التسليم أو طلب مبالغ إضافية خارج الرسوم المحددة في النظام للعملاء.'
                : '3. It is strictly forbidden to tamper with delivery proof or request any extra cash from customers beyond the system-defined fees.'}
            </p>
            <p>
              {isRTL 
                ? '4. المندوب مسؤول بالكامل عن الحفاظ على الطلبات وحالتها من وقت استلامها من المتجر حتى تسليمها للعميل.'
                : '4. The agent is fully responsible for maintaining order state from the moment of picking it up from the store until hand-over to the customer.'}
            </p>
            <p>
              {isRTL 
                ? '5. سيتم تحويل المستحقات والأرباح مباشرة إلى المحفظة الرقمية أو الحساب البنكي المسجل، مع أحقية المنصة في تطبيق شروط Reconcile للمبالغ النقدية.'
                : '5. Earnings will be transferred directly to the registered wallet or bank account, with the platform having full rights to apply cash reconciliation terms.'}
            </p>
            <p>
              {isRTL 
                ? '6. يلتزم المندوب باتباع كافة إرشادات السلامة العامة والمرور أثناء قيادة المركبة.'
                : '6. The agent must adhere to all public safety and traffic instructions during delivery trips.'}
            </p>
          </div>
        </PremiumCard>
      </div>

      {/* Footer Controls */}
      <div className="bg-theme-card p-5 border-t border-theme-border/60 rounded-2xl space-y-4 flex-shrink-0">
        <label className="flex items-center gap-3 cursor-pointer">
          <input 
            type="checkbox" 
            checked={accepted} 
            onChange={(e) => setAccepted(e.target.checked)} 
            className="w-5 h-5 accent-primary rounded cursor-pointer"
          />
          <span className="text-xs font-bold text-theme-text">
            {isRTL ? 'أوافق على كافة الشروط والأحكام المذكورة أعلاه وأقر بالالتزام بها.' : 'I agree to the terms and conditions described above.'}
          </span>
        </label>

        <PremiumButton 
          onClick={handleAccept} 
          disabled={loading || !accepted} 
          variant="primary" 
          className="w-full h-12 text-xs font-black shadow-md rounded-xl flex items-center justify-center gap-2"
        >
          <CheckCircle size={16} />
          <span>{loading ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'قبول وتوقيع الاتفاقية' : 'Accept & Sign Agreement')}</span>
        </PremiumButton>
      </div>
    </div>
  );
};
