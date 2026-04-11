import React, { useRef, useState } from 'react';
import { ChevronLeft, Download, FileText, CheckCircle, AlertTriangle, PenTool, Loader2, Share2, Mail, Link as LinkIcon, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Screen } from '@/src/types';
import { FixieLogo } from '@/src/components/common/FixieLogo';
import { SocialShareModal } from '@/src/components/common/SocialShareModal';

interface DiagnosticReportProps {
  setScreen: (screen: Screen) => void;
  roomId?: string; // 방 번호 프로퍼티 추가
  onClose?: () => void;
  shareUrl?: string; // 공유할 다이나믹 URL 추가
}

export const DiagnosticReport: React.FC<DiagnosticReportProps> = ({ setScreen, roomId, onClose, shareUrl }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [loadingPhrase, setLoadingPhrase] = useState("AI가 대화 내용을 분석하고 있습니다...");

  // 로딩 텍스트 애니메이션
  React.useEffect(() => {
    if (!isLoading) return;
    const phrases = [
      "AI가 대화 내용을 요약하고 있습니다...",
      "매뉴얼 데이터베이스에서 해결책을 찾는 중...",
      "기기 모델 정보를 식별하고 있습니다...",
      "진단 근거데이터를 생성하고 있습니다...",
      "최적의 조치 계획을 구성하는 중입니다..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % phrases.length;
      setLoadingPhrase(phrases[i]);
    }, 2500);
    return () => clearInterval(interval);
  }, [isLoading]);

  // 실데이터 로드
  React.useEffect(() => {
    const fetchData = async () => {
      if (!roomId) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const data = await deviceService.getDiagnosticReport(roomId);
        setReportData(data);
      } catch (error) {
        console.error("리포트 데이터 로드 실패:", error);
        // 실패 시 빈 데이터나 에러 상태 처리를 할 수 있지만, 
        // 사용자 피드백에 따라 최소한의 UI는 보여주도록 합니다.
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [roomId]);

  // PDF 다운로드 기능
  const handleDownloadPdf = async () => {
    if (!reportRef.current || isGenerating) return;
    setIsGenerating(true);
    
    try {
      const canvas = await html2canvas(reportRef.current, { 
        scale: 3, 
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

  const displayData = reportData || {
    deviceName: '기기 정보 분석 중',
    modelName: '모델명 확인 중',
    symptoms: '원격 진단 중...',
    cause: 'AI가 원인을 분석하고 있습니다.',
    solutions: '로딩 중...'
  };

  const solutionList = typeof displayData.solutions === 'string' 
    ? displayData.solutions.split('\n').filter((s: string) => s.trim().length > 0)
    : [displayData.solutions];

  return (
    <div className="max-w-3xl mx-auto flex flex-col min-h-screen bg-slate-50 space-y-4">
      {/* 1. 컨트롤 헤더 */}
      <header className="flex items-center justify-between p-4 bg-white shadow-sm z-10 sticky top-0">
        <button 
          onClick={() => onClose ? onClose() : setScreen('history')}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-bold text-slate-800">AI 진단 리포트</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-colors"
          >
            <Share2 size={16} />
            <span className="hidden sm:inline text-sm">공유</span>
          </button>

          <button 
            onClick={handleDownloadPdf}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3 py-1.5 bg-theme-primary/10 text-theme-primary rounded-lg font-bold hover:bg-theme-primary hover:text-white transition-colors disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
            <span className="hidden sm:inline text-sm">{isGenerating ? '생성 중...' : 'PDF'}</span>
            <span className="sm:hidden text-sm">PDF</span>
          </button>
        </div>
      </header>

      {/* 2. PDF 출력용 A4 캔버스 래퍼 (반응형 줌 적용) */}
      <div className="p-4 overflow-x-auto no-scrollbar pb-32 flex justify-center">
        <div 
          ref={reportRef} 
          className="bg-white p-[40px] text-[#334155] flex flex-col"
          style={{ 
            width: '210mm', 
            minHeight: '297mm', 
            boxSizing: 'border-box', 
            backgroundColor: '#ffffff',
            boxShadow: '0 20px 50px rgba(0,0,0,0.1)' 
          }} // A4 dimensions
        >
          {/* 리포트 헤더 - 간격 미세 조정 */}
          <div className="border-b-[4px] border-[#0f172a] pb-[30px] mb-[40px] flex justify-between items-end">
            <div>
              <div className="flex items-center gap-4 text-[#7DE3D1] mb-3">
                <div 
                  className="w-14 h-14 bg-[#0f172a] rounded-2xl flex items-center justify-center text-white"
                  style={{ boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                >
                  <FixieLogo size={36} />
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tighter text-[#0f172a] leading-none">FIXIE</h2>
                  <p className="text-[10px] text-[#7DE3D1] font-black uppercase tracking-[0.3em] mt-1">Diagnostic Intelligence</p>
                </div>
              </div>
            </div>
            <div className="text-right text-[10px] font-black text-[#94a3b8] space-y-1 uppercase tracking-widest">
              <p>Report ID: #FX-2026-04-{Math.floor(Math.random() * 1000)}</p>
              <p>Issue Date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* 기기 정보 섹션 - 그리드 1px 조정 */}
          <section className="mb-[40px]">
            <h3 className="text-[11px] font-black text-[#cbd5e1] mb-4 uppercase tracking-[0.25em]">01. Device Specifications</h3>
            <div className="grid grid-cols-2 gap-[1px] bg-[#f1f5f9] rounded-2xl overflow-hidden border border-[#f1f5f9]">
              <div className="bg-white p-6">
                <p className="text-[9px] text-[#94a3b8] font-black mb-2 uppercase tracking-wider">Classification</p>
                <p className="font-bold text-[#1e293b] text-lg tracking-tight">{displayData.deviceName}</p>
              </div>
              <div className="bg-white p-6">
                <p className="text-[9px] text-[#94a3b8] font-black mb-2 uppercase tracking-wider">Model Identifier</p>
                <p className="font-bold text-[#1e293b] text-lg tracking-tight">{displayData.modelName}</p>
              </div>
            </div>
          </section>

          {/* 증상 및 진단 섹션 - 대비 강화 */}
          <section className="mb-[40px]">
            <h3 className="text-[11px] font-black text-[#cbd5e1] mb-4 uppercase tracking-[0.25em]">02. Intelligent Analysis</h3>
            <div 
              className="bg-[#0f172a] rounded-[32px] p-10 text-white relative overflow-hidden"
              style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
            >
               <div 
                 className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] -mr-40 -mt-40"
                 style={{ backgroundColor: 'rgba(125, 227, 209, 0.1)' }}
               ></div>
               <div className="relative z-10 space-y-8">
                 <div>
                    <h4 className="flex items-center gap-2 text-[#7DE3D1] text-[10px] font-black uppercase mb-4 tracking-widest">
                       <AlertTriangle size={12} color="#f87171" /> Detected Anomaly
                    </h4>
                    <p className="text-2xl font-bold leading-tight tracking-tight">
                      {displayData.symptoms}
                    </p>
                 </div>
                 
                 <div className="h-[1px] w-full" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}></div>

                 <div>
                    <h4 className="text-[#7DE3D1] text-[10px] font-black uppercase mb-4 tracking-widest">
                       Root Cause Diagnosis
                    </h4>
                    <p className="text-[#94a3b8] leading-relaxed text-[15px] font-medium">
                       {displayData.cause}
                    </p>
                 </div>
               </div>
            </div>
          </section>

          {/* 해결 방안 섹션 - 리스트 정밀화 */}
          <section className="mb-[40px]">
            <h3 className="text-[11px] font-black text-[#cbd5e1] mb-4 uppercase tracking-[0.25em]">03. Strategic Action Plan</h3>
            <div className="space-y-3">
              {solutionList.map((sol: string, i: number) => (
                <div key={i} className="flex gap-6 items-center bg-[#f8fafc] p-6 rounded-2xl border border-[#f1f5f9] transition-colors">
                  <div 
                    className="w-10 h-10 rounded-xl bg-white border border-[#f1f5f9] flex items-center justify-center text-[#0f172a] shrink-0 font-black text-sm"
                    style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <p className="text-[#334155] font-bold text-[14px] leading-snug">{sol}</p>
                </div>
              ))}
            </div>
          </section>
          
          {/* 하단 푸터 - 명품 문서 느낌 */}
          <div className="mt-auto pt-10 flex flex-col items-center">
             <div className="w-16 h-1 bg-[#e2e8f0] mb-8"></div>
             <p className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-widest mb-2">Authenticated by Fixie AI Intelligence</p>
             <div className="flex items-center gap-3">
                <FixieLogo size={32} color="#cbd5e1" />
                <span className="text-xl font-black text-[#cbd5e1] tracking-tighter italic">Fixie</span>
             </div>
             <p className="mt-8 text-[9px] text-[#cbd5e1] max-w-sm text-center leading-loose font-medium">
                본 진단서는 인공지능 분석 알고리즘에 의해 생성되었습니다. 실제 수리 시 제품의 구체적인 상태에 따라 
                전문가의 진단과 차이가 있을 수 있으므로 참고용으로 활용하시기 바랍니다.
             </p>
          </div>

        </div>
      </div>

      {/* 3. 프리미엄 로딩 오버레이 */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-xl transition-all duration-700">
          <div className="relative mb-12">
            {/* 고품격 그라데이션 글로우 애니메이션 */}
            <div className="absolute inset-0 bg-gradient-to-r from-theme-primary to-[#7DE3D1] rounded-full blur-[40px] opacity-30 animate-pulse"></div>
            <div className="relative w-24 h-24 flex items-center justify-center">
              <Loader2 size={64} className="text-theme-primary animate-spin-slow" />
              <div className="absolute inset-0 flex items-center justify-center">
                <FixieLogo size={32} />
              </div>
            </div>
          </div>
          <div className="text-center space-y-4 px-6 max-w-sm">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
              품격 있는 <span className="text-theme-primary">AI 분석</span> 결과가<br />준비 중입니다
            </h2>
            <div className="flex flex-col items-center gap-2">
              <p className="text-slate-500 font-bold text-sm h-6 transition-all duration-500">
                {loadingPhrase}
              </p>
              <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-theme-primary animate-loading-progress rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 프리미엄 SNS 공유 모달 연동 */}
      <SocialShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        title="진단 리포트 공유"
        shareUrl={shareUrl}
      />
    </div>
  );
};
