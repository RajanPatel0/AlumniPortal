import { Check, Plus } from 'lucide-react';

export function ListBusinessBanner({ onOpenModal }: { onOpenModal: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h3 className="text-md font-bold text-gray-900 mb-2">List a business</h3>
      <p className="text-xs text-slate-500 font-medium mb-4 leading-relaxed">
        List a business here and get the following benefits:
      </p>
      
      <ul className="space-y-2 mb-6">
        {[
          'Free advertisement',
          'Find trusted customers',
          'Boosted SEO'
        ].map((benefit, idx) => (
          <li key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Check size={11} strokeWidth={3} />
            </div>
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      <button 
        onClick={onOpenModal}
        className="w-full py-3 bg-[#003D7A] hover:bg-[#002b56] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
      >
        <Plus size={16} />
        <span>List a new business</span>
      </button>
    </div>
  );
}
