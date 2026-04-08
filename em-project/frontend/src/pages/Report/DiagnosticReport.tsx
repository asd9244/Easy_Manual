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
      <div className="p-4 overflow-x-auto no-scrollbar pb-32 flex justify-center">
        <div 
          ref={reportRef} 
          className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-[40px] text-slate-800 flex flex-col"
          style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }} // A4 dimensions
        >
          {/* 리포트 헤더 - 간격 미세 조정 */}
          <div className="border-b-[4px] border-slate-900 pb-[30px] mb-[40px] flex justify-between items-end">
            <div>
              <div className="flex items-center gap-4 text-theme-primary mb-3">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <FixieLogo size={36} />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tighter text-slate-900 leading-none">FIXIE</h2>
                  <p className="text-[10px] text-theme-primary font-black uppercase tracking-[0.3em] mt-1">Diagnostic Intelligence</p>
                </div>
              </div>
            </div>
            <div className="text-right text-[10px] font-black text-slate-400 space-y-1 uppercase tracking-widest">
              <p>Report ID: #FX-2026-04-{Math.floor(Math.random() * 1000)}</p>
              <p>Issue Date: {mockData.issueDate}</p>
            </div>
          </div>

          {/* 기기 정보 섹션 - 그리드 1px 조정 */}
          <section className="mb-[40px]">
            <h3 className="text-[11px] font-black text-slate-300 mb-4 uppercase tracking-[0.25em]">01. Device Specifications</h3>
            <div className="grid grid-cols-2 gap-[1px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-100">
              <div className="bg-white p-6">
                <p className="text-[9px] text-slate-400 font-black mb-2 uppercase tracking-wider">Classification</p>
                <p className="font-bold text-slate-800 text-lg tracking-tight">{mockData.deviceType}</p>
              </div>
              <div className="bg-white p-6">
                <p className="text-[9px] text-slate-400 font-black mb-2 uppercase tracking-wider">Model Identifier</p>
                <p className="font-bold text-slate-800 text-lg tracking-tight">{mockData.modelName}</p>
              </div>
            </div>
          </section>

          {/* 증상 및 진단 섹션 - 대비 강화 */}
          <section className="mb-[40px]">
            <h3 className="text-[11px] font-black text-slate-300 mb-4 uppercase tracking-[0.25em]">02. Intelligent Analysis</h3>
            <div className="bg-slate-900 rounded-[32px] p-10 text-white relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 w-80 h-80 bg-theme-primary/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
               <div className="relative z-10 space-y-8">
                 <div>
                    <h4 className="flex items-center gap-2 text-theme-primary text-[10px] font-black uppercase mb-4 tracking-widest">
                       <AlertTriangle size={12} className="text-red-400" /> Detected Anomaly
                    </h4>
                    <p className="text-2xl font-bold leading-tight tracking-tight">
                      {mockData.symptom}
                    </p>
                 </div>
                 
                 <div className="h-[1px] bg-white/5 w-full"></div>

                 <div>
                    <h4 className="text-theme-primary text-[10px] font-black uppercase mb-4 tracking-widest">
                       Root Cause Diagnosis
                    </h4>
                    <p className="text-slate-400 leading-relaxed text-[15px] font-medium">
                      {mockData.aiDiagnosis}
                    </p>
                 </div>
               </div>
            </div>
          </section>

          {/* 해결 방안 섹션 - 리스트 정밀화 */}
          <section className="mb-[40px]">
            <h3 className="text-[11px] font-black text-slate-300 mb-4 uppercase tracking-[0.25em]">03. Strategic Action Plan</h3>
            <div className="space-y-3">
              {mockData.solutions.map((sol, i) => (
                <div key={i} className="flex gap-6 items-center bg-slate-50 p-6 rounded-2xl border border-slate-100 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-900 shrink-0 font-black text-sm">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <p className="text-slate-700 font-bold text-[14px] leading-snug">{sol}</p>
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
