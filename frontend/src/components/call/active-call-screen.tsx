'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, VideoIcon, VideoOff, PhoneOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useCall } from '@/contexts/call-context';
import { getImageUrl } from '@/lib/api';

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function ActiveCallScreen() {
  const {
    callStatus,
    callType,
    localStream,
    remoteStream,
    peerInfo,
    isMuted,
    isCameraOff,
    callDuration,
    endCall,
    toggleMute,
    toggleCamera,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const isActive = callStatus === 'connecting' || callStatus === 'connected' || callStatus === 'ringing';
  if (!isActive || !peerInfo) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center"
    >
      {/* Call container: fullscreen on mobile, centered window on desktop */}
      <div className="w-full h-full md:w-[640px] md:h-[480px] lg:w-[800px] lg:h-[560px] md:rounded-2xl overflow-hidden bg-gray-950 flex flex-col shadow-2xl md:border border-white/10">
        {/* Main video / avatar area */}
        <div className="flex-1 relative flex items-center justify-center min-h-0">
          {callType === 'video' && remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain bg-black"
            />
          ) : (
            <div className="text-center">
              <Avatar className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-4 md:mb-6">
                {peerInfo.avatar && <AvatarImage src={getImageUrl(peerInfo.avatar)} />}
                <AvatarFallback className="bg-primary text-white text-3xl md:text-4xl">
                  {peerInfo.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">{peerInfo.name}</h2>
              <p className="text-gray-400">
                {callStatus === 'ringing' && 'Ringing...'}
                {callStatus === 'connecting' && 'Connecting...'}
                {callStatus === 'connected' && formatDuration(callDuration)}
              </p>
            </div>
          )}

          {/* Local video PiP */}
          {callType === 'video' && localStream && (
            <div className="absolute top-3 right-3 w-28 h-40 md:w-40 md:h-52 rounded-xl overflow-hidden shadow-lg border-2 border-white/20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
                style={{ transform: 'scaleX(-1)' }}
              />
              {isCameraOff && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <VideoOff className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
          )}

          {/* Call status overlay for video calls */}
          {callType === 'video' && callStatus === 'connected' && (
            <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-sm">
              {formatDuration(callDuration)}
            </div>
          )}

          {/* Peer name overlay for video calls */}
          {callType === 'video' && (
            <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white text-sm">
              {peerInfo.name}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 md:p-5 bg-gray-900/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={toggleMute}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-full ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
              size="icon"
            >
              {isMuted ? <MicOff className="w-5 h-5 md:w-6 md:h-6" /> : <Mic className="w-5 h-5 md:w-6 md:h-6" />}
            </Button>

            {callType === 'video' && (
              <Button
                onClick={toggleCamera}
                className={`w-12 h-12 md:w-14 md:h-14 rounded-full ${isCameraOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'} text-white`}
                size="icon"
              >
                {isCameraOff ? <VideoOff className="w-5 h-5 md:w-6 md:h-6" /> : <VideoIcon className="w-5 h-5 md:w-6 md:h-6" />}
              </Button>
            )}

            <Button
              onClick={endCall}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-500 hover:bg-red-600 text-white"
              size="icon"
            >
              <PhoneOff className="w-5 h-5 md:w-6 md:h-6" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
