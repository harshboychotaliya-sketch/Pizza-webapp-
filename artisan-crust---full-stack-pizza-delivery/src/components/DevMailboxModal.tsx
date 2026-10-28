import React, { useState, useEffect } from 'react';
import { X, Mail, RefreshCw, CheckCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { authApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface DevMailboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevMailboxModal: React.FC<DevMailboxModalProps> = ({ isOpen, onClose }) => {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const navigate = useNavigate();

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const data = await authApi.getDevMailbox();
      if (data.success) {
        setEmails(data.emails || []);
        if (data.emails?.length > 0 && !selectedEmail) {
          setSelectedEmail(data.emails[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load mailbox logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmails();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const extractVerificationToken = (content: string) => {
    const match = content.match(/token=([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#FAF7F2] rounded-xl border border-[#EFEAE4] shadow-2xl w-full max-w-4xl h-[650px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-[#242424] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#E06A26]" />
            <h3 className="font-display font-semibold text-lg">Development Mailbox & Alert Inspector</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchEmails}
              disabled={loading}
              className="text-stone-300 hover:text-white p-1 rounded transition-colors"
              title="Refresh Mailbox"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-stone-300 hover:text-white p-1 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice */}
        <div className="bg-[#F4EFEB] px-6 py-2.5 border-b border-[#EFEAE4] text-xs text-stone-600 flex items-center justify-between">
          <span>Inspect real emails dispatched via Nodemailer or simulated in dev mode without needing external SMTP configuration.</span>
          <span className="font-mono-data font-semibold text-stone-800">{emails.length} message(s)</span>
        </div>

        {/* Body Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Email List Left */}
          <div className="w-1/3 border-r border-[#EFEAE4] overflow-y-auto bg-white">
            {emails.length === 0 ? (
              <div className="p-8 text-center text-stone-400 text-xs">
                No emails sent yet. Try registering an account, requesting a password reset, or triggering a low-stock check!
              </div>
            ) : (
              emails.map((m) => {
                const isSelected = selectedEmail?.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedEmail(m)}
                    className={`w-full text-left p-3.5 border-b border-[#EFEAE4] transition-colors ${
                      isSelected ? 'bg-[#FDF7F4] border-l-3 border-l-[#E23722]' : 'hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                      <span className="font-medium text-stone-800 truncate">{m.to}</span>
                      <span className="font-mono-data text-[10px]">
                        {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-stone-900 truncate">{m.subject}</div>
                    <div className="text-[11px] text-stone-500 mt-1 capitalize flex items-center gap-1">
                      {m.type === 'low_stock' && <AlertTriangle className="w-3 h-3 text-[#E23722]" />}
                      {m.type === 'verification' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                      <span>{m.type.replace('_', ' ')}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Email Preview Right */}
          <div className="flex-1 bg-stone-50 overflow-y-auto p-6 flex flex-col">
            {selectedEmail ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-[#EFEAE4] space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-stone-900 text-base">{selectedEmail.subject}</h4>
                    <span className="text-xs text-stone-500 font-mono-data">
                      {new Date(selectedEmail.sentAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-stone-600 flex items-center gap-4">
                    <span><strong>To:</strong> {selectedEmail.to}</span>
                    <span><strong>Type:</strong> {selectedEmail.type}</span>
                    <span><strong>Status:</strong> {selectedEmail.status}</span>
                  </div>

                  {/* Quick Action for Verification or Password Reset */}
                  {selectedEmail.type === 'verification' && (
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => {
                          const token = extractVerificationToken(selectedEmail.content);
                          if (token) {
                            onClose();
                            navigate(`/verify-email?token=${token}&email=${encodeURIComponent(selectedEmail.to)}`);
                          }
                        }}
                        className="px-3 py-1.5 bg-[#E23722] hover:bg-[#C02613] text-white text-xs font-semibold rounded-md flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Verification Page with this Token</span>
                      </button>
                    </div>
                  )}

                  {selectedEmail.type === 'password_reset' && (
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => {
                          const token = extractVerificationToken(selectedEmail.content);
                          if (token) {
                            onClose();
                            navigate(`/reset-password?token=${token}&email=${encodeURIComponent(selectedEmail.to)}`);
                          }
                        }}
                        className="px-3 py-1.5 bg-[#242424] hover:bg-black text-white text-xs font-semibold rounded-md flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Password Reset with this Token</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Email HTML rendering */}
                <div
                  className="bg-white p-6 rounded-lg border border-[#EFEAE4] shadow-xs"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.content }}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-stone-400 text-sm">
                Select an email from the left pane to preview its rendered HTML body.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
