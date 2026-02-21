'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { usePusher } from './pusher-context';
import { getUser } from '@/lib/auth-storage';
import { api } from '@/lib/api';

const log = (...args: any[]) => console.log('[Call]', ...args);

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
    // TURN servers for NAT traversal behind firewalls
    { urls: 'turn:a.relay.metered.ca:80', username: 'e7e3e6c4e5c7e2a3b1d0f4a6', credential: 'open' },
    { urls: 'turn:a.relay.metered.ca:443', username: 'e7e3e6c4e5c7e2a3b1d0f4a6', credential: 'open' },
    { urls: 'turn:a.relay.metered.ca:443?transport=tcp', username: 'e7e3e6c4e5c7e2a3b1d0f4a6', credential: 'open' },
  ],
};

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { subscribeToUserEvent, unsubscribeFromUserEvent } = usePusher();
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
  const pendingOfferRef = useRef<{ callerId: string; offer: RTCSessionDescriptionInit } | null>(null);
  const incomingDataRef = useRef<{ callerId: string; callerName: string; callerAvatar?: string; callType: 'audio' | 'video' } | null>(null);
  const callStatusRef = useRef<CallStatus>('idle');

  const cleanup = useCallback(() => {
    log('Cleaning up call');
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
    callStatusRef.current = 'idle';
    setPeerInfo(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setCallDuration(0);
    pendingCandidatesRef.current = [];
    pendingOfferRef.current = null;
    incomingDataRef.current = null;
  }, []);

  const createPeerConnection = useCallback((targetUserId: string) => {
    log('Creating peer connection for', targetUserId);
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        api.post('/call/ice-candidate', {
          targetUserId,
          candidate: event.candidate.toJSON(),
        }).catch(() => {});
      }
    };

    pc.ontrack = (event) => {
      log('Remote track received');
      const stream = event.streams[0];
      if (stream) {
        setRemoteStream(stream);
      }
    };

    pc.oniceconnectionstatechange = () => {
      log('ICE state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected') {
        setCallStatus('connected');
        callStatusRef.current = 'connected';
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
    if (callStatusRef.current !== 'idle') return;
    log('Initiating', type, 'call to', userName);

    try {
      const currentUser = getUser();

      // Signal the callee IMMEDIATELY so their phone starts ringing right away
      setCallType(type);
      setCallStatus('ringing');
      callStatusRef.current = 'ringing';
      setPeerInfo({ id: userId, name: userName, avatar: userAvatar });

      await api.post('/call/initiate', {
        targetUserId: userId,
        callType: type,
        callerName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Unknown',
        callerAvatar: currentUser?.avatar,
      });

      // Get local media AFTER signalling (callee is already ringing while we set up)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      localStreamRef.current = stream;
      setLocalStream(stream);

      // Abort if call was cancelled while waiting for media permission
      if ((callStatusRef.current as string) === 'idle') {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      const pc = createPeerConnection(userId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      log('Sending offer');
      await api.post('/call/offer', { targetUserId: userId, offer });
    } catch (error) {
      console.error('[Call] Failed to initiate call:', error);
      cleanup();
    }
  }, [createPeerConnection, cleanup]);

  const acceptCall = useCallback(async () => {
    if (!incomingDataRef.current) return;

    const { callerId, callType: type } = incomingDataRef.current;
    log('Accepting call from', callerId);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setCallType(type);
      setCallStatus('connecting');
      callStatusRef.current = 'connecting';

      const currentUser = getUser();
      await api.post('/call/accept', {
        callerId,
        accepterName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Unknown',
      });

      const pc = createPeerConnection(callerId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Process the cached offer FIRST (must set remote description before adding ICE candidates)
      if (pendingOfferRef.current) {
        log('Processing cached offer');
        const { callerId: offerCallerId, offer } = pendingOfferRef.current;
        pendingOfferRef.current = null;
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Now process cached ICE candidates (remote description is set)
        log('Processing', pendingCandidatesRef.current.length, 'cached ICE candidates');
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        pendingCandidatesRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        log('Sending answer');
        await api.post('/call/answer', { targetUserId: offerCallerId, answer });
      }
    } catch (error) {
      console.error('[Call] Failed to accept call:', error);
      cleanup();
    }
  }, [createPeerConnection, cleanup]);

  const rejectCall = useCallback(async () => {
    if (!incomingDataRef.current) return;
    log('Rejecting call');
    await api.post('/call/reject', { callerId: incomingDataRef.current.callerId }).catch(() => {});
    cleanup();
  }, [cleanup]);

  const endCall = useCallback(async () => {
    log('Ending call');
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

  // Listen for call events on the user's channel
  useEffect(() => {
    const handleIncomingCall = (data: { callerId: string; callerName: string; callerAvatar?: string; callType: 'audio' | 'video' }) => {
      log('Incoming call from', data.callerName, data.callType);
      if (callStatusRef.current !== 'idle') {
        api.post('/call/reject', { callerId: data.callerId }).catch(() => {});
        return;
      }
      incomingDataRef.current = data;
      setPeerInfo({ id: data.callerId, name: data.callerName, avatar: data.callerAvatar });
      setCallType(data.callType);
      setCallStatus('incoming');
      callStatusRef.current = 'incoming';
    };

    const handleCallAccepted = () => {
      log('Call accepted by peer');
      setCallStatus('connecting');
      callStatusRef.current = 'connecting';
    };

    const handleCallRejected = () => {
      log('Call rejected by peer');
      cleanup();
    };

    const handleCallEnded = () => {
      log('Call ended by peer');
      cleanup();
    };

    const handleOffer = async (data: { callerId: string; offer: RTCSessionDescriptionInit }) => {
      log('Received offer from', data.callerId);
      // If peer connection doesn't exist yet (callee hasn't accepted), cache the offer
      if (!peerConnectionRef.current) {
        log('No peer connection yet, caching offer');
        pendingOfferRef.current = data;
        return;
      }
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        log('Sending answer');
        await api.post('/call/answer', { targetUserId: data.callerId, answer });
      } catch (error) {
        console.error('[Call] Failed to handle offer:', error);
      }
    };

    const handleAnswer = async (data: { answererId: string; answer: RTCSessionDescriptionInit }) => {
      log('Received answer from', data.answererId);
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
        // Flush any ICE candidates that arrived before remote description was set
        if (pendingCandidatesRef.current.length > 0) {
          log('Flushing', pendingCandidatesRef.current.length, 'pending ICE candidates after answer');
          for (const candidate of pendingCandidatesRef.current) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
          pendingCandidatesRef.current = [];
        }
      } catch (error) {
        console.error('[Call] Failed to handle answer:', error);
      }
    };

    const handleIceCandidate = async (data: { senderId: string; candidate: RTCIceCandidateInit }) => {
      if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.error('[Call] Failed to add ICE candidate:', error);
        }
      } else {
        pendingCandidatesRef.current.push(data.candidate);
      }
    };

    subscribeToUserEvent('call:incoming', handleIncomingCall);
    subscribeToUserEvent('call:accepted', handleCallAccepted);
    subscribeToUserEvent('call:rejected', handleCallRejected);
    subscribeToUserEvent('call:ended', handleCallEnded);
    subscribeToUserEvent('call:offer', handleOffer);
    subscribeToUserEvent('call:answer', handleAnswer);
    subscribeToUserEvent('call:ice-candidate', handleIceCandidate);

    return () => {
      unsubscribeFromUserEvent('call:incoming', handleIncomingCall);
      unsubscribeFromUserEvent('call:accepted', handleCallAccepted);
      unsubscribeFromUserEvent('call:rejected', handleCallRejected);
      unsubscribeFromUserEvent('call:ended', handleCallEnded);
      unsubscribeFromUserEvent('call:offer', handleOffer);
      unsubscribeFromUserEvent('call:answer', handleAnswer);
      unsubscribeFromUserEvent('call:ice-candidate', handleIceCandidate);
    };
  }, [subscribeToUserEvent, unsubscribeFromUserEvent, cleanup]);

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
