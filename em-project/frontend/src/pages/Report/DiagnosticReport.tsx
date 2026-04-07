import React, { useRef, useState } from 'react';
import { ChevronLeft, Download, FileText, CheckCircle, AlertTriangle, PenTool, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Screen } from '@/src/types';
import { FixieLogo } from '@/src/components/common/FixieLogo';

interface DiagnosticReportProps {
  setScreen: (screen: Screen) => void;
}

export const DiagnosticReport: React.FC<DiagnosticReportProps> = ({ setScreen }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // PDF 다운로드 기능
  const handleDownloadPdf = async () => {
    if (!reportRef.current || isGenerating) return;
    setIsGenerating(true);
    
    try {
      // 렌더링 품질을 위해 scale 옵션 사용
      const canvas = await html2canvas(reportRef.current, { 
        scale: 3, // 고해상도 출력을 위해 배율 상향
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Fixie_Report_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('PDF 다운로드 실패:', error);
      alert('PDF 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Mock 데이터 (LG 세탁기 기준)
  const mockData = {
    deviceType: 'LG 트롬 드럼 세탁기',
    modelName: 'F24WD',
    issueDate: new Date().toLocaleDateString(),
    symptom: '탈수 진행 시 심한 소음 및 진동 발생 (E1 에러)',
    aiDiagnosis: '세탁창 내 세탁물 쏠림(편심) 현상으로 인한 드럼 회전 불균형이 주 원인입니다. 추가적으로 세탁기 하단 수평이 맞지 않아 공진이 발생하고 있을 확률이 높습니다.',
    solutions: [
      '세탁기를 일시정지하고 세탁물을 고르게 펴주세요.',
      '이불 등 부피가 큰 세탁물의 경우 단독 세탁을 권장합니다.',
      '수평계를 이용해 세탁기 수평을 다시 한 번 조절해주세요.',
    ]
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col min-h-screen bg-slate-50 space-y-4">
      {/* 1. 컨트롤 헤더 */}
      <header className="flex items-center justify-between p-4 bg-white shadow-sm z-10 sticky top-0">
        <button 
          onClick={() => setScreen('history')}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-bold text-slate-800">AI 진단 리포트</h1>
        <button 
          onClick={handleDownloadPdf}
          disabled={isGenerating}
          className="flex items-center gap-2 px-3 py-1.5 bg-theme-primary/10 text-theme-primary rounded-lg font-bold hover:bg-theme-primary hover:text-white transition-colors disabled:opacity-50"
        >
          {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
          <span className="text-sm">{isGenerating ? '생성 중...' : 'PDF 다운로드'}</span>
        </button>
      </header>

      {/* 2. PDF 출력용 A4 캔버스 래퍼 (반응형 줌 적용) */}
      <div className="p-4 overflow-x-auto no-scrollbar pb-32">
        <div 
          ref={reportRef} 
          className="bg-white shadow-lg mx-auto p-10 text-slate-800"
          style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }} // A4 dimensions
        >
          {/* 리포트 헤더 */}
          <div className="border-b-[6px] border-slate-900 pb-8 mb-10 flex justify-between items-end">
            <div>
              <div className="flex items-center gap-3 text-theme-primary mb-3">
                <div className="w-12 h-12 bg-theme-primary/10 rounded-2xl flex items-center justify-center">
                  <FileText size={32} />
                </div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900">FIXIE AI SOLUTION</h2>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest pl-1">Diagnostic Intelligence Report</p>
            </div>
            <div className="text-right text-[11px] font-bold text-slate-500 space-y-1">
              <p>ISSUED: {mockData.issueDate}</p>
              <p className="text-theme-primary">REF: #FX-2026-04-{Math.floor(Math.random() * 1000)}</p>
            </div>
          </div>

          {/* 기기 정보 섹션 - 더 세련되게 */}
          <section className="mb-10">
            <h3 className="text-[13px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">01. Device Context</h3>
            <div className="grid grid-cols-2 gap-px bg-slate-200 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="bg-white p-6">
                <p className="text-[10px] text-slate-400 font-black mb-1.5 uppercase">Category</p>
                <p className="font-bold text-slate-800 text-lg">{mockData.deviceType}</p>
              </div>
              <div className="bg-white p-6">
                <p className="text-[10px] text-slate-400 font-black mb-1.5 uppercase">Model</p>
                <p className="font-bold text-slate-800 text-lg">{mockData.modelName}</p>
              </div>
            </div>
          </section>

          {/* 증상 및 진단 섹션 - 강렬하게 */}
          <section className="mb-10">
            <h3 className="text-[13px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">02. AI Diagnostic Result</h3>
            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
               <div className="absolute top-0 right-0 w-64 h-64 bg-theme-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
               <div className="relative z-10 space-y-6">
                 <div>
                    <h4 className="flex items-center gap-2 text-red-400 text-xs font-black uppercase mb-3">
                       <AlertTriangle size={14} /> Reported Symptom
                    </h4>
                    <p className="text-xl font-bold leading-tight">
                      "{mockData.symptom}"
                    </p>
                 </div>
                 
                 <div className="h-px bg-white/10 w-full"></div>

                 <div>
                    <h4 className="text-theme-primary text-xs font-black uppercase mb-3">
                       Inferred Cause & Diagnosis
                    </h4>
                    <p className="text-slate-300 leading-relaxed text-sm font-medium">
                      {mockData.aiDiagnosis}
                    </p>
                 </div>
               </div>
            </div>
          </section>

          {/* 해결 방안 섹션 - 깔끔하게 */}
          <section className="mb-12">
            <h3 className="text-[13px] font-black text-slate-400 mb-4 uppercase tracking-[0.2em]">03. Recommended Action Steps</h3>
            <div className="grid grid-cols-1 gap-4">
              {mockData.solutions.map((sol, i) => (
                <div key={i} className="flex gap-5 items-center bg-slate-50 p-6 rounded-2xl border border-slate-100 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 font-black text-xs">
                    {i + 1}
                  </div>
                  <p className="text-slate-700 font-bold text-sm leading-relaxed">{sol}</p>
                </div>
              ))}
            </div>
          </section>
          
          {/* 하단 푸터 - 명품 문서 느낌 */}
          <div className="mt-auto pt-10 flex flex-col items-center">
             <div className="w-16 h-1 bg-slate-200 mb-8"></div>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Authenticated by Fixie AI Intelligence</p>
             <div className="flex items-center gap-3">
                <FixieLogo size={32} />
                <span className="text-xl font-black text-slate-300 tracking-tighter italic">Fixie</span>
             </div>
             <p className="mt-8 text-[9px] text-slate-300 max-w-sm text-center leading-loose font-medium">
                본 진단서는 인공지능 분석 알고리즘에 의해 생성되었습니다. 실제 수리 시 제품의 구체적인 상태에 따라 
                전문가의 진단과 차이가 있을 수 있으므로 참고용으로 활용하시기 바랍니다.
             </p>
          </div>

        </div>
      </div>
    </div>
  );
};
