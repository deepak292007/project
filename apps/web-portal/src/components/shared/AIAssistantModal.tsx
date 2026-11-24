import { getBaseUrl } from '../../lib/api';
import React, { useState, useRef, useEffect } from 'react';
import { useSession } from '../../store';
import { speak, isSupported } from '../../lib/voice';
import type { Lang } from '../../types';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  sender: 'user' | 'agent';
  text: string;
  time: string;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ isOpen, onClose }) => {
  const { lang, name, role } = useSession();
  const currentLang = (['en', 'hi', 'mr', 'te', 'kn'].includes(lang) ? lang : 'en') as Lang;

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Suggested prompts per language
  const PROMPTS: Record<Lang, string[]> = {
    te: [
      'నాకు జ్వరం మరియు తలనొప్పి ఉంది, నేను ఏం చేయాలి?',
      'OP టోకెన్ ఎలా బుక్ చేసుకోవాలి?',
      'ఆశా మందుల కిట్ ఎలా అభ్యర్థించాలి?',
      'సమీపంలో ఉన్న అత్యవసర ఆసుపత్రులు ఏవి?'
    ],
    kn: [
      'ನನಗೆ ಜ್ವರ ಮತ್ತು ತಲೆನೋವಿದೆ, ನಾನು ಏನು ಮಾಡಬೇಕು?',
      'OP ಟೋಕನ್ ಬುಕ್ ಮಾಡುವುದು ಹೇಗೆ?',
      'ಆಶಾ ಔಷಧಿಯ ಕಿಟ್ ಪಡೆಯುವುದು ಹೇಗೆ?',
      'ಹತ್ತಿರದ ತುರ್ತು ಆಸ್ಪತ್ರೆಗಳು ಯಾವುವು?'
    ],
    mr: [
      'मला ताप आणि अंगदुखी आहे, मी काय करावे?',
      'ओपीडी टोकन कसे बुक करावे?',
      'आशा औषध किट कशी मिळवायची?',
      'जवळचे २४x७ रुग्णालय कोणते आहे?'
    ],
    hi: [
      'मुझे बुखार और सिरदर्द है, मुझे क्या करना चाहिए?',
      'ओपीडी टोकन कैसे बुक करें?',
      'आशा दवा किट कैसे प्राप्त करें?',
      'नजदीकी आपातकालीन अस्पताल कौन सा है?'
    ],
    en: [
      'I have a fever and headache, what should I do?',
      'How do I book an OPD token?',
      'How to request an ASHA home medicine kit?',
      'Find 24x7 emergency hospital with ICU'
    ]
  };

  const initialGreeting: Record<Lang, string> = {
    te: `నమస్కారం ${name || ''}! నేను ఆరోగ్యలింక్ AI హెల్త్ అసిస్టెంట్‌ని. మీ ఆరోగ్య లక్షణాలు, సమీప ఆసుపత్రులు, OP టోకెన్లు లేదా ఉచిత ఆశా మందుల కిట్ గురించి ఏదైనా అడగండి.`,
    kn: `ನಮಸ್ಕಾರ ${name || ''}! ನಾನು ಆರೋಗ್ಯಲಿಂಕ್ AI ಆರೋಗ್ಯ ಸಹಾಯಕ. ನಿಮ್ಮ ಲಕ್ಷಣಗಳು, ಆಸ್ಪತ್ರೆಗಳು ಅಥವಾ OP ಟೋಕನ್‌ಗಳ ಬಗ್ಗೆ ಕೇಳಿ.`,
    mr: `नमस्कार ${name || ''}! मी आरोग्यलिंक AI सहाय्यक आहे. लक्षणे, जवळचे रुग्णालय किंवा ओपीडी टोकनबद्दल काहीही विचारा.`,
    hi: `नमस्ते ${name || ''}! मैं आरोग्यलिंक AI स्वास्थ्य सहायक हूँ। आप मुझसे लक्षण, अस्पताल या ओपीडी टोकन के बारे में पूछ सकते हैं।`,
    en: `Hello ${name || ''}! I am ArogyaLink AI Health Assistant. Ask me about your symptoms, finding hospitals, OP tokens, or medicine kits.`
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          sender: 'agent',
          text: initialGreeting[currentLang] || initialGreeting.en,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [isOpen, currentLang]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(textToSend?: string) {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${getBaseUrl()}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          lang: currentLang,
          role,
          patientName: name
        })
      }).then(r => r.json());

      const reply = res?.data?.reply || 'Health advice generated. Please consult your nearest PHC.';
      const agentMsg: Message = {
        sender: 'agent',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, agentMsg]);
      // Speak out agent response in chosen language
      if (isSupported()) {
        speak(reply, currentLang);
      }
    } catch {
      const fallbackReply = currentLang === 'te'
        ? 'నమస్కారం, దయచేసి సమీపంలోని ప్రాథమిక ఆరోగ్య కేంద్రాన్ని (PHC) సంప్రదించండి.'
        : 'Please visit your nearest Primary Health Centre (PHC) for doctor consultation.';
      setMessages(prev => [...prev, {
        sender: 'agent',
        text: fallbackReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(13, 59, 53, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: 16
    }}>
      <div className="card" style={{
        maxWidth: 560,
        width: '100%',
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
        borderRadius: 12,
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'var(--col-teal-dark)',
          color: '#ffffff',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.4rem' }}>🤖</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>
                {currentLang === 'te' ? 'ఆరోగ్యలింక్ AI హెల్త్ అసిస్టెంట్' : currentLang === 'kn' ? 'ಆರೋಗ್ಯಲಿಂಕ್ AI ಸಹಾಯಕ' : currentLang === 'mr' ? 'आरोग्यलिंक AI सहाय्यक' : 'ArogyaLink AI Health Assistant'}
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.85, color: '#e0f2fe' }}>
                Multilingual CDS (Inkling Small · Nemotron Engine)
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '1.25rem', cursor: 'pointer', padding: 4 }}
          >
            ✕
          </button>
        </div>

        {/* Chat message feed */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          background: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: m.sender === 'user' ? 'var(--col-teal)' : '#ffffff',
                color: m.sender === 'user' ? '#ffffff' : 'var(--col-ink)',
                padding: '10px 14px',
                borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: m.sender === 'user' ? 'none' : '1px solid var(--col-border)'
              }}
            >
              <div style={{ fontSize: '0.875rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {m.text}
              </div>
              <div style={{
                fontSize: '0.6875rem',
                opacity: 0.75,
                marginTop: 4,
                textAlign: m.sender === 'user' ? 'right' : 'left'
              }}>
                {m.time}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{
              alignSelf: 'flex-start',
              background: '#ffffff',
              padding: '10px 14px',
              borderRadius: '14px 14px 14px 2px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid var(--col-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.8125rem',
              color: 'var(--col-ink-muted)'
            }}>
              <span className="animate-spin">⏳</span> AI is formulating localized clinical guidance…
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div style={{
          padding: '8px 12px',
          background: '#f1f5f9',
          borderTop: '1px solid var(--col-border)',
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          {(PROMPTS[currentLang] || PROMPTS.en).map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="btn btn-ghost btn-sm"
              style={{
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: 14,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                flexShrink: 0
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={e => { e.preventDefault(); handleSend(); }}
          style={{
            padding: '12px',
            background: '#ffffff',
            borderTop: '1px solid var(--col-border)',
            display: 'flex',
            gap: 8
          }}
        >
          <input
            type="text"
            className="form-control"
            placeholder={currentLang === 'te' ? 'మీ ప్రశ్నను ఇక్కడ టైప్ చేయండి…' : currentLang === 'kn' ? 'ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ…' : 'Ask about symptoms, OP tokens, medicines…'}
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            style={{ flex: 1, fontSize: '0.875rem' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="btn btn-primary"
            style={{ padding: '0 18px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ➔
          </button>
        </form>
      </div>
    </div>
  );
};
