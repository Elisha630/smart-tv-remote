import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceInputProps {
  onSendText: (text: string) => void;
  disabled?: boolean;
}

// Check for Web Speech API support
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const VoiceInput = ({ onSendText, disabled = false }: VoiceInputProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        if (finalTranscript) {
          onSendText(finalTranscript.trim());
          setTranscript('');
          toast.success('Text sent to TV');
        } else {
          setTranscript(interimTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied');
        } else if (event.error !== 'aborted') {
          toast.error(`Voice input error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onSendText]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setTranscript('');
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.info('Listening... Speak now');
      } catch (error) {
        console.error('Error starting recognition:', error);
        toast.error('Could not start voice input');
      }
    }
  }, [isListening]);

  if (!isSupported) {
    return (
      <motion.button
        className="remote-button p-3 flex items-center gap-2 opacity-50 cursor-not-allowed"
        title="Voice input not supported in this browser"
        disabled
      >
        <MicOff className="w-5 h-5" />
        <span className="text-sm">Voice (Unsupported)</span>
      </motion.button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        className={`remote-button p-4 flex items-center gap-2 ${
          isListening 
            ? 'bg-red-500/30 border-red-500/50 text-red-400' 
            : 'hover:bg-primary/20'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleListening}
        disabled={disabled}
        title={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {isListening ? (
          <>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <Mic className="w-6 h-6" />
            </motion.div>
            <span className="text-sm">Listening...</span>
          </>
        ) : (
          <>
            <Mic className="w-6 h-6" />
            <span className="text-sm">Voice</span>
          </>
        )}
      </motion.button>

      {transcript && (
        <motion.div
          className="glass-panel px-3 py-2 rounded-lg max-w-xs text-center"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm text-muted-foreground italic">"{transcript}"</p>
        </motion.div>
      )}
    </div>
  );
};
