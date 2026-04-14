import React, { useState, useEffect, useRef } from 'react';

export function useSpeechRecognition(setInputText: React.Dispatch<React.SetStateAction<string>>) {
  const [isListening, setIsListening] = useState(false);
  const [tempTranscript, setTempTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ko-KR';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setInputText(prev => prev + event.results[i][0].transcript);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTempTranscript(interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('음성 인식 오류:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setTempTranscript('');
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTempTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return { isListening, tempTranscript, toggleListening, stopListening };
}
