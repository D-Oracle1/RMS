'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { usePusher } from './pusher-context';
import { getUser, getToken } from '@/lib/auth-storage';
import { api } from '@/lib/api';

export type CallStatus = 'idle' | 'ringing' | 'incoming' | 'connecting' | 'connected';

interface PeerInfo {
  id: string;
  name: string;
  avatar?: string;
}

interface CallContextValue {
  callStatus: CallStatus;
  callType: 'audio' | 'video';
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  peerInfo: PeerInfo | null;
  isMuted: boolean;
  isCameraOff: boolean;
  callDuration: number;
  initiateCall: (userId: string, type: 'audio' | 'video', userName: string, userAvatar?: string) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
}

const CallContext = createContext<CallContextValue | null>(null);

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { userChannel } = usePusher();
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerInfo, setPeerInfo] = useState<PeerInfo | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const incomingDataRef = useRef<{ callerId: string; callerName: string; callerAvatar?: string; callType: 'audio' | 'video' } | null>(null);

  const cleanup = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus('idle');
    setPeerInfo(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setCallDuration(0);
    pendingCandidatesRef.current = [];
    incomingDataRef.current = null;
  }, []);

  const createPeerConnection = useCallback((targetUserId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate via HTTP to backend
        api.post('/call/ice-candidate', {
          targetUserId,
          candidate: event.candidate.toJSON(),
        }).catch(() => {});
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (stream) {
        setRemoteStream(stream);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'connected') {
        setCallStatus('connected');
        setCallDuration(0);
        callTimerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      }
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        cleanup();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [cleanup]);

  const initiateCall = useCallback(async (userId: string, type: 'audio' | 'video', userName: string, userAvatar?: string) => {
    if (callStatus !== 'idle') return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setCallType(type);
      setCallStatus('ringing');
      setPeerInfo({ id: userId, name: userName, avatar: userAvatar });

      const currentUser = getUser();

      // Send call initiation via HTTP
      await api.post('/call/initiate', {
        targetUserId: userId,
        callType: type,
        callerName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Unknown',
        callerAvatar: currentUser?.avatar,
      });

      const pc = createPeerConnection(userId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer via HTTP
      await api.post('/call/offer', { targetUserId: userId, offer });
    } catch (error) {
      console.error('Failed to initiate call:', error);
      cleanup();
    }
  }, [callStatus, createPeerConnection, cleanup]);

  const acceptCall = useCallback(async () => {
    if (!incomingDataRef.current) return;

    const { callerId, callType: type } = incomingDataRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setCallType(type);
      setCallStatus('connecting');

      const currentUser = getUser();
      await api.post('/call/accept', {
        callerId,
        accepterName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Unknown',
      });

      const pc = createPeerConnection(callerId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Process any pending candidates
      for (const candidate of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidatesRef.current = [];
    } catch (error) {
      console.error('Failed to accept call:', error);
      cleanup();
    }
  }, [createPeerConnection, cleanup]);

  const rejectCall = useCallback(async () => {
    if (!incomingDataRef.current) return;
    await api.post('/call/reject', { callerId: incomingDataRef.current.callerId }).catch(() => {});
    cleanup();
  }, [cleanup]);

  const endCall = useCallback(async () => {
    if (peerInfo) {
      await api.post('/call/end', { peerId: peerInfo.id }).catch(() => {});
    }
    cleanup();
  }, [peerInfo, cleanup]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => !prev);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff((prev) => !prev);
    }
  }, []);

  // Listen for call events on the user's private Pusher channel
  useEffect(() => {
    if (!userChannel) return;

    const handleIncomingCall = (data: { callerId: string; callerName: string; callerAvatar?: string; callType: 'audio' | 'video' }) => {
      if (callStatus !== 'idle') {
        api.post('/call/reject', { callerId: data.callerId }).catch(() => {});
        return;
      }
      incomingDataRef.current = data;
      setPeerInfo({ id: data.callerId, name: data.callerName, avatar: data.callerAvatar });
      setCallType(data.callType);
      setCallStatus('incoming');
    };

    const handleCallAccepted = () => {
      setCallStatus('connecting');
    };

    const handleCallRejected = () => {
      cleanup();
    };

    const handleCallEnded = () => {
      cleanup();
    };

    const handleOffer = async (data: { callerId: string; offer: RTCSessionDescriptionInit }) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        await api.post('/call/answer', { targetUserId: data.callerId, answer });
      } catch (error) {
        console.error('Failed to handle offer:', error);
      }
    };

    const handleAnswer = async (data: { answererId: string; answer: RTCSessionDescriptionInit }) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      } catch (error) {
        console.error('Failed to handle answer:', error);
      }
    };

    const handleIceCandidate = async (data: { senderId: string; candidate: RTCIceCandidateInit }) => {
      if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.error('Failed to add ICE candidate:', error);
        }
      } else {
        pendingCandidatesRef.current.push(data.candidate);
      }
    };

    userChannel.bind('call:incoming', handleIncomingCall);
    userChannel.bind('call:accepted', handleCallAccepted);
    userChannel.bind('call:rejected', handleCallRejected);
    userChannel.bind('call:ended', handleCallEnded);
    userChannel.bind('call:offer', handleOffer);
    userChannel.bind('call:answer', handleAnswer);
    userChannel.bind('call:ice-candidate', handleIceCandidate);

    return () => {
      userChannel.unbind('call:incoming', handleIncomingCall);
      userChannel.unbind('call:accepted', handleCallAccepted);
      userChannel.unbind('call:rejected', handleCallRejected);
      userChannel.unbind('call:ended', handleCallEnded);
      userChannel.unbind('call:offer', handleOffer);
      userChannel.unbind('call:answer', handleAnswer);
      userChannel.unbind('call:ice-candidate', handleIceCandidate);
    };
  }, [userChannel, callStatus, cleanup]);

  return (
    <CallContext.Provider
      value={{
        callStatus,
        callType,
        localStream,
        remoteStream,
        peerInfo,
        isMuted,
        isCameraOff,
        callDuration,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) {
    throw new Error('useCall must be used within CallProvider');
  }
  return ctx;
}
