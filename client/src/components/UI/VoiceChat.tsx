import { useState, useEffect, useRef, useCallback } from 'react';
import Daily, { DailyCall, DailyParticipant } from '@daily-co/daily-js';

interface VoiceChatProps {
  roomUrl: string | null;
  playerName: string;
}

interface ParticipantInfo {
  sessionId: string;
  userName: string;
  audio: boolean;
  local: boolean;
}

export default function VoiceChat({ roomUrl, playerName }: VoiceChatProps) {
  const [callFrame, setCallFrame] = useState<DailyCall | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const callFrameRef = useRef<DailyCall | null>(null);

  const updateParticipants = useCallback((daily: DailyCall) => {
    const parts = daily.participants();
    const mapped: ParticipantInfo[] = Object.values(parts).map((p: DailyParticipant) => ({
      sessionId: p.session_id,
      userName: p.user_name || 'Jugador',
      audio: !!p.tracks?.audio?.state && p.tracks.audio.state === 'playable',
      local: p.local,
    }));
    setParticipants(mapped);
  }, []);

  const joinVoice = useCallback(async () => {
    if (!roomUrl || callFrameRef.current) return;

    try {
      const daily = Daily.createCallObject({
        audioSource: true,
        videoSource: false,
        userName: playerName,
      });

      callFrameRef.current = daily;
      setCallFrame(daily);

      daily.on('joined-meeting', () => {
        setIsConnected(true);
        daily.setLocalAudio(false); // start muted
        updateParticipants(daily);
      });

      daily.on('participant-joined', () => updateParticipants(daily));
      daily.on('participant-updated', () => updateParticipants(daily));
      daily.on('participant-left', () => updateParticipants(daily));

      daily.on('left-meeting', () => {
        setIsConnected(false);
        setParticipants([]);
      });

      daily.on('error', (err) => {
        console.error('[VoiceChat] Daily error:', err);
      });

      await daily.join({ url: roomUrl });
      setHasPermission(true);
    } catch (err) {
      console.error('[VoiceChat] Failed to join:', err);
      setHasPermission(false);
    }
  }, [roomUrl, playerName, updateParticipants]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.leave().catch(() => {});
        callFrameRef.current.destroy();
        callFrameRef.current = null;
      }
    };
  }, []);

  const toggleMute = useCallback(() => {
    if (callFrameRef.current) {
      const newMuted = !isMuted;
      callFrameRef.current.setLocalAudio(!newMuted);
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  const leaveVoice = useCallback(() => {
    if (callFrameRef.current) {
      callFrameRef.current.leave().catch(() => {});
      callFrameRef.current.destroy();
      callFrameRef.current = null;
      setCallFrame(null);
      setIsConnected(false);
      setParticipants([]);
      setIsMuted(true);
    }
  }, []);

  // Don't render if no room URL
  if (!roomUrl) return null;

  // Permission prompt (shown before joining)
  if (!isConnected && hasPermission === null) {
    return (
      <>
        {/* Desktop: small widget */}
        <div className="hidden md:block fixed bottom-4 left-4 z-40">
          <button
            onClick={() => setShowPermissionPrompt(true)}
            className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 hover:text-white hover:border-green-600 transition-colors flex items-center gap-2"
          >
            <span>🎙️</span>
            <span>Unirse al chat de voz</span>
          </button>
        </div>

        {/* Mobile: FAB */}
        <button
          onClick={() => setShowPermissionPrompt(true)}
          className="md:hidden fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-xl shadow-lg"
        >
          🎙️
        </button>

        {/* Permission modal */}
        {showPermissionPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowPermissionPrompt(false)}>
            <div className="bg-gray-800 rounded-xl p-5 max-w-sm w-full mx-4 shadow-2xl border border-gray-600" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <span>🎙️</span> Chat de voz
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                Para hablar con los otros jugadores, permite el acceso al microfono cuando te lo pida el navegador.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPermissionPrompt(false);
                    joinVoice();
                  }}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors"
                >
                  Unirme
                </button>
                <button
                  onClick={() => {
                    setShowPermissionPrompt(false);
                    setHasPermission(false);
                  }}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                >
                  Sin voz
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // User declined voice chat
  if (hasPermission === false) return null;

  // Connected state
  return (
    <>
      {/* ── Desktop panel (bottom-left widget) ── */}
      <div className="hidden md:block fixed bottom-4 left-4 z-40">
        <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg shadow-xl overflow-hidden w-52">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`} />
              <span className="text-xs text-gray-300">
                {isConnected ? 'Chat de voz' : 'Conectando...'}
              </span>
            </div>
            <button onClick={leaveVoice} className="text-xs text-gray-500 hover:text-red-400" title="Salir del chat de voz">
              ✕
            </button>
          </div>

          {/* Participants */}
          <div className="px-3 py-2 space-y-1 max-h-32 overflow-y-auto">
            {participants.map((p) => (
              <div key={p.sessionId} className="flex items-center gap-2 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full ${p.audio ? 'bg-green-400' : 'bg-gray-600'}`} />
                <span className={`truncate ${p.audio ? 'text-green-300' : 'text-gray-400'}`}>
                  {p.userName}{p.local ? ' (tu)' : ''}
                </span>
              </div>
            ))}
          </div>

          {/* Mute button */}
          <div className="px-3 py-2 border-t border-gray-700">
            <button
              onClick={toggleMute}
              className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                isMuted
                  ? 'bg-red-900/50 text-red-300 hover:bg-red-800/50 border border-red-800/50'
                  : 'bg-green-900/50 text-green-300 hover:bg-green-800/50 border border-green-800/50'
              }`}
            >
              {isMuted ? '🔇 Mic apagado' : '🎤 Mic encendido'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile FAB ── */}
      <button
        onClick={toggleMute}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowPanel(!showPanel);
        }}
        className={`md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg border-2 transition-colors ${
          isMuted
            ? 'bg-red-700 border-red-500'
            : 'bg-green-600 border-green-400 animate-pulse'
        }`}
      >
        {isMuted ? '🔇' : '🎤'}
      </button>

      {/* Mobile participant panel (toggle via long press on FAB) */}
      {showPanel && (
        <div className="md:hidden fixed bottom-36 right-4 z-40 bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-xl p-3 w-48 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-300">Chat de voz</span>
            <button onClick={() => setShowPanel(false)} className="text-gray-500 text-xs">✕</button>
          </div>
          <div className="space-y-1.5">
            {participants.map((p) => (
              <div key={p.sessionId} className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${p.audio ? 'bg-green-400' : 'bg-gray-600'}`} />
                <span className={p.audio ? 'text-green-300' : 'text-gray-400'}>
                  {p.userName}{p.local ? ' (tu)' : ''}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={leaveVoice}
            className="mt-2 w-full py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-400 text-xs rounded-lg"
          >
            Salir del chat de voz
          </button>
        </div>
      )}
    </>
  );
}
