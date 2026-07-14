import React, { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { Camera, Upload, Check, AlertCircle } from 'lucide-react';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { mediaService } from '../../services/media.service';
import { driverRepository } from '../../services/driver/repository';
import { useApp } from '../../contexts/AppContext';
import { Driver } from '../../types/driver.types';

export const DriverVerificationRequired: React.FC<{ driver: Driver }> = ({ driver }) => {
  const { t } = useTranslation();
  const { showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<Record<string, File | null>>({});

  const handleFileChange = (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [docId]: e.target.files![0] }));
    }
  };

  const handleSubmit = async () => {
    const requested = driver.verificationRequest?.requestedDocuments || [];
    
    // Check if all requested docs are provided
    for (const req of requested) {
      if (req !== 'Other' && !files[req]) {
        showToast(`Please upload ${req}`, 'warning');
        return;
      }
    }

    setLoading(true);
    try {
      const updates: any = {};
      
      for (const req of requested) {
        if (req === 'Other') continue;
        const file = files[req];
        if (file) {
          const url = await mediaService.uploadImage(file, `drivers/${driver.uid}/${req}`);
          if (req === 'National ID Image') updates.nationalIdImageUrl = url;
          if (req === 'Driving License') updates.drivingLicenseUrl = url;
          if (req === 'Vehicle Image') updates.vehicleImageUrl = url;
          if (req === 'Profile Photo') updates.profilePhotoUrl = url;
        }
      }

      updates.status = 'pending_review';

      await driverRepository.update(driver.uid, updates);
      showToast('Documents submitted for review!', 'success');
      window.location.reload();
    } catch (err) {
      console.error(err);
      showToast('Failed to upload documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const reqDocs = driver.verificationRequest?.requestedDocuments || [];
  const reviewNote = driver.verificationRequest?.reviewNote || '';

  return (
    <div className="h-screen bg-theme-bg flex flex-col p-5 overflow-y-auto pb-20">
      <div className="bg-amber-500/10 text-amber-500 p-4 rounded-xl flex gap-3 mb-6 animate-fade-in mt-10">
        <AlertCircle size={24} className="shrink-0" />
        <div>
          <h2 className="font-black text-lg mb-1">Verification Required</h2>
          <p className="text-sm font-bold opacity-90">
            Our team needs additional documents to approve your application.
          </p>
        </div>
      </div>

      {reviewNote && (
        <div className="bg-theme-card border border-theme-border p-4 rounded-xl mb-6">
          <p className="text-xs text-theme-muted font-bold mb-1">Admin Note:</p>
          <p className="text-sm font-black text-theme-text">{reviewNote}</p>
        </div>
      )}

      <div className="space-y-4 mb-8 flex-1">
        <h3 className="font-black text-theme-text">Requested Documents</h3>
        
        {reqDocs.map((docReq: any) => {
          if (docReq === 'Other') return null;
          const file = files[docReq];
          
          return (
            <div key={docReq} className="space-y-2">
              <label className="text-xs font-bold text-theme-muted block">{docReq}</label>
              <label className="w-full py-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 text-primary flex items-center justify-center gap-2 cursor-pointer hover:bg-primary/10 transition">
                {file ? <Check size={20} className="text-green-500" /> : <Upload size={20} />}
                <span className="text-sm font-bold">{file ? file.name : `Upload ${docReq}`}</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(docReq, e)} />
              </label>
            </div>
          );
        })}
      </div>

      <PremiumButton onClick={handleSubmit} disabled={loading} className="w-full">
        {loading ? 'Submitting...' : 'Submit Documents'}
      </PremiumButton>
    </div>
  );
};
